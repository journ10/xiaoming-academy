import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyQuestionClassifications,
  createInitialState,
  createRun,
  learningDomainDefinitions,
  parseQuestionImport,
  prepareQuestionBank,
  prepareQuestions,
  selectRunQuestions,
  summarizeQuestionBank,
} from "../core.js";

function makeQuestion(id, stem, answer = "A") {
  return {
    id,
    sourceId: id,
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
    explanation: `${stem} 的解析。题眼是限定词、对象和条件。`,
    qualityStatus: "clean",
    errorPatterns: ["memory-gap"],
  };
}

function auditFor(questions, entries) {
  return {
    questions: questions.map((question, index) => {
      const entry = entries[index];
      return {
        id: question.id,
        classification: {
          primaryDomain: {
            id: entry.domainId,
            name: entry.domainName,
          },
          knowledgePath: `${entry.domainName} · ${entry.subdomain || "基础概念"}`,
        },
        quality: {
          status: entry.quality || "clean",
        },
      };
    }),
  };
}

test("classification audit replaces catch-all topics and keeps manual items out of runs", () => {
  const raw = [
    makeQuestion("pdf-0034", "教师应当依法履行教育教学职责"),
    makeQuestion("pdf-0035", "儿童身心发展具有阶段性"),
    makeQuestion("pdf-0099", "这道 OCR 题暂时无法判断所属知识域"),
  ];
  const audit = auditFor(raw, [
    { domainId: "law", domainName: "教育法律法规与政策制度", subdomain: "教师权利义务" },
    { domainId: "child", domainName: "学生身心发展与个体差异", subdomain: "发展规律" },
    { domainId: "needs_manual_classification", domainName: "待人工归类", quality: "manual_review" },
  ]);

  const prepared = prepareQuestions(applyQuestionClassifications(raw, audit));
  const bank = prepareQuestionBank(prepared);

  assert.deepEqual(prepared.map((question) => question.topic), [
    "教育法律法规与政策制度",
    "学生身心发展与个体差异",
    "待人工归类",
  ]);
  assert.equal(bank.playable.length, 2);
  assert.equal(bank.manualReview.length, 1);
  assert.equal(bank.playable.some((question) => question.topic === "综合知识"), false);
});

test("six learning domains are the only formal classification groups", () => {
  const domainQuestions = learningDomainDefinitions.map((domain, index) => ({
    ...makeQuestion(`domain-${index + 1}`, `${domain.name} 题干`),
    topic: domain.name,
    primaryDomain: domain,
  }));
  const bank = prepareQuestionBank(domainQuestions);

  assert.deepEqual(
    bank.playable.map((question) => question.primaryDomain.name).sort(),
    learningDomainDefinitions.map((domain) => domain.name).sort(),
  );
  assert.equal(bank.playable.some((question) => question.primaryDomain.name === "综合知识"), false);
});

test("run selection only uses classified playable questions and backfills to five", () => {
  const questions = learningDomainDefinitions.map((domain, index) => ({
    ...makeQuestion(`domain-${index + 1}`, `${domain.name} 题干`),
    topic: domain.name,
    primaryDomain: domain,
  }));
  const raw = [
    ...questions,
    { ...makeQuestion("manual-1", "待复核题"), topic: "待人工归类", primaryDomain: { id: "manual", name: "待人工归类" }, qualityStatus: "manual_review" },
    { ...makeQuestion("catchall-1", "旧兜底题"), topic: "综合知识", primaryDomain: { id: "catchall", name: "综合知识" } },
  ];
  const bank = prepareQuestionBank(raw);
  const selected = selectRunQuestions(bank.playable.slice(0, 2), createInitialState(), {
    targetId: "explore",
    length: 5,
    fallbackQuestions: bank.playable,
  });
  const run = createRun(bank.playable, createInitialState(), { targetId: "sprint", styleId: "steady" });

  assert.equal(selected.length, 5);
  assert.equal(new Set(selected.map((question) => question.id)).size, 5);
  assert.equal(run.questions.length, 5);
  assert.equal(run.questions.some((question) => question.topic === "待人工归类"), false);
  assert.equal(run.questions.some((question) => question.topic === "综合知识"), false);
});

test("summary reports totals, playable questions, manual review, and domain counts", () => {
  const raw = [
    { ...makeQuestion("law-1", "法规律题"), topic: "教育法律法规与政策制度", primaryDomain: learningDomainDefinitions[2] },
    { ...makeQuestion("psy-1", "心理题"), topic: "学习心理与认知机制", primaryDomain: learningDomainDefinitions[0] },
    { ...makeQuestion("manual-1", "待复核题"), topic: "待人工归类", primaryDomain: { id: "manual", name: "待人工归类" }, qualityStatus: "manual_review" },
  ];
  const summary = summarizeQuestionBank(raw);

  assert.equal(summary.total, 3);
  assert.equal(summary.playable, 2);
  assert.equal(summary.manualReview, 1);
  assert.deepEqual(summary.byDomain.map((entry) => entry.name).sort(), [
    "学习心理与认知机制",
    "教育法律法规与政策制度",
  ]);
});

test("built-in runtime data keeps manual items outside playable routes", () => {
  const payload = JSON.parse(readFileSync("data/questions.runtime.json", "utf8"));
  const parsed = parseQuestionImport(payload);
  const bank = prepareQuestionBank(parsed);
  const playableDomains = new Set(bank.playable.map((question) => question.primaryDomain.name));

  assert.ok(bank.all.length > 4000);
  assert.ok(bank.playable.length > 1000);
  assert.ok(bank.manualReview.length > 0);
  assert.deepEqual([...playableDomains].sort(), learningDomainDefinitions.map((domain) => domain.name).sort());
  assert.equal(bank.playable.some((question) => question.primaryDomain.name === "综合知识"), false);
  assert.equal(bank.playable.some((question) => /人工/u.test(question.primaryDomain.name)), false);
});
