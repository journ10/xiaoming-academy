import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_QUESTION_OCR = "data/question-ocr-pages.jsonl";
const DEFAULT_ANSWER_BANK = "data/questions.from-pdf.json";
const DEFAULT_OUTPUT = "data/questions.from-pdf.json";
const QUESTION_PDF = "docs/09小明课堂 历年真题.pdf";
const ANSWER_PDF = "docs/10小明课堂 《历年真题答案》.pdf";
const OPTION_KEYS = "ABCDEFGH".split("");

const HEADER_PATTERNS = [
  /深圳.{0,8}教师.{0,6}考编.{0,8}培训/,
  /微信号/,
  /公众号/,
  /总部电话/,
  /机构电话/,
  /^页\s*\d+/,
];

export function parseQuestionPages(pages = []) {
  const entries = [];
  let currentExam = "";
  let currentSection = "";
  let currentEntry = null;

  function finishEntry() {
    if (!currentEntry) return;
    const parsed = parseQuestionBody(currentEntry.lines, currentSection);
    if (parsed.stem) {
      entries.push({
        examTitle: currentEntry.examTitle,
        examKey: examKey(currentEntry.examTitle),
        section: currentEntry.section,
        questionNumber: currentEntry.questionNumber,
        page: currentEntry.page,
        stem: parsed.stem,
        options: parsed.options,
        requiresReview: parsed.requiresReview,
        reviewReasons: parsed.reviewReasons,
      });
    }
    currentEntry = null;
  }

  const sortedPages = [...pages].sort((left, right) => getPageNumber(left.image, 0) - getPageNumber(right.image, 0));
  sortedPages.forEach((page, pageIndex) => {
    const pageNumber = getPageNumber(page.image, pageIndex);
    const lines = getPageLines(page);

    lines.forEach((rawLine) => {
      const line = cleanLine(rawLine);
      if (!line) return;

      const examTitle = detectExamTitle(line);
      if (examTitle) {
        finishEntry();
        currentExam = examTitle;
        currentSection = "";
        return;
      }

      const section = detectSection(line);
      if (section) {
        finishEntry();
        currentSection = section;
        return;
      }

      const questionMatch = line.match(/^(\d{1,3})\s*[.．、]\s*(.*)$/u);
      if (questionMatch) {
        finishEntry();
        currentEntry = {
          examTitle: currentExam,
          section: currentSection,
          questionNumber: Number(questionMatch[1]),
          page: pageNumber,
          lines: [questionMatch[2]],
        };
        return;
      }

      if (currentEntry) {
        currentEntry.lines.push(line);
      }
    });
  });

  finishEntry();
  return entries.filter((entry) => entry.examTitle && entry.questionNumber);
}

export function mergeQuestionAndAnswerBanks(questionEntries = [], answerPayload = {}) {
  const answerQuestions = Array.isArray(answerPayload.questions) ? answerPayload.questions : [];
  const answerIndex = new Map();
  answerQuestions.forEach((answerQuestion, index) => {
    const key = answerEntryKey(answerQuestion);
    if (!key) return;
    if (!answerIndex.has(key)) answerIndex.set(key, []);
    answerIndex.get(key).push({ answerQuestion, index });
  });

  const usedAnswers = new Set();
  const merged = [];
  questionEntries.forEach((questionEntry) => {
    const key = `${questionEntry.examKey}::${questionEntry.questionNumber}`;
    const candidates = answerIndex.get(key) || [];
    const match = candidates.find((candidate) => !usedAnswers.has(candidate.index));
    if (!match) return;
    usedAnswers.add(match.index);

    const answerQuestion = match.answerQuestion;
    const reviewReasons = [
      ...(answerQuestion.ocr?.reviewReasons || []),
      ...(questionEntry.reviewReasons || []),
    ];
    let options = normalizeParsedOptions(questionEntry.options);
    const type = questionEntry.section || answerQuestion.type || "单项选择题";
    if (options.length < 2 && isJudgementType(type)) {
      options = [
        { key: "A", text: "正确" },
        { key: "B", text: "错误" },
      ];
    }

    const optionKeys = new Set(options.map((option) => option.key));
    for (const keyPart of String(answerQuestion.answer || "").split("")) {
      if (keyPart && !optionKeys.has(keyPart)) {
        options.push({ key: keyPart, text: "选项 OCR 待复核" });
        optionKeys.add(keyPart);
        reviewReasons.push(`答案 ${keyPart} 未在题目 OCR 选项中识别到`);
      }
    }
    options = sortOptions(options);
    if (options.length < 2) return;

    const sourceRef = `题目 PDF OCR 第 ${questionEntry.page} 页；${answerQuestion.sourceRef || "答案解析 OCR"}`;
    const lesson = answerQuestion.lesson || {};

    merged.push({
      ...answerQuestion,
      type,
      stem: normalizeBodyText(questionEntry.stem),
      options,
      sourceRef,
      lesson: {
        ...lesson,
        sourceRef,
      },
      ocr: {
        ...(answerQuestion.ocr || {}),
        examTitle: questionEntry.examTitle,
        answerExamTitle: answerQuestion.ocr?.examTitle || null,
        questionNumber: questionEntry.questionNumber,
        questionSourcePage: questionEntry.page,
        answerSourcePage: answerQuestion.ocr?.sourcePage || null,
        requiresReview: Boolean(answerQuestion.ocr?.requiresReview || questionEntry.requiresReview || reviewReasons.length),
        reviewReasons: [...new Set(reviewReasons)],
      },
    });
  });

  return merged;
}

export function buildQuestionBankPayload({ questionPages, answerPayload, generatedAt = new Date().toISOString() }) {
  const questionEntries = parseQuestionPages(questionPages);
  const questions = mergeQuestionAndAnswerBanks(questionEntries, answerPayload);
  const answerCount = Array.isArray(answerPayload.questions) ? answerPayload.questions.length : 0;

  return {
    source: {
      questionsPdf: QUESTION_PDF,
      answersPdf: ANSWER_PDF,
    },
    sourceType: "vision-ocr-question-answer-pages",
    generatedAt,
    notice:
      "题干和选项来自《历年真题》PDF 的 OCR；答案和解析来自《历年真题答案》PDF 的 OCR。少量 OCR 低置信度或答案选项未完全识别的条目标记在 ocr.requiresReview 中。",
    ocr: {
      questionPageCount: questionPages.length,
      parsedQuestionCount: questionEntries.length,
      answerQuestionCount: answerCount,
      mergedQuestionCount: questions.length,
      unmatchedQuestionCount: Math.max(0, questionEntries.length - questions.length),
      unmatchedAnswerCount: Math.max(0, answerCount - questions.length),
      reviewQuestionCount: questions.filter((question) => question.ocr?.requiresReview).length,
      questionPagesJsonl: DEFAULT_QUESTION_OCR,
      answerBankJson: DEFAULT_ANSWER_BANK,
    },
    questions,
  };
}

function parseQuestionBody(lines, section) {
  const stemParts = [];
  const options = [];
  let currentOption = null;
  let sawOption = false;

  lines.forEach((rawLine) => {
    const line = cleanLine(rawLine);
    if (!line) return;
    const segments = splitOptionSegments(line);
    if (!segments.length) {
      if (currentOption) currentOption.text = appendText(currentOption.text, line);
      else stemParts.push(line);
      return;
    }

    const prefix = segments[0].prefix;
    if (prefix) {
      if (currentOption) currentOption.text = appendText(currentOption.text, prefix);
      else stemParts.push(prefix);
    }

    segments.forEach((segment) => {
      sawOption = true;
      currentOption = {
        key: segment.key,
        text: segment.text,
      };
      options.push(currentOption);
    });
  });

  const normalizedOptions = normalizeParsedOptions(options);
  const reviewReasons = [];
  if (!sawOption && !isJudgementType(section)) reviewReasons.push("题目 OCR 未识别到选项");
  if (hasDuplicateOptionKeys(normalizedOptions)) reviewReasons.push("题目 OCR 识别到重复选项");

  return {
    stem: normalizeBodyText(stemParts.join("")),
    options: normalizedOptions,
    requiresReview: reviewReasons.length > 0,
    reviewReasons,
  };
}

function splitOptionSegments(line) {
  const optionPattern = /([A-H])\s*[.．、]\s*/g;
  const matches = [...line.matchAll(optionPattern)]
    .filter((match) => isLikelyOptionMarker(line, match.index));
  if (!matches.length) return [];

  return matches.map((match, index) => {
    const next = matches[index + 1];
    const rawPrefix = index === 0 ? line.slice(0, match.index) : "";
    return {
      key: match[1],
      prefix: cleanOptionPrefix(rawPrefix),
      text: normalizeBodyText(line.slice(match.index + match[0].length, next ? next.index : line.length)),
    };
  }).filter((segment) => segment.text || segment.prefix);
}

function isLikelyOptionMarker(line, index) {
  if (index === 0) return true;
  const before = line[index - 1];
  if (/[\s（(]/.test(before)) return true;
  return /[\u4e00-\u9fff\d）)]/.test(before);
}

function cleanOptionPrefix(text) {
  return normalizeBodyText(text.replace(/[（(]\s*$/u, ""));
}

function normalizeParsedOptions(options = []) {
  const byKey = new Map();
  options.forEach((option) => {
    const key = String(option.key || "").trim().toUpperCase();
    const text = normalizeBodyText(option.text || "");
    if (!OPTION_KEYS.includes(key) || !text) return;
    if (!byKey.has(key)) {
      byKey.set(key, { key, text });
    } else {
      byKey.get(key).text = appendText(byKey.get(key).text, text);
    }
  });
  return sortOptions([...byKey.values()]);
}

function sortOptions(options) {
  return [...options].sort((left, right) => OPTION_KEYS.indexOf(left.key) - OPTION_KEYS.indexOf(right.key));
}

function hasDuplicateOptionKeys(options = []) {
  return new Set(options.map((option) => option.key)).size !== options.length;
}

function answerEntryKey(question) {
  const title = question.ocr?.answerExamTitle || question.ocr?.examTitle || question.stem || "";
  const number = question.ocr?.questionNumber || inferQuestionNumber(question);
  const key = examKey(title);
  return key && number ? `${key}::${number}` : "";
}

function inferQuestionNumber(question) {
  const text = [question.stem, question.sourceRef, question.lesson?.title].filter(Boolean).join(" ");
  const match = text.match(/第\s*(\d{1,3})\s*题/u);
  return match ? Number(match[1]) : 0;
}

function examKey(title) {
  const normalized = normalizeBodyText(title);
  const dateMatch = normalized.match(/(20\d{2}|19\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/u);
  const levelMatch = normalized.match(/[（(](小学|初中|高中)[）)]/u) || normalized.match(/(小学|初中|高中)/u);
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}-${levelMatch?.[1] || ""}`;
  }
  const yearMatch = normalized.match(/(20\d{2}|19\d{2})/u);
  if (yearMatch) return `${yearMatch[1]}-${levelMatch?.[1] || normalized}`;
  return normalized;
}

function detectExamTitle(line) {
  const normalized = normalizeBodyText(line);
  return /(20\d{2}|19\d{2})\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日.{0,80}(考试|招聘|招考|真题)/u.test(normalized)
    ? normalized
    : "";
}

function detectSection(line) {
  const normalized = normalizeBodyText(line);
  if (/单项|单选|羊项|单顷/u.test(normalized)) return "单项选择题";
  if (/多项|多选|多顷/u.test(normalized)) return "多项选择题";
  if (/判断|是非/u.test(normalized)) return "判断题";
  if (/填空/u.test(normalized)) return "填空题";
  if (/简答/u.test(normalized)) return "简答题";
  if (/论述/u.test(normalized)) return "论述题";
  if (/案例/u.test(normalized)) return "案例分析题";
  return "";
}

function isJudgementType(type = "") {
  return /判断|是非/u.test(type);
}

function getPageLines(page) {
  if (Array.isArray(page.lines) && page.lines.length) {
    return page.lines.map((line) => line.text || "");
  }
  return String(page.text || "").split(/\n+/u);
}

function cleanLine(line) {
  const normalized = normalizeBodyText(line);
  if (!normalized) return "";
  if (HEADER_PATTERNS.some((pattern) => pattern.test(normalized))) return "";
  return normalized;
}

function normalizeBodyText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[　]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([，。；：？！、）》】])/gu, "$1")
    .replace(/([（《【])\s+/gu, "$1")
    .trim();
}

function appendText(left, right) {
  const first = normalizeBodyText(left);
  const second = normalizeBodyText(right);
  if (!first) return second;
  if (!second) return first;
  if (/[A-Za-z0-9]$/.test(first) && /^[A-Za-z0-9]/.test(second)) return `${first} ${second}`;
  return `${first}${second}`;
}

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\n+/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function getPageNumber(imagePath, fallback) {
  const match = String(imagePath || "").match(/page-(\d+)\.png$/u);
  return match ? Number(match[1]) : fallback + 1;
}

function main() {
  const questionOcrPath = process.argv[2] || DEFAULT_QUESTION_OCR;
  const answerBankPath = process.argv[3] || DEFAULT_ANSWER_BANK;
  const outputPath = process.argv[4] || DEFAULT_OUTPUT;
  const questionPages = readJsonl(questionOcrPath);
  const answerPayload = JSON.parse(fs.readFileSync(answerBankPath, "utf8"));
  const payload = buildQuestionBankPayload({ questionPages, answerPayload });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Parsed ${payload.ocr.parsedQuestionCount} original questions from ${questionOcrPath}`);
  console.log(`Merged ${payload.ocr.mergedQuestionCount}/${payload.ocr.answerQuestionCount} answer entries`);
  console.log(`${payload.ocr.reviewQuestionCount} merged questions require OCR review`);
  console.log(`Wrote ${outputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
