import fs from "node:fs";
import path from "node:path";
import {
  examKey as sourceExamKey,
  normalizeBodyText,
} from "./pdf_source_manifest.mjs";

function usage() {
  console.error("Usage: node scripts/build_hybrid_answer_bank.mjs OLD_ANSWERS.json NEW_ANSWERS.json OUTPUT.json");
  process.exit(1);
}

const [oldPath, newPath, outputPath] = process.argv.slice(2);
if (!oldPath || !newPath || !outputPath) usage();

const oldPayload = JSON.parse(fs.readFileSync(oldPath, "utf8"));
const newPayload = JSON.parse(fs.readFileSync(newPath, "utf8"));
const oldQuestions = Array.isArray(oldPayload.questions) ? oldPayload.questions : [];
const newQuestions = Array.isArray(newPayload.questions) ? newPayload.questions : [];

function answerEntryKey(question) {
  const title = question.ocr?.answerExamTitle || question.ocr?.examTitle || question.stem || "";
  const number = question.ocr?.questionNumber || inferQuestionNumber(question);
  const key = sourceExamKey(title);
  return key && number ? `${key}::${number}` : "";
}

function inferQuestionNumber(question) {
  const text = [question.stem, question.sourceRef, question.lesson?.title].filter(Boolean).join(" ");
  const match = text.match(/第\s*(\d{1,3})\s*题/u);
  return match ? Number(match[1]) : 0;
}

function reviewReasons(question) {
  return question.ocr?.reviewReasons || [];
}

function hasHighRiskAnswer(question) {
  const answer = String(question.answer || "");
  return /[FGH]/u.test(answer) || reviewReasons(question).some((reason) => /非常规选项字母|已规范为/u.test(reason));
}

function riskScore(question) {
  let score = 0;
  const reasons = reviewReasons(question);
  if (hasHighRiskAnswer(question)) score += 100;
  if (reasons.some((reason) => /疑似 OCR 噪声/u.test(reason))) score += 30;
  if (reasons.some((reason) => /题干或解析不完整/u.test(reason))) score += 25;
  if (reasons.some((reason) => /OCR 置信度偏低/u.test(reason))) score += 8;
  if (question.ocr?.requiresReview) score += 1;
  score -= Math.min(20, String(question.explanation || "").length / 250);
  return score;
}

function indexByKey(questions) {
  const index = new Map();
  questions.forEach((question, questionIndex) => {
    const key = answerEntryKey(question);
    if (!key) return;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({ question, questionIndex });
  });
  return index;
}

function bestCandidate(candidates = []) {
  return [...candidates].sort((left, right) => {
    const riskDelta = riskScore(left.question) - riskScore(right.question);
    if (riskDelta) return riskDelta;
    return left.questionIndex - right.questionIndex;
  })[0];
}

const newIndex = indexByKey(newQuestions);
const usedNew = new Set();
const hybridQuestions = [];
let replacedWithNew = 0;
let keptOld = 0;
let addedNew = 0;

oldQuestions.forEach((oldQuestion) => {
  const key = answerEntryKey(oldQuestion);
  const candidates = (newIndex.get(key) || []).filter((candidate) => !usedNew.has(candidate.questionIndex));
  const newCandidate = bestCandidate(candidates);

  if (
    newCandidate
    && String(newCandidate.question.answer || "") === String(oldQuestion.answer || "")
    && !hasHighRiskAnswer(newCandidate.question)
    && riskScore(newCandidate.question) < riskScore(oldQuestion)
  ) {
    hybridQuestions.push(newCandidate.question);
    usedNew.add(newCandidate.questionIndex);
    replacedWithNew += 1;
    return;
  }

  hybridQuestions.push(oldQuestion);
  keptOld += 1;
});

newQuestions.forEach((newQuestion, questionIndex) => {
  if (usedNew.has(questionIndex)) return;
  const key = answerEntryKey(newQuestion);
  if (!key) return;
  if (oldQuestions.some((oldQuestion) => answerEntryKey(oldQuestion) === key)) return;
  if (hasHighRiskAnswer(newQuestion)) return;
  hybridQuestions.push(newQuestion);
  addedNew += 1;
});

const payload = {
  ...oldPayload,
  sourceType: "hybrid-vision-ocr-answer-pages",
  generatedAt: new Date().toISOString(),
  ocr: {
    ...(oldPayload.ocr || {}),
    oldAnswerCount: oldQuestions.length,
    newAnswerCount: newQuestions.length,
    hybridAnswerCount: hybridQuestions.length,
    replacedWithNew,
    keptOld,
    addedNew,
    answerOcrPagesJsonl: oldPayload.ocr?.answerOcrPagesJsonl || oldPayload.ocr?.rawPagesJsonl || null,
    answerOcr3xPagesJsonl: newPayload.ocr?.answerOcr3xPagesJsonl || newPayload.ocr?.rawPagesJsonl || null,
    hybridAnswerStrategy: "keep old answer OCR unless 3x OCR has the same answer and lower risk; add 3x-only answers only when they do not contain high-risk answer letters",
    hybridReplacedWith3x: replacedWithNew,
    hybridKeptOld: keptOld,
    hybridAddedFrom3x: addedNew,
    reviewQuestionCount: hybridQuestions.filter((question) => question.ocr?.requiresReview).length,
  },
  questions: hybridQuestions,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${hybridQuestions.length} hybrid answer questions to ${outputPath}`);
console.log(`Replaced ${replacedWithNew}, kept ${keptOld}, added ${addedNew}`);
console.log(`${payload.ocr.reviewQuestionCount} answer questions require OCR review`);
