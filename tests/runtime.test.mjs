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
    "renderDashboardStage",
    "renderReport",
  ]) {
    assert.match(app, new RegExp(`function ${functionName}\\(`));
  }
});

test("runtime surfaces story collection, bond stories, and ending options without image assets", () => {
  const app = readFileSync("app.js", "utf8");
  const core = readFileSync("core.js", "utf8");

  assert.match(app, /getBlackInkCollection/);
  assert.match(app, /getBondStories/);
  assert.match(app, /getEndingOptions/);
  assert.match(app, /黑色墨迹/);
  assert.match(app, /羁绊剧情/);
  assert.match(app, /结局/);
  assert.doesNotMatch(core, /assets\/generated\/characters/);
  assert.match(core, /speakerMark/);
}
);

test("training UI exposes selectable learning styles", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /learningStyleDefinitions/);
  assert.match(app, /setLearningStyle/);
  assert.match(app, /renderLearningStyleChoices/);
  assert.match(app, /selectLearningStyle/);
  assert.match(app, /学习风格/);
});

test("training and dashboard expose learning-style unlocks, recommendations, and win rates", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /getAvailableLearningStyles/);
  assert.match(app, /getRecommendedLearningStyle/);
  assert.match(app, /unlockReason/);
  assert.match(app, /当前推荐/);
  assert.match(app, /styleWinRates/);
  assert.match(app, /流派胜率/);
});

test("runtime surfaces chapter mechanic prompts during training and battle", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /mechanicName/);
  assert.match(app, /mechanicPrompt/);
  assert.match(app, /章节机制/);
  assert.match(app, /buildChapterMechanicState/);
  assert.match(app, /renderChapterMechanicState/);
  assert.match(app, /mechanicState\.displayStem/);
  assert.match(app, /timeLimitSeconds/);
});

test("runtime builds chapter battles as five-question progression runs", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /selectRouteQuestions/);
  assert.match(app, /length:\s*5/);
  assert.doesNotMatch(app, /length:\s*Math\.max\(1,\s*bank\.length/);
});

test("runtime blocks locked chapters before story, training, or battle starts", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /getChapterAvailability/);
  assert.match(app, /function isSelectedChapterAvailable\(/);
  assert.match(app, /章节未解锁/);
  assert.match(app, /is-locked/);
  assert.match(app, /if \(!isSelectedChapterAvailable\(\)\) return/);
});

test("runtime loads the built-in PDF question bank instead of sample data or imported bank state", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /data\/questions\.from-pdf\.json/);
  assert.doesNotMatch(app, /sample-data\.js|sampleQuestions|savedState\.questions|questionSource/);
});

test("runtime retries the PDF question bank from deployment-safe paths", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /questionBankUrls/);
  assert.match(app, /\.\/data\/questions\.from-pdf\.json/);
  assert.match(app, /\/xiaoming-academy\/data\/questions\.from-pdf\.json/);
  assert.match(app, /for \(const url of questionBankUrls\)/);
  assert.match(app, /lastError/);
});

test("pages deployment publishes the runtime PDF question bank", () => {
  const workflow = readFileSync(".github/workflows/pages.yml", "utf8");

  assert.match(workflow, /--exclude 'data\/'/);
  assert.match(workflow, /mkdir -p _site\/data/);
  assert.match(workflow, /cp data\/questions\.from-pdf\.json _site\/data\/questions\.from-pdf\.json/);
});

test("runtime preserves PDF bank metadata for source-slot progress", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /summarizeQuestionBank/);
  assert.match(app, /let bankSummary/);
  assert.match(app, /sourceTotalQuestionSlots/);
  assert.match(app, /playableQuestionCount/);
  assert.match(app, /reviewQuestionCount/);
});

test("quest panel renders the knowledge graph preview from core state", () => {
  const app = readFileSync("app.js", "utf8");
  const styles = readFileSync("styles.css", "utf8");

  assert.match(app, /buildKnowledgeGraphPreview/);
  assert.match(app, /知识图谱预览/);
  assert.match(app, /knowledge-graph/);
  assert.match(app, /graphPreview\.lines/);
  assert.match(styles, /\.knowledge-graph/);
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

test("dashboard exports a review checklist as copy-paste text", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /createLearningDashboard/);
  assert.match(app, /dashboard/);
  assert.match(app, /renderDashboardStage/);
  assert.match(app, /导出复习清单/);
  assert.match(app, /createReviewChecklistText/);
  assert.match(app, /topicCoverageBars/);
  assert.match(app, /averageTimeTrend/);
});

test("daily UI surfaces weekly quests and fatigue warnings", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /createDailyQuestState/);
  assert.match(app, /周课/);
  assert.match(app, /fatigue/);
  assert.match(app, /休息提醒/);
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

test("battle feedback and review list surface typed demon diagnosis", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /submittedResult\.demonProfile/);
  assert.match(app, /demon\.demonType/);
  assert.match(app, /demon\.diagnosis/);
  assert.match(app, /demon\.remedy/);
  assert.match(app, /错因/);
  assert.match(app, /净化建议/);
  assert.match(app, /renderErrorDiagnosisPanel/);
  assert.match(app, /errorDiagnosis\.primary/);
  assert.match(app, /直接净化/);
  assert.match(app, /errorPortrait/);
  assert.match(app, /retestAccuracy/);
});
