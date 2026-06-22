# Xiaoming Roguelite Transformation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the current route-map RPG interface into a Roguelite study loop driven by run modes, build choice, in-run encounters, mind-demon feedback, run reports, and next-run recommendations.

**Architecture:** Keep the current static browser runtime (`index.html`, `app.js`, `core.js`, `styles.css`) and add the Roguelite layer inside the existing pure-text game architecture. Core state and run generation belong in `core.js`; UI scene orchestration belongs in `app.js`; visual hierarchy belongs in `styles.css`; regression tests lock the new first-screen and player-facing copy.

**Tech Stack:** Native ES modules, Node `node:test`, static DOM UI, CSS grid/flex.

---

## File Structure

- Modify `core.js`: add run mode definitions, build definitions, recommendation generation, Roguelite run generation, answer application wrapper, and run report creation.
- Modify `app.js`: replace the world map first screen with the start desk; add goal and build selection scenes; make battle use Roguelite run metadata; make report provide next-run actions; remove the independent story entry from the primary path.
- Modify `styles.css`: replace route-heavy layout affordances with start-desk, mode-card, build-card, run-objective, encounter-progress, and report-next-step styling.
- Modify `index.html`: bump asset query strings if needed.
- Modify `tests/core.test.mjs`: add behavior tests for recommendation, three run modes, build effects, mind-demon recommendations, and report next actions.
- Modify `tests/runtime.test.mjs`: replace route/story-primary assertions with Roguelite runtime assertions.
- Modify `tests/text-game-visual-shell.test.mjs`: lock the first screen to one primary start action and forbid route-list/story prompt dominance.
- Modify `tests/player-facing-copy.test.mjs`: keep audit terms banned and add route-map-only terms that should not return to the main runtime.

---

## Task 1: Core Roguelite Model

**Files:**
- Modify: `core.js`
- Test: `tests/core.test.mjs`

- [ ] **Step 1: Write failing tests**

Add tests importing these new exports:

```js
rogueliteRunModes,
rogueliteBuildDefinitions,
createRunRecommendation,
createRogueliteRun,
createRogueliteRunReport,
```

Test that:

- the three mode ids are `explore`, `purify`, `sprint`;
- the three build ids are `steady`, `assault`, `review`;
- a fresh player receives an `explore` recommendation;
- a player with active mind demons receives a `purify` recommendation;
- `createRogueliteRun(..., { modeId: "sprint", buildId: "steady" })` creates a 5-node run with `modeId`, `buildId`, `goal`, `encounterIndex`, and `objective`.

Run:

```bash
node --test tests/core.test.mjs
```

Expected: fail because the exports do not exist.

- [ ] **Step 2: Implement minimal exports**

In `core.js`, add:

```js
export const rogueliteRunModes = [
  { id: "explore", name: "探索局", primaryAction: "点亮新概念" },
  { id: "purify", name: "净化局", primaryAction: "净化错题心魔" },
  { id: "sprint", name: "冲刺局", primaryAction: "混合检验" },
];

export const rogueliteBuildDefinitions = [
  { id: "steady", name: "稳修", risk: "低", reward: "稳" },
  { id: "assault", name: "突击", risk: "高", reward: "高" },
  { id: "review", name: "复盘", risk: "中", reward: "错题高" },
];
```

Implement `createRunRecommendation`, `createRogueliteRun`, and `createRogueliteRunReport` by reusing `selectRouteQuestions`, `createRouteRun`, `createMindDemonRun`, and `createRunReport`.

- [ ] **Step 3: Verify**

Run:

```bash
node --test tests/core.test.mjs
```

Expected: new tests pass, existing core tests pass or reveal compatibility work for the next task.

---

## Task 2: Run Mode Selection And Build Effects

**Files:**
- Modify: `core.js`
- Test: `tests/core.test.mjs`

- [ ] **Step 1: Write failing tests**

Add tests that:

- `purify` runs prioritize existing demons and expose `objective.targetDemonCount`;
- `explore` runs use mainline questions and expose `objective.targetNewConcepts`;
- `sprint` runs can mix multiple topics and expose `objective.targetCorrectCount`;
- `review` build marks the run with a mind-demon reward bias;
- `assault` build raises risk/reward copy;
- `steady` build raises tolerance copy.

Run:

```bash
node --test tests/core.test.mjs
```

Expected: fail because objective details are incomplete.

- [ ] **Step 2: Implement objectives and build metadata**

Add helper functions in `core.js`:

```js
function createRogueliteObjective(modeId, questions, player) { ... }
function getRogueliteBuild(buildId) { ... }
function describeRogueliteRun(mode, build, objective) { ... }
```

Do not create a separate file for this first pass; keep logic near existing run helpers so existing tests remain easy to inspect.

- [ ] **Step 3: Verify**

Run:

```bash
node --test tests/core.test.mjs
```

Expected: pass.

---

## Task 3: Start Desk Runtime

**Files:**
- Modify: `app.js`
- Modify: `tests/runtime.test.mjs`
- Modify: `tests/text-game-visual-shell.test.mjs`

- [ ] **Step 1: Write failing tests**

In runtime tests assert:

- `app.js` imports `createRunRecommendation`, `createRogueliteRun`, and `rogueliteBuildDefinitions`;
- `playableScenes` contains `world`, `mode`, `build`, `battle`, `review`, `daily`, `dashboard`, `report`, but no longer exposes `story` as a primary scene;
- `navItems` no longer contains `["story", "剧情"]`;
- `renderWorldStage` renders `开始一局`, `换目标`, and `今日推荐`;
- `renderModernWorldStage` route-list strings are absent.

In visual-shell tests assert:

- the first screen includes `start-desk`;
- the source contains exactly one primary start action label `开始一局`;
- the world source does not contain `章节提示`.

Run:

```bash
node --test tests/runtime.test.mjs tests/text-game-visual-shell.test.mjs
```

Expected: fail against current route-map UI.

- [ ] **Step 2: Implement start desk**

In `app.js`:

- import the new core exports;
- replace `renderModernWorldStage` with a start desk that renders recommendation, objective preview, recommended build, and one primary `开始一局` action;
- add `selectedRunModeId` and `selectedBuildId` state;
- add `startRecommendedRun`, `showModeSelect`, and `showBuildSelect`;
- keep save import/export and dashboard as secondary actions.

- [ ] **Step 3: Verify**

Run:

```bash
node --test tests/runtime.test.mjs tests/text-game-visual-shell.test.mjs
```

Expected: pass.

---

## Task 4: Goal And Build Selection Scenes

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Test: `tests/runtime.test.mjs`

- [ ] **Step 1: Write failing tests**

Assert that:

- `renderModeSelectStage` exists and renders `探索新题`, `净化心魔`, `综合冲刺`;
- `renderBuildSelectStage` exists and renders `稳修`, `突击`, `复盘`;
- each selection path calls `createRogueliteRun`;
- mode and build cards expose risk/reward text.

Run:

```bash
node --test tests/runtime.test.mjs
```

Expected: fail because scenes do not exist.

- [ ] **Step 2: Implement scenes**

Add `mode` and `build` scenes. `mode` lets the user override the recommended run mode. `build` lets the user override the recommended build before entering battle.

- [ ] **Step 3: Style scenes**

Add `.start-desk`, `.mode-grid`, `.mode-card`, `.build-grid`, `.build-card`, `.primary-action`, and responsive rules in `styles.css`.

- [ ] **Step 4: Verify**

Run:

```bash
node --test tests/runtime.test.mjs tests/text-game-visual-shell.test.mjs
```

Expected: pass.

---

## Task 5: In-Run Battle And Report

**Files:**
- Modify: `app.js`
- Modify: `core.js`
- Test: `tests/core.test.mjs`
- Test: `tests/runtime.test.mjs`

- [ ] **Step 1: Write failing tests**

Core tests:

- `createRogueliteRunReport` includes `modeId`, `buildId`, `resultLabel`, `primaryMistake`, `nextActions`, `newDemonCount`, and `purifiedDemonCount`.

Runtime tests:

- battle screen renders `本局目标`;
- battle screen renders encounter progress;
- report screen renders `本局报告`, `下一局建议`, `继续净化`, `探索新题`, or `综合冲刺`.

Run:

```bash
node --test tests/core.test.mjs tests/runtime.test.mjs
```

Expected: fail.

- [ ] **Step 2: Implement run metadata in battle**

Use the Roguelite run object in the existing battle scene. Display objective progress and encounter count. Keep existing answer handling through `applyTrialAnswer` for compatibility.

- [ ] **Step 3: Implement Roguelite report**

Use `createRogueliteRunReport` after run completion. Include next action buttons that set mode/build and start another run.

- [ ] **Step 4: Verify**

Run:

```bash
node --test tests/core.test.mjs tests/runtime.test.mjs
```

Expected: pass.

---

## Task 6: Remove Primary Story Path And Eventize Copy

**Files:**
- Modify: `app.js`
- Modify: `tests/runtime.test.mjs`
- Modify: `tests/player-facing-copy.test.mjs`

- [ ] **Step 1: Write failing tests**

Assert:

- no primary `剧情` nav item;
- no `章节提示` action;
- `getIntroDialogue` copy is no longer used as a primary path;
- player-facing runtime does not contain `正式主线`, `章节提示`, or `完成剧情`.

Run:

```bash
node --test tests/runtime.test.mjs tests/player-facing-copy.test.mjs
```

Expected: fail if old strings remain.

- [ ] **Step 2: Remove primary story affordances**

Keep legacy functions only if needed for old tests or save compatibility, but remove them from primary runtime navigation and first-screen actions. Move useful character text into start-desk brief, encounter feedback, and report copy.

- [ ] **Step 3: Verify**

Run:

```bash
node --test tests/runtime.test.mjs tests/player-facing-copy.test.mjs
```

Expected: pass.

---

## Task 7: Full Regression And Preview

**Files:**
- All touched files.

- [ ] **Step 1: Run full tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Start or verify local preview**

Run:

```bash
python3 -m http.server 4192
curl -I http://127.0.0.1:4192/
```

Expected: HTTP 200. If the server is already running, only run the curl probe.

- [ ] **Step 3: Final status**

Report:

- files changed;
- tests run;
- preview URL;
- any remaining limitations from the transformation plan.

