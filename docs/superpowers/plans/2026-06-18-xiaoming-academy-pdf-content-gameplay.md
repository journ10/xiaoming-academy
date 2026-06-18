# Xiaoming Academy PDF Content And Gameplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace document-count assumptions with a PDF-backed 4,680-question source contract, then implement the designed learning RPG systems on the current static web app.

**Architecture:** Treat the two PDFs under `docs/` as the source of truth and generate explicit bank metadata: source exam count, source question slots, playable merged questions, unmatched slots, and review count. Keep domain logic in pure JavaScript functions, with `app.js` only rendering state and handling DOM events. Build features incrementally so the app stays a no-backend, no-framework static site.

**Tech Stack:** Plain ES modules, Node `node:test`, static `index.html`/`styles.css`, macOS Vision OCR JSONL artifacts, `localStorage` saves.

---

## Source Truth

PDF-backed count to use for development:

- `docs/09小明课堂 历年真题.pdf`: 465 OCR pages in `data/question-ocr-pages.jsonl`
- `docs/10小明课堂 《历年真题答案》.pdf`: 512 OCR pages in `data/pdf-ocr-pages.jsonl`
- True source structure found from the question PDF OCR: 52 exam papers
- Each paper has 90 question slots
- Source total: `52 * 90 = 4680` question slots
- Current merged playable bank: `data/questions.from-pdf.json` has 4,292 questions
- Current metadata says 1,843 merged questions require OCR review
- Current parser undercounts exams because `2017年11月12-日深圳事业单位教师招聘考试（初中）` is not normalized as a separate exam title
- Therefore all product progress and validation must distinguish:
  - source slots: 4,680
  - playable merged questions: current generated count
  - review-required questions: current generated count
  - unmatched source slots: generated difference

## File Structure

- Create `scripts/pdf_source_manifest.mjs`: source-of-truth helpers for exam-title detection, title normalization, exam keys, manifest generation, and expected question-slot count.
- Modify `scripts/build_questions_from_pdfs.mjs`: use manifest segmentation and emit source metadata.
- Modify `scripts/build_hybrid_answer_bank.mjs`: share the same exam-key normalization as question merging.
- Create generated `data/pdf-source-manifest.json`: 52 exam entries, each with `expectedQuestionCount: 90`.
- Create generated `data/answers.from-pdf.hybrid.json`: stable answer-bank input so `data/questions.from-pdf.json` is never used as both input and output.
- Modify `data/questions.from-pdf.json`: regenerated merged playable bank with source metadata.
- Modify `core.js`: preserve source metadata, add question-bank summary, concepts, error patterns, knowledge graph, learning styles, and chapter mechanics.
- Modify `app.js`: retain bank metadata after load; render true source totals, graph preview, diagnosis, learning-style selection, and dashboard/export views.
- Modify `styles.css`: add compact text UI for source stats, graph tree, diagnosis, style selection, dashboard, timers, and fill-in answers.
- Modify `tests/pdf-question-bank.test.mjs`: PDF count and pipeline contract.
- Modify `tests/core.test.mjs`: pure domain logic coverage for new systems.
- Modify `tests/redesign-gameplay.test.mjs`: gameplay feature coverage.
- Modify `tests/runtime.test.mjs`: DOM-runtime and asset-free constraints.

---

### Task 1: Lock The PDF Source Count Contract

**Files:**
- Create: `scripts/pdf_source_manifest.mjs`
- Modify: `tests/pdf-question-bank.test.mjs`

- [ ] **Step 1: Write the failing manifest tests**

Add tests that read `data/question-ocr-pages.jsonl`, build a source manifest, and assert the real count.

```js
import { buildExamManifestFromQuestionPages, getTotalExpectedQuestionSlots } from "../scripts/pdf_source_manifest.mjs";

test("question PDF manifest exposes the real source question count", () => {
  const pages = readFileSync("data/question-ocr-pages.jsonl", "utf8")
    .trim()
    .split(/\n+/u)
    .map((line) => JSON.parse(line));

  const manifest = buildExamManifestFromQuestionPages(pages);

  assert.equal(manifest.length, 52);
  assert.equal(getTotalExpectedQuestionSlots(manifest), 4680);
  assert.ok(manifest.some((exam) =>
    exam.examKey === "2017-11-12-初中" &&
    exam.startPage === 234 &&
    exam.expectedQuestionCount === 90
  ));
  assert.ok(manifest.every((exam) => exam.expectedQuestionCount === 90));
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/pdf-question-bank.test.mjs`

Expected: FAIL because `scripts/pdf_source_manifest.mjs` does not exist yet.

- [ ] **Step 3: Implement `scripts/pdf_source_manifest.mjs`**

Implement tolerant OCR title detection:

```js
export const QUESTIONS_PER_EXAM = 90;

export function normalizeBodyText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[　]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectExamTitleLine(line) {
  const normalized = normalizeBodyText(line);
  return /(20\d{2}|19\d{2})\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*[-－]?\s*日.{0,100}(教师|数师).{0,30}(考试|招聘|招考|真题)/u.test(normalized)
    ? normalized
    : "";
}

export function examKey(title) {
  const normalized = normalizeBodyText(title).replace(/[-－]\s*日/u, "日");
  const dateMatch = normalized.match(/(20\d{2}|19\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/u);
  const levelMatch = normalized.match(/[（(](小学|初中|高中)[）)]/u) || normalized.match(/(小学|初中|高中)/u);
  if (!dateMatch) return "";
  return `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}-${levelMatch?.[1] || ""}`;
}

export function buildExamManifestFromQuestionPages(pages) {
  const starts = [];
  pages.forEach((page, index) => {
    const pageNumber = getPageNumber(page.image, index);
    for (const rawLine of getPageLines(page)) {
      const title = detectExamTitleLine(rawLine);
      if (title) starts.push({ title, examKey: examKey(title), startPage: pageNumber });
    }
  });

  return starts
    .filter((exam) => exam.examKey)
    .map((exam, index) => ({
      ...exam,
      endPage: index < starts.length - 1 ? starts[index + 1].startPage : pages.length,
      expectedQuestionCount: QUESTIONS_PER_EXAM,
    }));
}

export function getTotalExpectedQuestionSlots(manifest) {
  return manifest.reduce((sum, exam) => sum + Number(exam.expectedQuestionCount || 0), 0);
}

function getPageLines(page) {
  return Array.isArray(page.lines) && page.lines.length
    ? page.lines.map((line) => line.text || "")
    : String(page.text || "").split(/\n+/u);
}

function getPageNumber(imagePath, fallback) {
  const match = String(imagePath || "").match(/page-(\d+)\.png$/u);
  return match ? Number(match[1]) : fallback + 1;
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `node --test tests/pdf-question-bank.test.mjs`

Expected: PASS for the new manifest test.

- [ ] **Step 5: Commit the source-count contract**

```bash
git add scripts/pdf_source_manifest.mjs tests/pdf-question-bank.test.mjs
git commit -m "test: lock pdf source question count"
```

---

### Task 2: Stabilize The PDF Merge Pipeline

**Files:**
- Modify: `scripts/build_questions_from_pdfs.mjs`
- Modify: `scripts/build_hybrid_answer_bank.mjs`
- Create: `data/pdf-source-manifest.json`
- Create: `data/answers.from-pdf.hybrid.json`
- Modify: `data/questions.from-pdf.json`
- Modify: `tests/pdf-question-bank.test.mjs`

- [ ] **Step 1: Write failing metadata tests**

Add assertions for generated metadata:

```js
test("built-in PDF bank reports source slots separately from playable questions", () => {
  const payload = JSON.parse(readFileSync("data/questions.from-pdf.json", "utf8"));

  assert.equal(payload.sourceType, "hybrid-vision-ocr-question-answer-pages");
  assert.equal(payload.ocr.sourceExamCount, 52);
  assert.equal(payload.ocr.sourceTotalQuestionSlots, 4680);
  assert.equal(payload.ocr.mergedQuestionCount, payload.questions.length);
  assert.ok(payload.questions.length >= 4292);
  assert.ok(payload.ocr.unmatchedQuestionSlotCount >= 0);
  assert.ok(payload.ocr.reviewQuestionCount >= 0);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/pdf-question-bank.test.mjs`

Expected: FAIL because current metadata lacks `sourceExamCount` and `sourceTotalQuestionSlots`.

- [ ] **Step 3: Share exam-key normalization**

Import `examKey` and `normalizeBodyText` from `scripts/pdf_source_manifest.mjs` in both merge scripts. Delete local duplicate `examKey` implementations from `scripts/build_questions_from_pdfs.mjs` and `scripts/build_hybrid_answer_bank.mjs`.

- [ ] **Step 4: Generate explicit manifest metadata**

In `scripts/build_questions_from_pdfs.mjs`, call `buildExamManifestFromQuestionPages(questionPages)` and include:

```js
ocr: {
  questionPageCount: questionPages.length,
  sourceExamCount: manifest.length,
  sourceTotalQuestionSlots: getTotalExpectedQuestionSlots(manifest),
  parsedQuestionCount: questionEntries.length,
  answerQuestionCount: answerCount,
  mergedQuestionCount: questions.length,
  unmatchedQuestionSlotCount: Math.max(0, getTotalExpectedQuestionSlots(manifest) - questions.length),
  unmatchedParsedQuestionCount: Math.max(0, questionEntries.length - questions.length),
  unmatchedAnswerCount: Math.max(0, answerCount - questions.length),
  reviewQuestionCount: questions.filter((question) => question.ocr?.requiresReview).length,
}
```

- [ ] **Step 5: Avoid self-overwriting answer-bank input**

Change defaults so the pipeline writes answers to `data/answers.from-pdf.hybrid.json` and final playable questions to `data/questions.from-pdf.json`. The merge script must not read `data/questions.from-pdf.json` as its answer input.

- [ ] **Step 6: Rebuild generated artifacts**

Run:

```bash
node scripts/build_questions_from_pdf_ocr.mjs data/pdf-ocr-pages.jsonl tmp/answers.old.json
node scripts/build_questions_from_pdf_ocr.mjs data/pdf-ocr-pages.3x.jsonl tmp/answers.3x.json
node scripts/build_hybrid_answer_bank.mjs tmp/answers.old.json tmp/answers.3x.json data/answers.from-pdf.hybrid.json
node scripts/build_questions_from_pdfs.mjs data/question-ocr-pages.jsonl data/answers.from-pdf.hybrid.json data/questions.from-pdf.json
```

Expected: final output reports 52 source exams, 4,680 source slots, and at least 4,292 merged playable questions.

- [ ] **Step 7: Run the focused test and verify it passes**

Run: `node --test tests/pdf-question-bank.test.mjs`

Expected: PASS.

- [ ] **Step 8: Commit the stable content pipeline**

```bash
git add scripts/build_questions_from_pdfs.mjs scripts/build_hybrid_answer_bank.mjs data/pdf-source-manifest.json data/answers.from-pdf.hybrid.json data/questions.from-pdf.json tests/pdf-question-bank.test.mjs
git commit -m "feat: stabilize pdf question pipeline metadata"
```

---

### Task 3: Surface Source Totals In Runtime Progress

**Files:**
- Modify: `core.js`
- Modify: `app.js`
- Modify: `tests/core.test.mjs`
- Modify: `tests/runtime.test.mjs`

- [ ] **Step 1: Write failing summary tests**

Add a pure test for source metadata:

```js
test("question bank summary separates source slots from playable questions", () => {
  const summary = summarizeQuestionBank({
    questions: rawQuestions,
    ocr: {
      sourceExamCount: 52,
      sourceTotalQuestionSlots: 4680,
      mergedQuestionCount: rawQuestions.length,
      reviewQuestionCount: 2,
    },
  });

  assert.equal(summary.sourceExamCount, 52);
  assert.equal(summary.sourceTotalQuestionSlots, 4680);
  assert.equal(summary.playableQuestionCount, rawQuestions.length);
  assert.equal(summary.reviewQuestionCount, 2);
});
```

- [ ] **Step 2: Implement `summarizeQuestionBank` in `core.js`**

Export a function that accepts either a payload or question array and returns:

```js
{
  sourceExamCount,
  sourceTotalQuestionSlots,
  playableQuestionCount,
  reviewQuestionCount,
  sourceCoveragePercent,
}
```

- [ ] **Step 3: Preserve payload metadata in `app.js`**

Change `loadBuiltInQuestionBank()` to return `{ questions, bankMeta }`. Store `bankMeta` in a module variable and render:

- HUD small line: `可玩 4292 / 源题位 4680`
- Quest panel source line: `52 套卷 · 4680 题位`
- Review line: `需复核 1843`

- [ ] **Step 4: Run tests**

Run: `node --test tests/core.test.mjs tests/runtime.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit runtime source totals**

```bash
git add core.js app.js tests/core.test.mjs tests/runtime.test.mjs
git commit -m "feat: show pdf source totals in runtime"
```

---

### Task 4: Add Concept And Error-Pattern Enrichment

**Files:**
- Create: `src/content-rules.js`
- Modify: `core.js`
- Modify: `tests/core.test.mjs`

- [ ] **Step 1: Write failing enrichment tests**

Test that prepared questions preserve or infer:

- `concept`
- `dependencies`
- `errorPatterns`
- `chapterMechanic`

```js
test("prepared questions include concept and error-pattern metadata", () => {
  const [question] = prepareQuestions([{
    ...rawQuestions[0],
    stem: "下列说法不正确的是？",
    explanation: "题眼是免试入学、就近入学、政府保障。",
  }]);

  assert.match(question.concept, /教育法规/);
  assert.ok(question.errorPatterns.includes("reading-mistake"));
  assert.equal(question.chapterMechanic, "law-fog");
});
```

- [ ] **Step 2: Create `src/content-rules.js`**

Export topic profiles and inference helpers:

```js
export const chapterMechanicsByTopic = {
  "教育法规": "law-fog",
  "教育心理学": "concept-maze",
  "教学设计": "time-hourglass",
  "教师职业道德": "ethics-scale",
  "班级管理": "strategy-chain",
  "儿童发展": "precision-memory",
  "综合知识": "chaos-mix",
};
```

- [ ] **Step 3: Use enrichment in `prepareQuestions`**

In `core.js`, set defaults from imported helpers when raw fields are missing.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/core.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit enrichment**

```bash
git add src/content-rules.js core.js tests/core.test.mjs
git commit -m "feat: enrich pdf questions with learning metadata"
```

---

### Task 5: Implement Knowledge Graph Preview

**Files:**
- Modify: `core.js`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/core.test.mjs`

- [ ] **Step 1: Write failing graph tests**

Add tests for `buildKnowledgeGraph(questions, player)`:

```js
test("knowledge graph groups questions by concept and exposes status", () => {
  const questions = prepareQuestions(rawQuestions);
  const graph = buildKnowledgeGraph(questions, {
    ...initialPlayerState(),
    correctQuestionIds: [questions[0].id],
  });

  assert.ok(graph.topics.length >= 1);
  assert.equal(graph.totalQuestionCount, questions.length);
  assert.ok(graph.topics[0].nodes.some((node) => ["answered", "available", "locked"].includes(node.status)));
});
```

- [ ] **Step 2: Implement graph builder in `core.js`**

Group by topic and concept path. Status rules:

- `answered`: all questions under concept answered correctly
- `demon`: any active mind demon under concept
- `available`: concept has playable unanswered questions
- `locked`: concept dependencies contain unmet concepts
- `mastered`: all child concepts answered and no active demons

- [ ] **Step 3: Render graph preview in `app.js`**

Replace the quest panel's flat progress block with a compact tree preview:

```text
教育法规
├─ 义务教育法 ✓
│  └─ 政府保障 ✗
└─ 教师法 ...
```

- [ ] **Step 4: Add CSS for graph tree**

Use compact monospace rows, state colors, and no image assets.

- [ ] **Step 5: Run tests**

Run: `node --test tests/core.test.mjs tests/runtime.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit graph preview**

```bash
git add core.js app.js styles.css tests/core.test.mjs tests/runtime.test.mjs
git commit -m "feat: add knowledge graph preview"
```

---

### Task 6: Add Error Diagnosis And Typed Mind Demons

**Files:**
- Modify: `core.js`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/core.test.mjs`

- [ ] **Step 1: Write failing diagnosis tests**

```js
test("wrong answers create typed mind demons with review advice", () => {
  const [question] = prepareQuestions([{
    ...rawQuestions[0],
    stem: "下列说法不正确的是？",
    errorPatterns: ["reading-mistake"],
  }]);
  const run = createRouteRun([question], { length: 1 });
  const result = applyTrialAnswer(initialPlayerState(), run, {
    nodeId: run.nodes[0].id,
    question,
    selectedAnswer: "A",
    stanceId: "steady",
    bankQuestions: [question],
  });

  const demon = result.player.mindDemons[question.id];
  assert.equal(demon.errorPattern, "reading-mistake");
  assert.match(demon.reviewAdvice, /关键词|审题/);
});
```

- [ ] **Step 2: Implement diagnosis mapping**

Map:

- `concept-confusion` -> `镜像心魔`
- `reading-mistake` -> `迷雾心魔`
- `memory-gap` -> `空洞心魔`
- `application-error` -> `变形心魔`

- [ ] **Step 3: Render answer feedback diagnosis**

After a wrong answer, show:

- user's answer
- correct answer
- error pattern
- review advice
- buttons: `去练功`, `开始净化`, `继续`

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/core.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit diagnosis**

```bash
git add core.js app.js styles.css tests/core.test.mjs
git commit -m "feat: add typed error diagnosis"
```

---

### Task 7: Implement Learning Styles

**Files:**
- Modify: `core.js`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/redesign-gameplay.test.mjs`

- [ ] **Step 1: Write failing style tests**

Test `均衡派`, `律令派`, `观心派`, `突击派`, and `复盘派` effects in battle calculations.

- [ ] **Step 2: Add `learningStyles` to `core.js`**

Each style needs:

- `id`
- `name`
- `description`
- `unlockRule`
- `effect`

- [ ] **Step 3: Apply style effects in calculations**

Pass `styleId` through `createRouteRun` and `applyTrialAnswer`. Keep defaults backward compatible with existing tests by using `balanced`.

- [ ] **Step 4: Render style selection before battle**

In `app.js`, when starting a fresh battle route, show a compact style selector before the first answer. Persist current style in player state.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/redesign-gameplay.test.mjs tests/core.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit learning styles**

```bash
git add core.js app.js styles.css tests/redesign-gameplay.test.mjs tests/core.test.mjs
git commit -m "feat: add learning style builds"
```

---

### Task 8: Implement Chapter Mechanics In Safe Slices

**Files:**
- Create: `src/chapter-mechanics.js`
- Modify: `core.js`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/redesign-gameplay.test.mjs`
- Modify: `tests/runtime.test.mjs`

- [ ] **Step 1: Write tests for all mechanic descriptors**

Assert that each topic produces the expected mechanic descriptor and safe default UI mode.

- [ ] **Step 2: Implement first two mechanics**

Implement:

- `law-fog`: hides one to three key terms before a question is studied
- `concept-maze`: highlights similar-concept traps in hints, without changing answer correctness

- [ ] **Step 3: Implement time and ethics mechanics**

Implement:

- `time-hourglass`: returns a `timeLimitSeconds` value; `app.js` displays countdown
- `ethics-scale`: tracks `player.ethicsValue`; correct balanced answers keep it in range

- [ ] **Step 4: Implement strategy and precision mechanics**

Implement:

- `strategy-chain`: renders strategy labels and shows consequence text after answer
- `precision-memory`: supports fill-in/input mode when a question has exact text answers; falls back to choice mode for OCR-only questions

- [ ] **Step 5: Implement chaos mix**

For `综合知识`, choose a deterministic mechanic by question id hash so reloads do not reshuffle the same question.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/redesign-gameplay.test.mjs tests/runtime.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit chapter mechanics**

```bash
git add src/chapter-mechanics.js core.js app.js styles.css tests/redesign-gameplay.test.mjs tests/runtime.test.mjs
git commit -m "feat: add chapter-specific mechanics"
```

---

### Task 9: Add Learning Dashboard And Review Export

**Files:**
- Modify: `core.js`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/core.test.mjs`
- Modify: `tests/runtime.test.mjs`

- [ ] **Step 1: Write failing dashboard tests**

Test summary fields:

- source coverage
- concept coverage
- error-pattern distribution
- weak topics
- purified demon count
- style win rates

- [ ] **Step 2: Implement `createLearningDashboard`**

Export from `core.js`; derive all values from questions, player, and bank metadata.

- [ ] **Step 3: Implement text review export**

Export a plain text plan with:

- top weak topics
- active demons
- common error pattern
- recommended style
- next 10 review question ids

- [ ] **Step 4: Render dashboard scene**

Add scene id `dashboard`; keep mobile layout single-column and asset-free.

- [ ] **Step 5: Run tests**

Run: `node --test tests/core.test.mjs tests/runtime.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit dashboard**

```bash
git add core.js app.js styles.css tests/core.test.mjs tests/runtime.test.mjs
git commit -m "feat: add learning dashboard export"
```

---

### Task 10: Final Verification And Release Cleanup

**Files:**
- Modify: `README.md`
- Modify: `docs/06-content-pipeline.md`
- Modify: `docs/07-implementation-roadmap.md`

- [ ] **Step 1: Update docs to the PDF-backed count**

Replace ambiguous `4077` product statements with explicit fields:

- `源题位：4680`
- `当前可玩题：以 data/questions.from-pdf.json 的 ocr.mergedQuestionCount 为准`
- `需复核题：以 data/questions.from-pdf.json 的 ocr.reviewQuestionCount 为准`

- [ ] **Step 2: Run full tests**

Run: `npm test`

Expected: all `node:test` suites pass.

- [ ] **Step 3: Smoke run the static server**

Run: `npm run start`

Expected: server starts on `http://localhost:4190`.

- [ ] **Step 4: Open the app manually or with browser automation**

Check:

- HUD shows source slots and playable questions
- world map renders
- training works
- battle answer submission works
- wrong answer creates typed diagnosis
- quest panel graph does not overflow on desktop or mobile width

- [ ] **Step 5: Commit docs and verification updates**

```bash
git add README.md docs/06-content-pipeline.md docs/07-implementation-roadmap.md
git commit -m "docs: align roadmap with pdf source count"
```

---

## Self-Review

- Spec coverage: The plan covers PDF source count, content pipeline, runtime metadata, knowledge graph, error diagnosis, learning styles, chapter mechanics, dashboard, export, tests, and docs.
- Count correctness: The plan uses `4680` because the question PDF OCR exposes 52 exam titles and each paper has 90 slots. It explicitly rejects using `4077` or the current `4292` merged count as the source total.
- Scope control: The plan keeps the current static web architecture and does not introduce a framework or backend.
- Risk: OCR quality remains the main risk. The plan handles it by separating source slots from playable merged questions and by keeping `requiresReview` visible.
- Execution order: Data contract comes first because all progress, chapter counts, graph coverage, and UX copy depend on the correct denominator.
