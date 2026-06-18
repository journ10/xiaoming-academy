import {
  applyTrialAnswer,
  buildChapterMechanicState,
  buildKnowledgeGraphPreview,
  createDailyQuestState,
  createLearningDashboard,
  createMindDemonRun,
  createRouteRun,
  createRunReport,
  createStoryChapters,
  getArtifactRoster,
  getBlackInkCollection,
  getBondStories,
  getChapterActionState,
  getChapterAvailability,
  getChapterProgress,
  getAvailableLearningStyles,
  getDialogueForChapter,
  getEnergyState,
  getEndingOptions,
  getHeartMethod,
  getRecommendedLearningStyle,
  initialPlayerState,
  isBankMastered,
  learningStyleDefinitions,
  markChapterStorySeen,
  markIntroSeen,
  materialTypes,
  nodeTypes,
  createSaveArchive,
  parseQuestionImport,
  parseSaveArchive,
  selectRouteQuestions,
  setLearningStyle,
  stances,
  storyCharacters,
  studyNode,
  summarizeQuestionBank,
  upgradeArtifact,
} from "./core.js";

const storageKey = "xiaoming-academy-text-game-v1";
const questionBankUrl = "./data/questions.from-pdf.json";
const playableScenes = new Set(["world", "story", "training", "battle", "review", "roster", "daily", "dashboard", "report"]);
const navItems = [
  ["world", "地图"],
  ["training", "练功"],
  ["battle", "战斗"],
  ["review", "心魔"],
  ["roster", "队伍"],
  ["daily", "日课"],
  ["dashboard", "仪表"],
];

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
let currentNodeIndex = 0;
let selectedStanceId = "steady";
let selectedKeys = [];
let submittedResult = null;
let report = null;
let storyMode = scene === "story" ? "intro" : "";
let storyLines = scene === "story" ? getIntroDialogue() : [];
let storyIndex = 0;
let logLine = "题库加载中。";
let bankSummary = summarizeQuestionBank([]);

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
    bankSummary = builtInBank.summary;
    chapters = createStoryChapters(questions);
    const saved = loadSavedState();
    player = saved.player;
    selectedChapterId = saved.selectedChapterId || chapters[0]?.id || "";
    scene = resolveInitialScene() || saved.scene || (player.seenIntro ? "world" : "story");
    run = createRunForSelectedChapter();
    storyMode = scene === "story" ? "intro" : "";
    storyLines = scene === "story" ? getIntroDialogue() : [];
    storyIndex = 0;
    logLine = "先读题眼，再进题阵。";
    render();
  } catch (error) {
    questions = [];
    bankSummary = summarizeQuestionBank([]);
    chapters = [];
    player = initialPlayerState();
    selectedChapterId = "";
    scene = "world";
    run = createRouteRun([]);
    logLine = error.message || "内置题库加载失败。";
    render();
    showToast(logLine);
  }
}

async function loadBuiltInQuestionBank() {
  const response = await fetch(questionBankUrl);
  if (!response.ok) {
    throw new Error(`内置题库加载失败：${response.status}`);
  }
  const payload = await response.json();
  return {
    questions: parseQuestionImport(payload),
    summary: summarizeQuestionBank(payload),
  };
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
  const energy = getEnergyState(player);
  const materials = normalizeMaterialBag(player.materials);
  dom.hudStats.replaceChildren(
    hudStat("心力", `${player.heartPower || 0}/${player.maxHeartPower || 6}`),
    hudStat("能量", `${energy.energy}/${energy.maxEnergy}`),
    hudStat("星辉", player.starGlimmer || 0),
    hudStat("书页", materials.shuye || 0),
    hudStat("题库", `${bankSummary.playableQuestionCount}/${bankSummary.sourceTotalQuestionSlots || questions.length}`),
    hudStat("复核", bankSummary.reviewQuestionCount),
  );
}

function renderStage() {
  if (scene === "story") return renderStoryStage();
  if (scene === "training") return renderTrainingStage();
  if (scene === "battle") return renderBattleStage();
  if (scene === "review") return renderReviewStage();
  if (scene === "roster") return renderRosterStage();
  if (scene === "daily") return renderDailyStage();
  if (scene === "dashboard") return renderDashboardStage();
  if (scene === "report") return renderReport();
  return renderWorldStage();
}

function renderWorldStage() {
  const selected = getSelectedChapter();
  const action = selected ? getChapterActionState(selected, questions, player) : null;
  const selectedAvailability = selected ? getChapterAvailability(selected, chapters, player) : null;
  const chapterCards = chapters.map((chapter) => {
    const progress = getChapterProgress(chapter, questions, player);
    const state = getChapterActionState(chapter, questions, player);
    const availability = getChapterAvailability(chapter, chapters, player);
    const cardClass = [
      "text-choice",
      selectedChapterId === chapter.id ? "is-selected" : "",
      availability.available ? "" : "is-locked",
    ].filter(Boolean).join(" ");
    const button = textButton(
      `${availability.available ? "🔓" : "🔒"} ${chapter.title} · ${availability.available ? actionLabel(state.recommendedAction) : "未解锁"}`,
      () => {
        selectedChapterId = chapter.id;
        resetRunForChapter();
        render();
      },
      cardClass,
    );
    button.append(
      el("small", "", {}, [availability.available
        ? `练功 ${progress.studiedCount}/${progress.total} · 答对 ${progress.correctCount}/${progress.total} · 心魔 ${progress.demonCount}`
        : availability.reason]),
    );
    return button;
  });

  dom.stage.replaceChildren(textScreen({
    kicker: "地图",
    title: selected?.title || "真题秘卷",
    intro: selected?.summary || "选择章节，按剧情、练功、战斗、心魔的顺序推进。",
    body: [
      panel("章节", el("div", "text-choice-list", {}, chapterCards)),
      panel("当前目标", [
        el("p", "", {}, [selectedAvailability?.available ? action?.reason || "选择一章开始。" : selectedAvailability?.reason || "选择一章开始。"]),
        meter("章节完成度", getWorldProgressPercent(selected ? getChapterProgress(selected, questions, player) : null), 100),
      ]),
    ],
    choices: [
      ["读剧情", startChapterStory, "text-choice is-primary"],
      ["练功", startTraining],
      ["进入战斗", startBattle],
      ["处理心魔", () => goScene("review")],
    ],
    log: logLine,
  }));
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
      [storyIndex >= storyLines.length - 1 ? "完成剧情" : "继续", advanceStory, "text-choice is-primary"],
      ["去练功", () => leaveStoryFor("training")],
      ["去战斗", () => leaveStoryFor("battle")],
    ],
    log: logLine,
  }));
}

function renderTrainingStage() {
  ensureRun();
  const chapter = getSelectedChapter();
  const node = getCurrentNode();
  const question = getCurrentQuestion();
  if (!chapter || !node || !question) {
    dom.stage.replaceChildren(emptyScreen("没有可练题目", "内置题库加载后会自动生成练功内容。"));
    return;
  }

  const studied = (player.studiedLessonIds || []).includes(question.lesson.id);
  const trainingLog = studied && logLine.startsWith("练功完成")
    ? logLine
    : studied ? "这道题已经练过，可以直接进题阵。" : logLine;
  dom.stage.replaceChildren(textScreen({
    kicker: "练功",
    title: question.lesson.title,
    intro: question.lesson.studyPrompt,
    body: [
      panel("题眼", [
        el("p", "", {}, [question.lesson.keyPoint]),
        el("p", "text-muted", {}, [question.lesson.explanation]),
      ]),
      panel("当前阵位", [
        el("p", "", {}, [`${nodeTypes[node.type]?.name || node.typeName}：${node.nodeFlavor}`]),
        el("p", "", {}, [`章节机制：${node.mechanicName || "常规题阵"} · ${node.mechanicPrompt || "按题眼稳定检验。"}`]),
        el("p", "text-muted", {}, [node.rewardPreview || "完成后获得成长资源。"]),
      ]),
      panel("学习风格", renderLearningStyleChoices()),
    ],
    choices: [
      [studied ? "复看完成" : "完成练功", studyCurrentNode, "text-choice is-primary"],
      ["进入战斗", enterBattleAfterTraining],
      ["回地图", () => goScene("world")],
    ],
    log: trainingLog,
  }));
}

function renderBattleStage() {
  ensureRun();
  const node = getCurrentNode();
  const question = getCurrentQuestion();
  if (!node || !question) {
    dom.stage.replaceChildren(emptyScreen("没有可战斗题阵", "先选择章节，或等待内置题库加载完成。"));
    return;
  }
  const mechanicState = buildChapterMechanicState(question, player, {
    node,
    nodeType: node.type,
    reveal: selectedStanceId === "observe",
  });

  const options = question.options.map((option) => {
    const button = textButton(optionButtonLabel(question, option), () => toggleOption(option.key), getOptionClass(question, option.key));
    button.dataset.optionKey = option.key;
    return button;
  });

  dom.stage.replaceChildren(textScreen({
    kicker: "战斗",
    title: `${question.enemy} · ${nodeTypes[node.type]?.name || node.typeName} · ${node.mechanicName || "常规题阵"}`,
    intro: mechanicState.displayStem,
    body: [
      renderChapterMechanicState(mechanicState),
      panel(answerPanelTitle(question), el("div", "text-choice-list", {}, options)),
      panel("招式", el("div", "text-grid", {}, stances.map((stance) => {
        const mastery = player.stanceMastery?.[stance.id] || { level: 1 };
        return textButton(`${stance.name} Lv.${mastery.level}`, () => {
          selectedStanceId = stance.id;
          render();
        }, stance.id === selectedStanceId ? "text-choice is-selected" : "text-choice", stance.description);
      }))),
      submittedResult ? renderBattleFeedback(question) : renderBattleHint(question),
    ],
    choices: submittedResult
      ? getBattleResultChoices()
      : [
          ["释放破招", handleBattleAction, "text-choice is-primary"],
          ["回练功", startTraining],
          ["回地图", () => goScene("world")],
        ],
    log: `已选：${selectedKeys.join("") || "无"} · 招式：${getStance(selectedStanceId).name}`,
  }));
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
  if (selectedStanceId === "observe") {
    const explanation = question.lesson?.explanation || question.explanation || question.lesson?.keyPoint || "暂无解析。";
    return panel("提示", [
      el("p", "", {}, [explanation]),
      question.lesson?.keyPoint ? el("p", "text-muted", {}, [`题眼：${question.lesson.keyPoint}`]) : "",
    ]);
  }
  return panel("提示", "选择答案后释放破招。");
}

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
  return panel("章节机制", lines);
}

function renderReviewStage() {
  const demonRun = createMindDemonRun(questions, player, { title: "错题净化" });
  const demons = Object.values(player.mindDemons || {});
  dom.stage.replaceChildren(textScreen({
    kicker: "心魔",
    title: demons.length ? "错题回廊" : "暂无心魔",
    intro: demons.length ? "这些错题会保留压迫值，重新答对可以净化。" : "当前没有真实错题。先去战斗，答错后这里会出现复训目标。",
    body: [
      panel("心魔列表", demons.length
        ? el("div", "text-choice-list", {}, demons.map((demon) =>
            el("article", "text-panel", {}, [
              el("h3", "", {}, [demon.enemy]),
              el("p", "", {}, [`主题：${demon.topic || "未知"} · 压力：${demon.pressure || 0} · 错因：${demon.demonType || "未诊断"}`]),
              el("p", "text-muted", {}, [`概念：${demon.concept || "未知概念"}`]),
              el("p", "text-muted", {}, [`诊断：${demon.diagnosis || "复看题眼，确认错误来源。"}`]),
              el("p", "text-muted", {}, [`净化建议：${demon.remedy || "先练功，再净化。"}`]),
            ]),
          ))
        : "没有待处理错题。"),
    ],
    choices: [
      ["开始净化", () => startDemonBattle(demonRun), "text-choice is-primary"],
      ["去战斗制造检验", startBattle],
      ["回地图", () => goScene("world")],
    ],
    log: logLine,
  }));
}

function renderRosterStage() {
  const artifacts = getArtifactRoster(player);
  const totalBond = Object.values(player.bonds || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const inkCollection = getBlackInkCollection(chapters, player);
  const bondStories = getBondStories(player);
  const endings = getEndingOptions(chapters, player);
  dom.stage.replaceChildren(textScreen({
    kicker: "队伍",
    title: "同伴与法器",
    intro: `总羁绊 ${totalBond}。法器升级会消耗材料，但核心玩法不依赖素材。`,
    body: [
      panel("同伴", el("div", "text-grid", {}, storyCharacters.map((character) =>
        el("article", "text-panel", {}, [
          el("h3", "", {}, [character.name]),
          el("p", "", {}, [character.role]),
          el("p", "text-muted", {}, [`羁绊 ${player.bonds?.[character.id] || 0}`]),
        ]),
      ))),
      panel("法器", el("div", "text-choice-list", {}, artifacts.map((artifact) =>
        textButton(`${artifact.name} Lv.${artifact.level}`, () => upgradeArtifactAction(artifact.id), artifact.canUpgrade ? "text-choice is-primary" : "text-choice", formatCost(artifact.cost)),
      ))),
      panel("黑色墨迹", el("div", "text-log", {}, inkCollection.map((item) =>
        el("p", "", {}, [item.unlocked ? `✓ ${item.text}` : "🔒 未收集墨迹"]),
      ))),
      panel("羁绊剧情", el("div", "text-log", {}, bondStories.map((story) =>
        el("p", "", {}, [story.unlocked
          ? `✓ ${story.title}：${story.text}`
          : `🔒 ${story.characterName} 羁绊 ${story.bond}/${story.requiredBond}`]),
      ))),
      panel("结局", endings.length
        ? el("div", "text-log", {}, endings.map((ending) =>
            el("p", "", {}, [`${ending.title}：${ending.text}`]),
          ))
        : "第七章万象书阁通关后解锁双结局。"),
    ],
    choices: [
      ["回地图", () => goScene("world"), "text-choice is-primary"],
      ["去日课", () => goScene("daily")],
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
    intro: "日课和周课只负责告诉你现在最该补哪一块。",
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
      ["按日课练功", startTraining, "text-choice is-primary"],
      ["按日课战斗", startBattle],
      ["回地图", () => goScene("world")],
    ],
    log: logLine,
  }));
}

function renderDashboardStage() {
  const dashboard = createLearningDashboard(questions, player);
  const weakest = dashboard.weakestTopic;
  const topicCoverageBars = dashboard.topicCoverageBars;
  const averageTimeTrend = dashboard.averageTimeTrend;
  dom.stage.replaceChildren(textScreen({
    kicker: "仪表",
    title: "学习仪表盘",
    intro: weakest
      ? `当前优先补：${weakest.title}。心魔 ${weakest.demonCount}，心法 ${weakest.mastery}。`
      : "暂无薄弱主题，继续按章节推进。",
    body: [
      panel("总体进度", [
        statLine("题目练功", `${dashboard.questionProgress.studiedCount}/${dashboard.questionProgress.total} · ${dashboard.questionProgress.studiedPercent}%`),
        statLine("答对覆盖", `${dashboard.questionProgress.correctCount}/${dashboard.questionProgress.total} · ${dashboard.questionProgress.correctPercent}%`),
        statLine("章节封印", `${dashboard.chapterStats.clearedCount}/${dashboard.chapterStats.totalCount}`),
        statLine("心魔", `活跃 ${dashboard.demonStats.activeCount} · 已净化 ${dashboard.demonStats.purifiedCount} · 压力 ${dashboard.demonStats.totalPressure}`),
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
        statLine("样本", averageTimeTrend.samples),
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
      ["去心魔", () => goScene("review")],
      ["回地图", () => goScene("world")],
    ],
    log: "仪表盘根据本地存档实时生成，不上传数据。",
  }));
}

function renderReport() {
  const reportData = report || createRunReport(run, player);
  dom.stage.replaceChildren(textScreen({
    kicker: "战报",
    title: reportData.title,
    intro: `正确率 ${reportData.correctRate}% · 答题 ${reportData.correctCount}/${reportData.answeredCount} · 错题 ${reportData.wrongCount}`,
    body: [
      panel("本轮收益", [
        statLine("星辉", `+${reportData.starGlimmerGain}`),
        statLine("修为", `+${reportData.growthXpGain}`),
        statLine("材料", formatMaterials(reportData.materialsGain) || "无"),
        statLine("下一步", reportData.nextRecommendation.reason),
      ]),
      panel("事件", reportData.events.length
        ? el("div", "text-log", {}, reportData.events.map((event) =>
            el("p", "", {}, [`${event.topic}：${event.isCorrect ? "答对" : "答错"}，${event.learningCheck}`]),
          ))
        : "还没有战斗记录。"),
    ],
    choices: [
      ["继续战斗", startBattle, "text-choice is-primary"],
      ["去心魔", () => goScene("review")],
      ["回地图", () => goScene("world")],
    ],
    log: "战报只保留结论和下一步。"
  }));
}

function renderQuestPanel() {
  const chapter = getSelectedChapter();
  if (!chapter) {
    dom.questPanel.replaceChildren();
    return;
  }
  const progress = getChapterProgress(chapter, questions, player);
  const method = getHeartMethod(chapter.topic, progress.mastery);
  const clearedCount = chapters.filter((item) => getChapterProgress(item, questions, player).cleared).length;
  const graphPreview = buildKnowledgeGraphPreview(chapter, questions, player, { maxLines: 10 });
  dom.questPanel.replaceChildren(
    el("h2", "", {}, ["当前卷宗"]),
    questLine("章节", chapter.title),
    questLine("源题位", `${bankSummary.sourceExamCount || chapters.length} 套卷 · ${bankSummary.sourceTotalQuestionSlots || questions.length}`),
    questLine("可玩题", `${bankSummary.playableQuestionCount || questions.length} · 覆盖 ${bankSummary.sourceCoveragePercent || 0}%`),
    questLine("需复核", String(bankSummary.reviewQuestionCount || 0)),
    questLine("剧情", player.storyFlags?.[chapter.id] ? "完成" : "未读"),
    questLine("练功", `${progress.studiedCount}/${progress.total}`),
    questLine("答对", `${progress.correctCount}/${progress.total}`),
    questLine("心魔", String(progress.demonCount)),
    questLine(method.name, `${progress.mastery}/${progress.requiredMastery}`),
    questLine("总进度", isBankMastered(questions, player) ? "秘卷归元" : `${clearedCount}/${chapters.length}`),
    questLine("图谱", `${graphPreview.masteredConcepts}/${graphPreview.totalConcepts}`),
    el("h3", "", {}, ["知识图谱预览"]),
    el("pre", "knowledge-graph", {}, [graphPreview.lines.join("\n")]),
  );
}

function renderBottomNav() {
  dom.bottomNav.replaceChildren(...navItems.map(([id, label]) => {
    const button = textButton(label, () => {
      if (id === "training") startTraining();
      else if (id === "battle") startBattle();
      else goScene(id);
    }, scene === id ? "is-active" : "");
    button.dataset.navId = id;
    button.setAttribute("aria-label", `切换到${label}`);
    button.setAttribute("aria-current", scene === id ? "page" : "false");
    return button;
  }));
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
  if (!isSelectedChapterAvailable()) return;
  ensureRun();
  scene = "training";
  submittedResult = null;
  selectedKeys = [];
  render();
}

function studyCurrentNode() {
  const node = getCurrentNode();
  if (!node) return;
  const result = studyNode(player, run, node.id, { bankQuestions: questions });
  player = result.player;
  run = result.run;
  logLine = `练功完成：星辉 +${result.rewards.starGlimmerGain}，修为 +${result.rewards.growthXpGain}。${result.rewards.styleFeedback || ""}`;
  savePlayer(player);
  render();
}

function renderLearningStyleChoices() {
  const styles = getAvailableLearningStyles(player, chapters);
  const recommended = getRecommendedLearningStyle(questions, player, chapters);
  return el("div", "text-choice-list", {}, [
    el("p", "text-muted", {}, [`当前推荐：${recommended.name}。${recommended.reason}`]),
    el("div", "text-grid", {}, styles.map((style) => {
      const className = [
        "text-choice",
        player.learningStyleId === style.id ? "is-selected" : "",
        style.unlocked ? "" : "is-locked",
      ].filter(Boolean).join(" ");
      return textButton(
        `${style.unlocked ? "🔓" : "🔒"} ${style.name}`,
        () => selectLearningStyle(style.id),
        className,
        style.unlocked ? style.description : `${style.unlockReason} · ${style.description}`,
      );
    })),
  ]);
}

function selectLearningStyle(styleId) {
  try {
    player = setLearningStyle(player, styleId, { chapters });
    const style = learningStyleDefinitions.find((item) => item.id === styleId);
    logLine = `学习风格已切换：${style?.name || styleId}。`;
    savePlayer(player);
    render();
  } catch (error) {
    showToast(error.message || "学习风格切换失败");
  }
}

function enterBattleAfterTraining() {
  if (!isSelectedChapterAvailable()) return;
  scene = "battle";
  submittedResult = null;
  selectedKeys = [];
  render();
}

function startBattle() {
  if (!isSelectedChapterAvailable()) return;
  resetRunForChapter();
  scene = "battle";
  render();
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
  scene = "battle";
  render();
}

function getBattleResultChoices() {
  const choices = [
    [run.completed ? "查看战报" : "下一题", handleBattleAdvance, "text-choice is-primary"],
    ["去练功", startTraining],
  ];
  if (submittedResult?.errorDiagnosis?.primary) {
    choices.push(["直接净化", () => startDemonBattle(createMindDemonRun(questions, player, { title: "诊断净化" }))]);
  }
  choices.push(["回地图", () => goScene("world")]);
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
    stanceId: selectedStanceId,
    bankQuestions: questions,
  });
  player = submittedResult.player;
  run = submittedResult.run;
  report = run.completed ? createRunReport(run, player) : null;
  logLine = submittedResult.isCorrect ? "破招成功。" : `答错，正解 ${submittedResult.correctAnswer}。`;
  savePlayer(player);
  render();
}

function handleBattleAdvance() {
  if (run.completed) {
    report = createRunReport(run, player);
    scene = "report";
    render();
    return;
  }
  currentNodeIndex = Math.min(run.nodes.length - 1, currentNodeIndex + 1);
  selectedKeys = [];
  submittedResult = null;
  render();
}

function upgradeArtifactAction(id) {
  try {
    const result = upgradeArtifact(player, id);
    player = result.player;
    logLine = `${result.artifact.name} 升到 Lv.${result.artifact.level}。`;
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
      log: `题库固定内置，存档码只包含进度。`,
    }));
    field.focus();
    field.select();
  } catch (error) {
    showToast(error.message || "导出失败");
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
    log: `题库固定内置，导入不会替换题库。`,
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
    log: "导出内容是纯文本，不包含题库原文全量数据。",
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
    `题目练功：${dashboard.questionProgress.studiedCount}/${dashboard.questionProgress.total}`,
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
      lines.push(`   建议：先回练功，再进心魔回廊净化。`);
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
    showToast(error.message || "导入存档失败");
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
  scene = "story";
  savePlayer(player);
  render();
}

function goScene(nextScene) {
  const normalized = normalizeSceneId(nextScene);
  if (!normalized) return;
  scene = normalized;
  if (scene !== "battle") submittedResult = null;
  render();
}

function ensureRun() {
  if (!run.nodes.length || currentNodeIndex >= run.nodes.length) resetRunForChapter();
}

function resetRunForChapter() {
  run = createRunForSelectedChapter();
  currentNodeIndex = 0;
  selectedKeys = [];
  submittedResult = null;
  report = null;
}

function createRunForSelectedChapter() {
  const chapter = getSelectedChapter();
  const bank = getChapterQuestions(chapter);
  if (chapter && !getChapterAvailability(chapter, chapters, player).available) {
    return createRouteRun([], {
      title: chapter?.title || "今日破阵",
      length: 5,
    });
  }
  const selectedQuestions = selectRouteQuestions(bank.length ? bank : questions, player, { length: 5 });
  return createRouteRun(selectedQuestions, {
    title: chapter?.title || "今日破阵",
    length: 5,
  });
}

function getSelectedChapter() {
  return chapters.find((chapter) => chapter.id === selectedChapterId) || chapters[0] || null;
}

function isSelectedChapterAvailable() {
  const chapter = getSelectedChapter();
  const availability = getChapterAvailability(chapter, chapters, player);
  if (availability.available) return true;

  logLine = `章节未解锁：${availability.reason}`;
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
      ? `伤害 ${submittedResult.damage}，星辉 +${submittedResult.starGlimmerGain}，修为 +${submittedResult.growthXpGain}。`
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
    el("p", "", {}, [`错误诊断：${errorDiagnosis.primary.name} · ${errorDiagnosis.primary.probability}%`]),
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
    el("footer", "", {}, [
      el("div", "text-choice-list", {}, choices.map(([label, onClick, className = "text-choice"]) =>
        textButton(label, onClick, className),
      )),
      log ? el("div", "text-log", {}, [log]) : "",
    ]),
  ]);
}

function emptyScreen(title, detail) {
  return textScreen({
    kicker: "空",
    title,
    intro: detail,
    choices: [["回地图", () => goScene("world"), "text-choice is-primary"]],
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

function getStance(id) {
  return stances.find((stance) => stance.id === id) || stances[0];
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
    training: "练功",
    battle: "战斗",
    review: "心魔",
    cleared: "已通关",
  }[action] || "行动";
}

function getIntroDialogue() {
  return [
    { speakerName: "明澈", text: "小明书院是一座显化书院。知识会变成秘境，遗忘会凝成雾。" },
    { speakerName: "阿芷", text: "先练功，把讲解拆成题眼。战斗应该是检验，不是硬猜。" },
    { speakerName: "青岚", text: "破阵时选稳破、强攻或观照。答错会留下心魔，之后要回来处理。" },
    { speakerName: "小墨", text: "六章全亮，代表题库里的题都练过、答对过、清过心魔。" },
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
  if (Number(rewards.starGlimmer || 0) > 0) parts.push(`星辉+${rewards.starGlimmer}`);
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
  if (!text) throw new Error("存档码为空");
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
      scene: normalizeSceneId(fallback.scene) || (fallback.player.seenIntro ? "world" : "story"),
    };
  } catch {
    return {
      ...parseSaveArchive({
        player: initialPlayerState(),
        scene: "",
      }, { questions }),
      scene: "story",
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
