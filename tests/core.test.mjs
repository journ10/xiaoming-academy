import test from "node:test";
import assert from "node:assert/strict";
import {
  applyTrialAnswer,
  buildChapterMechanicState,
  buildErrorDiagnosis,
  buildKnowledgeGraphPreview,
  chapterMechanicDefinitions,
  createDailyQuestState,
  createLearningDashboard,
  createMindDemonRun,
  createRouteRun,
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

test("chapter availability gates sequential chapters and the final comprehensive chapter", () => {
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
  const [first, second, third, fourth, fifth, sixth, final] = chapters;
  const firstSixClears = Object.fromEntries(chapters.slice(0, 6).map((chapter) => [chapter.id, true]));

  assert.equal(chapters.length, 7);
  assert.equal(getChapterAvailability(first, chapters, initialPlayerState()).available, true);
  assert.equal(getChapterAvailability(second, chapters, initialPlayerState()).available, false);
  assert.match(getChapterAvailability(second, chapters, initialPlayerState()).reason, /第一章|律令花窗/);
  assert.equal(getChapterAvailability(final, chapters, initialPlayerState()).available, false);
  assert.match(getChapterAvailability(final, chapters, initialPlayerState()).reason, /前六章/);

  assert.equal(getChapterAvailability(second, chapters, {
    ...initialPlayerState(),
    chapterClears: { [first.id]: true },
  }).available, true);
  assert.equal(getChapterAvailability(third, chapters, {
    ...initialPlayerState(),
    chapterClears: { [first.id]: true },
  }).available, false);
  assert.equal(getChapterAvailability(final, chapters, {
    ...initialPlayerState(),
    chapterClears: firstSixClears,
  }).available, true);

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
  assert.match(dialogue.at(-1).text, /练功|题阵|心魔|封印/);
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

  assert.equal(chapters.at(-1).topic, "综合知识");
  assert.equal(chapters.at(-1).title, "第七章 万象书阁");
  assert.equal(ink.length, 8);
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

  assert.equal(first.rewards.starGlimmerGain > 0, true);
  assert.equal(first.rewards.growthXpGain > 0, true);
  assert.equal(first.rewards.bondGains.azhi > 0, true);
  assert.equal(first.player.starGlimmer, first.rewards.starGlimmerGain);
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
  assert.throws(() => setLearningStyle(initialPlayerState(), "missing-style"), /未知学习风格/);
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
  assert.throws(() => setLearningStyle(initialPlayerState(), "review", { chapters }), /尚未解锁/);
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
    },
  });

  assert.ok(law.spiritPagesGain > balanced.spiritPagesGain);
  assert.equal(law.player.styleStats.law.attempts, 1);
  assert.equal(law.player.styleStats.law.correct, 1);
  assert.equal(dashboard.styleWinRates.find((style) => style.id === "law").winRate, 66.7);
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
  assert.ok(correct.starGlimmerGain > 0);
  assert.ok(correct.growthXpGain > 0);
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
  assert.equal(question.chapterMechanic, "law-fog");
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
    /第 1 题缺少 answer/,
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
    /导入存档只接受存档 JSON，不导入题库/,
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

test("chapter mechanics are attached to route nodes and alter battle feedback", () => {
  const [lawQuestion] = prepareQuestions([{
    ...rawQuestions[0],
    chapterMechanic: "law-fog",
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

  assert.equal(chapterMechanicDefinitions["law-fog"].name, "法条迷雾");
  assert.equal(lawRun.nodes[0].chapterMechanic, "law-fog");
  assert.equal(lawRun.nodes[0].mechanicName, "法条迷雾");
  assert.match(lawRun.nodes[0].mechanicPrompt, /关键词|法条/);
  assert.match(law.learningCheck, /法条迷雾/);
  assert.ok(law.heartDelta < neutral.heartDelta);
});

test("chapter mechanic state materializes the seven designed chapter rules", () => {
  const [lawQuestion, conceptQuestion, timeQuestion, ethicsQuestion, strategyQuestion, memoryQuestion, chaosQuestion] = prepareQuestions([
    { ...rawQuestions[0], id: "law-mechanic", chapterMechanic: "law-fog", difficulty: 3 },
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

  assert.match(lawState.displayStem, /__|＿|□/);
  assert.equal(studiedLawState.displayStem, lawQuestion.stem);
  assert.ok(conceptState.optionWarnings.length > 0);
  assert.equal(timeState.timeLimitSeconds, 45);
  assert.equal(timeState.recoverAddsSeconds, 15);
  assert.match(ethicsState.warning, /过高|理想/);
  assert.deepEqual(strategyState.strategySteps.map((step) => step.id), ["safety", "emotion", "facts", "follow-up"]);
  assert.equal(memoryState.exactAnswerRequired, true);
  assert.equal(memoryState.attemptsAllowed, 1);
  assert.equal(chaosState.borrowedMechanic !== "chaos-mix", true);
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
  assert.match(studiedBattle.learningCheck, /练功|题眼|讲解/);
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

  assert.equal(report.correctRate, 80);
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
  assert.equal(dashboard.demonStats.activeCount, 1);
  assert.equal(dashboard.demonStats.purifiedCount, 1);
  assert.equal(dashboard.errorPatternStats[0].errorPattern, "concept-confusion");
  assert.match(dashboard.reviewItems[0].text, /教育心理学|镜像心魔/);
});

test("daily quest state includes weekly quests, fatigue warning, and dashboard trend bars", () => {
  const prepared = prepareQuestions(rawQuestions);
  const player = {
    ...initialPlayerState(),
    consecutiveRouteRuns: 3,
    correctQuestionIds: [prepared[0].id, prepared[1].id],
    purifiedDemonIds: [prepared[2].id],
    answerTimeSamples: [58, 46, 39],
  };
  const questState = createDailyQuestState(prepared, player);
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
