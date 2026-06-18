# Xiaoming Academy Docs Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:test-driven-development` for each implementation slice and `superpowers:verification-before-completion` before claiming completion. Track progress by updating these checkboxes.

**Goal:** Bring the playable pure-text web game into behavioral parity with `docs/01` through `docs/07`, using the two PDFs in `docs/` as source truth. The docs still say 4,077 questions in several places, but runtime/product validation must use the verified PDF source count: 52 exams * 90 slots = 4,680 source question slots, with playable/needs-review counts reported separately.

**Architecture:** Keep `core.js` as pure domain logic and `app.js` as DOM rendering/control flow. Add no framework and no image dependency. Every docs-facing feature must be represented by a tested pure function first, then surfaced in the text runtime.

**Current Gaps:** The app has the basic loop, PDF metadata, demons, styles, graph preview, and dashboard, but several systems are display-only or incomplete: route runs are full-chapter instead of 5 questions, question selection repeats early items, graph locks are not enforced, advanced flow styles are missing, chapter mechanics are not materially different, story collections/endings are incomplete, weekly/fatigue rhythms are absent, and `core.js` still returns generated image paths in dialogue data.

---

### Task 1: Make Each Run A Real 5-Question Progression

**Files:** `core.js`, `app.js`, `tests/core.test.mjs`, `tests/runtime.test.mjs`

- [x] Add failing tests for a `selectRouteQuestions()` helper that:
  - returns at most 5 questions for normal route runs;
  - prioritizes uncorrect/unstudied questions over already-correct questions;
  - filters out questions blocked by unsatisfied concept dependencies;
  - falls back to review/correct questions only when no unlocked new question remains.
- [x] Implement dependency-aware concept unlock helpers in `core.js`.
- [x] Change `app.js#createRunForSelectedChapter()` to call `selectRouteQuestions(..., { length: 5 })`.
- [x] Add a runtime static test proving `app.js` no longer uses `bank.length` as the route length.
- [x] Verify with full `npm test`.

### Task 2: Enforce Chapter Unlock And Final-Chapter Gates

**Files:** `core.js`, `app.js`, `tests/core.test.mjs`

- [x] Add tests for chapter availability:
  - chapter 1 is available immediately;
  - chapters 2-6 require the previous chapter clear;
  - chapter 7 requires all first six chapters clear.
- [x] Add `getChapterAvailability()` and include locked reason text.
- [x] Update world cards and route creation to prevent starting locked chapters.
- [x] Verify with full `npm test`.

### Task 3: Complete Flow Build Styles

**Files:** `core.js`, `app.js`, `tests/core.test.mjs`, `tests/runtime.test.mjs`

- [x] Add tests for all design styles: `balanced`, `law`, `concept`, `assault-flow`, `review`, `speed`, `deep-read`, `chaos`.
- [x] Add unlock checks:
  - base styles unlocked at start;
  - assault-flow after 10 correct streak;
  - review after 20 purifications;
  - speed after chapter 3 clear;
  - deep-read after chapter 4 clear;
  - chaos after chapter 7 clear.
- [x] Add `getAvailableLearningStyles()`, `getRecommendedLearningStyle()`, and style win-rate stats.
- [x] Wire style bonuses into study/battle rewards without replacing stances.
- [x] Update the training/run setup UI with locked states and recommendation.
- [x] Verify with full `npm test`.

### Task 4: Turn Chapter Mechanics Into Gameplay

**Files:** `core.js`, `app.js`, `styles.css`, `tests/core.test.mjs`, `tests/runtime.test.mjs`

- [x] Add tests for `buildChapterMechanicState(question, player, runContext)`:
  - `law-fog`: masks 1-3 keywords until studied/observe;
  - `concept-maze`: marks/deforms option traps for concept-confusion questions;
  - `time-hourglass`: sets 60/45/30 second budget and recover nodes add time instead of heart;
  - `ethics-scale`: tracks hidden ethics value and applies over/under-balance warnings;
  - `strategy-chain`: reports strategy sequence and management value;
  - `precision-memory`: requires exact-answer mode and flags first miss as forced demon;
  - `chaos-mix`: deterministically borrows one of the six mechanics per question.
- [x] Surface mechanic state in battle panels.
- [x] Add text-only timers/bars, masked text, and strategy/ethics labels.
- [x] Verify with full `npm test` and browser playtest.

### Task 5: Upgrade Error Diagnosis And Review

**Files:** `core.js`, `app.js`, `styles.css`, `tests/core.test.mjs`

- [x] Add probability-style diagnosis output for the four error patterns.
- [x] Show the diagnosis action panel after a wrong answer: go training, direct purify, continue.
- [x] Add error portrait bars once cumulative wrong attempts reach the report threshold.
- [x] Track retest accuracy after demon purification.
- [x] Verify with full `npm test`.

### Task 6: Complete Story, Collection, Bonds, And Endings

**Files:** `core.js`, `app.js`, `tests/core.test.mjs`, `tests/runtime.test.mjs`

- [x] Add black-ink saying collection for intro + seven chapters.
- [x] Add bond-gated character story unlocks.
- [x] Add final reveal and two ending choices after the gated final chapter clear.
- [x] Remove `avatar`/`standee` image paths from dialogue data and replace them with pure text/Unicode speaker marks.
- [x] Verify with full `npm test`.

### Task 7: Complete Daily, Weekly, Fatigue, And Dashboard

**Files:** `core.js`, `app.js`, `styles.css`, `tests/core.test.mjs`, `tests/runtime.test.mjs`

- [x] Add weekly quests: graph nodes, demon sweep, topic challenge.
- [x] Add fatigue/rest warning after 3 consecutive route runs and cap reward pressure without blocking play.
- [x] Expand dashboard with Unicode bars for topic coverage, error portrait, style win rates, retest accuracy, average-time trend, and personalized review checklist.
- [x] Keep dashboard accessible without adding a seventh bottom-nav item if the six-nav UI spec is enforced.
- [x] Verify with `npm test` and browser playtest.

### Task 8: Keep Source Truth And Docs Honest

**Files:** `docs/*.md`, `docs/08-verification-report.md`, `tests/pdf-question-bank.test.mjs`

- [x] Update docs references that claim 4,077 as source truth; preserve historical note but state verified PDF source slots are 4,680.
- [x] Keep runtime summary as `playable / source slots`, not a fabricated 100% playable count.
- [x] Document remaining OCR review counts and why unanswered/unmatched source slots are not guessed.
- [x] Verify source count tests and full `npm test`.

### Task 9: Final Playtest And Completion Gate

**Files:** runtime only unless bugs are found

- [x] Run `npm test`.
- [x] Run a browser playtest on the local server:
  - world -> story -> training -> battle -> report;
  - wrong answer -> diagnosis -> heart demon -> purification;
  - dashboard/export checklist;
  - mobile viewport visual check.
- [x] Update `docs/08-verification-report.md` with exact command/browser results.
- [x] Only mark the goal complete when every checklist item above is implemented or a verified source-data limitation is explicitly documented.
