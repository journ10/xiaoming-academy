import {
  applyTrialAnswer,
  buildChapterMechanicState,
  buildObservationHint,
  claimDailyQuestReward,
  createDailyQuestState,
  createLearningDashboard,
  createMindDemonRun,
  createRogueliteRun,
  createRogueliteRunReport,
  createRunRecommendation,
  createRouteRun,
  createRunReport,
  createStoryChapters,
  getHeartMethod,
  getHeartPowerUpgradeState,
  initialPlayerState,
  materialTypes,
  nodeTypes,
  createSaveArchive,
  parseQuestionImport,
  parseSaveArchive,
  restFromFatigue,
  rogueliteBuildDefinitions,
  rogueliteRunModes,
  studyNode,
  upgradeHeartPower,
} from "./core.js?v=study-journal-20260623q";

const storageKey = "xiaoming-academy-text-game-v1";
const questionBankVersion = "study-journal-20260623q";
const questionBankRequestTimeoutMs = 18000;
const compressedQuestionIndexUrls = [
  versionedDataUrl("./data/question-index.json.gz"),
  versionedDataUrl("/xiaoming-academy/data/question-index.json.gz"),
];
const questionIndexUrls = [
  versionedDataUrl("./data/question-index.json"),
  versionedDataUrl("/xiaoming-academy/data/question-index.json"),
];
const compressedQuestionBankUrls = [
  versionedDataUrl("./data/questions.runtime.json.gz"),
  versionedDataUrl("/xiaoming-academy/data/questions.runtime.json.gz"),
];
let compressedQuestionBankSupport;
const questionBankUrls = [
  versionedDataUrl("./data/questions.runtime.json"),
  versionedDataUrl("/xiaoming-academy/data/questions.runtime.json"),
];
const fullQuestionBankFallbackUrls = [
  versionedDataUrl("./data/questions.from-pdf.json"),
  versionedDataUrl("/xiaoming-academy/data/questions.from-pdf.json"),
];
const classificationAuditUrls = [
  versionedDataUrl("./data/question-classification.audit.json"),
  versionedDataUrl("/xiaoming-academy/data/question-classification.audit.json"),
];
const playableScenes = new Set(["world", "mode", "build", "training", "battle", "review", "daily", "dashboard", "report"]);
const runModeLabels = {
  explore: "探索新题",
  purify: "净化心魔",
  sprint: "综合冲刺",
};
const runBuildLabels = {
  steady: "稳修",
  assault: "突击",
  review: "复盘",
};
const breakMoveDefinitions = [
  {
    id: "steady",
    name: "稳破",
    detail: "正常收益，低风险；适合按标准流程审题。",
  },
  {
    id: "assault",
    name: "强攻",
    detail: "答对收获更高，答错心力压力更重。",
  },
  {
    id: "observe",
    name: "观照",
    detail: "先看答案与题眼，本题按低收益记录。",
  },
];

const dom = {
  shell: document.querySelector("[data-shell]"),
  stage: document.querySelector("[data-stage]"),
  questPanel: document.querySelector("[data-quest-panel]"),
  hudStats: document.querySelector("[data-hud-stats]"),
  importAction: document.querySelector("[data-import-action]"),
  exportAction: document.querySelector("[data-export-action]"),
  resetAction: document.querySelector("[data-reset-action]"),
  toast: document.querySelector("[data-toast]"),
};

let questions = [];
let chapters = [];
let player = initialPlayerState();
let selectedChapterId = "";
let scene = resolveInitialScene() || "world";
let run = createRouteRun([]);
let selectedRunModeId = "explore";
let selectedBuildId = "steady";
let currentNodeIndex = 0;
let observationHintUsed = false;
let selectedBreakMoveId = "steady";
let selectedKeys = [];
let questionChunkById = new Map();
let loadedQuestionChunkIds = new Set();
let hydratedQuestionById = new Map();
let pendingRunHydrationKey = "";
let submittedResult = null;
let report = null;
let battleQuestionStartedAt = Date.now();
let questionBankLoadState = "loading";
let questionBankLoadError = "";
let logLine = "秘卷正在展开。";

dom.importAction.addEventListener("click", showImportPanel);
dom.exportAction.addEventListener("click", showExportPanel);
dom.resetAction.addEventListener("click", resetProgress);

document.addEventListener("keydown", (event) => {
  const optionIndex = Number(event.key) - 1;
  const question = getCurrentQuestion();
  if (scene !== "battle" || submittedResult || !question || optionIndex < 0) return;
  const option = question.options[optionIndex];
  if (option) toggleOption(option.key);
});

initializeGame();

async function initializeGame() {
  questionBankLoadState = "loading";
  questionBankLoadError = "";
  questionChunkById = new Map();
  loadedQuestionChunkIds = new Set();
  hydratedQuestionById = new Map();
  pendingRunHydrationKey = "";
  logLine = "题库正在展开，请稍候。";
  render();
  try {
    const builtInBank = await loadBuiltInQuestionBank();
    questions = builtInBank.questions;
    configureQuestionChunks(builtInBank.chunks);
    chapters = createStoryChapters(questions);
    const saved = loadSavedState();
    player = saved.player;
    selectedChapterId = saved.selectedChapterId || chapters[0]?.id || "";
    scene = resolveInitialScene() || saved.scene || "world";
    run = createRogueliteRun(questions, player, { modeId: selectedRunModeId, buildId: selectedBuildId, length: 5 });
    questionBankLoadState = "ready";
    questionBankLoadError = "";
    logLine = "选择今日小目标，开始一页题眼手账。";
    render();
  } catch (error) {
    questions = [];
    chapters = [];
    player = initialPlayerState();
    selectedChapterId = "";
    scene = "world";
    run = createRouteRun([]);
    questionBankLoadState = "error";
    questionBankLoadError = error.message || "题库暂时无法展开。";
    logLine = questionBankLoadError;
    render();
    showToast(logLine);
  }
}

async function loadBuiltInQuestionBank() {
  try {
    return await loadQuestionIndex();
  } catch {
    try {
      return await loadRuntimeQuestionBank();
    } catch (runtimeError) {
      return loadFullQuestionBankFallback(runtimeError);
    }
  }
}

async function loadQuestionIndex() {
  let lastError = null;
  const runtimeBankUrls = supportsCompressedQuestionBank()
    ? [...compressedQuestionIndexUrls, ...questionIndexUrls]
    : questionIndexUrls;
  for (const url of runtimeBankUrls) {
    try {
      const payload = await fetchQuestionBankPayload(url);
      const parsedQuestions = parseQuestionImport(payload);
      if (!parsedQuestions.length) {
        throw new Error("卷宗索引里还没有可练内容");
      }
      return {
        questions: parsedQuestions,
        chunks: payload.chunks || [],
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "卷宗索引暂时无法展开，请稍后再试。");
}

async function loadRuntimeQuestionBank() {
  let lastError = null;
  const runtimeBankUrls = supportsCompressedQuestionBank()
    ? [...compressedQuestionBankUrls, ...questionBankUrls]
    : questionBankUrls;
  for (const url of runtimeBankUrls) {
    try {
      const payload = await fetchQuestionBankPayload(url);
      const parsedQuestions = parseQuestionImport(payload);
      if (!parsedQuestions.length) {
        throw new Error("卷宗里还没有可练内容");
      }
      return {
        questions: parsedQuestions,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "秘卷暂时无法展开，请稍后再试。");
}

async function fetchQuestionBankPayload(url) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error("卷宗入口暂时没有回应。");
  }
  if (!isCompressedQuestionBankUrl(url)) {
    return response.json();
  }
  if (!response.body) {
    throw new Error("卷宗数据流暂时无法读取。");
  }
  try {
    const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).json();
  } catch {
    throw new Error("卷宗压缩包暂时无法展开。");
  }
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), questionBankRequestTimeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("卷宗入口连接超时。");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function supportsCompressedQuestionBank() {
  if (compressedQuestionBankSupport !== undefined) {
    return compressedQuestionBankSupport;
  }
  if (
    typeof DecompressionStream !== "function" ||
    typeof ReadableStream !== "function" ||
    typeof Response !== "function"
  ) {
    compressedQuestionBankSupport = false;
    return compressedQuestionBankSupport;
  }
  try {
    compressedQuestionBankSupport = Boolean(new DecompressionStream("gzip"));
  } catch {
    compressedQuestionBankSupport = false;
  }
  return compressedQuestionBankSupport;
}

function isCompressedQuestionBankUrl(url) {
  return String(url).split("?")[0].endsWith(".gz");
}

function configureQuestionChunks(chunks = []) {
  questionChunkById = new Map((chunks || []).map((chunk) => [chunk.id, chunk]));
  loadedQuestionChunkIds = new Set();
  hydratedQuestionById = new Map();
  pendingRunHydrationKey = "";
  if (!questionChunkById.size) {
    questions.forEach((question) => hydratedQuestionById.set(question.id, question));
  }
}

async function ensureQuestionsHydrated(questionIds = []) {
  const missingChunkIds = unique(questionIds)
    .filter((questionId) => !hydratedQuestionById.has(questionId))
    .map((questionId) => questions.find((question) => question.id === questionId)?.chunkId || "")
    .filter(Boolean);

  await Promise.all(unique(missingChunkIds).map((chunkId) => loadQuestionChunk(chunkId)));

  const stillMissing = unique(questionIds).filter((questionId) =>
    !hydratedQuestionById.has(questionId) && questions.some((question) => question.id === questionId && question.chunkId),
  );
  if (stillMissing.length) {
    throw new Error("本页题阵暂时没有展开完整题目。");
  }
}

async function loadQuestionChunk(chunkId) {
  if (loadedQuestionChunkIds.has(chunkId)) return;
  const chunk = questionChunkById.get(chunkId);
  if (!chunk) {
    throw new Error("题阵分片暂时没有回应。");
  }

  let lastError = null;
  for (const url of getQuestionChunkUrls(chunk)) {
    try {
      const payload = await fetchQuestionBankPayload(url);
      const hydratedQuestions = parseQuestionImport(payload);
      mergeHydratedQuestions(hydratedQuestions);
      loadedQuestionChunkIds.add(chunkId);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "题阵分片暂时无法展开。");
}

function getQuestionChunkUrls(chunk) {
  const urls = [];
  const compressedUrl = chunk.compressedUrl || `${chunk.url}.gz`;
  if (supportsCompressedQuestionBank()) {
    urls.push(versionedDataUrl(`./${compressedUrl}`), versionedDataUrl(`/xiaoming-academy/${compressedUrl}`));
  }
  urls.push(versionedDataUrl(`./${chunk.url}`), versionedDataUrl(`/xiaoming-academy/${chunk.url}`));
  return urls;
}

function mergeHydratedQuestions(hydratedQuestions = []) {
  const hydratedById = new Map(hydratedQuestions.map((question) => [question.id, question]));
  hydratedQuestions.forEach((question) => hydratedQuestionById.set(question.id, question));
  questions = questions.map((question) => hydratedById.get(question.id) || question);
}

async function loadFullQuestionBankFallback(runtimeError) {
  const classificationAudit = await loadClassificationAudit();
  let lastError = runtimeError;
  for (const url of fullQuestionBankFallbackUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("卷宗入口暂时没有回应。");
      }
      const payload = await response.json();
      const parsedQuestions = parseQuestionImport(payload, { classificationAudit });
      if (!parsedQuestions.length) {
        throw new Error("卷宗里还没有可练内容");
      }
      return {
        questions: parsedQuestions,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "秘卷暂时无法展开，请稍后再试。");
}

async function loadClassificationAudit() {
  let lastError = null;
  for (const url of classificationAuditUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("题目校准文件暂时没有回应。");
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "题目校准文件缺失，无法保证题目归类正确。");
}

function versionedDataUrl(url) {
  return `${url}?v=${questionBankVersion}`;
}

function render() {
  chapters = createStoryChapters(questions);
  if (!chapters.some((chapter) => chapter.id === selectedChapterId)) {
    selectedChapterId = chapters[0]?.id || "";
  }

  dom.shell.dataset.scene = scene;

  renderHud();
  renderStage();
  renderQuestPanel();
}

function renderHud() {
  if (!isQuestionBankReady()) {
    dom.hudStats.replaceChildren(
      hudStat("题库", questionBankLoadState === "loading" ? "展开中" : "需重试"),
      hudStat("本局", "未开局"),
      hudStat("目标", "待加载"),
      hudStat("题眼", questionBankLoadState === "loading" ? "准备中" : "未展开"),
    );
    return;
  }

  dom.hudStats.replaceChildren(
    hudStat("心力", `${player.heartPower || 0}/${player.maxHeartPower || 6}`),
    hudStat("本局", formatHudRunProgress()),
    hudStat("目标", run.objective?.label || run.modeName || runModeLabels[selectedRunModeId] || "开局"),
    hudStat("题眼", formatHudLessonState()),
  );
}

function formatHudRunProgress() {
  return formatRunAnsweredProgress(run);
}

function formatRunAnsweredProgress(currentRun = run) {
  if (!currentRun.nodes?.length) return "未开局";
  const total = currentRun.nodes.length;
  return `${Math.min(total, currentRun.answeredCount || 0)}/${total}`;
}

function formatHudLessonState() {
  const question = getCurrentQuestion();
  if (!question) return "待开局";
  if (submittedResult) return formatBattleSettleState();
  if ((player.studiedLessonIds || []).includes(question.lesson?.id)) return "已短课";
  if (observationHintUsed) return "已看答案";
  if (scene === "battle") return "可看答案";
  if (scene === "training") return "短课中";
  return "待进入";
}

function formatBattleSettleState() {
  if (!submittedResult) return "待进入";
  if (submittedResult.countsAsLit) return "已点亮";
  if (submittedResult.isCorrect) return "已观照";
  return "已结算";
}

function renderStage() {
  if (questionBankLoadState === "loading") return renderQuestionBankLoadingStage();
  if (!isQuestionBankReady()) return renderQuestionBankErrorStage();
  if (scene === "mode") return renderModeSelectStage();
  if (scene === "build") return renderBuildSelectStage();
  if (scene === "training") return renderTrainingStage();
  if (scene === "battle") return renderBattleStage();
  if (scene === "review") return renderReviewStage();
  if (scene === "daily") return renderDailyStage();
  if (scene === "dashboard") return renderDashboardStage();
  if (scene === "report") return renderReport();
  return renderWorldStage();
}

function renderQuestionBankLoadingStage() {
  dom.stage.replaceChildren(textScreen({
    kicker: "开局台",
    title: "题库正在展开",
    intro: "正在载入题阵与题眼短课，请稍候。",
    body: [
      panel("加载中", [
        el("p", "", {}, ["如果网络较慢，书院会自动尝试备用入口。"]),
        el("p", "text-muted", {}, ["无需重复点击，加载完成后会进入开局台。"]),
      ]),
    ],
    choices: [],
    log: logLine,
  }));
}

function renderQuestionBankErrorStage() {
  dom.stage.replaceChildren(textScreen({
    kicker: "开局台",
    title: "题库暂时没有展开",
    intro: "当前网络没有成功载入题阵，请重试。若 GitHub Pages 在当前网络不稳定，可以稍后刷新页面。",
    body: [
      panel("加载失败", [
        el("p", "", {}, [questionBankLoadError || "题库入口暂时没有回应。"]),
        el("p", "text-muted", {}, ["重试会重新请求压缩题库和备用题库入口。"]),
      ]),
    ],
    choices: [["重新加载题库", retryQuestionBankLoad, "text-choice is-primary"]],
    log: logLine,
  }));
}

function renderWorldStage() {
  return renderModernWorldStage();
}

function renderModernWorldStage() {
  return renderStartDesk();
}

function renderStartDesk() {
  const recommendation = createRunRecommendation(questions, player);
  const mode = getRunModeDefinition(recommendation.modeId);
  const build = getRunBuildDefinition(recommendation.buildId);
  const dashboard = createLearningDashboard(questions, player);
  const brief = runEventBrief(recommendation);
  const collectionText = formatJournalCollection(player.journalCollection);

  dom.stage.replaceChildren(el("article", "text-screen start-desk", {}, [
    el("header", "start-hero", {}, [
      el("span", "text-kicker", {}, ["今日小目标"]),
      el("h2", "", {}, [recommendation.targetText]),
      el("p", "stage-sub", {}, [recommendation.reason]),
    ]),
    el("section", "journal-flow", {}, [
      journalSticker("今日小目标"),
      journalSticker("开一页题眼手账"),
      journalSticker("5 道题"),
      journalSticker("题眼贴纸"),
      journalSticker("书签收藏"),
      journalSticker("今日手账页"),
    ]),
    el("section", "start-focus", {}, [
      el("div", "objective-panel primary-objective", {}, [
        el("span", "text-kicker", {}, ["今日手账页"]),
        el("h3", "", {}, [mode.name]),
        el("p", "", {}, [brief]),
      ]),
      el("div", "objective-panel", {}, [
        el("span", "text-kicker", {}, ["本页奖励"]),
        el("h3", "", {}, [build.name]),
        el("p", "", {}, [recommendation.rewardText || build.summary]),
        el("p", "text-muted", {}, [`手账收藏：${collectionText}`]),
      ]),
    ]),
    el("footer", "start-actions", {}, [
      textButton(recommendation.primaryAction || "开一页题眼手账", () => startRecommendedRun(recommendation), "primary-action"),
      textButton("换目标", () => goScene("mode"), "text-choice"),
      textButton("今日清单", () => goScene("daily"), "text-choice"),
      textButton("学习报告", () => goScene("dashboard"), "text-choice"),
      textButton("心魔回廊", () => goScene("review"), "text-choice"),
    ]),
    el("p", "text-muted", {}, [formatStartDeskSuggestion(dashboard)]),
  ]));
}

function formatStartDeskSuggestion(dashboard) {
  const topic = dashboard.weakestTopic;
  if (!topic) return "下一页建议：先完成一页题眼手账，再根据错因决定是否整理。";
  if (Number(topic.demonCount || 0) > 0) {
    return `下一页建议：整理 ${topic.title} 心魔 ${topic.demonCount}，心法 ${topic.mastery}。`;
  }
  return `下一页建议：补强 ${topic.title} 题眼，心法 ${topic.mastery}。`;
}

function journalSticker(label) {
  return el("span", "journal-sticker", {}, [label]);
}

function renderModeSelectStage() {
  const recommendation = createRunRecommendation(questions, player);
  dom.stage.replaceChildren(textScreen({
    kicker: "选择目标",
    title: "这一局要解决什么？",
    intro: "目标只影响本页题池和结算建议。默认推荐已经替你选好，也可以手动改。",
    body: [
      el("div", "mode-grid", {}, rogueliteRunModes.map((mode) =>
        el("article", `mode-card ${mode.id === recommendation.modeId ? "is-recommended" : ""}`, {}, [
          el("span", "text-kicker", {}, [mode.id === recommendation.modeId ? "推荐" : "可选"]),
          el("h3", "", {}, [runModeLabels[mode.id] || mode.title]),
          el("p", "", {}, [mode.summary]),
          textButton(`选择${runModeLabels[mode.id] || mode.title}`, () => selectRunMode(mode.id), mode.id === recommendation.modeId ? "text-choice is-primary" : "text-choice"),
        ]),
      )),
    ],
    choices: [["返回开局台", () => goScene("world")]],
    log: `当前推荐：${getRunModeDefinition(recommendation.modeId).name}。`,
  }));
}

function renderBuildSelectStage() {
  const mode = getRunModeDefinition(selectedRunModeId);
  dom.stage.replaceChildren(textScreen({
    kicker: "选择流派",
    title: `${mode.name} · 选择本页流派`,
    intro: "流派影响本页节奏与收获；题内保留低收益看答案，适合卡住时确认解析。",
    body: [
      el("div", "build-grid", {}, rogueliteBuildDefinitions.map((build) =>
        el("article", `build-card ${build.id === selectedBuildId ? "is-selected" : ""}`, {}, [
          el("span", "text-kicker", {}, [`节奏 ${build.risk} · 收获 ${build.reward}`]),
          el("h3", "", {}, [runBuildLabels[build.id] || build.name]),
          el("p", "", {}, [build.summary]),
          textButton(`用${runBuildLabels[build.id] || build.name}开局`, () => selectRunBuild(build.id), build.id === selectedBuildId ? "text-choice is-primary" : "text-choice"),
        ]),
      )),
    ],
    choices: [
      ["返回目标", () => goScene("mode")],
      ["返回开局台", () => goScene("world")],
    ],
    log: `${mode.name}会决定本页题池，流派决定收获节奏。`,
  }));
}

function runEventBrief(recommendation) {
  if (recommendation.modeId === "purify") {
    return "阿芷：这页别急着开新题，先把已经暴露的错因整理成书签。";
  }
  if (recommendation.modeId === "sprint") {
    return "青岚：这页会跨域切换，别靠惯性答题，每题先看机制。";
  }
  return "明澈：先开一页题眼手账，题阵会告诉你今天最该补哪里。";
}

function getRunModeDefinition(modeId) {
  return rogueliteRunModes.find((mode) => mode.id === modeId) || rogueliteRunModes[0];
}

function getRunBuildDefinition(buildId) {
  return rogueliteBuildDefinitions.find((build) => build.id === buildId) || rogueliteBuildDefinitions[0];
}

function renderTrainingStage() {
  ensureRun();
  if (!ensureCurrentRunHydrated()) return renderCurrentRunHydrationStage("题眼短课");
  const node = getCurrentNode();
  const question = getCurrentQuestion();
  if (!node || !question) {
    dom.stage.replaceChildren(emptyScreen("暂时没有题眼短课", "先开一页题眼手账，题阵会给出当前要补的题眼。"));
    return;
  }

  const studied = (player.studiedLessonIds || []).includes(question.lesson.id);
  const trainingLog = studied && logLine.startsWith("短课完成")
    ? logLine
    : studied ? "这道题已经练过，可以直接进题阵。" : logLine;
  dom.stage.replaceChildren(textScreen({
    kicker: "题眼短课",
    title: question.lesson.title,
    intro: formatStudyPrompt(question.lesson.studyPrompt),
    body: [
      panel("题眼", [
        el("p", "", {}, [question.lesson.keyPoint]),
        el("p", "text-muted", {}, [question.lesson.explanation]),
      ]),
      panel("当前遭遇", [
        el("p", "", {}, [`${nodeTypes[node.type]?.name || node.typeName}：${node.nodeFlavor}`]),
        el("p", "", {}, [`题阵机制：${node.mechanicName || "常规题阵"} · ${node.mechanicPrompt || "按题眼稳定检验。"}`]),
        el("p", "text-muted", {}, [node.rewardPreview || "完成后获得成长资源。"]),
      ]),
      panel("本局流派", renderRunBuildSummary()),
    ],
    choices: [
      [studied ? "复看完成" : "完成短课", studyCurrentNode, "text-choice is-primary"],
      ["进入题阵", enterBattleAfterTraining],
      ["回开局台", () => goScene("world")],
    ],
    log: trainingLog,
  }));
}

function renderBattleStage() {
  ensureRun();
  if (!ensureCurrentRunHydrated()) return renderCurrentRunHydrationStage("题阵");
  const node = getCurrentNode();
  const question = getCurrentQuestion();
  if (!node || !question) {
    dom.stage.replaceChildren(emptyScreen("暂时没有题阵", "先回开局台选择一局，或稍后再回来。"));
    return;
  }
  const mechanicState = buildChapterMechanicState(question, player, {
    node,
    nodeType: node.type,
    reveal: observationHintUsed,
  });

  const options = question.options.map((option) => {
    const button = textButton(optionButtonLabel(question, option), () => toggleOption(option.key), getOptionClass(question, option.key));
    button.dataset.optionKey = option.key;
    return button;
  });

  dom.stage.replaceChildren(renderBattleDesk({ node, question, mechanicState, options }));
}

function renderBattleDesk({ node, question, mechanicState, options }) {
  return el("article", "battle-desk", {}, [
    renderBattleStatusBar({ node, question, mechanicState }),
    el("section", "battle-main", {}, [
      renderBattleQuestionCard({ question, mechanicState, options }),
      renderBattleSupportPanel({ node, question, mechanicState }),
    ]),
    renderBattleActionBar(question),
  ]);
}

function renderBattleStatusBar({ node, question, mechanicState }) {
  const progressText = node?.encounterIndex
    ? `${node.encounterIndex}/${node.encounterTotal || run.nodes.length}`
    : `${Math.min(run.answeredCount + 1, run.nodes.length)}/${run.nodes.length}`;
  const hintState = submittedResult
    ? { label: formatBattleSettleState(), modifier: "is-muted" }
    : { label: observationHintUsed ? "已看答案" : "可看答案", modifier: observationHintUsed ? "is-muted" : "is-ready" };
  return el("header", "battle-status-bar", {}, [
    battleStatusChip("本页", run.modeName || "题阵"),
    battleStatusChip("进度", progressText),
    battleStatusChip("题型", nodeTypes[node.type]?.name || node.typeName || "题阵"),
    battleStatusChip("题眼", question.lesson?.title || question.topic || "当前题"),
    battleStatusChip("机制", mechanicState.name || node.mechanicName || "常规题阵"),
    battleStatusChip("提示", hintState.label, hintState.modifier),
  ]);
}

function battleStatusChip(label, value, modifier = "") {
  return el("div", `battle-status-chip ${modifier}`.trim(), {}, [
    el("span", "", {}, [label]),
    el("strong", "", {}, [String(value || "未定")]),
  ]);
}

function renderBattleQuestionCard({ question, mechanicState, options }) {
  return el("section", "battle-question-card", {}, [
    el("div", "battle-question-head", {}, [
      el("span", "text-kicker", {}, [question.topic || "题阵"]),
      el("h2", "", {}, [question.enemy || question.lesson?.title || "当前题"]),
      el("p", "text-muted", {}, [`${mechanicState.name || "常规题阵"} · ${answerPanelTitle(question)}`]),
    ]),
    el("p", "battle-stem", {}, [question.stem]),
    el("div", "battle-options", {}, [
      el("div", "battle-section-title", {}, [
        el("span", "", {}, [answerPanelTitle(question)]),
        el("span", "", {}, [question.answer.length > 1 ? "可多选" : "单选"]),
      ]),
      ...options,
    ]),
  ]);
}

function renderBattleSupportPanel({ node, question, mechanicState }) {
  return el("aside", "battle-support-panel", {}, [
    submittedResult ? renderBattleFeedback(question) : renderBattleHint(question),
    renderRunObjectivePanel(node),
    renderChapterMechanicState(mechanicState),
  ]);
}

function renderBattleActionBar(question) {
  const choices = submittedResult ? getBattleResultChoices() : getBattleActionChoices(question);
  const selectionText = selectedKeys.length ? `已选 ${selectedKeys.join("、")}` : "未选择答案";
  const hintText = submittedResult
    ? "本题已结算，可以进入下一步。"
    : selectedBreakMoveId === "observe" ? "已选择观照，本题按低收益记录。" : `当前破招：${getBreakMoveDefinition(selectedBreakMoveId).name}。`;
  return el("footer", "battle-action-bar", {}, [
    el("div", "battle-action-meta", {}, [
      el("div", "battle-selection-state", {}, [
        el("span", "text-kicker", {}, ["答题状态"]),
        el("strong", "", {}, [selectionText]),
        el("small", "", {}, [hintText]),
      ]),
      submittedResult ? "" : renderBreakMoveChoices(),
    ]),
    el("div", "battle-action-buttons", {}, choices.map(([label, onClick, className = "text-choice", detail = ""]) =>
      textButton(label, onClick, battleActionClassName(className), detail),
    )),
  ]);
}

function renderBreakMoveChoices() {
  return el("div", "break-move-picker", {}, [
    el("span", "text-kicker", {}, ["破招式"]),
    el("div", "break-move-list", {}, breakMoveDefinitions.map((move) =>
      textButton(
        move.name,
        () => selectBreakMove(move.id),
        `text-choice break-move ${selectedBreakMoveId === move.id ? "is-selected" : ""}`,
        move.detail,
      ),
    )),
  ]);
}

function selectBreakMove(moveId) {
  if (submittedResult) return;
  const move = getBreakMoveDefinition(moveId);
  if (observationHintUsed && move.id !== "observe") {
    showToast("本题已观照，作答将按低收益记录。");
    return;
  }
  selectedBreakMoveId = move.id;
  if (selectedBreakMoveId === "observe") observationHintUsed = true;
  render();
}

function getBreakMoveDefinition(moveId) {
  return breakMoveDefinitions.find((move) => move.id === moveId) || breakMoveDefinitions[0];
}

function battleActionClassName(className = "") {
  const classes = ["battle-action"];
  if (className.includes("is-primary")) classes.push("is-primary");
  if (className.includes("is-disabled")) classes.push("is-disabled");
  return classes.join(" ");
}

function renderRunObjectivePanel(node) {
  const objective = run.objective || {};
  const progressText = node?.encounterIndex
    ? `${node.encounterIndex}/${node.encounterTotal || run.nodes.length}`
    : `${Math.min(run.answeredCount + 1, run.nodes.length)}/${run.nodes.length}`;
  return panel("今日小目标", [
    el("p", "", {}, [`${objective.label || "完成题阵"} · 遭遇 ${progressText}`]),
    el("p", "text-muted", {}, [objective.prompt || run.brief || "完成本页后会给出下一页建议。"]),
  ]);
}

function answerPanelTitle(question) {
  return isAnswerRecallQuestion(question) ? "参考答案" : "选项";
}

function optionButtonLabel(question, option) {
  if (isAnswerRecallQuestion(question)) {
    return option.key;
  }
  return `${option.key}. ${option.text}`;
}

function isAnswerRecallQuestion(question) {
  return /参考答案是[？?]$/.test(String(question?.stem || ""))
    && Array.isArray(question?.options)
    && question.options.length > 0
    && question.options.every((option) => String(option?.text || "").trim() === String(option?.key || "").trim());
}

function renderBattleHint(question) {
  if (observationHintUsed) {
    const hint = buildObservationHint(question);
    return panel("低收益看答案", [
      el("p", "", {}, [hint.stemCue]),
      el("p", "", {}, [`对应答案：${hint.answerLine}`]),
      el("p", "text-muted", {}, [`依据：${hint.explanation}`]),
      hint.keyPoint ? el("p", "text-muted", {}, [`题眼：${hint.keyPoint}`]) : "",
      el("p", "text-muted", {}, ["本题已看答案，作答后按低收益答题记录。"]),
    ]);
  }
  return panel("提示", [
    el("p", "", {}, ["不确定时可以低收益看答案，再选择答案。"]),
    el("p", "text-muted", {}, ["选择答案后，用底部按钮提交。"]),
    textButton("低收益看答案", revealObservationHint, "text-choice", "直接查看答案、解析摘录与题眼；本题收益降低。"),
  ]);
}

function getBattleActionChoices(question) {
  const canSubmit = selectedKeys.length > 0;
  return [
    [
      canSubmit ? "释放破招" : "先选择答案",
      canSubmit ? handleBattleAction : noop,
      canSubmit ? "text-choice is-primary" : "text-choice is-primary is-disabled",
      canSubmit ? "" : "从上方选项中选择后再提交。",
    ],
    ["看题眼短课", startTraining],
    ["回开局台", () => goScene("world")],
  ];
}

function revealObservationHint() {
  if (submittedResult) return;
  observationHintUsed = true;
  selectedBreakMoveId = "observe";
  render();
}

function getBattleStanceId() {
  return selectedBreakMoveId;
}

function noop() {}

function renderChapterMechanicState(mechanicState) {
  const lines = [
    el("p", "", {}, [`${mechanicState.name}：${mechanicState.prompt}`]),
  ];
  if (mechanicState.borrowedMechanic) {
    lines.push(el("p", "text-muted", {}, [`万象混沌借用：${mechanicState.borrowedMechanicName || "题眼机制"}`]));
  }
  if (mechanicState.timeLimitSeconds) {
    lines.push(el("p", "text-muted", {}, [`⏳ 本题建议限时 ${mechanicState.timeLimitSeconds} 秒${mechanicState.recoverAddsSeconds ? `；息阵时间 +${mechanicState.recoverAddsSeconds} 秒` : ""}`]));
  }
  if (mechanicState.optionWarnings?.length) {
    lines.push(el("div", "text-log", {}, mechanicState.optionWarnings.map((warning) =>
      el("p", "", {}, [`${warning.key} · ${warning.level}：${warning.text}`]),
    )));
  }
  if (mechanicState.warning) {
    lines.push(el("p", "text-muted", {}, [`道德天平：${mechanicState.warning}`]));
  }
  if (mechanicState.strategySteps?.length) {
    lines.push(el("p", "text-muted", {}, [`策略链：${mechanicState.strategySteps.map((step) => step.name).join(" → ")}`]));
  }
  if (mechanicState.exactAnswerRequired) {
    lines.push(el("p", "text-muted", {}, [`精确记忆：仅 ${mechanicState.attemptsAllowed} 次机会。${mechanicState.memoryHint || ""}`]));
  }
  return panel("题阵机制", lines);
}

function renderReviewStage() {
  const demons = Object.values(player.mindDemons || {});
  dom.stage.replaceChildren(textScreen({
    kicker: "心魔",
    title: demons.length ? "错题回廊" : "心魔未现",
    intro: demons.length ? "这些错题会保留压迫值，重新答对可以净化。" : "当前没有错题心魔。先去题阵检验，答错后这里会出现复训目标。",
    body: [
      panel("心魔列表", demons.length
        ? el("div", "text-choice-list", {}, demons.map((demon) =>
            el("article", "text-panel", {}, [
              el("h3", "", {}, [demon.enemy]),
              el("p", "", {}, [`主题：${demon.topic || "待定主题"} · 压力：${demon.pressure || 0} · 错因：${demon.demonType || "待诊断"}`]),
              el("p", "text-muted", {}, [`概念：${demon.concept || "待梳理概念"}`]),
              el("p", "text-muted", {}, [`诊断：${demon.diagnosis || "复看题眼，确认错误来源。"}`]),
              el("p", "text-muted", {}, [`净化建议：${demon.remedy || "先看题眼短课，再净化。"}`]),
            ]),
          ))
        : "没有待处理错题。"),
    ],
    choices: [
      ["开始净化", () => startRogueliteRun("purify", "review"), "text-choice is-primary"],
      ["去题阵检验", startBattle],
      ["回开局台", () => goScene("world")],
    ],
    log: logLine,
  }));
}

function renderDailyStage() {
  const questState = createDailyQuestState(questions, player, { now: new Date() });
  const challenges = questState.daily;
  const weekly = questState.weekly;
  const fatigue = questState.fatigue;
  dom.stage.replaceChildren(textScreen({
    kicker: "日课",
    title: "今日清单",
    intro: "日课和周课会提示你现在最该补哪一块。",
    body: [
      panel("日课", el("div", "text-choice-list", {}, challenges.map((challenge) =>
        renderQuestRewardCard(challenge),
      ))),
      panel("周课", el("div", "text-choice-list", {}, weekly.map((quest) =>
        renderQuestRewardCard(quest),
      ))),
      panel("休息提醒", [
        statLine("连续手账页", fatigue.consecutiveRouteRuns),
        statLine("收益倍率", `${Math.round(fatigue.rewardMultiplier * 100)}%`),
        el("p", "text-muted", {}, [fatigue.warning]),
        textButton(
          "休息一下",
          fatigue.consecutiveRouteRuns > 0 ? restFatigueAction : noop,
          fatigue.consecutiveRouteRuns > 0 ? "text-choice is-primary" : "text-choice is-disabled",
          fatigue.consecutiveRouteRuns > 0 ? "暂停连做节奏，恢复正常收益。" : "当前节奏正常。",
        ),
      ]),
    ],
    choices: [
      ["按日课短课", startTraining, "text-choice is-primary"],
      ["按日课题阵", startBattle],
      ["回开局台", () => goScene("world")],
    ],
    log: logLine,
  }));
}

function renderQuestRewardCard(quest) {
  const canClaim = quest.completed && !quest.claimed;
  return el("article", "text-panel quest-reward-card", {}, [
    el("h3", "", {}, [quest.title]),
    el("p", "", {}, [quest.description]),
    meter(`${quest.progress.current}/${quest.progress.target}`, quest.progress.current, quest.progress.target),
    el("p", "text-muted", {}, [formatQuestReward(quest.rewards)]),
    textButton(
      quest.claimed ? "已领取" : canClaim ? "领取奖励" : "未完成",
      canClaim ? () => claimQuestReward(quest.id) : noop,
      canClaim ? "text-choice is-primary" : "text-choice is-disabled",
    ),
  ]);
}

function renderDashboardStage() {
  const dashboard = createLearningDashboard(questions, player);
  const weakest = dashboard.weakestTopic;
  const topicCoverageBars = dashboard.topicCoverageBars;
  const averageTimeTrend = dashboard.averageTimeTrend;
  const heartUpgrade = getHeartPowerUpgradeState(player);
  dom.stage.replaceChildren(textScreen({
    kicker: "仪表",
    title: "学习仪表盘",
    intro: weakest
      ? `当前优先补：${weakest.title}。心魔 ${weakest.demonCount}，心法 ${weakest.mastery}。`
      : "还没有明显薄弱主题，继续按推荐开局。",
    body: [
      panel("总体进度", [
        statLine("题眼短课", `${dashboard.questionProgress.studiedCount}/${dashboard.questionProgress.total} · ${dashboard.questionProgress.studiedPercent}%`),
        statLine("答对覆盖", `${dashboard.questionProgress.correctCount}/${dashboard.questionProgress.total} · ${dashboard.questionProgress.correctPercent}%`),
        statLine("已触达学习域", `${dashboard.topicTouchStats.touchedCount}/${dashboard.topicTouchStats.totalCount} · ${dashboard.topicTouchStats.percent}%`),
        statLine("心魔", `活跃 ${dashboard.demonStats.activeCount} · 已净化 ${dashboard.demonStats.purifiedCount} · 压力 ${dashboard.demonStats.totalPressure}`),
      ]),
      panel("心力修炼", [
        statLine("心力", `${player.heartPower || 0}/${player.maxHeartPower || 6}`),
        statLine("书页", normalizeMaterialBag(player.materials).shuye),
        statLine("下次提升", heartUpgrade.maxed ? "已满" : `${heartUpgrade.currentMaxHeartPower} -> ${heartUpgrade.nextMaxHeartPower}`),
        statLine("需要", heartUpgrade.maxed ? "无需材料" : formatCost(heartUpgrade.cost)),
      ]),
      panel("错题画像", dashboard.errorPatternStats.length
        ? el("div", "text-log", {}, dashboard.errorPatternStats.map((item) =>
            el("p", "", {}, [`${item.name} · ${item.demonType}：${item.count}`]),
          ))
        : "当前没有活跃错因。"),
      panel("累计画像", el("div", "text-log", {}, dashboard.errorPortrait.map((item) =>
        el("p", "", {}, [`${item.name} ${item.bar} ${item.percent}% · ${item.wrongAttempts} 次`]),
      ))),
      panel("复测正确率", `${dashboard.retestAccuracy.correct}/${dashboard.retestAccuracy.attempts} · ${dashboard.retestAccuracy.percent}%`),
      panel("主题覆盖", el("div", "text-log", {}, topicCoverageBars.map((item) =>
        el("p", "", {}, [`${item.title}：${item.correctCount}/${item.total} · ${item.bar} ${item.percent}%`]),
      ))),
      panel("平均耗时趋势", [
        statLine("记录", averageTimeTrend.samples),
        statLine("平均秒数", averageTimeTrend.averageSeconds),
        statLine("趋势", averageTimeTrend.label),
      ]),
      panel("流派胜率", el("div", "text-log", {}, dashboard.buildWinRates.map((item) =>
        el("p", "", {}, [`${item.name}：${item.correct}/${item.attempts} · ${item.winRate}%`]),
      ))),
      panel("复习清单", dashboard.reviewItems.length
        ? el("div", "text-log", {}, dashboard.reviewItems.slice(0, 6).map((item) =>
            el("p", "", {}, [`${item.topic}：${item.text} · 压力 ${item.pressure}`]),
          ))
        : "当前没有待复习心魔。"),
    ],
    choices: [
      ["导出复习清单", showReviewChecklist, "text-choice is-primary"],
      [heartUpgrade.maxed ? "心力已满" : "升级心力", upgradeHeartPowerAction, heartUpgrade.canUpgrade ? "text-choice" : "text-choice is-disabled"],
      ["去心魔", () => goScene("review")],
      ["回开局台", () => goScene("world")],
    ],
    log: "所有进度只保存在这台设备的存档里。",
  }));
}

function renderReport() {
  const reportData = report || (run.mode === "roguelite"
    ? createRogueliteRunReport(run, player, questions)
    : createRunReport(run, player));
  const journal = reportData.journalSummary || {
    title: reportData.resultLabel || reportData.title,
    litKeyPoints: reportData.correctCount,
    totalKeyPoints: reportData.answeredCount,
    organizedDemons: reportData.purifiedDemonCount || reportData.purifiedCount || 0,
    pendingDemons: reportData.newDemonCount || reportData.wrongCount || 0,
    bookmark: reportData.buildName || "稳修",
    nextSuggestion: reportData.nextRecommendation?.reason || "继续开一页题眼手账",
  };
  dom.stage.replaceChildren(textScreen({
    kicker: "今日手账页",
    title: journal.title,
    intro: `点亮题眼 ${journal.litKeyPoints}/${journal.totalKeyPoints} · 已整理心魔 ${journal.organizedDemons} · 新增待整理 ${journal.pendingDemons}`,
    body: [
      panel(journal.title, [
        el("div", "journal-summary", {}, [
          statLine("点亮题眼", `${journal.litKeyPoints}/${journal.totalKeyPoints}`),
          statLine("已整理心魔", journal.organizedDemons),
          statLine("新增待整理", journal.pendingDemons),
          statLine("本页书签", journal.bookmark),
          statLine("下一页建议", journal.nextSuggestion),
        ]),
      ]),
      panel("本页奖励", [
        statLine("修为", `+${reportData.growthXpGain}`),
        statLine("材料", formatMaterials(reportData.materialsGain) || "无"),
        statLine("手账收藏", formatJournalCollection(player.journalCollection)),
        statLine("秘卷碎片", player.journalCollection?.fragments || 0),
        statLine("错因记录", reportData.primaryMistake || journal.nextSuggestion),
      ]),
      panel("下一页建议", el("div", "text-choice-list", {}, (reportData.nextActions || []).map((action) =>
        textButton(action.label, () => continueWithNextAction(action), "text-choice", action.reason),
      ))),
      panel("事件", reportData.events.length
        ? el("div", "text-log", {}, reportData.events.map((event) =>
            el("p", "", {}, [`${event.topic}：${formatJournalEventResult(event)}，${event.learningCheck}`]),
          ))
        : "还没有题阵记录。"),
    ],
    choices: [
      ["再开一页", startRecommendedRun, "text-choice is-primary"],
      ["去心魔", () => goScene("review")],
      ["回开局台", () => goScene("world")],
    ],
    log: "学习报告会决定下一页更该点亮题眼、整理心魔还是跨域检验。",
  }));
}

function continueWithNextAction(action) {
  if (action.scene === "training") {
    currentNodeIndex = findFirstReviewNodeIndex();
    scene = "training";
    submittedResult = null;
    selectedKeys = [];
    observationHintUsed = false;
    selectedBreakMoveId = "steady";
    logLine = action.reason || "回看题眼短课，再重新点亮题眼。";
    render();
    resetScrollPosition();
    return;
  }
  selectedRunModeId = action.modeId || "explore";
  selectedBuildId = action.buildId || "steady";
  startRogueliteRun(selectedRunModeId, selectedBuildId);
}

function findFirstReviewNodeIndex() {
  const eventsByNode = new Map((run.events || []).map((event) => [event.nodeId, event]));
  const index = (run.nodes || []).findIndex((node) => !eventsByNode.get(node.id)?.countsAsLit);
  return index >= 0 ? index : Math.max(0, Math.min(currentNodeIndex, Math.max(0, (run.nodes || []).length - 1)));
}

function formatJournalEventResult(event) {
  if (event.countsAsLit) return "题眼贴纸已点亮";
  if (event.isCorrect && event.stanceId === "observe") return "观照题眼已记录";
  return "错因心结已收录待整理";
}

function getQuestPanelStageState({ recommendation = {}, objective = {} } = {}) {
  if (scene === "report") {
    return {
      title: "学习报告",
      prompt: "这页已经结算，按报告建议选择下一页目标。",
      nextLabel: "报告建议",
      nextText: formatReportPanelNextText(report),
    };
  }
  if (scene === "training" && run.state === "report_ready") {
    return {
      title: "短课复盘",
      prompt: "正在回看这页的题眼短课，先补题眼再重新点亮。",
      nextLabel: "复盘后",
      nextText: "回看题眼短课后，重新正式点亮这一页。",
    };
  }
  if (scene === "battle") {
    return {
      title: "手账页进行中",
      prompt: objective.prompt || recommendation.reason || "完成一页题眼手账，再查看学习报告。",
      nextLabel: "下一步",
      nextText: "完成本页后查看学习报告，再决定下一步。",
    };
  }
  if (scene === "world") {
    return {
      title: "下一页",
      prompt: objective.prompt || recommendation.reason || "选择一页题眼手账开始。",
      nextLabel: "下一页建议",
      nextText: recommendation.reason || "从推荐目标开始点亮题眼。",
    };
  }
  return {
    title: "下一页",
    prompt: objective.prompt || recommendation.reason || "先完成一页题眼手账。",
    nextLabel: "下一页建议",
    nextText: recommendation.reason || "先完成一页题眼手账，再根据报告选择下一步。",
  };
}

function formatReportPanelNextText(reportData = report) {
  const labels = (reportData?.nextActions || [])
    .map((action) => action.label)
    .filter(Boolean)
    .slice(0, 2);
  if (labels.length) return `按报告建议继续 ${labels.join(" / ")}。`;
  return "按报告建议选择下一页目标。";
}

function renderQuestPanel() {
  if (!isQuestionBankReady()) {
    return renderQuestionBankStatusPanel();
  }

  const recommendation = createRunRecommendation(questions, player);
  const mode = getRunModeDefinition(run.modeId || recommendation.modeId);
  const build = getRunBuildDefinition(run.buildId || recommendation.buildId);
  const dashboard = createLearningDashboard(questions, player);
  const objective = run.objective || {
    label: recommendation.targetText,
    prompt: recommendation.reason,
  };
  const panelState = getQuestPanelStageState({ recommendation, objective });
  dom.questPanel.replaceChildren(
    el("header", "dossier-head", {}, [
      el("span", "text-kicker", {}, ["局势"]),
      el("h2", "", {}, [panelState.title]),
    ]),
    el("section", "objective-panel", {}, [
      el("div", "section-title", {}, [
        el("span", "", {}, ["今日小目标"]),
        el("span", "", {}, [mode.name]),
      ]),
      questLine("目标", objective.label || recommendation.targetText),
      questLine("流派", build.name),
      questLine("进度", formatRunAnsweredProgress(run)),
      el("p", "text-muted", {}, [panelState.prompt]),
    ]),
    el("section", "portrait", {}, [
      el("div", "section-title", {}, [
        el("span", "", {}, ["错题画像"]),
        el("span", "", {}, ["全局画像"]),
      ]),
      ...dashboard.errorPortrait.slice(0, 4).map((item) =>
        el("div", "barline", {}, [
          el("span", "", {}, [item.name]),
          el("div", "track", {}, [el("span", "fill", { style: `width:${item.percent}%` }, [])]),
          el("strong", "", {}, [`${item.percent}%`]),
        ]),
      ),
    ]),
    el("section", "next-box", {}, [
      el("strong", "", {}, [panelState.nextLabel]),
      el("p", "", {}, [panelState.nextText]),
    ]),
  );
}

function renderQuestionBankStatusPanel() {
  const isLoading = questionBankLoadState === "loading";
  dom.questPanel.replaceChildren(
    el("header", "dossier-head", {}, [
      el("span", "text-kicker", {}, ["局势"]),
      el("h2", "", {}, [isLoading ? "题库展开中" : "题库未展开"]),
    ]),
    el("section", "objective-panel", {}, [
      el("div", "section-title", {}, [
        el("span", "", {}, ["题阵状态"]),
        el("span", "", {}, [isLoading ? "加载中" : "需重试"]),
      ]),
      questLine("题库", isLoading ? "正在加载" : "加载失败"),
      questLine("本局", "未开局"),
      questLine("题眼", isLoading ? "准备中" : "未展开"),
      el("p", "text-muted", {}, [isLoading
        ? "正在请求题库入口，完成后会显示开局台。"
        : questionBankLoadError || "请重新加载题库。"]),
    ]),
    el("section", "next-box", {}, [
      el("strong", "", {}, [isLoading ? "下一步" : "重试"]),
      el("p", "", {}, [isLoading ? "等待题库展开。" : "点击主区域的按钮重新加载题库。"]),
    ]),
  );
}

function isQuestionBankReady() {
  return questionBankLoadState === "ready" && questions.length > 0;
}

function ensureQuestionBankAvailable() {
  if (isQuestionBankReady()) return true;
  showToast(questionBankLoadState === "loading" ? "题库正在展开，请稍候。" : "题库还没有展开，请先重新加载。");
  return false;
}

function retryQuestionBankLoad() {
  initializeGame();
}

function startRecommendedRun(recommendation = createRunRecommendation(questions, player)) {
  if (!ensureQuestionBankAvailable()) return;
  selectedRunModeId = recommendation.modeId;
  selectedBuildId = recommendation.buildId;
  startRogueliteRun(selectedRunModeId, selectedBuildId);
}

function selectRunMode(modeId) {
  selectedRunModeId = modeId;
  const recommendation = createRunRecommendation(questions, player);
  selectedBuildId = recommendation.modeId === modeId
    ? recommendation.buildId
    : modeId === "purify" ? "review" : "steady";
  scene = "build";
  render();
}

function selectRunBuild(buildId) {
  selectedBuildId = buildId;
  startRogueliteRun(selectedRunModeId, selectedBuildId);
}

async function startRogueliteRun(modeId = selectedRunModeId, buildId = selectedBuildId) {
  if (!ensureQuestionBankAvailable()) return;
  const nextRun = createRogueliteRun(questions, player, { modeId, buildId, length: 5 });
  if (!nextRun.nodes.length) {
    showToast("当前还没有可进入的题阵。");
    return;
  }
  const runQuestionIds = nextRun.nodes.map((node) => node.questionId);
  try {
    logLine = "正在展开本页题阵。";
    await ensureQuestionsHydrated(runQuestionIds);
  } catch (error) {
    logLine = error.message || "本页题阵暂时无法展开。";
    showToast(logLine);
    render();
    return;
  }

  run = nextRun;
  selectedRunModeId = run.modeId;
  selectedBuildId = run.buildId;
  currentNodeIndex = 0;
  submittedResult = null;
  selectedKeys = [];
  observationHintUsed = false;
  selectedBreakMoveId = "steady";
  report = null;
  logLine = run.brief;
  scene = "battle";
  resetBattleTimer();
  render();
  resetScrollPosition();
}

function startTraining() {
  ensureRun();
  scene = "training";
  submittedResult = null;
  selectedKeys = [];
  observationHintUsed = false;
  selectedBreakMoveId = "steady";
  render();
  resetScrollPosition();
}

function studyCurrentNode() {
  const node = getCurrentNode();
  if (!node) return;
  const result = studyNode(player, run, node.id, { bankQuestions: questions });
  player = result.player;
  run = result.run;
  const materialText = formatMaterials(result.rewards.materialsGain);
  logLine = `短课完成：修为 +${result.rewards.growthXpGain}${materialText ? `，${materialText}` : ""}。${result.rewards.styleFeedback || ""}`;
  savePlayer(player);
  render();
}

function renderRunBuildSummary() {
  const build = getRunBuildDefinition(run.buildId || selectedBuildId);
  return el("div", "text-choice-list", {}, [
    el("p", "", {}, [`${build.name}：${build.summary}`]),
    el("p", "text-muted", {}, [`节奏 ${build.risk} · 收获 ${build.reward}。流派在开局前选择，本页内保持不变。`]),
  ]);
}

function formatStudyPrompt(prompt = "") {
  const oldLessonGoal = String.fromCharCode(32451, 21151, 30446, 26631);
  const oldLesson = String.fromCharCode(32451, 21151);
  const oldBattle = String.fromCharCode(25112, 26007);
  return String(prompt || "短课目标：先抓住题眼，再进题阵检验。")
    .replace(new RegExp(oldLessonGoal, "g"), "短课目标")
    .replace(new RegExp(oldLesson, "g"), "短课")
    .replace(new RegExp(oldBattle, "g"), "题阵");
}

function enterBattleAfterTraining() {
  scene = "battle";
  submittedResult = null;
  selectedKeys = [];
  observationHintUsed = false;
  selectedBreakMoveId = "steady";
  resetBattleTimer();
  render();
  resetScrollPosition();
}

function startBattle() {
  startRecommendedRun();
}

function startMixedSimulation() {
  startRogueliteRun("sprint", "steady");
}

function startDemonBattle(demonRun) {
  if (!demonRun.nodes.length) {
    showToast("没有可净化的错题。");
    return;
  }
  run = demonRun;
  currentNodeIndex = 0;
  submittedResult = null;
  selectedKeys = [];
  observationHintUsed = false;
  selectedBreakMoveId = "steady";
  scene = "battle";
  resetBattleTimer();
  render();
}

function getBattleResultChoices() {
  const choices = [
    [run.completed ? "查看今日手账页" : "下一题", handleBattleAdvance, "text-choice is-primary"],
    ["看题眼短课", startTraining],
  ];
  if (submittedResult?.errorDiagnosis?.primary) {
    choices.push(["直接净化", () => startRogueliteRun("purify", "review")]);
  }
  choices.push(["回开局台", () => goScene("world")]);
  return choices;
}

function toggleOption(key) {
  const question = getCurrentQuestion();
  if (!question || submittedResult) return;
  selectedKeys = question.answer.length > 1
    ? toggleKey(selectedKeys, key, question.options.map((option) => option.key))
    : [key];
  render();
}

function handleBattleAction() {
  const node = getCurrentNode();
  const question = getCurrentQuestion();
  if (!node || !question) return;
  if (!selectedKeys.length) {
    showToast("先选择答案。");
    return;
  }
  submittedResult = applyTrialAnswer(player, run, {
    nodeId: node.id,
    question,
    selectedAnswer: selectedKeys.join(""),
    stanceId: getBattleStanceId(),
    bankQuestions: questions,
    elapsedSeconds: getBattleElapsedSeconds(),
  });
  player = submittedResult.player;
  run = submittedResult.run;
  report = run.completed ? createRogueliteRunReport(run, player, questions) : null;
  logLine = submittedResult.countsAsLit
    ? "题眼已点亮。"
    : submittedResult.isCorrect ? "观照题眼已记录，本题不计入正式点亮。" : `已收进心魔回廊，正解 ${submittedResult.correctAnswer}。`;
  savePlayer(player);
  render();
}

function handleBattleAdvance() {
  if (run.completed) {
    report = createRogueliteRunReport(run, player, questions);
    scene = "report";
    render();
    return;
  }
  currentNodeIndex = Math.min(run.nodes.length - 1, currentNodeIndex + 1);
  selectedKeys = [];
  observationHintUsed = false;
  selectedBreakMoveId = "steady";
  submittedResult = null;
  resetBattleTimer();
  render();
}

function resetBattleTimer() {
  battleQuestionStartedAt = Date.now();
}

function getBattleElapsedSeconds() {
  return Math.max(0.1, Math.round(((Date.now() - battleQuestionStartedAt) / 1000) * 10) / 10);
}

function upgradeHeartPowerAction() {
  try {
    const result = upgradeHeartPower(player);
    player = result.player;
    logLine = `心力上限提升到 ${result.nextMaxHeartPower}。`;
    savePlayer(player);
    render();
  } catch (error) {
    showToast(error.message);
  }
}

function claimQuestReward(questId) {
  try {
    const result = claimDailyQuestReward(questions, player, questId, { now: new Date() });
    const materialText = formatMaterials(result.reward.materials);
    const titleText = result.reward.title ? `称号：${result.reward.title}` : "";
    player = result.player;
    logLine = `已领取 ${result.quest.title}：${[materialText, titleText].filter(Boolean).join(" · ") || "已记录"}`;
    savePlayer(player);
    render();
    showToast(logLine);
  } catch (error) {
    showToast(error.message || "暂时不能领取这项奖励。");
  }
}

function restFatigueAction() {
  player = restFromFatigue(player, { now: new Date() });
  logLine = "已休息，手账节奏已恢复。";
  savePlayer(player);
  render();
  showToast(logLine);
}

function showExportPanel() {
  try {
    const saveText = createSaveText();
    const field = saveTextArea(saveText, true);
    dom.stage.replaceChildren(textScreen({
      kicker: "存档",
      title: "导出存档",
      intro: "复制这段存档码，用于备份或迁移进度。",
      body: [panel("存档码", [field])],
      choices: [
        ["复制", () => copySaveText(saveText, field), "text-choice is-primary"],
        ["返回", render],
      ],
      log: "存档码只会带走当前巡游进度。",
    }));
    field.focus();
    field.select();
  } catch (error) {
    showToast(error.message || "暂时无法导出存档码");
  }
}

function showImportPanel() {
  const field = saveTextArea("", false);
  dom.stage.replaceChildren(textScreen({
    kicker: "存档",
    title: "导入存档",
    intro: "粘贴存档码后导入，会覆盖当前进度。",
    body: [panel("存档码", [field])],
    choices: [
      ["导入", () => importSaveText(field.value), "text-choice is-primary"],
      ["返回", render],
    ],
    log: "导入只替换巡游进度，不会改动书院秘卷。",
  }));
  field.focus();
}

function showReviewChecklist() {
  const checklistText = createReviewChecklistText(createLearningDashboard(questions, player));
  const field = saveTextArea(checklistText, true);
  dom.stage.replaceChildren(textScreen({
    kicker: "仪表",
    title: "导出复习清单",
    intro: "这份清单只包含当前活跃心魔和复习建议。",
    body: [panel("复习清单", [field])],
    choices: [
      ["复制", () => copySaveText(checklistText, field), "text-choice is-primary"],
      ["返回仪表", () => goScene("dashboard")],
    ],
    log: "清单只包含当前复习目标和建议。",
  }));
  field.focus();
  field.select();
}

async function copySaveText(saveText, field) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(saveText);
    } else {
      field.focus();
      field.select();
      document.execCommand("copy");
    }
    showToast("存档码已复制");
  } catch {
    field.focus();
    field.select();
    showToast("已选中存档码");
  }
}

function createSaveText() {
  return encodeSaveText(createCurrentArchive());
}

function createReviewChecklistText(dashboard) {
  const lines = [
    "小明书院复习清单",
    `题眼短课：${dashboard.questionProgress.studiedCount}/${dashboard.questionProgress.total}`,
    `答对覆盖：${dashboard.questionProgress.correctCount}/${dashboard.questionProgress.total}`,
    `活跃心魔：${dashboard.demonStats.activeCount}`,
    "",
  ];

  if (!dashboard.reviewItems.length) {
    lines.push("当前没有待复习心魔。");
  } else {
    dashboard.reviewItems.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.topic} · ${item.demonType} · 压力 ${item.pressure}`);
      lines.push(`   概念：${item.concept}`);
      lines.push(`   建议：先看题眼短课，再进心魔回廊净化。`);
    });
  }

  return lines.join("\n");
}

function importSaveText(saveText) {
  try {
    const payload = parseSaveText(saveText);
    const archive = parseSaveArchive(payload, { questions });
    player = archive.player;
    chapters = createStoryChapters(questions);
    selectedChapterId = archive.selectedChapterId || chapters[0]?.id || "";
    scene = normalizeSceneId(archive.scene) || "world";
    resetRunForChapter();
    savePlayer(player);
    logLine = "已导入存档。";
    render();
  } catch (error) {
    showToast(error.message || "暂时无法导入存档码");
  }
}

function resetProgress() {
  if (!window.confirm("确定重置文字巡游进度吗？")) return;
  player = initialPlayerState();
  selectedChapterId = chapters[0]?.id || "";
  resetRunForChapter();
  logLine = "进度已重置。";
  scene = "world";
  savePlayer(player);
  render();
}

function goScene(nextScene) {
  const normalized = normalizeSceneId(nextScene);
  if (!normalized) return;
  scene = normalized;
  if (scene !== "battle") submittedResult = null;
  if (scene !== "battle") observationHintUsed = false;
  if (scene !== "battle") selectedBreakMoveId = "steady";
  render();
  resetScrollPosition();
}

function resetScrollPosition() {
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    dom.shell?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
    dom.stage?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  });
}

function ensureRun() {
  if (!run.nodes.length || currentNodeIndex >= run.nodes.length) resetRunForChapter();
}

function resetRunForChapter() {
  run = createRogueliteRun(questions, player, { modeId: selectedRunModeId, buildId: selectedBuildId, length: 5 });
  currentNodeIndex = 0;
  selectedKeys = [];
  observationHintUsed = false;
  selectedBreakMoveId = "steady";
  submittedResult = null;
  report = null;
}

function ensureCurrentRunHydrated() {
  const questionIds = unique((run.nodes || []).map((node) => node.questionId).filter(Boolean));
  const needsHydration = questionIds.some((questionId) => {
    const question = questions.find((item) => item.id === questionId);
    return Boolean(question?.chunkId) && !hydratedQuestionById.has(questionId);
  });
  if (!needsHydration) return true;
  requestCurrentRunHydration(questionIds);
  return false;
}

async function requestCurrentRunHydration(questionIds) {
  const key = questionIds.join("|");
  if (!key || pendingRunHydrationKey === key) return;
  pendingRunHydrationKey = key;
  logLine = "正在展开本页题阵。";
  try {
    await ensureQuestionsHydrated(questionIds);
  } catch (error) {
    logLine = error.message || "本页题阵暂时无法展开。";
    showToast(logLine);
  } finally {
    pendingRunHydrationKey = "";
    render();
  }
}

function renderCurrentRunHydrationStage(label) {
  dom.stage.replaceChildren(textScreen({
    kicker: "开局台",
    title: `${label}正在展开`,
    intro: "正在载入当前页题目，请稍候。",
    body: [
      panel("展开中", [
        el("p", "", {}, ["本页只会加载需要的题目分片。"]),
        el("p", "text-muted", {}, ["如果网络较慢，书院会自动尝试备用入口。"]),
      ]),
    ],
    choices: [["回开局台", () => goScene("world")]],
    log: logLine,
  }));
}

function createRunForSelectedChapter() {
  return createRogueliteRun(questions, player, { modeId: selectedRunModeId, buildId: selectedBuildId, length: 5 });
}

function getCurrentNode() {
  ensureRunIndex();
  return run.nodes[currentNodeIndex] || null;
}

function getCurrentQuestion() {
  const node = getCurrentNode();
  return node ? hydratedQuestionById.get(node.questionId) || questions.find((question) => question.id === node.questionId) || null : null;
}

function ensureRunIndex() {
  currentNodeIndex = Math.max(0, Math.min(currentNodeIndex, Math.max(0, run.nodes.length - 1)));
}

function renderBattleFeedback(question) {
  const demon = submittedResult.demonProfile;
  const pageProgress = `${run.correctCount || 0}/${Math.max(1, run.nodes?.length || run.answeredCount || 5)}`;
  const content = [
    el("p", "", {}, [submittedResult.countsAsLit
      ? `题眼贴纸：${question.lesson?.title || question.topic || "当前题眼"} 已点亮。修为 +${submittedResult.growthXpGain}，${formatMaterials(submittedResult.materialsGain) || "本页进度已记录"}。`
      : submittedResult.isCorrect
        ? `观照题眼：${question.lesson?.title || question.topic || "当前题眼"} 已记录。本题已看答案，不计入正式点亮和贴纸。`
        : `这道题暴露了一个容易混淆的点。正解 ${question.answer}，已收进心魔回廊，下一页可以整理掉。`]),
    el("p", "text-muted", {}, [submittedResult.isCorrect
      ? `今日手账页进度：已点亮 ${pageProgress}。`
      : `错因心结：${demon?.demonType || submittedResult.errorDiagnosis?.primary?.name || "待整理"}。`]),
    submittedResult.styleFeedback ? el("p", "text-muted", {}, [submittedResult.styleFeedback]) : "",
    el("p", "text-muted", {}, [submittedResult.learningCheck]),
  ];

  if (demon) {
    content.push(
      el("p", "text-muted", {}, [`错因：${demon.errorPatternName || demon.demonType}。${demon.diagnosis}`]),
      el("p", "text-muted", {}, [`整理建议：${demon.remedy}`]),
    );
  }
  if (submittedResult.errorDiagnosis?.primary) {
    content.push(renderErrorDiagnosisPanel(submittedResult.errorDiagnosis));
  }

  return panel(submittedResult.countsAsLit ? "题眼贴纸" : submittedResult.isCorrect ? "观照题眼" : "错因收录", content);
}

function renderErrorDiagnosisPanel(errorDiagnosis) {
  return el("div", "text-log", {}, [
    el("p", "", {}, [`错因诊断：${errorDiagnosis.primary.name} · ${errorDiagnosis.primary.probability}%`]),
    ...errorDiagnosis.probabilities.map((item) =>
      el("p", "", {}, [`${item.bar} ${item.probability}% ${item.name}：${item.diagnosis}`]),
    ),
    el("p", "text-muted", {}, [`建议：${errorDiagnosis.suggestions.join("；")}`]),
  ]);
}

function textScreen({ kicker, title, intro, body = [], choices = [], log = "" }) {
  return el("article", "text-screen", {}, [
    el("header", "", {}, [
      el("span", "text-kicker", {}, [kicker]),
      el("h2", "", {}, [title]),
      el("p", "", {}, [intro]),
    ]),
    el("div", "text-body", {}, body),
    el("footer", "text-action-bar", {}, [
      el("div", "text-action-buttons", {}, choices.map(([label, onClick, className = "text-choice", detail = ""]) =>
        textButton(label, onClick, className, detail),
      )),
      log ? el("div", "text-log", {}, [log]) : "",
    ]),
  ]);
}

function emptyScreen(title, detail) {
  return textScreen({
    kicker: "提示",
    title,
    intro: detail,
    choices: [["回开局台", () => goScene("world"), "text-choice is-primary"]],
    log: logLine,
  });
}

function panel(title, content) {
  const children = [el("h3", "", {}, [title])];
  if (Array.isArray(content)) children.push(...content);
  else if (content instanceof Node) children.push(content);
  else children.push(el("p", "", {}, [content]));
  return el("section", "text-panel", {}, children);
}

function textButton(label, onClick, className = "text-choice", detail = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  if (className.includes("is-disabled")) {
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
  }
  button.append(el("strong", "", {}, [label]));
  if (detail) button.append(el("small", "", {}, [detail]));
  button.addEventListener("click", onClick);
  return button;
}

function saveTextArea(value, readonly) {
  const field = el("textarea", "save-textarea", {
    rows: "10",
    spellcheck: "false",
    autocapitalize: "off",
    autocomplete: "off",
  });
  field.value = value;
  field.readOnly = readonly;
  return field;
}

function meter(label, current, target) {
  const value = target ? Math.min(100, Math.round((Number(current || 0) / Number(target || 1)) * 100)) : 0;
  return el("div", "text-meter", {}, [
    el("span", "", {}, [label]),
    el("b", "", {}, [el("i", "", { style: `--value:${value}%` }, [])]),
  ]);
}

function hudStat(label, value) {
  return el("article", "hud-stat", {}, [
    el("span", "", {}, [label]),
    el("strong", "", {}, [String(value)]),
  ]);
}

function statLine(label, value) {
  return el("p", "", {}, [
    el("strong", "", {}, [`${label}：`]),
    String(value),
  ]);
}

function questLine(label, value) {
  return el("div", "quest-line", {}, [
    el("span", "", {}, [label]),
    el("strong", "", {}, [String(value)]),
  ]);
}

function el(tag, className = "", attrs = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "style") node.setAttribute("style", value);
    else if (key === "type") node.type = value;
    else if (value !== undefined && value !== null) node.setAttribute(key, value);
  });
  children.forEach((child) => {
    if (child === "" || child === undefined || child === null) return;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return node;
}

function getOptionClass(question, key) {
  const classes = ["battle-option"];
  if (selectedKeys.includes(key)) classes.push("is-selected");
  if (submittedResult && question.answer.includes(key)) classes.push("is-correct");
  if (submittedResult && selectedKeys.includes(key) && !question.answer.includes(key)) classes.push("is-wrong");
  return classes.join(" ");
}

function getWorldProgressPercent(progress) {
  if (!progress) return 0;
  if (progress.cleared) return 100;
  const total = Math.max(1, progress.total || 1);
  return Math.round(((progress.studiedCount * 0.4 + progress.correctCount * 0.6) / total) * 100);
}

function formatMaterials(materials = {}) {
  const bag = normalizeMaterialBag(materials);
  return materialTypes
    .map((material) => [material.name, bag[material.id] || 0])
    .filter(([, value]) => value > 0)
    .map(([name, value]) => `${name}+${value}`)
    .join(" · ");
}

function formatJournalCollection(collection = {}) {
  const stickers = Array.isArray(collection?.stickers) ? collection.stickers.length : 0;
  const bookmarks = Array.isArray(collection?.bookmarks) ? collection.bookmarks.length : 0;
  const fragments = Number(collection?.fragments || 0);
  return `贴纸 ${stickers} · 书签 ${bookmarks} · 秘卷碎片 ${fragments}`;
}

function formatQuestReward(rewards = {}) {
  const parts = [];
  const materialText = formatMaterials(rewards.materials || rewards);
  if (materialText) parts.push(materialText);
  if (rewards.title) parts.push(`称号：${rewards.title}`);
  return parts.join(" · ") || "完成后记录进度";
}

function formatCost(cost = {}) {
  const text = formatMaterials(cost);
  return text ? `消耗 ${text}` : "无需材料";
}

function normalizeMaterialBag(materials = {}) {
  return Object.fromEntries(materialTypes.map((material) => [material.id, Number(materials?.[material.id] || 0)]));
}

function unique(items = []) {
  return [...new Set(items)];
}

function toggleKey(keys, key, order) {
  const nextKeys = keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key];
  return order.filter((item) => nextKeys.includes(item));
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

function resolveInitialScene() {
  const params = new URLSearchParams(window.location.search);
  return normalizeSceneId(params.get("scene")) || normalizeSceneId(window.location.hash.slice(1));
}

function normalizeSceneId(value) {
  if (!value) return "";
  const id = String(value).trim();
  return playableScenes.has(id) ? id : "";
}

function createCurrentArchive() {
  return createSaveArchive({
    questions,
    player,
    selectedChapterId,
    scene,
  });
}

function encodeSaveText(payload) {
  const json = JSON.stringify(payload);
  let binary = "";
  new TextEncoder().encode(json).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `XMA1-${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
}

function parseSaveText(saveText) {
  const text = String(saveText || "").trim();
  if (!text) throw new Error("请先粘贴存档码。");
  if (text.startsWith("{")) return JSON.parse(text);

  const encoded = text.replace(/^XMA1-/i, "").replace(/\s/g, "");
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function loadSavedState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey));
    const fallback = parseSaveArchive(parsed && typeof parsed === "object" ? parsed : {
      player: initialPlayerState(),
      scene: "",
    }, { questions });

    return {
      ...fallback,
      scene: normalizeSceneId(fallback.scene) || "world",
    };
  } catch {
    return {
      ...parseSaveArchive({
        player: initialPlayerState(),
        scene: "",
      }, { questions }),
      scene: "world",
    };
  }
}

function savePlayer(nextPlayer) {
  player = nextPlayer;
  window.localStorage.setItem(storageKey, JSON.stringify(createCurrentArchive()));
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => dom.toast.classList.remove("is-visible"), 2200);
}
