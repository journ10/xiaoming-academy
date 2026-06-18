import {
  getChapterMechanic,
  inferConcept,
  normalizeErrorPatterns,
} from "./src/content-rules.js";

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

export const learningStyleDefinitions = [
  {
    id: "balanced",
    name: "均衡派",
    shortName: "衡",
    description: "容错+1心力，收益稳定，适合日常巡游。",
    unlock: "base",
  },
  {
    id: "law",
    name: "律令派",
    shortName: "律",
    description: "教育法规练功收益提高，跨主题练功收益降低。",
    focusTopic: "教育法规",
    unlock: "base",
  },
  {
    id: "concept",
    name: "观心派",
    shortName: "观",
    description: "概念混淆和多选题练功收益提高，适合精确区分概念。",
    focusErrorPattern: "concept-confusion",
    unlock: "base",
  },
  {
    id: "assault-flow",
    name: "突击派",
    shortName: "突",
    description: "连破后同主题收益提高，失误压迫加重，适合单章冲刺。",
    unlock: "streak-10",
  },
  {
    id: "review",
    name: "复盘派",
    shortName: "复",
    description: "心魔与复看练功收益提高，新题练功收益降低。",
    unlock: "purify-20",
  },
  {
    id: "speed",
    name: "速攻派",
    shortName: "速",
    description: "时间沙漏额外+10秒，答对收益提高，适合限时题。",
    unlock: "chapter-3",
  },
  {
    id: "deep-read",
    name: "深读派",
    shortName: "深",
    description: "练功额外沉淀知识点卡片，适合慢速精读。",
    unlock: "chapter-4",
  },
  {
    id: "chaos",
    name: "混沌派",
    shortName: "混",
    description: "每题借用一种已学流派效果，适合最终综合迁移。",
    unlock: "chapter-7",
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

export const errorPatternDefinitions = {
  "concept-confusion": {
    id: "concept-confusion",
    name: "概念混淆",
    demonType: "镜像心魔",
    diagnosis: "相似概念边界未分清，容易把选项互相替换。",
    remedy: "回练功室做概念对比，再用观照招式检查题眼差异。",
  },
  "reading-mistake": {
    id: "reading-mistake",
    name: "审题失误",
    demonType: "迷雾心魔",
    diagnosis: "题干关键词或否定词被漏看，判断方向被迷雾带偏。",
    remedy: "先做审题训练，高亮“不、除外、错误的是”等关键词。",
  },
  "memory-gap": {
    id: "memory-gap",
    name: "记忆盲区",
    demonType: "空洞心魔",
    diagnosis: "基础概念或法条记忆没有建立，当前更像是在蒙猜。",
    remedy: "强制回到练功短课，先记住题眼和最小知识点。",
  },
  "application-error": {
    id: "application-error",
    name: "应用失误",
    demonType: "变形心魔",
    diagnosis: "知道概念但没有匹配到当前情境，案例条件发生了变形。",
    remedy: "回看材料条件，按情境、对象、处理顺序重新匹配概念。",
  },
};

export const chapterMechanicDefinitions = {
  "law-fog": {
    id: "law-fog",
    name: "法条迷雾",
    prompt: "先圈出法条关键词，再判断应当、可以、不得等措辞。",
    wrongHeartLossBonus: 1,
    studiedDamageBonus: 0.04,
  },
  "concept-maze": {
    id: "concept-maze",
    name: "概念迷宫",
    prompt: "先区分相似概念，再检查多选项是否互相替换。",
    wrongHeartLossBonus: 0,
    studiedDamageBonus: 0.08,
  },
  "time-hourglass": {
    id: "time-hourglass",
    name: "时间沙漏",
    prompt: "先抓材料对象、条件和目标，再进入限时判断。",
    wrongHeartLossBonus: 0,
    studiedDamageBonus: 0.06,
  },
  "ethics-scale": {
    id: "ethics-scale",
    name: "道德天平",
    prompt: "在理想要求、现实情境和学生权益之间找平衡。",
    wrongHeartLossBonus: 0,
    studiedDamageBonus: 0.04,
  },
  "strategy-chain": {
    id: "strategy-chain",
    name: "策略链",
    prompt: "按先后顺序推演处理策略，不只看单个选项。",
    wrongHeartLossBonus: 0,
    studiedDamageBonus: 0.07,
  },
  "precision-memory": {
    id: "precision-memory",
    name: "精确记忆",
    prompt: "先锁定年龄、阶段和关键词，避免近似记忆。",
    wrongHeartLossBonus: 1,
    studiedDamageBonus: 0.05,
  },
  "chaos-mix": {
    id: "chaos-mix",
    name: "万象混沌",
    prompt: "先识别题目属于哪类机制，再选择对应解法。",
    wrongHeartLossBonus: 0,
    studiedDamageBonus: 0.03,
  },
};

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
  {
    id: "chapter-final",
    topic: "综合知识",
    title: "第七章 万象书阁",
    characterId: "xiaomo",
    summary: "把六章题眼混合迁移，面对创始人留下的最终试炼。",
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
  "chapter-final": [
    ["xiaomo", "万象书阁不会只考一章。它会把你走过的每种错误、每种题眼都重新混在一起。"],
    ["mingche", "创始人前辈留下的不是惩罚，而是一封很长的信。只有愿意面对错题的人能读完。"],
    ["azhi", "如果我们能点亮这里，书院就不只是修好了。它会开始等待下一位巡游者。"],
  ],
};

const blackInkSayings = [
  { id: "intro", chapterId: "intro", text: "学习不是填满水桶，而是点燃火焰。" },
  { id: "chapter-law", chapterId: "chapter-law", text: "法律的生命不在于逻辑，而在于精确。" },
  { id: "chapter-psychology", chapterId: "chapter-psychology", text: "理解不是记住定义，而是看到差异。" },
  { id: "chapter-design", chapterId: "chapter-design", text: "教学不是展示所有知识，而是选择最重要的。" },
  { id: "chapter-ethics", chapterId: "chapter-ethics", text: "师德不是做圣人，而是做清醒的人。" },
  { id: "chapter-classroom", chapterId: "chapter-classroom", text: "管理的艺术不是控制，而是引导。" },
  { id: "chapter-child", chapterId: "chapter-child", text: "理解儿童，不是降低要求，而是知道怎么把要求递到他们够得到的地方。" },
  { id: "chapter-final", chapterId: "chapter-final", text: "通关不是终点，而是你开始帮助后来者学习。" },
];

const bondStoryDefinitions = [
  {
    characterId: "mingche",
    title: "明澈：导师的错题",
    requiredBond: 20,
    text: "明澈承认自己也曾把法规条文背得滚瓜烂熟，却在真实情境里判断失误。",
  },
  {
    characterId: "azhi",
    title: "阿芷：127个心魔",
    requiredBond: 25,
    text: "阿芷把自己过去的错题册摊开，告诉你复盘不是羞耻，而是重新获得方向。",
  },
  {
    characterId: "qinglan",
    title: "青岚：过度自信的心魔",
    requiredBond: 20,
    text: "青岚讲起自己曾经只用强攻刷题，直到被一个简单概念绊住很久。",
  },
  {
    characterId: "xiaomo",
    title: "小墨：创始人的信",
    requiredBond: 30,
    text: "小墨交出创始人的信：书院的题不是为了测试记忆，而是为了测试学习态度。",
  },
];

const endingDefinitions = [
  {
    id: "guardian",
    title: "守卷人",
    text: "你选择留在书院，整理错题与题眼，成为下一位巡游者的引路人。",
  },
  {
    id: "returner",
    title: "归途",
    text: "你选择回到日常，把书院学到的方法带回真实备考与教学现场。",
  },
];

export function initialPlayerState() {
  return {
    playerLevel: 1,
    growthXp: 0,
    starGlimmer: 0,
    energy: 12,
    maxEnergy: 12,
    heartPower: 6,
    maxHeartPower: 6,
    learningStyleId: "balanced",
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
    errorStats: {},
    retestStats: { attempts: 0, correct: 0 },
    stanceStats: {
      steady: 0,
      assault: 0,
      observe: 0,
    },
    styleStats: {},
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
    const enrichmentContext = {
      ...raw,
      id,
      topic,
      explanation,
      lesson,
    };
    const concept = String(raw.concept || inferConcept(enrichmentContext));
    const dependencies = Array.isArray(raw.dependencies)
      ? raw.dependencies.map((dependency) => String(dependency)).filter(Boolean)
      : [];
    const errorPatterns = normalizeErrorPatterns(raw.errorPatterns, enrichmentContext);
    const chapterMechanic = String(raw.chapterMechanic || getChapterMechanic(topic));

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
      concept,
      dependencies,
      errorPatterns,
      chapterMechanic,
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

export function summarizeQuestionBank(payload) {
  const rawQuestions = Array.isArray(payload) ? payload : payload?.questions || [];
  const ocr = Array.isArray(payload) ? {} : payload?.ocr || {};
  const playableQuestionCount = Number(ocr.mergedQuestionCount || rawQuestions.length || 0);
  const sourceTotalQuestionSlots = Number(ocr.sourceTotalQuestionSlots || playableQuestionCount || 0);
  const reviewQuestionCount = Number(
    ocr.reviewQuestionCount
      ?? rawQuestions.filter((question) => question.ocr?.requiresReview).length,
  );
  const sourceCoveragePercent = sourceTotalQuestionSlots
    ? Math.round((playableQuestionCount / sourceTotalQuestionSlots) * 1000) / 10
    : 0;

  return {
    sourceExamCount: Number(ocr.sourceExamCount || 0),
    sourceTotalQuestionSlots,
    playableQuestionCount,
    reviewQuestionCount,
    sourceCoveragePercent,
  };
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

function getPreviousChapter(chapter, orderedChapters) {
  const index = orderedChapters.findIndex((item) => item.id === chapter.id);
  if (index > 0) return orderedChapters[index - 1];
  const order = Number(chapter.order || 0);
  return orderedChapters.find((item) => Number(item.order || 0) === order - 1) || null;
}

function getLearningStyleAvailability(style, player = initialPlayerState(), chapters = []) {
  const chapterClears = player.chapterClears || {};
  const clearedChapters = (chapters || []).filter((chapter) => chapterClears[chapter.id]);

  if (style.unlock === "base") return { unlocked: true, reason: "初始解锁" };
  if (style.unlock === "streak-10") {
    return Number(player.streak || 0) >= 10
      ? { unlocked: true, reason: "已达连破10次" }
      : { unlocked: false, reason: "需要连破10次" };
  }
  if (style.unlock === "purify-20") {
    return (player.purifiedDemonIds || []).length >= 20
      ? { unlocked: true, reason: "已净化20个心魔" }
      : { unlocked: false, reason: "需要净化20个心魔" };
  }
  if (style.unlock === "chapter-3") {
    return clearedChapters.some((chapter) => Number(chapter.order || 0) >= 3)
      ? { unlocked: true, reason: "第三章已通关" }
      : { unlocked: false, reason: "需要第三章通关" };
  }
  if (style.unlock === "chapter-4") {
    return clearedChapters.some((chapter) => Number(chapter.order || 0) >= 4)
      ? { unlocked: true, reason: "第四章已通关" }
      : { unlocked: false, reason: "需要第四章通关" };
  }
  if (style.unlock === "chapter-7") {
    return clearedChapters.some((chapter) => Number(chapter.order || 0) >= 7 || chapter.topic === "综合知识")
      ? { unlocked: true, reason: "第七章已通关" }
      : { unlocked: false, reason: "需要第七章通关" };
  }
  return { unlocked: false, reason: "未满足解锁条件" };
}

function withRecommendationReason(style, reason) {
  return {
    ...style,
    reason,
  };
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

export function getChapterAvailability(chapter, chapters = [], player = initialPlayerState()) {
  if (!chapter) {
    return {
      available: false,
      status: "locked",
      reason: "未选择章节。",
      requiredChapterIds: [],
      missingChapterIds: [],
    };
  }

  const orderedChapters = [...(chapters || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  const chapterClears = player.chapterClears || {};
  const order = Number(chapter.order || orderedChapters.findIndex((item) => item.id === chapter.id) + 1 || 1);

  if (order <= 1) {
    return {
      available: true,
      status: "available",
      reason: "第一章已开放。",
      requiredChapterIds: [],
      missingChapterIds: [],
    };
  }

  const isFinalChapter = order >= 7 || chapter.topic === "综合知识";
  const requiredChapters = isFinalChapter
    ? orderedChapters.filter((item) => item.id !== chapter.id && Number(item.order || 0) <= 6)
    : [getPreviousChapter(chapter, orderedChapters)].filter(Boolean);
  const missingChapters = requiredChapters.filter((item) => !chapterClears[item.id]);

  if (!missingChapters.length) {
    return {
      available: true,
      status: "available",
      reason: isFinalChapter ? "前六章已点亮，万象书阁开放。" : "前置章节已点亮。",
      requiredChapterIds: requiredChapters.map((item) => item.id),
      missingChapterIds: [],
    };
  }

  return {
    available: false,
    status: "locked",
    reason: isFinalChapter
      ? `第七章需先点亮前六章：${missingChapters.map((item) => item.title).join("、")}`
      : `需先点亮${missingChapters[0].title}。`,
    requiredChapterIds: requiredChapters.map((item) => item.id),
    missingChapterIds: missingChapters.map((item) => item.id),
  };
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

export function buildKnowledgeGraphPreview(chapter, questions = [], player = initialPlayerState(), options = {}) {
  const prepared = prepareQuestions(questions);
  const topic = String(chapter?.topic || prepared[0]?.topic || "综合知识");
  const chapterQuestionIds = new Set(
    chapter?.questionIds?.length
      ? chapter.questionIds
      : prepared.filter((question) => question.topic === topic).map((question) => question.id),
  );
  const chapterQuestions = prepared.filter((question) =>
    chapterQuestionIds.size ? chapterQuestionIds.has(question.id) : question.topic === topic,
  );
  const graph = buildKnowledgeGraphTree(topic, chapterQuestions);
  const stateById = buildKnowledgeGraphState(graph, player);
  const conceptNodes = [...stateById.values()].filter((state) => state.directTotal > 0);
  const totalConcepts = conceptNodes.length;
  const masteredConcepts = conceptNodes.filter((state) => state.status === "mastered").length;
  const demonConcepts = conceptNodes.filter((state) => state.status === "demon").length;
  const lockedConcepts = conceptNodes.filter((state) => state.status === "locked").length;
  const maxLines = Math.max(4, Number(options.maxLines || 12));
  const lines = [
    `${topic} · 掌握 ${masteredConcepts}/${totalConcepts} · 心魔 ${demonConcepts} · 锁定 ${lockedConcepts}`,
  ];

  if (!graph.root.children.length) {
    lines.push("暂无概念节点");
  } else {
    let truncatedCount = 0;
    graph.root.children.forEach((child, index) => {
      truncatedCount += appendKnowledgeGraphLine({
        node: child,
        stateById,
        lines,
        maxLines,
        prefix: "",
        isLast: index === graph.root.children.length - 1,
      });
    });
    if (truncatedCount) lines.push(`... 还有 ${truncatedCount} 个概念节点`);
  }

  return {
    topic,
    totalConcepts,
    masteredConcepts,
    demonConcepts,
    lockedConcepts,
    lines,
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

export function getBlackInkCollection(chapters = [], player = initialPlayerState()) {
  const knownChapterIds = new Set(chapters.map((chapter) => chapter.id));
  return blackInkSayings
    .filter((item) => item.chapterId === "intro" || knownChapterIds.has(item.chapterId))
    .map((item) => ({
      ...item,
      unlocked: item.chapterId === "intro"
        ? Boolean(player.seenIntro)
        : Boolean(player.chapterClears?.[item.chapterId]),
    }));
}

export function getBondStories(player = initialPlayerState()) {
  return bondStoryDefinitions.map((story) => {
    const bond = Number(player.bonds?.[story.characterId] || 0);
    return {
      ...story,
      characterName: getStoryCharacter(story.characterId).name,
      bond,
      unlocked: bond >= story.requiredBond,
    };
  });
}

export function getEndingOptions(chapters = [], player = initialPlayerState()) {
  const finalChapter = [...chapters]
    .sort((a, b) => (b.order || 0) - (a.order || 0))
    .find((chapter) => chapter.topic === "综合知识" || Number(chapter.order || 0) >= 7);
  if (!finalChapter || !player.chapterClears?.[finalChapter.id]) return [];
  return endingDefinitions.map((ending) => ({ ...ending, unlocked: true }));
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

export function getLearningStyle(styleId = "balanced") {
  return learningStyleDefinitions.find((style) => style.id === styleId) || learningStyleDefinitions[0];
}

export function getAvailableLearningStyles(player = initialPlayerState(), chapters = []) {
  return learningStyleDefinitions.map((style) => {
    const availability = getLearningStyleAvailability(style, player, chapters);
    return {
      ...style,
      unlocked: availability.unlocked,
      unlockReason: availability.reason,
    };
  });
}

export function getRecommendedLearningStyle(questions = [], player = initialPlayerState(), chapters = []) {
  const available = getAvailableLearningStyles(player, chapters).filter((style) => style.unlocked);
  const activeDemons = Object.values(player.mindDemons || {});
  const prepared = prepareQuestions(questions);
  const topicCounts = prepared.reduce((counts, question) => {
    counts[question.topic] = (counts[question.topic] || 0) + 1;
    return counts;
  }, {});
  const dominantTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const hasConceptDebt = activeDemons.some((demon) => demon.errorPattern === "concept-confusion");

  if (activeDemons.length && available.some((style) => style.id === "review")) {
    return withRecommendationReason(available.find((style) => style.id === "review"), "有活跃心魔，复盘派能提高净化收益。");
  }
  if ((player.streak || 0) >= 5 && available.some((style) => style.id === "assault-flow")) {
    return withRecommendationReason(available.find((style) => style.id === "assault-flow"), "当前连破较高，突击派适合继续冲刺。");
  }
  if (hasConceptDebt && available.some((style) => style.id === "concept")) {
    return withRecommendationReason(available.find((style) => style.id === "concept"), "概念混淆偏多，观心派适合做概念区分。");
  }
  if (dominantTopic === "教育法规" && available.some((style) => style.id === "law")) {
    return withRecommendationReason(available.find((style) => style.id === "law"), "当前题组以法规为主，律令派收益更高。");
  }
  return withRecommendationReason(available[0] || learningStyleDefinitions[0], "当前状态适合稳扎稳打。");
}

export function getChapterMechanicDefinition(mechanicId = "chaos-mix") {
  return chapterMechanicDefinitions[mechanicId] || chapterMechanicDefinitions["chaos-mix"];
}

export function buildChapterMechanicState(question, player = initialPlayerState(), context = {}) {
  const prepared = prepareQuestions([question])[0];
  const mechanic = getChapterMechanicDefinition(prepared.chapterMechanic);
  const studied = (player.studiedLessonIds || []).includes(prepared.lesson.id) || Boolean(context.studied);
  const baseState = {
    id: mechanic.id,
    name: mechanic.name,
    prompt: mechanic.prompt,
    displayStem: prepared.stem,
    optionWarnings: [],
    timeLimitSeconds: 0,
    recoverAddsSeconds: 0,
    ethicsValue: Number(player.ethicsValue || 0),
    warning: "",
    strategySteps: [],
    managementValue: 0,
    exactAnswerRequired: false,
    attemptsAllowed: Infinity,
    forcedDemonOnMiss: false,
    borrowedMechanic: "",
  };

  if (mechanic.id === "chaos-mix") {
    const borrowedMechanic = pickChaosMechanic(prepared);
    const borrowedState = buildChapterMechanicState({
      ...prepared,
      chapterMechanic: borrowedMechanic,
    }, player, { ...context, chaosBorrowed: true });
    return {
      ...borrowedState,
      id: mechanic.id,
      name: mechanic.name,
      prompt: mechanic.prompt,
      borrowedMechanic,
    };
  }

  if (mechanic.id === "law-fog") {
    return {
      ...baseState,
      displayStem: studied || context.reveal ? prepared.stem : maskLawKeywords(prepared, prepared.difficulty),
      fogLevel: Math.min(3, Math.max(1, Number(prepared.difficulty || 1))),
    };
  }

  if (mechanic.id === "concept-maze") {
    return {
      ...baseState,
      optionWarnings: buildConceptMazeWarnings(prepared),
      mazeLevel: String(prepared.type || "").includes("多") ? 3 : 2,
    };
  }

  if (mechanic.id === "time-hourglass") {
    return {
      ...baseState,
      timeLimitSeconds: getHourglassSeconds(prepared.difficulty),
      recoverAddsSeconds: context.nodeType === "recover" || context.node?.type === "recover" ? 15 : 0,
    };
  }

  if (mechanic.id === "ethics-scale") {
    const ethicsValue = Number(player.ethicsValue || 0);
    return {
      ...baseState,
      ethicsValue,
      answerStyles: [
        { id: "ideal", name: "理想主义", delta: 2 },
        { id: "balanced", name: "平衡主义", delta: 0 },
        { id: "realistic", name: "现实主义", delta: -1 },
      ],
      warning: ethicsValue > 5
        ? "师德值过高：理想选项会更具诱惑，注意情境边界。"
        : ethicsValue < -3
          ? "师德值过低：现实化处理会加重心力损失。"
          : "师德值处于平衡区间。",
    };
  }

  if (mechanic.id === "strategy-chain") {
    return {
      ...baseState,
      strategySteps: [
        { id: "safety", name: "先保障安全" },
        { id: "emotion", name: "再稳定情绪" },
        { id: "facts", name: "再核对事实" },
        { id: "follow-up", name: "最后沟通跟进" },
      ],
      managementValue: Number(player.managementValue || 0),
    };
  }

  if (mechanic.id === "precision-memory") {
    return {
      ...baseState,
      exactAnswerRequired: true,
      attemptsAllowed: 1,
      forcedDemonOnMiss: true,
      memoryHint: getPrecisionMemoryHint(prepared, player),
    };
  }

  return baseState;
}

export function buildErrorDiagnosis(question, selectedAnswer = "") {
  const prepared = prepareQuestions([question])[0];
  const primaryPattern = getPrimaryErrorPattern(prepared);
  const secondaryPattern = primaryPattern === "memory-gap" ? "reading-mistake" : "memory-gap";
  const patterns = unique([primaryPattern, secondaryPattern, ...prepared.errorPatterns])
    .filter((pattern) => errorPatternDefinitions[pattern])
    .slice(0, 4);
  const rows = patterns.map((pattern, index) => {
    const probability = index === 0 ? 80 : Math.max(5, Math.round(20 / Math.max(1, patterns.length - 1)));
    const definition = errorPatternDefinitions[pattern];
    return {
      errorPattern: pattern,
      name: definition.name,
      demonType: definition.demonType,
      probability,
      bar: unicodeBar(probability),
      diagnosis: definition.diagnosis,
      remedy: definition.remedy,
    };
  });

  return {
    questionId: prepared.id,
    selectedAnswer: normalizeAnswer(selectedAnswer, prepared.options),
    correctAnswer: prepared.answer,
    primary: rows[0],
    probabilities: rows,
    suggestions: [
      `去练功室复看：${prepared.lesson.keyPoint}`,
      rows[0]?.remedy || "先回看讲解，再进入心魔回廊。",
    ],
  };
}

export function setLearningStyle(player = initialPlayerState(), styleId = "balanced", options = {}) {
  const style = learningStyleDefinitions.find((item) => item.id === styleId);
  if (!style) throw new Error(`未知学习风格：${styleId}`);
  const availability = getLearningStyleAvailability(style, player, options.chapters || []);
  if (!availability.unlocked) throw new Error(`${style.name}尚未解锁：${availability.reason}`);
  return {
    ...player,
    learningStyleId: style.id,
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

export function selectRouteQuestions(questions = [], player = initialPlayerState(), options = {}) {
  const prepared = prepareQuestions(questions);
  const length = Math.max(1, Number(options.length || 5));
  const rankedQuestions = prepared
    .map((question, index) => ({
      question,
      index,
      unlocked: isRouteQuestionUnlocked(question, prepared, player),
      rank: getRouteQuestionRank(question, player),
    }))
    .filter((item) => item.unlocked)
    .sort((a, b) => a.rank - b.rank || a.index - b.index);

  return rankedQuestions.slice(0, length).map((item) => item.question);
}

export function studyNode(player, run, nodeId, options = {}) {
  const node = getRunNode(run, nodeId);
  const wasStudied = (player.studiedLessonIds || []).includes(node.lessonId);
  const studiedQuestion = getQuestionForNode(node, options.bankQuestions || []);
  const rewards = calculateStudyRewards(wasStudied, {
    question: studiedQuestion,
    style: getLearningStyle(player.learningStyleId),
    hasActiveDemon: Boolean(player.mindDemons?.[node.questionId]),
  });
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
  const hadActiveDemon = Boolean(player.mindDemons?.[question.id]);
  const errorDiagnosis = isCorrect ? null : buildErrorDiagnosis(question, normalizedSelected);
  const style = getLearningStyle(player.learningStyleId);
  const styleEffect = getLearningStyleBattleEffect(style, {
    question,
    player,
    run,
    isCorrect,
    hasActiveDemon: hadActiveDemon,
  });
  const studiedBeforeBattle = (player.studiedLessonIds || []).includes(node.lessonId);
  const method = getHeartMethod(question.topic, player.mastery?.[question.topic] || 0);
  const damage = Math.round(calculateDamage({ question, stance, nodeConfig, method, isCorrect, studiedBeforeBattle }) * styleEffect.damageMultiplier);
  const baseHeartDelta = calculateHeartDelta({ question, stance, nodeConfig, method, isCorrect });
  const heartDelta = isCorrect ? baseHeartDelta : Math.min(0, baseHeartDelta + styleEffect.heartGuard - styleEffect.heartPenalty);
  const spiritPagesGain = Math.max(0, Math.round(calculateSpiritPages({ question, stance, nodeConfig, isCorrect, studiedBeforeBattle }) * styleEffect.rewardMultiplier));
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
  const nextStyleStats = updateLearningStyleStats(player.styleStats, style.id, isCorrect);
  const nextErrorStats = updateErrorStats(player.errorStats, errorDiagnosis?.primary?.errorPattern);
  const nextRetestStats = updateRetestStats(player.retestStats, hadActiveDemon, isCorrect);
  const nextWrongIds = isCorrect
    ? demonResult.purifiedDemonId
      ? (player.wrongQuestionIds || []).filter((id) => id !== question.id)
      : [...(player.wrongQuestionIds || [])]
    : unique([...(player.wrongQuestionIds || []), question.id]);
  const nextPurifiedIds = demonResult.purifiedDemonId
    ? unique([...(player.purifiedDemonIds || []), demonResult.purifiedDemonId])
    : [...(player.purifiedDemonIds || [])];
  const starGlimmerGain = Math.max(0, Math.round(calculateBattleStarGlimmer({ question, isCorrect, studiedBeforeBattle }) * styleEffect.rewardMultiplier));
  const growthXpGain = Math.max(0, Math.round(calculateBattleGrowthXp({ question, isCorrect, studiedBeforeBattle }) * styleEffect.rewardMultiplier));
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
    styleStats: nextStyleStats,
    errorStats: nextErrorStats,
    retestStats: nextRetestStats,
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
    demonProfile: demonResult.activeDemon || null,
    demonPressure: totalDemonPressure(demonResult.mindDemons),
    nextHeartPower,
    style,
    styleFeedback: styleEffect.feedback,
    errorDiagnosis,
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
    demonProfile: demonResult.activeDemon || null,
    errorDiagnosis,
    styleFeedback: styleEffect.feedback,
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

export function createDailyQuestState(questions = [], player = initialPlayerState()) {
  const prepared = prepareQuestions(questions);
  const correctCount = (player.correctQuestionIds || []).length;
  const purifiedCount = (player.purifiedDemonIds || []).length;
  const topicCorrectCounts = prepared.reduce((counts, question) => {
    if ((player.correctQuestionIds || []).includes(question.id)) {
      counts[question.topic] = (counts[question.topic] || 0) + 1;
    }
    return counts;
  }, {});
  const bestTopicCorrect = Math.max(0, ...Object.values(topicCorrectCounts));

  return {
    daily: createDailyChallenges(prepared, player),
    weekly: [
      weeklyQuest("weekly-graph", "知识巡检", "点亮知识图谱10个新节点。", correctCount, 10, {
        starGlimmer: 30,
        title: "图谱巡检者",
      }),
      weeklyQuest("weekly-demon-sweep", "错题大扫除", "净化5个心魔。", purifiedCount, 5, {
        starGlimmer: 24,
        title: "净墨行者",
      }),
      weeklyQuest("weekly-topic", "主题挑战", "任一主题答对20题。", bestTopicCorrect, 20, {
        starGlimmer: 28,
        title: "主题破阵者",
      }),
    ],
    fatigue: getFatigueState(player),
  };
}

export function createLearningDashboard(questions = [], player = initialPlayerState(), options = {}) {
  const prepared = prepareQuestions(questions);
  const chapters = createStoryChapters(prepared, options.chapterOptions || {});
  const studiedLessonIds = new Set(player.studiedLessonIds || []);
  const correctQuestionIds = new Set(player.correctQuestionIds || []);
  const activeDemons = Object.values(player.mindDemons || {});
  const questionById = new Map(prepared.map((question) => [question.id, question]));
  const studiedCount = prepared.filter((question) => studiedLessonIds.has(question.lesson.id)).length;
  const correctCount = prepared.filter((question) => correctQuestionIds.has(question.id)).length;
  const topicStats = chapters.map((chapter) => {
    const progress = getChapterProgress(chapter, prepared, player);
    return {
      topic: chapter.topic,
      title: chapter.title,
      studiedCount: progress.studiedCount,
      correctCount: progress.correctCount,
      demonCount: progress.demonCount,
      total: progress.total,
      mastery: progress.mastery,
      cleared: progress.cleared,
    };
  });
  const topicCoverageBars = topicStats.map((topic) => {
    const coverage = percent(topic.correctCount, topic.total);
    return {
      ...topic,
      percent: coverage,
      bar: unicodeBar(coverage),
    };
  });
  const errorPatternStats = Object.entries(countErrorPatterns(activeDemons))
    .map(([errorPattern, count]) => ({
      errorPattern,
      name: errorPatternDefinitions[errorPattern]?.name || "未诊断",
      demonType: errorPatternDefinitions[errorPattern]?.demonType || "心魔",
      count,
    }))
    .sort((a, b) => b.count - a.count || a.errorPattern.localeCompare(b.errorPattern));
  const reviewItems = activeDemons
    .map((demon) => {
      const question = questionById.get(demon.questionId || demon.id);
      return {
        questionId: demon.questionId || demon.id || "",
        topic: demon.topic || question?.topic || "未知主题",
        pressure: Number(demon.pressure || 0),
        errorPattern: demon.errorPattern || "memory-gap",
        demonType: demon.demonType || errorPatternDefinitions["memory-gap"].demonType,
        concept: demon.concept || question?.concept || `${question?.topic || "未知主题"} · 基础概念`,
        text: `${demon.topic || question?.topic || "未知主题"} · ${demon.demonType || "心魔"} · ${question?.lesson?.keyPoint || "复看题眼"}`,
      };
    })
    .sort((a, b) => b.pressure - a.pressure || a.topic.localeCompare(b.topic));
  const weakestTopic = topicStats
    .filter((item) => item.total > 0)
    .sort((a, b) => b.demonCount - a.demonCount || a.mastery - b.mastery || a.correctCount - b.correctCount)[0] || null;
  const styleWinRates = learningStyleDefinitions.map((style) => {
    const stats = player.styleStats?.[style.id] || {};
    const attempts = Number(stats.attempts || 0);
    const correct = Number(stats.correct || 0);
    return {
      id: style.id,
      name: style.name,
      attempts,
      correct,
      winRate: attempts ? Math.round((correct / attempts) * 1000) / 10 : 0,
    };
  });
  const totalWrongAttempts = Object.values(player.errorStats || {})
    .reduce((sum, stats) => sum + Number(stats.wrongAttempts || 0), 0);
  const errorPortrait = Object.values(errorPatternDefinitions).map((definition) => {
    const wrongAttempts = Number(player.errorStats?.[definition.id]?.wrongAttempts || 0);
    const portraitPercent = totalWrongAttempts ? Math.round((wrongAttempts / totalWrongAttempts) * 1000) / 10 : 0;
    return {
      errorPattern: definition.id,
      name: definition.name,
      demonType: definition.demonType,
      wrongAttempts,
      percent: portraitPercent,
      bar: unicodeBar(portraitPercent),
    };
  });
  const retestAttempts = Number(player.retestStats?.attempts || 0);
  const retestCorrect = Number(player.retestStats?.correct || 0);
  const answerTimeSamples = (player.answerTimeSamples || []).map((value) => Number(value || 0)).filter((value) => value > 0);
  const averageSeconds = answerTimeSamples.length
    ? Math.round((answerTimeSamples.reduce((sum, value) => sum + value, 0) / answerTimeSamples.length) * 10) / 10
    : 0;
  const averageTimeTrend = {
    samples: answerTimeSamples.length,
    averageSeconds,
    label: getAverageTimeTrendLabel(answerTimeSamples),
  };

  return {
    questionProgress: {
      total: prepared.length,
      studiedCount,
      correctCount,
      studiedPercent: percent(studiedCount, prepared.length),
      correctPercent: percent(correctCount, prepared.length),
    },
    chapterStats: {
      totalCount: chapters.length,
      clearedCount: topicStats.filter((item) => item.cleared).length,
    },
    demonStats: {
      activeCount: activeDemons.length,
      purifiedCount: (player.purifiedDemonIds || []).length,
      totalPressure: activeDemons.reduce((sum, demon) => sum + Number(demon.pressure || 0), 0),
    },
    topicStats,
    topicCoverageBars,
    weakestTopic,
    errorPatternStats,
    reviewItems,
    styleWinRates,
    errorPortrait,
    retestAccuracy: {
      attempts: retestAttempts,
      correct: retestCorrect,
      percent: retestAttempts ? Math.round((retestCorrect / retestAttempts) * 1000) / 10 : 0,
    },
    averageTimeTrend,
  };
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
  const mechanic = getChapterMechanicDefinition(question.chapterMechanic);
  return {
    id: `${type}-${index + 1}-${question.id}`,
    index,
    type,
    typeName: nodeConfig.name,
    assetId: nodeConfig.assetId,
    nodeFlavor: nodeConfig.nodeFlavor,
    chapterMechanic: mechanic.id,
    mechanicName: mechanic.name,
    mechanicPrompt: mechanic.prompt,
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
        errorPattern: event.demonProfile?.errorPattern || "",
        demonType: event.demonProfile?.demonType || "",
        diagnosis: event.demonProfile?.diagnosis || "",
        remedy: event.demonProfile?.remedy || "",
        errorDiagnosis: event.errorDiagnosis || null,
        styleId: event.style?.id || "",
        styleName: event.style?.name || "",
        styleFeedback: event.styleFeedback || "",
      },
    ],
  };
}

function updateMindDemon(player, question, details) {
  const nextMindDemons = { ...(player.mindDemons || {}) };
  const existing = nextMindDemons[question.id];
  let purifiedDemonId = null;
  let activeDemon = null;

  if (!details.isCorrect) {
    const pressureGain = Math.max(
      1,
      Math.ceil(question.difficulty * details.stance.demonPressureMultiplier * details.nodeConfig.pressureMultiplier),
    );
    const pressure = (existing?.pressure || 0) + pressureGain;
    activeDemon = {
      id: `demon-${question.id}`,
      questionId: question.id,
      lessonId: question.lesson.id,
      topic: question.topic,
      ...createMindDemonProfile(question),
      pressure,
      purifyCount: 0,
      status: pressure >= 4 ? "rampaging" : "born",
      lastMistake: details.normalizedSelected,
    };
    nextMindDemons[question.id] = activeDemon;
  } else if (existing) {
    const purifyCount = (existing.purifyCount || 0) + 1;
    if (purifyCount >= 2) {
      delete nextMindDemons[question.id];
      purifiedDemonId = question.id;
    } else {
      activeDemon = {
        ...existing,
        pressure: Math.max(0, (existing.pressure || 0) - 2),
        purifyCount,
        status: "weakened",
      };
      nextMindDemons[question.id] = activeDemon;
    }
  }

  return {
    mindDemons: nextMindDemons,
    purifiedDemonId,
    activeDemon,
  };
}

function createMindDemonProfile(question) {
  const errorPattern = getPrimaryErrorPattern(question);
  const definition = errorPatternDefinitions[errorPattern] || errorPatternDefinitions["memory-gap"];

  return {
    enemy: `${question.enemy} · ${definition.demonType}`,
    errorPattern,
    errorPatternName: definition.name,
    demonType: definition.demonType,
    diagnosis: definition.diagnosis,
    remedy: definition.remedy,
    concept: question.concept || `${question.topic} · 基础概念`,
  };
}

function getPrimaryErrorPattern(question) {
  const patterns = Array.isArray(question.errorPatterns) ? question.errorPatterns : [];
  return patterns.find((pattern) => errorPatternDefinitions[pattern]) || "memory-gap";
}

function calculateDamage({ question, stance, nodeConfig, method, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return Math.max(8, question.difficulty * 8);
  const base = 42 + question.difficulty * 12;
  const methodBonus = stance.id === "assault" ? method.assaultDamageBonus : 0;
  const studyBonus = studiedBeforeBattle ? 0.1 : 0;
  const mechanicBonus = studiedBeforeBattle ? getChapterMechanicDefinition(question.chapterMechanic).studiedDamageBonus : 0;
  return Math.round(base * stance.damageMultiplier * nodeConfig.damageMultiplier * (1 + methodBonus + studyBonus + mechanicBonus));
}

function calculateHeartDelta({ question, stance, nodeConfig, method, isCorrect }) {
  if (isCorrect) return nodeConfig.heartRecovery;
  const mechanic = getChapterMechanicDefinition(question.chapterMechanic);
  const guard = stance.id === "steady" ? method.steadyGuardBonus : 0;
  const loss = Math.max(
    1,
    Math.ceil((question.difficulty + 1) * stance.heartLossMultiplier * nodeConfig.pressureMultiplier)
      + mechanic.wrongHeartLossBonus
      - guard,
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

function calculateStudyRewards(wasStudied, context = {}) {
  const style = context.style || getLearningStyle("balanced");
  const effect = getLearningStyleStudyEffect(style, context.question, {
    wasStudied,
    hasActiveDemon: Boolean(context.hasActiveDemon),
  });

  if (wasStudied && !(style.id === "review" && context.hasActiveDemon)) {
    return {
      starGlimmerGain: 0,
      growthXpGain: 0,
      materialsGain: { ...defaultMaterials },
      bondGains: { ...defaultBonds },
      styleFeedback: "复看完成：这次只刷新记忆，不重复领取成长奖励。",
    };
  }

  const baseStarGlimmerGain = wasStudied ? 1 : 3;
  const baseGrowthXpGain = wasStudied ? 3 : 8;
  const baseMaterialsGain = wasStudied ? { ...defaultMaterials } : { ...defaultMaterials, shuye: 1 };
  const baseBondGains = wasStudied
    ? { ...defaultBonds, xiaomo: 1 }
    : { ...defaultBonds, mingche: 1, azhi: 3 };

  return {
    starGlimmerGain: Math.max(0, baseStarGlimmerGain + effect.starGlimmerBonus),
    growthXpGain: Math.max(0, Math.round(baseGrowthXpGain * effect.growthXpMultiplier)),
    materialsGain: baseMaterialsGain,
    bondGains: baseBondGains,
    styleFeedback: effect.feedback,
  };
}

function getLearningStyleStudyEffect(style, question, context = {}) {
  const topic = question?.topic || "";
  const type = question?.type || "";
  const errorPatterns = Array.isArray(question?.errorPatterns) ? question.errorPatterns : [];

  if (style.id === "law") {
    const focused = topic === style.focusTopic;
    return {
      growthXpMultiplier: focused ? 1.5 : 0.7,
      starGlimmerBonus: focused ? 1 : 0,
      feedback: focused
        ? "律令派：教育法规题眼收益提高。"
        : "律令派：跨主题练功收益降低。",
    };
  }

  if (style.id === "concept") {
    const focused = String(type).includes("多") || errorPatterns.includes(style.focusErrorPattern);
    return {
      growthXpMultiplier: focused ? 1.25 : 0.9,
      starGlimmerBonus: focused ? 1 : 0,
      feedback: focused
        ? "观心派：正在强化概念区分。"
        : "观心派：非概念混淆题收益略低。",
    };
  }

  if (style.id === "review") {
    const focused = context.hasActiveDemon || context.wasStudied;
    return {
      growthXpMultiplier: focused ? 1.5 : 0.8,
      starGlimmerBonus: focused ? 2 : 0,
      feedback: focused
        ? "复盘派：错题与复看练功收益提高。"
        : "复盘派：新题练功收益降低。",
    };
  }

  if (style.id === "assault-flow") {
    return {
      growthXpMultiplier: 1.15,
      starGlimmerBonus: 1,
      feedback: "突击派：本局按连破节奏推进。",
    };
  }

  if (style.id === "speed") {
    return {
      growthXpMultiplier: 1.05,
      starGlimmerBonus: 1,
      feedback: "速攻派：练功压缩为限时抓题眼。",
    };
  }

  if (style.id === "deep-read") {
    return {
      growthXpMultiplier: 1.25,
      starGlimmerBonus: 0,
      feedback: "深读派：额外沉淀1张知识点卡片。",
    };
  }

  if (style.id === "chaos") {
    const borrowed = pickChaosBorrowedStyle(question);
    return {
      ...getLearningStyleStudyEffect(borrowed, question, context),
      feedback: `混沌派：本题借用${borrowed.name}练功效果。`,
    };
  }

  return {
    growthXpMultiplier: 1,
    starGlimmerBonus: 0,
    feedback: "均衡派：稳定吸收题眼。",
  };
}

function getLearningStyleBattleEffect(style, context = {}) {
  const question = context.question || {};
  const topic = question.topic || "";
  const type = question.type || "";
  const errorPatterns = Array.isArray(question.errorPatterns) ? question.errorPatterns : [];

  if (style.id === "law") {
    const focused = topic === style.focusTopic;
    return {
      damageMultiplier: focused ? 1.12 : 0.92,
      rewardMultiplier: focused ? 1.5 : 0.7,
      heartGuard: 0,
      heartPenalty: focused ? 0 : 1,
      feedback: focused ? "律令派：法规题战斗收益+50%。" : "律令派：跨主题收益下降并增加风险。",
    };
  }

  if (style.id === "concept") {
    const focused = String(type).includes("多") || errorPatterns.includes(style.focusErrorPattern);
    return {
      damageMultiplier: focused ? 1.08 : 1,
      rewardMultiplier: focused ? 1.08 : 0.9,
      heartGuard: focused ? 1 : 0,
      heartPenalty: 0,
      feedback: focused ? "观心派：概念区分获得额外容错。" : "观心派：本题不是概念主场。",
    };
  }

  if (style.id === "assault-flow") {
    const chainActive = Number(context.player?.streak || 0) >= 1;
    return {
      damageMultiplier: chainActive ? 1.35 : 1.08,
      rewardMultiplier: chainActive ? 2 : 1.15,
      heartGuard: 0,
      heartPenalty: context.isCorrect ? 0 : 1,
      feedback: chainActive ? "突击派：连破倍率生效。" : "突击派：首题先建立连破。",
    };
  }

  if (style.id === "review") {
    const focused = context.hasActiveDemon || context.run?.mode === "demon";
    return {
      damageMultiplier: focused ? 1.2 : 0.95,
      rewardMultiplier: focused ? 2 : 0.8,
      heartGuard: focused ? 1 : 0,
      heartPenalty: 0,
      feedback: focused ? "复盘派：心魔净化收益翻倍。" : "复盘派：新题收益降低。",
    };
  }

  if (style.id === "speed") {
    return {
      damageMultiplier: 1.08,
      rewardMultiplier: 1.3,
      heartGuard: 0,
      heartPenalty: 0,
      feedback: "速攻派：限时压力换取收益+30%。",
    };
  }

  if (style.id === "deep-read") {
    return {
      damageMultiplier: 1.05,
      rewardMultiplier: 1.1,
      heartGuard: 1,
      heartPenalty: 0,
      feedback: "深读派：练功沉淀带来稳定容错。",
    };
  }

  if (style.id === "chaos") {
    const borrowed = pickChaosBorrowedStyle(question);
    return {
      ...getLearningStyleBattleEffect(borrowed, context),
      feedback: `混沌派：本题借用${borrowed.name}效果。`,
    };
  }

  return {
    damageMultiplier: 1,
    rewardMultiplier: 1,
    heartGuard: 1,
    heartPenalty: 0,
    feedback: "均衡派：稳定容错+1。",
  };
}

function updateLearningStyleStats(styleStats = {}, styleId, isCorrect) {
  const current = styleStats?.[styleId] || { attempts: 0, correct: 0 };
  return {
    ...(styleStats || {}),
    [styleId]: {
      attempts: Number(current.attempts || 0) + 1,
      correct: Number(current.correct || 0) + (isCorrect ? 1 : 0),
    },
  };
}

function updateErrorStats(errorStats = {}, errorPattern = "") {
  if (!errorPattern) return { ...(errorStats || {}) };
  const current = errorStats?.[errorPattern] || { wrongAttempts: 0 };
  return {
    ...(errorStats || {}),
    [errorPattern]: {
      wrongAttempts: Number(current.wrongAttempts || 0) + 1,
    },
  };
}

function updateRetestStats(retestStats = {}, hadActiveDemon, isCorrect) {
  const normalized = {
    attempts: Number(retestStats?.attempts || 0),
    correct: Number(retestStats?.correct || 0),
  };
  if (!hadActiveDemon || !isCorrect) return normalized;
  return {
    attempts: normalized.attempts + 1,
    correct: normalized.correct + 1,
  };
}

function pickChaosBorrowedStyle(question = {}) {
  const borrowable = learningStyleDefinitions.filter((style) =>
    ["law", "concept", "assault-flow", "review", "speed", "deep-read"].includes(style.id),
  );
  const seed = String(question.id || question.stem || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return borrowable[seed % borrowable.length] || learningStyleDefinitions[0];
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

function weeklyQuest(id, title, description, current, target, rewards) {
  const safeTarget = Math.max(1, Number(target || 1));
  return {
    id,
    title,
    description,
    progress: {
      current: clamp(Number(current || 0), 0, safeTarget),
      target: safeTarget,
    },
    rewards,
  };
}

function getFatigueState(player = initialPlayerState()) {
  const consecutiveRouteRuns = Number(player.consecutiveRouteRuns || 0);
  if (consecutiveRouteRuns >= 3) {
    return {
      status: "rest-advised",
      consecutiveRouteRuns,
      rewardMultiplier: 0.7,
      warning: `已连续完成 ${consecutiveRouteRuns} 局，建议休息后再继续，后续收益会轻微降低。`,
    };
  }
  return {
    status: "ready",
    consecutiveRouteRuns,
    rewardMultiplier: 1,
    warning: "节奏正常。",
  };
}

function countErrorPatterns(demons = []) {
  return demons.reduce((counts, demon) => {
    const errorPattern = demon.errorPattern || "memory-gap";
    counts[errorPattern] = (counts[errorPattern] || 0) + 1;
    return counts;
  }, {});
}

function percent(current, total) {
  return total ? Math.round((Number(current || 0) / Number(total || 1)) * 1000) / 10 : 0;
}

function unicodeBar(value, width = 10) {
  const filled = Math.max(0, Math.min(width, Math.round((Number(value || 0) / 100) * width)));
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function getAverageTimeTrendLabel(samples = []) {
  if (samples.length < 2) return "稳定";
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (last <= first * 0.9) return "变快";
  if (last >= first * 1.1) return "放慢";
  return "稳定";
}

function getStoryCharacter(characterId) {
  return storyCharacters.find((character) => character.id === characterId) || storyCharacters[0];
}

function dialogueLine(speakerId, text) {
  const character = getStoryCharacter(speakerId);
  return {
    speakerId,
    speakerName: character.name,
    speakerMark: `【${character.name}】`,
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

function buildKnowledgeGraphTree(topic, questions) {
  const root = createConceptNode(topic, [topic]);
  const nodesById = new Map([[root.id, root]]);

  questions.forEach((question) => {
    const path = normalizeConceptPath(question.concept, question.topic || topic);
    let cursor = root;
    path.slice(path[0] === topic ? 1 : 0).forEach((segment) => {
      cursor = getOrCreateConceptChild(cursor, segment, nodesById);
    });
    cursor.questionIds.push(question.id);
    cursor.lessonIds.push(question.lesson.id);
    (question.dependencies || []).forEach((dependency) => {
      cursor.dependencyIds.add(normalizeConceptPath(dependency, question.topic || topic).join(" · "));
    });
  });

  return { root, nodesById };
}

function createConceptNode(label, path) {
  return {
    id: path.join(" · "),
    label,
    path,
    children: [],
    childMap: new Map(),
    questionIds: [],
    lessonIds: [],
    dependencyIds: new Set(),
  };
}

function getOrCreateConceptChild(parent, label, nodesById) {
  if (parent.childMap.has(label)) return parent.childMap.get(label);
  const child = createConceptNode(label, [...parent.path, label]);
  parent.childMap.set(label, child);
  parent.children.push(child);
  nodesById.set(child.id, child);
  return child;
}

function buildKnowledgeGraphState(graph, player) {
  const correctQuestionIds = new Set(player.correctQuestionIds || []);
  const studiedLessonIds = new Set(player.studiedLessonIds || []);
  const activeDemonQuestionIds = new Set(
    Object.values(player.mindDemons || {}).map((demon) => demon.questionId || demon.id),
  );
  const stateById = new Map();

  collectKnowledgeGraphState(graph.root, {
    correctQuestionIds,
    studiedLessonIds,
    activeDemonQuestionIds,
    stateById,
  });
  applyKnowledgeGraphLocks(graph.root, graph.nodesById, stateById);
  refreshKnowledgeGraphBranches(graph.root, stateById);
  return stateById;
}

function collectKnowledgeGraphState(node, context) {
  const childStates = node.children.map((child) => collectKnowledgeGraphState(child, context));
  const directTotal = node.questionIds.length;
  const directCorrect = node.questionIds.filter((id) => context.correctQuestionIds.has(id)).length;
  const directDemons = node.questionIds.filter((id) => context.activeDemonQuestionIds.has(id)).length;
  const directStudied = node.lessonIds.filter((id) => context.studiedLessonIds.has(id)).length;
  const subtreeTotal = directTotal + childStates.reduce((sum, state) => sum + state.subtreeTotal, 0);
  const subtreeCorrect = directCorrect + childStates.reduce((sum, state) => sum + state.subtreeCorrect, 0);
  const subtreeDemons = directDemons + childStates.reduce((sum, state) => sum + state.subtreeDemons, 0);
  const subtreeStudied = directStudied + childStates.reduce((sum, state) => sum + state.subtreeStudied, 0);
  const state = {
    id: node.id,
    node,
    directTotal,
    directCorrect,
    directDemons,
    directStudied,
    subtreeTotal,
    subtreeCorrect,
    subtreeDemons,
    subtreeStudied,
    locked: false,
    blockedBy: "",
    status: "unseen",
  };
  context.stateById.set(node.id, state);
  return state;
}

function applyKnowledgeGraphLocks(node, nodesById, stateById) {
  const state = stateById.get(node.id);
  if (state.directTotal > 0 && state.directCorrect < state.directTotal && state.directDemons === 0) {
    const blockedBy = getUnsatisfiedDependency(node, nodesById, stateById);
    if (blockedBy) {
      state.locked = true;
      state.blockedBy = blockedBy;
    }
  }
  node.children.forEach((child) => applyKnowledgeGraphLocks(child, nodesById, stateById));
}

function getUnsatisfiedDependency(node, nodesById, stateById) {
  for (const dependencyId of node.dependencyIds) {
    const dependencyNode = nodesById.get(dependencyId);
    if (!dependencyNode) continue;
    const dependencyState = stateById.get(dependencyNode.id);
    if (!isKnowledgeDependencySatisfied(dependencyState)) {
      return dependencyNode.id;
    }
  }
  return "";
}

function isKnowledgeDependencySatisfied(state) {
  if (!state || state.subtreeTotal === 0) return true;
  return state.subtreeCorrect >= state.subtreeTotal && state.subtreeDemons === 0 && !state.locked;
}

function refreshKnowledgeGraphBranches(node, stateById) {
  node.children.forEach((child) => refreshKnowledgeGraphBranches(child, stateById));
  const state = stateById.get(node.id);
  const childStates = node.children.map((child) => stateById.get(child.id));
  state.subtreeLocked = (state.locked ? 1 : 0) + childStates.reduce((sum, child) => sum + (child.subtreeLocked || 0), 0);
  state.status = resolveKnowledgeGraphStatus(state);
}

function resolveKnowledgeGraphStatus(state) {
  if (state.directTotal > 0) {
    if (state.directDemons > 0) return "demon";
    if (state.locked) return "locked";
    if (state.directCorrect >= state.directTotal) return "mastered";
    if (state.directStudied > 0) return "studied";
    return "unseen";
  }
  if (state.subtreeDemons > 0) return "branch-demon";
  if (state.subtreeLocked > 0) return "branch-locked";
  if (state.subtreeTotal > 0 && state.subtreeCorrect >= state.subtreeTotal) return "branch-mastered";
  if (state.subtreeCorrect > 0 || state.subtreeStudied > 0) return "branch-partial";
  return "branch-unseen";
}

function appendKnowledgeGraphLine({ node, stateById, lines, maxLines, prefix, isLast }) {
  if (lines.length >= maxLines) return countKnowledgeGraphNodes(node);

  const connector = isLast ? "└── " : "├── ";
  const state = stateById.get(node.id);
  lines.push(`${prefix}${connector}${node.label} ${formatKnowledgeGraphMarker(state, stateById)}`);

  let truncatedCount = 0;
  const childPrefix = `${prefix}${isLast ? "    " : "│   "}`;
  node.children.forEach((child, index) => {
    truncatedCount += appendKnowledgeGraphLine({
      node: child,
      stateById,
      lines,
      maxLines,
      prefix: childPrefix,
      isLast: index === node.children.length - 1,
    });
  });
  return truncatedCount;
}

function formatKnowledgeGraphMarker(state, stateById) {
  if (state.status === "mastered") return "✓";
  if (state.status === "demon") return `✗（心魔 ${state.directDemons}）`;
  if (state.status === "locked") return `🔒（${formatDependencyBlocker(state, stateById)}）`;
  if (state.status === "studied") return "◐";
  if (state.status === "branch-mastered") return "✓";
  if (state.status === "branch-demon") return `✗（心魔 ${state.subtreeDemons}）`;
  if (state.status === "branch-locked") return `· 锁定 ${state.subtreeLocked}`;
  if (state.status === "branch-partial") return `· ${state.subtreeCorrect}/${state.subtreeTotal}`;
  return "○";
}

function formatDependencyBlocker(state, stateById) {
  const blocker = stateById.get(state.blockedBy);
  const action = blocker?.subtreeDemons ? "需先净化" : "需先点亮";
  return `${action} ${shortConceptName(state.blockedBy)}`;
}

function shortConceptName(conceptId) {
  const parts = String(conceptId || "").split(" · ");
  return parts[parts.length - 1] || "前置概念";
}

function countKnowledgeGraphNodes(node) {
  return (node.questionIds.length ? 1 : 0) + node.children.reduce((sum, child) => sum + countKnowledgeGraphNodes(child), 0);
}

function isRouteQuestionUnlocked(question, questions, player) {
  const dependencies = Array.isArray(question.dependencies) ? question.dependencies : [];
  if (!dependencies.length) return true;

  return dependencies.every((dependency) =>
    isRouteDependencySatisfied(dependency, question.topic, questions, player),
  );
}

function isRouteDependencySatisfied(dependency, topic, questions, player) {
  const dependencyId = normalizeConceptPath(dependency, topic).join(" · ");
  const correctQuestionIds = new Set(player.correctQuestionIds || []);
  const activeDemonQuestionIds = new Set(
    Object.values(player.mindDemons || {}).map((demon) => demon.questionId || demon.id),
  );
  const dependencyQuestions = questions.filter((question) => {
    const conceptId = normalizeConceptPath(question.concept, question.topic || topic).join(" · ");
    return conceptId === dependencyId || conceptId.startsWith(`${dependencyId} · `);
  });

  if (!dependencyQuestions.length) return true;
  return dependencyQuestions.every((question) =>
    correctQuestionIds.has(question.id) && !activeDemonQuestionIds.has(question.id),
  );
}

function getRouteQuestionRank(question, player) {
  const studiedLessonIds = new Set(player.studiedLessonIds || []);
  const answeredQuestionIds = new Set(player.answeredQuestionIds || []);
  const correctQuestionIds = new Set(player.correctQuestionIds || []);
  const activeDemonQuestionIds = new Set(
    Object.values(player.mindDemons || {}).map((demon) => demon.questionId || demon.id),
  );

  if (activeDemonQuestionIds.has(question.id)) return 2;
  if (correctQuestionIds.has(question.id)) return 3;
  if (!studiedLessonIds.has(question.lesson.id) && !answeredQuestionIds.has(question.id)) return 0;
  if (!correctQuestionIds.has(question.id)) return 1;
  return 4;
}

function normalizeConceptPath(value, topic) {
  const fallbackTopic = String(topic || "综合知识").trim() || "综合知识";
  const parts = String(value || "")
    .split(/[·>/|]/u)
    .map((part) => part.trim())
    .filter(Boolean);
  const normalized = parts.length ? parts : [fallbackTopic, "基础概念"];
  if (normalized[0] !== fallbackTopic) return [fallbackTopic, ...normalized];
  return normalized;
}

function maskLawKeywords(question, difficulty = 1) {
  const count = Math.min(3, Math.max(1, Number(difficulty || 1)));
  const keywords = extractMechanicKeywords(question).slice(0, count);
  const maskedText = keywords.reduce((text, keyword) => {
    if (!keyword) return text;
    const masked = keyword.length <= 2
      ? "__"
      : `${keyword.slice(0, 1)}${"_".repeat(Math.min(4, keyword.length - 1))}`;
    return text.replace(keyword, masked);
  }, question.stem);
  if (maskedText !== question.stem) return maskedText;
  return String(question.stem || "").replace(/关键词|保障|入学|义务教育/u, "__");
}

function extractMechanicKeywords(question) {
  const candidates = [
    ...(question.lesson?.keyPoint || "").split(/[、,，；;和与]/u),
    ...(String(question.explanation || "").match(/应当|可以|不得|必须|禁止|免试|就近|政府保障|权利|义务/gu) || []),
    ...(String(question.stem || "").match(/应当|可以|不得|必须|禁止|免试|就近|政府保障|权利|义务/gu) || []),
  ];
  return unique(candidates.map((item) => String(item).trim()).filter((item) => item.length >= 2));
}

function buildConceptMazeWarnings(question) {
  const hasConceptTrap = (question.errorPatterns || []).includes("concept-confusion") || String(question.type || "").includes("多");
  if (!hasConceptTrap) return [];
  return question.options.slice(0, 4).map((option, index) => ({
    key: option.key,
    level: index % 2 === 0 ? "概念边界" : "相似措辞",
    text: index % 2 === 0 ? "检查该选项是否把相近概念互换。" : "检查半对半错的混合表述。",
  }));
}

function getHourglassSeconds(difficulty = 1) {
  const level = Math.min(3, Math.max(1, Number(difficulty || 1)));
  if (level <= 1) return 60;
  if (level === 2) return 45;
  return 30;
}

function getPrecisionMemoryHint(question, player) {
  const demon = player.mindDemons?.[question.id];
  const keyPoint = question.lesson?.keyPoint || question.answer || "答案";
  if (!demon) return "首次答错会强制生成心魔，净化后再试。";
  if ((demon.purifyCount || 0) <= 0) return `首字提示：${String(keyPoint).slice(0, 1)}...`;
  return "本次不再给提示，按完整关键词精确回忆。";
}

function pickChaosMechanic(question = {}) {
  const mechanics = ["law-fog", "concept-maze", "time-hourglass", "ethics-scale", "strategy-chain", "precision-memory"];
  const seed = String(question.id || question.stem || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return mechanics[seed % mechanics.length];
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
  const mechanic = getChapterMechanicDefinition(question.chapterMechanic);
  const base = studiedBeforeBattle
    ? `练功检验：已回看讲解，题眼“${question.lesson.keyPoint}”进入破阵结算。`
    : `战斗检验：未练功直接出阵，结算后回看讲解“${question.lesson.keyPoint}”。`;
  return `${base}章节机制：${mechanic.name}，${mechanic.prompt}`;
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

function getQuestionForNode(node, questions = []) {
  const raw = questions.find((question) => question.id === node.questionId);
  return raw ? prepareQuestions([raw])[0] : null;
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
