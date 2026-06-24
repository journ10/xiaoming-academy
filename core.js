import {
  getChapterMechanic,
  inferConcept,
  normalizeErrorPatterns,
} from "./src/content-rules.js?v=study-journal-20260623s";

export const browserRuntimeQuestionBankSourceType = "browser-runtime-question-bank-v1";
export const browserRuntimeQuestionIndexSourceType = "browser-runtime-question-index-v1";

const preparedQuestionMarker = Symbol("xiaomingAcademyPreparedQuestion");

function markPreparedQuestion(question) {
  if (!question || typeof question !== "object") return question;
  Object.defineProperty(question, preparedQuestionMarker, {
    value: true,
    configurable: true,
  });
  return question;
}

function markPreparedQuestions(questions = []) {
  questions.forEach(markPreparedQuestion);
  return questions;
}

function isPreparedQuestion(question) {
  return Boolean(question?.[preparedQuestionMarker]);
}

function isPreparedQuestionBank(questions) {
  return Array.isArray(questions) && questions.length > 0 && questions.every(isPreparedQuestion);
}

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
    description: "教育法规短课收益提高，跨主题短课收益降低。",
    focusTopic: "教育法律法规与政策制度",
    unlock: "base",
  },
  {
    id: "concept",
    name: "观心派",
    shortName: "观",
    description: "概念混淆和多选题短课收益提高，适合精确区分概念。",
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
    description: "心魔与复看短课收益提高，新题短课收益降低。",
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
    description: "短课额外沉淀知识点卡片，适合慢速精读。",
    unlock: "chapter-4",
  },
  {
    id: "chaos",
    name: "混沌派",
    shortName: "混",
    description: "每题借用一种已学流派效果，适合综合模拟迁移。",
    unlock: "all-domains",
  },
];

export const rogueliteRunModes = [
  {
    id: "explore",
    name: "探索局",
    primaryAction: "点亮新概念",
    title: "探索新题",
    summary: "推进推荐知识域，点亮新的题眼和概念。",
  },
  {
    id: "purify",
    name: "净化局",
    primaryAction: "净化错题心魔",
    title: "净化心魔",
    summary: "优先处理已生成的错题心魔，降低重复错误。",
  },
  {
    id: "sprint",
    name: "冲刺局",
    primaryAction: "混合检验",
    title: "综合冲刺",
    summary: "跨知识域抽题，检验考试迁移能力。",
  },
];

export const rogueliteBuildDefinitions = [
  {
    id: "steady",
    name: "稳修",
    risk: "低",
    reward: "稳",
    summary: "心力容错更高，适合先把一局稳定打完。",
    recommendationReason: "当前更适合稳扎稳打，先建立一局完整节奏。",
  },
  {
    id: "assault",
    name: "突击",
    risk: "高",
    reward: "高",
    summary: "连对收益更高，失误代价更重，适合熟悉题池后冲刺。",
    recommendationReason: "你已经有一定答题覆盖，可以用高风险换更快推进。",
  },
  {
    id: "review",
    name: "复盘",
    risk: "中",
    reward: "错题高",
    summary: "心魔净化收益更高，新题推进放慢，适合查漏补缺。",
    recommendationReason: "当前有活跃心魔，优先复盘比继续开新题更有效。",
  },
];

export const materialTypes = [
  { id: "shuye", name: "书页", assetId: "item.shuye" },
  { id: "moyu", name: "墨玉", assetId: "item.moyu" },
];

const heartPowerUpgradeLimit = 12;

export const errorPatternDefinitions = {
  "concept-confusion": {
    id: "concept-confusion",
    name: "概念混淆",
    demonType: "镜像心魔",
    diagnosis: "相似概念边界未分清，容易把选项互相替换。",
    remedy: "看题眼短课做概念对比，再用观照破招检查题眼差异。",
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
    remedy: "先看题眼短课，记住题眼和最小知识点。",
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
  "law-review": {
    id: "law-review",
    name: "法规审题",
    prompt: "圈主体、义务词、责任后果，再判断应当、可以、不得等措辞。",
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
    materialRewards: { shuye: 2 },
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
    materialRewards: { shuye: 3 },
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
    materialRewards: { shuye: 2 },
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
    materialRewards: { shuye: 2 },
    resonanceMultiplier: 1.2,
  },
  trial: {
    id: "trial",
    name: "试炼",
    description: "高压高奖，用来验证题域熟练度。",
    assetId: "node.trial",
    nodeFlavor: "试炼印开启，适合在短课后冲击题阵星标。",
    rewardMultiplier: 1.85,
    pressureMultiplier: 1.55,
    damageMultiplier: 1.28,
    heartRecovery: 0,
    materialRewards: { shuye: 4 },
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
    role: "短课同伴",
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
    specialty: "心魔回廊与学习域进度",
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

export const learningDomainDefinitions = [
  {
    id: "law_policy",
    name: "教育法律法规与政策制度",
    shortName: "法规政策",
    legacyTopics: ["教育法规"],
    chapterId: "chapter-law-policy",
    title: "第一章 法规政策营",
    characterId: "mingche",
    summary: "精确掌握教育法律、政策制度与权利义务题眼。",
  },
  {
    id: "pedagogy_curriculum_instruction",
    name: "教育学原理、课程与教学",
    shortName: "课程教学",
    legacyTopics: ["教学设计"],
    chapterId: "chapter-pedagogy",
    title: "第二章 课程教学工坊",
    characterId: "qinglan",
    summary: "把教育目的、课程、教学原则、方法与评价连成可迁移结构。",
  },
  {
    id: "learning_psychology",
    name: "学习心理与认知机制",
    shortName: "学习心理",
    legacyTopics: ["教育心理学"],
    chapterId: "chapter-learning-psychology",
    title: "第三章 学习心理实验室",
    characterId: "azhi",
    summary: "辨析学习、动机、迁移、记忆与认知机制，减少概念混淆。",
  },
  {
    id: "student_development",
    name: "学生身心发展与个体差异",
    shortName: "学生发展",
    legacyTopics: ["儿童发展"],
    chapterId: "chapter-student-development",
    title: "第四章 学生发展观察站",
    characterId: "xiaomo",
    summary: "理解身心发展规律、年龄特征与个体差异，稳定处理发展类题。",
  },
  {
    id: "moral_classroom_management",
    name: "德育、班级管理与家校协同",
    shortName: "德育班管",
    legacyTopics: ["班级管理"],
    chapterId: "chapter-classroom-moral",
    title: "第五章 德育班管现场",
    characterId: "qinglan",
    summary: "训练德育、班级管理、师生沟通与家校协同中的情境判断顺序。",
  },
  {
    id: "teacher_ethics_professionalism",
    name: "教师职业素养与专业规范",
    shortName: "教师素养",
    legacyTopics: ["教师职业道德"],
    chapterId: "chapter-teacher-professionalism",
    title: "第六章 教师素养评议厅",
    characterId: "mingche",
    summary: "把师德规范、专业理念与教师行为边界练成清晰判断。",
  },
];

export const manualClassificationDomain = {
  id: "needs_manual_classification",
  name: "待人工归类",
};

const learningDomainById = new Map(learningDomainDefinitions.map((domain) => [domain.id, domain]));
const learningDomainByName = new Map(learningDomainDefinitions.map((domain) => [domain.name, domain]));
const legacyTopicToLearningDomain = new Map(
  learningDomainDefinitions.flatMap((domain) =>
    (domain.legacyTopics || []).map((topic) => [topic, domain]),
  ),
);

const storyChapterTemplates = learningDomainDefinitions.map((domain) => ({
  id: domain.chapterId,
  topic: domain.name,
  title: domain.title,
  characterId: domain.characterId,
  summary: domain.summary,
}));

const legacyStoryChapterTemplates = [
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
  "chapter-law-policy": [
    ["mingche", "这一章只保留和考试判断有关的法条、政策与制度线索。先确认主体、权利义务和关键词。"],
    ["azhi", "遇到相似表述时，不急着选；先问它是在考法律条文、政策要求，还是管理常识。"],
  ],
  "chapter-pedagogy": [
    ["qinglan", "课程教学题不靠背模板通关。目标、内容、过程、方法、评价必须能连起来。"],
    ["mingche", "这一章会把教育学原理和教学设计放在同一条训练线上，避免只按旧标签硬分。"],
  ],
  "chapter-learning-psychology": [
    ["azhi", "学习心理题最容易把相似概念混在一起。先抓定义边界，再看材料里的行为证据。"],
    ["qinglan", "如果一道题答错，先回到概念差异，不要只记答案字母。"],
  ],
  "chapter-student-development": [
    ["xiaomo", "学生发展题考的是年龄特征、发展规律和个体差异。判断要贴着儿童真实状态走。"],
    ["azhi", "这一章不和学习心理混在一起；它更关注学生是谁、处在什么发展阶段。"],
  ],
  "chapter-classroom-moral": [
    ["qinglan", "德育和班级管理题先看现场顺序：安全、情绪、事实、沟通、跟进。"],
    ["mingche", "家校协同和班主任工作也放在这里，因为它们考的是教育现场的处理链条。"],
  ],
  "chapter-teacher-professionalism": [
    ["mingche", "教师职业素养不是几句师德口号，而是具体场景里的专业边界。"],
    ["xiaomo", "遇到价值判断题，先看是否尊重学生、依法执教、为人师表，再判断选项强弱。"],
  ],
  "chapter-law": [
    ["mingche", "律令花窗是书院最外层的防护。若这里失光，后面的秘境都会被遗忘之雾慢慢抹去。"],
    ["azhi", "我在窗棂边看见一缕黑墨。它不像雾，倒像有人故意留下的笔迹。"],
    ["qinglan", "那就先把题阵打亮。答案落稳，花窗才会告诉我们它到底藏了什么。"],
  ],
  "chapter-psychology": [
    ["azhi", "观心花园会照出你答题时的犹豫。不要害怕，犹豫通常说明题眼还没被你抓住。"],
    ["qinglan", "这里的心魔擅长把选项搅乱。先看短课，再进阵，我不想看你被镜子骗第二次。"],
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
    ["mingche", "六章点亮后，创始人的试炼会真正开启。那时书院会承认你是新的守卷人。"],
  ],
  "chapter-final": [
    ["xiaomo", "万象书阁不会只考一章。它会把你走过的每种错误、每种题眼都重新混在一起。"],
    ["mingche", "创始人前辈留下的不是惩罚，而是一封很长的信。只有愿意面对错题的人能读完。"],
    ["azhi", "如果我们能点亮这里，书院就不只是修好了。它会开始等待下一位巡游者。"],
  ],
};

const blackInkSayings = [
  { id: "intro", chapterId: "intro", text: "学习不是填满水桶，而是点燃火焰。" },
  { id: "chapter-law-policy", chapterId: "chapter-law-policy", text: "法规题先找主体，再找权利义务和关键词。" },
  { id: "chapter-pedagogy", chapterId: "chapter-pedagogy", text: "教学题不是背模板，而是连起目标、过程和评价。" },
  { id: "chapter-learning-psychology", chapterId: "chapter-learning-psychology", text: "概念辨析先看边界，再看材料证据。" },
  { id: "chapter-student-development", chapterId: "chapter-student-development", text: "理解学生发展，是判断教育行为是否合适的前提。" },
  { id: "chapter-classroom-moral", chapterId: "chapter-classroom-moral", text: "班级现场先稳秩序和情绪，再处理事实与跟进。" },
  { id: "chapter-teacher-professionalism", chapterId: "chapter-teacher-professionalism", text: "教师专业判断，要同时守住伦理、法律和教育目的。" },
  { id: "chapter-law", chapterId: "chapter-law", text: "法律的生命不在于逻辑，而在于精确。" },
  { id: "chapter-psychology", chapterId: "chapter-psychology", text: "理解不是记住定义，而是看到差异。" },
  { id: "chapter-design", chapterId: "chapter-design", text: "教学不是展示所有知识，而是选择最重要的。" },
  { id: "chapter-ethics", chapterId: "chapter-ethics", text: "师德不是做圣人，而是做清醒的人。" },
  { id: "chapter-classroom", chapterId: "chapter-classroom", text: "管理的艺术不是控制，而是引导。" },
  { id: "chapter-child", chapterId: "chapter-child", text: "理解儿童，不是降低要求，而是知道怎么把要求递到他们够得到的地方。" },
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
    dailyQuestProgress: {
      day: "",
      studiedLessonIds: [],
      correctQuestionIds: [],
      resonanceTopicIds: [],
      demonPurifications: 0,
    },
    weeklyQuestProgress: {
      week: "",
      correctQuestionIds: [],
      purifiedDemonIds: [],
      topicCorrectCounts: {},
    },
    dailyQuestClaims: {},
    journalCollection: {
      stickers: [],
      bookmarks: [],
      fragments: 0,
    },
    answerTimeSamples: [],
    earnedTitles: [],
    consecutiveRouteRuns: 0,
    lastRouteRunDay: "",
    lastFatigueRestDay: "",
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

export function applyQuestionClassifications(rawQuestions = [], classificationAudit = {}) {
  const questions = Array.isArray(rawQuestions) ? rawQuestions : rawQuestions?.questions || [];
  const auditItems = Array.isArray(classificationAudit)
    ? classificationAudit
    : classificationAudit?.questions || [];
  const auditByKey = new Map();
  const auditByIndex = new Map();

  auditItems.forEach((item) => {
    if (item?.classificationKey) auditByKey.set(String(item.classificationKey), item);
    if (Number.isInteger(item?.bankIndex)) auditByIndex.set(Number(item.bankIndex), item);
  });

  return questions.map((raw, index) => {
    const sourceId = String(raw?.sourceId || raw?.id || `question-${index + 1}`);
    const classificationKey = String(raw?.classificationKey || `${sourceId}#${index}`);
    const audit = auditByKey.get(classificationKey) || auditByIndex.get(index) || null;
    const primaryDomain = normalizePrimaryDomain(audit?.classification?.primaryDomain, raw?.topic);
    const qualityStatus = normalizeQualityStatus(audit?.quality?.status || raw?.qualityStatus || raw?.quality?.status);
    const gameplayStatus = deriveGameplayStatus(primaryDomain.name, qualityStatus);
    const bankIndex = Number.isInteger(audit?.bankIndex) ? Number(audit.bankIndex) : index;
    const id = createStableQuestionId(sourceId, bankIndex);
    const classification = audit?.classification
      ? {
          ...audit.classification,
          primaryDomain,
        }
      : {
          primaryDomain,
          secondaryDomains: [],
          knowledgePath: `${primaryDomain.name} · 基础概念`,
          subdomain: "基础概念",
          examAbilities: [],
          confidence: "fallback",
          evidence: [],
        };

    return {
      ...raw,
      id,
      sourceId,
      bankIndex,
      classificationKey,
      topic: primaryDomain.name,
      classification,
      qualityStatus,
      qualityReasons: audit?.quality?.reasons || raw?.qualityReasons || [],
      gameplayStatus,
      sourceLocation: {
        ...(audit?.source || {}),
        questionSourcePage: audit?.source?.questionSourcePage ?? raw?.ocr?.sourcePage,
        answerSourcePage: audit?.source?.answerSourcePage ?? raw?.ocr?.answerSourcePage,
        sourceRef: audit?.source?.sourceRef || raw?.sourceRef || "",
        examTitle: audit?.source?.examTitle || raw?.ocr?.examTitle || "",
      },
    };
  });
}

export function prepareQuestions(rawQuestions = []) {
  if (isPreparedQuestionBank(rawQuestions)) return rawQuestions;

  const rawIds = rawQuestions.map((raw, index) => String(raw?.id || `question-${index + 1}`));
  const rawIdCounts = rawIds.reduce((counts, id) => counts.set(id, (counts.get(id) || 0) + 1), new Map());

  return rawQuestions.map((raw, index) => {
    const topic = String(raw.topic || "综合知识");
    const profile = getTopicProfile(topic);
    const options = normalizeOptions(raw.options).map((option) => ({
      ...option,
      text: normalizeQuestionCopy(option.text),
    }));
    const rawId = String(raw.id || `question-${index + 1}`);
    const sourceId = String(raw.sourceId || rawId);
    const alreadyStable = Boolean(raw.sourceId && rawId !== raw.sourceId);
    const bankIndex = Number.isInteger(raw.bankIndex) ? Number(raw.bankIndex) : index;
    const id = alreadyStable || rawIdCounts.get(rawId) <= 1
      ? rawId
      : createStableQuestionId(sourceId, bankIndex);
    const difficulty = clamp(Number(raw.difficulty || inferDifficulty(raw)), 1, 5);
    const explanation = normalizeQuestionCopy(raw.explanation || raw.analysis || "讲解还在整理中。");
    const qualityStatus = normalizeQualityStatus(raw.qualityStatus || raw.quality?.status);
    const gameplayStatus = String(raw.gameplayStatus || deriveGameplayStatus(topic, qualityStatus));
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

    return markPreparedQuestion({
      ...raw,
      id,
      sourceId,
      bankIndex,
      year: String(raw.year || "未标注"),
      type: String(raw.type || "练习题"),
      topic,
      stem: normalizeQuestionCopy(raw.stem || "题干还在整理中"),
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
      qualityStatus,
      gameplayStatus,
      qualityReasons: Array.isArray(raw.qualityReasons) ? raw.qualityReasons : raw.quality?.reasons || [],
      lesson,
    });
  });
}

export function parseQuestionImport(payload, options = {}) {
  const rawQuestions = Array.isArray(payload) ? payload : payload?.questions;
  if (!Array.isArray(rawQuestions) || !rawQuestions.length) {
    throw new Error("秘卷格式不对：需要一组题目。");
  }

  if (
    !Array.isArray(payload)
    && (
      payload?.sourceType === browserRuntimeQuestionBankSourceType
      || payload?.sourceType === browserRuntimeQuestionIndexSourceType
    )
    && payload?.runtime?.prepared
  ) {
    return markPreparedQuestions(expandRuntimeQuestionBank(payload));
  }

  const classificationAudit = options.classificationAudit || payload?.classificationAudit || null;
  const classifiedQuestions = classificationAudit
    ? applyQuestionClassifications(rawQuestions, classificationAudit)
    : rawQuestions;

  return prepareQuestions(classifiedQuestions.map((raw, index) => validateImportedQuestion(raw, index)));
}

function expandRuntimeQuestionBank(payload) {
  if (payload?.runtime?.encoding !== "schema-array") return payload.questions;

  const questionSchema = payload.runtime.questionSchema || [];
  const optionSchema = payload.runtime.optionSchema || [];
  const lessonSchema = payload.runtime.lessonSchema || [];

  return payload.questions.map((record) => {
    if (!Array.isArray(record)) return record;
    const question = expandSchemaRecord(record, questionSchema);
    if (Array.isArray(question.options)) {
      question.options = question.options.map((option) =>
        Array.isArray(option) ? expandSchemaRecord(option, optionSchema) : option,
      );
    }
    if (Array.isArray(question.lesson)) {
      question.lesson = expandSchemaRecord(question.lesson, lessonSchema);
    }
    if (!question.explanation && question.lesson?.explanation) {
      question.explanation = question.lesson.explanation;
    }
    return question;
  });
}

function expandSchemaRecord(record, schema) {
  return schema.reduce((value, key, index) => {
    if (record[index] !== undefined) value[key] = record[index];
    return value;
  }, {});
}

export function summarizeQuestionBank(payload, options = {}) {
  const rawQuestions = Array.isArray(payload) ? payload : payload?.questions || [];
  const ocr = Array.isArray(payload) ? {} : payload?.ocr || {};
  const classificationAudit = options.classificationAudit || payload?.classificationAudit || null;
  const auditItems = classificationAudit?.questions || [];
  const playableQuestionCount = Number(ocr.mergedQuestionCount || rawQuestions.length || 0);
  const sourceTotalQuestionSlots = Number(ocr.sourceTotalQuestionSlots || playableQuestionCount || 0);
  const reviewQuestionCount = Number(
    classificationAudit?.summary?.needsReviewCount
      ?? ocr.reviewQuestionCount
      ?? rawQuestions.filter((question) => question.ocr?.requiresReview).length,
  );
  const manualClassificationCount = Number(
    classificationAudit?.summary?.byPrimaryDomain?.[manualClassificationDomain.name]
      ?? auditItems.filter((item) => item.classification?.primaryDomain?.id === manualClassificationDomain.id).length,
  );
  const mainlineQuestionCount = auditItems.length
    ? auditItems.filter((item) =>
        item.classification?.primaryDomain?.id !== manualClassificationDomain.id
          && normalizeQualityStatus(item.quality?.status) === "clean",
      ).length
    : playableQuestionCount;
  const practiceOnlyQuestionCount = auditItems.length
    ? auditItems.filter((item) =>
        item.classification?.primaryDomain?.id !== manualClassificationDomain.id
          && normalizeQualityStatus(item.quality?.status) === "usable_with_caution",
      ).length
    : 0;
  const sourceCoveragePercent = sourceTotalQuestionSlots
    ? Math.round((playableQuestionCount / sourceTotalQuestionSlots) * 1000) / 10
    : 0;

  return {
    sourceExamCount: Number(ocr.sourceExamCount || 0),
    sourceTotalQuestionSlots,
    playableQuestionCount,
    reviewQuestionCount,
    manualClassificationCount,
    mainlineQuestionCount,
    practiceOnlyQuestionCount,
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
  const mergedPlayer = {
    ...initialPlayerState(),
    ...(player || {}),
    journalCollection: normalizeJournalCollection(player?.journalCollection),
  };

  return {
    type: "xiaoming-academy-save",
    version: 1,
    exportedAt: new Date().toISOString(),
    selectedChapterId: chapters.length ? resolveArchiveChapterId(chapters, selectedChapterId) : String(selectedChapterId || ""),
    scene: String(scene || "world"),
    player: preparedQuestions.length
      ? prunePlayerForQuestions(mergedPlayer, preparedQuestions)
      : mergedPlayer,
  };
}

export function parseSaveArchive(payload, options = {}) {
  if (!payload || typeof payload !== "object") {
    throw new Error("这不是小明书院存档。");
  }
  if (Array.isArray(payload) || (payload.questions && !payload.player)) {
    throw new Error("这段内容像题卷，不是存档码。请粘贴从“导出存档”得到的存档码。");
  }
  if (payload.type && payload.type !== "xiaoming-academy-save") {
    throw new Error("这段存档不属于小明书院。");
  }

  const contextQuestions = Array.isArray(options) ? options : options.questions || [];
  const preparedQuestions = contextQuestions.length ? prepareQuestions(contextQuestions) : [];
  const chapters = createStoryChapters(preparedQuestions);
  const sourcePlayer = payload.player || payload;
  const mergedPlayer = {
    ...initialPlayerState(),
    ...sourcePlayer,
    journalCollection: normalizeJournalCollection(sourcePlayer.journalCollection),
  };
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
    journalCollection: normalizeJournalCollection(player.journalCollection, { questionIds }),
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
  if (style.unlock === "all-domains") {
    return chapters.length > 0 && clearedChapters.length >= chapters.length
      ? { unlocked: true, reason: "六个知识域已全部通关" }
      : { unlocked: false, reason: "需要六个知识域全部通关" };
  }
  return { unlocked: false, reason: "条件还不够" };
}

function withRecommendationReason(style, reason) {
  return {
    ...style,
    reason,
  };
}

export function createStoryChapters(questions = [], options = {}) {
  const prepared = prepareQuestions(questions).filter((question) => isQuestionAllowedForMode(question, "mainline"));
  const byTopic = new Map();

  prepared.forEach((question) => {
    if (!byTopic.has(question.topic)) byTopic.set(question.topic, []);
    byTopic.get(question.topic).push(question);
  });

  const templates = [...storyChapterTemplates, ...legacyStoryChapterTemplates];
  const orderedTopics = [
    ...templates.map((template) => template.topic).filter((topic) => byTopic.has(topic)),
    ...[...byTopic.keys()].filter(
      (topic) => !templates.some((template) => template.topic === topic),
    ),
  ];

  return orderedTopics.map((topic, index) => {
    const template = templates.find((item) => item.topic === topic);
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
      summary: template?.summary || `整理${topic}题眼，完成本章学习与题阵检验。`,
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
      reason: "先选择一个章节。",
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

  const requiredChapters = [getPreviousChapter(chapter, orderedChapters)].filter(Boolean);
  const missingChapters = requiredChapters.filter((item) => !chapterClears[item.id]);

  if (!missingChapters.length) {
    return {
      available: true,
      status: "available",
      reason: "前置章节已点亮。",
      requiredChapterIds: requiredChapters.map((item) => item.id),
      missingChapterIds: [],
    };
  }

  return {
    available: false,
    status: "locked",
    reason: `需先点亮${missingChapters[0].title}。`,
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
    reason = "学习域已点亮，可以继续下一组题阵。";
  } else if (!player.storyFlags?.[chapter.id]) {
    recommendedAction = "story";
    reason = "先触发本章剧情，明确这章要修复的秘卷裂隙。";
  } else if (progress.demonCount > 0) {
    recommendedAction = "review";
    reason = "本章有活跃心魔，先复训净化再推进封印。";
  } else if (progress.studiedCount < progress.total) {
    recommendedAction = "training";
    reason = "先看题眼短课，让题阵变成检验而不是硬猜。";
  } else if (progress.correctCount < progress.total || progress.mastery < progress.requiredMastery) {
    recommendedAction = "battle";
    reason = "已完成短课，进入题阵检验掌握度。";
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
    lines.push("还没有概念节点");
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
      dialogueLine(lead.id, `继续巡游下一处裂隙吧。真正的通关，是整本秘卷都能稳稳答对。`),
    ];
  }

  return [
    ...common,
    ...getChapterNarrativeLines(chapter),
    dialogueLine(lead.id, state === "opening"
      ? `${chapter.summary} 先看短课，再破阵；答错不会失去希望，但会留下需要净化的心魔。`
      : `本章还没完全点亮。看行动提示，缺短课就补短课，缺检验就进题阵，有心魔就回廊净化。`),
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
  if (!chapters.length || !chapters.every((chapter) => player.chapterClears?.[chapter.id])) return [];
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

function getLearningStyleForRun(player = initialPlayerState(), run = {}) {
  return getLearningStyle(getLearningStyleIdForBuild(run?.buildId) || player.learningStyleId || "balanced");
}

function getLearningStyleIdForBuild(buildId = "") {
  return {
    steady: "balanced",
    assault: "assault-flow",
    review: "review",
  }[buildId] || "";
}

function getVisibleLearningStyleName(style = {}, run = {}) {
  const build = rogueliteBuildDefinitions.find((item) => item.id === run?.buildId);
  if (build && getLearningStyleIdForBuild(build.id) === style.id) return build.name;
  return style.name || "流派";
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
  if (dominantTopic === "教育法律法规与政策制度" && available.some((style) => style.id === "law")) {
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
  const baseState = {
    id: mechanic.id,
    name: mechanic.name,
    prompt: mechanic.prompt,
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
    borrowedMechanicName: "",
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
      borrowedMechanicName: getChapterMechanicDefinition(borrowedMechanic).name,
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
      `看题眼短课复看：${prepared.lesson.keyPoint}`,
      rows[0]?.remedy || "先回看讲解，再进入心魔回廊。",
    ],
  };
}

export function setLearningStyle(player = initialPlayerState(), styleId = "balanced", options = {}) {
  const style = learningStyleDefinitions.find((item) => item.id === styleId);
  if (!style) throw new Error("找不到这种流派。");
  const availability = getLearningStyleAvailability(style, player, options.chapters || []);
  if (!availability.unlocked) throw new Error(`${style.name}还未解锁：${availability.reason}`);
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
  const mode = String(options.mode || "mainline");
  const prepared = prepareQuestions(questions).filter((question) => isQuestionAllowedForMode(question, mode));
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

export function selectMixedSimulationQuestions(questions = [], player = initialPlayerState(), options = {}) {
  const length = Math.max(1, Number(options.length || 10));
  const prepared = prepareQuestions(questions).filter((question) => isQuestionAllowedForMode(question, "simulation"));
  const ranked = selectRouteQuestions(prepared, player, { ...options, length: prepared.length, mode: "simulation" });
  const byTopic = new Map();

  ranked.forEach((question) => {
    if (!byTopic.has(question.topic)) byTopic.set(question.topic, []);
    byTopic.get(question.topic).push(question);
  });

  const selected = [];
  const topicOrder = learningDomainDefinitions.map((domain) => domain.name);
  while (selected.length < length) {
    const before = selected.length;
    topicOrder.forEach((topic) => {
      if (selected.length >= length) return;
      const next = byTopic.get(topic)?.shift();
      if (next) selected.push(next);
    });
    if (selected.length === before) break;
  }

  return selected;
}

export function createMixedSimulationRun(questions = [], player = initialPlayerState(), options = {}) {
  const selected = selectMixedSimulationQuestions(questions, player, options);
  const nodes = selected.map((question, index) => createNode(question, index, routePattern[index % routePattern.length]));

  return createRun({
    mode: "simulation",
    title: options.title || "综合模拟",
    nodes,
  });
}

export function createRunRecommendation(questions = [], player = initialPlayerState()) {
  const activeDemons = Object.values(player.mindDemons || {});
  if (activeDemons.length) {
    const strongest = activeDemons
      .slice()
      .sort((a, b) => Number(b.pressure || 0) - Number(a.pressure || 0))[0];
    return {
      modeId: "purify",
      buildId: "review",
      primaryAction: "开一页题眼手账",
      title: "今日小目标：整理错因心魔",
      reason: `${strongest?.topic || "错题"}还有待整理心魔，先开一页复盘手账会更稳。`,
      targetText: `整理 ${Math.min(2, activeDemons.length)} 个错因心魔`,
      rewardText: "本页奖励：错因书签 + 复盘贴纸",
    };
  }

  const prepared = prepareQuestions(questions).filter((question) => isQuestionAllowedForMode(question, "mainline"));
  const answered = new Set(player.answeredQuestionIds || []);
  const untouched = prepared.filter((question) => !answered.has(question.id));
  if (untouched.length) {
    return {
      modeId: "explore",
      buildId: "steady",
      primaryAction: "开一页题眼手账",
      title: "今日小目标：点亮题眼",
      reason: "还有新题眼没有点亮，先完成一页 5 题手账建立知识覆盖。",
      targetText: "今天点亮 5 个题眼",
      rewardText: "本页奖励：题眼贴纸 + 稳修书签",
    };
  }

  return {
    modeId: "sprint",
    buildId: "steady",
    primaryAction: "开一页题眼手账",
    title: "今日小目标：完成稳修手账",
    reason: "当前新题推进趋稳，适合开一页跨域手账检验迁移能力。",
    targetText: "完成一页稳修手账",
    rewardText: "本页奖励：跨域书签 + 秘卷碎片",
  };
}

export function createRogueliteRun(questions = [], player = initialPlayerState(), options = {}) {
  const recommendation = createRunRecommendation(questions, player);
  const mode = getRogueliteMode(options.modeId || recommendation.modeId);
  const build = getRogueliteBuild(options.buildId || recommendation.buildId);
  const length = Math.max(1, Number(options.length || 5));
  const selected = selectRogueliteQuestions(questions, player, {
    modeId: mode.id,
    length,
  });
  const nodes = selected.map((question, index) => {
    const activeDemon = Boolean(player.mindDemons?.[question.id] || (player.wrongQuestionIds || []).includes(question.id));
    const nodeType = mode.id === "purify" && activeDemon ? "demon" : routePattern[index % routePattern.length];
    return {
      ...createNode(question, index, nodeType),
      encounterIndex: index + 1,
      encounterTotal: selected.length,
      runModeId: mode.id,
      runBuildId: build.id,
      objectiveHint: mode.primaryAction,
    };
  });
  const objective = createRogueliteObjective(mode.id, selected, player);

  return {
    ...createRun({
      mode: "roguelite",
      title: `${mode.name} · ${build.name}`,
      nodes,
    }),
    modeId: mode.id,
    modeName: mode.name,
    buildId: build.id,
    buildName: build.name,
    build,
    objective,
    brief: createRogueliteBrief(mode, build, objective),
    nextPrompt: objective.prompt,
  };
}

export function createRogueliteRunReport(run, player = initialPlayerState(), questions = []) {
  const base = createRunReport(run, player);
  const wrongEvents = (run.events || []).filter((event) => !event.isCorrect);
  const primaryWrong = wrongEvents[0] || null;
  const purifiedCount = run.purifiedDemonIds?.length || 0;
  const newDemonCount = wrongEvents.length;
  const targetCorrectCount = getRogueliteTargetCorrectCount(run);
  const nextActions = createRogueliteNextActions(run, player, questions, { wrongEvents, purifiedCount, targetCorrectCount });
  const resultLabel = run.failed
    ? "题阵中断"
    : run.completed || run.state === "report_ready"
      ? getRogueliteResultLabel(run, base.correctRate, purifiedCount)
      : "进行中";

  return {
    ...base,
    modeId: run.modeId || "explore",
    modeName: run.modeName || getRogueliteMode(run.modeId).name,
    buildId: run.buildId || "steady",
    buildName: run.buildName || getRogueliteBuild(run.buildId).name,
    resultLabel,
    objective: run.objective || createRogueliteObjective(run.modeId || "explore", [], player),
    newDemonCount,
    purifiedDemonCount: purifiedCount,
    primaryMistake: primaryWrong
      ? `${primaryWrong.topic || "本局"} · ${primaryWrong.demonType || primaryWrong.errorPattern || "错因待复盘"}`
      : "本局没有新增明显错因",
    nextActions,
    journalSummary: createJournalSummary({ base, run, primaryWrong, wrongEvents, purifiedCount, nextActions, title: resultLabel, targetCorrectCount }),
  };
}

function getRogueliteResultLabel(run, correctRate, purifiedCount) {
  if ((run.modeId || "") === "purify" && Number(purifiedCount || 0) === 0) {
    return "今日手账页待整理";
  }
  return correctRate >= 60 ? "今日手账页完成" : "今日手账页待复盘";
}

function createJournalSummary({ base, run, primaryWrong, wrongEvents, purifiedCount, nextActions, title, targetCorrectCount }) {
  const bookmarkEarned = hasEarnedRogueliteRunBookmark(run, { targetCorrectCount });
  return {
    title,
    litKeyPoints: Number(base.correctCount || 0),
    totalKeyPoints: Math.max(1, Number(run.nodes?.length || base.answeredCount || 5)),
    organizedDemons: Number(purifiedCount || 0),
    pendingDemons: wrongEvents.length,
    bookmark: bookmarkEarned ? run.buildName || getRogueliteBuild(run.buildId).name : getUnearnedJournalBookmarkLabel(run),
    bookmarkEarned,
    nextSuggestion: createJournalNextSuggestion(primaryWrong, nextActions),
  };
}

function getRogueliteTargetCorrectCount(run = {}) {
  const objectiveTarget = Number(run.objective?.targetCorrectCount || 0);
  if (objectiveTarget > 0) return objectiveTarget;
  const total = Math.max(1, Number(run.nodes?.length || run.answeredCount || 5));
  return Math.max(1, Math.ceil(total * 0.6));
}

function hasEarnedRogueliteRunBookmark(run = {}, options = {}) {
  const targetCorrectCount = Number(options.targetCorrectCount || getRogueliteTargetCorrectCount(run));
  return Number(run.correctCount || 0) >= targetCorrectCount;
}

function getUnearnedJournalBookmarkLabel(run = {}) {
  const observedCount = (run.events || []).filter((event) => event.isCorrect && !event.countsAsLit).length;
  if (observedCount > 0 && Number(run.correctCount || 0) === 0) return "观照记录";
  return "未获得";
}

function createJournalNextSuggestion(primaryWrong, nextActions = []) {
  if (primaryWrong) {
    const target = primaryWrong.demonType || primaryWrong.errorPattern || primaryWrong.topic || "概念混淆";
    return `继续整理「${target}」`;
  }
  const next = nextActions[0];
  if (next) return `${next.label}：${next.reason}`;
  return "继续开一页题眼手账";
}

function getRogueliteMode(modeId = "explore") {
  return rogueliteRunModes.find((mode) => mode.id === modeId) || rogueliteRunModes[0];
}

function getRogueliteBuild(buildId = "steady") {
  return rogueliteBuildDefinitions.find((build) => build.id === buildId) || rogueliteBuildDefinitions[0];
}

function selectRogueliteQuestions(questions = [], player = initialPlayerState(), options = {}) {
  const modeId = String(options.modeId || "explore");
  const length = Math.max(1, Number(options.length || 5));
  if (modeId === "purify") {
    const prepared = prepareQuestions(questions).filter((question) => isQuestionAllowedForMode(question, "practice"));
    const wrongIds = new Set(player.wrongQuestionIds || []);
    Object.values(player.mindDemons || {}).forEach((demon) => {
      if (demon.questionId || demon.id) wrongIds.add(demon.questionId || demon.id);
    });
    const demonQuestions = prepared
      .filter((question) => wrongIds.has(question.id))
      .sort((a, b) => getDemonPressure(player, b.id) - getDemonPressure(player, a.id));
    const fallback = selectRouteQuestions(prepared, player, { length, mode: "practice" })
      .filter((question) => !wrongIds.has(question.id));
    return uniqueQuestions([...demonQuestions, ...fallback]).slice(0, length);
  }

  if (modeId === "sprint") {
    const selected = selectMixedSimulationQuestions(questions, player, { length });
    if (new Set(selected.map((question) => question.topic)).size > 1 || selected.length >= length) {
      return selected;
    }
    const prepared = prepareQuestions(questions).filter((question) =>
      isQuestionAllowedForMode(question, "simulation") || isQuestionAllowedForMode(question, "mainline"),
    );
    return mixQuestionsByTopic(prepared, length);
  }

  return selectRouteQuestions(questions, player, { length, mode: "mainline" });
}

function createRogueliteObjective(modeId, questions = [], player = initialPlayerState()) {
  const activeDemonCount = Object.keys(player.mindDemons || {}).length;
  if (modeId === "purify") {
    return {
      type: "purify",
      label: "净化心魔",
      targetDemonCount: Math.max(1, Math.min(2, activeDemonCount || questions.length || 1)),
      targetCorrectCount: Math.max(1, Math.min(3, questions.length || 1)),
      prompt: "优先处理错题心魔，答对可降低压力。",
    };
  }

  if (modeId === "sprint") {
    return {
      type: "sprint",
      label: "综合冲刺",
      targetCorrectCount: Math.max(1, Math.min(4, questions.length || 5)),
      targetTopicCount: Math.max(1, new Set(questions.map((question) => question.topic)).size),
      prompt: "跨域混合检验，目标是在切换知识域时保持稳定。",
    };
  }

  return {
    type: "explore",
    label: "点亮题眼",
    targetQuestionCount: questions.length || 5,
    targetCorrectCount: Math.max(1, Math.min(3, questions.length || 1)),
    prompt: "完成一页 5 题手账，再根据错因决定下一页。",
  };
}

function createRogueliteBrief(mode, build, objective) {
  if (mode.id === "purify") {
    return `复盘手账已打开：${objective.prompt}推荐使用${build.name}，把错题心魔整理成复盘贴纸。`;
  }
  if (mode.id === "sprint") {
    return `跨域手账已打开：混合题阵会跨域切换，${build.name}会影响本页书签收益。`;
  }
  return `题眼手账已打开：完成 5 题，${build.name}会帮助你稳定点亮本页题眼。`;
}

function createRogueliteNextActions(run, player, questions, context = {}) {
  const wrongEvents = context.wrongEvents || [];
  const targetCorrectCount = Number(context.targetCorrectCount || getRogueliteTargetCorrectCount(run));
  const correctCount = Number(run.correctCount || 0);
  const totalKeyPoints = Math.max(1, Number((run.nodes || []).length || run.answeredCount || targetCorrectCount || 5));
  const missingBookmarkCount = Math.max(0, targetCorrectCount - correctCount);
  const reportReady = run.completed || run.state === "report_ready";
  const actions = [];
  if (reportReady && correctCount < targetCorrectCount) {
    actions.push({
      label: "回看短课",
      scene: "training",
      modeId: run.modeId || "explore",
      buildId: run.buildId || "steady",
      reason: `本页已点亮 ${correctCount}/${totalKeyPoints}，书签目标 ${correctCount}/${targetCorrectCount}，距离书签目标还差 ${missingBookmarkCount} 个。先回看题眼短课，再重新正式点亮。`,
    });
    actions.push({
      label: "重新点亮",
      modeId: run.modeId || "explore",
      buildId: run.buildId || "steady",
      reason: "本页还没达到书签目标，先不用开新页。",
    });
  }
  const activeDemonCount = Object.keys(player.mindDemons || {}).length;
  if (wrongEvents.length || activeDemonCount) {
    actions.push({
      label: "继续净化",
      modeId: "purify",
      buildId: "review",
      reason: wrongEvents.length
        ? "本局出现错因，下一局优先处理心魔。"
        : "仍有历史心魔待整理，下一局优先回到心魔回廊。",
    });
  }
  if (reportReady && correctCount < targetCorrectCount) return actions.slice(0, 3);
  actions.push({
    label: "探索新题",
    modeId: "explore",
    buildId: "steady",
    reason: "用稳定流派继续点亮新概念。",
  });
  actions.push({
    label: "综合冲刺",
    modeId: "sprint",
    buildId: "steady",
    reason: "用混合题阵检查跨知识域迁移。",
  });
  return actions.slice(0, 3);
}

function getDemonPressure(player, questionId) {
  const demon = player.mindDemons?.[questionId];
  return Number(demon?.pressure || 0);
}

function uniqueQuestions(questions = []) {
  const seen = new Set();
  return questions.filter((question) => {
    if (!question || seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

function mixQuestionsByTopic(questions = [], length = 5) {
  const byTopic = new Map();
  uniqueQuestions(questions).forEach((question) => {
    if (!byTopic.has(question.topic)) byTopic.set(question.topic, []);
    byTopic.get(question.topic).push(question);
  });
  const selected = [];
  while (selected.length < length) {
    const before = selected.length;
    for (const bucket of byTopic.values()) {
      if (selected.length >= length) break;
      const next = bucket.shift();
      if (next) selected.push(next);
    }
    if (selected.length === before) break;
  }
  return selected;
}

export function studyNode(player, run, nodeId, options = {}) {
  const node = getRunNode(run, nodeId);
  const wasStudied = (player.studiedLessonIds || []).includes(node.lessonId);
  const studiedQuestion = getQuestionForNode(node, options.bankQuestions || []);
  const rewards = calculateStudyRewards(wasStudied, {
    question: studiedQuestion,
    style: getLearningStyleForRun(player, run),
    run,
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
    dailyQuestProgress: addDailyQuestProgress(player, {
      now: options.now,
      studiedLessonId: node.lessonId,
    }),
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
  const fatigue = getFatigueState(player, { now: action.now });
  const fatigueMultiplier = Number(fatigue.rewardMultiplier || 1);
  const normalizedSelected = normalizeAnswer(action.selectedAnswer, question.options);
  const isCorrect = normalizedSelected === question.answer;
  const countsAsLit = isCorrect && stance.id !== "observe";
  const hadActiveDemon = Boolean(player.mindDemons?.[question.id]);
  const errorDiagnosis = isCorrect ? null : buildErrorDiagnosis(question, normalizedSelected);
  const style = getLearningStyleForRun(player, run);
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
  const heartDelta = countsAsLit
    ? baseHeartDelta
    : isCorrect ? 0 : Math.min(0, baseHeartDelta + styleEffect.heartGuard - styleEffect.heartPenalty);
  const spiritPagesGain = applyRewardMultiplier(
    Math.max(0, Math.round(calculateSpiritPages({ question, stance, nodeConfig, isCorrect, studiedBeforeBattle }) * styleEffect.rewardMultiplier)),
    fatigueMultiplier,
  );
  const materialsGain = scaleMaterials(calculateMaterialsGain({ question, nodeConfig, isCorrect: countsAsLit, studiedBeforeBattle }), fatigueMultiplier);
  const masteryGain = calculateMasteryGain({ question, isCorrect: countsAsLit, studiedBeforeBattle });
  const stanceMasteryGain = calculateStanceMasteryGain({ question, nodeConfig, isCorrect: countsAsLit, studiedBeforeBattle });
  const demonResult = updateMindDemon(player, question, {
    isCorrect,
    countsAsLit,
    normalizedSelected,
    stance,
    nodeConfig,
  });
  const nextHeartPower = clamp((player.heartPower ?? 6) + heartDelta, 0, player.maxHeartPower || 6);
  const nextMastery = {
    ...(player.mastery || {}),
    [question.topic]: clamp((player.mastery?.[question.topic] || 0) + masteryGain, 0, 100),
  };
  const resonanceTopicId = countsAsLit && Number(nextMastery[question.topic] || 0) >= 50 ? question.topic : "";
  const nextStanceStats = {
    steady: player.stanceStats?.steady || 0,
    assault: player.stanceStats?.assault || 0,
    observe: player.stanceStats?.observe || 0,
    [stance.id]: (player.stanceStats?.[stance.id] || 0) + 1,
  };
  const nextStyleStats = updateLearningStyleStats(player.styleStats, style.id, countsAsLit);
  const nextErrorStats = updateErrorStats(player.errorStats, errorDiagnosis?.primary?.errorPattern);
  const nextRetestStats = updateRetestStats(player.retestStats, hadActiveDemon, countsAsLit);
  const nextWrongIds = isCorrect
    ? demonResult.purifiedDemonId
      ? (player.wrongQuestionIds || []).filter((id) => id !== question.id)
      : [...(player.wrongQuestionIds || [])]
    : unique([...(player.wrongQuestionIds || []), question.id]);
  const nextPurifiedIds = demonResult.purifiedDemonId
    ? unique([...(player.purifiedDemonIds || []), demonResult.purifiedDemonId])
    : [...(player.purifiedDemonIds || [])];
  const nextDailyQuestProgress = addDailyQuestProgress(player, {
    now: action.now,
    correctQuestionId: countsAsLit ? question.id : "",
    resonanceTopicId,
    demonPurifications: demonResult.purifiedDemonId ? 1 : 0,
  });
  const nextWeeklyQuestProgress = addWeeklyQuestProgress(player, {
    now: action.now,
    correctQuestionId: countsAsLit ? question.id : "",
    purifiedDemonId: demonResult.purifiedDemonId || "",
    topic: countsAsLit ? question.topic : "",
  });
  const starGlimmerGain = 0;
  const growthXpGain = applyRewardMultiplier(
    Math.max(0, Math.round(calculateBattleGrowthXp({ question, isCorrect: countsAsLit, studiedBeforeBattle }) * styleEffect.rewardMultiplier)),
    fatigueMultiplier,
  );
  const bondGains = calculateBattleBondGains({
    isCorrect: countsAsLit,
    purifiedDemonId: demonResult.purifiedDemonId,
  });
  const nextGrowthXp = Number(player.growthXp || 0) + growthXpGain;
  const nextCorrectQuestionIds = countsAsLit
    ? unique([...(player.correctQuestionIds || []), question.id])
    : [...(player.correctQuestionIds || [])];
  const energyDelta = countsAsLit ? calculateEnergyDelta({ isCorrect, stance }) : isCorrect ? 0 : calculateEnergyDelta({ isCorrect, stance });
  const nextEnergy = clamp(
    Number(player.energy ?? player.maxEnergy ?? 12) + energyDelta,
    0,
    Number(player.maxEnergy || 12),
  );
  const nextAnswerTimeSamples = appendAnswerTimeSample(player.answerTimeSamples, action.elapsedSeconds);
  const nextJournalCollection = addJournalAnswerCollectible(player.journalCollection, {
    question,
    isCorrect: countsAsLit,
    now: action.now,
  });

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
    stanceMastery: applyStanceMastery(player.stanceMastery, stance.id, stanceMasteryGain),
    streak: countsAsLit ? (player.streak || 0) + 1 : 0,
    bonds: applyBondGains(player.bonds, bondGains),
    mastery: nextMastery,
    studiedLessonIds: [...(player.studiedLessonIds || [])],
    answeredQuestionIds: unique([...(player.answeredQuestionIds || []), question.id]),
    correctQuestionIds: nextCorrectQuestionIds,
    wrongQuestionIds: nextWrongIds,
    mindDemons: demonResult.mindDemons,
    purifiedDemonIds: nextPurifiedIds,
    dailyQuestProgress: nextDailyQuestProgress,
    weeklyQuestProgress: nextWeeklyQuestProgress,
    journalCollection: nextJournalCollection,
    stanceStats: nextStanceStats,
    styleStats: nextStyleStats,
    errorStats: nextErrorStats,
    retestStats: nextRetestStats,
    answerTimeSamples: nextAnswerTimeSamples,
  }, action.bankQuestions || [question], action.chapterOptions || {});

  const nextRun = updateRun(run, {
    node,
    question,
    stance,
    countsAsLit,
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
  const finalPlayer = nextRun.completed && !run.completed
    ? {
        ...nextPlayer,
        consecutiveRouteRuns: Number(fatigue.consecutiveRouteRuns || 0) + 1,
        lastRouteRunDay: localDateKey(normalizeDate(action.now)),
        journalCollection: hasEarnedRogueliteRunBookmark(nextRun)
          ? addJournalRunCollectibles(nextJournalCollection, {
              run: nextRun,
              now: action.now,
            })
          : nextJournalCollection,
      }
    : nextPlayer;

  return {
    isCorrect,
    countsAsLit,
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
    player: finalPlayer,
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

export function getHeartPowerUpgradeState(player = initialPlayerState()) {
  const currentMaxHeartPower = clamp(Number(player.maxHeartPower || 6), 1, heartPowerUpgradeLimit);
  const nextMaxHeartPower = Math.min(heartPowerUpgradeLimit, currentMaxHeartPower + 1);
  const cost = getHeartPowerUpgradeCost(currentMaxHeartPower);
  const materials = normalizeMaterials(player.materials);
  const maxed = currentMaxHeartPower >= heartPowerUpgradeLimit;

  return {
    currentMaxHeartPower,
    nextMaxHeartPower,
    cost,
    canUpgrade: !maxed && hasMaterials(materials, cost),
    maxed,
  };
}

export function upgradeHeartPower(player = initialPlayerState()) {
  const state = getHeartPowerUpgradeState(player);
  if (state.maxed) {
    throw new Error("心力上限已满");
  }
  if (!state.canUpgrade) {
    throw new Error("书页还不够升级心力");
  }

  const currentHeartPower = clamp(Number(player.heartPower || 0), 0, state.currentMaxHeartPower);
  const nextPlayer = {
    ...player,
    heartPower: Math.min(state.nextMaxHeartPower, currentHeartPower + 1),
    maxHeartPower: state.nextMaxHeartPower,
    materials: subtractMaterials(player.materials, state.cost),
  };

  return {
    player: nextPlayer,
    cost: state.cost,
    upgraded: true,
    nextMaxHeartPower: state.nextMaxHeartPower,
  };
}

export function createDailyChallenges(questions = [], player = initialPlayerState(), options = {}) {
  const prepared = prepareQuestions(questions);
  const claims = player.dailyQuestClaims || {};
  const cycle = createQuestCycle(options);
  const progress = getDailyQuestProgressForCycle(player, cycle);
  const studiedLessonIds = new Set(progress.studiedLessonIds);
  const correctQuestionIds = new Set(progress.correctQuestionIds);
  const resonanceTopicIds = new Set(progress.resonanceTopicIds);
  const topicCount = new Set(prepared.map((question) => question.topic)).size || 1;
  const studiedCount = prepared.filter((question) => studiedLessonIds.has(question.lesson.id)).length;
  const correctCount = prepared.filter((question) => correctQuestionIds.has(question.id)).length;
  const demonCount = Object.keys(player.mindDemons || {}).length;
  const demonPurifications = Math.min(1, Number(progress.demonPurifications || 0));
  const resonanceCount = [...new Set(prepared.map((question) => question.topic))]
    .filter((topic) => resonanceTopicIds.has(topic)).length;

  return [
    dailyChallenge("daily-study", "晨间贴纸", "完成题眼短课，把讲解转成题眼记忆。", studiedCount, Math.min(3, prepared.length || 3), {
      shuye: 3,
    }, isQuestClaimed(claims, "daily-study", cycle)),
    dailyChallenge("daily-battle", "题眼贴纸页", "在任意题阵中答对题目，把今日手账页点亮。", correctCount, Math.min(5, prepared.length || 5), {
      shuye: 4,
    }, isQuestClaimed(claims, "daily-battle", cycle)),
    dailyChallenge("daily-demon", "心魔整理贴", demonCount
      ? "整理一个错题心魔，把它收进复盘手账。"
      : "题阵中出现错题心魔后，再回来补一张整理贴。", demonPurifications, 1, {
      moyu: 2,
    }, isQuestClaimed(claims, "daily-demon", cycle)),
    dailyChallenge("daily-resonance", "主题徽章", "把至少一个主题整理到半熟以上，点亮主题徽章。", resonanceCount, Math.min(2, topicCount), {
      shuye: 2,
    }, isQuestClaimed(claims, "daily-resonance", cycle)),
  ];
}

export function createDailyQuestState(questions = [], player = initialPlayerState(), options = {}) {
  const prepared = prepareQuestions(questions);
  const claims = player.dailyQuestClaims || {};
  const cycle = createQuestCycle(options);
  const weeklyProgress = getWeeklyQuestProgressForCycle(player, cycle);
  const weeklyCorrectQuestionIds = new Set(weeklyProgress.correctQuestionIds);
  const weeklyPurifiedDemonIds = new Set(weeklyProgress.purifiedDemonIds);
  const correctCount = prepared.filter((question) => weeklyCorrectQuestionIds.has(question.id)).length;
  const purifiedCount = prepared.filter((question) => weeklyPurifiedDemonIds.has(question.id)).length;
  const topicCorrectCounts = { ...(weeklyProgress.topicCorrectCounts || {}) };
  const bestTopicCorrect = Math.max(0, ...Object.values(topicCorrectCounts));

  return {
    daily: createDailyChallenges(prepared, player, options),
    weekly: [
      weeklyQuest("weekly-graph", "收藏册进度", "本周点亮10个题眼，把收藏册推进一格。", correctCount, 10, {
        title: "收藏册新页",
      }, isQuestClaimed(claims, "weekly-graph", cycle)),
      weeklyQuest("weekly-demon-sweep", "心魔整理页", "本周整理5个心魔，补齐一页复盘手账。", purifiedCount, 5, {
        title: "复盘书签",
      }, isQuestClaimed(claims, "weekly-demon-sweep", cycle)),
      weeklyQuest("weekly-topic", "主题徽章册", "任一主题点亮20题，收下一枚主题徽章。", bestTopicCorrect, 20, {
        title: "主题徽章贴",
      }, isQuestClaimed(claims, "weekly-topic", cycle)),
    ],
    fatigue: getFatigueState(player, options),
  };
}

export function claimDailyQuestReward(questions = [], player = initialPlayerState(), questId = "", options = {}) {
  const questState = createDailyQuestState(questions, player, options);
  const quest = [...questState.daily, ...questState.weekly].find((item) => item.id === questId);
  if (!quest) {
    throw new Error("找不到这项日课。");
  }
  if (!quest.completed) {
    throw new Error("这项日课还没有完成。");
  }
  if (quest.claimed) {
    throw new Error("这项奖励已经领取。");
  }

  const reward = normalizeQuestReward(quest.rewards);
  const titles = reward.title
    ? unique([...(player.earnedTitles || []), reward.title])
    : [...(player.earnedTitles || [])];
  const nextPlayer = {
    ...player,
    materials: addMaterials(player.materials, reward.materials),
    earnedTitles: titles,
    dailyQuestClaims: {
      ...(player.dailyQuestClaims || {}),
      [questClaimKey(quest.id, createQuestCycle(options))]: true,
    },
  };

  return {
    player: nextPlayer,
    quest,
    reward,
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
      title: chapter.topic,
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
      name: errorPatternDefinitions[errorPattern]?.name || "待诊断",
      demonType: errorPatternDefinitions[errorPattern]?.demonType || "心魔",
      count,
    }))
    .sort((a, b) => b.count - a.count || a.errorPattern.localeCompare(b.errorPattern));
  const reviewItems = activeDemons
    .map((demon) => {
      const question = questionById.get(demon.questionId || demon.id);
      return {
        questionId: demon.questionId || demon.id || "",
        topic: demon.topic || question?.topic || "待定主题",
        pressure: Number(demon.pressure || 0),
        errorPattern: demon.errorPattern || "memory-gap",
        demonType: demon.demonType || errorPatternDefinitions["memory-gap"].demonType,
        concept: demon.concept || question?.concept || `${question?.topic || "待定主题"} · 基础概念`,
        text: `${demon.topic || question?.topic || "待定主题"} · ${demon.demonType || "心魔"} · ${question?.lesson?.keyPoint || "复看题眼"}`,
      };
    })
    .sort((a, b) => b.pressure - a.pressure || a.topic.localeCompare(b.topic));
  const weakestTopic = topicStats
    .filter((item) => item.total > 0)
    .sort((a, b) => b.demonCount - a.demonCount || a.mastery - b.mastery || a.correctCount - b.correctCount)[0] || null;
  const touchedTopicCount = topicStats.filter((item) => item.studiedCount > 0 || item.correctCount > 0).length;
  const buildWinRates = rogueliteBuildDefinitions.map((build) => {
    const styleId = getLearningStyleIdForBuild(build.id);
    const stats = player.styleStats?.[styleId] || {};
    const attempts = Number(stats.attempts || 0);
    const correct = Number(stats.correct || 0);
    return {
      id: build.id,
      name: build.name,
      styleId,
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
    topicTouchStats: {
      totalCount: topicStats.length,
      touchedCount: touchedTopicCount,
      percent: percent(touchedTopicCount, topicStats.length),
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
    buildWinRates,
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

export function buildObservationHint(question = {}) {
  const prepared = question.lesson ? question : prepareQuestions([question])[0];
  const options = normalizeOptions(prepared.options);
  const normalizedAnswer = normalizeAnswer(prepared.answer, options);
  const answerOptions = options.filter((option) => normalizedAnswer.includes(option.key));
  const answerLine = answerOptions.length
    ? answerOptions.map((option) => `${option.key}. ${option.text || option.key}`).join("；")
    : String(prepared.answer || "答案待整理");
  const explanation = compactText(prepared.lesson?.explanation || prepared.explanation || prepared.analysis || "讲解还在整理中。");
  const keyPoint = compactText(prepared.lesson?.keyPoint || extractKeyPoint(explanation));

  return {
    stemCue: `题干线索：${compactStemCue(prepared.stem)}`,
    answerLine,
    explanation,
    keyPoint,
  };
}

function normalizeLesson(rawLesson, source) {
  const keyPoint = normalizeQuestionCopy(rawLesson?.keyPoint || extractKeyPoint(source.explanation));

  return {
    id: String(rawLesson?.id || `lesson-${source.id}`),
    title: normalizeLessonTitle(rawLesson?.title, source),
    sourceRef: String(rawLesson?.sourceRef || source.sourceRef || "书院讲解"),
    keyPoint,
    explanation: normalizeLessonExplanationCopy(rawLesson?.explanation || source.explanation),
    studyPrompt: normalizeStudyPromptCopy(rawLesson?.studyPrompt, keyPoint),
  };
}

function normalizeLessonExplanationCopy(value) {
  return normalizeQuestionCopy(value)
    .replace(/\r\n?/g, "\n")
    .replace(/专业入员/g, "专业人员")
    .replace(/学生[ \t\u00a0\n]+象(?=的特点)/g, "学生对象")
    .replace(/对环[ \t\u00a0\n]*的依赖/g, "对环境的依赖")
    .replace(/([\u3400-\u9fff\uf900-\ufaff])[\t \u00a0]*\n[\t \u00a0]*(?=[\u3400-\u9fff\uf900-\ufaff])/gu, "$1")
    .replace(/([\u3400-\u9fff\uf900-\ufaff])[\t \u00a0]+(?=[\u3400-\u9fff\uf900-\ufaff])/gu, "$1")
    .replace(/[ \t\u00a0]*\n[ \t\u00a0]*/g, " ")
    .replace(/[ \t\u00a0]+/g, " ")
    .trim();
}

function normalizeQuestionCopy(value) {
  return String(value || "")
    .replace(/米成年人/g, "未成年人")
    .replace(/职[ \t\u00a0\n]*贵/g, "职责")
    .replace(/抚养义务7/g, "抚养义务")
    .replace(/太双避冲突/g, "双避冲突")
    .replace(/对环[ \t\u00a0\n]*的依赖/g, "对环境的依赖")
    .trim();
}

function normalizeLessonTitle(rawTitle, source) {
  const fallbackTitle = `${source.topic} · ${source.year || "真题"}讲解`;
  const title = String(rawTitle || fallbackTitle).trim() || fallbackTitle;
  const legacyCatchAllTopic = "综合知识";
  if (!title.includes(legacyCatchAllTopic)) return title;

  const topic = String(source.topic || "").trim();
  const replacementTopic = topic && topic !== legacyCatchAllTopic ? topic : "题眼短课";
  return title.split(legacyCatchAllTopic).join(replacementTopic);
}

function normalizeStudyPromptCopy(rawPrompt, keyPoint) {
  const oldLessonGoal = String.fromCharCode(32451, 21151, 30446, 26631);
  const oldLesson = String.fromCharCode(32451, 21151);
  const oldBattle = String.fromCharCode(25112, 26007);
  return String(rawPrompt || `短课目标：先记住“${keyPoint}”，再用题阵检验。`)
    .split(oldLessonGoal).join("短课目标")
    .split(oldLesson).join("短课")
    .split(oldBattle).join("题阵");
}

function validateImportedQuestion(raw, index) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`第 ${index + 1} 题格式不对`);
  }

  const options = normalizeOptions(raw.options);
  const answer = String(raw.answer ?? "").trim().toUpperCase().replace(/\s+/g, "");

  if (!String(raw.stem ?? "").trim()) {
    throw new Error(`第 ${index + 1} 题还没有题干`);
  }
  if (!String(raw.topic ?? "").trim()) {
    throw new Error(`第 ${index + 1} 题还没有主题`);
  }
  if (!answer) {
    throw new Error(`第 ${index + 1} 题还没有正解`);
  }
  if (options.length < 2) {
    throw new Error(`第 ${index + 1} 题至少需要 2 个选项`);
  }

  const optionKeys = new Set(options.map((option) => option.key));
  const missingKeys = answer.split("").filter((key) => !optionKeys.has(key));
  if (missingKeys.length) {
    throw new Error(`第 ${index + 1} 题正解里有题面没有出现的选项 ${missingKeys.join("")}`);
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
    explanation: String(raw.explanation || raw.analysis || "讲解还在整理中。"),
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
    correctCount: run.correctCount + (event.countsAsLit ? 1 : 0),
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
        countsAsLit: Boolean(event.countsAsLit),
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
  } else if (!details.countsAsLit) {
    activeDemon = existing || null;
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
    shuye: base.shuye + studyBonus + resonanceBonus,
    moyu: base.moyu,
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
    run: context.run,
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

  const baseGrowthXpGain = wasStudied ? 3 : 8;
  const baseMaterialsGain = wasStudied ? { ...defaultMaterials } : { ...defaultMaterials, shuye: 1 };
  const baseBondGains = wasStudied
    ? { ...defaultBonds, xiaomo: 1 }
    : { ...defaultBonds, mingche: 1, azhi: 3 };

  return {
    starGlimmerGain: 0,
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
  const styleName = getVisibleLearningStyleName(style, context.run);

  if (style.id === "law") {
    const focused = topicMatchesFocus(topic, style.focusTopic);
    return {
      growthXpMultiplier: focused ? 1.5 : 0.7,
      starGlimmerBonus: focused ? 1 : 0,
      feedback: focused
        ? `${styleName}：教育法规题眼收益提高。`
        : `${styleName}：跨主题短课收益降低。`,
    };
  }

  if (style.id === "concept") {
    const focused = String(type).includes("多") || errorPatterns.includes(style.focusErrorPattern);
    return {
      growthXpMultiplier: focused ? 1.25 : 0.9,
      starGlimmerBonus: focused ? 1 : 0,
      feedback: focused
        ? `${styleName}：正在强化概念区分。`
        : `${styleName}：非概念混淆题收益略低。`,
    };
  }

  if (style.id === "review") {
    const focused = context.hasActiveDemon || context.wasStudied;
    return {
      growthXpMultiplier: focused ? 1.5 : 0.8,
      starGlimmerBonus: focused ? 2 : 0,
      feedback: focused
        ? `${styleName}：错题与复看短课收益提高。`
        : `${styleName}：新题短课收益降低。`,
    };
  }

  if (style.id === "assault-flow") {
    return {
      growthXpMultiplier: 1.15,
      starGlimmerBonus: 1,
      feedback: `${styleName}：本页按连破节奏推进。`,
    };
  }

  if (style.id === "speed") {
    return {
      growthXpMultiplier: 1.05,
      starGlimmerBonus: 1,
      feedback: `${styleName}：短课压缩为限时抓题眼。`,
    };
  }

  if (style.id === "deep-read") {
    return {
      growthXpMultiplier: 1.25,
      starGlimmerBonus: 0,
      feedback: `${styleName}：额外沉淀1张知识点卡片。`,
    };
  }

  if (style.id === "chaos") {
    const borrowed = pickChaosBorrowedStyle(question);
    return {
      ...getLearningStyleStudyEffect(borrowed, question, context),
      feedback: `${styleName}：本题借用${borrowed.name}短课效果。`,
    };
  }

  return {
    growthXpMultiplier: 1,
    starGlimmerBonus: 0,
    feedback: `${styleName}：稳定吸收题眼。`,
  };
}

function getLearningStyleBattleEffect(style, context = {}) {
  const question = context.question || {};
  const topic = question.topic || "";
  const type = question.type || "";
  const errorPatterns = Array.isArray(question.errorPatterns) ? question.errorPatterns : [];
  const styleName = getVisibleLearningStyleName(style, context.run);

  if (style.id === "law") {
    const focused = topicMatchesFocus(topic, style.focusTopic);
    return {
      damageMultiplier: focused ? 1.12 : 0.92,
      rewardMultiplier: focused ? 1.5 : 0.7,
      heartGuard: 0,
      heartPenalty: focused ? 0 : 1,
      feedback: focused ? `${styleName}：法规题阵收益+50%。` : `${styleName}：跨主题收益下降并增加风险。`,
    };
  }

  if (style.id === "concept") {
    const focused = String(type).includes("多") || errorPatterns.includes(style.focusErrorPattern);
    return {
      damageMultiplier: focused ? 1.08 : 1,
      rewardMultiplier: focused ? 1.08 : 0.9,
      heartGuard: focused ? 1 : 0,
      heartPenalty: 0,
      feedback: focused ? `${styleName}：概念区分获得额外容错。` : `${styleName}：本题不是概念主场。`,
    };
  }

  if (style.id === "assault-flow") {
    const chainActive = Number(context.player?.streak || 0) >= 1;
    return {
      damageMultiplier: chainActive ? 1.35 : 1.08,
      rewardMultiplier: chainActive ? 2 : 1.15,
      heartGuard: 0,
      heartPenalty: context.isCorrect ? 0 : 1,
      feedback: chainActive ? `${styleName}：连破倍率生效。` : `${styleName}：首题先建立连破。`,
    };
  }

  if (style.id === "review") {
    const focused = context.hasActiveDemon || context.run?.mode === "demon";
    return {
      damageMultiplier: focused ? 1.2 : 0.95,
      rewardMultiplier: focused ? 2 : 0.8,
      heartGuard: focused ? 1 : 0,
      heartPenalty: 0,
      feedback: focused ? `${styleName}：心魔净化收益翻倍。` : `${styleName}：新题收益降低。`,
    };
  }

  if (style.id === "speed") {
    return {
      damageMultiplier: 1.08,
      rewardMultiplier: 1.3,
      heartGuard: 0,
      heartPenalty: 0,
      feedback: `${styleName}：限时压力换取收益+30%。`,
    };
  }

  if (style.id === "deep-read") {
    return {
      damageMultiplier: 1.05,
      rewardMultiplier: 1.1,
      heartGuard: 1,
      heartPenalty: 0,
      feedback: `${styleName}：短课沉淀带来稳定容错。`,
    };
  }

  if (style.id === "chaos") {
    const borrowed = pickChaosBorrowedStyle(question);
    return {
      ...getLearningStyleBattleEffect(borrowed, context),
      feedback: `${styleName}：本题借用${borrowed.name}效果。`,
    };
  }

  return {
    damageMultiplier: 1,
    rewardMultiplier: 1,
    heartGuard: 1,
    heartPenalty: 0,
    feedback: `${styleName}：稳定容错+1。`,
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

function scaleMaterials(materials = {}, multiplier = 1) {
  const normalized = normalizeMaterials(materials);
  const factor = Number.isFinite(Number(multiplier)) ? Number(multiplier) : 1;
  if (factor === 1) return normalized;
  return Object.fromEntries(
    materialTypes.map((material) => [
      material.id,
      scaleMaterialValue(normalized[material.id], factor),
    ]),
  );
}

function scaleMaterialValue(value = 0, multiplier = 1) {
  const amount = Math.max(0, Number(value || 0));
  const factor = Number.isFinite(Number(multiplier)) ? Number(multiplier) : 1;
  if (!amount || factor <= 0) return 0;
  if (factor < 1) return Math.max(1, Math.floor(amount * factor));
  return Math.max(0, Math.round(amount * factor));
}

function applyRewardMultiplier(value = 0, multiplier = 1) {
  const factor = Number.isFinite(Number(multiplier)) ? Number(multiplier) : 1;
  return Math.max(0, Math.round(Number(value || 0) * factor));
}

function appendAnswerTimeSample(samples = [], elapsedSeconds) {
  const elapsed = Number(elapsedSeconds);
  if (!Number.isFinite(elapsed) || elapsed <= 0) {
    return Array.isArray(samples) ? [...samples] : [];
  }
  const normalized = Math.min(600, Math.round(elapsed * 10) / 10);
  return [...(Array.isArray(samples) ? samples : []), normalized].slice(-80);
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

function normalizeJournalCollection(collection = {}, options = {}) {
  const allowedQuestionIds = options.questionIds instanceof Set ? options.questionIds : null;
  const stickers = uniqueById(collection.stickers || [])
    .map((sticker) => ({
      id: String(sticker.id || sticker.questionId || ""),
      questionId: String(sticker.questionId || sticker.id || ""),
      title: String(sticker.title || "题眼贴纸"),
      topic: String(sticker.topic || ""),
      earnedAt: String(sticker.earnedAt || ""),
    }))
    .filter((sticker) => sticker.id && (!allowedQuestionIds || allowedQuestionIds.has(sticker.questionId)));
  const bookmarks = uniqueById(collection.bookmarks || [])
    .map((bookmark) => ({
      id: String(bookmark.id || bookmark.title || ""),
      title: String(bookmark.title || "手账书签"),
      modeName: String(bookmark.modeName || ""),
      earnedAt: String(bookmark.earnedAt || ""),
    }))
    .filter((bookmark) => bookmark.id);

  return {
    stickers,
    bookmarks,
    fragments: Math.max(0, Number(collection.fragments || 0)),
  };
}

function addJournalAnswerCollectible(collection = {}, options = {}) {
  const current = normalizeJournalCollection(collection);
  if (!options.isCorrect || !options.question?.id) return current;
  const question = options.question;
  const sticker = {
    id: String(question.id),
    questionId: String(question.id),
    title: `题眼贴纸：${question.lesson?.title || question.concept || question.topic || "当前题眼"}`,
    topic: question.topic || "",
    earnedAt: localDateKey(normalizeDate(options.now)),
  };

  return {
    ...current,
    stickers: uniqueById([...current.stickers, sticker]),
  };
}

function addJournalRunCollectibles(collection = {}, options = {}) {
  const current = normalizeJournalCollection(collection);
  const run = options.run || {};
  const build = getRogueliteBuild(run.buildId || "steady");
  const mode = getRogueliteMode(run.modeId || "explore");
  const bookmark = {
    id: `${mode.id}:${build.id}`,
    title: run.buildName || build.name,
    modeName: run.modeName || mode.name,
    earnedAt: localDateKey(normalizeDate(options.now)),
  };

  return {
    stickers: current.stickers,
    bookmarks: uniqueById([...current.bookmarks, bookmark]),
    fragments: current.fragments + 1,
  };
}

function uniqueById(items = []) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    const id = String(item?.id || item?.questionId || item?.title || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function getHeartPowerUpgradeCost(currentMaxHeartPower) {
  const upgradeIndex = Math.max(0, Number(currentMaxHeartPower || 6) - 6);
  return normalizeMaterials({
    shuye: 8 + upgradeIndex * 4,
  });
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

function formatNodeRewardPreview(nodeConfig) {
  const materials = normalizeMaterials(nodeConfig.materialRewards);
  const parts = [];
  Object.entries(materials).forEach(([id, value]) => {
    if (!value) return;
    const material = materialTypes.find((item) => item.id === id);
    parts.push(`${material?.name || id}+${value}`);
  });
  if (nodeConfig.heartRecovery) parts.push(`心力+${nodeConfig.heartRecovery}`);
  return parts.length ? parts.join(" · ") : "书页与心法";
}

function dailyChallenge(id, title, description, current, target, materials, claimed = false) {
  const safeTarget = Math.max(1, Number(target || 1));
  const safeCurrent = clamp(Number(current || 0), 0, safeTarget);
  return {
    id,
    title,
    description,
    progress: {
      current: safeCurrent,
      target: safeTarget,
    },
    rewards: {
      materials: normalizeMaterials(materials),
    },
    completed: safeCurrent >= safeTarget,
    claimed: Boolean(claimed),
  };
}

function weeklyQuest(id, title, description, current, target, rewards, claimed = false) {
  const safeTarget = Math.max(1, Number(target || 1));
  const safeCurrent = clamp(Number(current || 0), 0, safeTarget);
  return {
    id,
    title,
    description,
    progress: {
      current: safeCurrent,
      target: safeTarget,
    },
    rewards,
    completed: safeCurrent >= safeTarget,
    claimed: Boolean(claimed),
  };
}

function normalizeQuestReward(rewards = {}) {
  return {
    materials: normalizeMaterials(rewards.materials || rewards),
    title: rewards.title ? String(rewards.title) : "",
  };
}

function getDailyQuestProgressForCycle(player = initialPlayerState(), cycle = createQuestCycle()) {
  const progress = player.dailyQuestProgress || {};
  if (progress.day !== cycle.daily) {
    return {
      day: cycle.daily,
      studiedLessonIds: [],
      correctQuestionIds: [],
      resonanceTopicIds: [],
      demonPurifications: 0,
    };
  }

  return {
    day: cycle.daily,
    studiedLessonIds: unique(progress.studiedLessonIds || []),
    correctQuestionIds: unique(progress.correctQuestionIds || []),
    resonanceTopicIds: unique(progress.resonanceTopicIds || []),
    demonPurifications: Number(progress.demonPurifications || 0),
  };
}

function addDailyQuestProgress(player = initialPlayerState(), update = {}) {
  const cycle = createQuestCycle({ now: update.now });
  const progress = getDailyQuestProgressForCycle(player, cycle);
  return {
    day: cycle.daily,
    studiedLessonIds: update.studiedLessonId
      ? unique([...progress.studiedLessonIds, update.studiedLessonId])
      : progress.studiedLessonIds,
    correctQuestionIds: update.correctQuestionId
      ? unique([...progress.correctQuestionIds, update.correctQuestionId])
      : progress.correctQuestionIds,
    resonanceTopicIds: update.resonanceTopicId
      ? unique([...progress.resonanceTopicIds, update.resonanceTopicId])
      : progress.resonanceTopicIds,
    demonPurifications: Math.min(1, Number(progress.demonPurifications || 0) + Number(update.demonPurifications || 0)),
  };
}

function getWeeklyQuestProgressForCycle(player = initialPlayerState(), cycle = createQuestCycle()) {
  const progress = player.weeklyQuestProgress || {};
  if (progress.week !== cycle.weekly) {
    return {
      week: cycle.weekly,
      correctQuestionIds: [],
      purifiedDemonIds: [],
      topicCorrectCounts: {},
    };
  }

  return {
    week: cycle.weekly,
    correctQuestionIds: unique(progress.correctQuestionIds || []),
    purifiedDemonIds: unique(progress.purifiedDemonIds || []),
    topicCorrectCounts: normalizeTopicCorrectCounts(progress.topicCorrectCounts),
  };
}

function addWeeklyQuestProgress(player = initialPlayerState(), update = {}) {
  const cycle = createQuestCycle({ now: update.now });
  const progress = getWeeklyQuestProgressForCycle(player, cycle);
  const correctQuestionId = String(update.correctQuestionId || "");
  const purifiedDemonId = String(update.purifiedDemonId || "");
  const topic = String(update.topic || "");
  const correctAlreadyCounted = correctQuestionId ? progress.correctQuestionIds.includes(correctQuestionId) : true;
  const correctQuestionIds = correctQuestionId
    ? unique([...progress.correctQuestionIds, correctQuestionId])
    : progress.correctQuestionIds;
  const purifiedDemonIds = purifiedDemonId
    ? unique([...progress.purifiedDemonIds, purifiedDemonId])
    : progress.purifiedDemonIds;
  const topicCorrectCounts = normalizeTopicCorrectCounts(progress.topicCorrectCounts);

  if (correctQuestionId && topic && !correctAlreadyCounted) {
    topicCorrectCounts[topic] = Number(topicCorrectCounts[topic] || 0) + 1;
  }

  return {
    week: cycle.weekly,
    correctQuestionIds,
    purifiedDemonIds,
    topicCorrectCounts,
  };
}

function normalizeTopicCorrectCounts(counts = {}) {
  return Object.fromEntries(
    Object.entries(counts || {})
      .map(([topic, value]) => [String(topic), Math.max(0, Number(value || 0))])
      .filter(([topic, value]) => topic && value > 0),
  );
}

function createQuestCycle(options = {}) {
  const now = normalizeDate(options.now);
  return {
    daily: localDateKey(now),
    weekly: isoWeekKey(now),
  };
}

function normalizeDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoWeekKey(date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const weekYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
  return `${weekYear}-W${String(week).padStart(2, "0")}`;
}

function questClaimKey(questId, cycle) {
  const period = String(questId || "").startsWith("weekly-") ? cycle.weekly : cycle.daily;
  return `${period}:${questId}`;
}

function isQuestClaimed(claims = {}, questId = "", cycle = createQuestCycle()) {
  return Boolean(claims[questClaimKey(questId, cycle)]);
}

export function restFromFatigue(player = initialPlayerState(), options = {}) {
  return {
    ...player,
    consecutiveRouteRuns: 0,
    lastFatigueRestDay: localDateKey(normalizeDate(options.now)),
  };
}

function getFatigueState(player = initialPlayerState(), options = {}) {
  const today = localDateKey(normalizeDate(options.now));
  const routeRanToday = !player.lastRouteRunDay || player.lastRouteRunDay === today;
  const consecutiveRouteRuns = !routeRanToday
    ? 0
    : Number(player.consecutiveRouteRuns || 0);
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
    ["azhi", "我会把长解析拆成短课。你只要先记住关键句，后面的题阵就会轻很多。"],
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

function isQuestionAllowedForMode(question, mode = "mainline") {
  const status = String(question.gameplayStatus || deriveGameplayStatus(question.topic, question.qualityStatus));
  if (status === "manual_classification" || status === "content_review") return false;
  if (mode === "practice") return status === "mainline" || status === "practice_only";
  if (mode === "simulation") return status === "mainline" && question.qualityStatus === "clean";
  return status === "mainline";
}

function topicMatchesFocus(topic, focusTopic) {
  if (topic === focusTopic) return true;
  const topicDomain = learningDomainByName.get(topic) || legacyTopicToLearningDomain.get(topic);
  const focusDomain = learningDomainByName.get(focusTopic) || legacyTopicToLearningDomain.get(focusTopic);
  return Boolean(topicDomain && focusDomain && topicDomain.id === focusDomain.id);
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
  const mechanics = ["law-review", "concept-maze", "time-hourglass", "ethics-scale", "strategy-chain", "precision-memory"];
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
    ? `短课检验：已回看讲解，题眼“${question.lesson.keyPoint}”进入破阵结算。`
    : `题阵检验：未看短课直接出阵，结算后回看讲解“${question.lesson.keyPoint}”。`;
  return `${base}题阵机制：${mechanic.name}，${mechanic.prompt}`;
}

function getNextRecommendation(run, player) {
  const lastWrong = [...run.events].reverse().find((event) => !event.isCorrect);
  if (lastWrong) {
    return {
      topic: lastWrong.topic,
      method: getHeartMethod(lastWrong.topic, player.mastery?.[lastWrong.topic] || 0).name,
      reason: "错题心魔已生成，建议看题眼短课后进入净化局。",
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
  if (!node) throw new Error("这处题阵已经失效，请回开局台重进。");
  return node;
}

function getQuestionForNode(node, questions = []) {
  const raw = questions.find((question) => question.id === node.questionId);
  return raw ? prepareQuestions([raw])[0] : null;
}

function getStance(stanceId) {
  const stance = stances.find((item) => item.id === stanceId);
  if (!stance) throw new Error("这式破招暂时不可用。");
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

function normalizePrimaryDomain(primaryDomain, fallbackTopic = "") {
  const fallback = String(fallbackTopic || "").trim();
  const domainFromId = learningDomainById.get(String(primaryDomain?.id || ""));
  const domainFromName = learningDomainByName.get(String(primaryDomain?.name || ""));
  const domainFromFallback = learningDomainByName.get(fallback) || legacyTopicToLearningDomain.get(fallback);
  const domain = domainFromId || domainFromName || domainFromFallback;

  if (domain) {
    return {
      id: domain.id,
      name: domain.name,
    };
  }
  if (String(primaryDomain?.id || "") === manualClassificationDomain.id
    || String(primaryDomain?.name || fallback) === manualClassificationDomain.name) {
    return { ...manualClassificationDomain };
  }
  if (fallback && fallback !== "综合知识") {
    return {
      id: slugTopic(fallback),
      name: fallback,
    };
  }
  return { ...manualClassificationDomain };
}

function normalizeQualityStatus(status = "clean") {
  const normalized = String(status || "clean").trim();
  if (["clean", "usable_with_caution", "needs_review"].includes(normalized)) return normalized;
  return "clean";
}

function deriveGameplayStatus(topic, qualityStatus = "clean") {
  if (topic === manualClassificationDomain.name) return "manual_classification";
  if (topic === "综合知识") return "content_review";
  if (qualityStatus === "needs_review") return "content_review";
  if (qualityStatus === "usable_with_caution") return "practice_only";
  return "mainline";
}

function createStableQuestionId(sourceId, index = 0) {
  return `bank-${String(Number(index) + 1).padStart(4, "0")}-${sanitizeId(sourceId)}`;
}

function sanitizeId(value) {
  const safe = String(value || "question")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return safe || "question";
}

function extractKeyPoint(explanation) {
  const text = String(explanation || "").replace(/\s+/g, " ").trim();
  const match = text.match(/题眼[是：:]*([^。；;]+)/);
  if (match?.[1]) return match[1].trim();
  return text.split(/[。；;]/)[0]?.slice(0, 36) || "先看概念、条件和排除项";
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function compactStemCue(stem) {
  const text = compactText(stem).replace(/（\s*）|__+/g, "").trim();
  if (!text) return "先抓题干中的关键词、场景和限定词。";
  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
}

function inferDifficulty(question) {
  if (String(question.type || "").includes("多")) return 3;
  if (String(question.type || "").includes("判断")) return 1;
  return 2;
}

function getTopicProfile(topic) {
  const profiles = {
    "教育法律法规与政策制度": {
      method: "法规心法",
      enemy: "法规心魔",
      realm: "法规政策营",
    },
    "教育学原理、课程与教学": {
      method: "课程心法",
      enemy: "课程心魔",
      realm: "课程教学工坊",
    },
    "学习心理与认知机制": {
      method: "观心心法",
      enemy: "观心心魔",
      realm: "学习心理实验室",
    },
    "学生身心发展与个体差异": {
      method: "发展心法",
      enemy: "发展心魔",
      realm: "学生发展观察站",
    },
    "德育、班级管理与家校协同": {
      method: "现场心法",
      enemy: "现场心魔",
      realm: "德育班管现场",
    },
    "教师职业素养与专业规范": {
      method: "师范心法",
      enemy: "师范心魔",
      realm: "教师素养评议厅",
    },
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
  if (!topics.length) return "教育法律法规与政策制度";
  return topics.reduce((lowest, topic) => (mastery[topic] < mastery[lowest] ? topic : lowest), topics[0]);
}

function totalDemonPressure(mindDemons) {
  return Object.values(mindDemons || {}).reduce((total, demon) => total + (demon.pressure || 0), 0);
}

function getReportTitle(correctRate, failed) {
  if (failed) return "心力告急";
  if (correctRate === 100) return "破阵通明";
  if (correctRate >= 60) return "心法成形";
  return "回看短课";
}

function unique(items) {
  return [...new Set(items)];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
