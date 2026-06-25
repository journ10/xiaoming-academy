import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexSource = readFileSync("index.html", "utf8");
const appSource = readFileSync("app.js", "utf8");
const cssSource = readFileSync("styles.css", "utf8");

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing function ${name}`);
  const next = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

test("static shell exposes the redesigned app frame and not the old shell", () => {
  assert.match(indexSource, /class="app-shell"/u);
  assert.match(indexSource, /class="top-nav"/u);
  assert.match(indexSource, /class="bottom-nav"/u);
  assert.match(indexSource, /data-view-root/u);
  assert.match(indexSource, /真题题阵/u);
  assert.doesNotMatch(indexSource, /status-bar|20:41|5G 89%/u);
  assert.doesNotMatch(indexSource, /rpg-shell|game-hud|quest-panel/u);
});

test("navigation source is limited to the five primary entries", () => {
  assert.match(appSource, /const scenes = \["start", "run", "demons", "report", "settings"\]/u);
  assert.match(appSource, /start: "开局台"/u);
  assert.match(appSource, /run: "题阵"/u);
  assert.match(appSource, /demons: "心魔"/u);
  assert.match(appSource, /report: "学习报告"/u);
  assert.match(appSource, /settings: "设置"/u);
  assert.doesNotMatch(appSource, /world|training|daily|dashboard/u);
});

test("visual system implements light and night responsive shells", () => {
  assert.match(cssSource, /\[data-theme="light"\]\s*\{/u);
  assert.match(cssSource, /\[data-theme="night"\]\s*\{/u);
  assert.match(cssSource, /--frame-w:\s*390px/u);
  assert.match(cssSource, /--pc-w:\s*1360px/u);
  assert.match(cssSource, /--pc-h:\s*820px/u);
  assert.match(cssSource, /--pc-nav-h:\s*106px/u);
  assert.match(cssSource, /\.app-shell\s*\{[\s\S]*min-height:\s*100dvh/u);
  assert.match(cssSource, /\.top-nav\s*\{/u);
  assert.match(cssSource, /\.bottom-nav\s*\{[\s\S]*position:\s*absolute/u);
  assert.match(cssSource, /@media \(min-width:\s*760px\)[\s\S]*\.app-shell\s*\{[\s\S]*width:\s*var\(--pc-w\)/u);
  assert.match(cssSource, /@media \(min-width:\s*760px\)[\s\S]*\.top-nav\s*\{[\s\S]*height:\s*var\(--pc-nav-h\)/u);
  assert.match(cssSource, /@media \(min-width:\s*760px\)[\s\S]*\.bottom-nav\s*\{[\s\S]*display:\s*none/u);
  assert.doesNotMatch(cssSource, /\.app-shell:has\(\.settings-screen\) \.top-nav/u);
  assert.doesNotMatch(cssSource, /\.app-shell:has\(\.answer-dock\.is-empty\) \.top-nav/u);
  assert.doesNotMatch(cssSource, /status-bar|--frame-h/u);
  assert.doesNotMatch(cssSource, /grid-template-columns:\s*220px minmax\(0,\s*1fr\)/u);
  assert.doesNotMatch(cssSource, /\.rpg-shell|\.hud-stats|\.quest-panel/u);
});

test("start screen renders unfinished-run continuation and local choices", () => {
  const body = functionBody(appSource, "renderStart");

  assert.match(body, /currentRun/u);
  assert.match(body, /继续题阵/u);
  assert.match(body, /换目标/u);
  assert.match(body, /进入题阵/u);
  assert.match(body, /choice-card/u);
  assert.match(body, /choice-chip/u);
  assert.match(body, /推荐流派/u);
  assert.match(body, /推荐理由/u);
  assert.match(body, /本周目标/u);
});

test("run progress rail is display-only", () => {
  const body = functionBody(appSource, "renderProgressRail");

  assert.match(body, /run-progress-rail/u);
  assert.match(body, /<span/u);
  assert.doesNotMatch(body, /<button|data-action|goQuestion|jump/u);
});

test("run screen keeps question options, break moves, and submit controls adjacent", () => {
  const body = functionBody(appSource, "renderRun");

  assert.match(body, /question-rail[\s\S]*run-board[\s\S]*lesson-strip[\s\S]*question-panel[\s\S]*move-panel[\s\S]*option-grid[\s\S]*answer-dock[\s\S]*run-actions/u);
  assert.match(body, /确认答案/u);
  assert.match(body, /observeRevealed/u);
  assert.match(body, /createObservationHint/u);
  assert.match(body, /selectedKeys/u);
  assert.doesNotMatch(body, /support-panel|separate-dock|sidebar-answer/u);
});

test("settings screen keeps theme switching and save-code controls", () => {
  const body = functionBody(appSource, "renderSettings");

  assert.match(body, /theme-segment/u);
  assert.match(body, /明亮/u);
  assert.match(body, /夜读/u);
  assert.match(body, /save-code/u);
  assert.match(body, /导出/u);
  assert.match(body, /导入/u);
  assert.match(body, /重置/u);
});
