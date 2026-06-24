# Academy Runtime Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild 小明书院 as the confirmed five-entry, five-question roguelite study loop with no legacy chapter/RPG/journal systems.

**Architecture:** Replace `core.js` with a pure study-run domain module and replace `app.js` with a small browser state machine for `start`, `run`, `demons`, `report`, and `settings`. Rebuild `styles.css` around light/night design tokens from the Pencil mockups, while leaving the PDF question-bank data pipeline untouched.

**Tech Stack:** Browser ES modules, Node's built-in `node:test`, static HTML/CSS/JS, existing JSON runtime question bank and lazy chunk files.

---

## File Structure

- Modify `core.js`: New pure runtime domain API. Owns question preparation, reliable-question filtering, run recommendation, run creation, answer judging, observation hints, demon updates, report generation, and save parsing.
- Modify `app.js`: New UI state machine. Owns loading the runtime bank, localStorage save state, scene navigation, theme switching, run interaction, import/export/reset, and DOM rendering.
- Modify `styles.css`: New light/night theme and responsive layout matching the Pencil screens.
- Modify `index.html`: Simplified app shell and cache-busted asset version.
- Replace `tests/core.test.mjs`: New domain tests for the simplified runtime.
- Replace `tests/runtime.test.mjs`: New static/source contract tests for browser runtime and UI vocabulary.
- Replace `tests/player-facing-copy.test.mjs`: New banned-copy test covering old visible terms.
- Keep existing PDF/content tests unless they directly import removed core exports. If removed exports break unrelated content tests, update those tests to assert data artifacts directly instead of runtime gameplay functions.

## Task 1: Core Contract Tests

**Files:**
- Modify: `tests/core.test.mjs`
- Later modify: `core.js`

- [x] **Step 1: Write failing core contract tests**

Replace `tests/core.test.mjs` with tests that import only the new core API:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAnswer,
  createInitialState,
  createLearningReport,
  createObservationHint,
  createRun,
  createStartRecommendation,
  judgeAnswer,
  normalizeAnswer,
  prepareQuestionBank,
  selectRunQuestions,
} from "../core.js";

const rawQuestions = [
  question("law-1", "教育法律法规与政策制度", "单项选择", "B", ["reading-mistake"], "义务教育阶段入学保障的关键词是什么？"),
  question("law-2", "教育法律法规与政策制度", "单项选择", "A", ["reading-mistake"], "教师申诉制度首先保护什么？"),
  question("psy-1", "学习心理与认知机制", "单项选择", "C", ["concept-confusion"], "有意义学习的关键是什么？"),
  question("teach-1", "教育学原理、课程与教学", "多项选择", "ABC", ["multi-miss"], "教案通常需要考虑哪些内容？"),
  question("class-1", "德育、班级管理与家校协同", "单项选择", "B", ["application-error"], "班级突发冲突首先要做什么？"),
  question("child-1", "学生身心发展与个体差异", "判断题", "B", ["memory-gap"], "小学生情绪支持是否只看结果？"),
  question("teacher-1", "教师职业素养与专业规范", "单项选择", "D", ["concept-confusion"], "教师职业素养的核心要求是什么？"),
  { ...question("manual-1", "待人工归类", "单项选择", "A", [], "待复核题不应进入推荐。"), qualityStatus: "manual_review" },
];

function question(id, domain, type, answer, errorPatterns, stem) {
  return {
    id,
    stem,
    type,
    topic: domain,
    primaryDomain: { id: domain, name: domain },
    options: ["A", "B", "C", "D"].map((key) => ({ key, text: `${key} 选项` })),
    answer,
    explanation: `考点：${domain}。题眼是限定词、对象和条件。错因是没有抓住关键限定。`,
    difficulty: 2,
    qualityStatus: "verified",
    errorPatterns,
  };
}

test("prepareQuestionBank keeps six real domains and excludes manual-review questions from runs", () => {
  const bank = prepareQuestionBank(rawQuestions);

  assert.equal(bank.playable.length, 7);
  assert.equal(bank.manualReview.length, 1);
  assert.equal(bank.playable.some((item) => item.primaryDomain.name === "待人工归类"), false);
  assert.equal(bank.playable.some((item) => item.primaryDomain.name === "综合知识"), false);
});

test("fresh start recommendation defaults to explore run with steady style", () => {
  const bank = prepareQuestionBank(rawQuestions);
  const recommendation = createStartRecommendation(bank.playable, createInitialState());

  assert.equal(recommendation.targetId, "explore");
  assert.equal(recommendation.styleId, "steady");
  assert.match(recommendation.title, /拓新题阵/);
});

test("selectRunQuestions builds five-question runs and backfills from reliable history", () => {
  const bank = prepareQuestionBank(rawQuestions);
  const selected = selectRunQuestions(bank.playable.slice(0, 3), createInitialState(), { targetId: "explore", length: 5, fallbackQuestions: bank.playable });

  assert.equal(selected.length, 5);
  assert.equal(new Set(selected.map((item) => item.id)).size, 5);
});

test("purify runs prioritize high-pressure demon questions", () => {
  const bank = prepareQuestionBank(rawQuestions);
  const state = createInitialState({
    demons: {
      "reading-mistake": {
        id: "reading-mistake",
        type: "审题失误",
        pressure: 8,
        questionIds: ["law-2"],
        recentText: "最近漏看限定词",
        purified: false,
      },
    },
  });
  const run = createRun(bank.playable, state, { targetId: "purify", styleId: "review", focusDemonId: "reading-mistake" });

  assert.equal(run.questions[0].id, "law-2");
  assert.equal(run.questions.length, 5);
});

test("answer judging normalizes multi-select order", () => {
  const multi = rawQuestions.find((item) => item.id === "teach-1");

  assert.equal(normalizeAnswer("CBA", multi.options), "ABC");
  assert.equal(judgeAnswer(multi, ["C", "A", "B"]).isCorrect, true);
});

test("observation hint reveals a cue without exposing the answer", () => {
  const hint = createObservationHint(rawQuestions[0]);

  assert.match(hint.text, /题眼|限定|对象|条件/);
  assert.equal(hint.revealsAnswer, false);
  assert.doesNotMatch(hint.text, /正确答案|答案是|B 选项/);
});

test("wrong answers generate demons and reports summarize next action", () => {
  const bank = prepareQuestionBank(rawQuestions);
  let state = createInitialState();
  const run = createRun(bank.playable, state, { targetId: "explore", styleId: "steady" });

  const result = applyAnswer(state, run, run.questions[0].id, {
    selectedKeys: ["A"],
    breakMoveId: "steady",
  });

  state = result.state;
  assert.equal(result.answer.isCorrect, false);
  assert.equal(Object.values(state.demons).length, 1);

  const report = createLearningReport(state, result.run);
  assert.match(report.summary, /5 题|题阵|错/);
  assert.ok(report.nextStep);
});
```

- [x] **Step 2: Run core tests to verify RED**

Run: `node --test tests/core.test.mjs`

Expected: FAIL because the new exports such as `createInitialState`, `prepareQuestionBank`, and `applyAnswer` do not exist yet.

## Task 2: Core Implementation

**Files:**
- Modify: `core.js`
- Test: `tests/core.test.mjs`

- [x] **Step 1: Replace core with the new pure API**

Rewrite `core.js` around these exported functions and constants:

```js
export const runTargets = [
  { id: "explore", name: "拓新题阵" },
  { id: "purify", name: "净魔题阵" },
  { id: "sprint", name: "冲刺题阵" },
];

export const studyStyles = [
  { id: "steady", name: "稳修" },
  { id: "assault", name: "突击" },
  { id: "review", name: "复盘" },
];

export const breakMoves = [
  { id: "steady", name: "稳破" },
  { id: "assault", name: "强攻" },
  { id: "observe", name: "观照" },
];
```

Implementation requirements:

- `prepareQuestionBank` returns `{ playable, manualReview }`.
- `createInitialState(overrides)` returns version 2 save state with `theme`, `answered`, `demons`, `currentRun`, and `lastReport`.
- `selectRunQuestions` returns exactly `length` unique reliable questions when enough fallback questions exist.
- `createRun` returns `{ id, targetId, styleId, focusDemonId, questions, currentIndex, answers, completed, startedAt }`.
- `judgeAnswer` compares normalized selected keys against normalized answer.
- `applyAnswer` returns `{ state, run, answer }` and records history, submitted answer, demon updates, and completion.
- Wrong answers map error patterns to player-facing demon types: `reading-mistake -> 审题失误`, `concept-confusion -> 概念混淆`, `memory-gap -> 记忆盲区`, `application-error -> 应用失误`, `multi-miss -> 多选漏选`, fallback `过度自信`.
- Correct answers in purify runs reduce pressure for related demons and mark pressure 0 demons as purified.
- `createLearningReport` returns `{ title, summary, gains, nextStep }` and no material/journal fields.

- [x] **Step 2: Run core tests to verify GREEN**

Run: `node --test tests/core.test.mjs`

Expected: PASS.

## Task 3: Runtime Source Contract Tests

**Files:**
- Modify: `tests/runtime.test.mjs`
- Modify: `tests/player-facing-copy.test.mjs`
- Later modify: `index.html`, `app.js`, `styles.css`

- [x] **Step 1: Replace runtime tests with new source-level contract**

`tests/runtime.test.mjs` should assert:

- `index.html` loads `app.js` and `styles.css` with the new cache token `runtime-redesign-20260624`.
- `app.js` imports only the new core API names.
- `app.js` contains render functions for `renderStart`, `renderRun`, `renderDemons`, `renderReport`, and `renderSettings`.
- `app.js` contains `loadBuiltInQuestionBank`, `ensureQuestionsHydrated`, and chunk URL handling.
- `app.js` contains `exportSaveCode`, `importSaveCode`, and `resetProgress`.
- `styles.css` contains `[data-theme="light"]`, `[data-theme="night"]`, `.bottom-nav`, `.top-nav`, `.run-progress-rail`, and `.observe-hint`.

`tests/player-facing-copy.test.mjs` should ban at least:

```js
[
  "地图",
  "练功",
  "战斗",
  "学习风格",
  "章节机制",
  "章节封印",
  "题眼手账",
  "今日清单",
  "学习仪表盘",
  "材料",
  "心力",
  "正式题",
  "待归类",
  "源题位",
  "可玩题"
]
```

- [x] **Step 2: Run runtime tests to verify RED**

Run: `node --test tests/runtime.test.mjs tests/player-facing-copy.test.mjs`

Expected: FAIL because current runtime still has old scenes and copy.

## Task 4: Browser Runtime Rewrite

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Test: `tests/runtime.test.mjs`
- Test: `tests/player-facing-copy.test.mjs`

- [x] **Step 1: Rewrite `index.html` shell**

Use a small shell:

```html
<main class="app-shell" data-app data-theme="night">
  <section id="app" class="app-stage" data-stage aria-live="polite"></section>
  <div class="toast" data-toast role="status" aria-live="polite"></div>
</main>
```

Keep the skip link, title `小明书院：真题题阵`, and cache token `runtime-redesign-20260624`.

- [x] **Step 2: Rewrite `app.js` scene state**

Implement:

- Scene ids: `start`, `run`, `demons`, `report`, `settings`.
- `navigate(scene)` preserving `currentRun`.
- `renderNav(activeScene)` with labels `开局台`, `题阵`, `心魔`, `学习报告`, `设置`.
- `renderStart` with recommendation, target chooser, style chooser, `进入题阵`, and `换目标`.
- `renderRun` with question progress, options, break moves, observe hint, selected answer, submit, feedback, and next question/report transition.
- `renderDemons` with high-pressure demon, waiting list, and `进入净魔题阵`.
- `renderReport` with summary, gains, next step, and `再来一局`.
- `renderSettings` with save-code export/import/reset and theme select.
- Local storage key `xiaoming-academy-runtime-v2`.
- Save-code helpers using base64 JSON and version 2 validation.

- [x] **Step 3: Rewrite `styles.css` from design tokens**

Implement:

- Light and night CSS variables.
- Mobile-first shell with bottom nav.
- Desktop top nav at wider breakpoints.
- Cards, segmented controls, option rows, feedback panels, heart-demon pressure bars, report cards, settings controls.
- `prefers-reduced-motion` guard.

- [x] **Step 4: Run runtime source tests to verify GREEN**

Run: `node --test tests/runtime.test.mjs tests/player-facing-copy.test.mjs`

Expected: PASS.

## Task 5: Content and PDF Tests Compatibility

**Files:**
- Modify only tests that import removed core exports:
  - `tests/redesign-gameplay.test.mjs`
  - `tests/text-game-visual-shell.test.mjs`
  - Any other failing test reported by `npm test`

- [x] **Step 1: Run full test suite**

Run: `npm test`

Expected: Some old tests may fail because they import removed RPG/journal exports.

- [x] **Step 2: Replace old gameplay tests with new gameplay tests**

Update failing old gameplay tests to assert the new core/browser contract:

- Six real learning domains remain.
- Manual-review questions stay out of runs.
- No old visible terms in runtime files.
- New core creates five-question runs and reports.

- [x] **Step 3: Run full suite**

Run: `npm test`

Expected: PASS.

## Task 6: Browser Verification

**Files:**
- No code changes unless visual/browser verification reveals an issue.

- [x] **Step 1: Start fixed preview server**

Run: `npm start`

Expected: server listens on `http://localhost:4190`.

- [x] **Step 2: Inspect app in browser**

Use the browser skill or local browser tooling to verify:

- Initial screen renders the开局台.
- Theme switch changes light/night without reloading.
- Opening a题阵 displays five-question progress.
- Observing a question shows only the hint and locks the move.
- Settings export/import/reset controls are visible.
- Mobile layout keeps submit controls adjacent to answer options.

- [x] **Step 3: Stop preview server**

Stop the `npm start` process before finishing.

## Task 7: Final Verification and Commit

**Files:**
- All implementation and test files changed above.

- [x] **Step 1: Run final full tests**

Run: `npm test`

Expected: PASS with 0 failures.

- [x] **Step 2: Check git status**

Run: `git status --short`

Expected: implementation files changed; `academy-design.pen` may remain modified by the user and must not be staged.

- [x] **Step 3: Stage implementation only**

Run: `git add index.html app.js core.js styles.css tests/core.test.mjs tests/runtime.test.mjs tests/player-facing-copy.test.mjs tests/redesign-gameplay.test.mjs tests/text-game-visual-shell.test.mjs docs/superpowers/plans/2026-06-24-academy-runtime-redesign.md`

Do not stage `academy-design.pen`.

- [x] **Step 4: Commit implementation**

Run: `git commit -m "Rebuild study run runtime"`

Expected: commit succeeds on `codex/runtime-redesign`.

## Self-Review

- Spec coverage: The plan covers the five-entry IA, full core rewrite, full app/style rewrite, double theme, settings save code, old-copy removal, TDD tests, full test verification, and browser verification.
- Placeholder scan: No task relies on TBD/TODO. Implementation tasks reference concrete exported functions, scene names, cache token, storage key, commands, and expected outputs.
- Type consistency: `targetId`, `styleId`, `breakMoveId`, `currentRun`, `demons`, and `lastReport` match the design spec and are used consistently across core/app/test tasks.
