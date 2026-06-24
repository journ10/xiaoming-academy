import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAnswer,
  breakMoves,
  createInitialState,
  createObservationHint,
  createRun,
  createStartRecommendation,
  decodeSaveState,
  encodeSaveState,
  getHighPressureDemon,
  prepareQuestionBank,
  runTargets,
  studyStyles,
} from "../core.js";

const domains = [
  "学习心理与认知机制",
  "教育学原理、课程与教学",
  "教育法律法规与政策制度",
  "德育、班级管理与家校协同",
  "学生身心发展与个体差异",
  "教师职业素养与专业规范",
];

function makeRawQuestions(count = 9) {
  return Array.from({ length: count }, (_, index) => {
    const domain = domains[index % domains.length];
    return {
      id: `redesign-${index + 1}`,
      sourceId: `redesign-${index + 1}`,
      year: "2026",
      type: index % 3 === 0 ? "多项选择题" : "单项选择题",
      topic: domain,
      primaryDomain: { id: domain, name: domain },
      stem: `第 ${index + 1} 道真题题干`,
      options: [
        { key: "A", text: "干扰项" },
        { key: "B", text: "正确题眼" },
        { key: "C", text: "近似干扰" },
        { key: "D", text: "无关表述" },
      ],
      answer: index % 3 === 0 ? "BC" : "B",
      explanation: `考点：${domain}。题眼是限定词、对象和条件。`,
      difficulty: (index % 5) + 1,
      qualityStatus: "clean",
      errorPatterns: index % 2 ? ["concept-confusion"] : ["reading-mistake"],
    };
  });
}

test("redesign exposes the current target, style, and break-move vocabulary", () => {
  assert.deepEqual(runTargets.map((target) => target.name), ["拓新题阵", "净魔题阵", "冲刺题阵"]);
  assert.deepEqual(studyStyles.map((style) => style.name), ["稳修", "突击", "复盘"]);
  assert.deepEqual(breakMoves.map((move) => move.name), ["稳破", "强攻", "观照"]);
});

test("five-question runs are created directly from playable questions", () => {
  const bank = prepareQuestionBank(makeRawQuestions(9));
  const run = createRun(bank.playable, createInitialState(), {
    targetId: "explore",
    styleId: "steady",
    length: 5,
  });

  assert.equal(run.targetName, "拓新题阵");
  assert.equal(run.styleName, "稳修");
  assert.equal(run.questions.length, 5);
  assert.equal(run.currentIndex, 0);
  assert.equal("nodes" in run, false);
});

test("unfinished runs take priority on the start recommendation", () => {
  const bank = prepareQuestionBank(makeRawQuestions(7));
  const currentRun = createRun(bank.playable, createInitialState(), {
    targetId: "sprint",
    styleId: "assault",
  });
  const recommendation = createStartRecommendation(bank.playable, createInitialState({ currentRun }));

  assert.equal(recommendation.hasUnfinishedRun, true);
  assert.equal(recommendation.targetId, "sprint");
  assert.equal(recommendation.styleId, "assault");
  assert.match(recommendation.primaryAction, /继续题阵/u);
});

test("wrong answers create high-pressure demons that purify runs prioritize", () => {
  const bank = prepareQuestionBank(makeRawQuestions(7));
  let state = createInitialState();
  const run = createRun(bank.playable, state, { targetId: "explore", styleId: "steady" });
  const wrong = applyAnswer(state, run, run.questions[0].id, {
    selectedKeys: ["A"],
    breakMoveId: "assault",
  });
  state = wrong.state;

  const demon = getHighPressureDemon(state);
  const purifyRun = createRun(bank.playable, state, {
    targetId: "purify",
    styleId: "review",
    focusDemonId: demon.id,
  });

  assert.ok(demon);
  assert.equal(demon.pressure >= 2, true);
  assert.equal(purifyRun.questions[0].id, run.questions[0].id);
});

test("correct answers in review purify runs reduce demon pressure", () => {
  const bank = prepareQuestionBank(makeRawQuestions(7));
  const state = createInitialState({
    demons: {
      "审题失误": {
        id: "审题失误",
        type: "审题失误",
        pressure: 3,
        questionIds: ["redesign-1"],
        recentText: "最近漏看限定词。",
        purified: false,
      },
    },
  });
  const run = createRun(bank.playable, state, { targetId: "purify", styleId: "review", focusDemonId: "审题失误" });
  const result = applyAnswer(state, run, "redesign-1", {
    selectedKeys: ["B", "C"],
    breakMoveId: "steady",
  });

  assert.equal(result.answer.isCorrect, true);
  assert.equal(result.state.demons["审题失误"].pressure, 1);
});

test("observation gives a cue and records locked observe state on submission", () => {
  const bank = prepareQuestionBank(makeRawQuestions(5));
  const state = createInitialState();
  const run = createRun(bank.playable, state, { targetId: "explore", styleId: "steady" });
  const question = run.questions[1];
  const hint = createObservationHint(question);
  const result = applyAnswer(state, run, question.id, {
    selectedKeys: ["B"],
    breakMoveId: "observe",
    observeRevealed: true,
  });

  assert.match(hint.text, /题眼|限定|对象|条件/u);
  assert.equal(hint.revealsAnswer, false);
  assert.equal(result.run.answers[question.id].observeRevealed, true);
  assert.equal(result.run.answers[question.id].breakMoveId, "observe");
});

test("save codes preserve theme and unfinished run state", () => {
  const bank = prepareQuestionBank(makeRawQuestions(5));
  const currentRun = createRun(bank.playable, createInitialState(), { targetId: "explore", styleId: "steady" });
  const state = createInitialState({ theme: "light", currentRun });
  const decoded = decodeSaveState(encodeSaveState(state));

  assert.equal(decoded.theme, "light");
  assert.equal(decoded.currentRun.id, currentRun.id);
  assert.equal(decoded.currentRun.questions.length, 5);
});
