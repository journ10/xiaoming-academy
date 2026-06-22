import {
  applyTrialAnswer,
  buildChapterMechanicState,
  buildObservationHint,
  createDailyQuestState,
  createLearningDashboard,
  createMindDemonRun,
  createRogueliteRun,
  createRogueliteRunReport,
  createRunRecommendation,
  createRouteRun,
  createRunReport,
  createStoryChapters,
  getChapterActionState,
  getChapterAvailability,
  getChapterProgress,
  getDialogueForChapter,
  getHeartMethod,
  getHeartPowerUpgradeState,
  initialPlayerState,
  isBankMastered,
  markChapterStorySeen,
  markIntroSeen,
  materialTypes,
  nodeTypes,
  createSaveArchive,
  parseQuestionImport,
  parseSaveArchive,
  rogueliteBuildDefinitions,
  rogueliteRunModes,
  studyNode,
  upgradeHeartPower,
} from "./core.js?v=observation-hint-20260622";

const storageKey = "xiaoming-academy-text-game-v1";
const questionBankUrls = [
  "./data/questions.from-pdf.json",
  "/xiaoming-academy/data/questions.from-pdf.json",
];
const classificationAuditUrls = [
  "./data/question-classification.audit.json",
  "/xiaoming-academy/data/question-classification.audit.json",
];
const playableScenes = new Set(["world", "mode", "build", "training", "battle", "review", "daily", "dashboard", "report"]);
const navItems = [
  ["world", "开局"],
  ["review", "心魔"],
  ["daily", "日课"],
  ["dashboard", "报告"],
];
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

const dom = {
  shell: document.querySelector("[data-shell]"),
  stage: document.querySelector("[data-stage]"),
  questPanel: document.querySelector("[data-quest-panel]"),
  hudStats: document.querySelector("[data-hud-stats]"),
  bottomNav: document.querySelector("[data-bottom-nav]"),
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
let selectedKeys = [];
let submittedResult = null;
let report = null;
let storyMode = "";
let storyLines = [];
let storyIndex = 0;
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
  try {
    const builtInBank = await loadBuiltInQuestionBank();
    questions = builtInBank.questions;
    chapters = createStoryChapters(questions);
    const saved = loadSavedState();
    player = saved.player;
    selectedChapterId = saved.selectedChapterId || chapters[0]?.id || "";
    scene = resolveInitialScene() || saved.scene || "world";
    run = createRogueliteRun(questions, player, { modeId: selectedRunModeId, buildId: selectedBuildId, length: 5 });
    storyMode = "";
    storyLines = [];
    storyIndex = 0;
    logLine = "选择本局目标，开始一局题阵。";
    render();
  } catch (error) {
    questions = [];
    chapters = [];
    player = initialPlayerState();
    selectedChapterId = "";
    scene = "world";
    run = createRouteRun([]);
    logLine = error.message || "秘卷暂时无法展开。";
    render();
    showToast(logLine);
  }
}

async function loadBuiltInQuestionBank() {
  const classificationAudit = await loadClassificationAudit();
  let lastError = null;
  for (const url of questionBankUrls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
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
      const response = await fetch(url, { cache: "no-store" });
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

function render() {
  chapters = createStoryChapters(questions);
  if (!chapters.some((chapter) => chapter.id === selectedChapterId)) {
    selectedChapterId = chapters[0]?.id || "";
  }

  dom.shell.dataset.scene = scene;

  renderHud();
  renderStage();
  renderQuestPanel();
  renderBottomNav();
}

function renderHud() {
  dom.hudStats.replaceChildren(
    hudStat("心力", `${player.heartPower || 0}/${player.maxHeartPower || 6}`),
    hudStat("本局", formatHudRunProgress()),
    hudStat("目标", run.objective?.label || run.modeName || runModeLabels[selectedRunModeId] || "开局"),
    hudStat("题眼", formatHudLessonState()),
  );
}

function formatHudRunProgress() {
  const total = Math.max(1, run.nodes?.length || 1);
  if (run.completed || run.state === "report_ready") {
    return `${Math.min(total, Math.max(run.answeredCount || 0, currentNodeIndex + 1))}/${total}`;
  }
  const current = Math.min(total, Math.max(1, (run.answeredCount || 0) + 1));
  return `${current}/${total}`;
}

function formatHudLessonState() {
  const question = getCurrentQuestion();
  if (!question) return "待开局";
  if ((player.studiedLessonIds || []).includes(question.lesson?.id)) return "已短课";
  if (observationHintUsed) return "已观照";
  if (scene === "battle") return "可观照";
  if (scene === "training") return "短课中";
  return "待进入";
}

function renderStage() {
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

  dom.stage.replaceChildren(el("article", "text-screen start-desk", {}, [
    el("header", "start-hero", {}, [
      el("span", "text-kicker", {}, ["今日推荐"]),
      el("h2", "", {}, [mode.name]),
      el("p", "stage-sub", {}, [recommendation.reason]),
    ]),
    el("section", "start-focus", {}, [
      el("div", "objective-panel primary-objective", {}, [
        el("span", "text-kicker", {}, ["本局目标"]),
        el("h3", "", {}, [recommendation.targetText]),
        el("p", "", {}, [brief]),
      ]),
      el("div", "objective-panel", {}, [
        el("span", "text-kicker", {}, ["推荐流派"]),
        el("h3", "", {}, [build.name]),
        el("p", "", {}, [build.summary]),
      ]),
    ]),
    el("footer", "start-actions", {}, [
      textButton("开始一局", () => startRecommendedRun(recommendation), "primary-action"),
      textButton("换目标", () => goScene("mode"), "text-choice"),
      textButton("学习报告", () => goScene("dashboard"), "text-choice"),
      textButton("心魔回廊", () => goScene("review"), "text-choice"),
    ]),
    el("p", "text-muted", {}, [dashboard.weakestTopic
      ? `下一步建议：${dashboard.weakestTopic.title} 心魔 ${dashboard.weakestTopic.demonCount}，心法 ${dashboard.weakestTopic.mastery}。`
      : "下一步建议：先完成一局探索，再根据错题决定是否净化。"]),
  ]));
}

function renderModeSelectStage() {
  const recommendation = createRunRecommendation(questions, player);
  dom.stage.replaceChildren(textScreen({
    kicker: "选择目标",
    title: "这一局要解决什么？",
    intro: "目标只影响本局题池和结算建议。默认推荐已经替你选好，也可以手动改。",
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
    title: `${mode.name} · 选择本局打法`,
    intro: "流派影响整局风险收益；题内只保留观照提示，帮助你在不确定时回看题眼。",
    body: [
      el("div", "build-grid", {}, rogueliteBuildDefinitions.map((build) =>
        el("article", `build-card ${build.id === selectedBuildId ? "is-selected" : ""}`, {}, [
          el("span", "text-kicker", {}, [`风险 ${build.risk} · 奖励 ${build.reward}`]),
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
    log: `${mode.name}会决定本局题池，流派决定收益和风险。`,
  }));
}

function runEventBrief(recommendation) {
  if (recommendation.modeId === "purify") {
    return "阿芷：这局别急着开新题，先把已经暴露的错因处理掉。";
  }
  if (recommendation.modeId === "sprint") {
    return "青岚：这局会跨域切换，别靠惯性答题，每题先看机制。";
  }
  return "明澈：先开一局探索，题阵会告诉你今天最该补哪里。";
}

function getRunModeDefinition(modeId) {
  return rogueliteRunModes.find((mode) => mode.id === modeId) || rogueliteRunModes[0];
}

function getRunBuildDefinition(buildId) {
  return rogueliteBuildDefinitions.find((build) => build.id === buildId) || rogueliteBuildDefinitions[0];
}

function renderStoryStage() {
  if (!storyLines.length) startChapterStory();
  const line = storyLines[storyIndex] || storyLines[0];
  dom.stage.replaceChildren(textScreen({
    kicker: storyMode.startsWith("intro") ? "序章" : "剧情",
    title: line?.speakerName || "书院",
    intro: line?.text || "书院暂时安静。",
    body: [
      panel("已读记录", el("div", "text-log", {}, storyLines.slice(0, storyIndex + 1).map((item) =>
        el("p", "", {}, [`${item.speakerName}：${item.text}`]),
      ))),
    ],
    choices: [
      [storyIndex >= storyLines.length - 1 ? "完成阅读" : "继续", advanceStory, "text-choice is-primary"],
      ["看题眼短课", () => leaveStoryFor("training")],
      ["去题阵", () => leaveStoryFor("battle")],
    ],
    log: logLine,
  }));
}

function renderTrainingStage() {
  ensureRun();
  const node = getCurrentNode();
  const question = getCurrentQuestion();
  if (!node || !question) {
    dom.stage.replaceChildren(emptyScreen("暂时没有题眼短课", "先开始一局，题阵会给出当前要补的题眼。"));
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
  return el("header", "battle-status-bar", {}, [
    battleStatusChip("本局", run.modeName || "题阵"),
    battleStatusChip("遭遇", progressText),
    battleStatusChip("题型", nodeTypes[node.type]?.name || node.typeName || "题阵"),
    battleStatusChip("题眼", question.lesson?.title || question.topic || "当前题"),
    battleStatusChip("机制", mechanicState.name || node.mechanicName || "常规题阵"),
    battleStatusChip("提示", observationHintUsed ? "已看观照" : "可观照", observationHintUsed ? "is-muted" : "is-ready"),
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
    el("p", "battle-stem", {}, [mechanicState.displayStem]),
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
    : observationHintUsed ? "已看观照提示，作答收益会降低。" : "可先看观照提示，再选择答案提交。";
  return el("footer", "battle-action-bar", {}, [
    el("div", "battle-selection-state", {}, [
      el("span", "text-kicker", {}, ["答题状态"]),
      el("strong", "", {}, [selectionText]),
      el("small", "", {}, [hintText]),
    ]),
    el("div", "battle-action-buttons", {}, choices.map(([label, onClick, className = "text-choice", detail = ""]) =>
      textButton(label, onClick, battleActionClassName(className), detail),
    )),
  ]);
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
  return panel("本局目标", [
    el("p", "", {}, [`${objective.label || "完成题阵"} · 遭遇 ${progressText}`]),
    el("p", "text-muted", {}, [objective.prompt || run.brief || "完成本局后会给出下一局建议。"]),
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
    return panel("观照提示", [
      el("p", "", {}, [hint.stemCue]),
      el("p", "", {}, [`对应答案：${hint.answerLine}`]),
      el("p", "text-muted", {}, [`依据：${hint.explanation}`]),
      hint.keyPoint ? el("p", "text-muted", {}, [`题眼：${hint.keyPoint}`]) : "",
      el("p", "text-muted", {}, ["本题已查看提示，作答后按提示答题记录，收益会降低。"]),
    ]);
  }
  return panel("提示", [
    el("p", "", {}, ["不确定时先看观照提示，再选择答案。"]),
    el("p", "text-muted", {}, ["选择答案后，用底部按钮提交。"]),
    textButton("观照提示", revealObservationHint, "text-choice", "查看解析摘录与题眼；本题收益降低。"),
  ]);
}

function getBattleActionChoices(question) {
  const canSubmit = selectedKeys.length > 0;
  return [
    [
      canSubmit ? "提交答案" : "先选择答案",
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
  render();
}

function getBattleStanceId() {
  return observationHintUsed ? "observe" : "steady";
}

function noop() {}

function renderChapterMechanicState(mechanicState) {
  const lines = [
    el("p", "", {}, [`${mechanicState.name}：${mechanicState.prompt}`]),
  ];
  if (mechanicState.borrowedMechanic) {
    lines.push(el("p", "text-muted", {}, [`万象混沌借用：${mechanicState.borrowedMechanic}`]));
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
  const questState = createDailyQuestState(questions, player);
  const challenges = questState.daily;
  const weekly = questState.weekly;
  const fatigue = questState.fatigue;
  dom.stage.replaceChildren(textScreen({
    kicker: "日课",
    title: "今日清单",
    intro: "日课和周课会提示你现在最该补哪一块。",
    body: [
      panel("日课", el("div", "text-choice-list", {}, challenges.map((challenge) =>
        el("article", "text-panel", {}, [
          el("h3", "", {}, [challenge.title]),
          el("p", "", {}, [challenge.description]),
          meter(`${challenge.progress.current}/${challenge.progress.target}`, challenge.progress.current, challenge.progress.target),
          el("p", "text-muted", {}, [formatQuestReward(challenge.rewards)]),
        ]),
      ))),
      panel("周课", el("div", "text-choice-list", {}, weekly.map((quest) =>
        el("article", "text-panel", {}, [
          el("h3", "", {}, [quest.title]),
          el("p", "", {}, [quest.description]),
          meter(`${quest.progress.current}/${quest.progress.target}`, quest.progress.current, quest.progress.target),
          el("p", "text-muted", {}, [formatQuestReward(quest.rewards)]),
        ]),
      ))),
      panel("休息提醒", [
        statLine("连续破阵", fatigue.consecutiveRouteRuns),
        statLine("收益倍率", `${Math.round(fatigue.rewardMultiplier * 100)}%`),
        el("p", "text-muted", {}, [fatigue.warning]),
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
        statLine("学习域覆盖", `${dashboard.chapterStats.clearedCount}/${dashboard.chapterStats.totalCount}`),
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
      panel("流派胜率", el("div", "text-log", {}, dashboard.styleWinRates.map((item) =>
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
  dom.stage.replaceChildren(textScreen({
    kicker: "本局报告",
    title: reportData.resultLabel || reportData.title,
    intro: `正确率 ${reportData.correctRate}% · 答题 ${reportData.correctCount}/${reportData.answeredCount} · 错题 ${reportData.wrongCount}`,
    body: [
      panel("本轮收益", [
        statLine("修为", `+${reportData.growthXpGain}`),
        statLine("材料", formatMaterials(reportData.materialsGain) || "无"),
        statLine("主要错因", reportData.primaryMistake || reportData.nextRecommendation.reason),
      ]),
      panel("下一局建议", el("div", "text-choice-list", {}, (reportData.nextActions || []).map((action) =>
        textButton(action.label, () => continueWithNextAction(action), "text-choice", action.reason),
      ))),
      panel("事件", reportData.events.length
        ? el("div", "text-log", {}, reportData.events.map((event) =>
            el("p", "", {}, [`${event.topic}：${event.isCorrect ? "答对" : "答错"}，${event.learningCheck}`]),
          ))
        : "还没有题阵记录。"),
    ],
    choices: [
      ["开始一局", startRecommendedRun, "text-choice is-primary"],
      ["去心魔", () => goScene("review")],
      ["回开局台", () => goScene("world")],
    ],
    log: "结算会决定下一局更该探索、净化还是冲刺。"
  }));
}

function continueWithNextAction(action) {
  selectedRunModeId = action.modeId || "explore";
  selectedBuildId = action.buildId || "steady";
  startRogueliteRun(selectedRunModeId, selectedBuildId);
}

function renderQuestPanel() {
  const recommendation = createRunRecommendation(questions, player);
  const mode = getRunModeDefinition(run.modeId || recommendation.modeId);
  const build = getRunBuildDefinition(run.buildId || recommendation.buildId);
  const dashboard = createLearningDashboard(questions, player);
  const objective = run.objective || {
    label: recommendation.targetText,
    prompt: recommendation.reason,
  };
  dom.questPanel.replaceChildren(
    el("header", "dossier-head", {}, [
      el("span", "text-kicker", {}, ["局势"]),
      el("h2", "", {}, [scene === "battle" ? "本局进行中" : "下一步"]),
    ]),
    el("section", "objective-panel", {}, [
      el("div", "section-title", {}, [
        el("span", "", {}, ["本局目标"]),
        el("span", "", {}, [mode.name]),
      ]),
      questLine("目标", objective.label || recommendation.targetText),
      questLine("流派", build.name),
      questLine("进度", run.nodes?.length ? `${run.answeredCount}/${run.nodes.length}` : "未开局"),
      el("p", "text-muted", {}, [objective.prompt || recommendation.reason]),
    ]),
    el("section", "portrait", {}, [
      el("div", "section-title", {}, [
        el("span", "", {}, ["错题画像"]),
        el("span", "", {}, ["当前"]),
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
      el("strong", "", {}, ["下一步建议"]),
      el("p", "", {}, [scene === "world" ? recommendation.reason : "完成本局后查看报告，系统会给出下一局建议。"]),
    ]),
  );
}

function renderBottomNav() {
  dom.bottomNav.replaceChildren(...navItems.map(([id, label]) => {
    const button = textButton(label, () => goScene(id), scene === id ? "is-active" : "");
    button.dataset.navId = id;
    button.setAttribute("aria-label", `打开${label}`);
    button.setAttribute("aria-current", scene === id ? "page" : "false");
    return button;
  }));
}

function startRecommendedRun(recommendation = createRunRecommendation(questions, player)) {
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

function startRogueliteRun(modeId = selectedRunModeId, buildId = selectedBuildId) {
  run = createRogueliteRun(questions, player, { modeId, buildId, length: 5 });
  if (!run.nodes.length) {
    showToast("当前还没有可进入的题阵。");
    return;
  }
  selectedRunModeId = run.modeId;
  selectedBuildId = run.buildId;
  currentNodeIndex = 0;
  submittedResult = null;
  selectedKeys = [];
  observationHintUsed = false;
  report = null;
  logLine = run.brief;
  scene = "battle";
  render();
}

function startIntro(forced = false) {
  storyMode = forced ? "intro-forced" : "intro";
  storyLines = getIntroDialogue();
  storyIndex = 0;
  scene = "story";
  render();
}

function startChapterStory() {
  if (!isSelectedChapterAvailable()) return;
  const chapter = getSelectedChapter();
  storyMode = "chapter";
  storyLines = getDialogueForChapter(chapter, player);
  storyIndex = 0;
  scene = "story";
  render();
}

function advanceStory() {
  if (storyIndex < storyLines.length - 1) {
    storyIndex += 1;
    render();
    return;
  }
  finishStory();
}

function finishStory() {
  if (storyMode.startsWith("intro")) {
    player = markIntroSeen(player);
    logLine = "序章已读。";
  } else {
    const chapter = getSelectedChapter();
    player = markChapterStorySeen(player, chapter?.id);
    logLine = `${chapter?.title || "章节"}剧情已读。`;
  }
  savePlayer(player);
  scene = "world";
  render();
}

function leaveStoryFor(nextScene) {
  finishStory();
  if (nextScene === "training") startTraining();
  else if (nextScene === "battle") startBattle();
}

function startTraining() {
  ensureRun();
  scene = "training";
  submittedResult = null;
  selectedKeys = [];
  observationHintUsed = false;
  render();
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
    el("p", "text-muted", {}, [`风险 ${build.risk} · 奖励 ${build.reward}。流派在开局前选择，本局内保持不变。`]),
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
  render();
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
  scene = "battle";
  render();
}

function getBattleResultChoices() {
  const choices = [
    [run.completed ? "查看战报" : "下一题", handleBattleAdvance, "text-choice is-primary"],
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
  });
  player = submittedResult.player;
  run = submittedResult.run;
  report = run.completed ? createRogueliteRunReport(run, player, questions) : null;
  logLine = submittedResult.isCorrect ? "提交成功。" : `答错，正解 ${submittedResult.correctAnswer}。`;
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
  submittedResult = null;
  render();
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
  storyMode = "intro";
  storyLines = getIntroDialogue();
  storyIndex = 0;
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
  render();
}

function ensureRun() {
  if (!run.nodes.length || currentNodeIndex >= run.nodes.length) resetRunForChapter();
}

function resetRunForChapter() {
  run = createRogueliteRun(questions, player, { modeId: selectedRunModeId, buildId: selectedBuildId, length: 5 });
  currentNodeIndex = 0;
  selectedKeys = [];
  observationHintUsed = false;
  submittedResult = null;
  report = null;
}

function createRunForSelectedChapter() {
  return createRogueliteRun(questions, player, { modeId: selectedRunModeId, buildId: selectedBuildId, length: 5 });
}

function getSelectedChapter() {
  return chapters.find((chapter) => chapter.id === selectedChapterId) || chapters[0] || null;
}

function isSelectedChapterAvailable() {
  const chapter = getSelectedChapter();
  const availability = getChapterAvailability(chapter, chapters, player);
  if (availability.available) return true;

  logLine = `当前题域未开放：${availability.reason}`;
  showToast(logLine);
  scene = "world";
  render();
  return false;
}

function getChapterQuestions(chapter) {
  if (!chapter) return questions;
  const topicQuestions = questions.filter((question) => question.topic === chapter.topic);
  return topicQuestions.length ? topicQuestions : questions;
}

function getCurrentNode() {
  ensureRunIndex();
  return run.nodes[currentNodeIndex] || null;
}

function getCurrentQuestion() {
  const node = getCurrentNode();
  return node ? questions.find((question) => question.id === node.questionId) || null : null;
}

function ensureRunIndex() {
  currentNodeIndex = Math.max(0, Math.min(currentNodeIndex, Math.max(0, run.nodes.length - 1)));
}

function renderBattleFeedback(question) {
  const demon = submittedResult.demonProfile;
  const content = [
    el("p", "", {}, [submittedResult.isCorrect
      ? `伤害 ${submittedResult.damage}，修为 +${submittedResult.growthXpGain}，${formatMaterials(submittedResult.materialsGain) || "无材料"}。`
      : `正解 ${question.answer}。心力 ${signed(submittedResult.heartDelta)}，${demon ? `${demon.demonType}已生成。` : "已记录复训目标。"}`]),
    submittedResult.styleFeedback ? el("p", "text-muted", {}, [submittedResult.styleFeedback]) : "",
    el("p", "text-muted", {}, [submittedResult.learningCheck]),
  ];

  if (demon) {
    content.push(
      el("p", "text-muted", {}, [`错因：${demon.errorPatternName || demon.demonType}。${demon.diagnosis}`]),
      el("p", "text-muted", {}, [`净化建议：${demon.remedy}`]),
    );
  }
  if (submittedResult.errorDiagnosis?.primary) {
    content.push(renderErrorDiagnosisPanel(submittedResult.errorDiagnosis));
  }

  return panel(submittedResult.isCorrect ? "结算：成功" : "结算：失误", content);
}

function renderErrorDiagnosisPanel(errorDiagnosis) {
  return el("div", "text-log", {}, [
    el("p", "", {}, [`失误诊断：${errorDiagnosis.primary.name} · ${errorDiagnosis.primary.probability}%`]),
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

function actionLabel(action) {
  return {
    story: "剧情",
    training: "短课",
    battle: "题阵",
    review: "心魔",
    cleared: "已通关",
  }[action] || "行动";
}

function chapterShortTitle(chapter) {
  return String(chapter?.title || "").replace(/^第[一二三四五六七八九十]+章\s*/u, "");
}

function getIntroDialogue() {
  return [
    { speakerName: "明澈", text: "这里按真实知识域备考，不再使用旧的综合知识兜底分类。" },
    { speakerName: "阿芷", text: "先短课抓题眼，再进题阵检验；答错会留下错题心魔，之后回到复盘处理。" },
    { speakerName: "青岚", text: "综合模拟会从已开放的题阵中抽题，用来训练跨知识域迁移。" },
    { speakerName: "小墨", text: "还没整理稳的旧卷先封存，别让它干扰你的记忆。" },
  ];
}

function formatMaterials(materials = {}) {
  const bag = normalizeMaterialBag(materials);
  return materialTypes
    .map((material) => [material.name, bag[material.id] || 0])
    .filter(([, value]) => value > 0)
    .map(([name, value]) => `${name}+${value}`)
    .join(" · ");
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
