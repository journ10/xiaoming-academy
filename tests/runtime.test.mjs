import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing function ${name}`);
  const next = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

test("static entry loads only the pure text game runtime", () => {
  const index = readFileSync("index.html", "utf8");
  const app = readFileSync("app.js", "utf8");
  const core = readFileSync("core.js", "utf8");
  const cacheVersion = "study-journal-20260623q";

  assert.match(index, new RegExp(`<script type="module" src="\\./app\\.js\\?v=${cacheVersion}"></script>`));
  assert.match(index, new RegExp(`href="\\./styles\\.css\\?v=${cacheVersion}"`));
  assert.match(app, new RegExp(`from "\\./core\\.js\\?v=${cacheVersion}"`));
  assert.match(core, new RegExp(`from "\\./src/content-rules\\.js\\?v=${cacheVersion}"`));
  assert.doesNotMatch(`${index}\n${app}\n${core}`, /study-journal-20260623a|study-journal-20260623b|study-journal-20260623c|study-journal-20260623d|study-journal-20260623e|study-journal-20260623f|study-journal-20260623g|study-journal-20260623h|study-journal-20260623i|study-journal-20260623j|study-journal-20260623k|study-journal-20260623l|study-journal-20260623m|study-journal-20260623n|study-journal-20260623o|study-journal-20260623p/);
  assert.doesNotMatch(index, /styles\/tokens\.css|styles\/shell\.css|styles\/components\.css/);
  assert.doesNotMatch(index, /<img\b|assets\/generated|docs\/mockups/);
});

test("static brand copy matches the study journal loop", () => {
  const index = readFileSync("index.html", "utf8");

  assert.match(index, /<title>小明书院：题眼手账<\/title>/u);
  assert.match(index, /题眼手账 · 文字题阵/u);
  assert.doesNotMatch(index, /秘卷巡游/u);
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
  assert.match(app, /今日小目标/);
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
  assert.match(app, /buildWinRates/);
  assert.match(app, /流派胜率/);
  assert.doesNotMatch(app, /dashboard\.styleWinRates/);
});

test("runtime surfaces chapter mechanic prompts during training and battle", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /mechanicName/);
  assert.match(app, /mechanicPrompt/);
  assert.match(app, /题阵机制/);
  assert.match(app, /buildChapterMechanicState/);
  assert.match(app, /renderChapterMechanicState/);
  assert.match(functionBody(app, "renderBattleQuestionCard"), /question\.stem/);
  assert.doesNotMatch(app, /mechanicState\.displayStem/);
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
  assert.match(app, /开一页题眼手账/);
  assert.match(app, /换目标/);
  assert.match(app, /探索新题/);
  assert.match(app, /净化心魔/);
  assert.match(app, /综合冲刺/);
  assert.match(app, /稳修/);
  assert.match(app, /突击/);
  assert.match(app, /复盘/);
  assert.doesNotMatch(app, /function chapterRouteNode\(/);
  assert.doesNotMatch(app, /renderStoryStage|startIntro|startChapterStory|scene = "story"|getIntroDialogue|综合知识/u);
});

test("start desk suggestion does not ask for demons when none exist", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /function formatStartDeskSuggestion\(/);
  assert.match(functionBody(app, "formatStartDeskSuggestion"), /Number\(topic\.demonCount \|\| 0\) > 0/);
  assert.match(functionBody(app, "formatStartDeskSuggestion"), /整理 \$\{topic\.title\} 心魔/);
  assert.match(functionBody(app, "formatStartDeskSuggestion"), /补强 \$\{topic\.title\} 题眼/);
  assert.match(app, /formatStartDeskSuggestion\(dashboard\)/);
});

test("runtime loads the compact browser runtime question bank instead of sample data or imported bank state", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /data\/questions\.runtime\.json/);
  assert.match(app, /loadRuntimeQuestionBank/);
  assert.match(app, /parseQuestionImport\(payload\)/);
  assert.doesNotMatch(app, /cache:\s*"no-store"/);
  assert.doesNotMatch(app, /sample-data\.js|sampleQuestions|savedState\.questions|questionSource/);
});

test("runtime retries the PDF question bank from deployment-safe paths", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /questionBankUrls/);
  assert.match(app, /compressedQuestionBankUrls/);
  assert.match(app, /\.\/data\/questions\.runtime\.json\.gz/);
  assert.match(app, /\/xiaoming-academy\/data\/questions\.runtime\.json\.gz/);
  assert.match(app, /\.\/data\/questions\.runtime\.json/);
  assert.match(app, /\/xiaoming-academy\/data\/questions\.runtime\.json/);
  assert.match(app, /questionBankVersion/);
  assert.match(app, /supportsCompressedQuestionBank/);
  assert.match(app, /for \(const url of runtimeBankUrls\)/);
  assert.match(app, /lastError/);
});

test("runtime shows loading and failure states instead of a blank or empty-bank start desk", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /let questionBankLoadState = "loading"/);
  assert.match(app, /let questionBankLoadError = ""/);
  assert.match(functionBody(app, "initializeGame"), /questionBankLoadState = "loading";[\s\S]*render\(\);[\s\S]*await loadBuiltInQuestionBank\(\)/);
  assert.match(functionBody(app, "renderStage"), /renderQuestionBankLoadingStage/);
  assert.match(functionBody(app, "renderStage"), /renderQuestionBankErrorStage/);
  assert.match(functionBody(app, "renderQuestPanel"), /renderQuestionBankStatusPanel/);
  assert.match(app, /function retryQuestionBankLoad\(/);
});

test("runtime times out stalled question-bank requests before trying fallback URLs", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /questionBankRequestTimeoutMs/);
  assert.match(app, /function fetchWithTimeout\(/);
  assert.match(functionBody(app, "fetchQuestionBankPayload"), /fetchWithTimeout\(url\)/);
  assert.match(functionBody(app, "fetchWithTimeout"), /AbortController/);
  assert.match(functionBody(app, "fetchWithTimeout"), /setTimeout/);
  assert.match(functionBody(app, "fetchWithTimeout"), /clearTimeout/);
  assert.match(functionBody(app, "fetchWithTimeout"), /signal: controller\.signal/);
});

test("runtime refuses to start a run when the question bank is unavailable", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /function isQuestionBankReady\(/);
  assert.match(app, /function ensureQuestionBankAvailable\(/);
  assert.match(functionBody(app, "startRecommendedRun"), /ensureQuestionBankAvailable\(\)/);
  assert.match(functionBody(app, "startRogueliteRun"), /ensureQuestionBankAvailable\(\)/);
});

test("pages deployment publishes the runtime PDF question bank", () => {
  const workflow = readFileSync(".github/workflows/pages.yml", "utf8");

  assert.match(workflow, /--exclude 'data\/'/);
  assert.match(workflow, /mkdir -p _site\/data/);
  assert.match(workflow, /cp data\/questions\.runtime\.json _site\/data\/questions\.runtime\.json/);
  assert.match(workflow, /cp data\/questions\.runtime\.json\.gz _site\/data\/questions\.runtime\.json\.gz/);
  assert.doesNotMatch(workflow, /cp data\/question-classification\.audit\.json _site\/data\/question-classification\.audit\.json/);
});

test("runtime keeps classification audit on the local full-bank fallback path only", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /classificationAuditUrls/);
  assert.match(app, /loadClassificationAudit/);
  assert.match(app, /parseQuestionImport\(payload, \{ classificationAudit \}\)/);
  assert.match(app, /loadFullQuestionBankFallback/);
  assert.doesNotMatch(app, /let bankSummary|sourceTotalQuestionSlots|playableQuestionCount|reviewQuestionCount/u);
});

test("quest panel renders the current roguelite objective instead of a full dossier", () => {
  const app = readFileSync("app.js", "utf8");
  const styles = readFileSync("styles.css", "utf8");

  assert.match(app, /今日小目标/);
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
  assert.match(app, /textButton\("今日清单", \(\) => goScene\("daily"\)/);
  assert.match(app, /周课/);
  assert.match(app, /fatigue/);
  assert.match(app, /休息提醒/);
  assert.match(app, /claimQuestReward/);
  assert.match(app, /领取奖励/);
  assert.match(app, /已领取/);
  assert.match(app, /now: new Date\(\)/);
  assert.match(app, /restFromFatigue/);
  assert.match(app, /休息一下/);
  assert.match(app, /resetScrollPosition/);
  assert.doesNotMatch(app, /连续破阵|清零连续破阵/);
  assert.match(app, /连续手账页|手账节奏/);
});

test("training routes reset mobile scroll before showing lessons or returning to battle", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(functionBody(app, "startTraining"), /render\(\);\s*resetScrollPosition\(\);/);
  assert.match(functionBody(app, "enterBattleAfterTraining"), /render\(\);\s*resetScrollPosition\(\);/);
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

test("battle UI exposes per-question break move choices", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /function revealObservationHint\(/);
  assert.match(app, /function getBattleStanceId\(/);
  assert.match(app, /let selectedBreakMoveId = "steady"/);
  assert.match(app, /function renderBreakMoveChoices\(/);
  assert.match(app, /破招式/);
  assert.match(app, /稳破/);
  assert.match(app, /强攻/);
  assert.match(app, /观照/);
  assert.match(app, /textButton\("低收益看答案", revealObservationHint/);
  assert.match(app, /selectedBreakMoveId = "observe"/);
  assert.match(app, /return selectedBreakMoveId/);
  assert.match(app, /低收益看答案/);
  assert.match(app, /释放破招/);
  assert.match(app, /不确定时可以低收益看答案，再选择答案。/);
  assert.match(app, /canSubmit \? "释放破招" : "先选择答案"/);
  assert.match(app, /renderBattleSupportPanel\(\{ node, question, mechanicState \}\)/);
  assert.match(app, /renderBattleQuestionCard\(\{ question, mechanicState, options \}\)/);
  assert.doesNotMatch(app, /战斗招式/);
});

test("settled battle state no longer advertises answer reveal", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /function formatBattleSettleState\(/);
  assert.match(functionBody(app, "formatHudLessonState"), /if \(submittedResult\) return formatBattleSettleState\(\);/);
  assert.match(functionBody(app, "renderBattleStatusBar"), /const hintState = submittedResult/);
  assert.match(functionBody(app, "renderBattleStatusBar"), /battleStatusChip\("提示", hintState\.label, hintState\.modifier\)/);
  assert.match(functionBody(app, "formatBattleSettleState"), /已点亮/);
  assert.match(functionBody(app, "formatBattleSettleState"), /已观照/);
  assert.match(functionBody(app, "formatBattleSettleState"), /已结算/);
});

test("hud and side panel share answered-run progress wording", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /function formatRunAnsweredProgress\(/);
  assert.match(app, /hudStat\("本局", formatHudRunProgress\(\)\)/);
  assert.match(app, /return formatRunAnsweredProgress\(run\)/);
  assert.match(app, /questLine\("进度", formatRunAnsweredProgress\(run\)\)/);
});

test("battle feedback keeps journal page progress on the full run length", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(functionBody(app, "renderBattleFeedback"), /const pageProgress = `\$\{run\.correctCount \|\| 0\}\/\$\{Math\.max\(1, run\.nodes\?\.length \|\| run\.answeredCount \|\| 5\)\}`/);
  assert.doesNotMatch(functionBody(app, "renderBattleFeedback"), /run\.answeredCount \|\| run\.nodes\?\.length/);
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
  assert.match(app, /低收益看答案/);
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
  assert.match(app, /整理建议/);
  assert.match(app, /错因收录/);
  assert.match(app, /错因心结已收录待整理/);
  assert.doesNotMatch(app, /错因心结已整理/);
  assert.match(app, /renderErrorDiagnosisPanel/);
  assert.match(app, /errorDiagnosis\.primary/);
  assert.match(app, /直接净化/);
  assert.match(app, /errorPortrait/);
  assert.match(app, /retestAccuracy/);
});

test("battle and report surface roguelite objective and next-run recommendations", () => {
  const app = readFileSync("app.js", "utf8");

  assert.match(app, /今日小目标/);
  assert.match(app, /encounterIndex/);
  assert.match(app, /createRogueliteRunReport/);
  assert.match(app, /今日手账页/);
  assert.match(app, /panel\(journal\.title/);
  assert.doesNotMatch(app, /panel\("今日手账页完成"/);
  assert.match(app, /题眼贴纸/);
  assert.match(app, /countsAsLit/);
  assert.match(app, /观照题眼/);
  assert.match(app, /formatJournalCollection/);
  assert.match(app, /手账收藏/);
  assert.match(app, /journalCollection/);
  assert.match(app, /秘卷碎片/);
  assert.match(app, /已收进心魔回廊/);
  assert.match(app, /下一页建议/);
  assert.match(app, /continueWithNextAction/);
});

test("report next actions can route back to short lesson review", () => {
  const app = readFileSync("app.js", "utf8");
  const body = functionBody(app, "continueWithNextAction");

  assert.match(body, /if \(action\.scene === "training"\)/);
  assert.match(body, /scene = "training"/);
  assert.match(body, /submittedResult = null/);
  assert.match(body, /resetScrollPosition\(\)/);
});

test("quest side panel reflects report and short-lesson review states", () => {
  const app = readFileSync("app.js", "utf8");
  const stateBody = functionBody(app, "getQuestPanelStageState");
  const panelBody = functionBody(app, "renderQuestPanel");
  const reportTextBody = functionBody(app, "formatReportPanelNextText");

  assert.match(panelBody, /const panelState = getQuestPanelStageState\(/);
  assert.match(panelBody, /panelState\.title/);
  assert.match(panelBody, /panelState\.prompt/);
  assert.match(panelBody, /panelState\.nextLabel/);
  assert.match(stateBody, /scene === "report"/);
  assert.match(stateBody, /学习报告/u);
  assert.match(stateBody, /formatReportPanelNextText\(report\)/);
  assert.match(reportTextBody, /reportData\?\.nextActions/u);
  assert.match(reportTextBody, /action\.label/u);
  assert.doesNotMatch(stateBody, /按报告建议选择回看短课、重新点亮或整理心魔/u);
  assert.match(stateBody, /scene === "training" && run\.state === "report_ready"/);
  assert.match(stateBody, /短课复盘/u);
  assert.match(stateBody, /回看题眼短课后，重新正式点亮这一页/u);
  assert.doesNotMatch(stateBody, /完成本页后查看学习报告，系统会给出下一页建议。/u);
  assert.match(panelBody, /全局画像/u);
  assert.doesNotMatch(panelBody, /错题画像[\s\S]{0,120}当前/u);
});

test("chapter mechanic panel shows borrowed mechanic names instead of internal ids", () => {
  const app = readFileSync("app.js", "utf8");
  const body = functionBody(app, "renderChapterMechanicState");

  assert.match(body, /borrowedMechanicName/u);
  assert.doesNotMatch(body, /万象混沌借用：\$\{mechanicState\.borrowedMechanic\}/u);
});

test("runtime removes old law fog mechanic internals", () => {
  const core = readFileSync("core.js", "utf8");
  const contentRules = readFileSync("src/content-rules.js", "utf8");
  const oldLawMechanic = ["law", "fog"].join("-");
  const oldFogLevel = ["fog", "Level"].join("");
  const oldLawName = String.fromCharCode(27861, 26465, 36855, 38654);

  assert.doesNotMatch(`${core}\n${contentRules}`, new RegExp(`${oldLawMechanic}|${oldFogLevel}|${oldLawName}`, "u"));
  assert.match(`${core}\n${contentRules}`, /law-review/u);
  assert.match(core, /法规审题/u);
});

test("internal roguelite screens do not leak old route-map actions", () => {
  const app = readFileSync("app.js", "utf8");
  const styles = readFileSync("styles.css", "utf8");

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
  assert.doesNotMatch(app, /renderBottomNav/u);
  assert.doesNotMatch(styles, /bottom-nav/u);
});
