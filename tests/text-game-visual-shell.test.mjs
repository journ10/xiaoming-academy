import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync("app.js", "utf8");
const cssSource = readFileSync("styles.css", "utf8");

test("world screen renders the modern text-game stage contract", () => {
  assert.match(appSource, /renderStartDesk/u);
  assert.match(appSource, /start-desk/u);
  assert.match(appSource, /今日小目标/u);
  assert.match(appSource, /开一页题眼手账/u);
  assert.match(appSource, /本页奖励/u);
  assert.match(appSource, /开一页题眼手账/u);
  assert.match(appSource, /换目标/u);
  assert.match(appSource, /今日小目标/u);
  assert.match(appSource, /下一页建议/u);
  assert.doesNotMatch(appSource, /章节提示/u);
  assert.doesNotMatch(appSource, /备考路线/u);
  assert.match(appSource, /scene = resolveInitialScene\(\) \|\| saved\.scene \|\| "world"/u);
});

test("visual shell CSS matches the mobile-first study journal design", () => {
  assert.match(cssSource, /--ui-bg:\s*#f6efe3/u);
  assert.match(cssSource, /--ui-paper:\s*#fffaf0/u);
  assert.match(cssSource, /--ui-jade:\s*#53c6a2/u);
  assert.match(cssSource, /--ui-coral:\s*#e87f6d/u);
  assert.match(cssSource, /\.rpg-shell\s*\{[^}]*grid-template-areas:\s*"hud hud"[\s\S]*"stage quest"/u);
  assert.match(cssSource, /\.rpg-shell\s*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\)/u);
  assert.match(cssSource, /\.hud-stats\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/u);
  assert.match(cssSource, /@media \(max-width:\s*760px\)[\s\S]*grid-template-rows:\s*auto auto auto/u);
  assert.doesNotMatch(cssSource, /\.hud-stat:nth-child/u);
  assert.match(cssSource, /\.start-desk/u);
  assert.match(cssSource, /\.journal-sticker/u);
  assert.match(cssSource, /\.journal-summary/u);
  assert.match(cssSource, /\.mode-card/u);
  assert.match(cssSource, /\.build-card/u);
  assert.match(cssSource, /\.quest-reward-card\s*\{[\s\S]*gap:\s*14px/u);
  assert.match(cssSource, /\.quest-reward-card\s+\.text-meter,\s*\.quest-reward-card\s+\.meter\s*\{[\s\S]*margin:\s*4px 0/u);
  assert.match(cssSource, /\.quest-reward-card\s+\.meter\s*\{[\s\S]*margin:\s*4px 0/u);
  assert.match(cssSource, /\.hud-button\.danger,\s*\.danger\s*\{[\s\S]*color:\s*#8f2233/u);
  assert.match(cssSource, /\.hud-button\.danger,\s*\.danger\s*\{[\s\S]*background:\s*rgba\(225,\s*90,\s*111,\s*0\.12\)/u);
  assert.doesNotMatch(cssSource, /color:\s*#ffd8de/u);
  assert.match(cssSource, /\.text-window \.question-card\s*\{[\s\S]*display:\s*none/u);
});

test("persistent HUD exposes current run state, not resource or audit counters", () => {
  const renderHudSource = appSource.match(/function renderHud\(\) \{[\s\S]*?\n\}/u)?.[0] ?? "";

  assert.match(renderHudSource, /hudStat\("心力"/u);
  assert.match(renderHudSource, /hudStat\("本局"/u);
  assert.match(renderHudSource, /hudStat\("目标"/u);
  assert.match(renderHudSource, /hudStat\("题眼"/u);
  assert.match(renderHudSource, /formatHudRunProgress/u);
  assert.match(renderHudSource, /formatHudLessonState/u);
  assert.doesNotMatch(renderHudSource, /hudStat\("能量"|hudStat\("星辉"|hudStat\("书页"|getEnergyState|normalizeMaterialBag/u);
  assert.doesNotMatch(renderHudSource, /正式题|待归类|题位|暂缓|mainlineQuestionCount|manualClassificationCount|sourceTotalQuestionSlots|reviewQuestionCount/u);
  assert.doesNotMatch(appSource, /inline-toast[\s\S]*正式题/u);
});

test("mobile shell keeps the page scrollable below the design screenshot height", () => {
  const mobileBlock = cssSource.match(/@media \(max-width:\s*760px\)\s*\{([\s\S]*)\}\s*$/u)?.[1] ?? "";

  assert.match(mobileBlock, /body\s*\{[^}]*min-height:\s*100dvh/u);
  assert.match(mobileBlock, /\.rpg-shell\s*\{[^}]*min-height:\s*100dvh/u);
  assert.match(mobileBlock, /\.rpg-shell\s*\{[^}]*grid-template-rows:\s*auto auto auto/u);
  assert.match(mobileBlock, /\.hud-actions\s*\{[\s\S]*display:\s*flex/u);
  assert.match(mobileBlock, /\.hud-actions\s+\.hud-button\s*\{[\s\S]*min-height:\s*44px/u);
  assert.doesNotMatch(mobileBlock, /\.hud-actions\s*\{[^}]*display:\s*none/u);
  assert.doesNotMatch(mobileBlock, /\.rpg-shell\s*\{[^}]*grid-template-rows:\s*136px/u);
  assert.doesNotMatch(mobileBlock, /\.rpg-shell\s*\{[^}]*height:\s*844px/u);
  assert.doesNotMatch(mobileBlock, /\.rpg-shell\s*\{[^}]*overflow:\s*hidden/u);
});

test("mobile battle keeps submit controls adjacent to answer options", () => {
  assert.match(appSource, /renderBattleQuestionCard\(\{ question, mechanicState, options \}\)[\s\S]*renderBattleActionBar\(question\)[\s\S]*renderBattleSupportPanel\(\{ node, question, mechanicState \}\)/u);
  assert.match(cssSource, /\.battle-main\s*\{[\s\S]*grid-template-areas:\s*"question support"[\s\S]*"actions actions"/u);
  assert.match(cssSource, /\.battle-question-card\s*\{[\s\S]*grid-area:\s*question/u);
  assert.match(cssSource, /\.battle-support-panel\s*\{[\s\S]*grid-area:\s*support/u);
  assert.match(cssSource, /\.battle-action-bar\s*\{[\s\S]*grid-area:\s*actions/u);
  assert.match(cssSource, /\.battle-action-bar\s*\{[\s\S]*grid-template-areas:\s*"meta buttons"/u);
  assert.match(cssSource, /\.battle-action-meta\s*\{[\s\S]*grid-area:\s*meta/u);
  assert.match(cssSource, /\.battle-action-buttons\s*\{[\s\S]*grid-area:\s*buttons/u);
  assert.match(cssSource, /@media \(max-width:\s*860px\)\s*\{[\s\S]*\.battle-main\s*\{[\s\S]*grid-template-areas:\s*"question"[\s\S]*"actions"[\s\S]*"support"/u);
  assert.match(cssSource, /@media \(max-width:\s*860px\)\s*\{[\s\S]*\.battle-action-bar\s*\{[\s\S]*grid-template-areas:\s*"buttons"[\s\S]*"meta"/u);
});
