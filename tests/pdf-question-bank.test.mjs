import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildExamManifestFromQuestionPages,
  getTotalExpectedQuestionSlots,
} from "../scripts/pdf_source_manifest.mjs";
import {
  mergeQuestionAndAnswerBanks,
  parseQuestionPages,
} from "../scripts/build_questions_from_pdfs.mjs";

const sampleQuestionPage = {
  image: "/tmp/page-001.png",
  text: `深圳教师考编专业培训 微信号：19864272500
2013年1月12日深圳事业单位教师招聘考试（小学）
教育类小学真题
一、单项选择题（50题，每题1.0分，每题的备选答案中，只有一个最符合题意。）
1.由于特殊情况，父母或者其他法定监护人在非户籍所在地工作或者居住的适龄
儿童、少年，在其父母或者其他法定监护人工作或者居住地接受义务教育的，当地人
民政府应当（）。
A. 要求学生回到户籍所在地就近入学
B. 为其提供平等接受义务教育的条件
C. 为其提供受教育的保障
D. 暂时为其提供教育的平台
2. 教师资格制度是（）一种职业资格制度。
A. 教育行政部门实行的
B. 国家实行的
C. 地方政府实行的
D. 市级以上教育主管部门实行的`,
};

test("question PDF parser extracts original stems and options", () => {
  const questions = parseQuestionPages([sampleQuestionPage]);

  assert.equal(questions.length, 2);
  assert.equal(questions[0].questionNumber, 1);
  assert.match(questions[0].examTitle, /2013年1月12日/);
  assert.match(questions[0].stem, /由于特殊情况/);
  assert.equal(questions[0].options.find((option) => option.key === "B")?.text, "为其提供平等接受义务教育的条件");
});

test("question and answer banks merge by exam and question number", () => {
  const [question] = parseQuestionPages([sampleQuestionPage]);
  const merged = mergeQuestionAndAnswerBanks([question], {
    questions: [
      {
        id: "pdf-0001",
        year: "2013",
        type: "单项选择题",
        topic: "教育法规",
        stem: "2013年1月12日深圳事业单位教师招聘考试（小学）第 1 题参考答案是？",
        options: [
          { key: "A", text: "A" },
          { key: "B", text: "B" },
          { key: "C", text: "C" },
          { key: "D", text: "D" },
        ],
        answer: "B",
        explanation: "《义务教育法》第十二条规定，当地人民政府应当提供平等接受义务教育的条件。",
        sourceRef: "PDF OCR 第 1 页：第 1 题解析",
        difficulty: 1,
        lesson: {
          title: "教育法规 · 第 1 题解析",
          sourceRef: "PDF OCR 第 1 页：第 1 题解析",
          keyPoint: "教育法",
          studyPrompt: "练功目标：先核对 OCR 原文，再记住本题解析中的题眼。",
        },
        ocr: {
          examTitle: "2013年1月12日深圳事业单位教师招聘考试（小学）",
          sourcePage: 1,
          reviewReasons: [],
          requiresReview: false,
        },
      },
    ],
  });

  assert.equal(merged.length, 1);
  assert.match(merged[0].stem, /由于特殊情况/);
  assert.doesNotMatch(merged[0].stem, /参考答案是/);
  assert.equal(merged[0].options[1].text, "为其提供平等接受义务教育的条件");
  assert.equal(merged[0].answer, "B");
  assert.match(merged[0].explanation, /义务教育法/);
});

test("question PDF manifest exposes the real source question count", () => {
  const pages = readFileSync("data/question-ocr-pages.jsonl", "utf8")
    .trim()
    .split(/\n+/u)
    .map((line) => JSON.parse(line));

  const manifest = buildExamManifestFromQuestionPages(pages);

  assert.equal(manifest.length, 52);
  assert.equal(getTotalExpectedQuestionSlots(manifest), 4680);
  assert.ok(manifest.some((exam) =>
    exam.examKey === "2017-11-12-初中"
    && exam.startPage === 234
    && exam.expectedQuestionCount === 90,
  ));
  assert.ok(manifest.every((exam) => exam.expectedQuestionCount === 90));
});

test("built-in PDF bank uses original question stems and option texts", () => {
  const payload = JSON.parse(readFileSync("data/questions.from-pdf.json", "utf8"));
  const [first] = payload.questions;
  const placeholderQuestions = payload.questions.filter((question) =>
    /参考答案是[？?]$/.test(question.stem)
      || question.options.every((option) => String(option.key).trim() === String(option.text).trim()),
  );

  assert.equal(payload.sourceType, "hybrid-vision-ocr-question-answer-pages");
  assert.equal(payload.ocr.mergedQuestionCount, payload.questions.length);
  assert.ok(payload.questions.length >= 4290);
  assert.equal(payload.ocr.reviewQuestionCount, payload.questions.filter((question) => question.ocr?.requiresReview).length);
  assert.ok(payload.ocr.reviewQuestionCount <= payload.questions.length);
  assert.equal(payload.ocr.answerOcr3xPagesJsonl, "data/pdf-ocr-pages.3x.jsonl");
  assert.match(first.stem, /由于特殊情况/);
  assert.doesNotMatch(first.stem, /参考答案是/);
  assert.equal(first.options.find((option) => option.key === "B")?.text, "为其提供平等接受义务教育的条件");
  assert.equal(first.answer, "B");
  assert.equal(placeholderQuestions.length, 0);
});

test("built-in PDF bank keeps manually verified OCR corrections readable", () => {
  const payload = JSON.parse(readFileSync("data/questions.from-pdf.json", "utf8"));
  const payloadText = JSON.stringify(payload.questions);
  const findQuestion = (id, questionNumber) => payload.questions.find((question) =>
    question.id === id && question.ocr?.questionNumber === questionNumber,
  );
  const q68 = findQuestion("pdf-0068", 68);
  const q74 = findQuestion("pdf-0073", 74);
  const q76 = findQuestion("pdf-0076", 76);
  const q53 = findQuestion("pdf-0052", 53);
  const q66 = findQuestion("pdf-0738", 66);
  const q40 = findQuestion("pdf-3159", 40);
  const q71 = findQuestion("pdf-3774", 71);

  assert.ok(q68);
  assert.match(q68.explanation, /工作计划与总结/u);
  assert.doesNotMatch(q68.explanation, /工作许划/u);

  assert.ok(q74);
  assert.equal(q74.options.find((option) => option.key === "A")?.text, "故意不完成教育教学任务给教育教学工作造成损失的");
  assert.doesNotMatch(q74.options.map((option) => option.text).join(""), /教育数学任务/u);

  assert.ok(q76);
  assert.equal(q76.options.find((option) => option.key === "A")?.text, "常规赔偿");
  assert.equal(q76.options.find((option) => option.key === "B")?.text, "残疾赔偿费");
  assert.equal(q76.options.find((option) => option.key === "D")?.text, "残疾赔偿金");
  assert.doesNotMatch(q76.options.map((option) => option.text).join(""), /賠/u);

  assert.ok(q53);
  assert.equal(q53.options.find((option) => option.key === "B")?.text, "学习动机适中，学习效果最好");
  assert.match(q53.explanation, /学习较复杂的问题/u);
  assert.doesNotMatch(q53.explanation, /学习較复杂/u);

  assert.ok(q66);
  assert.equal(q66.options.find((option) => option.key === "B")?.text, "情绪适中");

  assert.ok(q40);
  assert.equal(q40.options.find((option) => option.key === "C")?.text, "学习动机适中，学习效果最好");

  assert.ok(q71);
  assert.match(q71.explanation, /确保材料难度适中/u);
  assert.match(q71.explanation, /缺乏成就感/u);
  assert.doesNotMatch(q71.explanation, /材料难度造中/u);
  assert.doesNotMatch(q71.explanation, /缺之成就感/u);

  assert.doesNotMatch(payloadText, /工作许划|教育数学任务|賠|学习动机造中|情绪造中|材料难度造中|学习較复杂|缺之成就感/u);
});

test("built-in PDF bank reports source slots separately from playable questions", () => {
  const payload = JSON.parse(readFileSync("data/questions.from-pdf.json", "utf8"));

  assert.equal(payload.sourceType, "hybrid-vision-ocr-question-answer-pages");
  assert.equal(payload.ocr.sourceExamCount, 52);
  assert.equal(payload.ocr.sourceTotalQuestionSlots, 4680);
  assert.equal(payload.ocr.mergedQuestionCount, payload.questions.length);
  assert.ok(payload.questions.length >= 4292);
  assert.ok(payload.ocr.unmatchedQuestionSlotCount >= 0);
  assert.ok(payload.ocr.reviewQuestionCount >= 0);
});

test("top-level design docs use the verified PDF source-slot count", () => {
  const docs = [
    "docs/01-game-overview.md",
    "docs/02-story-design.md",
    "docs/03-gameplay-systems.md",
    "docs/04-ui-spec.md",
    "docs/06-content-pipeline.md",
    "docs/07-implementation-roadmap.md",
    "docs/08-verification-report.md",
  ].map((filePath) => readFileSync(filePath, "utf8")).join("\n");

  assert.match(docs, /4680/);
  assert.doesNotMatch(docs, /4077/);
});
