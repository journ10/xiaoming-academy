import {
  applyAnswer,
  breakMoves,
  createInitialState,
  createLearningReport,
  createObservationHint,
  createRun,
  createStartRecommendation,
  decodeSaveState,
  encodeSaveState,
  getHighPressureDemon,
  judgeAnswer,
  normalizeAnswer,
  prepareQuestionBank,
  parseQuestionImport,
  runTargets,
  studyStyles,
} from "./core.js?v=runtime-redesign-20260624";

const scenes = ["start", "run", "demons", "report", "settings"];
const storageKey = "xiaoming-academy-runtime-v2";
const cacheVersion = "runtime-redesign-20260624";
const requestTimeoutMs = 18000;
const questionIndexUrls = [
  versionedDataUrl("./data/question-index.json"),
  versionedDataUrl("/xiaoming-academy/data/question-index.json"),
];
const runtimeQuestionUrls = [
  versionedDataUrl("./data/questions.runtime.json"),
  versionedDataUrl("/xiaoming-academy/data/questions.runtime.json"),
];
const questionChunkPath = "data/question-chunks";

const labels = {
  start: "开局台",
  run: "题阵",
  demons: "心魔",
  report: "学习报告",
  settings: "设置",
};

const dom = {
  shell: document.querySelector("[data-app-shell]"),
  view: document.querySelector("[data-view-root]"),
  topNav: document.querySelector("[data-top-nav]"),
  bottomNav: document.querySelector("[data-bottom-nav]"),
  toast: document.querySelector("[data-toast]"),
};

let state = loadSavedState();
let scene = state.currentRun ? "run" : "start";
let bankState = {
  status: "loading",
  message: "题库准备中。",
};
let questionBank = prepareQuestionBank([]);
let questionIndexById = new Map();
let questionChunkById = new Map();
let loadedQuestionChunkIds = new Set();
let hydratedQuestionById = new Map();
let selectedTargetId = "";
let selectedStyleId = "";
let focusDemonId = "";
let targetPickerOpen = false;
let exportedCode = "";
let importDraft = "";
let toastTimer = 0;

document.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-scene-link]");
  if (navButton) {
    event.preventDefault();
    goScene(navButton.dataset.sceneLink);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  event.preventDefault();
  handleAction(actionButton).catch((error) => showToast(error.message || "操作失败，请稍后再试。"));
});

document.addEventListener("input", (event) => {
  const field = event.target;
  if (field.matches("[data-import-code]")) {
    importDraft = field.value;
  }
});

syncTheme();
render();
initialize();

async function initialize() {
  try {
    bankState = { status: "loading", message: "正在读取真题题阵。" };
    render();
    const loaded = await loadBuiltInQuestionBank();
    questionBank = prepareQuestionBank(loaded.questions);
    questionIndexById = new Map(questionBank.all.map((question) => [question.id, question]));
    seedHydratedQuestions(questionBank.all);
    bankState = {
      status: "ready",
      message: `已准备 ${questionBank.playable.length} 道题。`,
    };
  } catch (error) {
    questionBank = prepareQuestionBank([]);
    bankState = {
      status: "error",
      message: error.message || "题库暂时无法读取。",
    };
  }
  render();
}

async function loadBuiltInQuestionBank() {
  let indexPayload = null;
  let indexError = null;

  try {
    indexPayload = await fetchFirstJson(questionIndexUrls);
    configureQuestionChunks(indexPayload?.chunks || []);
    const indexQuestions = parseQuestionImport(indexPayload);
    questionIndexById = new Map(indexQuestions.map((question) => [question.id, question]));
  } catch (error) {
    indexError = error;
    configureQuestionChunks([]);
  }

  try {
    const runtimePayload = await fetchFirstJson(runtimeQuestionUrls);
    const runtimeQuestions = parseQuestionImport(runtimePayload);
    configureQuestionChunks(runtimePayload?.chunks || indexPayload?.chunks || []);
    return { questions: runtimeQuestions };
  } catch (error) {
    if (indexPayload) {
      const indexQuestions = parseQuestionImport(indexPayload);
      return { questions: indexQuestions };
    }
    throw new Error(error.message || indexError?.message || "题库暂时无法读取。");
  }
}

async function ensureQuestionsHydrated(questionIds = []) {
  const ids = unique(questionIds);
  const missingIds = ids.filter((questionId) => !hydratedQuestionById.has(questionId));
  if (!missingIds.length) return;

  const chunkIds = unique(missingIds.map((questionId) => questionIndexById.get(questionId)?.chunkId).filter(Boolean));
  await Promise.all(chunkIds.map((chunkId) => loadQuestionChunk(chunkId)));

  const stillMissing = missingIds.filter((questionId) => !hydratedQuestionById.has(questionId));
  if (stillMissing.length) {
    throw new Error("题阵暂时无法展开完整题目。");
  }
}

async function loadQuestionChunk(chunkId) {
  if (!chunkId || loadedQuestionChunkIds.has(chunkId)) return;
  const chunk = questionChunkById.get(chunkId);
  if (!chunk) throw new Error("题阵分片暂时无法读取。");

  const urls = getQuestionChunkUrls(chunk);
  const payload = await fetchFirstJson(urls);
  const questions = parseQuestionImport(payload);
  seedHydratedQuestions(questions);
  loadedQuestionChunkIds.add(chunkId);
}

function render() {
  syncTheme();
  renderNavigation();
  dom.shell.dataset.scene = scene;
  dom.shell.dataset.loading = bankState.status;

  if (bankState.status === "loading") {
    dom.view.innerHTML = renderLoading();
    return;
  }
  if (bankState.status === "error") {
    dom.view.innerHTML = renderLoadError();
    return;
  }

  if (scene === "run") dom.view.innerHTML = renderRun();
  else if (scene === "demons") dom.view.innerHTML = renderDemons();
  else if (scene === "report") dom.view.innerHTML = renderReport();
  else if (scene === "settings") dom.view.innerHTML = renderSettings();
  else dom.view.innerHTML = renderStart();
}

function renderStart() {
  const currentRun = state.currentRun;
  const recommendation = createStartRecommendation(questionBank.playable, state);
  const targetLabels = ["拓新题阵", "净魔题阵", "冲刺题阵"];
  const styleLabels = ["稳修", "突击", "复盘"];
  const activeTargetId = selectedTargetId || recommendation.targetId || "explore";
  const activeStyleId = selectedStyleId || (focusDemonId ? "" : recommendation.styleId || "steady");
  const target = getTarget(activeTargetId);
  const style = getStyle(activeStyleId);
  const progress = currentRun ? getRunProgress(currentRun) : null;
  const actionText = currentRun ? "继续题阵" : "进入题阵";
  const styleRequired = !currentRun && !activeStyleId;
  const targetCards = runTargets.map((item) => `
    <button class="choice-card ${item.id === activeTargetId ? "is-selected" : ""}" type="button" data-action="select-target" data-target-id="${item.id}">
      <strong>${escapeHtml(item.name)}</strong>
      <span>${escapeHtml(item.description)}</span>
    </button>
  `).join("");
  const styleCards = studyStyles.map((item) => `
    <button class="choice-chip style-option ${item.id === activeStyleId ? "is-selected" : ""}" type="button" data-action="select-style" data-style-id="${item.id}">
      <strong>${escapeHtml(item.name)}</strong>
      <span>${escapeHtml(item.description)}</span>
    </button>
  `).join("");

  return `
    <section class="screen start-screen">
      <header class="screen-head">
        <span class="eyebrow">开局台</span>
        <h2>开局台</h2>
        <p>${currentRun ? "上一局还在进行，当前进度和已选状态都会保留。" : "系统推荐本局目标，直接进入 5 题题阵。"}</p>
      </header>

      <article class="start-main-card">
        <div class="start-copy">
          <span class="panel-kicker">${currentRun ? "继续未完成题阵" : "今日推荐"}</span>
          ${currentRun ? `
            <h3>${escapeHtml(currentRun.targetName)}</h3>
            <p>保留当前题阵进度和已选状态，继续完成这一组五题短局。</p>
            <div class="big-number">${progress.done}<small> / ${progress.total}</small></div>
            <div class="start-progress-wrap">${renderProgressRail(currentRun)}</div>
          ` : `
            <div class="target-lockup">
              <strong>${escapeHtml(target.name)}</strong>
              <span>${escapeHtml(recommendation.goal || target.description)}</span>
            </div>
            <p>${style ? `流派：${escapeHtml(style.name)}` : "先选择一个流派，再进入题阵。"}</p>
          `}
          <div class="start-action-row">
            <button class="primary-button" type="button" data-action="start-run" ${styleRequired ? "disabled" : ""}>${actionText}</button>
            <button class="ghost-button target-switch" type="button" data-action="toggle-targets">换目标</button>
            <span class="soft-note">${styleRequired ? `请选择 ${styleLabels.join(" / ")}` : targetLabels.join(" / ")}</span>
          </div>
        </div>

        <aside class="choice-panel start-style-card">
          <h3>流派选项</h3>
          <p>稳修 / 突击 / 复盘只是开局选择，确认后用进入题阵按钮开始。</p>
          <div class="style-grid">${styleCards}</div>
        </aside>

        <aside class="choice-panel target-picker ${targetPickerOpen ? "is-open" : ""}">
          <h3>题阵目标</h3>
          <div class="choice-stack">${targetCards}</div>
        </aside>
      </article>
    </section>
  `;
}

function renderRun() {
  const run = state.currentRun;
  if (!run) {
    return `
      <section class="screen empty-screen">
        <header class="screen-head">
          <span class="eyebrow">题阵</span>
          <h2>当前没有进行中的题阵</h2>
          <p>从开局台选择目标和流派后进入五题短局。</p>
        </header>
        <button class="primary-button" type="button" data-action="go-start">回到开局台</button>
      </section>
    `;
  }

  const question = getCurrentQuestion(run);
  if (!question) {
    return `
      <section class="screen empty-screen">
        <header class="screen-head">
          <span class="eyebrow">题阵</span>
          <h2>题目还没有展开</h2>
          <p>请回到开局台重新进入。</p>
        </header>
        <button class="primary-button" type="button" data-action="go-start">回到开局台</button>
      </section>
    `;
  }

  const answerState = run.answers?.[question.id] || {};
  const selectedKeys = answerState.selectedKeys || [];
  const observeRevealed = Boolean(answerState.observeRevealed);
  const submitted = Boolean(answerState.submitted);
  const activeMoveId = answerState.breakMoveId || "steady";
  const hint = observeRevealed ? createObservationHint(question) : null;
  const currentJudgement = submitted ? judgeAnswer(question, selectedKeys) : null;
  const progress = getRunProgress(run);
  const currentStep = Math.min(progress.total, Number(run.currentIndex || 0) + 1);
  const progressRatio = progress.total ? Math.max(0, Math.min(100, ((Number(run.currentIndex || 0) + (submitted ? 1 : 0)) / progress.total) * 100)) : 0;
  const isMulti = normalizeAnswer(question.answer, question.options).length > 1 || /多项/u.test(question.type || "");

  const moveButtons = breakMoves.map((move) => {
    const lockedOut = observeRevealed && move.id !== "observe";
    return `
      <button class="move-button ${move.id === activeMoveId ? "is-selected" : ""}" type="button" data-action="set-move" data-move-id="${move.id}" ${submitted || lockedOut ? "disabled" : ""}>
        <strong>${escapeHtml(move.name)}</strong>
        <span>${move.id === "observe" ? "观照" : escapeHtml(move.description)}</span>
      </button>
    `;
  }).join("");

  const optionButtons = normalizeQuestionOptions(question).map((option) => {
    const selected = selectedKeys.includes(option.key);
    const answerClass = submitted
      ? currentJudgement.correctAnswer.includes(option.key)
        ? "is-correct"
        : selected
          ? "is-wrong"
          : ""
      : "";
    return `
      <button class="answer-option ${selected ? "is-selected" : ""} ${answerClass}" type="button" data-action="toggle-option" data-key="${escapeHtml(option.key)}" ${submitted ? "disabled" : ""}>
        <span class="option-key">${escapeHtml(option.key)}</span>
        <span>${escapeHtml(option.text)}</span>
      </button>
    `;
  }).join("");

  const selectedLabel = selectedKeys.length ? selectedKeys.join("") : "未选";
  const dockLead = submitted ? (answerState.isCorrect ? "破招成功" : "需要复盘") : `已选 ${selectedLabel}`;

  return `
    <section class="screen run-screen ${submitted ? "is-submitted" : ""} ${observeRevealed ? "is-observing" : ""}">
      <header class="screen-head compact-head">
        <span class="eyebrow">题阵</span>
        <h2>题阵</h2>
        <p>第 ${currentStep}/${progress.total} 题</p>
      </header>

      <aside class="question-rail" aria-label="题阵进度">
        <span>题阵</span>
        ${renderProgressRail(run)}
      </aside>

      <article class="run-board">
        <div class="run-board-progress" aria-hidden="true"><span style="width: ${progressRatio}%"></span></div>

        <article class="lesson-strip">
          <span>题眼短课</span>
          <strong>${escapeHtml(question.lesson?.title || question.primaryDomain?.name || "本题题眼")}</strong>
          <p>${escapeHtml(question.lesson?.keyPoint || "先抓限定词、对象和条件。")}</p>
        </article>

        <article class="question-panel">
          <div class="question-meta">
            <span>${escapeHtml(question.type || "选择题")}</span>
            <span>${isMulti ? "可多选" : "单选"}</span>
            <span>${escapeHtml(question.primaryDomain?.name || question.topic || "")}</span>
          </div>
          <h3>${escapeHtml(question.stem)}</h3>
          ${hint ? `<div class="observe-hint"><strong>观照</strong><p>${escapeHtml(hint.text)}</p></div>` : ""}

          <section class="move-panel">
            <h3>破招</h3>
            <div class="move-grid">${moveButtons}</div>
          </section>

          <div class="option-grid">${optionButtons}</div>
        </article>
      </article>

      <aside class="answer-dock">
        <div class="answer-dock-head">
          <span>${submitted ? "本题结果" : "当前选择"}</span>
          <strong>${escapeHtml(dockLead)}</strong>
        </div>
        ${submitted ? `
          <div class="answer-result ${answerState.isCorrect ? "is-correct" : "is-wrong"}">
            <strong>${answerState.isCorrect ? "破招成功" : "需要复盘"}</strong>
            <span>标准选项：${escapeHtml(currentJudgement.correctAnswer || "-")}</span>
          </div>
        ` : `
          <p>${observeRevealed ? "观照已展开，先看清题眼再确认。" : "确认后会记录本题结果，并更新心魔压力。"}</p>
        `}
        <footer class="run-actions">
          ${submitted ? `
            <button class="primary-button" type="button" data-action="${progress.done >= progress.total ? "go-report" : "next-question"}">${progress.done >= progress.total ? "查看学习报告" : "下一题"}</button>
          ` : `
            <button class="primary-button" type="button" data-action="submit-answer" ${selectedKeys.length ? "" : "disabled"}>确认答案</button>
          `}
        </footer>
      </aside>
    </section>
  `;
}

function renderDemons() {
  const highPressure = getHighPressureDemon(state);
  const activeDemons = Object.values(state.demons || {}).filter((demon) => !demon.purified);
  const list = activeDemons.length ? activeDemons.map((demon) => `
    <article class="demon-row ${highPressure?.id === demon.id ? "is-hot" : ""}">
      <div>
        <strong>${escapeHtml(demon.type)}</strong>
        <p>${escapeHtml(demon.recentText || "最近相关错因需要复测。")}</p>
      </div>
      <div class="pressure-pill">压力 ${Number(demon.pressure || 0)}</div>
      <button class="ghost-button" type="button" data-action="prepare-purify" data-demon-id="${escapeHtml(demon.id)}">进入净魔题阵</button>
    </article>
  `).join("") : `
    <article class="empty-card">
      <strong>暂时没有高压心魔</strong>
      <p>完成题阵后，错题会在这里聚合成复盘目标。</p>
    </article>
  `;

  return `
    <section class="screen demons-screen">
      <header class="screen-head">
        <span class="eyebrow">心魔</span>
        <h2>心魔</h2>
        <p>${highPressure ? escapeHtml(highPressure.recentText || "先处理这类错因。") : "继续拓新题阵，系统会根据错题生成复盘目标。"}</p>
      </header>

      <article class="demon-main-card">
        <div class="demon-focus">
          <article class="focus-panel">
            <span class="panel-kicker">当前高压心魔</span>
            <div class="target-lockup">
              <strong>${escapeHtml(highPressure?.type || "无高压目标")}</strong>
              <span>${escapeHtml(highPressure?.recentText || "保持五题短局节奏。")}</span>
            </div>
            <button class="primary-button" type="button" data-action="prepare-purify" data-demon-id="${escapeHtml(highPressure?.id || "")}" ${highPressure ? "" : "disabled"}>进入净魔题阵</button>
          </article>
          <section class="demon-list-card">
          <div class="panel-title">
            <span>心魔列表</span>
            <span>${highPressure ? `压力 ${Number(highPressure.pressure || 0)}` : "暂无"}</span>
          </div>
            <div class="demon-list">${list}</div>
          </section>
        </div>
      </article>
    </section>
  `;
}

function renderReport() {
  const report = state.lastReport || (state.currentRun ? createLearningReport(state, state.currentRun) : null);
  if (!report) {
    return `
      <section class="screen empty-screen">
        <header class="screen-head">
          <span class="eyebrow">学习报告</span>
          <h2>还没有完成题阵</h2>
          <p>完成一局五题短局后，这里会显示本次总结。</p>
        </header>
        <button class="primary-button" type="button" data-action="go-start">去开局台</button>
      </section>
    `;
  }

  return `
    <section class="screen report-screen">
      <header class="screen-head">
        <span class="eyebrow">学习报告</span>
        <h2>学习报告</h2>
        <p>${escapeHtml(report.gains)}</p>
      </header>

      <article class="report-main-card">
        <div class="report-grid">
          <article class="metric-card">
            <span>正确</span>
            <strong>${Number(report.correctCount || 0)}</strong>
          </article>
          <article class="metric-card">
            <span>错题</span>
            <strong>${Number(report.wrongCount || 0)}</strong>
          </article>
          <article class="metric-card">
            <span>总题数</span>
            <strong>${Number(report.total || 0)}</strong>
          </article>
        </div>

        <article class="next-step">
          <span>下一步</span>
          <p>${escapeHtml(report.nextStep)}</p>
        </article>

        <div class="screen-actions">
          <button class="primary-button" type="button" data-action="go-start">再开一局</button>
          <button class="ghost-button" type="button" data-action="go-demons">查看心魔</button>
        </div>
      </article>
    </section>
  `;
}

function renderSettings() {
  const themeLabel = state.theme === "light" ? "明亮" : "夜读";
  return `
    <section class="screen settings-screen">
      <header class="screen-head">
        <span class="eyebrow">设置</span>
        <h2>设置</h2>
        <p>存档与风格</p>
      </header>

      <div class="settings-grid">
        <section class="settings-section settings-card storage-card">
          <h3>本机存档</h3>
          <p>保留当前存档码方式，用导出、导入和重置管理本机进度。</p>
          <div class="settings-button-row">
            <button class="primary-button" type="button" data-action="export-code">导出</button>
            <button class="ghost-button" type="button" data-action="import-code">导入</button>
            <button class="danger-button" type="button" data-action="reset-progress">重置</button>
          </div>
          <textarea class="save-code ${exportedCode ? "is-open" : "is-hidden"}" readonly data-export-output placeholder="点击导出生成存档码">${escapeHtml(exportedCode)}</textarea>
          <textarea class="save-code sr-only" data-import-code>${escapeHtml(importDraft)}</textarea>
        </section>

        <section class="settings-section settings-card appearance-card">
          <h3>视觉主题</h3>
          <p>当前：${themeLabel}</p>
          <div class="theme-select-row">
            <span>主题</span>
            <strong>${themeLabel}</strong>
          </div>
          <div class="theme-segment" role="group" aria-label="主题切换">
            <button type="button" class="${state.theme === "light" ? "is-selected" : ""}" data-action="set-theme" data-theme-value="light">明亮</button>
            <button type="button" class="${state.theme !== "light" ? "is-selected" : ""}" data-action="set-theme" data-theme-value="night">夜读</button>
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderLoading() {
  return `
    <section class="screen empty-screen">
      <header class="screen-head">
        <span class="eyebrow">开局台</span>
        <h2>正在准备题阵</h2>
        <p>${escapeHtml(bankState.message)}</p>
      </header>
      <div class="loading-bar"><span></span></div>
    </section>
  `;
}

function renderLoadError() {
  return `
    <section class="screen empty-screen">
      <header class="screen-head">
        <span class="eyebrow">开局台</span>
        <h2>题阵暂时无法进入</h2>
        <p>${escapeHtml(bankState.message)}</p>
      </header>
      <button class="primary-button" type="button" data-action="reload-bank">重试</button>
    </section>
  `;
}

async function handleAction(node) {
  const action = node.dataset.action;
  if (action === "go-start") return goScene("start");
  if (action === "go-demons") return goScene("demons");
  if (action === "go-report") return goScene("report");
  if (action === "reload-bank") return initialize();
  if (action === "toggle-targets") return toggleTargets();
  if (action === "select-target") return selectTarget(node.dataset.targetId);
  if (action === "select-style") return selectStyle(node.dataset.styleId);
  if (action === "start-run") return startRun();
  if (action === "set-move") return setMove(node.dataset.moveId);
  if (action === "toggle-option") return toggleOption(node.dataset.key);
  if (action === "submit-answer") return submitCurrentAnswer();
  if (action === "next-question") return nextQuestion();
  if (action === "prepare-purify") return preparePurifyRun(node.dataset.demonId);
  if (action === "set-theme") return setTheme(node.dataset.themeValue);
  if (action === "export-code") return exportSaveCode();
  if (action === "import-code") return importSaveCode();
  if (action === "reset-progress") return resetProgress();
}

function goScene(nextScene) {
  scene = scenes.includes(nextScene) ? nextScene : "start";
  render();
}

function toggleTargets() {
  targetPickerOpen = !targetPickerOpen;
  render();
}

function selectTarget(targetId) {
  selectedTargetId = runTargets.some((target) => target.id === targetId) ? targetId : "explore";
  if (selectedTargetId !== "purify") focusDemonId = "";
  targetPickerOpen = true;
  render();
}

function selectStyle(styleId) {
  selectedStyleId = studyStyles.some((style) => style.id === styleId) ? styleId : "steady";
  render();
}

async function startRun() {
  if (state.currentRun && !state.currentRun.completed) {
    scene = "run";
    render();
    return;
  }
  if (!questionBank.playable.length) {
    showToast("题库还没有准备好。");
    return;
  }

  const recommendation = createStartRecommendation(questionBank.playable, state);
  const targetId = selectedTargetId || recommendation.targetId || "explore";
  const styleId = selectedStyleId || (focusDemonId ? "" : recommendation.styleId || "steady");
  if (!styleId) {
    showToast("先选择流派。");
    return;
  }

  let nextRun = createRun(questionBank.playable, state, {
    targetId,
    styleId,
    focusDemonId,
    fallbackQuestions: questionBank.playable,
    length: 5,
  });
  await ensureQuestionsHydrated(nextRun.questionIds);
  nextRun = hydrateRun(nextRun);
  state.currentRun = nextRun;
  state.lastReport = null;
  selectedTargetId = targetId;
  selectedStyleId = styleId;
  scene = "run";
  saveState();
  render();
}

function setMove(moveId) {
  const run = state.currentRun;
  const question = getCurrentQuestion(run);
  if (!run || !question) return;
  const existing = run.answers?.[question.id] || {};
  if (existing.submitted) return;
  if (existing.observeRevealed && moveId !== "observe") return;

  run.answers = {
    ...(run.answers || {}),
    [question.id]: {
      ...existing,
      selectedKeys: existing.selectedKeys || [],
      breakMoveId: moveId,
      observeRevealed: moveId === "observe" || Boolean(existing.observeRevealed),
    },
  };
  saveState();
  render();
}

function toggleOption(key) {
  const run = state.currentRun;
  const question = getCurrentQuestion(run);
  if (!run || !question || !key) return;
  const existing = run.answers?.[question.id] || {};
  if (existing.submitted) return;

  const currentKeys = existing.selectedKeys || [];
  const isMulti = normalizeAnswer(question.answer, question.options).length > 1 || /多项/u.test(question.type || "");
  const selectedKeys = isMulti
    ? currentKeys.includes(key)
      ? currentKeys.filter((item) => item !== key)
      : [...currentKeys, key]
    : [key];

  run.answers = {
    ...(run.answers || {}),
    [question.id]: {
      ...existing,
      selectedKeys,
      breakMoveId: existing.breakMoveId || "steady",
      observeRevealed: Boolean(existing.observeRevealed),
    },
  };
  saveState();
  render();
}

function submitCurrentAnswer() {
  const run = state.currentRun;
  const question = getCurrentQuestion(run);
  if (!run || !question) return;
  const answerState = run.answers?.[question.id] || {};
  if (!answerState.selectedKeys?.length) {
    showToast("请先选择答案。");
    return;
  }

  const result = applyAnswer(state, run, question.id, {
    selectedKeys: answerState.selectedKeys,
    breakMoveId: answerState.breakMoveId || "steady",
    observeRevealed: answerState.observeRevealed,
  });
  state = result.state;
  if (result.run.completed) {
    state.lastReport = createLearningReport(state, result.run);
    scene = "report";
  } else {
    state.currentRun = result.run;
    scene = "run";
  }
  saveState();
  render();
}

function nextQuestion() {
  const run = state.currentRun;
  if (!run) return;
  run.currentIndex = Math.min(run.questions.length - 1, Number(run.currentIndex || 0) + 1);
  saveState();
  render();
}

function preparePurifyRun(demonId) {
  const demon = state.demons?.[demonId] || getHighPressureDemon(state);
  if (!demon) return;
  focusDemonId = demon.id;
  selectedTargetId = "purify";
  selectedStyleId = "";
  targetPickerOpen = true;
  scene = "start";
  render();
}

function setTheme(theme) {
  state.theme = theme === "light" ? "light" : "night";
  saveState();
  render();
}

function exportSaveCode() {
  exportedCode = encodeSaveState(state);
  render();
  showToast("已生成存档码。");
}

function importSaveCode() {
  const promptedCode = importDraft.trim() || window.prompt("粘贴存档码") || "";
  if (!promptedCode.trim()) {
    showToast("请先粘贴存档码。");
    return;
  }
  state = decodeSaveState(promptedCode);
  selectedTargetId = "";
  selectedStyleId = "";
  focusDemonId = "";
  exportedCode = "";
  importDraft = "";
  scene = state.currentRun ? "run" : "start";
  saveState();
  render();
  showToast("存档码已导入。");
}

function resetProgress() {
  const confirmed = window.confirm("确定要重置当前进度吗？");
  if (!confirmed) return;
  state = createInitialState({ theme: state.theme });
  selectedTargetId = "";
  selectedStyleId = "";
  focusDemonId = "";
  exportedCode = "";
  importDraft = "";
  scene = "start";
  saveState();
  render();
  showToast("进度已重置。");
}

function renderNavigation() {
  const markup = scenes.map((item) => `
    <button type="button" class="nav-link ${scene === item ? "is-active" : ""}" data-scene-link="${item}">
      <span>${escapeHtml(labels[item])}</span>
      ${item === "run" ? renderNavProgress() : ""}
    </button>
  `).join("");
  dom.topNav.innerHTML = markup;
  dom.bottomNav.innerHTML = markup;
}

function renderNavProgress() {
  const run = state.currentRun;
  if (!run) return "";
  const progress = getRunProgress(run);
  return `<small>${progress.done}/${progress.total}</small>`;
}

function renderProgressRail(run) {
  const total = run?.questions?.length || 5;
  const current = Math.min(total - 1, Math.max(0, Number(run?.currentIndex || 0)));
  return `
    <div class="run-progress-rail" aria-label="题阵进度">
      ${Array.from({ length: total }, (_, index) => {
        const question = run.questions?.[index];
        const submitted = Boolean(question && run.answers?.[question.id]?.submitted);
        return `<span class="${submitted ? "is-done" : ""} ${index === current ? "is-current" : ""}">${index + 1}</span>`;
      }).join("")}
    </div>
  `;
}

function getRunProgress(run) {
  const total = run?.questions?.length || 0;
  const done = (run?.questions || []).filter((question) => run.answers?.[question.id]?.submitted).length;
  return { done, total };
}

function getCurrentQuestion(run = state.currentRun) {
  if (!run?.questions?.length) return null;
  const index = Math.min(run.questions.length - 1, Math.max(0, Number(run.currentIndex || 0)));
  return run.questions[index] || null;
}

function hydrateRun(run) {
  return {
    ...run,
    questions: (run.questions || []).map((question) => hydratedQuestionById.get(question.id) || question),
  };
}

function seedHydratedQuestions(questions = []) {
  questions.forEach((question) => {
    if (question?.id && question.stem && question.options?.length) hydratedQuestionById.set(question.id, question);
  });
}

function configureQuestionChunks(chunks = []) {
  questionChunkById = new Map((chunks || []).map((chunk) => [chunk.id, chunk]));
  loadedQuestionChunkIds = new Set();
}

function getQuestionChunkUrls(chunk) {
  const url = chunk?.url || `${questionChunkPath}/${chunk?.id}.json`;
  const compressedUrl = chunk?.compressedUrl || `${url}.gz`;
  return [
    versionedDataUrl(`./${url}`),
    versionedDataUrl(`/xiaoming-academy/${url}`),
    versionedDataUrl(`./${compressedUrl}`),
    versionedDataUrl(`/xiaoming-academy/${compressedUrl}`),
  ];
}

async function fetchFirstJson(urls = []) {
  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) throw new Error("题库入口暂时没有回应。");
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("题库暂时无法读取。");
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("题库入口连接超时。");
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function versionedDataUrl(url) {
  return `${url}?v=${cacheVersion}`;
}

function loadSavedState() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return createInitialState();
    return createInitialState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
}

function saveState() {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
  syncTheme();
}

function syncTheme() {
  const theme = state.theme === "light" ? "light" : "night";
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => dom.toast.classList.remove("is-visible"), 2200);
}

function getTarget(targetId) {
  return runTargets.find((target) => target.id === targetId) || runTargets[0];
}

function getStyle(styleId) {
  return studyStyles.find((style) => style.id === styleId) || null;
}

function normalizeQuestionOptions(question) {
  return Array.isArray(question.options) ? question.options : [];
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
