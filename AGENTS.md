# AGENTS.md

## Project Context

This project is a browser-based exam-prep learning game for `小明书院`. The current product direction is a text-first roguelite study loop:

- Start from the `开局台`.
- Choose or accept a recommended run objective.
- Play short five-question `题阵` runs.
- Use `题眼短课` before or after questions to make the learner actually remember the content.
- Treat wrong answers as `心魔` that drive review and purification runs.

The old chapter-map RPG structure should not be revived as the primary experience. Story may appear as brief events or flavor, but it must support the study loop instead of becoming a separate click-through route.

## Player-Facing Vocabulary

Use the current vocabulary consistently:

- `开局台`
- `题眼短课`
- `题阵`
- `破招`
- `流派`
- `心魔`
- `学习报告`

Do not reintroduce the old visible terms:

- `地图`
- `练功`
- `战斗`
- `学习风格`
- `章节机制`
- `章节封印`
- audit counters such as `正式题`, `待归类`, `题位`, `可玩题`, `源题位`

The runtime has tests that intentionally fail if old player-facing copy leaks back into `index.html`, `app.js`, or `core.js`.

## Content Rules

- The built-in PDF question bank is the source of playable questions.
- The six real learning domains are the main classification structure. Do not restore `综合知识` as a catch-all playable domain.
- Questions needing manual classification must remain outside the formal route until reviewed.
- If question JSON looks unclear, verify against the source PDF/docs before changing classification.

## Implementation Notes

- Main runtime files: `app.js`, `core.js`, `styles.css`, `index.html`.
- Content/classification helpers live under `src/`, `scripts/`, and `data/`.
- Tests live under `tests/`.
- `academy.pen` is a Pencil design file. Do not read or edit it directly with filesystem tools; use Pencil MCP tools only if design-file access is explicitly needed.

## Verification

Run the full test suite before claiming gameplay/runtime changes are complete:

```bash
npm test
```

Useful focused checks:

```bash
node --test tests/player-facing-copy.test.mjs
node --test tests/runtime.test.mjs
node --test tests/core.test.mjs
```

For visual/browser checks, `npm start` serves the app on port `4190`. Do not start a new random port each time. First check whether `4190` is already serving this project; if it is stale or wedged, stop the old service and restart it on `4190`. Only use another port when `4190` is occupied by a non-project process, and document that exception in the final response. If a preview server is started for verification, stop it before finishing unless the user asks to keep it open.

## Engineering Guardrails

- Keep changes aligned with the current roguelite study loop.
- Prefer small, test-backed edits over broad rewrites.
- Do not expose implementation/audit metadata in the HUD or player-facing panels.
- Preserve user changes in the working tree; do not reset or revert unrelated files.
- Use `rg` for repository search and `apply_patch` for manual file edits.
