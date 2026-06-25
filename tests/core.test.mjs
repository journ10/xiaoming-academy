import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAnswer,
  createInitialState,
  createLearningReport,
  createQuestionStudyPayload,
  createObservationHint,
  createRun,
  createStartRecommendation,
  judgeAnswer,
  normalizeAnswer,
  prepareQuestionBank,
  selectRunQuestions,
} from "../core.js";

const rawQuestions = [
  question("law-1", "教育法律法规与政策制度", "单项选择", "B", ["reading-mistake"], "义务教育阶段入学保障的关键词是什么？"),
  question("law-2", "教育法律法规与政策制度", "单项选择", "A", ["reading-mistake"], "教师申诉制度首先保护什么？"),
  question("psy-1", "学习心理与认知机制", "单项选择", "C", ["concept-confusion"], "有意义学习的关键是什么？"),
  question("teach-1", "教育学原理、课程与教学", "多项选择", "ABC", ["multi-miss"], "教案通常需要考虑哪些内容？"),
  question("class-1", "德育、班级管理与家校协同", "单项选择", "B", ["application-error"], "班级突发冲突首先要做什么？"),
  question("child-1", "学生身心发展与个体差异", "判断题", "B", ["memory-gap"], "小学生情绪支持是否只看结果？"),
  question("teacher-1", "教师职业素养与专业规范", "单项选择", "D", ["concept-confusion"], "教师职业素养的核心要求是什么？"),
  { ...question("manual-1", "待人工归类", "单项选择", "A", [], "待复核题不应进入推荐。"), qualityStatus: "manual_review" },
  { ...question("catchall-1", "综合知识", "单项选择", "A", [], "旧兜底域不应进入推荐。"), qualityStatus: "verified" },
];

const realStudyQuestion = {
  id: "real-law-1",
  stem: "适龄儿童在非户籍所在地接受义务教育时，当地人民政府应当（）。",
  type: "单项选择题",
  topic: "教育法律法规与政策制度",
  primaryDomain: { id: "law", name: "教育法律法规与政策制度" },
  options: [
    { key: "A", text: "要求学生回到户籍所在地就近入学" },
    { key: "B", text: "为其提供平等接受义务教育的条件" },
    { key: "C", text: "为其提供临时借读证明" },
    { key: "D", text: "暂缓办理入学手续" },
  ],
  answer: "B",
  difficulty: 1,
  concept: "教育法律法规与政策制度 · 义务教育法",
  qualityStatus: "verified",
  errorPatterns: ["memory-gap"],
  lesson: {
    id: "lesson-real-law-1",
    title: "教育法规 · 义务教育入学保障",
    keyPoint: "义务教育法第十二条",
    explanation: "《义务教育法》第十二条规定，父母或者其他法定监护人在非户籍所在地工作或者居住的适龄儿童、少年，当地人民政府应当为其提供平等接受义务教育的条件。",
    studyPrompt: "抓住非户籍所在地与当地人民政府两个条件。",
  },
};

function question(id, domain, type, answer, errorPatterns, stem) {
  return {
    id,
    stem,
    type,
    topic: domain,
    primaryDomain: { id: domain, name: domain },
    options: ["A", "B", "C", "D"].map((key) => ({ key, text: `${key} 选项` })),
    answer,
    explanation: `考点：${domain}。题眼是限定词、对象和条件。错因是没有抓住关键限定。`,
    difficulty: 2,
    qualityStatus: "verified",
    errorPatterns,
  };
}

test("prepareQuestionBank keeps six real domains and excludes manual-review questions from runs", () => {
  const bank = prepareQuestionBank(rawQuestions);

  assert.equal(bank.playable.length, 7);
  assert.equal(bank.manualReview.length, 1);
  assert.equal(bank.playable.some((item) => item.primaryDomain.name === "待人工归类"), false);
  assert.equal(bank.playable.some((item) => item.primaryDomain.name === "综合知识"), false);
});

test("fresh start recommendation defaults to explore run with steady style", () => {
  const bank = prepareQuestionBank(rawQuestions);
  const recommendation = createStartRecommendation(bank.playable, createInitialState());

  assert.equal(recommendation.targetId, "explore");
  assert.equal(recommendation.styleId, "steady");
  assert.match(recommendation.title, /拓新题阵/);
  assert.match(recommendation.primaryAction, /进入题阵/);
});

test("active demons make start recommendation prefer purify without forcing style changes later", () => {
  const bank = prepareQuestionBank(rawQuestions);
  const recommendation = createStartRecommendation(bank.playable, createInitialState({
    demons: {
      "reading-mistake": {
        id: "reading-mistake",
        type: "审题失误",
        pressure: 6,
        questionIds: ["law-1"],
        recentText: "最近漏看限定词",
        purified: false,
      },
    },
  }));

  assert.equal(recommendation.targetId, "purify");
  assert.equal(recommendation.styleId, "review");
  assert.match(recommendation.title, /净魔题阵/);
});

test("selectRunQuestions builds five-question runs and backfills from reliable history", () => {
  const bank = prepareQuestionBank(rawQuestions);
  const selected = selectRunQuestions(bank.playable.slice(0, 3), createInitialState(), {
    targetId: "explore",
    length: 5,
    fallbackQuestions: bank.playable,
  });

  assert.equal(selected.length, 5);
  assert.equal(new Set(selected.map((item) => item.id)).size, 5);
});

test("question index stubs are selectable only for lazy hydration routes", () => {
  const indexStub = {
    id: "indexed-law-1",
    sourceId: "pdf-idx-1",
    year: "2026",
    type: "单项选择题",
    topic: "教育法律法规与政策制度",
    primaryDomain: { id: "law", name: "教育法律法规与政策制度" },
    difficulty: 2,
    concept: "教育法律法规与政策制度 · 义务教育法",
    errorPatterns: ["memory-gap"],
    qualityStatus: "clean",
    gameplayStatus: "mainline",
    lesson: { id: "lesson-indexed-law-1" },
    chunkId: "chunk-0001",
  };

  assert.equal(prepareQuestionBank([indexStub]).playable.length, 0);

  const lazyBank = prepareQuestionBank([indexStub], { allowIndexStubs: true });
  assert.equal(lazyBank.playable.length, 1);

  const run = createRun(lazyBank.playable, createInitialState(), {
    targetId: "explore",
    styleId: "steady",
    length: 1,
    allowIndexStubs: true,
  });

  assert.equal(run.questions.length, 1);
  assert.equal(run.questions[0].id, "indexed-law-1");
  assert.equal(run.questions[0].chunkId, "chunk-0001");
  assert.equal(run.questionIds[0], "indexed-law-1");
});

test("purify runs prioritize high-pressure demon questions", () => {
  const bank = prepareQuestionBank(rawQuestions);
  const state = createInitialState({
    demons: {
      "reading-mistake": {
        id: "reading-mistake",
        type: "审题失误",
        pressure: 8,
        questionIds: ["law-2"],
        recentText: "最近漏看限定词",
        purified: false,
      },
    },
  });
  const run = createRun(bank.playable, state, {
    targetId: "purify",
    styleId: "review",
    focusDemonId: "reading-mistake",
  });

  assert.equal(run.questions[0].id, "law-2");
  assert.equal(run.questions.length, 5);
});

test("answer judging normalizes multi-select order", () => {
  const multi = rawQuestions.find((item) => item.id === "teach-1");

  assert.equal(normalizeAnswer("CBA", multi.options), "ABC");
  assert.equal(judgeAnswer(multi, ["C", "A", "B"]).isCorrect, true);
});

test("observation hint reveals a cue without exposing the answer", () => {
  const hint = createObservationHint(rawQuestions[0]);

  assert.match(hint.text, /题眼|限定|对象|条件/);
  assert.equal(hint.revealsAnswer, false);
  assert.doesNotMatch(hint.text, /正确答案|答案是|B 选项/);
});

test("observation hints and study payload use real lesson and option data", () => {
  const hint = createObservationHint(realStudyQuestion);
  const payload = createQuestionStudyPayload(realStudyQuestion, {
    selectedKeys: ["A"],
    correctAnswer: "B",
    selectedAnswer: "A",
    demonType: "记忆盲区",
  });

  assert.match(hint.text, /平等接受义务教育的条件/u);
  assert.doesNotMatch(hint.text, /先找限定词、对象和条件/u);
  assert.equal(payload.lessonTitle, "教育法规 · 义务教育入学保障");
  assert.equal(payload.lessonKeyPoint, "义务教育法第十二条");
  assert.match(payload.lessonExplanation, /当地人民政府应当为其提供平等接受义务教育的条件/u);
  assert.equal(payload.correctAnswerText, "B. 为其提供平等接受义务教育的条件");
  assert.equal(payload.selectedAnswerText, "A. 要求学生回到户籍所在地就近入学");
  assert.match(payload.summary, /义务教育法第十二条/u);
  assert.match(payload.summary, /记忆盲区/u);
});

test("wrong answers generate demons and reports summarize next action", () => {
  const bank = prepareQuestionBank(rawQuestions);
  let state = createInitialState();
  const run = createRun(bank.playable, state, { targetId: "explore", styleId: "steady" });

  const result = applyAnswer(state, run, run.questions[0].id, {
    selectedKeys: ["A"],
    breakMoveId: "steady",
  });

  state = result.state;
  assert.equal(result.answer.isCorrect, false);
  assert.equal(Object.values(state.demons).length, 1);

  const report = createLearningReport(state, result.run);
  assert.match(report.summary, /5 题|题阵|错/);
  assert.ok(report.nextStep);
  assert.equal("materials" in report, false);
  assert.equal("journal" in report, false);
});

test("learning reports and demons retain concrete question review details", () => {
  const bank = prepareQuestionBank([realStudyQuestion]);
  const state = createInitialState();
  const run = createRun(bank.playable, state, { targetId: "explore", styleId: "steady", length: 1 });
  const result = applyAnswer(state, run, realStudyQuestion.id, {
    selectedKeys: ["A"],
    breakMoveId: "steady",
  });
  const report = createLearningReport(result.state, result.run);
  const reviewItem = report.questionReviewItems[0];
  const demon = result.state.demons["记忆盲区"];

  assert.equal(reviewItem.questionId, realStudyQuestion.id);
  assert.equal(reviewItem.isCorrect, false);
  assert.equal(reviewItem.correctAnswerText, "B. 为其提供平等接受义务教育的条件");
  assert.equal(reviewItem.selectedAnswerText, "A. 要求学生回到户籍所在地就近入学");
  assert.match(reviewItem.lessonExplanation, /当地人民政府应当为其提供平等接受义务教育的条件/u);
  assert.match(reviewItem.summary, /记忆盲区/u);
  assert.match(demon.recentText, /义务教育法/u);
  assert.match(demon.recentText, /记忆盲区/u);
});

test("correct answers in purify runs reduce demon pressure", () => {
  const bank = prepareQuestionBank(rawQuestions);
  const state = createInitialState({
    demons: {
      "reading-mistake": {
        id: "reading-mistake",
        type: "审题失误",
        pressure: 2,
        questionIds: ["law-1"],
        recentText: "最近漏看限定词",
        purified: false,
      },
    },
  });
  const run = createRun(bank.playable, state, { targetId: "purify", styleId: "review", focusDemonId: "reading-mistake" });
  const result = applyAnswer(state, run, "law-1", {
    selectedKeys: ["B"],
    breakMoveId: "steady",
  });

  assert.equal(result.answer.isCorrect, true);
  assert.equal(result.state.demons["reading-mistake"].pressure < 2, true);
});
