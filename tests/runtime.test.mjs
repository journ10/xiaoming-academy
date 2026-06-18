import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("static entry loads only the pure text game runtime", () => {
  const index = readFileSync("index.html", "utf8");

  assert.match(index, /<script type="module" src="\.\/app\.js\?v=[^"]+"><\/script>/);
  assert.match(index, /href="\.\/styles\.css(?:\?v=[^"]+)?"/);
  assert.doesNotMatch(index, /styles\/tokens\.css|styles\/shell\.css|styles\/components\.css/);
  assert.doesNotMatch(index, /<img\b|assets\/generated|docs\/mockups/);
});

test("text runtime keeps generated image assets out of the playable path", () => {
  for (const file of ["index.html", "app.js", "styles.css"]) {
    const source = readFileSync(file, "utf8");

    assert.doesNotMatch(source, /assets\/generated|docs\/mockups|url\(["']?\.\//, `${file} must stay asset-free`);
    assert.doesNotMatch(source, /scene-bg|ambient|standee|enemy-art|demon-main/, `${file} must not keep visual stand-ins`);
  }
});

test("text runtime exposes the playable scenes", () => {
  const app = readFileSync("app.js", "utf8");

  for (const functionName of [
    "renderWorldStage",
    "renderStoryStage",
    "renderTrainingStage",
    "renderBattleStage",
    "renderReviewStage",
    "renderRosterStage",
    "renderDailyStage",
    "renderReport",
  ]) {
    assert.match(app, new RegExp(`function ${functionName}\\(`));
  }
});

test("runtime loads the built-in PDF question bank instead of sample data or imported bank state", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /data\/questions\.from-pdf\.json/);
  assert.doesNotMatch(app, /sample-data\.js|sampleQuestions|savedState\.questions|questionSource/);
});

test("hud exposes save import/export actions without sample or intro shortcuts", () => {
  const index = readFileSync("index.html", "utf8");

  assert.match(index, /data-import-action>导入存档<\/button>/);
  assert.match(index, /data-export-action>导出存档<\/button>/);
  assert.doesNotMatch(index, /样例题库|data-source-label|data-question-count|data-help-action>序章|data-file-input/);
});

test("save import and export use copy-paste text instead of files", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /function showExportPanel\(/);
  assert.match(app, /function showImportPanel\(/);
  assert.match(app, /function createSaveText\(/);
  assert.match(app, /function importSaveText\(/);
  assert.match(app, /navigator\.clipboard\.writeText/);
  assert.match(app, /textarea/);
  assert.doesNotMatch(app, /Blob|createObjectURL|download =|data-file-input|fileInput|FileReader/);
});

test("answer-recall battles render answer choices without duplicated placeholder labels", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /function isAnswerRecallQuestion\(/);
  assert.match(app, /function optionButtonLabel\(/);
  assert.match(app, /function answerPanelTitle\(/);
  assert.match(app, /isAnswerRecallQuestion\(question\) \? "参考答案" : "选项"/);
  assert.match(app, /return option\.key;/);
  assert.doesNotMatch(app, /textButton\(`\$\{option\.key\}\. \$\{option\.text\}`/);
});

test("observe stance surfaces answer explanations during battle", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /function renderBattleHint\(/);
  assert.match(app, /question\.lesson\?\.explanation \|\| question\.explanation/);
  assert.doesNotMatch(app, /selectedStanceId === "observe" \? question\.lesson\.keyPoint/);
});
