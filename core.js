export const browserRuntimeQuestionBankSourceType = "browser-runtime-question-bank-v2";
export const browserRuntimeQuestionIndexSourceType = "browser-runtime-question-index-v2";

export const learningDomainDefinitions = [
  { id: "psychology", name: "学习心理与认知机制" },
  { id: "pedagogy", name: "教育学原理、课程与教学" },
  { id: "law", name: "教育法律法规与政策制度" },
  { id: "classroom", name: "德育、班级管理与家校协同" },
  { id: "child", name: "学生身心发展与个体差异" },
  { id: "teacher", name: "教师职业素养与专业规范" },
];

export const runTargets = [
  {
    id: "explore",
    name: "拓新题阵",
    shortName: "拓新",
    description: "接触新题，扩大覆盖面。",
  },
  {
    id: "purify",
    name: "净魔题阵",
    shortName: "净魔",
    description: "处理活跃心魔和重复错因。",
  },
  {
    id: "sprint",
    name: "冲刺题阵",
    shortName: "冲刺",
    description: "混合学习域，训练切换压力。",
  },
];

export const studyStyles = [
  {
    id: "steady",
    name: "稳修",
    description: "稳定推进，容错更高。",
  },
  {
    id: "assault",
    name: "突击",
    description: "连对收益高，答错代价更明显。",
  },
  {
    id: "review",
    name: "复盘",
    description: "心魔收益高，新题推进较慢。",
  },
];

export const breakMoves = [
  {
    id: "steady",
    name: "稳破",
    description: "正常作答，保持稳定收益。",
  },
  {
    id: "assault",
    name: "强攻",
    description: "有把握时使用，答对收益更高。",
  },
  {
    id: "observe",
    name: "观照",
    description: "先看一句提示，收益降低。",
  },
];

export const balanceConfig = {
  run: {
    length: 5,
    slotDifficulty: [1, 2, 2, 3, 2],
    pressureSlotIndex: 3,
  },
  goals: {
    exploreNewQuestions: 5,
    purifyDemons: 2,
    sprintCorrect: 4,
  },
  recommendation: {
    highPressureThreshold: 3,
    minimumAnsweredBeforeSprint: 5,
    unstableAccuracyThreshold: 0.75,
    unstableDomainCountForSprint: 2,
  },
  selection: {
    difficultyPenalty: 8,
    pressureSlotTypeBonus: 60,
    repeatDomainPenalty: {
      explore: 85,
      purify: 20,
      sprint: 140,
    },
    repeatTypePenalty: {
      explore: 10,
      purify: 5,
      sprint: 70,
    },
  },
  scoring: {
    correctBaseGain: 10,
    wrongBaseGain: 1,
    streakCap: 3,
  },
  styles: {
    steady: {
      correctGainMultiplier: 1,
      streakGainStep: 0,
      maxStreakMultiplier: 0,
      wrongPressureMultiplier: 0.85,
      purifyPower: 1,
      newQuestionRankPenalty: 0,
    },
    assault: {
      correctGainMultiplier: 1.1,
      streakGainStep: 0.15,
      maxStreakMultiplier: 0.45,
      wrongPressureMultiplier: 1.25,
      purifyPower: 1,
      newQuestionRankPenalty: 0,
    },
    review: {
      correctGainMultiplier: 0.9,
      streakGainStep: 0,
      maxStreakMultiplier: 0,
      wrongPressureMultiplier: 1,
      purifyPower: 2,
      newQuestionRankPenalty: 120,
    },
  },
  breakMoves: {
    steady: {
      correctGainMultiplier: 1,
      wrongPressureMultiplier: 1,
      purifyPowerMultiplier: 1,
    },
    assault: {
      correctGainMultiplier: 1.25,
      wrongPressureMultiplier: 1.5,
      purifyPowerMultiplier: 1.25,
    },
    observe: {
      correctGainMultiplier: 0.65,
      wrongPressureMultiplier: 0.75,
      purifyPowerMultiplier: 0.5,
    },
  },
  demons: {
    baseWrongPressure: 1,
    minimumActivePressure: 1,
    maxPressure: 9,
  },
};

const realDomainNames = new Set(learningDomainDefinitions.map((domain) => domain.name));
const targetById = new Map(runTargets.map((target) => [target.id, target]));
const styleById = new Map(studyStyles.map((style) => [style.id, style]));
const breakMoveById = new Map(breakMoves.map((move) => [move.id, move]));

const compactRuntimeQuestionSchema = [
  "id",
  "sourceId",
  "bankIndex",
  "year",
  "type",
  "topic",
  "stem",
  "options",
  "answer",
  "difficulty",
  "realm",
  "enemy",
  "heartMethod",
  "concept",
  "dependencies",
  "errorPatterns",
  "chapterMechanic",
  "qualityStatus",
  "gameplayStatus",
  "lesson",
];

const compactIndexQuestionSchema = [
  "id",
  "sourceId",
  "bankIndex",
  "year",
  "type",
  "topic",
  "difficulty",
  "enemy",
  "concept",
  "dependencies",
  "errorPatterns",
  "chapterMechanic",
  "qualityStatus",
  "gameplayStatus",
  "lesson",
  "chunkId",
];

const compactLessonSchema = ["id", "title", "keyPoint", "explanation", "studyPrompt"];

const demonTypes = {
  "reading-mistake": "审题失误",
  "concept-confusion": "概念混淆",
  "memory-gap": "记忆盲区",
  "application-error": "应用失误",
  "multi-miss": "多选漏选",
  "overconfidence": "过度自信",
};

export function createInitialState(overrides = {}) {
  return {
    version: 2,
    theme: "night",
    answered: {},
    demons: {},
    currentRun: null,
    lastReport: null,
    ...structuredCloneSafe(overrides),
  };
}

export function prepareQuestionBank(rawQuestions = [], options = {}) {
  const normalized = normalizeQuestionArray(rawQuestions);
  const manualReview = [];
  const playable = [];

  normalized.forEach((question) => {
    if (isManualReviewQuestion(question)) {
      manualReview.push(question);
      return;
    }
    if (isPlayableQuestion(question, options)) playable.push(question);
  });

  return {
    all: normalized,
    playable,
    manualReview,
  };
}

export function prepareQuestions(rawQuestions = []) {
  return prepareQuestionBank(rawQuestions).all;
}

export function parseQuestionImport(payload) {
  const data = typeof payload === "string" ? JSON.parse(payload) : payload;
  const rawQuestions = Array.isArray(data) ? data : data?.questions;
  if (!Array.isArray(rawQuestions)) {
    throw new Error("题目数据格式不正确。");
  }
  return prepareQuestions(rawQuestions);
}

export function summarizeQuestionBank(questions = []) {
  const bank = prepareQuestionBank(questions);
  const byDomain = new Map();
  bank.playable.forEach((question) => {
    const name = question.primaryDomain.name;
    byDomain.set(name, (byDomain.get(name) || 0) + 1);
  });
  return {
    total: bank.all.length,
    playable: bank.playable.length,
    manualReview: bank.manualReview.length,
    byDomain: [...byDomain.entries()].map(([name, count]) => ({ name, count })),
  };
}

export function createStartRecommendation(questions = [], state = createInitialState()) {
  if (state.currentRun && !isRunComplete(state.currentRun)) {
    return {
      targetId: state.currentRun.targetId,
      styleId: state.currentRun.styleId,
      title: "继续当前题阵",
      reason: "上一局还没收尾，接着把剩下的题做完。",
      goal: state.currentRun.goal || createRunGoal(state.currentRun.targetId, state.currentRun.questions || []),
      primaryAction: "继续题阵",
      hasUnfinishedRun: true,
    };
  }

  const highPressureDemon = getHighPressureDemon(state, {
    threshold: balanceConfig.recommendation.highPressureThreshold,
  });
  if (highPressureDemon) {
    return {
      targetId: "purify",
      styleId: "review",
      title: "净魔题阵",
      reason: `${highPressureDemon.type}反复出现，先用一局错题复测把判断稳住。`,
      goal: `净化${balanceConfig.goals.purifyDemons}个${highPressureDemon.type}心魔，争取${balanceConfig.goals.sprintCorrect}/${balanceConfig.run.length}正确。`,
      primaryAction: "进入题阵",
      focusDemonId: highPressureDemon.id,
    };
  }

  const recommendationContext = createRecommendationContext(questions, state);
  if (recommendationContext.unstableDomainCount >= balanceConfig.recommendation.unstableDomainCountForSprint) {
    return {
      targetId: "sprint",
      styleId: "steady",
      title: "冲刺题阵",
      reason: "已有作答记录，可以用混合题阵检查跨域切换。",
      goal: `保持 ${balanceConfig.goals.sprintCorrect} / ${balanceConfig.run.length} 正确，找出拖慢判断的学习域。`,
      primaryAction: "进入题阵",
    };
  }

  if (recommendationContext.answeredCount >= balanceConfig.recommendation.minimumAnsweredBeforeSprint
    && recommendationContext.coveredDomainCount >= Math.min(learningDomainDefinitions.length, 3)) {
    return {
      targetId: "sprint",
      styleId: "steady",
      title: "冲刺题阵",
      reason: "已有作答记录，可以用混合题阵检查跨域切换。",
      goal: `保持 ${balanceConfig.goals.sprintCorrect} / ${balanceConfig.run.length} 正确，找出拖慢判断的学习域。`,
      primaryAction: "进入题阵",
    };
  }

  return {
    targetId: "explore",
    styleId: "steady",
    title: "拓新题阵",
    reason: `先完成一局 ${balanceConfig.run.length} 题短局，建立第一批题眼记录。`,
    goal: `完成 ${balanceConfig.run.length} 道新题并新增题眼。`,
    primaryAction: "进入题阵",
  };
}

export function selectRunQuestions(questions = [], state = createInitialState(), options = {}) {
  const length = Math.max(1, Number(options.length || balanceConfig.run.length));
  const targetId = normalizeTargetId(options.targetId);
  const playableOptions = { allowIndexStubs: Boolean(options.allowIndexStubs) };
  const fallbackQuestions = normalizeQuestionArray(options.fallbackQuestions || questions)
    .filter((question) => isPlayableQuestion(question, playableOptions));
  const baseQuestions = normalizeQuestionArray(questions)
    .filter((question) => isPlayableQuestion(question, playableOptions));
  const pool = uniqueQuestions([...baseQuestions, ...fallbackQuestions]);
  const ranked = rankQuestionsForTarget(pool, state, {
    targetId,
    focusDemonId: options.focusDemonId,
    styleId: options.styleId,
  });
  return selectBalancedQuestionSet(ranked, { targetId, length });
}

export function createRun(questions = [], state = createInitialState(), options = {}) {
  const targetId = normalizeTargetId(options.targetId);
  const styleId = normalizeStyleId(options.styleId);
  const selected = selectRunQuestions(questions, state, {
    targetId,
    length: options.length || balanceConfig.run.length,
    fallbackQuestions: options.fallbackQuestions || questions,
    focusDemonId: options.focusDemonId,
    styleId,
    allowIndexStubs: Boolean(options.allowIndexStubs),
  });
  const id = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    targetId,
    targetName: targetById.get(targetId).name,
    styleId,
    styleName: styleById.get(styleId).name,
    focusDemonId: options.focusDemonId || "",
    goal: options.goal || createRunGoal(targetId, selected),
    questions: selected,
    questionIds: selected.map((question) => question.id),
    currentIndex: 0,
    answers: {},
    completed: false,
    startedAt: new Date().toISOString(),
  };
}

export function normalizeAnswer(answer, options = []) {
  const raw = Array.isArray(answer) ? answer.join("") : String(answer || "");
  const selected = new Set(raw.toUpperCase().replace(/\s+/g, "").split("").filter(Boolean));
  const optionOrder = normalizeOptions(options).map((option) => option.key);
  const order = optionOrder.length ? optionOrder : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  return order.filter((key) => selected.has(key)).join("");
}

export function judgeAnswer(question, selectedKeys = []) {
  const options = normalizeOptions(question?.options || []);
  const selectedAnswer = normalizeAnswer(selectedKeys, options);
  const correctAnswer = normalizeAnswer(question?.answer, options);
  return {
    selectedAnswer,
    correctAnswer,
    isCorrect: selectedAnswer === correctAnswer && correctAnswer.length > 0,
  };
}

export function createObservationHint(question = {}) {
  const lesson = normalizeLesson(question.lesson);
  const explanation = String(lesson.keyPoint || lesson.explanation || question.explanation || "");
  const sentence = firstUsefulSentence(explanation) || "题眼：先找限定词、对象和条件，再比较选项是否完整对应。";
  const sanitized = stripAnswerLeak(sentence, question);
  return {
    text: sanitized.startsWith("题眼") ? sanitized : `题眼：${sanitized}`,
    revealsAnswer: false,
  };
}

export function applyAnswer(stateInput, runInput, questionId, answerInput = {}) {
  const state = createInitialState(stateInput);
  const run = cloneRun(runInput);
  const question = run.questions.find((item) => item.id === questionId);
  if (!question) throw new Error("题阵中找不到这道题。");

  const breakMoveId = normalizeBreakMoveId(answerInput.breakMoveId);
  const selectedKeys = normalizeSelectedKeys(answerInput.selectedKeys);
  const judged = judgeAnswer(question, selectedKeys);
  const now = new Date().toISOString();
  const previousHistory = state.answered[question.id] || {
    attempts: 0,
    correct: 0,
    wrong: 0,
  };
  const wasNewQuestion = Number(previousHistory.attempts || 0) === 0;
  const history = {
    attempts: previousHistory.attempts + 1,
    correct: previousHistory.correct + (judged.isCorrect ? 1 : 0),
    wrong: previousHistory.wrong + (judged.isCorrect ? 0 : 1),
    lastAnswer: judged.selectedAnswer,
    lastCorrect: judged.isCorrect,
    lastAt: now,
  };

  state.answered[question.id] = history;
  const streak = judged.isCorrect ? getRunCorrectStreak(run, question.id) + 1 : 0;
  const gain = calculateAnswerGain(run, judged, breakMoveId, streak);
  const demonChange = updateDemonsForAnswer(state, run, question, judged, breakMoveId, now, selectedKeys);
  run.answers[question.id] = {
    selectedKeys,
    breakMoveId,
    observeRevealed: Boolean(answerInput.observeRevealed || breakMoveId === "observe"),
    submitted: true,
    isCorrect: judged.isCorrect,
    correctAnswer: judged.correctAnswer,
    selectedAnswer: judged.selectedAnswer,
    wasNewQuestion,
    baseGain: gain.baseGain,
    gain: gain.gain,
    styleMultiplier: gain.styleMultiplier,
    breakMoveMultiplier: gain.breakMoveMultiplier,
    streak,
    pressureChange: demonChange.pressureChange,
    demonType: demonChange.demonType,
    newDemons: demonChange.newDemons,
    strengthenedDemons: demonChange.strengthenedDemons,
    reducedDemons: demonChange.reducedDemons,
    purifiedDemons: demonChange.purifiedDemons,
  };

  const currentPosition = run.questions.findIndex((item) => item.id === question.id);
  if (currentPosition >= 0) run.currentIndex = Math.min(run.questions.length - 1, currentPosition);
  run.completed = run.questions.every((item) => run.answers[item.id]?.submitted);
  if (run.completed) {
    run.completedAt = now;
    state.lastReport = createLearningReport(state, run);
    state.currentRun = null;
  } else {
    state.currentRun = run;
  }

  return {
    state,
    run,
    answer: {
      ...judged,
      selectedKeys,
      breakMoveId,
      questionId: question.id,
      demonType: getQuestionDemonType(question, judged, selectedKeys),
    },
  };
}

export function createLearningReport(state = createInitialState(), run = {}) {
  const questions = run.questions || [];
  const answers = run.answers || {};
  const submitted = questions.filter((question) => answers[question.id]?.submitted);
  const correctCount = submitted.filter((question) => answers[question.id]?.isCorrect).length;
  const wrongCount = Math.max(0, submitted.length - correctCount);
  const total = questions.length || balanceConfig.run.length;
  const submittedAnswers = submitted.map((question) => answers[question.id]);
  const newDemons = uniqueDemonSummaries(submittedAnswers.flatMap((answer) => answer.newDemons || []));
  const strengthenedDemons = uniqueDemonSummaries(submittedAnswers.flatMap((answer) => answer.strengthenedDemons || []));
  const reducedDemons = uniqueDemonSummaries(submittedAnswers.flatMap((answer) => answer.reducedDemons || []));
  const purifiedDemons = uniqueDemonSummaries(submittedAnswers.flatMap((answer) => answer.purifiedDemons || []));
  const targetProgress = createTargetProgress(run, submitted, answers, correctCount, purifiedDemons);
  const totalGain = submittedAnswers.reduce((sum, answer) => sum + Number(answer.gain || 0), 0);
  const bestStreak = submittedAnswers.reduce((max, answer) => Math.max(max, Number(answer.streak || 0)), 0);
  const mainDemonType = getMainDemonType([...newDemons, ...strengthenedDemons]);
  const activeDemons = Object.values(state.demons || {}).filter((demon) => !demon.purified);
  const highPressureDemon = getHighPressureDemon(state, {
    threshold: balanceConfig.recommendation.highPressureThreshold,
  });
  const demonGainText = newDemons.length || strengthenedDemons.length || purifiedDemons.length
    ? `新增心魔 ${newDemons.length} 个 · 强化心魔 ${strengthenedDemons.length} 个 · 净化心魔 ${purifiedDemons.length} 个`
    : "没有新增心魔";
  const nextStep = highPressureDemon
    ? `先处理 1 个${highPressureDemon.type || "错因"}心魔，再继续题阵。`
    : activeDemons.length && wrongCount
      ? `先复测${mainDemonType || "主要错因"}，再继续题阵。`
    : `继续拓新题阵，保持 ${balanceConfig.run.length} 题短局节奏。`;

  return {
    title: "学习报告",
    summary: `${total} 题完成 · ${correctCount} 对 ${wrongCount} 错`,
    gains: `题眼短课 ${submitted.length} 条 · ${demonGainText}`,
    nextStep,
    correctCount,
    wrongCount,
    total,
    targetId: run.targetId || "explore",
    styleId: run.styleId || "steady",
    targetProgress,
    newDemons,
    strengthenedDemons,
    reducedDemons,
    purifiedDemons,
    mainDemonType,
    totalGain,
    bestStreak,
    lessonCount: submitted.length,
  };
}

export function createDemonUpdate(state, question, result) {
  const nextState = createInitialState(state);
  updateDemonsForAnswer(nextState, { targetId: "explore", styleId: "steady" }, question, result, "steady", new Date().toISOString(), []);
  return nextState.demons;
}

export function getHighPressureDemon(state = createInitialState(), options = {}) {
  const threshold = Number(options.threshold ?? balanceConfig.demons.minimumActivePressure);
  return Object.values(state.demons || {})
    .filter((demon) => !demon.purified && Number(demon.pressure || 0) >= threshold)
    .sort((a, b) => Number(b.pressure || 0) - Number(a.pressure || 0))[0] || null;
}

export function encodeSaveState(state = createInitialState()) {
  return btoaUnicode(JSON.stringify(createInitialState(state)));
}

export function decodeSaveState(saveCode = "") {
  const parsed = JSON.parse(atobUnicode(String(saveCode || "").trim()));
  if (Number(parsed?.version) !== 2) throw new Error("存档码版本不匹配。");
  return createInitialState(parsed);
}

export function applyQuestionClassifications(questions = [], audit = {}) {
  const entries = new Map((audit.questions || []).map((entry) => [entry.id, entry]));
  return normalizeQuestionArray(questions).map((question) => {
    const entry = entries.get(question.id);
    if (!entry) return question;
    const domain = entry.classification?.primaryDomain;
    const qualityStatus = entry.quality?.status || question.qualityStatus;
    return normalizeQuestion({
      ...question,
      topic: domain?.name || question.topic,
      primaryDomain: domain || question.primaryDomain,
      concept: entry.classification?.knowledgePath || question.concept,
      qualityStatus,
    });
  });
}

function normalizeQuestionArray(value = []) {
  const raw = Array.isArray(value) ? value : value?.questions || [];
  return raw.map(normalizeQuestion).filter(Boolean);
}

function normalizeQuestion(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return normalizeCompactQuestion(raw);
  const options = normalizeOptions(raw.options);
  const domain = normalizePrimaryDomain(raw.primaryDomain, raw.topic);
  return {
    ...raw,
    id: String(raw.id || raw.sourceId || "").trim(),
    sourceId: String(raw.sourceId || raw.id || "").trim(),
    year: String(raw.year || "").trim(),
    type: String(raw.type || "单项选择").trim(),
    topic: domain.name,
    primaryDomain: domain,
    stem: String(raw.stem || "").trim(),
    options,
    answer: normalizeAnswer(raw.answer, options),
    explanation: String(raw.explanation || raw.lesson?.explanation || "").trim(),
    difficulty: Number(raw.difficulty || 1),
    concept: String(raw.concept || `${domain.name} · 基础概念`).trim(),
    errorPatterns: normalizeErrorPatterns(raw.errorPatterns),
    qualityStatus: String(raw.qualityStatus || raw.quality?.status || "clean").trim(),
    gameplayStatus: String(raw.gameplayStatus || "mainline").trim(),
    lesson: normalizeLesson(raw.lesson, raw),
    chunkId: raw.chunkId || "",
  };
}

function normalizeCompactQuestion(raw) {
  const hasStem = typeof raw[6] === "string" && Array.isArray(raw[7]);
  const schema = hasStem ? compactRuntimeQuestionSchema : compactIndexQuestionSchema;
  const obj = Object.fromEntries(schema.map((key, index) => [key, raw[index]]));
  const lesson = Array.isArray(obj.lesson)
    ? Object.fromEntries(compactLessonSchema.map((key, index) => [key, obj.lesson[index]]))
    : obj.lesson;
  return normalizeQuestion({
    ...obj,
    lesson,
    primaryDomain: { id: obj.topic, name: obj.topic },
    options: Array.isArray(obj.options)
      ? obj.options.map((option) => Array.isArray(option) ? { key: option[0], text: option[1] } : option)
      : [],
  });
}

function normalizeOptions(options = []) {
  return Array.isArray(options)
    ? options.map((option) => ({
        key: String(option?.key ?? option?.[0] ?? "").trim().toUpperCase(),
        text: String(option?.text ?? option?.[1] ?? "").trim(),
      })).filter((option) => option.key)
    : [];
}

function normalizePrimaryDomain(primaryDomain, fallbackTopic = "") {
  const fallback = String(primaryDomain?.name || primaryDomain?.id || fallbackTopic || "").trim();
  const matched = learningDomainDefinitions.find((domain) => domain.name === fallback || domain.id === fallback);
  if (matched) return { id: matched.id, name: matched.name };
  return { id: fallback || "unclassified", name: fallback || "待人工分类" };
}

function normalizeLesson(lesson = {}, question = {}) {
  if (Array.isArray(lesson)) {
    lesson = Object.fromEntries(compactLessonSchema.map((key, index) => [key, lesson[index]]));
  }
  const explanation = String(lesson?.explanation || question.explanation || "").trim();
  return {
    id: String(lesson?.id || `lesson-${question.id || "question"}`).trim(),
    title: String(lesson?.title || question.topic || "题眼短课").trim(),
    keyPoint: String(lesson?.keyPoint || extractKeyPoint(explanation) || "先抓限定词、对象和条件。").trim(),
    explanation,
    studyPrompt: String(lesson?.studyPrompt || "先抓住题眼，再进入题阵检验。").trim(),
  };
}

function normalizeErrorPatterns(value = []) {
  const list = Array.isArray(value) ? value : [value];
  return list.map((item) => String(item || "").trim()).filter(Boolean);
}

function isManualReviewQuestion(question) {
  const status = String(question.qualityStatus || "").toLowerCase();
  const domain = question.primaryDomain?.name || question.topic;
  return status.includes("manual")
    || status.includes("review")
    || domain === "待人工归类"
    || domain === "待人工分类";
}

function isPlayableQuestion(question, options = {}) {
  if (!question?.id) return false;
  const hasFullPayload = Boolean(question.stem && question.answer && question.options?.length);
  const hasLazyIndexPayload = Boolean(options.allowIndexStubs && question.chunkId);
  if (!hasFullPayload && !hasLazyIndexPayload) return false;
  if (!realDomainNames.has(question.primaryDomain?.name)) return false;
  if (question.primaryDomain?.name === "综合知识") return false;
  const status = String(question.qualityStatus || "clean").toLowerCase();
  if (["dirty", "broken", "invalid"].some((bad) => status.includes(bad))) return false;
  return !isManualReviewQuestion(question);
}

function rankQuestionsForTarget(questions, state, options) {
  const targetId = options.targetId;
  const focusDemon = options.focusDemonId ? state.demons?.[options.focusDemonId] : getHighPressureDemon(state);
  const answered = state.answered || {};
  return questions
    .map((question, index) => ({
      question,
      index,
      rank: getQuestionRank(question, index, answered, targetId, focusDemon, state, options.styleId),
    }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index);
}

function getQuestionRank(question, index, answered, targetId, focusDemon, state, styleId = "steady") {
  let rank = index;
  const history = answered[question.id];
  if (targetId === "explore") {
    if (!history) rank -= 1000 - Number(balanceConfig.styles[styleId]?.newQuestionRankPenalty || 0);
    else rank += history.correct * 50 + history.attempts * 100 - history.wrong * 20;
  }
  if (targetId === "purify") {
    if (focusDemon?.questionIds?.includes(question.id)) rank -= 2000;
    const demonMatch = Object.values(state.demons || {}).some((demon) => !demon.purified && demon.questionIds?.includes(question.id));
    if (demonMatch) rank -= 1000;
    if (focusDemon && getQuestionDemonType(question, { isCorrect: false }) === focusDemon.type) rank -= 180;
    if (history?.wrong) rank -= history.wrong * 120;
  }
  if (targetId === "sprint") {
    if (!history) rank -= 20;
    else {
      const accuracy = Number(history.attempts || 0) ? Number(history.correct || 0) / Number(history.attempts || 1) : 0;
      rank += history.lastCorrect ? 30 : -140;
      rank += accuracy >= balanceConfig.recommendation.unstableAccuracyThreshold ? 80 : -80;
    }
    rank += Math.abs(Number(question.difficulty || 1) - 3) * 10;
  }
  return rank;
}

function selectBalancedQuestionSet(candidates = [], options = {}) {
  const length = Math.max(1, Number(options.length || balanceConfig.run.length));
  const targetId = normalizeTargetId(options.targetId);
  const selected = [];
  const remaining = [...candidates];

  while (selected.length < length && remaining.length) {
    const position = selected.length;
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const score = candidate.rank + getQuestionSlotAdjustment(candidate.question, selected, position, targetId);
      if (score < bestScore || (score === bestScore && candidate.index < remaining[bestIndex]?.index)) {
        bestScore = score;
        bestIndex = index;
      }
    });

    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected.map((item) => item.question);
}

function getQuestionSlotAdjustment(question, selected, position, targetId) {
  const domain = question.primaryDomain?.name || question.topic;
  const type = String(question.type || "");
  const selectedDomains = new Set(selected.map((item) => item.question.primaryDomain?.name || item.question.topic));
  const selectedTypes = new Set(selected.map((item) => String(item.question.type || "")));
  const repeatDomainPenalty = balanceConfig.selection.repeatDomainPenalty[targetId] || 0;
  const repeatTypePenalty = balanceConfig.selection.repeatTypePenalty[targetId] || 0;
  const fallbackDifficulty = balanceConfig.run.slotDifficulty[balanceConfig.run.slotDifficulty.length - 1] || 2;
  const desiredDifficulty = balanceConfig.run.slotDifficulty[position] || fallbackDifficulty;
  let adjustment = Math.abs(Number(question.difficulty || 1) - desiredDifficulty) * balanceConfig.selection.difficultyPenalty;

  if (selectedDomains.has(domain)) adjustment += repeatDomainPenalty;
  if (selectedTypes.has(type)) adjustment += repeatTypePenalty;

  if (position === balanceConfig.run.pressureSlotIndex) {
    adjustment += isPressureQuestionType(question)
      ? -balanceConfig.selection.pressureSlotTypeBonus
      : balanceConfig.selection.pressureSlotTypeBonus / 2;
  }

  return adjustment;
}

function isPressureQuestionType(question) {
  return /多项|案例|判断/u.test(String(question.type || ""));
}

function uniqueQuestions(questions = []) {
  const seen = new Set();
  return questions.filter((question) => {
    if (!question?.id || seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

function createRunGoal(targetId, questions) {
  if (targetId === "purify") return `净化 ${balanceConfig.goals.purifyDemons} 个心魔，争取 ${balanceConfig.goals.sprintCorrect} / ${balanceConfig.run.length} 正确。`;
  if (targetId === "sprint") return `保持 ${balanceConfig.goals.sprintCorrect} / ${balanceConfig.run.length} 正确，找出薄弱学习域。`;
  return `完成 ${questions.length || balanceConfig.run.length} 道新题并新增题眼。`;
}

function updateDemonsForAnswer(state, run, question, judged, breakMoveId, now, selectedKeys = []) {
  const type = getQuestionDemonType(question, judged, selectedKeys);
  const demonId = getDemonId(type);
  const change = {
    demonType: type,
    pressureChange: 0,
    newDemons: [],
    strengthenedDemons: [],
    reducedDemons: [],
    purifiedDemons: [],
  };
  if (!judged.isCorrect) {
    const existingDemon = state.demons[demonId];
    const existing = state.demons[demonId] || {
      id: demonId,
      type,
      pressure: 0,
      questionIds: [],
      recentText: "",
      purified: false,
    };
    const pressureDelta = calculateWrongPressure(run, breakMoveId);
    const previousPressure = Number(existing.pressure || 0);
    const isNewDemon = !existingDemon || existing.purified || previousPressure === 0;
    const nextPressure = Math.min(balanceConfig.demons.maxPressure, previousPressure + pressureDelta);
    const summary = {
      id: demonId,
      type,
      pressureChange: nextPressure - previousPressure,
      pressure: nextPressure,
      questionIds: uniqueStrings([...(existing.questionIds || []), question.id]),
    };
    state.demons[demonId] = {
      ...existing,
      pressure: nextPressure,
      questionIds: summary.questionIds,
      recentText: createRecentDemonText(type, question),
      purified: false,
      lastAt: now,
    };
    change.pressureChange = summary.pressureChange;
    if (isNewDemon) change.newDemons.push(summary);
    else change.strengthenedDemons.push(summary);
    return change;
  }

  if (run.targetId !== "purify") return change;
  Object.values(state.demons || {}).forEach((demon) => {
    if (demon.purified) return;
    const related = demon.questionIds?.includes(question.id) || demon.type === type;
    if (!related) return;
    const previousPressure = Number(demon.pressure || 0);
    const purifyPower = calculatePurifyPower(run, breakMoveId);
    const nextPressure = Math.max(0, previousPressure - purifyPower);
    demon.pressure = nextPressure;
    demon.purified = nextPressure === 0;
    demon.lastAt = now;
    const summary = {
      id: demon.id,
      type: demon.type,
      pressureChange: nextPressure - previousPressure,
      pressure: nextPressure,
      questionIds: [...(demon.questionIds || [])],
    };
    change.pressureChange += summary.pressureChange;
    change.reducedDemons.push(summary);
    if (demon.purified) change.purifiedDemons.push(summary);
  });
  return change;
}

function createRecommendationContext(questions = [], state = createInitialState()) {
  const questionById = new Map(normalizeQuestionArray(questions).map((question) => [question.id, question]));
  const domainStats = new Map();
  const answeredEntries = Object.entries(state.answered || {});

  answeredEntries.forEach(([questionId, history]) => {
    const question = questionById.get(questionId);
    const domain = question?.primaryDomain?.name || question?.topic;
    if (!domain) return;
    const stats = domainStats.get(domain) || { attempts: 0, correct: 0 };
    stats.attempts += Number(history.attempts || 0);
    stats.correct += Number(history.correct || 0);
    domainStats.set(domain, stats);
  });

  const unstableDomainCount = [...domainStats.values()].filter((stats) => {
    if (!stats.attempts) return false;
    return stats.correct / stats.attempts < balanceConfig.recommendation.unstableAccuracyThreshold;
  }).length;

  return {
    answeredCount: answeredEntries.length,
    coveredDomainCount: domainStats.size,
    unstableDomainCount,
  };
}

function calculateAnswerGain(run, judged, breakMoveId, streak) {
  const style = getStyleBalance(run.styleId);
  const move = getBreakMoveBalance(breakMoveId);
  const baseGain = judged.isCorrect ? balanceConfig.scoring.correctBaseGain : balanceConfig.scoring.wrongBaseGain;
  const streakBonus = judged.isCorrect
    ? Math.min(style.maxStreakMultiplier || 0, Math.max(0, streak - 1) * (style.streakGainStep || 0))
    : 0;
  const styleMultiplier = Number(style.correctGainMultiplier || 1) + streakBonus;
  const breakMoveMultiplier = judged.isCorrect ? Number(move.correctGainMultiplier || 1) : 1;
  return {
    baseGain,
    styleMultiplier,
    breakMoveMultiplier,
    gain: Math.max(0, Math.round(baseGain * styleMultiplier * breakMoveMultiplier)),
  };
}

function calculateWrongPressure(run, breakMoveId) {
  const style = getStyleBalance(run.styleId);
  const move = getBreakMoveBalance(breakMoveId);
  return Math.max(1, Math.ceil(
    balanceConfig.demons.baseWrongPressure
    * Number(style.wrongPressureMultiplier || 1)
    * Number(move.wrongPressureMultiplier || 1),
  ));
}

function calculatePurifyPower(run, breakMoveId) {
  const style = getStyleBalance(run.styleId);
  const move = getBreakMoveBalance(breakMoveId);
  return Math.max(1, Math.round(
    Number(style.purifyPower || 1)
    * Number(move.purifyPowerMultiplier || 1),
  ));
}

function getStyleBalance(styleId) {
  return balanceConfig.styles[normalizeStyleId(styleId)] || balanceConfig.styles.steady;
}

function getBreakMoveBalance(breakMoveId) {
  return balanceConfig.breakMoves[normalizeBreakMoveId(breakMoveId)] || balanceConfig.breakMoves.steady;
}

function getRunCorrectStreak(run, questionId) {
  const questions = run.questions || [];
  const currentIndex = questions.findIndex((question) => question.id === questionId);
  const endIndex = currentIndex >= 0 ? currentIndex : questions.length;
  let streak = 0;
  for (let index = endIndex - 1; index >= 0; index -= 1) {
    const answer = run.answers?.[questions[index].id];
    if (!answer?.submitted || !answer.isCorrect) break;
    streak += 1;
  }
  return Math.min(streak, balanceConfig.scoring.streakCap);
}

function createTargetProgress(run, submitted, answers, correctCount, purifiedDemons) {
  const targetId = normalizeTargetId(run.targetId);
  if (targetId === "purify") {
    return {
      label: "净化心魔",
      current: purifiedDemons.length,
      target: balanceConfig.goals.purifyDemons,
      completed: purifiedDemons.length >= balanceConfig.goals.purifyDemons,
    };
  }
  if (targetId === "sprint") {
    return {
      label: "正确题数",
      current: correctCount,
      target: Math.min(balanceConfig.goals.sprintCorrect, run.questions?.length || balanceConfig.run.length),
      completed: correctCount >= Math.min(balanceConfig.goals.sprintCorrect, run.questions?.length || balanceConfig.run.length),
    };
  }
  const newQuestionCount = submitted.filter((question) => answers[question.id]?.wasNewQuestion).length;
  return {
    label: "新题",
    current: newQuestionCount,
    target: Math.min(balanceConfig.goals.exploreNewQuestions, run.questions?.length || balanceConfig.run.length),
    completed: newQuestionCount >= Math.min(balanceConfig.goals.exploreNewQuestions, run.questions?.length || balanceConfig.run.length),
  };
}

function uniqueDemonSummaries(demons = []) {
  const byId = new Map();
  demons.filter(Boolean).forEach((demon) => {
    const id = String(demon.id || demon.type || "").trim();
    if (!id) return;
    const existing = byId.get(id);
    byId.set(id, existing
      ? {
          ...demon,
          pressureChange: Number(existing.pressureChange || 0) + Number(demon.pressureChange || 0),
          questionIds: uniqueStrings([...(existing.questionIds || []), ...(demon.questionIds || [])]),
        }
      : {
          ...demon,
          questionIds: [...(demon.questionIds || [])],
        });
  });
  return [...byId.values()];
}

function getMainDemonType(demons = []) {
  const counts = new Map();
  demons.forEach((demon) => {
    const type = String(demon.type || "").trim();
    if (!type) return;
    counts.set(type, (counts.get(type) || 0) + Math.max(1, Math.abs(Number(demon.pressureChange || 0))));
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function getQuestionDemonType(question, judged = {}, selectedKeys = []) {
  if (!judged.isCorrect && question.answer?.length > 1 && selectedKeys.length < question.answer.length) {
    return demonTypes["multi-miss"];
  }
  const primaryPattern = question.errorPatterns?.[0] || "overconfidence";
  return demonTypes[primaryPattern] || demonTypes.overconfidence;
}

function getDemonId(type) {
  return type.replace(/\s+/g, "-");
}

function createRecentDemonText(type, question) {
  if (type === "审题失误") return "最近漏看限定词、对象或条件。";
  if (type === "概念混淆") return "最近把相近概念边界混在一起。";
  if (type === "记忆盲区") return "最近基础事实或条文没有稳定记住。";
  if (type === "应用失误") return "最近知道概念但没有匹配到情境。";
  if (type === "多选漏选") return "最近多选题没有逐项排查。";
  return `${question.primaryDomain?.name || "本题"}需要复测。`;
}

function firstUsefulSentence(text) {
  return String(text || "")
    .split(/[。！？\n]/u)
    .map((part) => part.trim())
    .find((part) => /题眼|限定|对象|条件|考点|错因/u.test(part));
}

function stripAnswerLeak(text, question) {
  const correct = normalizeAnswer(question.answer, question.options);
  let output = String(text || "").replace(/正确答案[:：]?[A-Z]+/giu, "");
  if (correct) {
    output = output.replace(new RegExp(`答案[是为]?[:：]?${correct}`, "giu"), "");
  }
  return output.trim() || "先找限定词、对象和条件，再比较选项是否完整对应。";
}

function extractKeyPoint(explanation) {
  const match = String(explanation || "").match(/题眼(?:是|：|:)?([^。；\n]+)/u);
  return match?.[1]?.trim() || "";
}

function normalizeTargetId(value) {
  return targetById.has(value) ? value : "explore";
}

function normalizeStyleId(value) {
  return styleById.has(value) ? value : "steady";
}

function normalizeBreakMoveId(value) {
  return breakMoveById.has(value) ? value : "steady";
}

function normalizeSelectedKeys(value = []) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim().toUpperCase()).filter(Boolean)
    : String(value || "").toUpperCase().split("").filter(Boolean);
}

function cloneRun(run = {}) {
  return {
    ...structuredCloneSafe(run),
    answers: { ...(run.answers || {}) },
    questions: normalizeQuestionArray(run.questions || []),
    questionIds: [...(run.questionIds || (run.questions || []).map((question) => question.id))],
  };
}

function isRunComplete(run = {}) {
  return Boolean(run.completed) || (run.questions || []).every((question) => run.answers?.[question.id]?.submitted);
}

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function structuredCloneSafe(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function btoaUnicode(value) {
  if (typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(value)));
  }
  return Buffer.from(value, "utf8").toString("base64");
}

function atobUnicode(value) {
  if (typeof atob === "function") {
    return decodeURIComponent(escape(atob(value)));
  }
  return Buffer.from(value, "base64").toString("utf8");
}
