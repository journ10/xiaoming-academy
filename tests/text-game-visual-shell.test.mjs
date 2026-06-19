import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync("app.js", "utf8");
const cssSource = readFileSync("styles.css", "utf8");

test("world screen renders the modern text-game stage contract", () => {
  assert.match(appSource, /renderModernWorldStage/u);
  assert.match(appSource, /短课检验 · 题阵前夜/u);
  assert.match(appSource, /进入题阵/u);
  assert.match(appSource, /观照题眼/u);
  assert.match(appSource, /下一步建议/u);
  assert.match(appSource, /scene = resolveInitialScene\(\) \|\| saved\.scene \|\| "world"/u);
});

test("visual shell CSS matches the mobile-first dark text-game design", () => {
  assert.match(cssSource, /--ui-bg:\s*#111317/u);
  assert.match(cssSource, /--ui-jade:\s*#53c6a2/u);
  assert.match(cssSource, /\.rpg-shell\s*\{[^}]*grid-template-areas:\s*"hud hud"[\s\S]*"stage quest"[\s\S]*"nav quest"/u);
  assert.match(cssSource, /@media \(max-width:\s*760px\)[\s\S]*grid-template-rows:\s*154px minmax\(0,\s*1fr\) 118px 68px/u);
  assert.match(cssSource, /\.text-window \.question-card\s*\{[\s\S]*display:\s*none/u);
});
