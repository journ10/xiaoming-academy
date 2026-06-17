# Xiaoming Academy RPG Mainline Implementation Plan

**Goal:** Rebuild the current static quiz game into a feminine academy RPG where learning first, battle verification, character bonds, chapter clears, and player growth all reinforce mastery of the imported question bank.

**Scope Lock:** Keep the no-build static web stack. Use `core.js` for game rules and deterministic state transitions, `app.js` for DOM/localStorage, `styles.css` for the RPG skin, and `assets/reference/legacy/trial-art.svg` for deterministic UI art. OCR and full PDF import remain after the playable RPG loop.

**Design Source:** `docs/superpowers/specs/2026-06-15-xiaoming-academy-rpg-mainline-design.md`

## Task 1: Design Package Refresh

- [ ] Update `docs/gameplay-design-package/01-gameplay-design-package.md` with RPG mainline, four characters, chapter clear requirements, first-run onboarding, and growth resources.
- [ ] Update `docs/gameplay-design-package/02-review-notes.md` with this user revision.
- [ ] Run the gameplay package validator.

## Task 2: Red Tests For New Rules

- [ ] Add tests for initial RPG player state: level, growth XP, star glimmer, bonds, intro state, chapter clear map.
- [ ] Add tests for story characters and topic-based story chapters.
- [ ] Add tests that studying grants learning-based positive feedback once per lesson.
- [ ] Add tests that correct battle answers grant growth and bonds, while wrong answers do not grant growth.
- [ ] Add tests for chapter clear and full-bank mastery: all chapter questions must be studied, answered correctly, free of active demons, and reach the mastery threshold.
- [ ] Add a test for the one-time intro marker.
- [ ] Run `npm test` and confirm the tests fail before implementation.

## Task 3: Core RPG Rules

- [ ] Export `storyCharacters`, `createStoryChapters`, `getChapterProgress`, `isChapterCleared`, `isBankMastered`, and `markIntroSeen`.
- [ ] Extend `initialPlayerState` with `playerLevel`, `growthXp`, `starGlimmer`, `bonds`, `seenIntro`, and `chapterClears`.
- [ ] Add learning rewards in `studyNode`: star glimmer, XP, and 阿芷/明澈 bond gains only for first-time study.
- [ ] Add battle growth in `applyTrialAnswer`: star glimmer, XP, mastery, and 青岚/小墨 bond gains only on correct answers and purification.
- [ ] Remove positive mastery/growth from wrong answers.
- [ ] Persist chapter clear state when chapter requirements are satisfied.
- [ ] Keep old JSON imports and existing run/report behavior compatible.

## Task 4: RPG UI And Art

- [ ] Add a first-run onboarding layer with story premise, learning loop, battle loop, and mastery goal; store close state in localStorage.
- [ ] Add a story chapter map with six topic gates and visible clear requirements.
- [ ] Add a character party/bond panel for 明澈、阿芷、青岚、小墨.
- [ ] Add player growth display: level, star glimmer, spirit pages, streak, studied coverage.
- [ ] Make chapter cards select unfinished study/battle targets.
- [ ] Adjust copy to RPG story language without hiding learning explanations.
- [ ] Shift art and palette toward soft academy fantasy with rose, jade, warm gold, and lavender accents.
- [ ] Add SVG portraits, chapter seals, star glimmer, ribbons, and softer decorative RPG symbols.

## Task 5: Verification

- [ ] Run `npm test`.
- [ ] Run `node --check core.js` and `node --check app.js`.
- [ ] Run the gameplay package validator.
- [ ] Verify in browser at the local static server: first-run intro, study reward, correct answer reward, wrong-answer no-growth rule, chapter progress, party bonds, and no console errors.
- [ ] Check desktop and mobile layouts for text overflow and horizontal scrolling.
