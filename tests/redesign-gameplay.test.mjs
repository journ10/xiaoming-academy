import test from "node:test";
import assert from "node:assert/strict";
import {
  applyTrialAnswer,
  artifactDefinitions,
  createDailyChallenges,
  createRouteRun,
  getArtifactRoster,
  initialPlayerState,
  nodeTypes,
  prepareQuestions,
  studyNode,
  upgradeArtifact,
} from "../core.js";

function makeRawQuestions(count = 9) {
  const topics = ["教育法规", "教育心理学", "教学设计", "教师职业道德", "班级管理", "儿童发展"];
  return Array.from({ length: count }, (_, index) => ({
    id: `redesign-${index + 1}`,
    year: "2026",
    type: index % 3 === 0 ? "多项选择" : "单项选择",
    topic: topics[index % topics.length],
    stem: `第 ${index + 1} 道秘卷题的题干`,
    options: [
      { key: "A", text: "干扰项" },
      { key: "B", text: "正确题眼" },
      { key: "C", text: "近似干扰" },
      { key: "D", text: "无关表述" },
    ],
    answer: index % 3 === 0 ? "BC" : "B",
    explanation: `题眼是第 ${index + 1} 题的关键讲解，需要先练功再破阵。`,
    difficulty: (index % 5) + 1,
  }));
}

test("redesign route exposes all RPG node types with asset ids", () => {
  const questions = prepareQuestions(makeRawQuestions(9));
  const run = createRouteRun(questions, { length: 9 });

  assert.deepEqual(Object.keys(nodeTypes), [
    "normal",
    "elite",
    "recover",
    "treasure",
    "demon",
    "mystery",
    "resonance",
    "trial",
  ]);
  assert.deepEqual(run.nodes.map((node) => node.type), [
    "normal",
    "elite",
    "recover",
    "treasure",
    "normal",
    "mystery",
    "resonance",
    "trial",
    "demon",
  ]);
  assert.ok(run.nodes.every((node) => node.assetId === `node.${node.type}`));
  assert.ok(run.nodes.every((node) => node.nodeFlavor && node.rewardPreview));
});

test("correct battle answers grow stance mastery and pay node materials", () => {
  const questions = prepareQuestions(makeRawQuestions(8));
  let player = initialPlayerState();
  let run = createRouteRun(questions, { length: 8 });
  const trialNode = run.nodes.find((node) => node.type === "trial");
  const question = questions.find((item) => item.id === trialNode.questionId);

  const studied = studyNode(player, run, trialNode.id);
  player = studied.player;
  run = studied.run;

  const result = applyTrialAnswer(player, run, {
    nodeId: trialNode.id,
    question,
    selectedAnswer: question.answer,
    stanceId: "assault",
  });

  assert.equal(result.isCorrect, true);
  assert.ok(result.stanceMasteryGain > 0);
  assert.ok(result.player.stanceMastery.assault.xp >= result.stanceMasteryGain);
  assert.ok(result.player.stanceMastery.assault.level >= 1);
  assert.ok(result.materialsGain.lingqian >= 1);
  assert.equal(result.player.materials.lingqian, result.materialsGain.lingqian);
  assert.deepEqual(result.run.events.at(-1).materialsGain, result.materialsGain);
});

test("artifact upgrades consume materials and update roster state", () => {
  const player = {
    ...initialPlayerState(),
    materials: {
      shuye: 20,
      xingsha: 10,
      moyu: 5,
      lingqian: 3,
    },
  };

  const before = getArtifactRoster(player).find((artifact) => artifact.id === "biling");
  const upgraded = upgradeArtifact(player, "biling");
  const after = getArtifactRoster(upgraded.player).find((artifact) => artifact.id === "biling");

  assert.equal(artifactDefinitions.length, 4);
  assert.equal(before.level, 1);
  assert.equal(before.canUpgrade, true);
  assert.equal(after.level, 2);
  assert.equal(upgraded.player.materials.shuye, player.materials.shuye - upgraded.cost.shuye);
  assert.equal(upgraded.player.artifacts.biling.level, 2);
});

test("daily challenges create RPG goals with material rewards", () => {
  const questions = prepareQuestions(makeRawQuestions(6));
  const challenges = createDailyChallenges(questions, {
    ...initialPlayerState(),
    studiedLessonIds: questions.slice(0, 2).map((question) => question.lesson.id),
    correctQuestionIds: [questions[0].id],
    mindDemons: {
      [questions[1].id]: {
        questionId: questions[1].id,
        topic: questions[1].topic,
        pressure: 3,
      },
    },
  });

  assert.deepEqual(challenges.map((challenge) => challenge.id), [
    "daily-study",
    "daily-battle",
    "daily-demon",
    "daily-resonance",
  ]);
  assert.ok(challenges.every((challenge) => challenge.title && challenge.description));
  assert.ok(challenges.every((challenge) => challenge.progress.current <= challenge.progress.target));
  assert.ok(challenges.every((challenge) => Object.values(challenge.rewards.materials).some((value) => value > 0)));
});
