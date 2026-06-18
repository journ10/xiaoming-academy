export const stances = [
  {
    id: "steady",
    name: "稳破",
    shortName: "稳",
    description: "正常伤害、正常收益，失误时心力损失较低。",
    damageMultiplier: 1,
    rewardMultiplier: 1,
    heartLossMultiplier: 1,
    demonPressureMultiplier: 1,
    providesHint: false,
  },
  {
    id: "assault",
    name: "强攻",
    shortName: "攻",
    description: "提高伤害和灵页，答错时心力与心魔压迫加重。",
    damageMultiplier: 1.55,
    rewardMultiplier: 1.5,
    heartLossMultiplier: 2,
    demonPressureMultiplier: 2,
    providesHint: false,
  },
  {
    id: "observe",
    name: "观照",
    shortName: "观",
    description: "显示题眼提示，收益降低，适合先确认讲解记忆。",
    damageMultiplier: 0.72,
    rewardMultiplier: 0.58,
    heartLossMultiplier: 0.65,
    demonPressureMultiplier: 0.65,
    providesHint: true,
  },
];

export const materialTypes = [
  { id: "shuye", name: "书页", assetId: "item.shuye" },
  { id: "xingsha", name: "星砂", assetId: "item.xingsha" },
  { id: "moyu", name: "墨玉", assetId: "item.moyu" },
  { id: "lingqian", name: "灵签", assetId: "item.lingqian" },
];

export const artifactDefinitions = [
  {
    id: "biling",
    name: "碧灵笔",
    assetId: "artifact.biling",
    description: "强化练功收益，让题眼更容易转化为心法经验。",
    maxLevel: 5,
    baseCost: { shuye: 8, xingsha: 2, moyu: 0, lingqian: 0 },
  },
  {
    id: "yanling",
    name: "言灵铃",
    assetId: "artifact.yanling",
    description: "强化答对反馈，提升连破时的星辉与羁绊感。",
    maxLevel: 5,
    baseCost: { shuye: 10, xingsha: 3, moyu: 0, lingqian: 1 },
  },
  {
    id: "zhiling",
    name: "知灵佩",
    assetId: "artifact.zhiling",
    description: "强化观照招式，帮助玩家从讲解中抓住题眼。",
    maxLevel: 5,
    baseCost: { shuye: 6, xingsha: 4, moyu: 1, lingqian: 0 },
  },
  {
    id: "moling",
    name: "墨灵镜",
    assetId: "artifact.moling",
    description: "强化心魔回廊，降低错题反噬并提高净化收益。",
    maxLevel: 5,
    baseCost: { shuye: 12, xingsha: 2, moyu: 2, lingqian: 1 },
  },
];

export const nodeTypes = {
  normal: {
    id: "normal",
    name: "常阵",
    description: "标准检验节点。",
    assetId: "node.normal",
    nodeFlavor: "灯门初启，适合稳定检验刚学会的题眼。",
    rewardMultiplier: 1,
    pressureMultiplier: 1,
    damageMultiplier: 1,
    heartRecovery: 0,
    materialRewards: { shuye: 1 },
  },
  elite: {
    id: "elite",
    name: "锐阵",
    description: "奖励更高，失误压迫更强。",
    assetId: "node.elite",
    nodeFlavor: "封亭压阵，答对会把薄弱点直接打亮。",
    rewardMultiplier: 1.35,
    pressureMultiplier: 1.35,
    damageMultiplier: 1.18,
    heartRecovery: 0,
    materialRewards: { shuye: 2, xingsha: 1 },
  },
  recover: {
    id: "recover",
    name: "息阵",
    description: "奖励较低，答对后恢复心力。",
    assetId: "node.recover",
    nodeFlavor: "莲盏回息，用低压检验稳固度并回复心力。",
    rewardMultiplier: 0.78,
    pressureMultiplier: 0.82,
    damageMultiplier: 0.92,
    heartRecovery: 1,
    materialRewards: { shuye: 1 },
  },
  treasure: {
    id: "treasure",
    name: "宝阵",
    description: "灵页奖励更高。",
    assetId: "node.treasure",
    nodeFlavor: "秘箱浮光，适合用已掌握题目换取成长资源。",
    rewardMultiplier: 1.6,
    pressureMultiplier: 1,
    damageMultiplier: 1,
    heartRecovery: 0,
    materialRewards: { shuye: 2, xingsha: 2 },
  },
  demon: {
    id: "demon",
    name: "心魔回廊",
    description: "复训错题，连续答对可净化。",
    assetId: "node.demon",
    nodeFlavor: "墨符低鸣，只收留答错后真正需要复训的题。",
    rewardMultiplier: 1.1,
    pressureMultiplier: 1.2,
    damageMultiplier: 1,
    heartRecovery: 0,
    materialRewards: { moyu: 1 },
  },
  mystery: {
    id: "mystery",
    name: "奇遇",
    description: "低压检验，奖励偏向稀有材料。",
    assetId: "node.mystery",
    nodeFlavor: "月雾藏题，偶尔会把讲解里的暗线翻出来。",
    rewardMultiplier: 1.12,
    pressureMultiplier: 0.92,
    damageMultiplier: 1,
    heartRecovery: 0,
    materialRewards: { shuye: 1, moyu: 1 },
  },
  resonance: {
    id: "resonance",
    name: "共鸣",
    description: "根据心法掌握度放大奖励。",
    assetId: "node.resonance",
    nodeFlavor: "双环相扣，题眼和心法越熟，收益越明显。",
    rewardMultiplier: 1.25,
    pressureMultiplier: 0.95,
    damageMultiplier: 1.08,
    heartRecovery: 0,
    materialRewards: { xingsha: 2 },
    resonanceMultiplier: 1.2,
  },
  trial: {
    id: "trial",
    name: "试炼",
    description: "高压高奖，用来验证章节熟练度。",
    assetId: "node.trial",
    nodeFlavor: "试炼印开启，适合在练功后冲击章节星印。",
    rewardMultiplier: 1.85,
    pressureMultiplier: 1.55,
    damageMultiplier: 1.28,
    heartRecovery: 0,
    materialRewards: { shuye: 3, xingsha: 1, lingqian: 1 },
  },
};

export const storyCharacters = [
  {
    id: "mingche",
    name: "明澈",
    role: "书院导师",
    specialty: "序章说明与战报点评",
    art: "art-character-mingche",
  },
  {
    id: "azhi",
    name: "阿芷",
    role: "练功同伴",
    specialty: "题眼摘记与讲解陪练",
    art: "art-character-azhi",
  },
  {
    id: "qinglan",
    name: "青岚",
    role: "破阵同伴",
    specialty: "答对反馈与连破鼓励",
    art: "art-character-qinglan",
  },
  {
    id: "xiaomo",
    name: "小墨",
    role: "秘卷灵",
    specialty: "心魔回廊与章节封印",
    art: "art-character-xiaomo",
  },
];

const routePattern = ["normal", "elite", "recover", "treasure", "normal", "mystery", "resonance", "trial", "demon"];
const defaultBonds = {
  mingche: 0,
  azhi: 0,
  qinglan: 0,
  xiaomo: 0,
};
const defaultMaterials = Object.fromEntries(materialTypes.map((material) => [material.id, 0]));
const defaultStanceMastery = Object.fromEntries(stances.map((stance) => [stance.id, { xp: 0, level: 1 }]));

const storyChapterTemplates = [
  {
    id: "chapter-law",
    topic: "教育法规",
    title: "第一章 律令花窗",
    characterId: "mingche",
    summary: "从法条关键词开始，修复秘卷最外层的入门封印。",
  },
  {
    id: "chapter-psychology",
    topic: "教育心理学",
    title: "第二章 观心花园",
    characterId: "azhi",
    summary: "把学习、动机和迁移的题眼整理成可复用的心法。",
  },
  {
    id: "chapter-design",
    topic: "教学设计",
    title: "第三章 授业工坊",
    characterId: "qinglan",
    summary: "用目标、学情、活动和评价拆解教案类题目。",
  },
  {
    id: "chapter-ethics",
    topic: "教师职业道德",
    title: "第四章 师德星廊",
    characterId: "mingche",
    summary: "辨认师德场景边界，清理容易误判的表述。",
  },
  {
    id: "chapter-classroom",
    topic: "班级管理",
    title: "第五章 统御回廊",
    characterId: "qinglan",
    summary: "把安全、情绪、事实和跟进顺序练成稳定判断。",
  },
  {
    id: "chapter-child",
    topic: "儿童发展",
    title: "第六章 童心星谷",
    characterId: "xiaomo",
    summary: "理解儿童发展特点，点亮秘卷最后一枚星印。",
  },
];

const chapterNarrativeBeats = {
  "chapter-law": [
    ["mingche", "律令花窗是书院最外层的防护。若这里失光，后面的秘境都会被遗忘之雾慢慢抹去。"],
    ["azhi", "我在窗棂边看见一缕黑墨。它不像雾，倒像有人故意留下的笔迹。"],
    ["qinglan", "那就先把题阵打亮。答案落稳，花窗才会告诉我们它到底藏了什么。"],
  ],
  "chapter-psychology": [
    ["azhi", "观心花园会照出你答题时的犹豫。不要害怕，犹豫通常说明题眼还没被你抓住。"],
    ["qinglan", "这里的心魔擅长把选项搅乱。先练功，再进阵，我不想看你被镜子骗第二次。"],
    ["xiaomo", "黑墨在镜面里说话了。它写着：面对错题，不要逃避。"],
  ],
  "chapter-design": [
    ["qinglan", "授业工坊不是考你背模板，而是考你能不能把目标、学情、活动和评价连起来。"],
    ["azhi", "如果把讲解拆成步骤，教案题就不会像一团线。我们从题眼开始理。"],
    ["mingche", "异常心魔第一次出现在这里。它不像敌人，更像某位前辈留下的投影。"],
  ],
  "chapter-ethics": [
    ["mingche", "师德星廊的题不会只问对错，它会问你在具体场景里守住哪条边界。"],
    ["xiaomo", "心魔回廊原本不是惩罚室。它是给巡游者回头看错题的地方。"],
    ["azhi", "我以前也在这里哭过。后来我明白，错题不是把人困住，是在等人回来。"],
  ],
  "chapter-classroom": [
    ["qinglan", "统御回廊考的是顺序。先安全和情绪，再事实和沟通，最后才是处理结果。"],
    ["mingche", "黑墨越来越清楚。那位前辈不是要毁掉书院，而是在筛选能承担秘卷的人。"],
    ["xiaomo", "继续走。你已经能听见心魔背后的提醒了。"],
  ],
  "chapter-child": [
    ["xiaomo", "童心星谷是最后一处。这里的心魔最轻，却最容易被大人忽略。"],
    ["azhi", "理解孩子的发展，不是降低要求，是知道怎样把要求递到他们够得到的地方。"],
    ["mingche", "全库通关后，创始人的试炼会真正开启。那时书院会承认你是新的守卷人。"],
  ],
};

export function initialPlayerState() {
  return {
    playerLevel: 1,
    growthXp: 0,
    starGlimmer: 0,
    energy: 12,
    maxEnergy: 12,
    heartPower: 6,
    maxHeartPower: 6,
    spiritPages: 0,
    materials: { ...defaultMaterials },
    artifacts: createInitialArtifacts(),
    stanceMastery: normalizeStanceMastery(),
    streak: 0,
    seenIntro: false,
    bonds: { ...defaultBonds },
    storyFlags: {},
    mastery: {},
    studiedLessonIds: [],
    answeredQuestionIds: [],
    correctQuestionIds: [],
    wrongQuestionIds: [],
    mindDemons: {},
    purifiedDemonIds: [],
    chapterClears: {},
    stanceStats: {
      steady: 0,
      assault: 0,
      observe: 0,
    },
  };
}

export function prepareQuestions(rawQuestions = []) {
  return rawQuestions.map((raw, index) => {
    const topic = String(raw.topic || "综合知识");
    const profile = getTopicProfile(topic);
    const options = normalizeOptions(raw.options);
    const id = String(raw.id || `question-${index + 1}`);
    const difficulty = clamp(Number(raw.difficulty || inferDifficulty(raw)), 1, 5);
    const explanation = String(raw.explanation || raw.analysis || "暂无讲解。");
    const lesson = normalizeLesson(raw.lesson, {
      id,
      topic,
      year: raw.year,
      explanation,
      sourceRef: raw.sourceRef,
    });

    return {
      ...raw,
      id,
      year: String(raw.year || "未标注"),
      type: String(raw.type || "练习题"),
      topic,
      stem: String(raw.stem || "题干待补充"),
      options,
      answer: normalizeAnswer(raw.answer, options),
      explanation,
      difficulty,
      realm: String(raw.realm || `${raw.year || "今日"} ${profile.realm}`),
      enemy: String(raw.enemy || profile.enemy),
      heartMethod: String(raw.heartMethod || profile.method),
      lesson,
    };
  });
}

export function parseQuestionImport(payload) {
  const rawQuestions = Array.isArray(payload) ? payload : payload?.questions;
  if (!Array.isArray(rawQuestions) || !rawQuestions.length) {
    throw new Error("JSON 需要是题目数组或包含 questions 数组");
  }

  return prepareQuestions(rawQuestions.map((raw, index) => validateImportedQuestion(raw, index)));
}

export function createSaveArchive({
  questions = [],
  player = initialPlayerState(),
  selectedChapterId = "",
  scene = "world",
} = {}) {
  const preparedQuestions = questions.length ? prepareQuestions(questions) : [];
  const chapters = createStoryChapters(preparedQuestions);

  return {
    type: "xiaoming-academy-save",
    version: 1,
    exportedAt: new Date().toISOString(),
    selectedChapterId: chapters.length ? resolveArchiveChapterId(chapters, selectedChapterId) : String(selectedChapterId || ""),
    scene: String(scene || "world"),
    player: preparedQuestions.length
      ? prunePlayerForQuestions({ ...initialPlayerState(), ...(player || {}) }, preparedQuestions)
      : { ...initialPlayerState(), ...(player || {}) },
  };
}

export function parseSaveArchive(payload, options = {}) {
  if (!payload || typeof payload !== "object") {
    throw new Error("JSON 需要是小明书院存档或题库数据");
  }
  if (Array.isArray(payload) || (payload.questions && !payload.player)) {
    throw new Error("导入存档只接受存档 JSON，不导入题库");
  }
  if (payload.type && payload.type !== "xiaoming-academy-save") {
    throw new Error("存档类型不匹配");
  }

  const contextQuestions = Array.isArray(options) ? options : options.questions || [];
  const preparedQuestions = contextQuestions.length ? prepareQuestions(contextQuestions) : [];
  const chapters = createStoryChapters(preparedQuestions);
  const mergedPlayer = { ...initialPlayerState(), ...(payload.player || payload) };
  const player = preparedQuestions.length ? prunePlayerForQuestions(mergedPlayer, preparedQuestions) : mergedPlayer;

  return {
    type: "xiaoming-academy-save",
    version: Number(payload.version || 1),
    selectedChapterId: chapters.length
      ? resolveArchiveChapterId(chapters, payload.selectedChapterId)
      : String(payload.selectedChapterId || ""),
    scene: String((!Array.isArray(payload) && payload.scene) || "world"),
    player,
  };
}

export function prunePlayerForQuestions(player, questions) {
  const questionIds = new Set(questions.map((question) => question.id));
  const lessonIds = new Set(questions.map((question) => question.lesson.id));
  const chapterIds = new Set(createStoryChapters(questions).map((chapter) => chapter.id));
  const nextMindDemons = {};

  Object.entries(player.mindDemons || {}).forEach(([id, demon]) => {
    if (questionIds.has(demon.questionId || id)) {
      nextMindDemons[id] = demon;
    }
  });

  return {
    ...player,
    studiedLessonIds: (player.studiedLessonIds || []).filter((id) => lessonIds.has(id)),
    answeredQuestionIds: (player.answeredQuestionIds || []).filter((id) => questionIds.has(id)),
    correctQuestionIds: (player.correctQuestionIds || []).filter((id) => questionIds.has(id)),
    wrongQuestionIds: (player.wrongQuestionIds || []).filter((id) => questionIds.has(id)),
    purifiedDemonIds: (player.purifiedDemonIds || []).filter((id) => questionIds.has(id)),
    mindDemons: nextMindDemons,
    chapterClears: Object.fromEntries(
      Object.entries(player.chapterClears || {}).filter(([chapterId]) => chapterIds.has(chapterId)),
    ),
  };
}

function resolveArchiveChapterId(chapters, selectedChapterId) {
  const id = String(selectedChapterId || "");
  return chapters.some((chapter) => chapter.id === id) ? id : chapters[0]?.id || "";
}

export function createStoryChapters(questions = [], options = {}) {
  const prepared = prepareQuestions(questions);
  const byTopic = new Map();

  prepared.forEach((question) => {
    if (!byTopic.has(question.topic)) byTopic.set(question.topic, []);
    byTopic.get(question.topic).push(question);
  });

  const orderedTopics = [
    ...storyChapterTemplates.map((template) => template.topic).filter((topic) => byTopic.has(topic)),
    ...[...byTopic.keys()].filter(
      (topic) => !storyChapterTemplates.some((template) => template.topic === topic),
    ),
  ];

  return orderedTopics.map((topic, index) => {
    const template = storyChapterTemplates.find((item) => item.topic === topic);
    const chapterQuestions = byTopic.get(topic) || [];
    const order = index + 1;
    const requiredMastery = clamp(
      Number(options.requiredMastery ?? calculateChapterMasteryRequirement(chapterQuestions.length)),
      1,
      100,
    );

    return {
      id: template?.id || `chapter-${order}-${slugTopic(topic)}`,
      order,
      topic,
      title: template?.title || `第${order}章 ${topic}`,
      summary: template?.summary || `整理${topic}题眼，完成本章学习与战斗检验。`,
      characterId: template?.characterId || storyCharacters[index % storyCharacters.length].id,
      questionIds: chapterQuestions.map((question) => question.id),
      lessonIds: chapterQuestions.map((question) => question.lesson.id),
      requiredMastery,
      sealIcon: "art-chapter-seal",
    };
  });
}

export function getChapterProgress(chapter, questions = [], player = initialPlayerState()) {
  const prepared = prepareQuestions(questions);
  const chapterQuestionIds = new Set(
    chapter.questionIds?.length
      ? chapter.questionIds
      : prepared.filter((question) => question.topic === chapter.topic).map((question) => question.id),
  );
  const chapterQuestions = prepared.filter((question) => chapterQuestionIds.has(question.id));
  const studiedLessonIds = new Set(player.studiedLessonIds || []);
  const correctQuestionIds = new Set(player.correctQuestionIds || []);
  const activeDemonIds = new Set(
    Object.values(player.mindDemons || {}).map((demon) => demon.questionId || demon.id),
  );
  const mastery = clamp(Number(player.mastery?.[chapter.topic] || 0), 0, 100);
  const requiredMastery = clamp(Number(chapter.requiredMastery || 1), 1, 100);
  const storySeen = Boolean(player.storyFlags?.[chapter.id]);
  const studiedCount = chapterQuestions.filter((question) => studiedLessonIds.has(question.lesson.id)).length;
  const correctCount = chapterQuestions.filter((question) => correctQuestionIds.has(question.id)).length;
  const demonCount = chapterQuestions.filter((question) => activeDemonIds.has(question.id)).length;
  const total = chapterQuestions.length;
  const cleared =
    total > 0 &&
    storySeen &&
    studiedCount === total &&
    correctCount === total &&
    demonCount === 0 &&
    mastery >= requiredMastery;

  return {
    chapterId: chapter.id,
    topic: chapter.topic,
    total,
    storySeen,
    studiedCount,
    correctCount,
    demonCount,
    mastery,
    requiredMastery,
    cleared,
  };
}

export function isChapterCleared(chapter, questions = [], player = initialPlayerState()) {
  return getChapterProgress(chapter, questions, player).cleared;
}

export function getChapterActionState(chapter, questions = [], player = initialPlayerState()) {
  const progress = getChapterProgress(chapter, questions, player);
  let recommendedAction = "battle";
  let reason = "进入题阵，用答案检验本章题眼。";

  if (progress.cleared) {
    recommendedAction = "cleared";
    reason = "章节封印已点亮，可以继续下一章。";
  } else if (!player.storyFlags?.[chapter.id]) {
    recommendedAction = "story";
    reason = "先触发本章剧情，明确这章要修复的秘卷裂隙。";
  } else if (progress.demonCount > 0) {
    recommendedAction = "review";
    reason = "本章有活跃心魔，先复训净化再推进封印。";
  } else if (progress.studiedCount < progress.total) {
    recommendedAction = "training";
    reason = "先练功读题眼，让战斗变成检验而不是硬猜。";
  } else if (progress.correctCount < progress.total || progress.mastery < progress.requiredMastery) {
    recommendedAction = "battle";
    reason = "已完成练功，进入题阵检验掌握度。";
  }

  return {
    ...progress,
    recommendedAction,
    reason,
  };
}

export function getDialogueForChapter(chapter, player = initialPlayerState()) {
  const lead = getStoryCharacter(chapter.characterId);
  const state = player.chapterClears?.[chapter.id] ? "cleared" : player.storyFlags?.[chapter.id] ? "returning" : "opening";
  const common = [
    dialogueLine("mingche", `秘卷在“${chapter.title}”失去光泽。本章要把“${chapter.topic}”的题眼重新嵌回星印。`),
    dialogueLine("azhi", `我会先把讲解拆成短课。记住关键句后，再让青岚带你进题阵检验。`),
  ];

  if (state === "cleared") {
    return [
      dialogueLine("xiaomo", `这一章的封印已经亮了。错题心魔也安静下来，秘卷的字迹正在复原。`),
      dialogueLine(lead.id, `继续巡游下一处裂隙吧。真正的通关，是整本题库都能稳稳答对。`),
    ];
  }

  return [
    ...common,
    ...getChapterNarrativeLines(chapter),
    dialogueLine(lead.id, state === "opening"
      ? `${chapter.summary} 先练功，再破阵；答错不会失去希望，但会留下需要净化的心魔。`
      : `本章还没完全点亮。看行动提示，缺练功就练功，缺检验就战斗，有心魔就回廊净化。`),
  ];
}

export function isBankMastered(questions = [], player = initialPlayerState(), options = {}) {
  const chapters = createStoryChapters(questions, options);
  return chapters.length > 0 && chapters.every((chapter) => isChapterCleared(chapter, questions, player));
}

export function markIntroSeen(player) {
  return {
    ...player,
    seenIntro: true,
  };
}

export function markChapterStorySeen(player, chapterId) {
  return {
    ...player,
    storyFlags: {
      ...(player.storyFlags || {}),
      [chapterId]: true,
    },
  };
}

export function getEnergyState(player = initialPlayerState()) {
  const energy = clamp(Number(player.energy ?? 0), 0, Number(player.maxEnergy || 12));
  const maxEnergy = Number(player.maxEnergy || 12);
  return {
    energy,
    maxEnergy,
    percent: Math.round((energy / maxEnergy) * 100),
    status: energy <= Math.ceil(maxEnergy * 0.28) ? "low" : energy >= maxEnergy ? "full" : "ready",
  };
}

export function getPlayerTitle(player = initialPlayerState()) {
  const xp = Number(player.growthXp || 0);
  if (xp >= 520) return "秘卷归元者";
  if (xp >= 320) return "题阵行者";
  if (xp >= 120) return "秘卷见习";
  return "初入书院";
}

export function createRouteRun(questions, options = {}) {
  const length = Number(options.length || 5);
  const selected = questions.slice(0, length);
  const nodes = selected.map((question, index) => {
    const type = routePattern[index % routePattern.length];
    return createNode(question, index, type);
  });

  return createRun({
    mode: "route",
    title: options.title || "今日破阵",
    nodes,
  });
}

export function createMindDemonRun(questions, player, options = {}) {
  const wrongIds = new Set(player.wrongQuestionIds || []);
  const selected = questions.filter((question) => wrongIds.has(question.id));
  const nodes = selected.map((question, index) => createNode(question, index, "demon"));

  return createRun({
    mode: "demon",
    title: options.title || "心魔回廊",
    nodes,
  });
}

export function studyNode(player, run, nodeId, options = {}) {
  const node = getRunNode(run, nodeId);
  const wasStudied = (player.studiedLessonIds || []).includes(node.lessonId);
  const rewards = calculateStudyRewards(wasStudied);
  const studiedLessonIds = unique([...(player.studiedLessonIds || []), node.lessonId]);
  const nodes = run.nodes.map((item) =>
    item.id === nodeId
      ? { ...item, studied: true, status: item.status === "answered" ? "answered" : "studied" }
      : item,
  );
  const nextGrowthXp = Number(player.growthXp || 0) + rewards.growthXpGain;
  const nextPlayer = updateChapterClears({
    ...player,
    playerLevel: calculatePlayerLevel(nextGrowthXp),
    growthXp: nextGrowthXp,
    starGlimmer: Number(player.starGlimmer || 0) + rewards.starGlimmerGain,
    materials: addMaterials(player.materials, rewards.materialsGain),
    bonds: applyBondGains(player.bonds, rewards.bondGains),
    studiedLessonIds,
  }, options.bankQuestions || [], options.chapterOptions || {});

  return {
    player: nextPlayer,
    run: {
      ...run,
      nodes,
      state: run.state === "report_ready" ? run.state : "training",
      studyCount: nodes.filter((item) => item.studied).length,
    },
    rewards,
  };
}

export function applyTrialAnswer(player, run, action) {
  const node = getRunNode(run, action.nodeId);
  const stance = getStance(action.stanceId);
  const question = prepareQuestions([action.question])[0];
  const nodeConfig = nodeTypes[node.type] || nodeTypes.normal;
  const normalizedSelected = normalizeAnswer(action.selectedAnswer, question.options);
  const isCorrect = normalizedSelected === question.answer;
  const studiedBeforeBattle = (player.studiedLessonIds || []).includes(node.lessonId);
  const method = getHeartMethod(question.topic, player.mastery?.[question.topic] || 0);
  const damage = calculateDamage({ question, stance, nodeConfig, method, isCorrect, studiedBeforeBattle });
  const heartDelta = calculateHeartDelta({ question, stance, nodeConfig, method, isCorrect });
  const spiritPagesGain = calculateSpiritPages({ question, stance, nodeConfig, isCorrect, studiedBeforeBattle });
  const materialsGain = calculateMaterialsGain({ question, nodeConfig, isCorrect, studiedBeforeBattle });
  const masteryGain = calculateMasteryGain({ question, isCorrect, studiedBeforeBattle });
  const stanceMasteryGain = calculateStanceMasteryGain({ question, nodeConfig, isCorrect, studiedBeforeBattle });
  const demonResult = updateMindDemon(player, question, {
    isCorrect,
    normalizedSelected,
    stance,
    nodeConfig,
  });
  const nextHeartPower = clamp((player.heartPower ?? 6) + heartDelta, 0, player.maxHeartPower || 6);
  const nextMastery = {
    ...(player.mastery || {}),
    [question.topic]: clamp((player.mastery?.[question.topic] || 0) + masteryGain, 0, 100),
  };
  const nextStanceStats = {
    steady: player.stanceStats?.steady || 0,
    assault: player.stanceStats?.assault || 0,
    observe: player.stanceStats?.observe || 0,
    [stance.id]: (player.stanceStats?.[stance.id] || 0) + 1,
  };
  const nextWrongIds = isCorrect
    ? demonResult.purifiedDemonId
      ? (player.wrongQuestionIds || []).filter((id) => id !== question.id)
      : [...(player.wrongQuestionIds || [])]
    : unique([...(player.wrongQuestionIds || []), question.id]);
  const nextPurifiedIds = demonResult.purifiedDemonId
    ? unique([...(player.purifiedDemonIds || []), demonResult.purifiedDemonId])
    : [...(player.purifiedDemonIds || [])];
  const starGlimmerGain = calculateBattleStarGlimmer({ question, isCorrect, studiedBeforeBattle });
  const growthXpGain = calculateBattleGrowthXp({ question, isCorrect, studiedBeforeBattle });
  const bondGains = calculateBattleBondGains({
    isCorrect,
    purifiedDemonId: demonResult.purifiedDemonId,
  });
  const nextGrowthXp = Number(player.growthXp || 0) + growthXpGain;
  const nextCorrectQuestionIds = isCorrect
    ? unique([...(player.correctQuestionIds || []), question.id])
    : [...(player.correctQuestionIds || [])];
  const energyDelta = calculateEnergyDelta({ isCorrect, stance });
  const nextEnergy = clamp(
    Number(player.energy ?? player.maxEnergy ?? 12) + energyDelta,
    0,
    Number(player.maxEnergy || 12),
  );

  const nextPlayer = updateChapterClears({
    ...player,
    playerLevel: calculatePlayerLevel(nextGrowthXp),
    growthXp: nextGrowthXp,
    starGlimmer: Number(player.starGlimmer || 0) + starGlimmerGain,
    energy: nextEnergy,
    maxEnergy: player.maxEnergy || 12,
    heartPower: nextHeartPower,
    maxHeartPower: player.maxHeartPower || 6,
    spiritPages: (player.spiritPages || 0) + spiritPagesGain,
    materials: addMaterials(player.materials, materialsGain),
    artifacts: normalizeArtifacts(player.artifacts),
    stanceMastery: applyStanceMastery(player.stanceMastery, stance.id, stanceMasteryGain),
    streak: isCorrect ? (player.streak || 0) + 1 : 0,
    bonds: applyBondGains(player.bonds, bondGains),
    mastery: nextMastery,
    studiedLessonIds: [...(player.studiedLessonIds || [])],
    answeredQuestionIds: unique([...(player.answeredQuestionIds || []), question.id]),
    correctQuestionIds: nextCorrectQuestionIds,
    wrongQuestionIds: nextWrongIds,
    mindDemons: demonResult.mindDemons,
    purifiedDemonIds: nextPurifiedIds,
    stanceStats: nextStanceStats,
  }, action.bankQuestions || [question], action.chapterOptions || {});

  const nextRun = updateRun(run, {
    node,
    question,
    stance,
    isCorrect,
    normalizedSelected,
    damage,
    heartDelta,
    spiritPagesGain,
    materialsGain,
    masteryGain,
    stanceMasteryGain,
    starGlimmerGain,
    growthXpGain,
    bondGains,
    energyDelta,
    studiedBeforeBattle,
    hint: getHint(question, stance, method),
    learningCheck: buildLearningCheck(question, studiedBeforeBattle),
    purifiedDemonId: demonResult.purifiedDemonId,
    demonPressure: totalDemonPressure(demonResult.mindDemons),
    nextHeartPower,
  });

  return {
    isCorrect,
    selectedAnswer: normalizedSelected,
    correctAnswer: question.answer,
    damage,
    heartDelta,
    spiritPagesGain,
    materialsGain,
    masteryGain,
    stanceMasteryGain,
    starGlimmerGain,
    growthXpGain,
    bondGains,
    energyDelta,
    studiedBeforeBattle,
    hint: getHint(question, stance, method),
    learningCheck: buildLearningCheck(question, studiedBeforeBattle),
    purifiedDemonId: demonResult.purifiedDemonId,
    player: nextPlayer,
    run: nextRun,
  };
}

export function createRunReport(run, player) {
  const correctRate = run.answeredCount
    ? Math.round((run.correctCount / run.answeredCount) * 100)
    : 0;
  const nextRecommendation = getNextRecommendation(run, player);

  return {
    title: getReportTitle(correctRate, run.failed),
    correctRate,
    answeredCount: run.answeredCount,
    correctCount: run.correctCount,
    wrongCount: run.wrongCount,
    studiedCount: run.studyCount || 0,
    purifiedCount: run.purifiedDemonIds.length,
    spiritPagesGain: run.spiritPagesGain,
    materialsGain: normalizeMaterials(run.materialsGain),
    starGlimmerGain: run.starGlimmerGain || 0,
    growthXpGain: run.growthXpGain || 0,
    bondGains: { ...defaultBonds, ...(run.bondGains || {}) },
    masteryGain: run.masteryGain,
    stanceMasteryGain: run.stanceMasteryGain || 0,
    stanceStats: { ...run.stanceStats },
    nextRecommendation,
    events: [...run.events],
  };
}

export function getHeartMethod(topic, mastery = 0) {
  const method = getTopicProfile(topic).method;
  const clampedMastery = clamp(Number(mastery || 0), 0, 100);
  const level = Math.min(5, Math.floor(clampedMastery / 25) + 1);

  return {
    topic,
    name: method,
    level,
    progress: clampedMastery % 25,
    steadyGuardBonus: Math.max(0, level - 1),
    assaultDamageBonus: Number((Math.max(0, level - 1) * 0.05).toFixed(2)),
    observeHintBonus: Math.floor(Math.max(0, level - 1) / 2),
  };
}

export function getArtifactRoster(player = initialPlayerState()) {
  const materials = normalizeMaterials(player.materials);
  const artifacts = normalizeArtifacts(player.artifacts);

  return artifactDefinitions.map((definition) => {
    const state = artifacts[definition.id] || { level: 1, unlocked: true };
    const cost = getArtifactUpgradeCost(definition, state.level);

    return {
      ...definition,
      level: state.level,
      unlocked: state.unlocked,
      cost,
      canUpgrade: state.unlocked && state.level < definition.maxLevel && hasMaterials(materials, cost),
    };
  });
}

export function upgradeArtifact(player = initialPlayerState(), artifactId) {
  const definition = artifactDefinitions.find((artifact) => artifact.id === artifactId);
  if (!definition) throw new Error(`未知法器：${artifactId}`);

  const artifacts = normalizeArtifacts(player.artifacts);
  const current = artifacts[artifactId] || { level: 1, unlocked: true };
  const cost = getArtifactUpgradeCost(definition, current.level);
  const materials = normalizeMaterials(player.materials);

  if (current.level >= definition.maxLevel) {
    throw new Error(`${definition.name} 已达满级`);
  }
  if (!hasMaterials(materials, cost)) {
    throw new Error(`${definition.name} 升级材料不足`);
  }

  const nextArtifacts = {
    ...artifacts,
    [artifactId]: {
      ...current,
      level: current.level + 1,
      unlocked: true,
    },
  };
  const nextPlayer = {
    ...player,
    materials: subtractMaterials(materials, cost),
    artifacts: nextArtifacts,
  };

  return {
    player: nextPlayer,
    artifact: getArtifactRoster(nextPlayer).find((artifact) => artifact.id === artifactId),
    cost,
    upgraded: true,
  };
}

export function createDailyChallenges(questions = [], player = initialPlayerState()) {
  const prepared = prepareQuestions(questions);
  const studiedLessonIds = new Set(player.studiedLessonIds || []);
  const correctQuestionIds = new Set(player.correctQuestionIds || []);
  const topicCount = new Set(prepared.map((question) => question.topic)).size || 1;
  const studiedCount = prepared.filter((question) => studiedLessonIds.has(question.lesson.id)).length;
  const correctCount = prepared.filter((question) => correctQuestionIds.has(question.id)).length;
  const demonCount = Object.keys(player.mindDemons || {}).length;
  const resonanceCount = Object.values(player.mastery || {}).filter((value) => Number(value || 0) >= 50).length;

  return [
    dailyChallenge("daily-study", "晨课三问", "完成练功短课，把讲解转成题眼记忆。", studiedCount, Math.min(3, prepared.length || 3), {
      shuye: 3,
      xingsha: 1,
    }),
    dailyChallenge("daily-battle", "连破题阵", "在任意题阵中答对题目，用战斗检验练功结果。", correctCount, Math.min(5, prepared.length || 5), {
      shuye: 4,
      xingsha: 2,
    }),
    dailyChallenge("daily-demon", "净墨回廊", "处理错题心魔，降低秘卷黑墨压迫。", demonCount ? 0 : 1, 1, {
      moyu: 2,
      shuye: 1,
    }),
    dailyChallenge("daily-resonance", "心法共鸣", "把至少一个主题心法练到半熟以上。", resonanceCount, Math.min(2, topicCount), {
      xingsha: 2,
      lingqian: 1,
    }),
  ];
}

export function getLessonForQuestion(question) {
  return prepareQuestions([question])[0].lesson;
}

function normalizeLesson(rawLesson, source) {
  const keyPoint = String(rawLesson?.keyPoint || extractKeyPoint(source.explanation));

  return {
    id: String(rawLesson?.id || `lesson-${source.id}`),
    title: String(rawLesson?.title || `${source.topic} · ${source.year || "真题"}讲解`),
    sourceRef: String(rawLesson?.sourceRef || source.sourceRef || "练功讲解样本"),
    keyPoint,
    explanation: String(rawLesson?.explanation || source.explanation),
    studyPrompt: String(rawLesson?.studyPrompt || `练功目标：先记住“${keyPoint}”，再用战斗检验。`),
  };
}

function validateImportedQuestion(raw, index) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`第 ${index + 1} 题必须是对象`);
  }

  const options = normalizeOptions(raw.options);
  const answer = String(raw.answer ?? "").trim().toUpperCase().replace(/\s+/g, "");

  if (!String(raw.stem ?? "").trim()) {
    throw new Error(`第 ${index + 1} 题缺少 stem`);
  }
  if (!String(raw.topic ?? "").trim()) {
    throw new Error(`第 ${index + 1} 题缺少 topic`);
  }
  if (!answer) {
    throw new Error(`第 ${index + 1} 题缺少 answer`);
  }
  if (options.length < 2) {
    throw new Error(`第 ${index + 1} 题至少需要 2 个选项`);
  }

  const optionKeys = new Set(options.map((option) => option.key));
  const missingKeys = answer.split("").filter((key) => !optionKeys.has(key));
  if (missingKeys.length) {
    throw new Error(`第 ${index + 1} 题答案包含不存在的选项 ${missingKeys.join("")}`);
  }

  return {
    ...raw,
    id: String(raw.id || `imported-${index + 1}`),
    year: String(raw.year || "未标注"),
    type: String(raw.type || "练习题"),
    topic: String(raw.topic).trim(),
    stem: String(raw.stem).trim(),
    options,
    answer,
    explanation: String(raw.explanation || raw.analysis || "暂无讲解。"),
  };
}

function createNode(question, index, type) {
  const nodeConfig = nodeTypes[type] || nodeTypes.normal;
  return {
    id: `${type}-${index + 1}-${question.id}`,
    index,
    type,
    typeName: nodeConfig.name,
    assetId: nodeConfig.assetId,
    nodeFlavor: nodeConfig.nodeFlavor,
    rewardPreview: formatNodeRewardPreview(nodeConfig),
    questionId: question.id,
    lessonId: question.lesson.id,
    topic: question.topic,
    enemy: question.enemy,
    difficulty: question.difficulty,
    studied: false,
    status: "unseen",
  };
}

function createRun({ mode, title, nodes }) {
  return {
    id: `${mode}-${nodes.map((node) => node.questionId).join("-") || "empty"}`,
    mode,
    title,
    state: nodes.length ? "route_ready" : "report_ready",
    nodes,
    studyCount: 0,
    answeredCount: 0,
    correctCount: 0,
    wrongCount: 0,
    assaultMistakes: 0,
    demonPressure: 0,
    spiritPagesGain: 0,
    materialsGain: { ...defaultMaterials },
    starGlimmerGain: 0,
    growthXpGain: 0,
    energyDelta: 0,
    bondGains: { ...defaultBonds },
    masteryGain: 0,
    purifiedDemonIds: [],
    stanceStats: {
      steady: 0,
      assault: 0,
      observe: 0,
    },
    stanceMasteryGain: 0,
    completed: nodes.length === 0,
    failed: false,
    events: [],
  };
}

function updateRun(run, event) {
  const answeredCount = run.answeredCount + 1;
  const assaultMistakes = run.assaultMistakes + (!event.isCorrect && event.stance.id === "assault" ? 1 : 0);
  const purifiedDemonIds = event.purifiedDemonId
    ? unique([...run.purifiedDemonIds, event.purifiedDemonId])
    : [...run.purifiedDemonIds];
  const nextStanceStats = {
    ...run.stanceStats,
    [event.stance.id]: (run.stanceStats[event.stance.id] || 0) + 1,
  };
  const nodes = run.nodes.map((node) =>
    node.id === event.node.id
      ? { ...node, studied: node.studied || event.studiedBeforeBattle, status: "answered" }
      : node,
  );
  const failed = event.demonPressure >= 12 || assaultMistakes >= 3 || event.nextHeartPower <= 0;
  const completed = failed || answeredCount >= run.nodes.length;

  return {
    ...run,
    nodes,
    state: completed ? "report_ready" : "node_complete",
    answeredCount,
    correctCount: run.correctCount + (event.isCorrect ? 1 : 0),
    wrongCount: run.wrongCount + (event.isCorrect ? 0 : 1),
    assaultMistakes,
    demonPressure: event.demonPressure,
    spiritPagesGain: run.spiritPagesGain + event.spiritPagesGain,
    materialsGain: addMaterials(run.materialsGain, event.materialsGain),
    starGlimmerGain: (run.starGlimmerGain || 0) + event.starGlimmerGain,
    growthXpGain: (run.growthXpGain || 0) + event.growthXpGain,
    energyDelta: (run.energyDelta || 0) + event.energyDelta,
    bondGains: applyBondGains(run.bondGains, event.bondGains),
    masteryGain: run.masteryGain + event.masteryGain,
    stanceMasteryGain: (run.stanceMasteryGain || 0) + event.stanceMasteryGain,
    purifiedDemonIds,
    stanceStats: nextStanceStats,
    completed,
    failed,
    events: [
      ...run.events,
      {
        nodeId: event.node.id,
        nodeType: event.node.type,
        questionId: event.question.id,
        topic: event.question.topic,
        stanceId: event.stance.id,
        selectedAnswer: event.normalizedSelected,
        correctAnswer: event.question.answer,
        isCorrect: event.isCorrect,
        studiedBeforeBattle: event.studiedBeforeBattle,
        damage: event.damage,
        heartDelta: event.heartDelta,
        spiritPagesGain: event.spiritPagesGain,
        materialsGain: normalizeMaterials(event.materialsGain),
        starGlimmerGain: event.starGlimmerGain,
        growthXpGain: event.growthXpGain,
        energyDelta: event.energyDelta,
        bondGains: event.bondGains,
        masteryGain: event.masteryGain,
        stanceMasteryGain: event.stanceMasteryGain,
        hint: event.hint,
        learningCheck: event.learningCheck,
        purifiedDemonId: event.purifiedDemonId,
      },
    ],
  };
}

function updateMindDemon(player, question, details) {
  const nextMindDemons = { ...(player.mindDemons || {}) };
  const existing = nextMindDemons[question.id];
  let purifiedDemonId = null;

  if (!details.isCorrect) {
    const pressureGain = Math.max(
      1,
      Math.ceil(question.difficulty * details.stance.demonPressureMultiplier * details.nodeConfig.pressureMultiplier),
    );
    const pressure = (existing?.pressure || 0) + pressureGain;
    nextMindDemons[question.id] = {
      id: `demon-${question.id}`,
      questionId: question.id,
      lessonId: question.lesson.id,
      topic: question.topic,
      enemy: question.enemy,
      pressure,
      purifyCount: 0,
      status: pressure >= 4 ? "rampaging" : "born",
      lastMistake: details.normalizedSelected,
    };
  } else if (existing) {
    const purifyCount = (existing.purifyCount || 0) + 1;
    if (purifyCount >= 2) {
      delete nextMindDemons[question.id];
      purifiedDemonId = question.id;
    } else {
      nextMindDemons[question.id] = {
        ...existing,
        pressure: Math.max(0, (existing.pressure || 0) - 2),
        purifyCount,
        status: "weakened",
      };
    }
  }

  return {
    mindDemons: nextMindDemons,
    purifiedDemonId,
  };
}

function calculateDamage({ question, stance, nodeConfig, method, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return Math.max(8, question.difficulty * 8);
  const base = 42 + question.difficulty * 12;
  const methodBonus = stance.id === "assault" ? method.assaultDamageBonus : 0;
  const studyBonus = studiedBeforeBattle ? 0.1 : 0;
  return Math.round(base * stance.damageMultiplier * nodeConfig.damageMultiplier * (1 + methodBonus + studyBonus));
}

function calculateHeartDelta({ question, stance, nodeConfig, method, isCorrect }) {
  if (isCorrect) return nodeConfig.heartRecovery;
  const guard = stance.id === "steady" ? method.steadyGuardBonus : 0;
  const loss = Math.max(
    1,
    Math.ceil((question.difficulty + 1) * stance.heartLossMultiplier * nodeConfig.pressureMultiplier) - guard,
  );
  return -loss;
}

function calculateSpiritPages({ question, stance, nodeConfig, isCorrect, studiedBeforeBattle }) {
  const base = 8 + question.difficulty * 2;
  if (!isCorrect) return 0;
  const studyBonus = studiedBeforeBattle ? 1.15 : 1;
  return Math.max(1, Math.round(base * stance.rewardMultiplier * nodeConfig.rewardMultiplier * studyBonus));
}

function calculateMaterialsGain({ question, nodeConfig, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return { ...defaultMaterials };
  const base = normalizeMaterials(nodeConfig.materialRewards);
  const studyBonus = studiedBeforeBattle && question.difficulty >= 3 ? 1 : 0;
  const resonanceBonus = nodeConfig.resonanceMultiplier && studiedBeforeBattle ? 1 : 0;

  return {
    shuye: base.shuye + studyBonus,
    xingsha: base.xingsha + resonanceBonus,
    moyu: base.moyu,
    lingqian: base.lingqian,
  };
}

function calculateMasteryGain({ question, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return 0;
  const base = 10 + question.difficulty * 2;
  return base + (studiedBeforeBattle ? 4 : 0);
}

function calculateStanceMasteryGain({ question, nodeConfig, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return 0;
  const nodeBonus = nodeConfig.id === "trial" ? 4 : nodeConfig.id === "resonance" ? 3 : 0;
  return 8 + question.difficulty + nodeBonus + (studiedBeforeBattle ? 3 : 0);
}

function calculateStudyRewards(wasStudied) {
  if (wasStudied) {
    return {
      starGlimmerGain: 0,
      growthXpGain: 0,
      materialsGain: { ...defaultMaterials },
      bondGains: { ...defaultBonds },
    };
  }

  return {
    starGlimmerGain: 3,
    growthXpGain: 8,
    materialsGain: { ...defaultMaterials, shuye: 1 },
    bondGains: {
      ...defaultBonds,
      mingche: 1,
      azhi: 3,
    },
  };
}

function calculateBattleStarGlimmer({ question, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return 0;
  return 4 + question.difficulty + (studiedBeforeBattle ? 1 : 0);
}

function calculateBattleGrowthXp({ question, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return 0;
  return 10 + question.difficulty * 2 + (studiedBeforeBattle ? 4 : 0);
}

function calculateBattleBondGains({ isCorrect, purifiedDemonId }) {
  return {
    ...defaultBonds,
    qinglan: isCorrect ? 3 : 0,
    xiaomo: purifiedDemonId ? 4 : 0,
  };
}

function calculateEnergyDelta({ isCorrect, stance }) {
  if (isCorrect) return stance.id === "assault" ? 2 : 1;
  if (stance.id === "observe") return -1;
  if (stance.id === "assault") return -3;
  return -2;
}

function applyBondGains(currentBonds = {}, gains = {}) {
  const normalized = { ...defaultBonds, ...(currentBonds || {}) };
  Object.entries(gains || {}).forEach(([id, gain]) => {
    normalized[id] = Math.max(0, Number(normalized[id] || 0) + Number(gain || 0));
  });
  return normalized;
}

function normalizeMaterials(materials = {}) {
  return Object.fromEntries(
    materialTypes.map((material) => [material.id, Math.max(0, Number(materials?.[material.id] || 0))]),
  );
}

function addMaterials(current = {}, gains = {}) {
  const normalized = normalizeMaterials(current);
  const normalizedGains = normalizeMaterials(gains);
  return Object.fromEntries(
    materialTypes.map((material) => [material.id, normalized[material.id] + normalizedGains[material.id]]),
  );
}

function subtractMaterials(current = {}, cost = {}) {
  const normalized = normalizeMaterials(current);
  const normalizedCost = normalizeMaterials(cost);
  return Object.fromEntries(
    materialTypes.map((material) => [
      material.id,
      Math.max(0, normalized[material.id] - normalizedCost[material.id]),
    ]),
  );
}

function hasMaterials(current = {}, cost = {}) {
  const normalized = normalizeMaterials(current);
  const normalizedCost = normalizeMaterials(cost);
  return materialTypes.every((material) => normalized[material.id] >= normalizedCost[material.id]);
}

function createInitialArtifacts() {
  return Object.fromEntries(
    artifactDefinitions.map((artifact) => [artifact.id, { level: 1, unlocked: true }]),
  );
}

function normalizeArtifacts(artifacts = {}) {
  return Object.fromEntries(
    artifactDefinitions.map((definition) => {
      const state = artifacts?.[definition.id] || {};
      return [
        definition.id,
        {
          level: clamp(Number(state.level || 1), 1, definition.maxLevel),
          unlocked: Boolean(state.unlocked ?? true),
        },
      ];
    }),
  );
}

function normalizeStanceMastery(stanceMastery = {}) {
  return Object.fromEntries(
    stances.map((stance) => {
      const state = stanceMastery?.[stance.id] || {};
      const xp = Math.max(0, Number(state.xp || 0));
      return [stance.id, { xp, level: calculateStanceLevel(xp) }];
    }),
  );
}

function applyStanceMastery(stanceMastery = {}, stanceId, gain = 0) {
  const normalized = normalizeStanceMastery(stanceMastery);
  const current = normalized[stanceId] || { xp: 0, level: 1 };
  const xp = current.xp + Math.max(0, Number(gain || 0));

  return {
    ...normalized,
    [stanceId]: {
      xp,
      level: calculateStanceLevel(xp),
    },
  };
}

function calculateStanceLevel(xp) {
  return Math.min(5, Math.floor(Number(xp || 0) / 45) + 1);
}

function getArtifactUpgradeCost(definition, level) {
  const multiplier = Math.max(1, Number(level || 1));
  return normalizeMaterials(
    Object.fromEntries(
      materialTypes.map((material) => [
        material.id,
        Math.ceil(Number(definition.baseCost?.[material.id] || 0) * multiplier),
      ]),
    ),
  );
}

function formatNodeRewardPreview(nodeConfig) {
  const materials = normalizeMaterials(nodeConfig.materialRewards);
  const parts = [];
  Object.entries(materials).forEach(([id, value]) => {
    if (!value) return;
    const material = materialTypes.find((item) => item.id === id);
    parts.push(`${material?.name || id}+${value}`);
  });
  if (nodeConfig.heartRecovery) parts.push(`心力+${nodeConfig.heartRecovery}`);
  return parts.length ? parts.join(" · ") : "星辉与心法";
}

function dailyChallenge(id, title, description, current, target, materials) {
  const safeTarget = Math.max(1, Number(target || 1));
  return {
    id,
    title,
    description,
    progress: {
      current: clamp(Number(current || 0), 0, safeTarget),
      target: safeTarget,
    },
    rewards: {
      starGlimmer: 3,
      materials: normalizeMaterials(materials),
    },
  };
}

function getStoryCharacter(characterId) {
  return storyCharacters.find((character) => character.id === characterId) || storyCharacters[0];
}

function dialogueLine(speakerId, text) {
  const character = getStoryCharacter(speakerId);
  return {
    speakerId,
    speakerName: character.name,
    avatar: `./assets/generated/characters/avatars/avatar-${speakerId}.png`,
    standee: `./assets/generated/characters/standees/cutouts/standee-${speakerId}-cutout.png`,
    text,
  };
}

function getChapterNarrativeLines(chapter) {
  return (chapterNarrativeBeats[chapter.id] || [
    ["mingche", `这处裂隙属于“${chapter.topic}”。先把讲解里的题眼找出来，再让题阵检验你的判断。`],
    ["azhi", "我会把长解析拆成短课。你只要先记住关键句，后面的战斗就会轻很多。"],
    ["qinglan", "答对会让封印发光，答错会留下心魔。我们不怕心魔，只怕不回头看。"],
  ]).map(([speakerId, text]) => dialogueLine(speakerId, text));
}

function calculatePlayerLevel(growthXp) {
  return Math.max(1, Math.floor(Number(growthXp || 0) / 50) + 1);
}

function calculateChapterMasteryRequirement(questionCount) {
  return Math.min(70, Math.max(16, Number(questionCount || 1) * 14));
}

function updateChapterClears(player, questions = [], options = {}) {
  const chapters = createStoryChapters(questions, options);
  const chapterClears = { ...(player.chapterClears || {}) };

  chapters.forEach((chapter) => {
    if (isChapterCleared(chapter, questions, player)) {
      chapterClears[chapter.id] = true;
    } else {
      delete chapterClears[chapter.id];
    }
  });

  return {
    ...player,
    chapterClears,
  };
}

function slugTopic(topic) {
  return encodeURIComponent(String(topic || "topic"))
    .replace(/%/g, "")
    .toLowerCase()
    .slice(0, 28) || "topic";
}

function getHint(question, stance, method) {
  if (!stance.providesHint) return "";
  const extra = method.observeHintBonus ? `；心法加成：额外回看 ${method.observeHintBonus} 个关键词` : "";
  return `题眼：${question.lesson.keyPoint}${extra}`;
}

function buildLearningCheck(question, studiedBeforeBattle) {
  return studiedBeforeBattle
    ? `练功检验：已回看讲解，题眼“${question.lesson.keyPoint}”进入破阵结算。`
    : `战斗检验：未练功直接出阵，结算后回看讲解“${question.lesson.keyPoint}”。`;
}

function getNextRecommendation(run, player) {
  const lastWrong = [...run.events].reverse().find((event) => !event.isCorrect);
  if (lastWrong) {
    return {
      topic: lastWrong.topic,
      method: getHeartMethod(lastWrong.topic, player.mastery?.[lastWrong.topic] || 0).name,
      reason: "错题心魔已生成，建议回到练功区复看讲解后再入回廊。",
    };
  }

  const topic = getLowestMasteryTopic(player.mastery || {});
  return {
    topic,
    method: getHeartMethod(topic, player.mastery?.[topic] || 0).name,
    reason: "当前无新增错题，建议补薄弱心法并挑战更高风险节点。",
  };
}

function getRunNode(run, nodeId) {
  const node = run.nodes.find((item) => item.id === nodeId);
  if (!node) throw new Error(`未知路线节点：${nodeId}`);
  return node;
}

function getStance(stanceId) {
  const stance = stances.find((item) => item.id === stanceId);
  if (!stance) throw new Error(`未知破招式：${stanceId}`);
  return stance;
}

function normalizeOptions(options = []) {
  return Array.isArray(options)
    ? options.map((option) => ({
        key: String(option.key ?? "").trim().toUpperCase(),
        text: String(option.text ?? "").trim(),
      }))
    : [];
}

function normalizeAnswer(answer, options = []) {
  const normalized = String(answer || "").trim().toUpperCase().replace(/\s+/g, "");
  const order = normalizeOptions(options).map((option) => option.key);
  const fallbackOrder = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const sortOrder = order.length ? order : fallbackOrder;
  return sortOrder.filter((key) => normalized.includes(key)).join("");
}

function extractKeyPoint(explanation) {
  const text = String(explanation || "").replace(/\s+/g, " ").trim();
  const match = text.match(/题眼[是：:]*([^。；;]+)/);
  if (match?.[1]) return match[1].trim();
  return text.split(/[。；;]/)[0]?.slice(0, 36) || "先看概念、条件和排除项";
}

function inferDifficulty(question) {
  if (String(question.type || "").includes("多")) return 3;
  if (String(question.type || "").includes("判断")) return 1;
  return 2;
}

function getTopicProfile(topic) {
  const profiles = {
    教育法规: {
      method: "律令心法",
      enemy: "律令心魔",
      realm: "入门秘境",
    },
    教育心理学: {
      method: "观心心法",
      enemy: "观心心魔",
      realm: "观心林",
    },
    教学设计: {
      method: "授业心法",
      enemy: "授业心魔",
      realm: "授业工坊",
    },
    教师职业道德: {
      method: "师德心法",
      enemy: "师德心魔",
      realm: "师德试炼",
    },
    班级管理: {
      method: "统御心法",
      enemy: "统御心魔",
      realm: "统御迷阵",
    },
    儿童发展: {
      method: "童心心法",
      enemy: "童心心魔",
      realm: "童心谷",
    },
  };

  return profiles[topic] || {
    method: "研习心法",
    enemy: "研习心魔",
    realm: "综合秘境",
  };
}

function getLowestMasteryTopic(mastery) {
  const topics = Object.keys(mastery);
  if (!topics.length) return "教育法规";
  return topics.reduce((lowest, topic) => (mastery[topic] < mastery[lowest] ? topic : lowest), topics[0]);
}

function totalDemonPressure(mindDemons) {
  return Object.values(mindDemons || {}).reduce((total, demon) => total + (demon.pressure || 0), 0);
}

function getReportTitle(correctRate, failed) {
  if (failed) return "心力告急";
  if (correctRate === 100) return "破阵通明";
  if (correctRate >= 60) return "心法成形";
  return "回炉练功";
}

function unique(items) {
  return [...new Set(items)];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
