import test from "node:test";
import assert from "node:assert/strict";
import {
  applyTrialAnswer,
  buildChapterMechanicState,
  buildErrorDiagnosis,
  buildObservationHint,
  buildKnowledgeGraphPreview,
  chapterMechanicDefinitions,
  claimDailyQuestReward,
  createDailyQuestState,
  createLearningDashboard,
  createMindDemonRun,
  createRogueliteRun,
  createRogueliteRunReport,
  createRouteRun,
  createRunRecommendation,
  createRunReport,
  createSaveArchive,
  createStoryChapters,
  getBlackInkCollection,
  getBondStories,
  getChapterAvailability,
  getChapterProgress,
  getChapterActionState,
  getAvailableLearningStyles,
  getDialogueForChapter,
  getEnergyState,
  getEndingOptions,
  getHeartMethod,
  getPlayerTitle,
  getRecommendedLearningStyle,
  initialPlayerState,
  isBankMastered,
  isChapterCleared,
  learningStyleDefinitions,
  markIntroSeen,
  parseSaveArchive,
  parseQuestionImport,
  prepareQuestions,
  prunePlayerForQuestions,
  rogueliteBuildDefinitions,
  rogueliteRunModes,
  restFromFatigue,
  selectRouteQuestions,
  setLearningStyle,
  studyNode,
  storyCharacters,
  stances,
  summarizeQuestionBank,
} from "../core.js";

const rawQuestions = [
  {
    id: "law-1",
    year: "2026",
    type: "单项选择",
    topic: "教育法规",
    stem: "义务教育阶段入学保障的关键词是什么？",
    options: [
      { key: "A", text: "成绩筛选" },
      { key: "B", text: "政府保障与就近入学" },
      { key: "C", text: "家长自由决定" },
      { key: "D", text: "学校自行定价" },
    ],
    answer: "B",
    explanation: "题眼是政府保障、免试、就近、适龄。",
    sourceRef: "PDF 第 1 页 OCR：第 1 题解析",
    difficulty: 1,
  },
  {
    id: "psy-1",
    year: "2026",
    type: "单项选择",
    topic: "教育心理学",
    stem: "新旧知识建立实质联系属于哪类学习？",
    options: [
      { key: "A", text: "机械学习" },
      { key: "B", text: "过度学习" },
      { key: "C", text: "有意义学习" },
      { key: "D", text: "无意学习" },
    ],
    answer: "C",
    explanation: "题眼是新旧知识、实质联系、主动理解。",
    sourceRef: "PDF 第 2 页 OCR：解释性理解与探究性理解",
    difficulty: 2,
  },
  {
    id: "design-1",
    year: "2026",
    type: "多项选择",
    topic: "教学设计",
    stem: "教案通常需要考虑哪些内容？",
    options: [
      { key: "A", text: "教学目标" },
      { key: "B", text: "学生基础" },
      { key: "C", text: "评价方式" },
      { key: "D", text: "教师个人喜好优先" },
    ],
    answer: "ABC",
    explanation: "题眼是目标、学情、活动、评价。",
    sourceRef: "PDF 第 2 页 OCR：教学目标功能",
    difficulty: 3,
  },
  {
    id: "ethics-1",
    year: "2026",
    type: "判断题",
    topic: "教师职业道德",
    stem: "教师职业道德只约束课堂行为。",
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" },
    ],
    answer: "B",
    explanation: "题眼是职业道德覆盖课内外教育活动。",
    sourceRef: "PDF 第 3 页 OCR：教师法与教师考核",
    difficulty: 1,
  },
  {
    id: "class-1",
    year: "2026",
    type: "单项选择",
    topic: "班级管理",
    stem: "班级突发冲突首先要做什么？",
    options: [
      { key: "A", text: "公开批评" },
      { key: "B", text: "稳定情绪并保障安全" },
      { key: "C", text: "只听班干部" },
      { key: "D", text: "完全交给家长" },
    ],
    answer: "B",
    explanation: "题眼是突发、冲突、安全、情绪稳定。",
    sourceRef: "PDF 第 3 页 OCR：教育活动关系解析",
    difficulty: 2,
  },
  {
    id: "child-1",
    year: "2026",
    type: "单项选择",
    topic: "儿童发展",
    stem: "小学生情绪支持的关键词是什么？",
    options: [
      { key: "A", text: "忽视情绪" },
      { key: "B", text: "逐步表达与调节" },
      { key: "C", text: "只看结果" },
      { key: "D", text: "直接贴品德标签" },
    ],
    answer: "B",
    explanation: "题眼是儿童情绪、具体表达、逐步调节。",
    sourceRef: "PDF 第 4 页 OCR：儿童发展",
    difficulty: 2,
  },
];

test("initial RPG state includes first-run intro, growth, bonds, and chapter progress", () => {
  const player = initialPlayerState();

  assert.equal(player.playerLevel, 1);
  assert.equal(player.growthXp, 0);
  assert.equal(player.starGlimmer, 0);
  assert.equal(player.energy, 12);
  assert.equal(player.maxEnergy, 12);
  assert.equal(player.learningStyleId, "balanced");
  assert.equal(player.seenIntro, false);
  assert.deepEqual(player.bonds, {
    mingche: 0,
    azhi: 0,
    qinglan: 0,
    xiaomo: 0,
  });
  assert.deepEqual(player.correctQuestionIds, []);
  assert.deepEqual(player.chapterClears, {});
  assert.deepEqual(player.storyFlags, {});
});

test("story characters and chapters bind the question bank to RPG progress", () => {
  const prepared = prepareQuestions(rawQuestions);
  const chapters = createStoryChapters(prepared, { requiredMastery: 16 });

  assert.deepEqual(storyCharacters.map((character) => character.id), [
    "mingche",
    "azhi",
    "qinglan",
    "xiaomo",
  ]);
  assert.equal(chapters.length, 6);
  assert.equal(chapters[0].topic, "教育法规");
  assert.deepEqual(chapters[0].questionIds, ["law-1"]);
  assert.equal(chapters[0].requiredMastery, 16);
  assert.ok(chapters.every((chapter) => chapter.title && chapter.characterId));
});

test("chapter availability gates sequential learning-domain chapters", () => {
  const prepared = prepareQuestions([
    ...rawQuestions,
    {
      ...rawQuestions[0],
      id: "mixed-1",
      topic: "综合知识",
      concept: "综合知识 · 跨主题 · 秘卷总试",
    },
  ]);
  const chapters = createStoryChapters(prepared, { requiredMastery: 16 });
  const [first, second, third, fourth, fifth, sixth] = chapters;

  assert.equal(chapters.length, 6);
  assert.equal(chapters.some((chapter) => chapter.topic === "综合知识"), false);
  assert.equal(getChapterAvailability(first, chapters, initialPlayerState()).available, true);
  assert.equal(getChapterAvailability(second, chapters, initialPlayerState()).available, false);
  assert.match(getChapterAvailability(second, chapters, initialPlayerState()).reason, /第一章|律令花窗/);

  assert.equal(getChapterAvailability(second, chapters, {
    ...initialPlayerState(),
    chapterClears: { [first.id]: true },
  }).available, true);
  assert.equal(getChapterAvailability(third, chapters, {
    ...initialPlayerState(),
    chapterClears: { [first.id]: true },
  }).available, false);

  assert.ok([fourth, fifth, sixth].every((chapter) => chapter.order >= 4));
});

test("chapter dialogue returns visual-novel beats with pure text speaker marks", () => {
  const prepared = prepareQuestions(rawQuestions);
  const [chapter] = createStoryChapters(prepared, { requiredMastery: 16 });
  const dialogue = getDialogueForChapter(chapter, initialPlayerState());

  assert.equal(dialogue.length >= 3, true);
  assert.deepEqual(dialogue.map((line) => line.speakerId).slice(0, 2), ["mingche", "azhi"]);
  assert.ok(dialogue.every((line) => line.text && line.speakerMark));
  assert.ok(dialogue.every((line) => !line.avatar && !line.standee));
  assert.match(dialogue.at(-1).text, /短课|题阵|心魔|封印/);
});

test("story collection exposes black ink sayings, bond stories, and final endings", () => {
  const prepared = prepareQuestions([
    ...rawQuestions,
    {
      ...rawQuestions[0],
      id: "mixed-1",
      topic: "综合知识",
      concept: "综合知识 · 跨主题 · 秘卷总试",
    },
  ]);
  const chapters = createStoryChapters(prepared, { requiredMastery: 16 });
  const clearedPlayer = {
    ...initialPlayerState(),
    seenIntro: true,
    chapterClears: Object.fromEntries(chapters.map((chapter) => [chapter.id, true])),
    bonds: {
      mingche: 20,
      azhi: 25,
      qinglan: 20,
      xiaomo: 30,
    },
  };
  const ink = getBlackInkCollection(chapters, clearedPlayer);
  const bondStories = getBondStories(clearedPlayer);
  const endings = getEndingOptions(chapters, clearedPlayer);

  assert.equal(chapters.at(-1).topic, "儿童发展");
  assert.equal(chapters.at(-1).title, "第六章 童心星谷");
  assert.equal(ink.length, 7);
  assert.equal(ink.every((item) => item.unlocked), true);
  assert.deepEqual(bondStories.filter((story) => story.unlocked).map((story) => story.characterId), [
    "mingche",
    "azhi",
    "qinglan",
    "xiaomo",
  ]);
  assert.deepEqual(endings.map((ending) => ending.id), ["guardian", "returner"]);
  assert.equal(getEndingOptions(chapters, initialPlayerState()).length, 0);
});

test("chapter action state recommends story, training, battle, review, then clear", () => {
  const [question] = prepareQuestions(rawQuestions);
  const [chapter] = createStoryChapters([question], { requiredMastery: 16 });
  let player = initialPlayerState();
  let run = createRouteRun([question], { length: 1 });

  assert.equal(getChapterActionState(chapter, [question], player).recommendedAction, "story");

  player = { ...player, storyFlags: { [chapter.id]: true } };
  assert.equal(getChapterActionState(chapter, [question], player).recommendedAction, "training");

  const studied = studyNode(player, run, run.nodes[0].id, { bankQuestions: [question] });
  player = studied.player;
  run = studied.run;
  assert.equal(getChapterActionState(chapter, [question], player).recommendedAction, "battle");

  const wrong = applyTrialAnswer(player, run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: "A",
    stanceId: "steady",
    bankQuestions: [question],
  });
  player = wrong.player;
  assert.equal(getChapterActionState(chapter, [question], player).recommendedAction, "review");

  player = {
    ...player,
    mindDemons: {},
    wrongQuestionIds: [],
    correctQuestionIds: [question.id],
    mastery: { [question.topic]: 16 },
  };
  assert.equal(getChapterActionState(chapter, [question], player).recommendedAction, "cleared");
});

test("energy curve rewards correct streaks and wrong answers only reduce energy", () => {
  const [question] = prepareQuestions(rawQuestions);
  const run = createRouteRun([question], { length: 1 });
  const ready = studyNode(initialPlayerState(), run, run.nodes[0].id);
  const correct = applyTrialAnswer({ ...ready.player, energy: 10 }, ready.run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });
  const wrong = applyTrialAnswer({ ...ready.player, energy: 10 }, ready.run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: "A",
    stanceId: "steady",
  });

  assert.equal(correct.energyDelta > 0, true);
  assert.equal(correct.player.energy, 11);
  assert.equal(wrong.energyDelta < 0, true);
  assert.equal(wrong.player.energy, 8);
  assert.equal(wrong.growthXpGain, 0);
});

test("player title curve gives RPG progression labels without changing mastery rules", () => {
  assert.equal(getPlayerTitle(initialPlayerState()), "初入书院");
  assert.equal(getPlayerTitle({ ...initialPlayerState(), growthXp: 120, playerLevel: 3 }), "秘卷见习");
  assert.equal(getPlayerTitle({ ...initialPlayerState(), growthXp: 320, playerLevel: 7 }), "题阵行者");
  assert.equal(getEnergyState({ ...initialPlayerState(), energy: 3 }).status, "low");
});

test("first-time study grants learning rewards once and repeat study is only review", () => {
  const [question] = prepareQuestions(rawQuestions);
  const run = createRouteRun([question], { length: 1 });
  const first = studyNode(initialPlayerState(), run, run.nodes[0].id);
  const second = studyNode(first.player, first.run, first.run.nodes[0].id);

  assert.equal(first.rewards.starGlimmerGain, 0);
  assert.equal(first.rewards.growthXpGain > 0, true);
  assert.equal(first.rewards.materialsGain.shuye > 0, true);
  assert.equal(first.rewards.bondGains.azhi > 0, true);
  assert.equal(first.player.materials.shuye, first.rewards.materialsGain.shuye);
  assert.equal(first.player.bonds.azhi, first.rewards.bondGains.azhi);
  assert.equal(second.rewards.starGlimmerGain, 0);
  assert.equal(second.rewards.growthXpGain, 0);
  assert.equal(second.player.starGlimmer, first.player.starGlimmer);
});

test("learning styles can be selected and change study feedback", () => {
  const [question] = prepareQuestions(rawQuestions);
  const baselineRun = createRouteRun([question], { length: 1 });
  const styledRun = createRouteRun([question], { length: 1 });
  const styledPlayer = setLearningStyle(initialPlayerState(), "law");

  const baseline = studyNode(initialPlayerState(), baselineRun, baselineRun.nodes[0].id, {
    bankQuestions: [question],
  });
  const styled = studyNode(styledPlayer, styledRun, styledRun.nodes[0].id, {
    bankQuestions: [question],
  });

  assert.ok(learningStyleDefinitions.some((style) => style.id === "law"));
  assert.equal(styled.player.learningStyleId, "law");
  assert.ok(styled.rewards.growthXpGain > baseline.rewards.growthXpGain);
  assert.match(styled.rewards.styleFeedback, /律令派|教育法规/);
  assert.throws(() => setLearningStyle(initialPlayerState(), "missing-style"), /找不到这种流派/);
});

test("learning style build exposes base styles, advanced unlock gates, and recommendations", () => {
  const prepared = prepareQuestions([
    ...rawQuestions,
    {
      ...rawQuestions[0],
      id: "mixed-1",
      topic: "综合知识",
      concept: "综合知识 · 跨主题 · 秘卷总试",
    },
  ]);
  const chapters = createStoryChapters(prepared, { requiredMastery: 16 });
  const initialAvailability = getAvailableLearningStyles(initialPlayerState(), chapters);
  const advancedPlayer = {
    ...initialPlayerState(),
    streak: 10,
    purifiedDemonIds: Array.from({ length: 20 }, (_, index) => `purified-${index + 1}`),
    chapterClears: Object.fromEntries(chapters.map((chapter) => [chapter.id, true])),
    mindDemons: {
      [prepared[1].id]: {
        questionId: prepared[1].id,
        topic: prepared[1].topic,
        pressure: 5,
        errorPattern: "concept-confusion",
        demonType: "镜像心魔",
      },
    },
  };
  const advancedAvailability = getAvailableLearningStyles(advancedPlayer, chapters);
  const recommended = getRecommendedLearningStyle(prepared, advancedPlayer, chapters);

  assert.deepEqual(learningStyleDefinitions.map((style) => style.id), [
    "balanced",
    "law",
    "concept",
    "assault-flow",
    "review",
    "speed",
    "deep-read",
    "chaos",
  ]);
  assert.deepEqual(initialAvailability.filter((style) => style.unlocked).map((style) => style.id), [
    "balanced",
    "law",
    "concept",
  ]);
  assert.equal(initialAvailability.find((style) => style.id === "review").unlocked, false);
  assert.throws(() => setLearningStyle(initialPlayerState(), "review", { chapters }), /还未解锁/);
  assert.deepEqual(advancedAvailability.filter((style) => style.unlocked).map((style) => style.id), [
    "balanced",
    "law",
    "concept",
    "assault-flow",
    "review",
    "speed",
    "deep-read",
    "chaos",
  ]);
  assert.equal(setLearningStyle(advancedPlayer, "chaos", { chapters }).learningStyleId, "chaos");
  assert.equal(recommended.id, "review");
  assert.match(recommended.reason, /心魔|复盘/);
});

test("learning styles affect battle rewards and dashboard win-rate stats", () => {
  const [question] = prepareQuestions(rawQuestions);
  const balancedRun = createRouteRun([question], { length: 1 });
  const lawRun = createRouteRun([question], { length: 1 });
  const balancedReady = studyNode(initialPlayerState(), balancedRun, balancedRun.nodes[0].id);
  const lawReady = studyNode(setLearningStyle(initialPlayerState(), "law"), lawRun, lawRun.nodes[0].id);

  const balanced = applyTrialAnswer(balancedReady.player, balancedReady.run, {
    nodeId: balancedRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });
  const law = applyTrialAnswer(lawReady.player, lawReady.run, {
    nodeId: lawRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });
  const dashboard = createLearningDashboard([question], {
    ...law.player,
    styleStats: {
      law: { attempts: 3, correct: 2 },
      balanced: { attempts: 1, correct: 1 },
      "assault-flow": { attempts: 2, correct: 1 },
      review: { attempts: 0, correct: 0 },
    },
  });

  assert.ok(law.spiritPagesGain > balanced.spiritPagesGain);
  assert.equal(law.player.styleStats.law.attempts, 1);
  assert.equal(law.player.styleStats.law.correct, 1);
  assert.deepEqual(dashboard.buildWinRates.map((build) => build.id), ["steady", "assault", "review"]);
  assert.deepEqual(dashboard.buildWinRates.map((build) => build.name), ["稳修", "突击", "复盘"]);
  assert.equal(dashboard.buildWinRates.find((build) => build.id === "steady").winRate, 100);
  assert.equal(dashboard.buildWinRates.find((build) => build.id === "assault").winRate, 50);
  assert.equal(dashboard.buildWinRates.some((build) => build.id === "law"), false);
});

test("correct battle answers grow the player while wrong answers only create study debt", () => {
  const [question] = prepareQuestions(rawQuestions);
  const correctRun = createRouteRun([question], { length: 1 });
  const wrongRun = createRouteRun([question], { length: 1 });
  const correctReady = studyNode(initialPlayerState(), correctRun, correctRun.nodes[0].id);
  const wrongReady = studyNode(initialPlayerState(), wrongRun, wrongRun.nodes[0].id);

  const correct = applyTrialAnswer(correctReady.player, correctReady.run, {
    nodeId: correctRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });
  const wrong = applyTrialAnswer(wrongReady.player, wrongReady.run, {
    nodeId: wrongRun.nodes[0].id,
    question,
    selectedAnswer: "A",
    stanceId: "steady",
  });

  assert.equal(correct.isCorrect, true);
  assert.equal(correct.starGlimmerGain, 0);
  assert.ok(correct.growthXpGain > 0);
  assert.ok(correct.materialsGain.shuye > 0);
  assert.ok(correct.bondGains.qinglan > 0);
  assert.deepEqual(correct.player.correctQuestionIds, ["law-1"]);

  assert.equal(wrong.isCorrect, false);
  assert.equal(wrong.starGlimmerGain, 0);
  assert.equal(wrong.growthXpGain, 0);
  assert.equal(wrong.bondGains.qinglan, 0);
  assert.equal(wrong.masteryGain, 0);
  assert.deepEqual(wrong.player.correctQuestionIds, []);
  assert.ok(wrong.player.mindDemons["law-1"]);
});

test("chapter clear requires story, study coverage, correct coverage, no active demons, and mastery threshold", () => {
  const [question] = prepareQuestions(rawQuestions);
  const [chapter] = createStoryChapters([question], { requiredMastery: 16 });
  let player = initialPlayerState();
  let run = createRouteRun([question], { length: 1 });

  assert.equal(isChapterCleared(chapter, [question], player), false);

  const studied = studyNode(player, run, run.nodes[0].id);
  player = studied.player;
  run = studied.run;
  assert.equal(isChapterCleared(chapter, [question], player), false);

  const result = applyTrialAnswer(player, run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });
  player = result.player;

  const progress = getChapterProgress(chapter, [question], player);
  assert.equal(progress.total, 1);
  assert.equal(progress.storySeen, false);
  assert.equal(progress.studiedCount, 1);
  assert.equal(progress.correctCount, 1);
  assert.equal(progress.demonCount, 0);
  assert.equal(progress.cleared, false);
  assert.equal(isChapterCleared(chapter, [question], player), false);

  player = { ...player, storyFlags: { [chapter.id]: true } };
  const storyProgress = getChapterProgress(chapter, [question], player);
  assert.equal(storyProgress.storySeen, true);
  assert.equal(storyProgress.cleared, true);
});

test("bank mastery is true only after all generated chapters are cleared", () => {
  const prepared = prepareQuestions(rawQuestions.slice(0, 2));
  const chapters = createStoryChapters(prepared, { requiredMastery: 16 });
  let player = initialPlayerState();

  assert.equal(isBankMastered(prepared, player, { requiredMastery: 16 }), false);

  prepared.forEach((question) => {
    let run = createRouteRun([question], { length: 1 });
    const studied = studyNode(player, run, run.nodes[0].id);
    player = studied.player;
    run = studied.run;
    const result = applyTrialAnswer(player, run, {
      nodeId: run.nodes[0].id,
      question,
      selectedAnswer: question.answer,
      stanceId: "steady",
    });
    player = result.player;
  });
  player = {
    ...player,
    storyFlags: Object.fromEntries(chapters.map((chapter) => [chapter.id, true])),
  };

  assert.equal(chapters.every((chapter) => isChapterCleared(chapter, prepared, player)), true);
  assert.equal(isBankMastered(prepared, player, { requiredMastery: 16 }), true);
});

test("markIntroSeen stores the one-time onboarding state without changing progress", () => {
  const player = initialPlayerState();
  const nextPlayer = markIntroSeen(player);

  assert.equal(nextPlayer.seenIntro, true);
  assert.equal(nextPlayer.growthXp, 0);
  assert.equal(player.seenIntro, false);
});

test("prepareQuestions turns PDF explanations into required pre-battle lesson cards", () => {
  const [question] = prepareQuestions(rawQuestions);

  assert.equal(question.lesson.id, "lesson-law-1");
  assert.equal(question.lesson.sourceRef, "PDF 第 1 页 OCR：第 1 题解析");
  assert.match(question.lesson.keyPoint, /政府保障/);
  assert.match(question.lesson.explanation, /题眼/);
  assert.equal(question.lesson.studyPrompt.length > 0, true);
});

test("prepareQuestions cleans PDF soft line breaks inside short lesson explanations", () => {
  const [question] = prepareQuestions([{
    id: "soft-break-lesson",
    year: "2026",
    type: "单项选择",
    topic: "学生身心发展与个体差异",
    stem: "教师进行教育时应先了解学生的身心发展特点。",
    options: [
      { key: "A", text: "忽视个体差异" },
      { key: "B", text: "了解学生特点" },
      { key: "C", text: "只看考试成绩" },
      { key: "D", text: "减少教育活动" },
    ],
    answer: "B",
    explanation: "教师要先了解学\n生的身心发展特点。\n（1）尊重学生差异；\n（2）选择适合的教育方式。",
  }]);

  assert.match(question.lesson.explanation, /了解学生的身心发展特点/u);
  assert.doesNotMatch(question.lesson.explanation, /了解学\s+生/u);
  assert.match(question.lesson.explanation, /特点。\s+（1）尊重学生差异/u);
});

test("prepareQuestions cleans common playable lesson OCR spacing noise", () => {
  const [question] = prepareQuestions([{
    id: "ocr-spacing-lesson",
    year: "2026",
    type: "单项选择",
    topic: "教师职业素养与专业规范",
    stem: "教师应当履行教育教学职责。",
    options: [
      { key: "A", text: "专业人员" },
      { key: "B", text: "一般人员" },
      { key: "C", text: "临时人员" },
      { key: "D", text: "辅助人员" },
    ],
    answer: "A",
    explanation: "教师是履行教育教学职责的专业入员。教师在课前根据学生 象的特点设计课程，并减少对环 的依赖。",
  }]);

  assert.match(question.lesson.explanation, /专业人员/u);
  assert.match(question.lesson.explanation, /学生对象的特点/u);
  assert.match(question.lesson.explanation, /对环境的依赖/u);
  assert.doesNotMatch(question.lesson.explanation, /专业入员|学生\s+象|学生象|对环\s*的依赖/u);
  assert.doesNotMatch(question.lesson.explanation, /[\u3400-\u9fff\uf900-\ufaff][ \t\u00a0]+[\u3400-\u9fff\uf900-\ufaff]/u);
});

test("observation hint links the stem clue to the answer option before explanation", () => {
  const [question] = prepareQuestions([{
    id: "moral-fable",
    year: "2026",
    type: "单项选择",
    topic: "德育、班级管理与家校协同",
    stem: "寓言故事《天鹅，鱼与大虾》里提到这三种动物一起拉车，天鹅往天上拉车，鱼儿往水里钻来拉车，大虾往后跳来拉车，结果车却一动不动，这个故事提醒教师在进行德育时（）。",
    options: [
      { key: "A", text: "依靠积极因素克服消极因素" },
      { key: "B", text: "一致性与连贯性" },
      { key: "C", text: "集体教育和个别教育相结合" },
      { key: "D", text: "尊重学生与严格要求学生相结合" },
    ],
    answer: "B",
    explanation: "德育工作中应主动协调多方面的教育力量，统一认识和步调，有计划、有系统的发挥教育的整体功能，培养学生正确的思想品德。",
  }]);

  const hint = buildObservationHint(question);

  assert.match(hint.stemCue, /天鹅|大虾|车却一动不动/);
  assert.equal(hint.answerLine, "B. 一致性与连贯性");
  assert.match(hint.explanation, /德育工作中应主动协调/);
});

test("question bank summary separates source slots from playable questions", () => {
  const summary = summarizeQuestionBank({
    questions: rawQuestions,
    ocr: {
      sourceExamCount: 52,
      sourceTotalQuestionSlots: 4680,
      mergedQuestionCount: rawQuestions.length,
      reviewQuestionCount: 2,
    },
  });

  assert.equal(summary.sourceExamCount, 52);
  assert.equal(summary.sourceTotalQuestionSlots, 4680);
  assert.equal(summary.playableQuestionCount, rawQuestions.length);
  assert.equal(summary.reviewQuestionCount, 2);
  assert.equal(summary.sourceCoveragePercent, 0.1);
});

test("prepared questions include concept and error-pattern metadata", () => {
  const [question] = prepareQuestions([{
    ...rawQuestions[0],
    stem: "下列说法不正确的是？",
    explanation: "题眼是免试入学、就近入学、政府保障。",
  }]);

  assert.match(question.concept, /教育法规/);
  assert.ok(question.errorPatterns.includes("reading-mistake"));
  assert.equal(question.chapterMechanic, "law-review");
});

test("knowledge graph preview renders concept mastery, demons, and locked dependencies", () => {
  const graphQuestions = prepareQuestions([
    {
      ...rawQuestions[0],
      id: "law-root",
      concept: "教育法规 · 义务教育法 · 免试入学",
    },
    {
      ...rawQuestions[0],
      id: "law-nearby",
      concept: "教育法规 · 义务教育法 · 就近入学",
      dependencies: ["教育法规 · 义务教育法 · 免试入学"],
    },
    {
      ...rawQuestions[0],
      id: "law-gov",
      concept: "教育法规 · 义务教育法 · 政府保障",
      dependencies: ["教育法规 · 义务教育法 · 就近入学"],
    },
    {
      ...rawQuestions[0],
      id: "law-resident",
      concept: "教育法规 · 义务教育法 · 非户籍入学",
      dependencies: ["教育法规 · 义务教育法 · 政府保障"],
    },
  ]);
  const [chapter] = createStoryChapters(graphQuestions, { requiredMastery: 16 });
  const preview = buildKnowledgeGraphPreview(chapter, graphQuestions, {
    ...initialPlayerState(),
    correctQuestionIds: ["law-root", "law-nearby"],
    mindDemons: {
      "law-gov": {
        id: "demon-law-gov",
        questionId: "law-gov",
        pressure: 3,
      },
    },
  });
  const tree = preview.lines.join("\n");

  assert.equal(preview.topic, "教育法规");
  assert.equal(preview.totalConcepts, 4);
  assert.equal(preview.masteredConcepts, 2);
  assert.equal(preview.demonConcepts, 1);
  assert.equal(preview.lockedConcepts, 1);
  assert.match(tree, /教育法规 · 掌握 2\/4/);
  assert.match(tree, /免试入学 ✓/);
  assert.match(tree, /政府保障 ✗（心魔 1）/);
  assert.match(tree, /非户籍入学 🔒（需先净化 政府保障）/);
});

test("parseQuestionImport accepts arrays or questions payloads and preserves lesson metadata", () => {
  const imported = parseQuestionImport({
    questions: [
      {
        id: "import-1",
        year: "2026",
        type: "单项选择",
        topic: "教育法规",
        stem: "导入题干",
        options: [
          { key: "A", text: "错项" },
          { key: "B", text: "正项" },
        ],
        answer: "B",
        explanation: "导入解析。题眼是导入题眼。",
        lesson: {
          title: "导入讲解",
          sourceRef: "人工清洗 JSON",
          keyPoint: "导入题眼",
        },
      },
    ],
  });

  assert.equal(imported.length, 1);
  assert.equal(imported[0].lesson.title, "导入讲解");
  assert.equal(imported[0].lesson.sourceRef, "人工清洗 JSON");
  assert.equal(imported[0].lesson.keyPoint, "导入题眼");
});

test("prepareQuestions returns an already prepared question bank without rebuilding it", () => {
  const prepared = prepareQuestions(rawQuestions);

  assert.equal(prepareQuestions(prepared), prepared);
});

test("parseQuestionImport accepts a prepared browser runtime bank without classification audit", () => {
  const runtimeQuestions = JSON.parse(JSON.stringify(prepareQuestions(rawQuestions)));
  const payload = {
    sourceType: "browser-runtime-question-bank-v1",
    runtime: { prepared: true },
    questions: runtimeQuestions,
  };

  const imported = parseQuestionImport(payload);

  assert.equal(imported, payload.questions);
  assert.equal(prepareQuestions(imported), imported);
  assert.equal(imported[0].lesson.title, "教育法规 · 2026讲解");
  assert.equal(imported[0].gameplayStatus, "mainline");
});

test("parseQuestionImport rejects malformed imported questions before they enter a run", () => {
  assert.throws(
    () =>
      parseQuestionImport([
        {
          topic: "教育法规",
          stem: "缺答案",
          options: [{ key: "A", text: "A" }],
        },
      ]),
    /第 1 题还没有正解/,
  );

  assert.throws(
    () =>
      parseQuestionImport({
        questions: [
          {
            topic: "教育法规",
            stem: "选项不足",
            options: [{ key: "A", text: "A" }],
            answer: "A",
          },
        ],
      }),
    /第 1 题至少需要 2 个选项/,
  );
});

test("save archives preserve player progress without embedding the built-in question bank", () => {
  const questions = prepareQuestions(rawQuestions.slice(0, 2));
  const chapters = createStoryChapters(questions);
  const player = {
    ...initialPlayerState(),
    seenIntro: true,
    correctQuestionIds: [questions[0].id],
    studiedLessonIds: [questions[0].lesson.id],
  };

  const archive = createSaveArchive({
    questions,
    player,
    selectedChapterId: chapters[1].id,
    scene: "training",
  });
  const restored = parseSaveArchive(archive, { questions });

  assert.equal(archive.type, "xiaoming-academy-save");
  assert.equal("questions" in archive, false);
  assert.equal("questionSource" in archive, false);
  assert.equal(restored.player.seenIntro, true);
  assert.deepEqual(restored.player.correctQuestionIds, [questions[0].id]);
  assert.equal(restored.selectedChapterId, chapters[1].id);
  assert.equal(restored.scene, "training");
});

test("save archive import rejects question-bank payloads because questions are built in", () => {
  assert.throws(
    () => parseSaveArchive({ questions: rawQuestions.slice(0, 1), source: "legacy-bank.json" }),
    /这段内容像题卷，不是存档码/,
  );
});

test("save archive import ignores stale embedded questions and prunes against the built-in bank", () => {
  const [question] = prepareQuestions([rawQuestions[0]]);
  const archive = {
    type: "xiaoming-academy-save",
    player: {
      ...initialPlayerState(),
      studiedLessonIds: [question.lesson.id, "lesson-old"],
      answeredQuestionIds: [question.id, "old"],
    },
    questions: rawQuestions.slice(1, 2),
    selectedChapterId: "missing-chapter",
    scene: "daily",
  };

  const restored = parseSaveArchive(archive, { questions: [question] });

  assert.deepEqual(restored.player.studiedLessonIds, [question.lesson.id]);
  assert.deepEqual(restored.player.answeredQuestionIds, [question.id]);
  assert.equal(restored.selectedChapterId, createStoryChapters([question])[0].id);
  assert.equal(restored.scene, "daily");
});

test("prunePlayerForQuestions removes stale progress when a new question bank is imported", () => {
  const player = {
    ...initialPlayerState(),
    studiedLessonIds: ["lesson-law-1", "lesson-old"],
    answeredQuestionIds: ["law-1", "old"],
    wrongQuestionIds: ["law-1", "old"],
    purifiedDemonIds: ["old"],
    mindDemons: {
      "law-1": { questionId: "law-1", lessonId: "lesson-law-1", pressure: 2 },
      old: { questionId: "old", lessonId: "lesson-old", pressure: 5 },
    },
  };
  const [question] = prepareQuestions([rawQuestions[0]]);

  const pruned = prunePlayerForQuestions(player, [question]);

  assert.deepEqual(pruned.studiedLessonIds, ["lesson-law-1"]);
  assert.deepEqual(pruned.answeredQuestionIds, ["law-1"]);
  assert.deepEqual(pruned.wrongQuestionIds, ["law-1"]);
  assert.deepEqual(pruned.purifiedDemonIds, []);
  assert.deepEqual(Object.keys(pruned.mindDemons), ["law-1"]);
});

test("route runs expose five playable nodes across the four required node types", () => {
  const prepared = prepareQuestions(rawQuestions);
  const run = createRouteRun(prepared, { length: 5 });

  assert.equal(run.state, "route_ready");
  assert.equal(run.nodes.length, 5);
  assert.deepEqual(run.nodes.map((node) => node.type), [
    "normal",
    "elite",
    "recover",
    "treasure",
    "normal",
  ]);
  assert.deepEqual(run.nodes.map((node) => node.questionId), [
    "law-1",
    "psy-1",
    "design-1",
    "ethics-1",
    "class-1",
  ]);
  assert.deepEqual(run.nodes.map((node) => node.lessonId), [
    "lesson-law-1",
    "lesson-psy-1",
    "lesson-design-1",
    "lesson-ethics-1",
    "lesson-class-1",
  ]);
});

test("route question selection keeps each chapter run to the next five unlocked questions", () => {
  const prepared = prepareQuestions(rawQuestions);
  const player = {
    ...initialPlayerState(),
    studiedLessonIds: [prepared[0].lesson.id],
    correctQuestionIds: [prepared[0].id],
  };

  const selected = selectRouteQuestions(prepared, player, { length: 5 });

  assert.equal(selected.length, 5);
  assert.deepEqual(selected.map((question) => question.id), [
    "psy-1",
    "design-1",
    "ethics-1",
    "class-1",
    "child-1",
  ]);
});

test("route question selection enforces concept dependencies before downstream nodes unlock", () => {
  const [base, downstream] = prepareQuestions([
    {
      ...rawQuestions[0],
      id: "law-base",
      concept: "教育法规 · 义务教育法 · 免试入学",
      dependencies: [],
    },
    {
      ...rawQuestions[0],
      id: "law-downstream",
      concept: "教育法规 · 义务教育法 · 政府保障",
      dependencies: ["教育法规 · 义务教育法 · 免试入学"],
    },
  ]);

  const initialSelection = selectRouteQuestions([base, downstream], initialPlayerState(), { length: 2 });
  const unlockedSelection = selectRouteQuestions([base, downstream], {
    ...initialPlayerState(),
    correctQuestionIds: [base.id],
  }, { length: 2 });

  assert.deepEqual(initialSelection.map((question) => question.id), ["law-base"]);
  assert.deepEqual(unlockedSelection.map((question) => question.id), ["law-downstream", "law-base"]);
});

test("roguelite registries expose three run modes and three starter builds", () => {
  assert.deepEqual(rogueliteRunModes.map((mode) => mode.id), ["explore", "purify", "sprint"]);
  assert.deepEqual(rogueliteBuildDefinitions.map((build) => build.id), ["steady", "assault", "review"]);
  assert.ok(rogueliteRunModes.every((mode) => mode.name && mode.primaryAction));
  assert.ok(rogueliteBuildDefinitions.every((build) => build.name && build.risk && build.reward));
});

test("roguelite recommendation chooses exploration for fresh players and purification for active demons", () => {
  const prepared = prepareQuestions(rawQuestions);
  const fresh = createRunRecommendation(prepared, initialPlayerState());

  assert.equal(fresh.modeId, "explore");
  assert.equal(fresh.buildId, "steady");
  assert.match(fresh.reason, /新题眼|手账页|5 题/);
  assert.equal(fresh.title, "今日小目标：点亮题眼");
  assert.equal(fresh.targetText, "今天点亮 5 个题眼");
  assert.equal(fresh.primaryAction, "开一页题眼手账");
  assert.match(fresh.rewardText, /题眼贴纸|书签/);

  const demonPlayer = {
    ...initialPlayerState(),
    wrongQuestionIds: ["psy-1"],
    mindDemons: {
      "psy-1": {
        id: "psy-1",
        questionId: "psy-1",
        topic: "教育心理学",
        enemy: "镜像心魔",
        demonType: "概念混淆",
        pressure: 4,
      },
    },
  };
  const purify = createRunRecommendation(prepared, demonPlayer);

  assert.equal(purify.modeId, "purify");
  assert.equal(purify.buildId, "review");
  assert.match(purify.reason, /心魔|错题|净化/);
});

test("roguelite runs build exploration, purification, and sprint objectives", () => {
  const prepared = prepareQuestions(rawQuestions);
  const demonPlayer = {
    ...initialPlayerState(),
    wrongQuestionIds: ["psy-1"],
    mindDemons: {
      "psy-1": {
        id: "psy-1",
        questionId: "psy-1",
        topic: "教育心理学",
        enemy: "镜像心魔",
        demonType: "概念混淆",
        pressure: 4,
      },
    },
  };

  const explore = createRogueliteRun(prepared, initialPlayerState(), { modeId: "explore", buildId: "steady", length: 5 });
  assert.equal(explore.mode, "roguelite");
  assert.equal(explore.modeId, "explore");
  assert.equal(explore.buildId, "steady");
  assert.equal(explore.nodes.length, 5);
  assert.equal(explore.objective.targetQuestionCount, 5);
  assert.equal(explore.objective.targetCorrectCount, 3);
  assert.ok(explore.nodes.every((node, index) => node.encounterIndex === index + 1));

  const purify = createRogueliteRun(prepared, demonPlayer, { modeId: "purify", buildId: "review", length: 5 });
  assert.equal(purify.modeId, "purify");
  assert.equal(purify.buildId, "review");
  assert.equal(purify.objective.targetDemonCount, 1);
  assert.equal(purify.nodes[0].type, "demon");
  assert.equal(purify.nodes[0].questionId, "psy-1");

  const sprint = createRogueliteRun(prepared, initialPlayerState(), { modeId: "sprint", buildId: "assault", length: 5 });
  assert.equal(sprint.modeId, "sprint");
  assert.equal(sprint.buildId, "assault");
  assert.equal(sprint.objective.targetCorrectCount, 4);
  assert.ok(new Set(sprint.nodes.map((node) => node.topic)).size > 1);
  assert.match(sprint.brief, /混合|冲刺|跨域/);
});

test("roguelite report summarizes result and gives next run actions", () => {
  const prepared = prepareQuestions(rawQuestions);
  const run = createRogueliteRun(prepared, initialPlayerState(), { modeId: "explore", buildId: "steady", length: 5 });
  const answeredRun = {
    ...run,
    state: "report_ready",
    answeredCount: 5,
    correctCount: 3,
    wrongCount: 2,
    completed: true,
    events: [
      {
        isCorrect: false,
        topic: "教育心理学",
        demonType: "概念混淆",
        errorPattern: "concept_confusion",
      },
    ],
  };
  const report = createRogueliteRunReport(answeredRun, initialPlayerState(), prepared);

  assert.equal(report.modeId, "explore");
  assert.equal(report.buildId, "steady");
  assert.equal(report.correctCount, 3);
  assert.equal(report.newDemonCount, 1);
  assert.equal(report.journalSummary.title, "今日手账页完成");
  assert.equal(report.journalSummary.litKeyPoints, 3);
  assert.equal(report.journalSummary.totalKeyPoints, 5);
  assert.equal(report.journalSummary.organizedDemons, 0);
  assert.equal(report.journalSummary.pendingDemons, 1);
  assert.equal(report.journalSummary.bookmark, "稳修");
  assert.match(report.journalSummary.nextSuggestion, /继续整理|心魔|概念混淆/u);
  assert.match(report.primaryMistake, /概念混淆|教育心理学/);
  assert.ok(report.nextActions.some((action) => action.modeId === "purify"));
  assert.ok(report.nextActions.every((action) => action.label && action.reason));
});

test("journal collectibles persist stickers, bookmarks, and fragments", () => {
  const prepared = prepareQuestions(rawQuestions);
  let player = initialPlayerState();
  let run = createRogueliteRun(prepared, player, { modeId: "explore", buildId: "steady", length: 1 });
  const question = prepared.find((item) => item.id === run.nodes[0].questionId);

  const result = applyTrialAnswer(player, run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: question.answer,
    stanceId: "steady",
    bankQuestions: prepared,
    now: new Date("2026-06-23T09:00:00+08:00"),
  });

  assert.equal(result.run.completed, true);
  assert.equal(result.player.journalCollection.stickers.length, 1);
  assert.equal(result.player.journalCollection.stickers[0].questionId, question.id);
  assert.match(result.player.journalCollection.stickers[0].title, /题眼|义务教育|政府保障/u);
  assert.equal(result.player.journalCollection.bookmarks.length, 1);
  assert.equal(result.player.journalCollection.bookmarks[0].title, "稳修");
  assert.equal(result.player.journalCollection.fragments, 1);
});

test("observed correct answers do not count as lit stickers or quest progress", () => {
  const [question] = prepareQuestions(rawQuestions);
  const now = new Date("2026-06-23T09:00:00+08:00");
  const player = {
    ...initialPlayerState(),
    mastery: {
      [question.topic]: 49,
    },
  };
  const run = createRogueliteRun([question], player, { modeId: "explore", buildId: "steady", length: 1 });
  const result = applyTrialAnswer(player, run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: question.answer,
    stanceId: "observe",
    bankQuestions: [question],
    now,
  });
  const report = createRogueliteRunReport(result.run, result.player, [question]);

  assert.equal(result.isCorrect, true);
  assert.equal(result.countsAsLit, false);
  assert.equal(result.run.answeredCount, 1);
  assert.equal(result.run.correctCount, 0);
  assert.equal(result.run.wrongCount, 0);
  assert.equal(result.growthXpGain, 0);
  assert.deepEqual(result.materialsGain, { shuye: 0, moyu: 0 });
  assert.equal(result.heartDelta, 0);
  assert.equal(result.energyDelta, 0);
  assert.equal(result.stanceMasteryGain, 0);
  assert.equal(result.bondGains.qinglan, 0);
  assert.equal(result.player.styleStats.balanced.attempts, 1);
  assert.equal(result.player.styleStats.balanced.correct, 0);
  assert.deepEqual(result.player.correctQuestionIds, []);
  assert.deepEqual(result.player.dailyQuestProgress.correctQuestionIds, []);
  assert.deepEqual(result.player.dailyQuestProgress.resonanceTopicIds, []);
  assert.deepEqual(result.player.weeklyQuestProgress.correctQuestionIds, []);
  assert.deepEqual(result.player.journalCollection.stickers, []);
  assert.deepEqual(result.player.journalCollection.bookmarks, []);
  assert.equal(result.player.journalCollection.fragments, 0);
  assert.equal(report.journalSummary.litKeyPoints, 0);
  assert.equal(report.journalSummary.totalKeyPoints, 1);
});

test("observed-only journal pages recommend review before opening new questions", () => {
  const prepared = prepareQuestions(rawQuestions);
  let player = initialPlayerState();
  let run = createRogueliteRun(prepared, player, { modeId: "explore", buildId: "steady", length: 5 });

  for (const node of run.nodes) {
    const question = prepared.find((item) => item.id === node.questionId);
    const result = applyTrialAnswer(player, run, {
      nodeId: node.id,
      question,
      selectedAnswer: question.answer,
      stanceId: "observe",
      bankQuestions: prepared,
      now: new Date("2026-06-23T09:00:00+08:00"),
    });
    player = result.player;
    run = result.run;
  }

  const report = createRogueliteRunReport(run, player, prepared);

  assert.equal(run.completed, true);
  assert.equal(run.correctCount, 0);
  assert.equal(report.journalSummary.title, "今日手账页待复盘");
  assert.equal(report.journalSummary.litKeyPoints, 0);
  assert.equal(report.journalSummary.totalKeyPoints, 5);
  assert.equal(report.journalSummary.bookmark, "观照记录");
  assert.match(report.journalSummary.nextSuggestion, /本页已点亮 0\/5/u);
  assert.match(report.journalSummary.nextSuggestion, /书签目标 0\/3/u);
  assert.doesNotMatch(report.journalSummary.nextSuggestion, /本页只点亮 0\/3/u);
  assert.equal(report.nextActions[0].label, "回看短课");
  assert.equal(report.nextActions[0].scene, "training");
  assert.match(report.nextActions[0].reason, /距离书签目标还差 3 个/u);
  assert.notEqual(report.nextActions[0].label, "探索新题");
  assert.notEqual(report.nextActions[0].label, "综合冲刺");
});

test("historical demons use historical cleanup wording in report next actions", () => {
  const prepared = prepareQuestions(rawQuestions);
  let player = initialPlayerState();
  let run = createRogueliteRun(prepared, player, { modeId: "explore", buildId: "steady", length: 5 });

  for (const node of run.nodes) {
    const question = prepared.find((item) => item.id === node.questionId);
    const result = applyTrialAnswer(player, run, {
      nodeId: node.id,
      question,
      selectedAnswer: question.answer,
      stanceId: "observe",
      bankQuestions: prepared,
      now: new Date("2026-06-23T09:00:00+08:00"),
    });
    player = result.player;
    run = result.run;
  }

  player = {
    ...player,
    mindDemons: {
      "legacy-law": {
        id: "legacy-law",
        questionId: "legacy-law",
        topic: "教育法规",
        errorType: "审题失误",
        pressure: 2,
        status: "born",
      },
    },
  };

  const report = createRogueliteRunReport(run, player, prepared);
  const purifyAction = report.nextActions.find((action) => action.label === "继续净化");

  assert.equal(report.primaryMistake, "本局没有新增明显错因");
  assert.equal(report.journalSummary.pendingDemons, 0);
  assert.ok(purifyAction);
  assert.match(purifyAction.reason, /仍有历史心魔待整理/u);
  assert.doesNotMatch(purifyAction.reason, /本局出现错因/u);
});

test("run bookmarks and fragments require the page correct target", () => {
  const prepared = prepareQuestions(rawQuestions);
  let player = initialPlayerState();
  let run = createRogueliteRun(prepared, player, { modeId: "explore", buildId: "steady", length: 5 });

  run.nodes.forEach((node, index) => {
    const question = prepared.find((item) => item.id === node.questionId);
    const result = applyTrialAnswer(player, run, {
      nodeId: node.id,
      question,
      selectedAnswer: question.answer,
      stanceId: index === 0 ? "steady" : "observe",
      bankQuestions: prepared,
      now: new Date("2026-06-23T09:00:00+08:00"),
    });
    player = result.player;
    run = result.run;
  });

  const report = createRogueliteRunReport(run, player, prepared);

  assert.equal(run.completed, true);
  assert.equal(run.correctCount, 1);
  assert.equal(player.journalCollection.stickers.length, 1);
  assert.deepEqual(player.journalCollection.bookmarks, []);
  assert.equal(player.journalCollection.fragments, 0);
  assert.equal(report.journalSummary.bookmark, "未获得");
  assert.equal(report.nextActions[0].label, "回看短课");
});

test("roguelite journal summary title follows failed and review-needed results", () => {
  const prepared = prepareQuestions(rawQuestions);
  const run = createRogueliteRun(prepared, initialPlayerState(), { modeId: "explore", buildId: "steady", length: 5 });
  const failedRun = {
    ...run,
    state: "report_ready",
    answeredCount: 5,
    correctCount: 2,
    wrongCount: 3,
    completed: true,
    failed: true,
    events: [
      { isCorrect: false, topic: "教育心理学", demonType: "概念混淆" },
    ],
  };
  const reviewRun = {
    ...failedRun,
    failed: false,
  };
  const unpurifiedReviewRun = {
    ...run,
    modeId: "purify",
    modeName: "净化心魔",
    buildId: "review",
    buildName: "复盘",
    state: "report_ready",
    answeredCount: 5,
    correctCount: 5,
    wrongCount: 0,
    completed: true,
    purifiedDemonIds: [],
    events: [],
  };

  const failedReport = createRogueliteRunReport(failedRun, initialPlayerState(), prepared);
  const reviewReport = createRogueliteRunReport(reviewRun, initialPlayerState(), prepared);
  const unpurifiedReviewReport = createRogueliteRunReport(unpurifiedReviewRun, initialPlayerState(), prepared);

  assert.equal(failedReport.resultLabel, "题阵中断");
  assert.equal(failedReport.journalSummary.title, "题阵中断");
  assert.equal(reviewReport.resultLabel, "今日手账页待复盘");
  assert.equal(reviewReport.journalSummary.title, "今日手账页待复盘");
  assert.equal(unpurifiedReviewReport.resultLabel, "今日手账页待整理");
  assert.equal(unpurifiedReviewReport.journalSummary.title, "今日手账页待整理");
});

test("interrupted roguelite journal reports keep the full page total", () => {
  const prepared = prepareQuestions(rawQuestions);
  const run = createRogueliteRun(prepared, initialPlayerState(), { modeId: "explore", buildId: "steady", length: 5 });
  const interruptedRun = {
    ...run,
    state: "report_ready",
    answeredCount: 2,
    correctCount: 1,
    wrongCount: 1,
    completed: true,
    failed: true,
    events: [
      { isCorrect: true, topic: "教育法规" },
      { isCorrect: false, topic: "教育心理学", demonType: "概念混淆" },
    ],
  };
  const report = createRogueliteRunReport(interruptedRun, initialPlayerState(), prepared);

  assert.equal(report.journalSummary.title, "题阵中断");
  assert.equal(report.journalSummary.litKeyPoints, 1);
  assert.equal(report.journalSummary.totalKeyPoints, 5);
});

test("chapter mechanics are attached to route nodes and alter battle feedback", () => {
  const [lawQuestion] = prepareQuestions([{
    ...rawQuestions[0],
    chapterMechanic: "law-review",
    difficulty: 1,
  }]);
  const [neutralQuestion] = prepareQuestions([{
    ...rawQuestions[0],
    id: "law-neutral",
    chapterMechanic: "chaos-mix",
    difficulty: 1,
  }]);
  const lawRun = createRouteRun([lawQuestion], { length: 1 });
  const neutralRun = createRouteRun([neutralQuestion], { length: 1 });

  const law = applyTrialAnswer(initialPlayerState(), lawRun, {
    nodeId: lawRun.nodes[0].id,
    question: lawQuestion,
    selectedAnswer: "A",
    stanceId: "steady",
  });
  const neutral = applyTrialAnswer(initialPlayerState(), neutralRun, {
    nodeId: neutralRun.nodes[0].id,
    question: neutralQuestion,
    selectedAnswer: "A",
    stanceId: "steady",
  });

  assert.equal(chapterMechanicDefinitions["law-review"].name, "法规审题");
  assert.equal(lawRun.nodes[0].chapterMechanic, "law-review");
  assert.equal(lawRun.nodes[0].mechanicName, "法规审题");
  assert.match(lawRun.nodes[0].mechanicPrompt, /主体|义务词|责任后果/);
  assert.match(law.learningCheck, /法规审题/);
  assert.ok(law.heartDelta < neutral.heartDelta);
});

test("chapter mechanic state materializes the seven designed chapter rules", () => {
  const [lawQuestion, conceptQuestion, timeQuestion, ethicsQuestion, strategyQuestion, memoryQuestion, chaosQuestion] = prepareQuestions([
    { ...rawQuestions[0], id: "law-mechanic", chapterMechanic: "law-review", difficulty: 3 },
    { ...rawQuestions[2], id: "concept-mechanic", chapterMechanic: "concept-maze", errorPatterns: ["concept-confusion"] },
    { ...rawQuestions[2], id: "time-mechanic", chapterMechanic: "time-hourglass", difficulty: 2 },
    { ...rawQuestions[3], id: "ethics-mechanic", chapterMechanic: "ethics-scale" },
    { ...rawQuestions[4], id: "strategy-mechanic", chapterMechanic: "strategy-chain" },
    { ...rawQuestions[5], id: "memory-mechanic", chapterMechanic: "precision-memory" },
    { ...rawQuestions[1], id: "chaos-mechanic", chapterMechanic: "chaos-mix" },
  ]);

  const lawState = buildChapterMechanicState(lawQuestion, initialPlayerState());
  const studiedLawState = buildChapterMechanicState(lawQuestion, {
    ...initialPlayerState(),
    studiedLessonIds: [lawQuestion.lesson.id],
  });
  const conceptState = buildChapterMechanicState(conceptQuestion, initialPlayerState());
  const timeState = buildChapterMechanicState(timeQuestion, initialPlayerState(), { nodeType: "recover" });
  const ethicsState = buildChapterMechanicState(ethicsQuestion, { ...initialPlayerState(), ethicsValue: 6 });
  const strategyState = buildChapterMechanicState(strategyQuestion, initialPlayerState());
  const memoryState = buildChapterMechanicState(memoryQuestion, initialPlayerState());
  const chaosState = buildChapterMechanicState(chaosQuestion, initialPlayerState());

  assert.equal(lawState.displayStem, undefined);
  assert.equal(studiedLawState.displayStem, undefined);
  assert.match(lawState.prompt, /主体|义务词|责任后果/);
  assert.ok(conceptState.optionWarnings.length > 0);
  assert.equal(timeState.timeLimitSeconds, 45);
  assert.equal(timeState.recoverAddsSeconds, 15);
  assert.match(ethicsState.warning, /过高|理想/);
  assert.deepEqual(strategyState.strategySteps.map((step) => step.id), ["safety", "emotion", "facts", "follow-up"]);
  assert.equal(memoryState.exactAnswerRequired, true);
  assert.equal(memoryState.attemptsAllowed, 1);
  assert.equal(chaosState.borrowedMechanic !== "chaos-mix", true);
  assert.equal(chaosState.borrowedMechanicName, chapterMechanicDefinitions[chaosState.borrowedMechanic].name);
  assert.doesNotMatch(chaosState.borrowedMechanicName, /^[a-z-]+$/);
});

test("study is a training path that improves battle feedback without blocking battle", () => {
  const [question] = prepareQuestions(rawQuestions);
  const unstudiedRun = createRouteRun([question], { length: 1 });
  const studiedRun = createRouteRun([question], { length: 1 });
  const player = initialPlayerState();

  const unstudied = applyTrialAnswer(player, unstudiedRun, {
    nodeId: unstudiedRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });
  const studied = studyNode(player, studiedRun, studiedRun.nodes[0].id);
  const studiedBattle = applyTrialAnswer(studied.player, studied.run, {
    nodeId: studiedRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });

  assert.deepEqual(studied.player.studiedLessonIds, ["lesson-law-1"]);
  assert.equal(studied.run.studyCount, 1);
  assert.equal(unstudied.studiedBeforeBattle, false);
  assert.equal(studiedBattle.studiedBeforeBattle, true);
  assert.ok(studiedBattle.masteryGain > unstudied.masteryGain);
  assert.match(studiedBattle.learningCheck, /短课|题眼|讲解/);
});

test("the three stances create real pre-answer tradeoffs", () => {
  assert.deepEqual(stances.map((stance) => stance.id), ["steady", "assault", "observe"]);

  const assault = stances.find((stance) => stance.id === "assault");
  const observe = stances.find((stance) => stance.id === "observe");

  assert.ok(assault.damageMultiplier > 1);
  assert.ok(assault.heartLossMultiplier > 1);
  assert.ok(observe.rewardMultiplier < 1);
  assert.equal(observe.providesHint, true);
});

test("assault correct answers hit harder and pay more spirit pages than steady answers", () => {
  const [question] = prepareQuestions(rawQuestions);
  const steadyRun = createRouteRun([question], { length: 1 });
  const assaultRun = createRouteRun([question], { length: 1 });
  const steadyReady = studyNode(initialPlayerState(), steadyRun, steadyRun.nodes[0].id);
  const assaultReady = studyNode(initialPlayerState(), assaultRun, assaultRun.nodes[0].id);

  const steady = applyTrialAnswer(steadyReady.player, steadyReady.run, {
    nodeId: steadyRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });
  const assault = applyTrialAnswer(assaultReady.player, assaultReady.run, {
    nodeId: assaultRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "assault",
  });

  assert.equal(steady.isCorrect, true);
  assert.equal(assault.isCorrect, true);
  assert.ok(assault.damage > steady.damage);
  assert.ok(assault.spiritPagesGain > steady.spiritPagesGain);
  assert.equal(assault.player.stanceStats.assault, 1);
});

test("roguelite build battle feedback uses the selected visible build name", () => {
  const [question] = prepareQuestions(rawQuestions);
  const run = createRogueliteRun([question], initialPlayerState(), { length: 1, buildId: "steady" });
  const studied = studyNode(initialPlayerState(), run, run.nodes[0].id, { bankQuestions: [question] });
  const result = applyTrialAnswer(initialPlayerState(), run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });

  assert.equal(run.buildName, "稳修");
  assert.match(studied.rewards.styleFeedback, /稳修/u);
  assert.doesNotMatch(studied.rewards.styleFeedback, /均衡派/u);
  assert.match(result.styleFeedback, /稳修/u);
  assert.doesNotMatch(result.styleFeedback, /均衡派/u);
});

test("assault mistakes cost extra heart power and create stronger mind demon pressure", () => {
  const [question] = prepareQuestions(rawQuestions);
  const steadyRun = createRouteRun([question], { length: 1 });
  const assaultRun = createRouteRun([question], { length: 1 });
  const steadyReady = studyNode(initialPlayerState(), steadyRun, steadyRun.nodes[0].id);
  const assaultReady = studyNode(initialPlayerState(), assaultRun, assaultRun.nodes[0].id);

  const steady = applyTrialAnswer(steadyReady.player, steadyReady.run, {
    nodeId: steadyRun.nodes[0].id,
    question,
    selectedAnswer: "A",
    stanceId: "steady",
  });
  const assault = applyTrialAnswer(assaultReady.player, assaultReady.run, {
    nodeId: assaultRun.nodes[0].id,
    question,
    selectedAnswer: "A",
    stanceId: "assault",
  });

  assert.ok(assault.heartDelta < steady.heartDelta);
  assert.ok(
    assault.player.mindDemons["law-1"].pressure >
      steady.player.mindDemons["law-1"].pressure,
  );
  assert.equal(assault.run.assaultMistakes, 1);
});

test("wrong answers create typed mind demons with actionable diagnosis", () => {
  const [question] = prepareQuestions([{
    ...rawQuestions[0],
    stem: "下列说法不正确的是？",
    errorPatterns: ["reading-mistake"],
  }]);
  const run = createRouteRun([question], { length: 1 });
  const result = applyTrialAnswer(initialPlayerState(), run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: "A",
    stanceId: "steady",
    bankQuestions: [question],
  });
  const demon = result.player.mindDemons[question.id];

  assert.equal(demon.errorPattern, "reading-mistake");
  assert.equal(demon.demonType, "迷雾心魔");
  assert.match(demon.enemy, /迷雾心魔/);
  assert.match(demon.diagnosis, /关键词|漏看/);
  assert.match(demon.remedy, /审题|高亮/);
  assert.equal(result.demonProfile.demonType, "迷雾心魔");
  assert.equal(result.run.events[0].errorPattern, "reading-mistake");
});

test("error diagnosis exposes probability bars, error portraits, and retest accuracy", () => {
  const [question] = prepareQuestions([{
    ...rawQuestions[0],
    stem: "下列说法不正确的是？",
    errorPatterns: ["reading-mistake"],
  }]);
  const diagnosis = buildErrorDiagnosis(question, "A");
  const wrongRun = createRouteRun([question], { length: 1 });
  const wrong = applyTrialAnswer(initialPlayerState(), wrongRun, {
    nodeId: wrongRun.nodes[0].id,
    question,
    selectedAnswer: "A",
    stanceId: "steady",
  });
  const reviewRun = createMindDemonRun([question], wrong.player);
  const review = applyTrialAnswer(wrong.player, reviewRun, {
    nodeId: reviewRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });
  const dashboard = createLearningDashboard([question], review.player);

  assert.equal(diagnosis.primary.errorPattern, "reading-mistake");
  assert.equal(diagnosis.primary.probability, 80);
  assert.match(diagnosis.primary.bar, /█|░/);
  assert.equal(wrong.errorDiagnosis.primary.errorPattern, "reading-mistake");
  assert.equal(wrong.player.errorStats["reading-mistake"].wrongAttempts, 1);
  assert.equal(review.player.retestStats.attempts, 1);
  assert.equal(review.player.retestStats.correct, 1);
  assert.equal(dashboard.errorPortrait.find((item) => item.errorPattern === "reading-mistake").percent, 100);
  assert.equal(dashboard.retestAccuracy.percent, 100);
});

test("heart power reaching zero marks the run as failed and ready for report", () => {
  const [question] = prepareQuestions([{ ...rawQuestions[2], difficulty: 5 }]);
  const run = createRouteRun([question], { length: 1 });
  const fragilePlayer = {
    ...initialPlayerState(),
    heartPower: 1,
  };

  const result = applyTrialAnswer(fragilePlayer, run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: "D",
    stanceId: "assault",
  });

  assert.equal(result.player.heartPower, 0);
  assert.equal(result.run.failed, true);
  assert.equal(result.run.state, "report_ready");
});

test("observe gives a question clue before answer but reduces reward", () => {
  const [question] = prepareQuestions(rawQuestions);
  const steadyRun = createRouteRun([question], { length: 1 });
  const observeRun = createRouteRun([question], { length: 1 });
  const steadyReady = studyNode(initialPlayerState(), steadyRun, steadyRun.nodes[0].id);
  const observeReady = studyNode(initialPlayerState(), observeRun, observeRun.nodes[0].id);

  const steady = applyTrialAnswer(steadyReady.player, steadyReady.run, {
    nodeId: steadyRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });
  const observe = applyTrialAnswer(observeReady.player, observeReady.run, {
    nodeId: observeRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "observe",
  });

  assert.match(observe.hint, /政府保障/);
  assert.ok(observe.spiritPagesGain < steady.spiritPagesGain);
});

test("mind demon corridor purifies an old wrong question after two correct reviews", () => {
  const [question] = prepareQuestions(rawQuestions);
  const wrongRun = createRouteRun([question], { length: 1 });
  const wrongReady = studyNode(initialPlayerState(), wrongRun, wrongRun.nodes[0].id);
  const wrong = applyTrialAnswer(wrongReady.player, wrongReady.run, {
    nodeId: wrongRun.nodes[0].id,
    question,
    selectedAnswer: "A",
    stanceId: "steady",
  });

  const firstReviewRun = createMindDemonRun([question], wrong.player);
  const firstReviewReady = studyNode(wrong.player, firstReviewRun, firstReviewRun.nodes[0].id);
  const firstReview = applyTrialAnswer(firstReviewReady.player, firstReviewReady.run, {
    nodeId: firstReviewRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });
  const secondReviewRun = createMindDemonRun([question], firstReview.player);
  const secondReviewReady = studyNode(firstReview.player, secondReviewRun, secondReviewRun.nodes[0].id);
  const secondReview = applyTrialAnswer(secondReviewReady.player, secondReviewReady.run, {
    nodeId: secondReviewRun.nodes[0].id,
    question,
    selectedAnswer: "B",
    stanceId: "steady",
  });

  assert.equal(firstReview.player.mindDemons["law-1"].status, "weakened");
  assert.equal(secondReview.purifiedDemonId, "law-1");
  assert.equal(secondReview.player.mindDemons["law-1"], undefined);
  assert.deepEqual(secondReview.player.purifiedDemonIds, ["law-1"]);
  assert.equal(secondReview.player.dailyQuestProgress.demonPurifications, 1);
});

test("study and correct answers add only same-day daily quest progress", () => {
  const prepared = prepareQuestions(rawQuestions);
  const monday = new Date("2026-06-22T09:00:00+08:00");
  const tuesday = new Date("2026-06-23T09:00:00+08:00");
  let player = initialPlayerState();
  let studyRun = createRogueliteRun(prepared, player, { modeId: "explore", buildId: "steady", length: 3 });

  for (const node of studyRun.nodes) {
    const result = studyNode(player, studyRun, node.id, { bankQuestions: prepared, now: monday });
    player = result.player;
    studyRun = result.run;
  }

  assert.equal(createDailyQuestState(prepared, player, { now: monday }).daily.find((quest) => quest.id === "daily-study").completed, true);
  assert.equal(createDailyQuestState(prepared, player, { now: tuesday }).daily.find((quest) => quest.id === "daily-study").completed, false);

  let battleRun = createRogueliteRun(prepared, player, { modeId: "explore", buildId: "steady", length: 5 });
  for (const node of battleRun.nodes) {
    const question = prepared.find((item) => item.id === node.questionId);
    const result = applyTrialAnswer(player, battleRun, {
      nodeId: node.id,
      question,
      selectedAnswer: question.answer,
      stanceId: "steady",
      bankQuestions: prepared,
      now: monday,
    });
    player = result.player;
    battleRun = result.run;
  }

  assert.equal(createDailyQuestState(prepared, player, { now: monday }).daily.find((quest) => quest.id === "daily-battle").completed, true);
  assert.equal(createDailyQuestState(prepared, player, { now: tuesday }).daily.find((quest) => quest.id === "daily-battle").completed, false);
});

test("correct answers write daily resonance and weekly quest progress", () => {
  const [question] = prepareQuestions(rawQuestions);
  const now = new Date("2026-06-23T09:00:00+08:00");
  const player = {
    ...initialPlayerState(),
    mastery: {
      [question.topic]: 49,
    },
  };
  const run = createRogueliteRun([question], player, { modeId: "explore", buildId: "steady", length: 1 });
  const result = applyTrialAnswer(player, run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: question.answer,
    stanceId: "steady",
    bankQuestions: [question],
    now,
  });

  assert.deepEqual(result.player.dailyQuestProgress.resonanceTopicIds, [question.topic]);
  assert.deepEqual(result.player.weeklyQuestProgress.correctQuestionIds, [question.id]);
  assert.equal(result.player.weeklyQuestProgress.topicCorrectCounts[question.topic], 1);
});

test("run report summarizes stance choices, resources, and next training target", () => {
  const prepared = prepareQuestions(rawQuestions);
  const startedRun = createRouteRun(prepared, { length: 5 });
  let player = initialPlayerState();
  let run = startedRun;

  const answers = ["B", "C", "ABC", "B", "A"];
  const stancesByNode = ["assault", "steady", "observe", "steady", "assault"];

  startedRun.nodes.forEach((node, index) => {
    const studied = studyNode(player, run, node.id);
    player = studied.player;
    run = studied.run;
    const result = applyTrialAnswer(player, run, {
      nodeId: node.id,
      question: prepared[index],
      selectedAnswer: answers[index],
      stanceId: stancesByNode[index],
    });
    player = result.player;
    run = result.run;
  });

  const report = createRunReport(run, player);

  assert.equal(report.correctRate, 60);
  assert.equal(report.answeredCount, 5);
  assert.equal(report.stanceStats.assault, 2);
  assert.ok(report.spiritPagesGain > 0);
  assert.equal(report.nextRecommendation.topic, "班级管理");
  assert.match(report.nextRecommendation.reason, /心魔|错题|薄弱/);
});

test("learning dashboard summarizes progress, error patterns, and review checklist", () => {
  const prepared = prepareQuestions(rawQuestions);
  const player = {
    ...initialPlayerState(),
    studiedLessonIds: [prepared[0].lesson.id, prepared[1].lesson.id],
    correctQuestionIds: [prepared[0].id],
    purifiedDemonIds: [prepared[2].id],
    mindDemons: {
      [prepared[1].id]: {
        questionId: prepared[1].id,
        topic: prepared[1].topic,
        pressure: 4,
        errorPattern: "concept-confusion",
        demonType: "镜像心魔",
        diagnosis: "相似概念混淆。",
        remedy: "做对比表。",
      },
    },
  };
  const dashboard = createLearningDashboard(prepared, player);

  assert.equal(dashboard.questionProgress.studiedCount, 2);
  assert.equal(dashboard.questionProgress.correctCount, 1);
  assert.equal(dashboard.topicTouchStats.touchedCount > 0, true);
  assert.equal(dashboard.topicTouchStats.totalCount, dashboard.chapterStats.totalCount);
  assert.equal(dashboard.demonStats.activeCount, 1);
  assert.equal(dashboard.demonStats.purifiedCount, 1);
  assert.equal(dashboard.errorPatternStats[0].errorPattern, "concept-confusion");
  assert.match(dashboard.reviewItems[0].text, /教育心理学|镜像心魔/);
});

test("learning dashboard suggestion titles use learning domains instead of old chapter labels", () => {
  const prepared = prepareQuestions(rawQuestions);
  const dashboard = createLearningDashboard(prepared, initialPlayerState());

  assert.ok(dashboard.weakestTopic);
  assert.equal(dashboard.weakestTopic.title, dashboard.weakestTopic.topic);
  assert.doesNotMatch(dashboard.weakestTopic.title, /第[一二三四五六七八九十]+章|营|花窗/u);
});

test("daily quest state supports claiming completed rewards and fatigue warning", () => {
  const prepared = prepareQuestions(rawQuestions);
  const now = new Date("2026-06-23T09:00:00+08:00");
  const player = {
    ...initialPlayerState(),
    consecutiveRouteRuns: 3,
    correctQuestionIds: prepared.slice(0, 5).map((question) => question.id),
    purifiedDemonIds: [prepared[2].id],
    dailyQuestProgress: {
      day: "2026-06-23",
      correctQuestionIds: prepared.slice(0, 5).map((question) => question.id),
      studiedLessonIds: [],
      demonPurifications: 1,
    },
    answerTimeSamples: [58, 46, 39],
  };
  const questState = createDailyQuestState(prepared, player, { now });
  const dashboard = createLearningDashboard(prepared, player);

  assert.equal(questState.daily.length, 4);
  assert.deepEqual(questState.weekly.map((quest) => quest.id), [
    "weekly-graph",
    "weekly-demon-sweep",
    "weekly-topic",
  ]);
  assert.equal(questState.fatigue.status, "rest-advised");
  assert.match(questState.fatigue.warning, /休息|连续/);
  assert.match(dashboard.topicCoverageBars[0].bar, /█|░/);
  assert.equal(dashboard.averageTimeTrend.averageSeconds, 47.7);
  assert.match(dashboard.averageTimeTrend.label, /变快|稳定|放慢/);
  const questCopy = [...questState.daily, ...questState.weekly]
    .map((quest) => `${quest.title} ${quest.description} ${quest.rewards?.title || ""}`)
    .join(" ");
  assert.doesNotMatch(questCopy, /净墨|破阵|巡检者|行者|心法共鸣|知识巡检|主题挑战/u);
  assert.match(questCopy, /贴纸|书签|手账|徽章|收藏册/u);

  const claimed = claimDailyQuestReward(prepared, player, "daily-battle", { now });
  const claimedAgain = createDailyQuestState(prepared, claimed.player, { now }).daily.find((quest) => quest.id === "daily-battle");
  assert.equal(claimed.quest.completed, true);
  assert.equal(claimed.quest.claimed, false);
  assert.equal(claimed.reward.materials.shuye, 4);
  assert.equal(claimed.player.materials.shuye, player.materials.shuye + 4);
  assert.equal(claimedAgain.claimed, true);
});

test("daily and weekly quest claims reset on their next cycle", () => {
  const prepared = prepareQuestions(Array.from({ length: 10 }, (_, index) => ({
    ...rawQuestions[index % rawQuestions.length],
    id: `cycle-${index + 1}`,
    stem: `${rawQuestions[index % rawQuestions.length].stem} ${index + 1}`,
  })));
  const player = {
    ...initialPlayerState(),
    correctQuestionIds: prepared.slice(0, 10).map((question) => question.id),
    weeklyQuestProgress: {
      week: "2026-W26",
      correctQuestionIds: prepared.slice(0, 10).map((question) => question.id),
      purifiedDemonIds: [],
      topicCorrectCounts: {},
    },
    dailyQuestProgress: {
      day: "2026-06-22",
      correctQuestionIds: prepared.slice(0, 5).map((question) => question.id),
      studiedLessonIds: [],
      demonPurifications: 0,
    },
  };

  const monday = new Date("2026-06-22T09:00:00+08:00");
  const tuesday = new Date("2026-06-23T09:00:00+08:00");
  const nextMonday = new Date("2026-06-29T09:00:00+08:00");
  const dailyClaimed = claimDailyQuestReward(prepared, player, "daily-battle", { now: monday }).player;
  const weeklyClaimed = claimDailyQuestReward(prepared, dailyClaimed, "weekly-graph", { now: monday }).player;

  assert.equal(createDailyQuestState(prepared, weeklyClaimed, { now: monday }).daily.find((quest) => quest.id === "daily-battle").claimed, true);
  assert.equal(createDailyQuestState(prepared, weeklyClaimed, { now: monday }).weekly.find((quest) => quest.id === "weekly-graph").claimed, true);
  assert.equal(createDailyQuestState(prepared, weeklyClaimed, { now: tuesday }).daily.find((quest) => quest.id === "daily-battle").claimed, false);
  assert.equal(createDailyQuestState(prepared, weeklyClaimed, { now: tuesday }).daily.find((quest) => quest.id === "daily-battle").completed, false);
  assert.equal(createDailyQuestState(prepared, weeklyClaimed, { now: tuesday }).weekly.find((quest) => quest.id === "weekly-graph").claimed, true);
  assert.equal(createDailyQuestState(prepared, weeklyClaimed, { now: nextMonday }).weekly.find((quest) => quest.id === "weekly-graph").claimed, false);
});

test("daily quests ignore cumulative progress from earlier days", () => {
  const prepared = prepareQuestions(rawQuestions);
  const yesterdayProgress = {
    day: "2026-06-22",
    studiedLessonIds: prepared.slice(0, 3).map((question) => question.lesson.id),
    correctQuestionIds: prepared.slice(0, 5).map((question) => question.id),
    demonPurifications: 1,
  };
  const player = {
    ...initialPlayerState(),
    studiedLessonIds: yesterdayProgress.studiedLessonIds,
    correctQuestionIds: yesterdayProgress.correctQuestionIds,
    dailyQuestProgress: yesterdayProgress,
    mindDemons: {
      [prepared[0].id]: {
        id: prepared[0].id,
        questionId: prepared[0].id,
        topic: prepared[0].topic,
        pressure: 2,
      },
    },
  };
  const tuesdayState = createDailyQuestState(prepared, player, { now: new Date("2026-06-23T09:00:00+08:00") });

  assert.equal(tuesdayState.daily.find((quest) => quest.id === "daily-study").progress.current, 0);
  assert.equal(tuesdayState.daily.find((quest) => quest.id === "daily-study").completed, false);
  assert.equal(tuesdayState.daily.find((quest) => quest.id === "daily-battle").progress.current, 0);
  assert.equal(tuesdayState.daily.find((quest) => quest.id === "daily-battle").completed, false);
  assert.equal(tuesdayState.daily.find((quest) => quest.id === "daily-demon").progress.current, 0);
  assert.equal(tuesdayState.daily.find((quest) => quest.id === "daily-demon").completed, false);
});

test("daily resonance uses same-day resonance progress instead of cumulative mastery", () => {
  const prepared = prepareQuestions(rawQuestions);
  const player = {
    ...initialPlayerState(),
    mastery: {
      [prepared[0].topic]: 80,
      [prepared[1].topic]: 72,
    },
    dailyQuestProgress: {
      day: "2026-06-22",
      studiedLessonIds: [],
      correctQuestionIds: [],
      resonanceTopicIds: [prepared[0].topic, prepared[1].topic],
      demonPurifications: 0,
    },
  };
  const tuesdayState = createDailyQuestState(prepared, player, { now: new Date("2026-06-23T09:00:00+08:00") });
  const sameDayPlayer = {
    ...player,
    dailyQuestProgress: {
      ...player.dailyQuestProgress,
      day: "2026-06-23",
    },
  };
  const sameDayState = createDailyQuestState(prepared, sameDayPlayer, { now: new Date("2026-06-23T09:00:00+08:00") });

  assert.equal(tuesdayState.daily.find((quest) => quest.id === "daily-resonance").progress.current, 0);
  assert.equal(tuesdayState.daily.find((quest) => quest.id === "daily-resonance").completed, false);
  assert.equal(sameDayState.daily.find((quest) => quest.id === "daily-resonance").progress.current, 2);
  assert.equal(sameDayState.daily.find((quest) => quest.id === "daily-resonance").completed, true);
});

test("weekly quests use same-week progress instead of cumulative totals", () => {
  const prepared = prepareQuestions(Array.from({ length: 20 }, (_, index) => ({
    ...rawQuestions[0],
    id: `weekly-${index + 1}`,
    stem: `${rawQuestions[0].stem} ${index + 1}`,
  })));
  const player = {
    ...initialPlayerState(),
    correctQuestionIds: prepared.map((question) => question.id),
    purifiedDemonIds: prepared.slice(0, 5).map((question) => question.id),
    weeklyQuestProgress: {
      week: "2026-W26",
      correctQuestionIds: prepared.slice(0, 10).map((question) => question.id),
      purifiedDemonIds: prepared.slice(0, 5).map((question) => question.id),
      topicCorrectCounts: {
        [prepared[0].topic]: 20,
      },
    },
  };
  const currentWeek = createDailyQuestState(prepared, player, { now: new Date("2026-06-22T09:00:00+08:00") }).weekly;
  const nextWeek = createDailyQuestState(prepared, player, { now: new Date("2026-06-29T09:00:00+08:00") }).weekly;

  assert.equal(currentWeek.find((quest) => quest.id === "weekly-graph").progress.current, 10);
  assert.equal(currentWeek.find((quest) => quest.id === "weekly-graph").completed, true);
  assert.equal(currentWeek.find((quest) => quest.id === "weekly-demon-sweep").progress.current, 5);
  assert.equal(currentWeek.find((quest) => quest.id === "weekly-demon-sweep").completed, true);
  assert.equal(currentWeek.find((quest) => quest.id === "weekly-topic").progress.current, 20);
  assert.equal(currentWeek.find((quest) => quest.id === "weekly-topic").completed, true);
  assert.equal(nextWeek.find((quest) => quest.id === "weekly-graph").progress.current, 0);
  assert.equal(nextWeek.find((quest) => quest.id === "weekly-graph").completed, false);
  assert.equal(nextWeek.find((quest) => quest.id === "weekly-demon-sweep").progress.current, 0);
  assert.equal(nextWeek.find((quest) => quest.id === "weekly-demon-sweep").completed, false);
  assert.equal(nextWeek.find((quest) => quest.id === "weekly-topic").progress.current, 0);
  assert.equal(nextWeek.find((quest) => quest.id === "weekly-topic").completed, false);
});

test("daily demon quest is not completed by default when no demons exist", () => {
  const prepared = prepareQuestions(rawQuestions.slice(0, 1));
  const questState = createDailyQuestState(prepared, initialPlayerState());
  const demonQuest = questState.daily.find((quest) => quest.id === "daily-demon");

  assert.equal(demonQuest.progress.current, 0);
  assert.equal(demonQuest.progress.target, 1);
});

test("completed roguelite runs advance fatigue counters", () => {
  const [question] = prepareQuestions(rawQuestions);
  const run = createRogueliteRun([question], initialPlayerState(), { modeId: "explore", buildId: "steady", length: 1 });
  const result = applyTrialAnswer(initialPlayerState(), run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: question.answer,
    stanceId: "steady",
    now: new Date("2026-06-23T09:00:00+08:00"),
  });

  assert.equal(result.run.completed, true);
  assert.equal(result.player.consecutiveRouteRuns, 1);
  assert.equal(result.player.lastRouteRunDay, "2026-06-23");
  assert.equal(
    createDailyQuestState([question], result.player, { now: new Date("2026-06-23T10:00:00+08:00") }).fatigue.consecutiveRouteRuns,
    1,
  );
});

test("fatigue recovers after resting or on a new day", () => {
  const [question] = prepareQuestions(rawQuestions);
  const tiredPlayer = {
    ...initialPlayerState(),
    consecutiveRouteRuns: 3,
    lastRouteRunDay: "2026-06-23",
  };

  assert.equal(createDailyQuestState([question], tiredPlayer, { now: new Date("2026-06-23T22:00:00+08:00") }).fatigue.rewardMultiplier, 0.7);
  assert.equal(createDailyQuestState([question], tiredPlayer, { now: new Date("2026-06-24T09:00:00+08:00") }).fatigue.rewardMultiplier, 1);
  assert.equal(createDailyQuestState([question], tiredPlayer, { now: new Date("2026-06-24T09:00:00+08:00") }).fatigue.consecutiveRouteRuns, 0);

  const rested = restFromFatigue(tiredPlayer, { now: new Date("2026-06-23T22:05:00+08:00") });
  assert.equal(rested.consecutiveRouteRuns, 0);
  assert.equal(rested.lastFatigueRestDay, "2026-06-23");
  assert.equal(createDailyQuestState([question], rested, { now: new Date("2026-06-23T22:06:00+08:00") }).fatigue.rewardMultiplier, 1);
});

test("fatigue starts counting again after same-day rest", () => {
  const [question] = prepareQuestions(rawQuestions);
  let player = restFromFatigue({
    ...initialPlayerState(),
    consecutiveRouteRuns: 3,
    lastRouteRunDay: "2026-06-23",
  }, { now: new Date("2026-06-23T22:05:00+08:00") });

  for (let index = 0; index < 4; index += 1) {
    const run = createRogueliteRun([question], player, { modeId: "explore", buildId: "steady", length: 1 });
    const result = applyTrialAnswer(player, run, {
      nodeId: run.nodes[0].id,
      question,
      selectedAnswer: question.answer,
      stanceId: "steady",
      now: new Date(`2026-06-23T22:${10 + index}:00+08:00`),
    });
    player = result.player;
  }

  assert.equal(player.consecutiveRouteRuns, 4);
  assert.equal(createDailyQuestState([question], player, { now: new Date("2026-06-23T22:20:00+08:00") }).fatigue.rewardMultiplier, 0.7);
});

test("fatigue multiplier reduces battle rewards and answer times are recorded", () => {
  const [question] = prepareQuestions(rawQuestions);
  const restedRun = createRogueliteRun([question], initialPlayerState(), { modeId: "explore", buildId: "steady", length: 1 });
  const tiredPlayer = { ...initialPlayerState(), consecutiveRouteRuns: 3, lastRouteRunDay: "2026-06-23" };
  const tiredRun = createRogueliteRun([question], tiredPlayer, { modeId: "explore", buildId: "steady", length: 1 });
  const rested = applyTrialAnswer(initialPlayerState(), restedRun, {
    nodeId: restedRun.nodes[0].id,
    question,
    selectedAnswer: question.answer,
    stanceId: "steady",
    elapsedSeconds: 42,
  });
  const tired = applyTrialAnswer(tiredPlayer, tiredRun, {
    nodeId: tiredRun.nodes[0].id,
    question,
    selectedAnswer: question.answer,
    stanceId: "steady",
    elapsedSeconds: 37.6,
    now: new Date("2026-06-23T10:00:00+08:00"),
  });

  assert.equal(rested.player.answerTimeSamples.at(-1), 42);
  assert.equal(tired.player.answerTimeSamples.at(-1), 37.6);
  assert.ok(tired.spiritPagesGain < rested.spiritPagesGain);
  assert.ok(tired.growthXpGain < rested.growthXpGain);
  assert.equal(rested.materialsGain.shuye, 1);
  assert.equal(tired.materialsGain.shuye, 1);
});

test("heart methods turn topic mastery into stance bonuses", () => {
  assert.deepEqual(getHeartMethod("教育心理学", 0), {
    topic: "教育心理学",
    name: "观心心法",
    level: 1,
    progress: 0,
    steadyGuardBonus: 0,
    assaultDamageBonus: 0,
    observeHintBonus: 0,
  });
  assert.deepEqual(getHeartMethod("教育心理学", 68), {
    topic: "教育心理学",
    name: "观心心法",
    level: 3,
    progress: 18,
    steadyGuardBonus: 2,
    assaultDamageBonus: 0.1,
    observeHintBonus: 1,
  });
});
