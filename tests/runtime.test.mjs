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
    "renderModeSelectStage",
    "renderBuildSelectStage",
    "renderBattleStage",
    "renderReviewStage",
    "renderDailyStage",
    "renderDashboardStage",
    "renderReport",
  ]) {
    assert.match(app, new RegExp(`function ${functionName}\\(`));
  }
});

test("runtime eventizes story instead of exposing it as a primary route", () => {
  const app = readFileSync("app.js", "utf8");
  const core = readFileSync("core.js", "utf8");

  assert.doesNotMatch(app, /\["story",\s*"剧情"\]/);
  assert.doesNotMatch(app, /章节提示/);
  assert.match(app, /runEventBrief/);
  assert.match(app, /今日推荐/);
  assert.doesNotMatch(core, /assets\/generated\/characters/);
  assert.match(core, /speakerMark/);
}
);

test("training UI surfaces the current roguelite build instead of legacy style selection", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /function renderRunBuildSummary/);
  assert.match(app, /function formatStudyPrompt/);
  assert.match(app, /本局流派/);
  assert.match(app, /getRunBuildDefinition\(run\.buildId \|\| selectedBuildId\)/);
  assert.doesNotMatch(app, /intro:\s*question\.lesson\.studyPrompt/);
  assert.doesNotMatch(app, /renderLearningStyleChoices/);
  assert.doesNotMatch(app, /selectLearningStyle/);
  assert.doesNotMatch(app, /学习风格/);
});

test("training and dashboard expose roguelite build context and win rates", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /rogueliteBuildDefinitions/);
  assert.match(app, /selectedBuildId/);
  assert.match(app, /renderRunBuildSummary/);
  assert.match(app, /本局流派/);
  assert.match(app, /styleWinRates/);
  assert.match(app, /流派胜率/);
});

test("runtime surfaces chapter mechanic prompts during training and battle", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /mechanicName/);
  assert.match(app, /mechanicPrompt/);
  assert.match(app, /题阵机制/);
  assert.match(app, /buildChapterMechanicState/);
  assert.match(app, /renderChapterMechanicState/);
  assert.match(app, /mechanicState\.displayStem/);
  assert.match(app, /timeLimitSeconds/);
});

test("runtime builds roguelite runs as the primary five-question loop", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /createRogueliteRun/);
  assert.match(app, /createRunRecommendation/);
  assert.match(app, /rogueliteRunModes/);
  assert.match(app, /rogueliteBuildDefinitions/);
  assert.match(app, /length:\s*5/);
  assert.doesNotMatch(app, /length:\s*Math\.max\(1,\s*bank\.length/);
});

test("runtime exposes start desk, mode select, and build select instead of a route map", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /function renderStartDesk/);
  assert.match(app, /function renderModeSelectStage/);
  assert.match(app, /function renderBuildSelectStage/);
  assert.match(app, /开始一局/);
  assert.match(app, /换目标/);
  assert.match(app, /探索新题/);
  assert.match(app, /净化心魔/);
  assert.match(app, /综合冲刺/);
  assert.match(app, /稳修/);
  assert.match(app, /突击/);
  assert.match(app, /复盘/);
  assert.doesNotMatch(app, /function chapterRouteNode\(/);
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

test("runtime uses classification audit for filtering without exposing audit counters in HUD", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /classificationAuditUrls/);
  assert.match(app, /loadClassificationAudit/);
  assert.match(app, /parseQuestionImport\(payload, \{ classificationAudit \}\)/);
  assert.doesNotMatch(app, /let bankSummary|sourceTotalQuestionSlots|playableQuestionCount|reviewQuestionCount/u);
});

test("quest panel renders the current roguelite objective instead of a full dossier", () => {
  const app = readFileSync("app.js", "utf8");
  const styles = readFileSync("styles.css", "utf8");

  assert.match(app, /本局目标/);
  assert.match(app, /run\.objective/);
  assert.match(app, /createRunRecommendation/);
  assert.match(styles, /\.objective-panel/);
  assert.doesNotMatch(app, /graphPreview\.lines/);
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

test("battle UI removes risk stance choices and keeps observation as the only hint action", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /function revealObservationHint\(/);
  assert.match(app, /function getBattleStanceId\(/);
  assert.match(app, /textButton\("观照提示", revealObservationHint/);
  assert.match(app, /observationHintUsed \? "observe" : "steady"/);
  assert.match(app, /观照提示/);
  assert.match(app, /提交答案/);
  assert.match(app, /先看观照提示，再选择答案。/);
  assert.match(app, /canSubmit \? "提交答案" : "先选择答案"/);
  assert.match(app, /renderBattleSupportPanel\(\{ node, question, mechanicState \}\)/);
  assert.match(app, /renderBattleQuestionCard\(\{ question, mechanicState, options \}\)/);
  assert.doesNotMatch(app, /破招选择/);
  assert.doesNotMatch(app, /释放破招/);
  assert.doesNotMatch(app, /稳破/);
  assert.doesNotMatch(app, /强攻/);
  assert.doesNotMatch(app, /stances\.map/);
});

test("battle UI uses a dedicated answer desk layout instead of stacked text panels", () => {
  const app = readFileSync("app.js", "utf8");
  const styles = readFileSync("styles.css", "utf8");

  for (const functionName of [
    "renderBattleDesk",
    "renderBattleStatusBar",
    "renderBattleQuestionCard",
    "renderBattleSupportPanel",
    "renderBattleActionBar",
  ]) {
    assert.match(app, new RegExp(`function ${functionName}\\(`));
  }

  assert.match(app, /dom\.stage\.replaceChildren\(renderBattleDesk\(\{ node, question, mechanicState, options \}\)\)/);
  assert.match(app, /el\("article", "battle-desk"/);
  assert.match(app, /el\("section", "battle-main"/);
  assert.match(app, /el\("section", "battle-question-card"/);
  assert.match(app, /el\("aside", "battle-support-panel"/);
  assert.match(app, /el\("footer", "battle-action-bar"/);
  assert.doesNotMatch(app, /dom\.stage\.replaceChildren\(textScreen\(\{\n\s+kicker: run\.modeName \|\| "题阵"/);

  for (const className of [
    "battle-desk",
    "battle-status-bar",
    "battle-main",
    "battle-question-card",
    "battle-support-panel",
    "battle-action-bar",
    "battle-options",
  ]) {
    assert.match(styles, new RegExp(`\\.${className}`));
  }

  assert.match(styles, /\.battle-main\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(280px,\s*360px\)/);
  assert.match(styles, /\.battle-action-bar\s*\{[\s\S]*position:\s*static/);
  assert.match(styles, /@media \(max-width: 860px\)\s*\{[\s\S]*\.battle-main\s*\{[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(styles, /@media \(max-width: 860px\)\s*\{[\s\S]*\.battle-desk\s*\{[\s\S]*grid-template-rows:\s*auto max-content auto/);
});

test("battle scene gives the answer desk the full stage instead of duplicating the side dossier", () => {
  const styles = readFileSync("styles.css", "utf8");

  assert.match(styles, /\.rpg-shell\[data-scene="battle"\]\s*\{[\s\S]*grid-template-areas:\s*"hud hud"\s*"stage stage"/);
  assert.match(styles, /\.rpg-shell\[data-scene="battle"\]\s+\.quest-panel\s*\{[\s\S]*display:\s*none/);
  assert.match(styles, /\.rpg-shell\[data-scene="battle"\]\s+\.battle-desk\s*\{[\s\S]*height:\s*100%/);
  assert.match(styles, /@media \(max-width: 860px\)\s*\{[\s\S]*\.rpg-shell\[data-scene="battle"\]\s+\.battle-desk\s*\{[\s\S]*height:\s*auto/);
});

test("battle question and support panels do not create nested scroll areas", () => {
  const styles = readFileSync("styles.css", "utf8");
  const ruleBody = (className) => {
    const match = styles.match(new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`));
    assert.ok(match, `missing .${className} rule`);
    return match[1];
  };

  assert.match(styles, /\.battle-desk\s*\{[\s\S]*grid-template-rows:\s*auto max-content auto[\s\S]*align-content:\s*start[\s\S]*overflow-y:\s*auto/);
  assert.match(styles, /\.battle-main\s*\{[\s\S]*min-height:\s*max-content[\s\S]*align-self:\s*start/);
  assert.match(styles, /\.battle-main\s*\{[\s\S]*overflow:\s*visible/);
  assert.match(styles, /\.battle-question-card\s*\{[\s\S]*max-height:\s*none[\s\S]*overflow:\s*visible/);
  assert.match(styles, /\.battle-support-panel\s*\{[\s\S]*max-height:\s*none[\s\S]*overflow:\s*visible/);
  assert.doesNotMatch(ruleBody("battle-action-bar"), /position:\s*sticky/);
  assert.doesNotMatch(ruleBody("battle-question-card"), /overflow:\s*(auto|scroll|hidden)/);
  assert.doesNotMatch(ruleBody("battle-support-panel"), /overflow:\s*(auto|scroll|hidden)/);
});

test("generic text screens use compact action bars instead of full-width choice lists", () => {
  const app = readFileSync("app.js", "utf8");
  const styles = readFileSync("styles.css", "utf8");
  const ruleBody = (className) => {
    const match = styles.match(new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`));
    assert.ok(match, `missing .${className} rule`);
    return match[1];
  };

  assert.match(app, /el\("div", "text-action-buttons"/);
  assert.doesNotMatch(app, /el\("div", "text-choice-list", \{\}, choices\.map/);
  assert.match(styles, /\.text-body\s*\{[\s\S]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(260px,\s*1fr\)\)/);
  assert.match(styles, /\.text-body\s*>\s*\.text-panel:first-child:nth-last-child\(n \+ 2\)\s*\{[\s\S]*grid-column:\s*1 \/ -1/);
  assert.match(styles, /\.text-action-bar\s*\{/);
  assert.match(styles, /\.text-action-buttons\s*\{[\s\S]*display:\s*flex[\s\S]*flex-wrap:\s*wrap/);
  assert.match(styles, /\.text-action-buttons\s+\.text-choice\s*\{[\s\S]*width:\s*auto/);
  assert.doesNotMatch(ruleBody("text-action-buttons"), /grid-template-columns:\s*1fr/);
});

test("observation helper surfaces answer explanations during battle", () => {
  const app = readFileSync("app.js", "utf8");
  const core = readFileSync("core.js", "utf8");

  assert.match(app, /function renderBattleHint\(/);
  assert.match(app, /buildObservationHint\(question\)/);
  assert.match(app, /对应答案/);
  assert.match(app, /依据/);
  assert.match(core, /stemCue:\s*`题干线索：/);
  assert.doesNotMatch(app, /selectedStanceId === "observe" \? question\.lesson\.keyPoint/);
  assert.doesNotMatch(app, /panel\("破招选择"/);
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

test("battle and report surface roguelite objective and next-run recommendations", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /本局目标/);
  assert.match(app, /encounterIndex/);
  assert.match(app, /createRogueliteRunReport/);
  assert.match(app, /本局报告/);
  assert.match(app, /下一局建议/);
  assert.match(app, /continueWithNextAction/);
});

test("internal roguelite screens do not leak old route-map actions", () => {
  const app = readFileSync("app.js", "utf8");

  for (const phrase of [
    "回地图",
    "回练功",
    "章节机制",
    "章节封印",
    "继续按章节推进",
    "先选择已开放章节",
    "章节未解锁",
  ]) {
    assert.doesNotMatch(app, new RegExp(phrase, "u"), phrase);
  }

  assert.match(app, /回开局台/u);
  assert.match(app, /题眼短课/u);
  assert.match(app, /题阵机制/u);
});
