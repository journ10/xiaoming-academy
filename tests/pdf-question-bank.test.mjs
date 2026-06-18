import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("built-in PDF bank uses original question stems and option texts", () => {
  const payload = JSON.parse(readFileSync("data/questions.from-pdf.json", "utf8"));
  const [first] = payload.questions;
  const placeholderQuestions = payload.questions.filter((question) =>
    /参考答案是[？?]$/.test(question.stem)
      || question.options.every((option) => String(option.key).trim() === String(option.text).trim()),
  );

  assert.equal(payload.sourceType, "vision-ocr-question-answer-pages");
  assert.match(first.stem, /由于特殊情况/);
  assert.doesNotMatch(first.stem, /参考答案是/);
  assert.equal(first.options.find((option) => option.key === "B")?.text, "为其提供平等接受义务教育的条件");
  assert.equal(first.answer, "B");
  assert.equal(placeholderQuestions.length, 0);
});
