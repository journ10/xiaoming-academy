import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyQuestionClassifications,
  createMixedSimulationRun,
  createStoryChapters,
  learningDomainDefinitions,
  parseQuestionImport,
  prepareQuestions,
  selectMixedSimulationQuestions,
  selectRouteQuestions,
  summarizeQuestionBank,
} from "../core.js";

function makeQuestion(id, stem, answer = "A") {
  return {
    id,
    year: "2026",
    type: "单项选择题",
    topic: "综合知识",
    stem,
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "干扰" },
      { key: "C", text: "干扰" },
      { key: "D", text: "干扰" },
    ],
    answer,
    explanation: `${stem} 的解析。`,
    sourceRef: "题目 PDF OCR 第 9 页；PDF OCR 第 12 页：第 1 题解析",
    ocr: {
      sourcePage: 9,
      answerSourcePage: 12,
      examTitle: "2026年深圳教师招聘考试",
    },
  };
}

function auditFor(questions, entries) {
  return {
    questions: questions.map((question, index) => {
      const entry = entries[index];
      return {
        bankIndex: index,
        classificationKey: `${question.id}#${index}`,
        id: question.id,
        source: {
          year: question.year,
          type: question.type,
          oldTopic: question.topic,
          sourceRef: question.sourceRef,
          questionSourcePage: question.ocr?.sourcePage,
          answerSourcePage: question.ocr?.answerSourcePage,
          examTitle: question.ocr?.examTitle,
        },
        classification: {
          primaryDomain: {
            id: entry.domainId,
            name: entry.domainName,
          },
          subdomain: entry.subdomain || "基础概念",
          knowledgePath: `${entry.domainName} · ${entry.subdomain || "基础概念"}`,
          examAbilities: [],
          confidence: entry.confidence || "high",
        },
        quality: {
          status: entry.quality || "clean",
          reasons: entry.reasons || [],
        },
      };
    }),
  };
}

test("classification audit replaces old catch-all topics and makes duplicate PDF ids unique", () => {
  const raw = [
    makeQuestion("pdf-0034", "教师应当依法履行教育教学职责"),
    makeQuestion("pdf-0034", "儿童身心发展具有阶段性"),
    makeQuestion("pdf-0099", "这道 OCR 题暂时无法判断所属知识域"),
  ];
  const audit = auditFor(raw, [
    { domainId: "law_policy", domainName: "教育法律法规与政策制度", subdomain: "教师权利义务" },
    { domainId: "student_development", domainName: "学生身心发展与个体差异", subdomain: "发展规律" },
    { domainId: "needs_manual_classification", domainName: "待人工归类", quality: "needs_review", confidence: "low" },
  ]);

  const prepared = prepareQuestions(applyQuestionClassifications(raw, audit));

  assert.equal(prepared[0].sourceId, "pdf-0034");
  assert.equal(prepared[1].sourceId, "pdf-0034");
  assert.notEqual(prepared[0].id, prepared[1].id);
  assert.deepEqual(prepared.map((question) => question.topic), [
    "教育法律法规与政策制度",
    "学生身心发展与个体差异",
    "待人工归类",
  ]);
  assert.equal(prepared[2].gameplayStatus, "manual_classification");
});

test("prepared lessons follow reclassified topics and current short-lesson copy", () => {
  const raw = [
    {
      ...makeQuestion("pdf-0050", "教师职业规范题"),
      lesson: {
        title: "综合知识 · 第 51 题解析",
        sourceRef: "题目 PDF OCR 第 5 页；PDF OCR 第 5 页（原页码 7）：第 51 题解析",
        keyPoint: "教师职业规范",
        studyPrompt: "练功目标：先核对 OCR 原文，再记住本题解析中的题眼。",
      },
    },
  ];
  const audit = auditFor(raw, [
    { domainId: "teacher_ethics_professionalism", domainName: "教师职业素养与专业规范", quality: "clean" },
  ]);
  const [question] = parseQuestionImport({ questions: raw }, { classificationAudit: audit });

  assert.equal(question.topic, "教师职业素养与专业规范");
  assert.equal(question.gameplayStatus, "mainline");
  assert.equal(question.lesson.title, "教师职业素养与专业规范 · 第 51 题解析");
  assert.doesNotMatch(question.lesson.title, /综合知识/u);
  assert.match(question.lesson.studyPrompt, /^短课目标/u);
  assert.doesNotMatch(question.lesson.studyPrompt, /练功/u);
});

test("mainline chapters contain six real learning domains and no comprehensive catch-all", () => {
  const domainQuestions = learningDomainDefinitions.map((domain, index) =>
    makeQuestion(`pdf-${String(index + 1).padStart(4, "0")}`, `${domain.name} 题干`),
  );
  const raw = [
    ...domainQuestions,
    makeQuestion("pdf-9001", "低质量 OCR 题"),
    makeQuestion("pdf-9002", "待人工判断题"),
  ];
  const audit = auditFor(raw, [
    ...learningDomainDefinitions.map((domain) => ({
      domainId: domain.id,
      domainName: domain.name,
      quality: "clean",
    })),
    { domainId: "learning_psychology", domainName: "学习心理与认知机制", quality: "needs_review" },
    { domainId: "needs_manual_classification", domainName: "待人工归类", quality: "needs_review" },
  ]);
  const prepared = parseQuestionImport({ questions: raw }, { classificationAudit: audit });
  const chapters = createStoryChapters(prepared, { requiredMastery: 16 });

  assert.deepEqual(chapters.map((chapter) => chapter.topic), learningDomainDefinitions.map((domain) => domain.name));
  assert.equal(chapters.length, 6);
  assert.equal(chapters.some((chapter) => chapter.topic === "综合知识"), false);
  assert.equal(chapters.some((chapter) => chapter.topic === "待人工归类"), false);
  assert.equal(chapters.every((chapter) => chapter.questionIds.length === 1), true);
});

test("formal route and mixed simulation only use clean classified questions", () => {
  const raw = [
    makeQuestion("pdf-0001", "法规律题"),
    makeQuestion("pdf-0002", "课程教学题"),
    makeQuestion("pdf-0003", "可谨慎练习题"),
    makeQuestion("pdf-0004", "需复核题"),
    makeQuestion("pdf-0005", "待人工归类题"),
  ];
  const audit = auditFor(raw, [
    { domainId: "law_policy", domainName: "教育法律法规与政策制度", quality: "clean" },
    { domainId: "pedagogy_curriculum_instruction", domainName: "教育学原理、课程与教学", quality: "clean" },
    { domainId: "learning_psychology", domainName: "学习心理与认知机制", quality: "usable_with_caution" },
    { domainId: "student_development", domainName: "学生身心发展与个体差异", quality: "needs_review" },
    { domainId: "needs_manual_classification", domainName: "待人工归类", quality: "needs_review" },
  ]);
  const prepared = parseQuestionImport({ questions: raw }, { classificationAudit: audit });
  const routeQuestions = selectRouteQuestions(prepared, undefined, { length: 10 });
  const simulationQuestions = selectMixedSimulationQuestions(prepared, undefined, { length: 10 });
  const simulationRun = createMixedSimulationRun(prepared, undefined, { length: 10 });

  assert.deepEqual(routeQuestions.map((question) => question.topic), [
    "教育法律法规与政策制度",
    "教育学原理、课程与教学",
  ]);
  assert.deepEqual(simulationQuestions.map((question) => question.topic), [
    "教育法律法规与政策制度",
    "教育学原理、课程与教学",
  ]);
  assert.equal(simulationRun.mode, "simulation");
  assert.equal(simulationRun.title, "综合模拟");
  assert.equal(simulationRun.nodes.length, 2);
});

test("classification audit summary reports the 114 manual-classification PDF locations", () => {
  const audit = JSON.parse(readFileSync("data/question-classification.audit.json", "utf8"));
  const manualItems = audit.questions.filter((item) =>
    item.classification?.primaryDomain?.id === "needs_manual_classification",
  );
  const summary = summarizeQuestionBank(
    JSON.parse(readFileSync("data/questions.from-pdf.json", "utf8")),
    { classificationAudit: audit },
  );

  assert.equal(manualItems.length, 114);
  assert.equal(summary.manualClassificationCount, 114);
  assert.ok(manualItems.every((item) => Number.isInteger(item.source?.questionSourcePage)));
  assert.ok(manualItems.every((item) => Number.isInteger(item.source?.answerSourcePage)));
  assert.ok(manualItems.every((item) => String(item.source?.sourceRef || "").includes("PDF OCR")));
});

test("built-in classified playable lessons do not leak old catch-all lesson copy", () => {
  const payload = JSON.parse(readFileSync("data/questions.from-pdf.json", "utf8"));
  const audit = JSON.parse(readFileSync("data/question-classification.audit.json", "utf8"));
  const prepared = parseQuestionImport(payload, { classificationAudit: audit });
  const playable = prepared.filter((question) => question.gameplayStatus === "mainline");
  const leakingTitles = playable.filter((question) => /综合知识/u.test(String(question.lesson?.title || "")));
  const oldGoalPrompts = prepared.filter((question) => /练功/u.test(String(question.lesson?.studyPrompt || "")));

  assert.ok(playable.length > 0);
  assert.equal(leakingTitles.length, 0);
  assert.equal(oldGoalPrompts.length, 0);
});

test("built-in clean playable lessons do not expose OCR spacing noise", () => {
  const payload = JSON.parse(readFileSync("data/questions.from-pdf.json", "utf8"));
  const audit = JSON.parse(readFileSync("data/question-classification.audit.json", "utf8"));
  const prepared = parseQuestionImport(payload, { classificationAudit: audit });
  const cleanPlayable = prepared.filter((question) =>
    question.gameplayStatus === "mainline" && question.qualityStatus === "clean",
  );
  const noisyLessons = cleanPlayable.filter((question) => {
    const text = String(question.lesson?.explanation || "");
    return /[\u3400-\u9fff\uf900-\ufaff][ \t\u00a0]+[\u3400-\u9fff\uf900-\ufaff]|专业入员|学生\s+象|学生象|对环\s*的依赖/u.test(text);
  });
  const reviewedQuestion = prepared.find((question) => question.sourceId === "pdf-0153" && question.bankIndex === 146);

  assert.equal(noisyLessons.length, 0);
  assert.equal(reviewedQuestion?.gameplayStatus, "content_review");
});

test("built-in clean playable question copy does not expose known OCR-dirty text", () => {
  const payload = JSON.parse(readFileSync("data/questions.from-pdf.json", "utf8"));
  const audit = JSON.parse(readFileSync("data/question-classification.audit.json", "utf8"));
  const prepared = parseQuestionImport(payload, { classificationAudit: audit });
  const cleanPlayable = prepared.filter((question) =>
    question.gameplayStatus === "mainline" && question.qualityStatus === "clean",
  );
  const dirtyPattern = /米成年人|抚养义务7|照管制度化|职贵|太双避冲突|对环\s*的依赖|对环的依赖|X45/u;
  const dirtyQuestions = cleanPlayable.filter((question) => {
    const text = [
      question.stem,
      ...(question.options || []).map((option) => option.text),
      question.explanation,
      question.lesson?.explanation,
    ].join("\n");
    return dirtyPattern.test(text);
  });
  const reviewedQuestion = prepared.find((question) => question.sourceId === "pdf-0096" && question.bankIndex === 96);

  assert.equal(dirtyQuestions.length, 0);
  assert.equal(reviewedQuestion?.gameplayStatus, "content_review");
});
