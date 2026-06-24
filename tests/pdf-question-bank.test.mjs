import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import zlib from "node:zlib";
import {
  buildExamManifestFromQuestionPages,
  getTotalExpectedQuestionSlots,
} from "../scripts/pdf_source_manifest.mjs";
import {
  buildHybridQuestionEntries,
  buildSourceSlotPayload,
  mergeQuestionAndAnswerBanks,
  parseQuestionPages,
} from "../scripts/build_questions_from_pdfs.mjs";
import {
  parseQuestionImport,
} from "../core.js";

const sampleQuestionPage = {
  image: "/tmp/page-001.png",
  text: `深圳教师考编专业培训 微信号：19864272500
2013年1月12日深圳事业单位教师招聘考试（小学）
教育类小学真题
一、单项选择题（50题，每题1.0分，每题的备选答案中，只有一个最符合题意。）
1.由于特殊情况，父母或者其他法定监护人在非户籍所在地工作或者居住的适龄
儿童、少年，在其父母或者其他法定监护人工作或者居住地接受义务教育的，当地人
民政府应当（）。
A. 要求学生回到户籍所在地就近入学
B. 为其提供平等接受义务教育的条件
C. 为其提供受教育的保障
D. 暂时为其提供教育的平台
2. 教师资格制度是（）一种职业资格制度。
A. 教育行政部门实行的
B. 国家实行的
C. 地方政府实行的
D. 市级以上教育主管部门实行的`,
};

test("question PDF parser extracts original stems and options", () => {
  const questions = parseQuestionPages([sampleQuestionPage]);

  assert.equal(questions.length, 2);
  assert.equal(questions[0].questionNumber, 1);
  assert.match(questions[0].examTitle, /2013年1月12日/);
  assert.match(questions[0].stem, /由于特殊情况/);
  assert.equal(questions[0].options.find((option) => option.key === "B")?.text, "为其提供平等接受义务教育的条件");
});

test("question PDF parser expands source-marked missing question ranges", () => {
  const [page] = parseQuestionPages([{
    image: "/tmp/page-423.png",
    text: `2023年6月10日深圳事业单位教师招聘考试（高中）
一、单项选择题
15. 第15—16题暂缺
17. 高中生小军活泼好动，气质类型属于（）。
A. 多血质
B. 胆汁质
C. 黏液质
D. 抑郁质`,
  }]);
  const questions = parseQuestionPages([{
    image: "/tmp/page-423.png",
    text: `2023年6月10日深圳事业单位教师招聘考试（高中）
一、单项选择题
15. 第15—16题暂缺
17. 高中生小军活泼好动，气质类型属于（）。
A. 多血质
B. 胆汁质
C. 黏液质
D. 抑郁质`,
  }]);

  assert.equal(page.questionNumber, 15);
  assert.deepEqual(questions.map((question) => question.questionNumber), [15, 16, 17]);
  assert.equal(questions[1].stem, "第16题暂缺");
  assert.equal(questions[1].requiresReview, true);
  assert.match(questions[1].reviewReasons.join(" "), /原资料标注题目暂缺/);
});

test("question PDF parser detects exam titles embedded after a prior question", () => {
  const questions = parseQuestionPages([{
    image: "/tmp/page-422.png",
    text: `2022 年5月21日深圳事业单位教师招聘考试（高中）
三、是非题
90. 教育活动的本质就是培养人的活动。（）2023年6月10日深圳事业单位教师招聘考试（高中）教育类高中真题
一、单项选择题
2. 第2-7题暂缺
8. 根据《中华人民共和国教育法》规定，学校及其他教育机构中的管理人员，实行（）员制度。
A. 教育职员
B. 管理职员
C. 专业职员
D. 行政职员`,
  }]);

  assert.equal(questions.find((question) => question.questionNumber === 90)?.examKey, "2022-05-21-高中");
  assert.deepEqual(
    questions.filter((question) => question.examKey === "2023-06-10-高中").map((question) => question.questionNumber),
    [2, 3, 4, 5, 6, 7, 8],
  );
});

test("question PDF parser treats numbered lines as questions before section labels", () => {
  const questions = parseQuestionPages([{
    image: "/tmp/page-002.png",
    text: `2013年1月12日深圳事业单位教师招聘考试（小学）
一、单项选择题
12. 意志品质中明辨是非，迅速而合理地做出决定并立即采取相应行动的良好品质
是（）。
A. 果断性 B. 自觉性 C. 自制力 D. 坚持性
13.“不做完功课就去玩，家长和老师要批评”，这表明小学生意志的（）发展不
成。
A. 自觉性 B. 果断性 C. 坚持性
D.自制性`,
  }]);

  assert.deepEqual(questions.map((question) => question.questionNumber), [12, 13]);
  assert.match(questions[0].stem, /明辨是非/);
  assert.equal(questions[0].section, "单项选择题");
  assert.equal(questions[0].options.find((option) => option.key === "A")?.text, "果断性");
});

test("question PDF parser tolerates OCR noise around question numbers", () => {
  const questions = parseQuestionPages([{
    image: "/tmp/page-424.png",
    text: `2023年6月10日深圳事业单位教师招聘考试（高中）
一、单项选择题
（1学习共同体班主任在班级学习共同体中的角色定位，下列说法不恰当的是（）。
A. 合作者 B. 推动者 C. 共同体关系 D. 不存在关系
&31，许多小学生认为“做完了功课就可以随便玩了”，这表明小学生意志（）发展不成熟。
A. 自觉性 B. 果断性 C. 坚持性 D. 自制力
42 社会青年夏某经常到某中学寻衅滋事，扰乱学校教学秩序，对夏某的行为应给予（）。
A. 治安管理处罚 B. 民事追责 C. 刑事处罚 D. 行政处分
S5，教师对高中生网络成瘾的干预手段主要包括（）。
A. 教会学生合理宣泄消极情绪的方法 B. 培养学生上网的目的性和时间性 C. 丰富学生课余生活 D. 培养学生自制力
82i 素质教育就是要学生什么都学，什么都学好。（）
V89.根据《中华人民共和国预防未成年人犯罪法》，专门学校的未成年学生符合毕业条件的，由其原所在学校颁发毕业证书。（）
\\90.在师生关系方面，“教师中心论”强调教师在教育进程中的权威地位。（）`,
  }]);

  assert.deepEqual(questions.map((question) => question.questionNumber), [1, 31, 42, 55, 82, 89, 90]);
  assert.match(questions[0].stem, /学习共同体/);
  assert.match(questions[1].stem, /小学生意志/);
  assert.match(questions[2].stem, /夏某/);
  assert.match(questions[3].stem, /网络成瘾/);
  assert.match(questions[4].stem, /素质教育/);
});

test("question PDF parser splits adjacent questions merged onto one OCR line", () => {
  const questions = parseQuestionPages([{
    image: "/tmp/page-306.png",
    text: `2024年6月2日深圳事业单位教师招聘考试（初中）
三、是非题
82. 气质是个体的个性心理特征之一。好的气质更容易取得成就。（）83、高级的形式思维是把经验内容同化于个体自身的思想形式。（）
84. 小学生对父母具有较多的情感和生活依赖，而初中生对父母完全不依赖。（）`,
  }]);

  assert.deepEqual(questions.map((question) => question.questionNumber), [82, 83, 84]);
  assert.match(questions[1].stem, /高级的形式思维/);
});

test("question PDF parser fuses OCR sources and manual source-slot corrections", () => {
  const examTitle = "2013年1月12日深圳事业单位教师招聘考试（小学）";
  const primaryPages = [{
    image: "/tmp/page-001.png",
    text: `${examTitle}
一、单项选择题
1. 第一题（）。
A. 旧选项`,
  }];
  const secondaryPages = [{
    image: "/tmp/page-001.png",
    text: `${examTitle}
一、单项选择题
1. 第一题（）。
A. 更完整选项
B. 第二选项
2. 第二题（）。
A. 甲
B. 乙`,
  }];
  const questionEntries = buildHybridQuestionEntries([
    { label: "2x", pages: primaryPages },
    { label: "3x", pages: secondaryPages },
  ], [
    {
      examTitle,
      examKey: "2013-01-12-小学",
      section: "单项选择题",
      questionNumber: 3,
      page: 1,
      stem: "第3题源题目缺失（题目 PDF 与答案 PDF 均跳号）",
      options: [],
      requiresReview: true,
      reviewReasons: ["原资料题目 PDF 与答案 PDF 均跳号"],
    },
  ]);

  assert.deepEqual(questionEntries.map((question) => question.questionNumber), [1, 2, 3]);
  assert.equal(questionEntries[0].ocrSource, "3x");
  assert.equal(questionEntries[0].options.find((option) => option.key === "A")?.text, "更完整选项");

  const sourceSlots = buildSourceSlotPayload({
    sourceManifest: [{
      title: examTitle,
      examKey: "2013-01-12-小学",
      startPage: 1,
      endPage: 1,
      expectedQuestionCount: 3,
    }],
    questionEntries,
    generatedAt: "2026-06-23T00:00:00.000Z",
  });

  assert.equal(sourceSlots.ocr.sourceTotalQuestionSlots, 3);
  assert.equal(sourceSlots.ocr.recognizedSourceSlotCount, 2);
  assert.equal(sourceSlots.ocr.sourceMissingSlotCount, 1);
  assert.equal(sourceSlots.ocr.unmatchedSourceSlotCount, 0);
  assert.equal(sourceSlots.slots[2].status, "source-missing");
});

test("question and answer banks merge by exam and question number", () => {
  const [question] = parseQuestionPages([sampleQuestionPage]);
  const merged = mergeQuestionAndAnswerBanks([question], {
    questions: [
      {
        id: "pdf-0001",
        year: "2013",
        type: "单项选择题",
        topic: "教育法规",
        stem: "2013年1月12日深圳事业单位教师招聘考试（小学）第 1 题参考答案是？",
        options: [
          { key: "A", text: "A" },
          { key: "B", text: "B" },
          { key: "C", text: "C" },
          { key: "D", text: "D" },
        ],
        answer: "B",
        explanation: "《义务教育法》第十二条规定，当地人民政府应当提供平等接受义务教育的条件。",
        sourceRef: "PDF OCR 第 1 页：第 1 题解析",
        difficulty: 1,
        lesson: {
          title: "教育法规 · 第 1 题解析",
          sourceRef: "PDF OCR 第 1 页：第 1 题解析",
          keyPoint: "教育法",
          studyPrompt: "练功目标：先核对 OCR 原文，再记住本题解析中的题眼。",
        },
        ocr: {
          examTitle: "2013年1月12日深圳事业单位教师招聘考试（小学）",
          sourcePage: 1,
          reviewReasons: [],
          requiresReview: false,
        },
      },
    ],
  });

  assert.equal(merged.length, 1);
  assert.match(merged[0].stem, /由于特殊情况/);
  assert.doesNotMatch(merged[0].stem, /参考答案是/);
  assert.equal(merged[0].options[1].text, "为其提供平等接受义务教育的条件");
  assert.equal(merged[0].answer, "B");
  assert.match(merged[0].explanation, /义务教育法/);
});

test("question PDF manifest exposes the real source question count", () => {
  const pages = readFileSync("data/question-ocr-pages.jsonl", "utf8")
    .trim()
    .split(/\n+/u)
    .map((line) => JSON.parse(line));

  const manifest = buildExamManifestFromQuestionPages(pages);

  assert.equal(manifest.length, 52);
  assert.equal(getTotalExpectedQuestionSlots(manifest), 4680);
  assert.ok(manifest.some((exam) =>
    exam.examKey === "2017-11-12-初中"
    && exam.startPage === 234
    && exam.expectedQuestionCount === 90,
  ));
  assert.ok(manifest.every((exam) => exam.expectedQuestionCount === 90));
});

test("built-in PDF bank uses original question stems and option texts", () => {
  const payload = JSON.parse(readFileSync("data/questions.from-pdf.json", "utf8"));
  const [first] = payload.questions;
  const placeholderQuestions = payload.questions.filter((question) =>
    /参考答案是[？?]$/.test(question.stem)
      || question.options.every((option) => String(option.key).trim() === String(option.text).trim()),
  );

  assert.equal(payload.sourceType, "hybrid-vision-ocr-question-answer-pages");
  assert.equal(payload.ocr.mergedQuestionCount, payload.questions.length);
  assert.ok(payload.questions.length >= 4290);
  assert.equal(payload.ocr.reviewQuestionCount, payload.questions.filter((question) => question.ocr?.requiresReview).length);
  assert.ok(payload.ocr.reviewQuestionCount <= payload.questions.length);
  assert.equal(payload.ocr.answerOcr3xPagesJsonl, "data/pdf-ocr-pages.3x.jsonl");
  assert.match(first.stem, /由于特殊情况/);
  assert.doesNotMatch(first.stem, /参考答案是/);
  assert.equal(first.options.find((option) => option.key === "B")?.text, "为其提供平等接受义务教育的条件");
  assert.equal(first.answer, "B");
  assert.equal(placeholderQuestions.length, 0);
});

test("built-in PDF bank keeps manually verified OCR corrections readable", () => {
  const payload = JSON.parse(readFileSync("data/questions.from-pdf.json", "utf8"));
  const payloadText = JSON.stringify(payload.questions);
  const findQuestion = (id, questionNumber) => payload.questions.find((question) =>
    question.id === id && question.ocr?.questionNumber === questionNumber,
  );
  const q68 = findQuestion("pdf-0068", 68);
  const q74 = findQuestion("pdf-0073", 74);
  const q76 = findQuestion("pdf-0076", 76);
  const q53 = findQuestion("pdf-0052", 53);
  const q66 = findQuestion("pdf-0738", 66);
  const q40 = findQuestion("pdf-3159", 40);
  const q71 = findQuestion("pdf-3774", 71);

  assert.ok(q68);
  assert.match(q68.explanation, /工作计划与总结/u);
  assert.doesNotMatch(q68.explanation, /工作许划/u);

  assert.ok(q74);
  assert.equal(q74.options.find((option) => option.key === "A")?.text, "故意不完成教育教学任务给教育教学工作造成损失的");
  assert.doesNotMatch(q74.options.map((option) => option.text).join(""), /教育数学任务/u);

  assert.ok(q76);
  assert.equal(q76.options.find((option) => option.key === "A")?.text, "常规赔偿");
  assert.equal(q76.options.find((option) => option.key === "B")?.text, "残疾赔偿费");
  assert.equal(q76.options.find((option) => option.key === "D")?.text, "残疾赔偿金");
  assert.doesNotMatch(q76.options.map((option) => option.text).join(""), /賠/u);

  assert.ok(q53);
  assert.equal(q53.options.find((option) => option.key === "B")?.text, "学习动机适中，学习效果最好");
  assert.match(q53.explanation, /学习较复杂的问题/u);
  assert.doesNotMatch(q53.explanation, /学习較复杂/u);

  assert.ok(q66);
  assert.equal(q66.options.find((option) => option.key === "B")?.text, "情绪适中");

  assert.ok(q40);
  assert.equal(q40.options.find((option) => option.key === "C")?.text, "学习动机适中，学习效果最好");

  assert.ok(q71);
  assert.match(q71.explanation, /确保材料难度适中/u);
  assert.match(q71.explanation, /缺乏成就感/u);
  assert.doesNotMatch(q71.explanation, /材料难度造中/u);
  assert.doesNotMatch(q71.explanation, /缺之成就感/u);

  assert.doesNotMatch(payloadText, /工作许划|教育数学任务|賠|学习动机造中|情绪造中|材料难度造中|学习較复杂|缺之成就感/u);
});

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

test("browser runtime question bank is compact and already classified", () => {
  const fullPayloadText = readFileSync("data/questions.from-pdf.json", "utf8");
  const runtimePayloadText = readFileSync("data/questions.runtime.json", "utf8");
  const compressedRuntimePayload = readFileSync("data/questions.runtime.json.gz");
  const runtimePayload = JSON.parse(runtimePayloadText);
  const parsedRuntime = parseQuestionImport(runtimePayload);
  const firstQuestion = parsedRuntime[0];

  assert.equal(runtimePayload.sourceType, "browser-runtime-question-bank-v1");
  assert.equal(runtimePayload.runtime?.prepared, true);
  assert.equal(runtimePayload.runtime?.encoding, "schema-array");
  assert.equal(runtimePayload.questions.length, JSON.parse(fullPayloadText).questions.length);
  assert.ok(runtimePayloadText.length < fullPayloadText.length * 0.65);
  assert.equal(zlib.gunzipSync(compressedRuntimePayload).toString("utf8"), runtimePayloadText);
  assert.ok(compressedRuntimePayload.length < Buffer.byteLength(runtimePayloadText) * 0.35);
  assert.equal(firstQuestion.gameplayStatus, "mainline");
  assert.ok(firstQuestion.lesson?.id);
  assert.ok(firstQuestion.lesson?.studyPrompt);
  assert.equal("ocr" in firstQuestion, false);
  assert.equal("classification" in firstQuestion, false);
  assert.equal("sourceLocation" in firstQuestion, false);
});

test("browser runtime question index shards full questions into lazy chunks", () => {
  const runtimePayloadText = readFileSync("data/questions.runtime.json", "utf8");
  const indexPayloadText = readFileSync("data/question-index.json", "utf8");
  const compressedIndexPayload = readFileSync("data/question-index.json.gz");
  const indexPayload = JSON.parse(indexPayloadText);
  const parsedIndex = parseQuestionImport(indexPayload);
  const firstIndexQuestion = parsedIndex[0];
  const firstChunk = indexPayload.chunks[0];
  const firstChunkText = readFileSync(firstChunk.url, "utf8");
  const firstChunkPayload = JSON.parse(firstChunkText);
  const parsedFirstChunk = parseQuestionImport(firstChunkPayload);
  const firstFullQuestion = parsedFirstChunk[0];

  assert.equal(indexPayload.sourceType, "browser-runtime-question-index-v1");
  assert.equal(indexPayload.runtime?.prepared, true);
  assert.equal(indexPayload.runtime?.encoding, "schema-array");
  assert.equal(indexPayload.questions.length, JSON.parse(runtimePayloadText).questions.length);
  assert.ok(indexPayload.chunks.length > 20);
  assert.ok(Buffer.byteLength(indexPayloadText) < Buffer.byteLength(runtimePayloadText) * 0.25);
  assert.equal(zlib.gunzipSync(compressedIndexPayload).toString("utf8"), indexPayloadText);
  assert.equal(firstIndexQuestion.chunkId, firstChunk.id);
  assert.equal(firstIndexQuestion.lesson?.id.startsWith("lesson-"), true);
  assert.equal(firstIndexQuestion.stem, "");
  assert.deepEqual(firstIndexQuestion.options, []);
  assert.equal(firstIndexQuestion.answer, "");
  assert.equal(firstChunkPayload.sourceType, "browser-runtime-question-bank-v1");
  assert.equal(zlib.gunzipSync(readFileSync(`${firstChunk.url}.gz`)).toString("utf8"), firstChunkText);
  assert.equal(firstFullQuestion.id, firstIndexQuestion.id);
  assert.ok(firstFullQuestion.stem);
  assert.ok(firstFullQuestion.options.length >= 2);
  assert.ok(firstFullQuestion.answer);
  assert.ok(firstFullQuestion.lesson?.explanation);
});

test("complete PDF source-slot artifact accounts for every source question slot", () => {
  const payload = JSON.parse(readFileSync("data/question-source-slots.from-pdf.json", "utf8"));
  const findSlot = (examKey, questionNumber) => payload.slots.find((slot) =>
    slot.examKey === examKey && slot.questionNumber === questionNumber,
  );
  const high2013q75 = findSlot("2013-01-12-高中", 75);

  assert.equal(payload.sourceType, "hybrid-vision-ocr-question-source-slots");
  assert.equal(payload.ocr.sourceExamCount, 52);
  assert.equal(payload.ocr.sourceTotalQuestionSlots, 4680);
  assert.equal(payload.slots.length, 4680);
  assert.equal(payload.ocr.unmatchedSourceSlotCount, 0);
  assert.ok(payload.ocr.recognizedSourceSlotCount > 4600);
  assert.ok(high2013q75);
  assert.equal(high2013q75.status, "source-missing");
  assert.match(high2013q75.reviewReasons.join(" "), /题目 PDF 与答案 PDF 均跳号/u);
});

test("top-level design docs use the verified PDF source-slot count", () => {
  const docs = [
    "docs/01-game-overview.md",
    "docs/02-text-feedback.md",
    "docs/03-gameplay-systems.md",
    "docs/04-ui-spec.md",
    "docs/06-content-pipeline.md",
    "docs/07-product-acceptance.md",
    "docs/08-verification-report.md",
  ].map((filePath) => readFileSync(filePath, "utf8")).join("\n");

  assert.match(docs, /4680/);
  assert.doesNotMatch(docs, /4077/);
});
