# Redesign V1 Full Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Xiaoming Academy according to `docs/redesign-v1.md`, using `docs/mockups/*.png` as pixel-level visual references and generated bitmap art for every in-world asset.

**Architecture:** Keep the static HTML/CSS/ESM stack, but split the current monolithic `core.js`/`app.js` responsibilities into focused data, engine, asset, and renderer modules. Gameplay rules stay test-first and deterministic; visual pages are built from generated assets plus CSS/DOM so imported question data can drive the game.

**Tech Stack:** Native HTML/CSS/JavaScript ES modules, Node test runner, localStorage persistence, generated PNG/WebP assets under `assets/generated/`, static service via `npm run start`.

---

## File Structure

- Create `src/assets.js`: central asset manifest for backgrounds, standees, demons, items, nodes, seals, effects, mockup references.
- Create `src/content.js`: story chapters, dialogue scripts, character expressions, chapter scene metadata, fortunes, labels.
- Create `src/systems.js`: stance mastery, combo state, node effects, demon profiles, heart-method resonance, materials, artifacts, daily/challenge helpers.
- Create `src/dom.js`: DOM helper utilities currently embedded in `app.js`.
- Create `src/render-world.js`: world map, chapter seals, daily fortune, mission tracker.
- Create `src/render-story.js`: visual novel layout, typewriter state, choice branches, CG display.
- Create `src/render-training.js`: short lesson / cultivation page.
- Create `src/render-battle.js`: demon battle page, stance strip, answer runes, effects.
- Create `src/render-growth.js`: report, materials, artifact and method progress.
- Create `src/render-roster.js`: roster, bonds, artifacts, material inventory, title/method panels.
- Modify `core.js`: export stable engine APIs for new systems while preserving existing import behavior until `app.js` is migrated.
- Modify `app.js`: reduce to app state, routing, persistence, imports, renderer orchestration, event dispatch.
- Modify `styles.css`: reorganize into design tokens, layout shell, shared game UI, world/story/training/battle/report/roster sections, responsive rules.
- Modify `tests/core.test.mjs`: add behavior tests for redesign systems.
- Create `tests/systems.test.mjs` if `core.test.mjs` becomes too large.
- Create or update generated assets in `assets/generated/` from `docs/redesign-v1.md`.

## Task 1: Resource Manifest And Baseline

- [ ] Generate an explicit missing-asset checklist from `docs/redesign-v1.md`.
- [ ] Create `src/assets.js` with paths for existing mockups and existing character/background art.
- [ ] Add asset coverage tests that fail when required generated resources are absent from the manifest.
- [ ] Run: `npm test`
- [ ] Expected before implementation: resource coverage test fails because new required assets are missing.
- [ ] Generate/copy the first required asset batch and update the manifest.
- [ ] Run: `npm test`
- [ ] Expected after implementation: all manifest coverage tests pass.

## Task 2: First Required Art Batch

- [ ] Generate demon preview/asset sheets using built-in `image_gen`, then save project assets under `assets/generated/`.
- [ ] Generate scene backgrounds for story, training, chapters, demon corridor, night, black ink.
- [ ] Generate item/artifact/node/seal/icon sheets and crop into named PNG files.
- [ ] Validate each project-bound asset opens, has the expected dimensions class, and is not blank.
- [ ] Keep original generated files under `$CODEX_HOME/generated_images/`; copy selected finals into workspace.

## Task 3: Gameplay Redesign Tests

- [ ] Add failing tests for stance mastery thresholds and mastery effects.
- [ ] Add failing tests for same-stance combo effects.
- [ ] Add failing tests for new node types: demon, mystery, resonance, trial.
- [ ] Add failing tests for demon pressure and rampage failure.
- [ ] Add failing tests for topic-specific heart-method resonance.
- [ ] Add failing tests for materials, artifact upgrades, daily route, weekly challenge.
- [ ] Run targeted test command after each test group and verify expected failures.

## Task 4: Gameplay Engine Implementation

- [ ] Implement `src/systems.js` incrementally until Task 3 tests pass.
- [ ] Update `core.js` to integrate new systems into `initialPlayerState`, `createRouteRun`, `applyTrialAnswer`, `studyNode`, and `createRunReport`.
- [ ] Preserve existing tests while adding new behavior.
- [ ] Run: `npm test`
- [ ] Expected: old and new behavior tests pass together.

## Task 5: Story And Content

- [ ] Create `src/content.js` with six-chapter story scripts, clear scripts, character dialogue, branch choices, black-ink clue data, route labels.
- [ ] Add tests for story progression and choice reward effects.
- [ ] Implement story selection/choice logic in `core.js` or `src/systems.js`.
- [ ] Run: `npm test`

## Task 6: Renderer Split

- [ ] Extract DOM helpers from `app.js` into `src/dom.js`.
- [ ] Create each renderer module with pure render functions receiving `{ state, actions, assets, content }`.
- [ ] Keep `app.js` as orchestrator and storage boundary.
- [ ] Run: `node --check app.js src/*.js`
- [ ] Run: `npm test`

## Task 7: Pixel-Reference UI Rebuild

- [ ] Rebuild world map against `docs/mockups/final-world-map.png`.
- [ ] Rebuild story screen against `docs/mockups/final-story-dialogue.png`.
- [ ] Rebuild training screen against `docs/mockups/final-training.png`.
- [ ] Rebuild battle screen against `docs/mockups/final-battle.png`.
- [ ] Rebuild report/growth screen against `docs/mockups/final-report-growth.png`.
- [ ] For screens without mockups, generate a mockup first, save under `docs/mockups/`, then implement from that reference.
- [ ] Use browser verification for desktop and mobile after each page.

## Task 8: Remaining Art And Polish

- [ ] Generate expression avatars, chapter CGs, ending CG, effects, particles, title/method/stance/heart/currency/bond icons, optional weather overlays, loading screen, logo, cursor/UI icons.
- [ ] Add CSS motion for seal unlock, correct/wrong hit, combo, demon purify, report flip, weather overlays, typewriter.
- [ ] Respect reduced motion and ensure no horizontal scroll on mobile.

## Task 9: Final Verification

- [ ] Run: `node --check app.js src/*.js core.js`
- [ ] Run: `npm test`
- [ ] Verify all referenced assets return 200 through local service.
- [ ] Verify desktop and phone layouts in browser.
- [ ] Verify import flow still accepts sample JSON.
- [ ] Verify first-run story, study, battle, demon review, report, roster/artifact, daily/challenge paths.
- [ ] Update `README.md` with run notes and current feature summary.

