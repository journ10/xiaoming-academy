import {
  applyTrialAnswer,
  createDailyChallenges,
  createMindDemonRun,
  createRouteRun,
  createRunReport,
  createStoryChapters,
  getArtifactRoster,
  getChapterActionState,
  getChapterProgress,
  getDialogueForChapter,
  getEnergyState,
  getHeartMethod,
  getPlayerTitle,
  initialPlayerState,
  isBankMastered,
  markChapterStorySeen,
  markIntroSeen,
  materialTypes,
  nodeTypes,
  parseQuestionImport,
  prepareQuestions,
  prunePlayerForQuestions,
  stances,
  storyCharacters,
  studyNode,
  upgradeArtifact,
} from "./core.js";
import { sampleQuestions } from "./sample-data.js";
import { getAssetPath } from "./src/assets.js";

const storageKey = "xiaoming-academy-rpg-v4";
const runLength = 9;
const chapterPositions = [
  [17, 58],
  [31, 33],
  [47, 54],
  [61, 28],
  [74, 56],
  [88, 32],
];
const topicDemonAssets = {
  教育法规: "demon.law",
  教育心理学: "demon.psych",
  教学设计: "demon.design",
  教师职业道德: "demon.ethics",
  班级管理: "demon.classroom",
  儿童发展: "demon.child",
};

const dom = {
  shell: document.querySelector("[data-shell]"),
  stage: document.querySelector("[data-stage]"),
  questPanel: document.querySelector("[data-quest-panel]"),
  hudStats: document.querySelector("[data-hud-stats]"),
  bottomNav: document.querySelector("[data-bottom-nav]"),
  sourceLabel: document.querySelector("[data-source-label]"),
  questionCount: document.querySelector("[data-question-count]"),
  importAction: document.querySelector("[data-import-action]"),
  helpAction: document.querySelector("[data-help-action]"),
  resetAction: document.querySelector("[data-reset-action]"),
  fileInput: document.querySelector("[data-file-input]"),
  dialogueDock: document.querySelector("[data-dialogue-dock]"),
  dialogueAvatar: document.querySelector("[data-dialogue-avatar]"),
  dialogueSpeaker: document.querySelector("[data-dialogue-speaker]"),
  dialogueText: document.querySelector("[data-dialogue-text]"),
  dialogueNext: document.querySelector("[data-dialogue-next]"),
  dialogueSkip: document.querySelector("[data-dialogue-skip]"),
  reportLayer: document.querySelector("[data-report-layer]"),
  reportClose: document.querySelector("[data-report-close]"),
  reportTitle: document.querySelector("[data-report-title]"),
  reportStats: document.querySelector("[data-report-stats]"),
  reportEvents: document.querySelector("[data-report-events]"),
  reportNote: document.querySelector("[data-report-note]"),
  toast: document.querySelector("[data-toast]"),
};

let questions = prepareQuestions(sampleQuestions);
let chapters = createStoryChapters(questions);
let questionSource = "样例题库";
let player = loadPlayer();
let selectedChapterId = chapters[0]?.id || "";
let scene = player.seenIntro ? "world" : "story";
let dialogueKind = player.seenIntro ? "" : "intro";
let dialogueLines = player.seenIntro ? [] : getIntroDialogue();
let dialogueIndex = 0;
let run = createRunForSelectedChapter();
let currentNodeIndex = 0;
let selectedStanceId = "steady";
let selectedKeys = [];
let submittedResult = null;
let report = null;
let transientEffect = "";

dom.importAction.addEventListener("click", () => dom.fileInput.click());
dom.fileInput.addEventListener("change", importQuestions);
dom.resetAction.addEventListener("click", resetProgress);
dom.helpAction.addEventListener("click", () => startIntro(true));
dom.dialogueNext.addEventListener("click", advanceDialogue);
dom.dialogueSkip.addEventListener("click", finishDialogue);
dom.reportClose.addEventListener("click", closeReport);

document.addEventListener("keydown", (event) => {
  const number = Number(event.key);
  const question = getCurrentQuestion();
  if (scene !== "battle" || submittedResult || !question || Number.isNaN(number)) return;
  if (number >= 1 && number <= question.options.length) {
    toggleOption(question.options[number - 1].key);
  }
});

render();

function render() {
  chapters = createStoryChapters(questions);
  if (!chapters.some((chapter) => chapter.id === selectedChapterId)) {
    selectedChapterId = chapters[0]?.id || "";
  }

  dom.shell.dataset.scene = scene;
  dom.shell.dataset.effect = transientEffect;
  dom.sourceLabel.textContent = questionSource;
  dom.questionCount.textContent = `${questions.length} 题 · ${chapters.length} 章`;

  renderHud();
  renderStage();
  renderQuestPanel();
  renderDialogue();
  renderBottomNav();
  renderReport();
}

function renderHud() {
  const energy = getEnergyState(player);
  const materials = normalizeMaterialBag(player.materials);
  dom.hudStats.replaceChildren(
    hudStat("称号", getPlayerTitle(player)),
    hudStat("等级", `Lv.${player.playerLevel || 1}`),
    hudStat("心力", `${player.heartPower || 0}/${player.maxHeartPower || 6}`, player.heartPower <= 2 ? "low" : ""),
    hudStat("能量", `${energy.energy}/${energy.maxEnergy}`, energy.status),
    hudStat("星辉", player.starGlimmer || 0),
    hudStat("灵页", materials.shuye),
    hudStat("星砂", materials.xingsha),
    hudStat("墨玉", materials.moyu),
  );
}

function renderStage() {
  dom.stage.className = `game-stage scene-${scene}`;
  if (scene === "story") return renderStoryStage();
  if (scene === "training") return renderTrainingStage();
  if (scene === "battle") return renderBattleStage();
  if (scene === "review") return renderReviewStage();
  if (scene === "roster") return renderRosterStage();
  if (scene === "daily") return renderDailyStage();
  return renderWorldStage();
}

function renderWorldStage() {
  const selected = getSelectedChapter();
  const action = selected ? getChapterActionState(selected, questions, player) : null;
  const character = getCharacter(selected?.characterId);
  const daily = createDailyChallenges(questions, player);

  dom.stage.replaceChildren(
    sceneBackground("bg.academyGate"),
    ambientLayer(),
    el("section", "map-board", {}, [
      el("div", "map-board-head", {}, [
        el("span", "eyebrow", {}, ["主线巡游"]),
        el("h2", "", {}, ["真题秘卷"]),
        el("p", "", {}, ["六章星印全部点亮后，才代表当前题库已完成练功、检验与错题净化。"]),
      ]),
      createWorldMap(),
      el("div", "ink-clue", {}, [
        el("img", "", { src: assetSrc("ink.mark"), alt: "" }),
        el("span", "", {}, [getInkClueText()]),
      ]),
    ]),
    el("aside", "daily-card", {}, [
      el("span", "eyebrow", {}, ["今日修行"]),
      el("h3", "", {}, [daily[0]?.title || "晨课三问"]),
      progressBar(daily[0]?.progress.current || 0, daily[0]?.progress.target || 1),
      el("p", "", {}, [daily[0]?.description || "完成短课并积累材料。"]),
      actionButton("查看日课", () => goScene("daily"), "mini-action"),
    ]),
    el("img", "world-standee", { src: standeePath(character.id), alt: character.name }),
    el("section", "world-callout", {}, [
      el("span", "eyebrow", {}, [character.name]),
      el("h2", "", {}, [selected?.title || "秘卷失光"]),
      el("p", "", {}, [action?.reason || "选择一个章节开始巡游。"]),
      createActionBar(action),
    ]),
  );
}

function renderStoryStage() {
  const selected = getSelectedChapter();
  const line = dialogueLines[dialogueIndex] || dialogueLines[0] || getIntroDialogue()[0];
  const isIntro = dialogueKind.startsWith("intro");
  const sideCharacterId = line.speakerId === "mingche" ? "azhi" : "mingche";
  dom.stage.replaceChildren(
    sceneBackground(isIntro ? "bg.academyGate" : getChapterBackgroundAsset(selected), "story"),
    ambientLayer("story"),
    el("section", "story-progress", {}, [
      el("img", "", { src: assetSrc("seal.glowing"), alt: "" }),
      el("div", "", {}, [
        el("strong", "", {}, [isIntro ? "序章" : selected?.title || "主线剧情"]),
        el("span", "", {}, [`${dialogueIndex + 1}/${Math.max(1, dialogueLines.length)}`]),
      ]),
      el("b", "", {}, []),
      el("b", "", {}, []),
      el("b", "", {}, []),
    ]),
    el("section", "story-title-panel", {}, [
      el("span", "eyebrow", {}, [dialogueKind === "intro" ? "序章" : "主线剧情"]),
      el("h2", "", {}, [dialogueKind === "intro" ? "秘卷失光" : selected?.title || "章节剧情"]),
      el("p", "", {}, [`${dialogueIndex + 1}/${Math.max(1, dialogueLines.length)} · ${line.speakerName}`]),
    ]),
    el("img", "story-side-standee", { src: standeePath(sideCharacterId), alt: getCharacter(sideCharacterId).name }),
    el("img", "story-standee", { src: line.standee, alt: line.speakerName }),
    el("div", "story-choices", {}, [
      actionButton("选择回应", advanceDialogue, "story-choice"),
      actionButton("选择回应", advanceDialogue, "story-choice"),
    ]),
    el("div", "story-glow", {}, []),
  );
}

function renderTrainingStage() {
  const chapter = getSelectedChapter();
  const node = getCurrentNode();
  const question = getCurrentQuestion();
  if (!chapter || !node || !question) {
    dom.stage.replaceChildren(emptyStage("本章暂无可练题目", "导入题库后会自动生成章节任务。"));
    return;
  }

  const studied = player.studiedLessonIds?.includes(question.lesson.id);
  dom.stage.replaceChildren(
    sceneBackground("bg.training", "training"),
    ambientLayer(),
    el("img", "coach-standee", { src: standeePath("azhi"), alt: "阿芷" }),
    el("section", "lesson-book", {}, [
      el("div", "lesson-head", {}, [
        el("span", "eyebrow", {}, [`${chapter.title} · 阿芷短课`]),
        el("h2", "", {}, [question.lesson.title]),
        el("strong", "", {}, [studied ? "已练功" : "待练功"]),
      ]),
      el("div", "lesson-cards", {}, [
        lessonCard("题眼", question.lesson.keyPoint),
        lessonCard("出处", question.lesson.sourceRef),
        lessonCard("动作", question.lesson.studyPrompt),
      ]),
      el("p", "lesson-explain", {}, [question.lesson.explanation]),
      el("div", "node-ribbon", {}, run.nodes.map((item, index) => renderRouteNodePip(item, index))),
      el("div", "stage-actions", {}, [
        actionButton(studied ? "复看完成" : "完成练功", studyCurrentNode, "primary-action"),
        actionButton("进入题阵", startBattle, "secondary-action"),
      ]),
    ]),
  );
}

function renderBattleStage() {
  const node = getCurrentNode();
  const question = getCurrentQuestion();
  if (!node || !question) {
    dom.stage.replaceChildren(emptyStage("没有可战斗题阵", "选择章节或导入题库后再进入战斗。"));
    return;
  }

  const demonAsset = topicDemonAssets[question.topic] || "demon.mixed";
  dom.stage.replaceChildren(
    sceneBackground("bg.battle"),
    ambientLayer("battle"),
    el("section", "enemy-arena", {}, [
      el("div", submittedResult?.isCorrect ? "enemy-orbit is-hit" : "enemy-orbit", {}, [
        el("img", "enemy-art", { src: assetSrc(demonAsset), alt: question.enemy }),
      ]),
      el("div", "enemy-nameplate", {}, [
        el("strong", "", {}, [question.enemy]),
        el("span", "", {}, [`${nodeTypes[node.type]?.name || "题阵"} · 第 ${currentNodeIndex + 1}/${run.nodes.length} 阵`]),
      ]),
    ]),
    el("img", "battle-ally", { src: standeePath("qinglan"), alt: "青岚" }),
    el("section", "battle-scroll", {}, [
      el("div", "battle-meta", {}, [
        el("span", "", {}, [`${question.year} · ${question.type}`]),
        el("strong", "", {}, [question.topic]),
        el("em", "", {}, [node.rewardPreview || "星辉与心法"]),
      ]),
      el("h2", "", {}, [question.stem]),
      renderStanceStrip(question),
      renderOptions(question),
      renderBattleFeedback(question),
      el("div", "stage-actions", {}, [
        actionButton(submittedResult ? (run.completed ? "查看战报" : "下一阵") : "释放破招", handleBattleAction, "primary-action"),
        actionButton("回地图", () => goScene("world"), "secondary-action"),
      ]),
    ]),
  );
}

function renderReviewStage() {
  const demons = Object.values(player.mindDemons || {});
  const activeDemon = demons[0] || null;
  const question = activeDemon ? questions.find((item) => item.id === activeDemon.questionId) : null;
  const demonAsset = activeDemon ? topicDemonAssets[activeDemon.topic] || "demon.mixed" : "demon.mixed";

  dom.stage.replaceChildren(
    sceneBackground("bg.demonCorridor", "demon"),
    ambientLayer("demon"),
    el("aside", "demon-list", {}, [
      el("span", "eyebrow", {}, ["当前心魔"]),
      ...(demons.length ? demons.map(renderDemonListItem) : [el("article", "demon-list-item empty", {}, ["答错后，心魔会在这里显形。"])]),
    ]),
    el("section", "demon-arena", {}, [
      el("img", "demon-main", { src: assetSrc(demonAsset), alt: activeDemon?.enemy || "混合心魔" }),
      el("div", "demon-pressure", {}, [
        el("strong", "", {}, [activeDemon ? `${activeDemon.pressure * 12}%` : "0%"]),
        el("span", "", {}, [activeDemon ? "压迫值" : "无活跃心魔"]),
      ]),
    ]),
    el("section", "purify-contract", {}, [
      el("span", "eyebrow", {}, ["心魔回廊"]),
      el("h2", "", {}, [activeDemon?.enemy || "当前没有心魔"]),
      el("p", "", {}, [question?.stem || "答错的题会生成复训目标。连续答对两次即可净化。"]),
      activeDemon ? progressBar(activeDemon.purifyCount || 0, 2) : progressBar(1, 1),
      question ? el("div", "contract-options", {}, question.options.map((option) => el("span", "", {}, [`${option.key}. ${option.text}`]))) : el("div", "contract-options", {}, []),
      el("div", "stage-actions", {}, [
        actionButton("回看讲解", startTraining, "secondary-action", !activeDemon),
        actionButton("开始净化", enterDemonRun, "primary-action", !activeDemon),
      ]),
    ]),
    el("section", "xiaomo-strip", {}, [
      el("img", "", { src: avatarPath("xiaomo"), alt: "小墨" }),
      el("p", "", {}, [activeDemon ? "先看题眼，再净化心魔。错题不是失败，是秘卷正在提醒你。" : "现在很安静。保持练功，别让黑墨积起来。"]),
    ]),
  );
}

function renderRosterStage() {
  const artifacts = getArtifactRoster(player);
  dom.stage.replaceChildren(
    sceneBackground("bg.roster", "roster"),
    ambientLayer(),
    el("section", "companions-panel", {}, [
      el("div", "panel-head", {}, [
        el("span", "eyebrow", {}, ["同伴"]),
        el("h2", "", {}, ["书院小队"]),
      ]),
      el("div", "companion-grid", {}, storyCharacters.map(renderCompanionCard)),
    ]),
    el("section", "artifacts-panel", {}, [
      el("div", "panel-head", {}, [
        el("span", "eyebrow", {}, ["秘宝"]),
        el("h2", "", {}, ["法器升级"]),
      ]),
      el("div", "artifact-grid", {}, artifacts.map(renderArtifactCard)),
      renderMaterialShelf(),
    ]),
  );
}

function renderDailyStage() {
  const challenges = createDailyChallenges(questions, player);
  dom.stage.replaceChildren(
    sceneBackground("bg.daily", "daily"),
    ambientLayer(),
    el("section", "daily-board", {}, [
      el("div", "panel-head centered", {}, [
        el("span", "eyebrow", {}, ["每日挑战"]),
        el("h2", "", {}, ["每日 05:00 刷新"]),
      ]),
      el("div", "daily-grid", {}, challenges.map(renderDailyChallenge)),
      el("footer", "", {}, [
        el("span", "", {}, [`完成全部 ${challenges.length} 项可领取额外奖励`]),
        renderMaterialShelf("compact"),
      ]),
    ]),
    el("section", "weekly-trial", {}, [
      el("span", "eyebrow", {}, ["本周试炼"]),
      el("h2", "", {}, [getSelectedChapter()?.title || "律令花窗"]),
      el("p", "", {}, ["混合章节路线 · 推荐先完成练功再挑战"]),
      el("img", "", { src: assetSrc("seal.glowing"), alt: "" }),
      el("div", "trial-road", {}, [0, 1, 2, 3].map((index) => el("span", index === 0 ? "is-active" : "", {}, [`第${index + 1}关`]))),
      actionButton("开始今日巡游", startDailyRun, "primary-action"),
    ]),
  );
}

function renderQuestPanel() {
  const chapter = getSelectedChapter();
  if (!chapter) {
    dom.questPanel.replaceChildren();
    return;
  }

  const progress = getChapterProgress(chapter, questions, player);
  const action = getChapterActionState(chapter, questions, player);
  const clearedCount = chapters.filter((item) => getChapterProgress(item, questions, player).cleared).length;
  const mastered = isBankMastered(questions, player);
  const method = getHeartMethod(chapter.topic, progress.mastery);

  dom.questPanel.replaceChildren(
    el("span", "eyebrow", {}, [sceneLabel(scene)]),
    el("h2", "", {}, [chapter.title]),
    el("p", "quest-reason", {}, [action.reason]),
    questLine("剧情", player.storyFlags?.[chapter.id] ? "完成" : "未触发"),
    questLine("练功", `${progress.studiedCount}/${progress.total}`),
    questLine("检验", `${progress.correctCount}/${progress.total}`),
    questLine("心魔", `${progress.demonCount}`),
    questLine(method.name, `${progress.mastery}/${progress.requiredMastery}`),
    el("div", mastered ? "mastery-seal is-complete" : "mastery-seal", {}, [
      el("img", "", { src: assetSrc(mastered ? "seal.glowing" : "seal.unlocked"), alt: "" }),
      el("strong", "", {}, [mastered ? "秘卷归元" : `章节星印 ${clearedCount}/${chapters.length}`]),
    ]),
  );
}

function renderDialogue() {
  const visible = scene === "story" && dialogueLines.length > 0;
  dom.dialogueDock.hidden = !visible;
  if (!visible) return;
  const line = dialogueLines[dialogueIndex] || dialogueLines[0];
  dom.dialogueAvatar.src = line.avatar;
  dom.dialogueAvatar.alt = line.speakerName;
  dom.dialogueSpeaker.textContent = line.speakerName;
  dom.dialogueText.textContent = line.text;
  dom.dialogueNext.textContent = dialogueIndex >= dialogueLines.length - 1 ? "完成" : "继续";
}

function renderBottomNav() {
  const items = [
    ["world", "地图", "node.normal"],
    ["story", "剧情", "seal.unlocked"],
    ["training", "修行", "item.shuye"],
    ["battle", "战斗", "node.trial"],
    ["review", "心魔", "node.demon"],
    ["roster", "同伴", "artifact.biling"],
    ["daily", "日课", "item.lingqian"],
  ];
  dom.bottomNav.replaceChildren(
    ...items.map(([id, label, assetId]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = scene === id ? "is-active" : "";
      button.append(el("img", "", { src: assetSrc(assetId), alt: "" }), el("span", "", {}, [label]));
      button.addEventListener("click", () => {
        if (id === "battle") startBattle();
        else if (id === "training") startTraining();
        else if (id === "story") startChapterStory();
        else goScene(id);
      });
      return button;
    }),
  );
}

function createWorldMap() {
  return el("div", "chapter-nodes", {}, chapters.map((chapter, index) => {
    const progress = getChapterProgress(chapter, questions, player);
    const action = getChapterActionState(chapter, questions, player);
    const [x, y] = chapterPositions[index % chapterPositions.length];
    const assetId = progress.cleared ? "seal.glowing" : player.storyFlags?.[chapter.id] ? "seal.unlocked" : "seal.locked";
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "map-node",
      selectedChapterId === chapter.id ? "is-active" : "",
      progress.cleared ? "is-cleared" : "",
      `is-${action.recommendedAction}`,
    ].filter(Boolean).join(" ");
    button.style.setProperty("--x", `${x}%`);
    button.style.setProperty("--y", `${y}%`);
    button.addEventListener("click", () => {
      selectedChapterId = chapter.id;
      resetRunForChapter();
      render();
    });
    button.append(
      el("img", "", { src: assetSrc(assetId), alt: "" }),
      el("strong", "", {}, [String(index + 1).padStart(2, "0")]),
      el("span", "", {}, [chapter.title.replace(/^第.章\s*/, "")]),
      el("small", "", {}, [actionLabel(action.recommendedAction)]),
    );
    return button;
  }));
}

function createActionBar(action) {
  return el("div", "stage-actions", {}, [
    actionButton("剧情", startChapterStory, action?.recommendedAction === "story" ? "primary-action" : "secondary-action"),
    actionButton("练功", startTraining, action?.recommendedAction === "training" ? "primary-action" : "secondary-action"),
    actionButton("战斗", startBattle, action?.recommendedAction === "battle" ? "primary-action" : "secondary-action"),
    actionButton("心魔", () => goScene("review"), action?.recommendedAction === "review" ? "primary-action" : "secondary-action"),
  ]);
}

function renderStanceStrip(question) {
  return el("div", "skill-strip", {}, stances.map((stance) => {
    const mastery = player.stanceMastery?.[stance.id] || { xp: 0, level: 1 };
    const progress = mastery.xp % 45;
    const button = document.createElement("button");
    button.type = "button";
    button.className = stance.id === selectedStanceId ? "skill-card is-active" : "skill-card";
    button.disabled = Boolean(submittedResult);
    button.addEventListener("click", () => {
      selectedStanceId = stance.id;
      render();
    });
    button.append(
      el("strong", "", {}, [stance.name]),
      el("span", "", {}, [stance.providesHint ? `题眼：${question.lesson.keyPoint}` : stance.description]),
      el("em", "", {}, [`Lv.${mastery.level}`]),
      el("i", "", { style: `--value:${Math.round((progress / 45) * 100)}%` }, []),
    );
    return button;
  }));
}

function renderOptions(question) {
  return el("div", "answer-runes", {}, question.options.map((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.optionKey = option.key;
    button.className = getOptionClass(question, option.key);
    button.disabled = Boolean(submittedResult);
    button.addEventListener("click", () => toggleOption(option.key));
    button.append(el("strong", "", {}, [option.key]), el("span", "", {}, [option.text]));
    return button;
  }));
}

function renderBattleFeedback(question) {
  if (!submittedResult) {
    return el("div", "battle-feedback empty-feedback", {}, [
      el("strong", "", {}, ["等待破招"]),
      el("span", "", {}, ["先选招式，再点答案符文。练功后的题眼会进入结算。"]),
    ]);
  }

  const materialsText = formatMaterials(submittedResult.materialsGain);
  return el("div", submittedResult.isCorrect ? "battle-feedback is-correct" : "battle-feedback is-wrong", {}, [
    el("strong", "", {}, [submittedResult.isCorrect ? "破招成功" : `心魔反噬 · 正解 ${question.answer}`]),
    el("span", "", {}, [submittedResult.isCorrect
      ? `伤害 ${submittedResult.damage} · 星辉 +${submittedResult.starGlimmerGain} · 修为 +${submittedResult.growthXpGain} · ${materialsText || "心法提升"}`
      : `能量 ${signed(submittedResult.energyDelta)} · 本次无成长奖励 · 已生成复训目标`]),
    el("p", "", {}, [submittedResult.learningCheck]),
  ]);
}

function renderCompanionCard(character) {
  const bond = Number(player.bonds?.[character.id] || 0);
  const level = getBondLevel(bond);
  return el("article", `companion-card tone-${character.id}`, {}, [
    el("img", "", { src: avatarPath(character.id), alt: character.name }),
    el("div", "", {}, [
      el("span", "eyebrow", {}, [character.role]),
      el("h3", "", {}, [character.name]),
      el("p", "", {}, [getBondLine(character.id, level)]),
      progressBar(bond, Math.max(20, Math.ceil((bond + 1) / 20) * 20)),
      el("strong", "", {}, [`羁绊 ${bond} · ${level}`]),
    ]),
  ]);
}

function renderArtifactCard(artifact) {
  return el("article", "artifact-card", {}, [
    el("img", "", { src: assetSrc(artifact.assetId), alt: artifact.name }),
    el("span", "eyebrow", {}, [artifact.description]),
    el("h3", "", {}, [artifact.name]),
    el("strong", "", {}, [`Lv.${artifact.level}`]),
    el("p", "", {}, [`升级消耗：${formatMaterials(artifact.cost) || "已满级"}`]),
    actionButton(artifact.canUpgrade ? "升级" : "材料不足", () => upgradeArtifactAction(artifact.id), "mini-action", !artifact.canUpgrade),
  ]);
}

function renderDailyChallenge(challenge) {
  return el("article", "daily-task", {}, [
    el("div", "task-ring", { style: `--value:${Math.round((challenge.progress.current / challenge.progress.target) * 100)}%` }, [
      el("strong", "", {}, [`${challenge.progress.current}/${challenge.progress.target}`]),
    ]),
    el("h3", "", {}, [challenge.title]),
    el("p", "", {}, [challenge.description]),
    el("span", "", {}, [formatMaterials(challenge.rewards.materials)]),
  ]);
}

function renderMaterialShelf(tone = "") {
  const materials = normalizeMaterialBag(player.materials);
  return el("div", tone ? `material-shelf ${tone}` : "material-shelf", {}, materialTypes.map((material) =>
    el("span", "", {}, [
      el("img", "", { src: assetSrc(material.assetId), alt: "" }),
      `${material.name} ${materials[material.id] || 0}`,
    ]),
  ));
}

function renderRouteNodePip(node, index) {
  return el("button", currentNodeIndex === index ? "route-pip is-active" : "route-pip", { type: "button" }, [
    el("img", "", { src: assetSrc(node.assetId || `node.${node.type}`), alt: "" }),
    el("span", "", {}, [nodeTypes[node.type]?.name || node.typeName]),
  ]);
}

function renderDemonListItem(demon) {
  const assetId = topicDemonAssets[demon.topic] || "demon.mixed";
  return el("article", "demon-list-item", {}, [
    el("img", "", { src: assetSrc(assetId), alt: "" }),
    el("strong", "", {}, [demon.enemy]),
    el("span", "", {}, [`压迫 ${demon.pressure} · 净化 ${demon.purifyCount || 0}/2`]),
    progressBar(demon.purifyCount || 0, 2),
  ]);
}

function renderReport() {
  dom.reportLayer.hidden = !report;
  if (!report) return;
  dom.reportTitle.textContent = report.title;
  dom.reportStats.replaceChildren(
    reportStat("破阵率", `${report.correctRate}%`),
    reportStat("答题", `${report.correctCount}/${report.answeredCount}`),
    reportStat("星辉", `+${report.starGlimmerGain}`),
    reportStat("修为", `+${report.growthXpGain}`),
    reportStat("灵页", `+${report.materialsGain?.shuye || 0}`),
    reportStat("招式", `+${report.stanceMasteryGain || 0}`),
  );
  dom.reportEvents.replaceChildren(...report.events.slice(-6).map((event) =>
    el("article", event.isCorrect ? "report-event is-correct" : "report-event is-wrong", {}, [
      el("strong", "", {}, [event.topic]),
      el("span", "", {}, [`${event.isCorrect ? "命中" : "失手"} · ${event.studiedBeforeBattle ? "已练功" : "未练功"} · ${formatMaterials(event.materialsGain) || "无掉落"}`]),
    ]),
  ));
  dom.reportNote.textContent = `下一步：${report.nextRecommendation.topic} · ${report.nextRecommendation.reason}`;
}

function startIntro(forced = false) {
  scene = "story";
  dialogueKind = forced ? "intro-forced" : "intro";
  dialogueLines = getIntroDialogue();
  dialogueIndex = 0;
  render();
}

function startChapterStory() {
  const chapter = getSelectedChapter();
  if (!chapter) return;
  scene = "story";
  dialogueKind = "chapter";
  dialogueLines = getDialogueForChapter(chapter, player);
  dialogueIndex = 0;
  render();
}

function advanceDialogue() {
  if (dialogueIndex < dialogueLines.length - 1) {
    dialogueIndex += 1;
    render();
    return;
  }
  finishDialogue();
}

function finishDialogue() {
  if (dialogueKind.startsWith("intro")) {
    player = markIntroSeen(player);
  }
  if (dialogueKind === "chapter") {
    player = markChapterStorySeen(player, selectedChapterId);
  }
  savePlayer(player);
  scene = "world";
  dialogueKind = "";
  dialogueLines = [];
  dialogueIndex = 0;
  render();
}

function startTraining() {
  scene = "training";
  ensureChapterRun();
  render();
}

function studyCurrentNode() {
  const node = getCurrentNode();
  if (!node) return;
  const result = studyNode(player, run, node.id, { bankQuestions: questions });
  player = result.player;
  run = result.run;
  savePlayer(player);
  playEffect("learn");
  showToast(result.rewards.starGlimmerGain ? `短课完成：${formatMaterials(result.rewards.materialsGain)} · 阿芷羁绊提升` : "已复看题眼");
  render();
}

function startBattle() {
  scene = "battle";
  ensureChapterRun();
  render();
}

function startDailyRun() {
  const selected = selectDailyQuestions();
  if (!selected.length) {
    showToast("当前没有可挑战题目");
    return;
  }
  run = createRouteRun(selected, { length: Math.min(runLength, selected.length), title: "今日巡游" });
  currentNodeIndex = 0;
  selectedKeys = [];
  selectedStanceId = "steady";
  submittedResult = null;
  scene = "battle";
  render();
}

function handleBattleAction() {
  if (submittedResult) {
    advanceNode();
    return;
  }
  const node = getCurrentNode();
  const question = getCurrentQuestion();
  if (!node || !question) return;
  if (!selectedKeys.length) {
    showToast("先选择答案符文");
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
  savePlayer(player);
  playEffect(submittedResult.isCorrect ? "hit" : "wrong");
  render();
}

function advanceNode() {
  if (run.completed || currentNodeIndex >= run.nodes.length - 1) {
    report = createRunReport(run, player);
    render();
    return;
  }
  currentNodeIndex += 1;
  selectedKeys = [];
  submittedResult = null;
  render();
}

function enterDemonRun() {
  const demonRun = createMindDemonRun(questions, player);
  if (!demonRun.nodes.length) {
    showToast("当前没有心魔");
    return;
  }
  run = demonRun;
  currentNodeIndex = 0;
  selectedKeys = [];
  selectedStanceId = "steady";
  submittedResult = null;
  scene = "battle";
  render();
}

function closeReport() {
  report = null;
  resetRunForChapter();
  scene = "world";
  render();
}

function goScene(nextScene) {
  if (nextScene === "training") return startTraining();
  if (nextScene === "battle") return startBattle();
  scene = nextScene;
  render();
}

function resetProgress() {
  if (!window.confirm("确定重置巡游进度、星辉、心魔、羁绊和法器材料吗？")) return;
  player = initialPlayerState();
  scene = "story";
  dialogueKind = "intro";
  dialogueLines = getIntroDialogue();
  dialogueIndex = 0;
  selectedChapterId = chapters[0]?.id || "";
  resetRunForChapter();
  savePlayer(player);
  render();
}

async function importQuestions(event) {
  const [file] = event.target.files;
  if (!file) return;
  try {
    const text = await file.text();
    questions = parseQuestionImport(JSON.parse(text));
    chapters = createStoryChapters(questions);
    selectedChapterId = chapters[0]?.id || "";
    questionSource = file.name;
    player = prunePlayerForQuestions(player, questions);
    resetRunForChapter();
    savePlayer(player);
    scene = "world";
    showToast(`已载入 ${questions.length} 道题，秘卷章节已重组`);
    render();
  } catch (error) {
    showToast(error.message || "题库导入失败");
  } finally {
    event.target.value = "";
  }
}

function upgradeArtifactAction(artifactId) {
  try {
    const result = upgradeArtifact(player, artifactId);
    player = result.player;
    savePlayer(player);
    showToast(`${result.artifact.name} 升至 Lv.${result.artifact.level}`);
    render();
  } catch (error) {
    showToast(error.message || "法器升级失败");
  }
}

function ensureChapterRun() {
  const chapter = getSelectedChapter();
  const chapterIds = new Set(chapter?.questionIds || []);
  const runQuestionIds = new Set(run.nodes.map((node) => node.questionId));
  const mismatch = chapter && ![...runQuestionIds].some((id) => chapterIds.has(id));
  if (!run.nodes.length || run.mode === "demon" || mismatch) resetRunForChapter();
}

function resetRunForChapter() {
  run = createRunForSelectedChapter();
  currentNodeIndex = 0;
  selectedKeys = [];
  submittedResult = null;
  selectedStanceId = "steady";
}

function createRunForSelectedChapter() {
  const chapter = getSelectedChapter();
  const chapterQuestions = chapter ? sortChapterQuestions(getChapterQuestions(chapter)) : questions;
  return createRouteRun(chapterQuestions, { length: Math.min(runLength, chapterQuestions.length || runLength), title: chapter?.title || "秘卷题阵" });
}

function selectDailyQuestions() {
  const wrongIds = new Set(player.wrongQuestionIds || []);
  const correctIds = new Set(player.correctQuestionIds || []);
  return [...questions]
    .sort((a, b) => Number(wrongIds.has(b.id)) - Number(wrongIds.has(a.id)) || Number(!correctIds.has(b.id)) - Number(!correctIds.has(a.id)))
    .slice(0, runLength);
}

function getSelectedChapter() {
  return chapters.find((chapter) => chapter.id === selectedChapterId) || chapters[0] || null;
}

function getChapterQuestions(chapter) {
  const ids = new Set(chapter.questionIds || []);
  return questions.filter((question) => ids.has(question.id));
}

function sortChapterQuestions(chapterQuestions) {
  const wrongIds = new Set(player.wrongQuestionIds || []);
  const studiedIds = new Set(player.studiedLessonIds || []);
  const correctIds = new Set(player.correctQuestionIds || []);
  return [...chapterQuestions].sort((a, b) => scoreQuestion(a, wrongIds, studiedIds, correctIds) - scoreQuestion(b, wrongIds, studiedIds, correctIds));
}

function scoreQuestion(question, wrongIds, studiedIds, correctIds) {
  return Number(!studiedIds.has(question.lesson.id)) * -5 + Number(wrongIds.has(question.id)) * -4 + Number(!correctIds.has(question.id)) * -2;
}

function getCurrentNode() {
  return run.nodes[currentNodeIndex] || null;
}

function getCurrentQuestion() {
  const node = getCurrentNode();
  return node ? questions.find((question) => question.id === node.questionId) || null : null;
}

function toggleOption(key) {
  const question = getCurrentQuestion();
  if (!question || submittedResult) return;
  const isMulti = question.answer.length > 1;
  selectedKeys = isMulti
    ? toggleKey(selectedKeys, key, question.options.map((option) => option.key))
    : [key];
  render();
}

function getOptionClass(question, key) {
  const classes = ["answer-rune"];
  if (selectedKeys.includes(key)) classes.push("is-selected");
  if (submittedResult && question.answer.includes(key)) classes.push("is-correct");
  if (submittedResult && selectedKeys.includes(key) && !question.answer.includes(key)) classes.push("is-wrong");
  return classes.join(" ");
}

function loadPlayer() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey));
    const base = initialPlayerState();
    if (!parsed || typeof parsed !== "object") return base;
    const growthXp = Number(parsed.growthXp ?? base.growthXp);
    return {
      ...base,
      ...parsed,
      playerLevel: Number(parsed.playerLevel ?? Math.max(1, Math.floor(growthXp / 50) + 1)),
      growthXp,
      starGlimmer: Number(parsed.starGlimmer ?? base.starGlimmer),
      energy: Number(parsed.energy ?? base.energy),
      maxEnergy: Number(parsed.maxEnergy ?? base.maxEnergy),
      heartPower: Number(parsed.heartPower ?? base.heartPower),
      maxHeartPower: Number(parsed.maxHeartPower ?? base.maxHeartPower),
      spiritPages: Number(parsed.spiritPages ?? base.spiritPages),
      materials: { ...base.materials, ...(isRecord(parsed.materials) ? parsed.materials : {}) },
      artifacts: { ...base.artifacts, ...(isRecord(parsed.artifacts) ? parsed.artifacts : {}) },
      stanceMastery: { ...base.stanceMastery, ...(isRecord(parsed.stanceMastery) ? parsed.stanceMastery : {}) },
      streak: Number(parsed.streak ?? base.streak),
      seenIntro: Boolean(parsed.seenIntro ?? base.seenIntro),
      bonds: isRecord(parsed.bonds) ? { ...base.bonds, ...parsed.bonds } : base.bonds,
      storyFlags: isRecord(parsed.storyFlags) ? parsed.storyFlags : {},
      mastery: isRecord(parsed.mastery) ? parsed.mastery : {},
      studiedLessonIds: Array.isArray(parsed.studiedLessonIds) ? parsed.studiedLessonIds : [],
      answeredQuestionIds: Array.isArray(parsed.answeredQuestionIds) ? parsed.answeredQuestionIds : [],
      correctQuestionIds: Array.isArray(parsed.correctQuestionIds) ? parsed.correctQuestionIds : [],
      wrongQuestionIds: Array.isArray(parsed.wrongQuestionIds) ? parsed.wrongQuestionIds : [],
      mindDemons: isRecord(parsed.mindDemons) ? parsed.mindDemons : {},
      purifiedDemonIds: Array.isArray(parsed.purifiedDemonIds) ? parsed.purifiedDemonIds : [],
      chapterClears: isRecord(parsed.chapterClears) ? parsed.chapterClears : {},
      stanceStats: isRecord(parsed.stanceStats) ? { ...base.stanceStats, ...parsed.stanceStats } : base.stanceStats,
    };
  } catch {
    return initialPlayerState();
  }
}

function savePlayer(nextPlayer) {
  window.localStorage.setItem(storageKey, JSON.stringify(nextPlayer));
}

function getIntroDialogue() {
  return [
    {
      speakerId: "mingche",
      speakerName: "明澈",
      avatar: avatarPath("mingche"),
      standee: standeePath("mingche"),
      text: "小明书院是一座显化书院。知识会变成秘境，遗忘会凝成雾，而真题秘卷正在失去星光。",
    },
    {
      speakerId: "azhi",
      speakerName: "阿芷",
      avatar: avatarPath("azhi"),
      standee: standeePath("azhi"),
      text: "别急着进题阵。先跟我练功，把讲解拆成题眼。学会以后，战斗才是检验，不是硬猜。",
    },
    {
      speakerId: "qinglan",
      speakerName: "青岚",
      avatar: avatarPath("qinglan"),
      standee: standeePath("qinglan"),
      text: "破阵时选稳破、强攻或观照。答对会涨心法、掉材料、加羁绊；答错会留下心魔，之后必须面对。",
    },
    {
      speakerId: "xiaomo",
      speakerName: "小墨",
      avatar: avatarPath("xiaomo"),
      standee: standeePath("xiaomo"),
      text: "六章全亮，代表题库里的题都练过、答对过、清过心魔。那时，秘卷才算真正归元。",
    },
  ];
}

function sceneBackground(assetId, tone = "") {
  return el("div", tone ? `scene-bg tone-${tone}` : "scene-bg", { style: `--bg:url(${assetSrc(assetId)})` }, []);
}

function ambientLayer(tone = "") {
  return el("div", tone ? `ambient tone-${tone}` : "ambient", {}, [
    el("span", "", {}, []),
    el("span", "", {}, []),
    el("span", "", {}, []),
  ]);
}

function avatarPath(id) {
  return `./assets/generated/characters/avatars/avatar-${id}.png`;
}

function standeePath(id) {
  return `./assets/generated/characters/standees/cutouts/standee-${id}-cutout.png`;
}

function assetSrc(id) {
  return getAssetPath(id);
}

function getCharacter(id) {
  return storyCharacters.find((character) => character.id === id) || storyCharacters[0];
}

function getInkClueText() {
  const cleared = Object.keys(player.chapterClears || {}).length;
  if (cleared >= 5) return "黑墨写下：真正的试炼，是面对错题时不逃避。";
  if (cleared >= 2) return "墨迹正在变清：它像提醒，不像威胁。";
  return "秘卷边缘有一枚尚未解释的黑色墨痕。";
}

function getChapterBackgroundAsset(chapter) {
  return {
    教育法规: "bg.chapter.law",
    教育心理学: "bg.chapter.psychology",
    教学设计: "bg.chapter.design",
    教师职业道德: "bg.chapter.ethics",
    班级管理: "bg.chapter.classroom",
    儿童发展: "bg.chapter.child",
  }[chapter?.topic] || "bg.academyGate";
}

function getBondLevel(value) {
  if (value >= 21) return "知己";
  if (value >= 16) return "挚友";
  if (value >= 11) return "信任";
  if (value >= 6) return "同伴";
  return "初识";
}

function getBondLine(id, level) {
  const lines = {
    mingche: `你的判断越来越准了。现在是${level}。`,
    azhi: `每次净化心魔，我都能感觉到你的进步。现在是${level}。`,
    qinglan: `你的连破记录快追上我了。现在是${level}。`,
    xiaomo: `你比我想象中更特别。现在是${level}。`,
  };
  return lines[id] || `羁绊状态：${level}`;
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

function sceneLabel(id) {
  return {
    world: "主线任务",
    story: "剧情推进",
    training: "练功任务",
    battle: "战斗检验",
    review: "心魔净化",
    roster: "同伴法器",
    daily: "日课挑战",
  }[id] || "主线任务";
}

function formatMaterials(materials = {}) {
  const bag = normalizeMaterialBag(materials);
  return materialTypes
    .map((material) => [material.name, bag[material.id] || 0])
    .filter(([, value]) => value > 0)
    .map(([name, value]) => `${name}+${value}`)
    .join(" · ");
}

function normalizeMaterialBag(materials = {}) {
  return Object.fromEntries(materialTypes.map((material) => [material.id, Number(materials?.[material.id] || 0)]));
}

function progressBar(current, target) {
  const value = target ? Math.round((Number(current || 0) / Number(target || 1)) * 100) : 0;
  return el("b", "progress-bar", { style: `--value:${Math.min(100, value)}%` }, [el("i", "", {}, [])]);
}

function actionButton(label, onClick, className, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

function lessonCard(label, value) {
  return el("article", "lesson-mini", {}, [
    el("span", "", {}, [label]),
    el("strong", "", {}, [value || "待补充"]),
  ]);
}

function questLine(label, value) {
  return el("div", "quest-line", {}, [
    el("span", "", {}, [label]),
    el("strong", "", {}, [value]),
  ]);
}

function hudStat(label, value, tone = "") {
  return el("article", tone ? `hud-stat is-${tone}` : "hud-stat", {}, [
    el("span", "", {}, [label]),
    el("strong", "", {}, [String(value)]),
  ]);
}

function reportStat(label, value) {
  return el("article", "report-stat", {}, [
    el("span", "", {}, [label]),
    el("strong", "", {}, [String(value)]),
  ]);
}

function emptyStage(title, detail) {
  return el("section", "empty-stage", {}, [
    el("h2", "", {}, [title]),
    el("p", "", {}, [detail]),
  ]);
}

function playEffect(effect) {
  transientEffect = effect;
  window.clearTimeout(playEffect.timer);
  playEffect.timer = window.setTimeout(() => {
    transientEffect = "";
    render();
  }, 900);
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    dom.toast.classList.remove("is-visible");
  }, 2400);
}

function el(tag, className = "", attrs = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "style") node.setAttribute("style", value);
    else if (key === "type") node.type = value;
    else if (value !== undefined && value !== null) node.setAttribute(key, value);
  });
  children.forEach((child) => node.append(child instanceof Node ? child : document.createTextNode(String(child))));
  return node;
}

function toggleKey(keys, key, order) {
  const nextKeys = keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key];
  return order.filter((item) => nextKeys.includes(item));
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

function isRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}
