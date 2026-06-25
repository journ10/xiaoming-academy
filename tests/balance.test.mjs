import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAnswer,
  balanceConfig,
  createInitialState,
  createRun,
  createStartRecommendation,
  prepareQuestionBank,
  selectRunQuestions,
} from "../core.js";

const domains = [
  "教育法律法规与政策制度",
  "教育学原理、课程与教学",
  "学习心理与认知机制",
  "德育、班级管理与家校协同",
  "学生身心发展与个体差异",
  "教师职业素养与专业规范",
];

function makeQuestion(id, domain, type = "单项选择题", answer = "B", difficulty = 2, errorPatterns = ["reading-mistake"]) {
  const optionKeys = answer.length > 1 ? ["A", "B", "C", "D", "E"] : ["A", "B", "C", "D"];
  return {
    id,
    sourceId: id,
    year: "2026",
    type,
    topic: domain,
    primaryDomain: { id: domain, name: domain },
    stem: `${domain} ${id} 的真题题干`,
    options: optionKeys.map((key) => ({ key, text: `${key} 选项` })),
    answer,
    explanation: `考点：${domain}。题眼是限定词、对象和条件。`,
    difficulty,
    qualityStatus: "verified",
    errorPatterns,
  };
}

function makeMixedBank() {
  const questions = [
    ...Array.from({ length: 6 }, (_, index) => makeQuestion(`law-single-${index + 1}`, domains[0], "单项选择题", "B", 1)),
    makeQuestion("pedagogy-multi-1", domains[1], "多项选择题", "BC", 3, ["multi-miss"]),
    makeQuestion("psych-judge-1", domains[2], "判断题", "B", 2, ["concept-confusion"]),
    makeQuestion("class-case-1", domains[3], "案例分析题", "D", 4, ["application-error"]),
    makeQuestion("child-single-1", domains[4], "单项选择题", "A", 2, ["memory-gap"]),
    makeQuestion("teacher-multi-1", domains[5], "多项选择题", "AC", 3, ["concept-confusion"]),
  ];
  return prepareQuestionBank(questions);
}

test("balance configuration exposes tunable run, recommendation, style, break-move, and demon values", () => {
  assert.equal(balanceConfig.run.length, 5);
  assert.equal(balanceConfig.recommendation.highPressureThreshold >= 2, true);
  assert.equal(balanceConfig.styles.assault.streakGainStep > 0, true);
  assert.equal(balanceConfig.breakMoves.observe.correctGainMultiplier < balanceConfig.breakMoves.steady.correctGainMultiplier, true);
  assert.equal(balanceConfig.demons.maxPressure >= balanceConfig.recommendation.highPressureThreshold, true);
});

test("low-pressure demons do not immediately take over the start recommendation", () => {
  const bank = makeMixedBank();
  const state = createInitialState({
    answered: {
      "law-single-1": { attempts: 1, correct: 0, wrong: 1, lastCorrect: false },
    },
    demons: {
      "审题失误": {
        id: "审题失误",
        type: "审题失误",
        pressure: balanceConfig.recommendation.highPressureThreshold - 1,
        questionIds: ["law-single-1"],
        recentText: "最近漏看限定词。",
        purified: false,
      },
    },
  });

  const recommendation = createStartRecommendation(bank.playable, state);

  assert.notEqual(recommendation.targetId, "purify");
});

test("high-pressure demons still recommend a purify run", () => {
  const bank = makeMixedBank();
  const state = createInitialState({
    demons: {
      "审题失误": {
        id: "审题失误",
        type: "审题失误",
        pressure: balanceConfig.recommendation.highPressureThreshold,
        questionIds: ["law-single-1"],
        recentText: "最近漏看限定词。",
        purified: false,
      },
    },
  });

  const recommendation = createStartRecommendation(bank.playable, state);

  assert.equal(recommendation.targetId, "purify");
  assert.equal(recommendation.styleId, "review");
});

test("explore selection spreads new questions across available learning domains", () => {
  const bank = makeMixedBank();
  const selected = selectRunQuestions(bank.playable, createInitialState(), {
    targetId: "explore",
    length: 5,
  });
  const selectedDomains = new Set(selected.map((question) => question.primaryDomain.name));

  assert.equal(selected.length, 5);
  assert.equal(selectedDomains.size >= 3, true);
  assert.notDeepEqual(selected.map((question) => question.id), bank.playable.slice(0, 5).map((question) => question.id));
});

test("sprint selection mixes learning domains and question types", () => {
  const bank = makeMixedBank();
  const run = createRun(bank.playable, createInitialState(), {
    targetId: "sprint",
    styleId: "steady",
    length: 5,
  });
  const selectedDomains = new Set(run.questions.map((question) => question.primaryDomain.name));
  const selectedTypes = new Set(run.questions.map((question) => question.type));

  assert.equal(run.questions.length, 5);
  assert.equal(selectedDomains.size >= 3, true);
  assert.equal(selectedTypes.size >= 2, true);
});

test("break moves and styles produce real gain and pressure differences", () => {
  const bank = prepareQuestionBank([
    makeQuestion("gain-1", domains[0], "单项选择题", "B", 2, ["reading-mistake"]),
  ]);
  const question = bank.playable[0];

  const steadyRun = createRun(bank.playable, createInitialState(), { targetId: "explore", styleId: "steady", length: 1 });
  const steadyCorrect = applyAnswer(createInitialState(), steadyRun, question.id, {
    selectedKeys: ["B"],
    breakMoveId: "steady",
  });

  const assaultRun = createRun(bank.playable, createInitialState(), { targetId: "explore", styleId: "assault", length: 1 });
  const assaultCorrect = applyAnswer(createInitialState(), assaultRun, question.id, {
    selectedKeys: ["B"],
    breakMoveId: "assault",
  });

  const observeRun = createRun(bank.playable, createInitialState(), { targetId: "explore", styleId: "steady", length: 1 });
  const observeCorrect = applyAnswer(createInitialState(), observeRun, question.id, {
    selectedKeys: ["B"],
    breakMoveId: "observe",
    observeRevealed: true,
  });

  const steadyWrongRun = createRun(bank.playable, createInitialState(), { targetId: "explore", styleId: "steady", length: 1 });
  const steadyWrong = applyAnswer(createInitialState(), steadyWrongRun, question.id, {
    selectedKeys: ["A"],
    breakMoveId: "steady",
  });

  const assaultWrongRun = createRun(bank.playable, createInitialState(), { targetId: "explore", styleId: "assault", length: 1 });
  const assaultWrong = applyAnswer(createInitialState(), assaultWrongRun, question.id, {
    selectedKeys: ["A"],
    breakMoveId: "assault",
  });

  assert.equal(assaultCorrect.run.answers[question.id].gain > steadyCorrect.run.answers[question.id].gain, true);
  assert.equal(observeCorrect.run.answers[question.id].gain < steadyCorrect.run.answers[question.id].gain, true);
  assert.equal(assaultWrong.run.answers[question.id].pressureChange > steadyWrong.run.answers[question.id].pressureChange, true);
});

test("learning reports distinguish new demons from purified demons and expose target progress", () => {
  const bank = prepareQuestionBank([
    makeQuestion("purify-1", domains[0], "单项选择题", "B", 2, ["reading-mistake"]),
  ]);
  const question = bank.playable[0];
  const state = createInitialState({
    demons: {
      "审题失误": {
        id: "审题失误",
        type: "审题失误",
        pressure: 2,
        questionIds: [question.id],
        recentText: "最近漏看限定词。",
        purified: false,
      },
    },
  });
  const purifyRun = createRun(bank.playable, state, {
    targetId: "purify",
    styleId: "review",
    focusDemonId: "审题失误",
    length: 1,
  });
  const purifyResult = applyAnswer(state, purifyRun, question.id, {
    selectedKeys: ["B"],
    breakMoveId: "steady",
  });

  assert.equal(purifyResult.state.lastReport.purifiedDemons.length, 1);
  assert.equal(purifyResult.state.lastReport.newDemons.length, 0);
  assert.equal(purifyResult.state.lastReport.targetProgress.current, 1);
  assert.equal(purifyResult.state.lastReport.targetProgress.target, balanceConfig.goals.purifyDemons);

  const wrongRun = createRun(bank.playable, createInitialState(), {
    targetId: "explore",
    styleId: "steady",
    length: 1,
  });
  const wrongResult = applyAnswer(createInitialState(), wrongRun, question.id, {
    selectedKeys: ["A"],
    breakMoveId: "steady",
  });

  assert.equal(wrongResult.state.lastReport.newDemons.length, 1);
  assert.equal(wrongResult.state.lastReport.purifiedDemons.length, 0);
});
