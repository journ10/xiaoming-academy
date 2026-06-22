export const chapterMechanicsByTopic = {
  "教育法律法规与政策制度": "law-fog",
  "教育学原理、课程与教学": "time-hourglass",
  "学习心理与认知机制": "concept-maze",
  "学生身心发展与个体差异": "precision-memory",
  "德育、班级管理与家校协同": "strategy-chain",
  "教师职业素养与专业规范": "ethics-scale",
  "教育法规": "law-fog",
  "教育心理学": "concept-maze",
  "教学设计": "time-hourglass",
  "教师职业道德": "ethics-scale",
  "班级管理": "strategy-chain",
  "儿童发展": "precision-memory",
  "综合知识": "chaos-mix",
};

const conceptKeywordsByTopic = {
  "教育法律法规与政策制度": ["义务教育法", "教师法", "教育法", "未成年人保护", "免试入学", "就近入学", "政府保障"],
  "教育学原理、课程与教学": ["教育目的", "课程", "教学原则", "教学方法", "教学评价", "教案", "德育原则"],
  "学习心理与认知机制": ["学习动机", "学习迁移", "强化", "记忆", "注意", "认知", "皮亚杰", "维果斯基"],
  "学生身心发展与个体差异": ["小学生", "儿童", "年龄特征", "身心发展", "个体差异", "认知发展", "心理健康"],
  "德育、班级管理与家校协同": ["班主任", "班集体", "课堂纪律", "突发事件", "师生关系", "家校合作", "德育"],
  "教师职业素养与专业规范": ["爱岗敬业", "关爱学生", "教书育人", "为人师表", "终身学习", "师德", "教师观"],
  "教育法规": ["义务教育法", "教师法", "教育法", "未成年人保护", "免试入学", "就近入学", "政府保障"],
  "教育心理学": ["学习动机", "学习迁移", "强化", "记忆", "注意", "认知", "皮亚杰", "维果斯基"],
  "教学设计": ["教学目标", "教案", "课程", "教学评价", "导入", "教学方法", "学情"],
  "教师职业道德": ["爱岗敬业", "关爱学生", "教书育人", "为人师表", "终身学习", "师德"],
  "班级管理": ["班主任", "班集体", "课堂纪律", "突发事件", "师生关系", "班级管理"],
  "儿童发展": ["小学生", "儿童", "年龄特征", "身心发展", "低年级", "高年级"],
  "综合知识": ["综合", "跨主题", "教育知识"],
};

const validErrorPatterns = new Set([
  "concept-confusion",
  "reading-mistake",
  "memory-gap",
  "application-error",
]);

export function inferConcept(question) {
  const topic = String(question.topic || "综合知识");
  const text = compactText([question.stem, question.explanation, question.lesson?.keyPoint].join(" "));
  const keyword = (conceptKeywordsByTopic[topic] || conceptKeywordsByTopic["综合知识"])
    .find((item) => text.includes(item));
  return `${topic} · ${keyword || firstMeaningfulPhrase(text) || "基础概念"}`;
}

export function normalizeErrorPatterns(rawPatterns, question) {
  const explicit = Array.isArray(rawPatterns)
    ? rawPatterns.map((pattern) => typeof pattern === "string" ? pattern : pattern?.type).filter(Boolean)
    : [];
  const inferred = inferErrorPatterns(question);
  return unique([...explicit, ...inferred].filter((pattern) => validErrorPatterns.has(pattern)));
}

export function inferErrorPatterns(question) {
  const text = compactText([question.stem, question.explanation, question.lesson?.keyPoint].join(" "));
  const patterns = [];

  if (/不正确|不属于|错误的是|除外|不包括|没有|未/u.test(text)) {
    patterns.push("reading-mistake");
  }
  if (/相似|混淆|区别|辨析|对比|强化|迁移|泛化|分化/u.test(text)) {
    patterns.push("concept-confusion");
  }
  if (/案例|材料|情境|首先|处理|策略|怎么办/u.test(text)) {
    patterns.push("application-error");
  }
  if (!patterns.length || /记忆|年龄|阶段|法条|规定|第.{0,4}条/u.test(text)) {
    patterns.push("memory-gap");
  }

  return unique(patterns);
}

export function getChapterMechanic(topic) {
  return chapterMechanicsByTopic[String(topic || "")] || chapterMechanicsByTopic["综合知识"];
}

function compactText(text) {
  return String(text || "").replace(/\s+/g, "");
}

function firstMeaningfulPhrase(text) {
  return String(text || "")
    .split(/[。；;，,、：:（）()]/u)
    .find((part) => part.length >= 2 && part.length <= 16)
    ?.slice(0, 16);
}

function unique(items) {
  return [...new Set(items)];
}
