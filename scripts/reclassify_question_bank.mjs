import fs from "node:fs";

const DEFAULT_INPUT = "data/questions.from-pdf.json";
const DEFAULT_OUTPUT = "data/question-classification.audit.json";

const DOMAINS = [
  {
    id: "law_policy",
    name: "教育法律法规与政策制度",
    rules: [
      rule("stem", 8, /《[^》]*(教育法|义务教育法|教师法|未成年人保护法|预防未成年人犯罪法|教师资格条例|学生伤害事故处理办法)[^》]*》/u),
      rule("all", 6, /教育法|义务教育法|教师法|未成年人保护法|预防未成年人犯罪法|教师资格条例|法律|法规|条例|规章|办法/u),
      rule("all", 4, /法定|违法|行政处分|行政部门|申诉|撤销教师资格|丧失教师资格|剥夺政治权利|有期徒刑/u),
      rule("all", 3, /权利|义务|应当|不得|禁止|可以|免试|就近入学|平等接受义务教育|当地人民政府|教育行政/u),
      rule("all", 5, /保护未成年学生|学校保护|人格尊严|人格尊严权|合法权益/u),
      rule("all", 4, /国家教育考试|教师职务|教师职称|中职教育|教育公平|教育均衡|教育优先发展/u),
      rule("all", 3, /义务教育|普及性|强制性|免费性|受教育者|国家教育考试|合法权益|人格尊严权|学校保护/u),
      rule("all", 2, /教育经费|学校章程|依法治校|学业证书|学历证书|受教育权|教育规划|教育优先发展|中长期教育改革和发展规划纲要/u),
    ],
    subdomains: [
      sub("义务教育法与入学保障", /义务教育法|免试|就近入学|平等接受义务教育|适龄儿童/u),
      sub("教师法与教师资格", /教师法|教师资格|撤销教师资格|丧失教师资格|教师申诉|行政处分|解聘/u),
      sub("未成年人保护与预防犯罪", /未成年人保护法|预防未成年人犯罪|严重不良行为|未成年人/u),
      sub("教育法与学校制度", /教育法|学校章程|依法治校|学业证书|学历证书|教育经费/u),
      sub("教育政策与地方规划", /中长期教育改革和发展规划纲要|教育改革|发展规划|政策/u),
    ],
  },
  {
    id: "teacher_ethics_professionalism",
    name: "教师职业素养与专业规范",
    rules: [
      rule("stem", 8, /教师职业道德|职业道德规范|师德|为人师表|爱岗敬业|关爱学生|教书育人|终身学习|爱国守法/u),
      rule("stem", 6, /教师职业|教师角色|教师劳动|教师能力|教育教学能力|教师专业|专业素养|普通话水平/u),
      rule("stem", 6, /教师.*行为问题|教师知识素养|知识素养|教师考核|教师风度|教师行为|教师角色|教师心理问题|教师产生行为/u),
      rule("all", 6, /教师职业道德|职业道德规范|师德|为人师表|爱岗敬业|关爱学生|教书育人|终身学习|爱国守法/u),
      rule("all", 4, /体罚|侮辱学生|有偿补课|廉洁从教|以身作则|循循善诱|诲人不倦|因材施教/u),
      rule("all", 4, /教师职业|教师角色|教师劳动|教师能力|教育教学能力|教师专业|专业素养|普通话水平/u),
      rule("all", 5, /教师知识素养|知识素养|教师考核|教师风度|教师行为|教师角色|教师心理问题|教师产生行为/u),
      rule("all", 3, /教师观|学生观|教师专业发展|教师专业素养|教师威信|职业理想|教师心理素质|职业心理素质|教师考核|教师风度|教师行为|教师素质|创造才能/u),
    ],
    subdomains: [
      sub("教师职业道德规范", /教师职业道德|职业道德规范|师德/u),
      sub("关爱学生与教育边界", /关爱学生|体罚|侮辱学生|惩罚|安全/u),
      sub("为人师表与廉洁从教", /为人师表|廉洁|有偿补课|以身作则|衣着得体|语言规范/u),
      sub("教书育人与因材施教", /教书育人|循循善诱|诲人不倦|因材施教/u),
      sub("教师专业发展", /终身学习|教师专业|专业素养|专业发展|教师威信|教师能力|教师劳动|教师角色|普通话水平|教师考核|教师风度|教师行为|教师素质|创造才能/u),
    ],
  },
  {
    id: "pedagogy_curriculum_instruction",
    name: "教育学原理、课程与教学",
    rules: [
      rule("stem", 7, /教育目的|教育方针|教育制度|教育功能|教育起源|教育学|素质教育|新课改|课程|教学目标|教学方法|教学原则|教学评价|教案/u),
      rule("stem", 6, /教育与生产劳动|命题原则|试题|测验|考试|评分|分数报告|作业|教师反思|教学反思|探究实验|教师.*主体|学生.*主体/u),
      rule("all", 5, /教育目的|教育方针|教育制度|教育功能|教育起源|教育学|教育思想|素质教育|新课改|课程标准|课程资源|课程目标/u),
      rule("all", 5, /教学目标|教学设计|教案|备课|说课|导入|结课|小结|讲授法|谈话法|讨论法|演示法|练习法|实验法|教学方法/u),
      rule("all", 4, /教学原则|教学过程|教学组织形式|班级授课制|教学评价|课堂评价|教学反思|学业成就评价|总结性评价|形成性评价|诊断性评价/u),
      rule("all", 6, /教育与生产劳动|命题原则|试题|测验|考试|评分|分数报告|教师反思|教学反思|探究实验/u),
      rule("all", 4, /提问|课堂提问|教学对话|量表评价|测验法|板书|讲解|讲读|结课方法|课外活动|校外活动|课外校外活动|活动课程/u),
      rule("all", 3, /赫尔巴特|杜威|夸美纽斯|孔子|陶行知|布鲁姆|赞科夫|苏霍姆林斯基/u),
      rule("all", 2, /教材|学情|板书|作业|作业布置|课堂教学|直观教学|启发式|参与式|探究式|教育质量|质量观|培养劳动者|小学基础|基础阶段|学习生涯/u),
    ],
    subdomains: [
      sub("教育目的、制度与教育思想", /教育目的|教育方针|教育制度|教育功能|教育起源|教育学|赫尔巴特|杜威|夸美纽斯|孔子|陶行知/u),
      sub("课程与课程资源", /课程|课程标准|课程资源|校本课程|综合实践活动/u),
      sub("教学目标与教学设计", /教学目标|教学设计|教案|备课|说课|学情/u),
      sub("教学原则与教学方法", /教学原则|教学方法|讲授法|谈话法|讨论法|演示法|练习法|实验法|启发式/u),
      sub("教学评价与反思", /教学评价|课堂评价|学业成就评价|教学反思|评价方式|量表评价|总结性评价|形成性评价|诊断性评价|测验法/u),
      sub("课堂教学组织", /课堂教学|教学组织形式|班级授课制|作业|作业布置|板书|提问|结课|讲解|讲读|教学对话|课外活动|校外活动/u),
    ],
  },
  {
    id: "learning_psychology",
    name: "学习心理与认知机制",
    rules: [
      rule("stem", 7, /学习动机|学习迁移|迁移|强化|正强化|负强化|认知|元认知|记忆|遗忘|注意|思维|想象|情绪|情感|智力|创造性|心理健康/u),
      rule("all", 6, /学习动机|学习迁移|顺向迁移|逆向迁移|正迁移|负迁移|学习策略|学习理论|联结说|练习律|效果律|准备律|强化|正强化|负强化|惩罚|消退|泛化|分化/u),
      rule("all", 5, /认知|元认知|同化|顺应|记忆|遗忘|注意|无意注意|有意注意|知觉|思维|想象|表象|概念|问题解决|创造性|对话言语/u),
      rule("all", 4, /情绪|情感|意志|气质|性格|智力|能力|自我效能感|归因|心理健康|焦虑|自卑|自我认识|动机|成就动机|行为转变|感觉适应/u),
      rule("all", 5, /心理学|冯特|激情|学习效率|倒U型|倒“U”型|学习.*动力|行为转变法/u),
      rule("all", 4, /皮亚杰|维果斯基|维果茨基|埃里克森|桑代克|斯金纳|奥苏贝尔|布鲁纳|班杜拉|艾宾浩斯|马斯洛|弗洛伊德/u),
      rule("all", 2, /心理辅导|行为调适|理性情绪|投射效应|最近发展区|需要层次|本我|自我|超我/u),
    ],
    subdomains: [
      sub("学习动机与学习策略", /学习动机|学习策略|内部动机|外部动机|成就动机|动机|自我效能/u),
      sub("学习理论与行为主义", /联结说|练习律|效果律|准备律|强化|正强化|负强化|惩罚|消退|桑代克|斯金纳|班杜拉|学习理论/u),
      sub("迁移、记忆与注意", /学习迁移|迁移|记忆|遗忘|艾宾浩斯|注意|无意注意|有意注意/u),
      sub("思维、想象与问题解决", /思维|想象|知觉|感觉适应|问题解决|创造性|概念/u),
      sub("情绪、人格与心理健康", /情绪|情感|意志|气质|性格|心理健康|焦虑|自卑|辅导/u),
      sub("认知发展理论", /皮亚杰|维果斯基|维果茨基|埃里克森|最近发展区/u),
    ],
  },
  {
    id: "student_development",
    name: "学生身心发展与个体差异",
    rules: [
      rule("stem", 7, /小学生|小学儿童|儿童|少年|初中生|高中生|身心发展|心理发展|年龄特征|发展规律|低年级|中年级|高年级/u),
      rule("all", 6, /小学生|小学儿童|儿童|少年|初中生|高中生|身心发展|心理发展|年龄特征|发展规律|发展阶段|关键期|成熟/u),
      rule("all", 5, /外烁论|内发论|人的全面发展|个性发展|全面发展/u),
      rule("all", 4, /个体差异|遗传|环境|主观能动性|顺序性|阶段性|不平衡性|互补性|差异性/u),
      rule("all", 4, /情感发展|意志力|自制力|自我评价|自我意识|生理自我|社会自我|心理自我|品德发展|道德发展|言语表达|概括水平/u),
      rule("all", 3, /低年级|中年级|高年级|青春期|童年期|小学阶段/u),
    ],
    subdomains: [
      sub("身心发展规律与影响因素", /身心发展|发展规律|遗传|环境|主观能动性|顺序性|阶段性|不平衡性|互补性|差异性/u),
      sub("小学生认知发展", /小学生|小学儿童|思维发展|具体形象思维|抽象思维|言语表达/u),
      sub("情感、意志与自我发展", /情感发展|意志|自制力|自我评价|自我意识|生理自我|社会自我|心理自我|情绪/u),
      sub("品德与道德发展", /品德发展|道德发展|皮亚杰.*品德|科尔伯格/u),
      sub("年龄阶段特征", /低年级|中年级|高年级|小学阶段|年龄特征|青春期/u),
    ],
  },
  {
    id: "moral_classroom_management",
    name: "德育、班级管理与家校协同",
    rules: [
      rule("stem", 7, /德育|道德教育|道德评价|班主任|班级|班集体|课堂纪律|师生关系|家校|家长|突发事件|问题行为/u),
      rule("stem", 6, /群体|联合群体|松散群体|非正式群体|集体|班队活动|品德|品行|宽容/u),
      rule("all", 6, /德育|班主任|班级管理|班集体|班干部|班会|班级文化|少先队/u),
      rule("all", 5, /德育原则|德育方法|道德教育|道德评价|道德修养|品德|品行|说服教育|榜样示范|情感陶冶|陶冶教育|自我教育|知行统一|因材施教/u),
      rule("all", 4, /课堂纪律|课堂管理|课堂规则|问题行为|偶发事件|突发事件|冲突|后进生/u),
      rule("all", 4, /师生关系|人际关系|教师领导方式|民主型|专制型|放任型|家长|家校沟通|教养方式/u),
      rule("all", 5, /联合群体|松散群体|非正式群体|群体规范|班队活动|班队|宽容学生|对学生.*宽容/u),
      rule("all", 2, /集体教育|个别教育|班级舆论|班风|操行评语|不良品行|联合群体|群体规范|社会规范|遵从|认同|内化|班队活动|班队/u),
    ],
    subdomains: [
      sub("德育原则与方法", /德育原则|德育方法|道德教育|道德评价|道德修养|品德|品行|说服教育|榜样示范|情感陶冶|陶冶教育|自我教育|知行统一|因材施教|集体教育/u),
      sub("班主任与班集体建设", /班主任|班集体|班干部|班会|班级文化|班风|班级舆论|班队活动|班队/u),
      sub("课堂管理与纪律", /课堂纪律|课堂管理|课堂规则|问题行为|偶发事件|突发事件|冲突/u),
      sub("师生关系与人际沟通", /师生关系|人际关系|教师领导方式|民主型|专制型|放任型/u),
      sub("家校协同与学生支持", /家校|家长|家访|沟通|后进生|操行评语/u),
      sub("少先队与课外活动", /少先队|课外活动|社会实践|德育基地/u),
    ],
  },
];

const ABILITY_RULES = [
  ability("law_exact_memory", "法条/政策精确记忆", /第.{0,5}条|规定|应当|不得|禁止|可以|根据《|按照《|法律责任|教师资格/u),
  ability("concept_recognition", "概念识别", /是指|称为|属于|含义|内涵|概念|定义|表现为|特点是/u),
  ability("concept_discrimination", "概念辨析", /区别|辨析|不属于|不包括|错误的是|不正确|相反|混淆|正强化|负强化|泛化|分化/u),
  ability("scenario_application", "情境应用", /案例|材料|情境|做法|体现了|违背了|说明了|根据.*案例|教师.*学生/u),
  ability("strategy_sequence", "策略与处理顺序", /首先|先|然后|处理|策略|怎么办|突发|冲突|顺序|措施/u),
  ability("reading_precision", "审题精确性", /不属于|不包括|错误的是|不正确|除外|没有|未/u),
  ability("structured_response", "论述/表达组织", /论述|简述|分析|说明理由|谈谈|结合材料/u),
  ability("timed_material_analysis", "材料信息提取", /案例分析题|材料|片段|阅读.*材料|教学片段/u),
];
const KNOWN_DIRTY_CONTENT_PATTERN = /米成年人|抚养义务7|照管制度化|职贵|太双避冲突|对环\s*的依赖|对环的依赖|X45/u;

function rule(source, weight, pattern) {
  return { source, weight, pattern };
}

function sub(name, pattern) {
  return { name, pattern };
}

function ability(id, name, pattern) {
  return { id, name, pattern };
}

function readQuestionBank(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(payload) ? { questions: payload, meta: {} } : { questions: payload.questions || [], meta: payload };
}

function textParts(question) {
  const stem = String(question.stem || "");
  const options = (question.options || []).map((option) => String(option.text || "")).join("\n");
  const explanation = String(question.explanation || "");
  const lesson = [question.lesson?.title, question.lesson?.keyPoint, question.lesson?.studyPrompt].filter(Boolean).join("\n");
  return {
    stem,
    options,
    explanation,
    lesson,
    all: [stem, options, explanation, lesson].join("\n"),
  };
}

function matchRules(domain, parts) {
  const evidence = [];
  let score = 0;
  domain.rules.forEach((item) => {
    const sourceText = parts[item.source] || parts.all;
    const matches = [...sourceText.matchAll(asGlobal(item.pattern))].map((match) => match[0]);
    if (!matches.length) return;
    const uniqueMatches = [...new Set(matches)].slice(0, 8);
    const gain = item.weight * uniqueMatches.length;
    score += gain;
    evidence.push({
      source: item.source,
      weight: item.weight,
      matches: uniqueMatches,
      score: gain,
    });
  });
  return { score, evidence };
}

function asGlobal(pattern) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return new RegExp(pattern.source, flags);
}

function classifyDomain(question) {
  const parts = textParts(question);
  const results = DOMAINS.map((domain) => ({
    id: domain.id,
    name: domain.name,
    ...matchRules(domain, parts),
  })).sort((left, right) => right.score - left.score);
  const [best, second] = results;
  const secondary = results
    .slice(1)
    .filter((item) => item.score >= Math.max(8, best.score * 0.5))
    .map((item) => ({ id: item.id, name: item.name, score: item.score }))
    .slice(0, 3);
  const confidence = getConfidence(best, second);
  const domain = confidence === "low" && best.score < 4
    ? { id: "needs_manual_classification", name: "待人工归类", score: best.score, evidence: best.evidence }
    : best;

  return {
    primaryDomain: { id: domain.id, name: domain.name },
    secondaryDomains: domain.id === "needs_manual_classification" ? [] : secondary,
    confidence,
    score: best.score,
    margin: best.score - (second?.score || 0),
    evidence: best.evidence.slice(0, 6),
    scoreTable: results.map((item) => ({ id: item.id, name: item.name, score: item.score })).filter((item) => item.score > 0),
  };
}

function getConfidence(best, second) {
  const margin = best.score - (second?.score || 0);
  if (best.score >= 18 && margin >= 6) return "high";
  if (best.score >= 10 && margin >= 4) return "medium";
  if (best.score >= 7 && margin >= 5) return "medium";
  return "low";
}

function classifySubdomain(question, domainId) {
  const domain = DOMAINS.find((item) => item.id === domainId);
  if (!domain) return "待人工确认";
  const all = textParts(question).all;
  const match = domain.subdomains.find((item) => item.pattern.test(all));
  return match?.name || "基础概念";
}

function classifyAbilities(question) {
  const parts = textParts(question);
  const combined = `${question.type || ""}\n${parts.stem}\n${parts.options}\n${parts.explanation}`;
  const abilities = ABILITY_RULES.filter((item) => item.pattern.test(combined))
    .map((item) => ({ id: item.id, name: item.name }));
  if (!abilities.length) {
    abilities.push({ id: "knowledge_recall", name: "知识回忆" });
  }
  return abilities.slice(0, 4);
}

function qualityStatus(question, classification) {
  const reasons = [];
  const optionKeys = (question.options || []).map((option) => String(option.key || "").trim()).join("");
  const stem = String(question.stem || "").trim();
  const explanation = String(question.explanation || "").trim();
  const optionText = (question.options || []).map((option) => String(option.text || "")).join("\n");

  if (question.ocr?.requiresReview) reasons.push("source_ocr_requires_review");
  if (!isStandardOptionKeyset(optionKeys)) reasons.push(`nonstandard_option_keys:${optionKeys || "none"}`);
  if (!stem || stem.length < 8 || /^略/.test(stem)) reasons.push("weak_or_missing_stem");
  if (/题干暂时未收集|欢迎补充|关注公|吴注|OCR 待复核/u.test(stem)) reasons.push("stem_has_ocr_noise");
  if (/选项 OCR 待复核|OCR 待复核|关注公|吴注/u.test(optionText)) reasons.push("option_has_ocr_noise");
  if (KNOWN_DIRTY_CONTENT_PATTERN.test([stem, optionText, explanation].join("\n"))) reasons.push("content_ocr_noise");
  if (!explanation || explanation === "略。" || explanation.length < 6) reasons.push("weak_explanation");
  if (classification.confidence === "low") reasons.push("low_classification_confidence");

  const status = reasons.length
    ? reasons.some((reason) => reason.includes("weak") || reason.includes("ocr_noise") || reason.includes("nonstandard") || reason === "low_classification_confidence")
      ? "needs_review"
      : "usable_with_caution"
    : "clean";

  return { status, reasons };
}

function isStandardOptionKeyset(keys) {
  return ["AB", "ABC", "ABCD", "ABCDE", "ABCDEF", "ABCDEFG", "ABCDEFGH"].includes(keys);
}

function classifyQuestion(question, index) {
  const domain = classifyDomain(question);
  const subdomain = classifySubdomain(question, domain.primaryDomain.id);
  const abilities = classifyAbilities(question);
  const quality = qualityStatus(question, domain);
  return {
    bankIndex: index,
    classificationKey: `${String(question.id || "question")}#${index}`,
    id: question.id,
    source: {
      year: question.year,
      type: question.type,
      oldTopic: question.topic,
      sourceRef: question.sourceRef,
      questionSourcePage: question.ocr?.questionSourcePage || null,
      answerSourcePage: question.ocr?.answerSourcePage || null,
      examTitle: question.ocr?.examTitle || question.ocr?.answerExamTitle || "",
    },
    classification: {
      primaryDomain: domain.primaryDomain,
      secondaryDomains: domain.secondaryDomains,
      knowledgePath: `${domain.primaryDomain.name} · ${subdomain}`,
      subdomain,
      examAbilities: abilities,
      confidence: domain.confidence,
      score: domain.score,
      margin: domain.margin,
      evidence: domain.evidence,
      scoreTable: domain.scoreTable,
    },
    quality,
  };
}

function summarize(classified) {
  const summary = {
    total: classified.length,
    byPrimaryDomain: countBy(classified, (item) => item.classification.primaryDomain.name),
    byConfidence: countBy(classified, (item) => item.classification.confidence),
    byQualityStatus: countBy(classified, (item) => item.quality.status),
    byOldTopicToPrimaryDomain: {},
    needsReviewCount: classified.filter((item) => item.quality.status !== "clean").length,
    lowConfidenceCount: classified.filter((item) => item.classification.confidence === "low").length,
  };

  classified.forEach((item) => {
    const oldTopic = item.source.oldTopic || "未标注";
    if (!summary.byOldTopicToPrimaryDomain[oldTopic]) summary.byOldTopicToPrimaryDomain[oldTopic] = {};
    const primary = item.classification.primaryDomain.name;
    summary.byOldTopicToPrimaryDomain[oldTopic][primary] = (summary.byOldTopicToPrimaryDomain[oldTopic][primary] || 0) + 1;
  });

  return summary;
}

function countBy(items, getKey) {
  return Object.fromEntries(
    [...items.reduce((map, item) => {
      const key = getKey(item);
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map())].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-Hans-CN")),
  );
}

function main() {
  const input = process.argv[2] || DEFAULT_INPUT;
  const output = process.argv[3] || DEFAULT_OUTPUT;
  const { questions, meta } = readQuestionBank(input);
  const classified = questions.map((question, index) => classifyQuestion(question, index));
  const payload = {
    generatedAt: new Date().toISOString(),
    sourceQuestionBank: input,
    note: "Independent classification generated from stem, options, explanation, lesson text, and OCR quality metadata. The old topic is preserved only for comparison and is not used as classifier input.",
    taxonomy: DOMAINS.map((domain) => ({ id: domain.id, name: domain.name })),
    summary: summarize(classified),
    sourceOcrSummary: meta.ocr || {},
    questions: classified,
  };
  fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${output}`);
  console.log(JSON.stringify(payload.summary, null, 2));
}

main();
