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
} from "./core.js?v=runtime-redesign-20260625";

const scenes = ["start", "run", "demons", "report", "settings"];
const storageKey = "xiaoming-academy-runtime-v2";
const cacheVersion = "runtime-redesign-20260625";
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
  const styleLabels = ["稳修", "突击", "复盘"];
  const targetChoicesLabel = "拓新题阵 / 净魔题阵 / 冲刺题阵";
  const activeTargetId = selectedTargetId || recommendation.targetId || "explore";
  const activeStyleId = selectedStyleId || (focusDemonId ? "" : recommendation.styleId || "steady");
  const target = getTarget(activeTargetId);
  const style = getStyle(activeStyleId);
  const progress = currentRun ? getRunProgress(currentRun) : null;
  const actionText = currentRun ? "继续题阵" : "进入题阵";
  const styleRequired = !currentRun && !activeStyleId;
  const headCopy = currentRun
    ? "上一局还在进行，当前进度和已选状态都会保留。"
    : recommendation.targetId === "purify"
      ? "今天先处理高压错因"
      : "系统推荐本局目标，直接进入 5 题题阵。";
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
        <p>${headCopy}</p>
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
              <span>${escapeHtml(style?.name || "待选")}流派 · 5 题短局</span>
            </div>
            <div class="start-info-block">
              <strong>推荐理由</strong>
              <p>${escapeHtml(recommendation.reason || target.description)}</p>
            </div>
            <div class="start-info-block">
              <strong>本周目标</strong>
              <p>${escapeHtml(recommendation.goal || target.description)}</p>
            </div>
          `}
        </div>

        <aside class="choice-panel start-style-card">
          <h3>推荐流派</h3>
          <p>可在开局前切换策略，本局推荐${escapeHtml(style?.name || "稳修")}。</p>
          <div class="style-grid">${styleCards}</div>
        </aside>

        <div class="start-action-row">
          <button class="primary-button" type="button" data-action="start-run" ${styleRequired ? "disabled" : ""}>${actionText}</button>
          <button class="ghost-button target-switch" type="button" data-action="toggle-targets">换目标</button>
          <span class="soft-note">${styleRequired ? `请选择 ${styleLabels.join(" / ")}` : "完成后查看本周学习报告。"}</span>
        </div>

        <aside class="choice-panel target-picker ${targetPickerOpen ? "is-open" : ""}" aria-label="${targetChoicesLabel}">
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
    return renderPreflightEmpty({
      sceneClass: "run-empty-screen",
      eyebrow: "题阵",
      title: "题阵",
      description: "还没有开始本局",
      emptyTitle: "还没有本局题阵",
      emptyDescription: "先到开局台选择本局目标和流派，再进入 5 题题阵。",
      desktopDescription: "还没有开始本局。",
      desktopEmptyDescription: "先从开局台选择本局目标和流派，再进入 5 题题阵。",
      footnote: "开始后这里会显示题阵进度、破招和作答状态。",
      sideTitle: "进入后显示",
      sideItems: ["题阵进度", "破招选择", "作答确认"],
    });
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
  const progressRatio = progress.total ? Math.max(0, Math.min(100, (currentStep / progress.total) * 100)) : 0;
  const isMulti = normalizeAnswer(question.answer, question.options).length > 1 || /多项/u.test(question.type || "");

  if (submitted) return renderFeedback(run, answerState, currentJudgement, progress);

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

  const selectedLabel = selectedKeys.length ? selectedKeys.join("、") : "未选";
  const dockLead = submitted ? (answerState.isCorrect ? "破招成功" : "需要复盘") : `已选 ${selectedLabel}`;
  const showAnswerDock = selectedKeys.length > 0;
  const hintText = hint ? hint.text.replace(/^题眼[:：]?/u, "题眼提示：") : "";

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

          <section class="move-panel">
            <h3>破招</h3>
            <div class="move-grid">${moveButtons}</div>
          </section>
          ${hint ? `<div class="observe-hint"><p>${escapeHtml(hintText)}</p></div>` : ""}

          <div class="option-grid">${optionButtons}</div>
        </article>
      </article>

      ${showAnswerDock ? `
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
      ` : ""}
    </section>
  `;
}

function renderFeedback(run, answerState, currentJudgement, progress) {
  const isCorrect = Boolean(answerState.isCorrect);
  const nextAction = progress.done >= progress.total ? "go-report" : "next-question";
  const nextLabel = progress.done >= progress.total ? "查看学习报告" : "下一题";
  const resultTitle = isCorrect ? "答对了，破招成功" : "还差一步，回看题眼";
  const resultCopy = isCorrect ? "你抓住了本题的限制条件。" : `标准选项：${escapeHtml(currentJudgement?.correctAnswer || "-")}`;

  return `
    <section class="screen feedback-screen ${isCorrect ? "is-correct" : "is-wrong"}">
      <header class="screen-head compact-head">
        <span class="eyebrow">破招</span>
        <h2>破招</h2>
        <p>本题已完成</p>
      </header>

      <aside class="question-rail" aria-label="题阵进度">
        <span>题阵</span>
        ${renderProgressRail(run)}
      </aside>

      <article class="feedback-board">
        <section class="feedback-result">
          <h3>${resultTitle}</h3>
          <p>${resultCopy}</p>
        </section>

        <section class="feedback-lesson">
          <h3>题眼短课</h3>
          <p>本类题常常用干扰是把“对象”和“条件”拆开。先圈对象，再判断条件是否完整出现。</p>
          <strong>记住：限定词比相似词更重要</strong>
        </section>

        <section class="feedback-summary">
          <h3>本题小结</h3>
          <p>这类题先看限制条件，再排除相似说法。</p>
        </section>

        <button class="primary-button feedback-next" type="button" data-action="${nextAction}">${nextLabel}</button>
      </article>
    </section>
  `;
}

function renderDemons() {
  const highPressure = getHighPressureDemon(state);
  const activeDemons = Object.values(state.demons || {}).filter((demon) => !demon.purified);
  const pendingDemons = activeDemons.filter((demon) => demon.id !== highPressure?.id).slice(0, 2);
  const pendingList = pendingDemons.length ? pendingDemons.map((demon) => {
    const pressure = Number(demon.pressure || 0);
    const label = pressure >= 4 ? "压力高" : pressure >= 2 ? "压力中" : "压力低";
    return `
      <article class="demon-row">
        <div>
          <strong>${escapeHtml(demon.type)}心魔</strong>
          <p>${escapeHtml(demon.recentText || "复测时比较关键词差异")}</p>
        </div>
        <span>${label}</span>
      </article>
    `;
  }).join("") : `
    <article class="empty-card">
      <strong>暂时没有待复测心魔</strong>
      <p>完成题阵后，错题会在这里聚合成复盘目标。</p>
    </article>
  `;
  const highPressureValue = Math.max(0, Math.min(5, Number(highPressure?.pressure || 0)));
  const pressurePercent = highPressureValue ? (highPressureValue / 5) * 100 : 0;

  return `
    <section class="screen demons-screen">
      <header class="screen-head">
        <span class="eyebrow">心魔</span>
        <h2>心魔</h2>
        <p>把反复错因变成下一局目标</p>
      </header>

      <article class="demon-main-card">
        <article class="focus-panel">
          <span class="panel-kicker">压力最高</span>
          <div class="target-lockup">
            <strong>${escapeHtml(highPressure ? `${highPressure.type}心魔` : "无高压目标")}</strong>
            <span>${escapeHtml(highPressure?.recentText || "限定条件反复漏看，选择前需要先拆对象和条件。")}</span>
          </div>
          <div class="pressure-meter" aria-hidden="true"><span style="width: ${pressurePercent}%"></span></div>
          <div class="demon-advice">
            <strong>建议</strong>
            <span>净魔题阵 · 复盘流派</span>
          </div>
          <button class="primary-button" type="button" data-action="prepare-purify" data-demon-id="${escapeHtml(highPressure?.id || "")}" ${highPressure ? "" : "disabled"}>进入净魔题阵</button>
        </article>

        <section class="demon-list-card">
          <h3>待复测心魔</h3>
          <div class="demon-list">${pendingList}</div>
        </section>

        <p class="demon-note">再次答对后，这个错因的压力才会下降。</p>
      </article>
    </section>
  `;
}

function renderReport() {
  const report = state.lastReport || (state.currentRun ? createLearningReport(state, state.currentRun) : null);
  if (!report) {
    return renderPreflightEmpty({
      sceneClass: "report-empty-screen",
      eyebrow: "学习报告",
      title: "学习报告",
      description: "暂无本局结算",
      desktopDescription: "暂无本局结算。",
      emptyTitle: "还没有学习报告",
      emptyDescription: "完成一局 5 题题阵后，这里会生成本局小结和下一步建议。",
      desktopEmptyDescription: "完成一局 5 题题阵后，这里会生成本局小结、收获和下一步建议。",
      footnote: "报告会记录正确率、题眼短课和心魔变化。",
      sideTitle: "报告会包含",
      sideItems: ["正确率", "题眼短课", "心魔变化"],
    });
  }

  return `
    <section class="screen report-screen">
      <header class="screen-head">
        <span class="eyebrow">学习报告</span>
        <h2>学习报告</h2>
        <p>本局结算</p>
      </header>

      <article class="report-main-card">
        <article class="report-card report-summary-card">
          <h3>${Number(report.total || 0)} 题完成 · ${Number(report.correctCount || 0)} 对 ${Number(report.wrongCount || 0)} 错</h3>
          <strong>本局小结</strong>
          <p>${escapeHtml(report.nextStep || "下一局建议优先处理 1 个心魔。")}</p>
        </article>

        <article class="report-card report-gain-card">
          <h3>本局收获</h3>
          <p>${escapeHtml(report.gains || "题眼短课 3 条 · 心魔净化 1 个 · 连胜 +1")}</p>
        </article>

        <article class="report-card report-next-card">
          <h3>下一步</h3>
          <p>${escapeHtml(report.nextStep)}</p>
        </article>

        <div class="screen-actions">
          <button class="primary-button" type="button" data-action="go-start">再来一局</button>
          <button class="ghost-button target-switch" type="button" data-action="go-start">换目标</button>
        </div>
      </article>
    </section>
  `;
}

function renderPreflightEmpty({
  sceneClass,
  eyebrow,
  title,
  description,
  desktopDescription = description,
  emptyTitle,
  emptyDescription,
  desktopEmptyDescription = emptyDescription,
  footnote,
  sideTitle,
  sideItems,
}) {
  return `
    <section class="screen preflight-empty-screen ${sceneClass}">
      <header class="screen-head">
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        <h2>${escapeHtml(title)}</h2>
        <p><span class="mobile-copy">${escapeHtml(description)}</span><span class="desktop-copy">${escapeHtml(desktopDescription)}</span></p>
      </header>

      <aside class="question-rail empty-question-rail" aria-label="题阵进度">
        <span>题阵</span>
        <div class="empty-progress-rail" aria-hidden="true">
          ${Array.from({ length: 5 }, (_, index) => `<span>${index + 1}</span>`).join("")}
        </div>
      </aside>

      <article class="preflight-empty-board">
        <section class="preflight-empty-copy">
          <span class="empty-state-label">尚未开始</span>
          <h3>${escapeHtml(emptyTitle)}</h3>
          <p><span class="mobile-copy">${escapeHtml(emptyDescription)}</span><span class="desktop-copy">${escapeHtml(desktopEmptyDescription)}</span></p>
          <button class="primary-button" type="button" data-action="go-start">去开局台</button>
          <small>${escapeHtml(footnote)}</small>
        </section>

        <aside class="preflight-empty-side">
          <h3>${escapeHtml(sideTitle)}</h3>
          <div class="preflight-side-list">
            ${sideItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </aside>
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
          <h3>存档</h3>
          <p>导出或导入备份码；重置会清空本机进度。</p>
          <div class="settings-button-row">
            <button class="primary-button" type="button" data-action="export-code">导出</button>
            <button class="ghost-button" type="button" data-action="import-code">导入</button>
            <button class="danger-button" type="button" data-action="reset-progress">重置</button>
          </div>
          <textarea class="save-code ${exportedCode ? "is-open" : "is-hidden"}" readonly data-export-output placeholder="点击导出生成存档码">${escapeHtml(exportedCode)}</textarea>
          <textarea class="save-code sr-only" data-import-code>${escapeHtml(importDraft)}</textarea>
        </section>

        <section class="settings-section settings-card appearance-card">
          <h3>风格</h3>
          <p>当前${themeLabel}，可切换明亮。</p>
          <button class="theme-select-row" type="button" data-action="set-theme" data-theme-value="${state.theme === "light" ? "night" : "light"}">
            <span>主题</span>
            <strong>${themeLabel}</strong>
          </button>
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
