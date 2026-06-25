import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const cacheVersion = "runtime-redesign-20260625";

function read(file) {
  return readFileSync(file, "utf8");
}

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing function ${name}`);
  const next = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

test("static entry loads the redesigned runtime shell", () => {
  const index = read("index.html");

  assert.match(index, /<title>小明书院：真题题阵<\/title>/u);
  assert.match(index, new RegExp(`href="\\./styles\\.css\\?v=${cacheVersion}"`));
  assert.match(index, new RegExp(`src="\\./app\\.js\\?v=${cacheVersion}"`));
  assert.match(index, /class="app-shell"/);
  assert.match(index, /data-theme="night"/);
  assert.doesNotMatch(index, /rpg-shell|game-hud|quest-panel|题眼手账/u);
});

test("browser runtime imports the new core API only", () => {
  const app = read("app.js");

  for (const name of [
    "applyAnswer",
    "breakMoves",
    "createInitialState",
    "createLearningReport",
    "createObservationHint",
    "createRun",
    "createStartRecommendation",
    "decodeSaveState",
    "encodeSaveState",
    "getHighPressureDemon",
    "judgeAnswer",
    "prepareQuestionBank",
    "runTargets",
    "studyStyles",
  ]) {
    assert.match(app, new RegExp(`\\b${name}\\b`), `missing ${name}`);
  }

  assert.doesNotMatch(app, /createStoryChapters|createDailyQuestState|createLearningDashboard|studyNode|applyTrialAnswer/);
});

test("browser runtime exposes exactly the five primary scenes", () => {
  const app = read("app.js");

  for (const name of ["renderStart", "renderRun", "renderDemons", "renderReport", "renderSettings"]) {
    assert.match(app, new RegExp(`function ${name}\\(`));
  }

  assert.match(app, /const scenes = \["start", "run", "demons", "report", "settings"\]/);
  assert.doesNotMatch(app, /renderTrainingStage|renderDailyStage|renderDashboardStage|renderModeSelectStage|renderBuildSelectStage/);
});

test("runtime keeps built-in question bank loading and lazy chunk hydration", () => {
  const app = read("app.js");

  assert.match(app, /data\/question-index\.json/);
  assert.match(app, /data\/questions\.runtime\.json/);
  assert.match(app, /data\/question-chunks/);
  assert.match(app, /async function loadBuiltInQuestionBank\(/);
  assert.match(app, /async function ensureQuestionsHydrated\(/);
  assert.match(app, /async function loadQuestionChunk\(/);
  assert.match(app, /loadedQuestionChunkIds/);
  assert.match(app, /hydratedQuestionById/);
});

test("built-in question bank prefers the lazy index instead of loading the full runtime payload", () => {
  const app = read("app.js");
  const body = functionBody(app, "loadBuiltInQuestionBank");

  assert.match(body, /loadQuestionIndex\(/);
  assert.match(body, /loadRuntimeQuestionBank\(/);
  assert.doesNotMatch(body, /fetchFirstJson\(runtimeQuestionUrls\)/);
  assert.match(app, /data\/question-index\.json\.gz/);
});

test("start scene supports continuing unfinished runs and local target/style selection", () => {
  const app = read("app.js");
  const body = functionBody(app, "renderStart");

  assert.match(body, /currentRun/);
  assert.match(body, /换目标/u);
  assert.match(body, /进入题阵/u);
  assert.match(body, /拓新题阵/u);
  assert.match(body, /净魔题阵/u);
  assert.match(body, /冲刺题阵/u);
  assert.match(body, /稳修/u);
  assert.match(body, /突击/u);
  assert.match(body, /复盘/u);
});

test("run scene locks observation hints and keeps answer submission adjacent", () => {
  const app = read("app.js");
  const body = functionBody(app, "renderRun");

  assert.match(body, /observeRevealed/);
  assert.match(body, /createObservationHint/);
  assert.match(body, /观照/u);
  assert.match(body, /确认答案/u);
  assert.match(body, /selectedKeys/);
  assert.doesNotMatch(body, /正确答案.*observe|低收益看答案/u);
});

test("settings scene keeps save-code import export reset and theme switching", () => {
  const app = read("app.js");
  const body = functionBody(app, "renderSettings");

  assert.match(body, /导出/u);
  assert.match(body, /导入/u);
  assert.match(body, /重置/u);
  assert.match(body, /明亮/u);
  assert.match(body, /夜读/u);
  assert.match(body, /data-theme-menu/u);
  assert.match(body, /data-action="toggle-theme-menu"/u);
  assert.match(body, /role="listbox"/u);
  assert.doesNotMatch(body, /<select|data-theme-select|theme-select-row|theme-segment/u);
  assert.match(app, /function exportSaveCode\(/);
  assert.match(app, /function importSaveCode\(/);
  assert.match(app, /function resetProgress\(/);
  assert.doesNotMatch(body, /XM-7K2-4P9/u);
});

test("stylesheet implements the light and night responsive design system", () => {
  const css = read("styles.css");

  for (const token of [
    "[data-theme=\"light\"]",
    "[data-theme=\"night\"]",
    ".bottom-nav",
    ".top-nav",
    ".run-progress-rail",
    ".observe-hint",
    ".theme-select-control",
    ".theme-select-menu",
    "@media (min-width: 760px)",
    "prefers-reduced-motion",
  ]) {
    assert.match(css, new RegExp(escapeRegExp(token)), `missing ${token}`);
  }
  assert.doesNotMatch(css, /theme-select-row|theme-segment|data-theme-select/u);
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
