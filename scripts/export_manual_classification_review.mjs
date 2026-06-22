import { readFileSync, writeFileSync } from "node:fs";

const bankPath = "data/questions.from-pdf.json";
const auditPath = "data/question-classification.audit.json";
const jsonOutputPath = "data/manual-classification-review.json";
const markdownOutputPath = "docs/manual-classification-review.md";
const questionPdfPath = "docs/09小明课堂 历年真题.pdf";
const answerPdfPath = "docs/10小明课堂 《历年真题答案》.pdf";

const bank = JSON.parse(readFileSync(bankPath, "utf8"));
const audit = JSON.parse(readFileSync(auditPath, "utf8"));
const questions = bank.questions || [];
const manualItems = (audit.questions || [])
  .filter((item) => item.classification?.primaryDomain?.id === "needs_manual_classification")
  .map((item) => {
    const raw = questions[item.bankIndex] || {};
    const source = item.source || {};
    const ocr = raw.ocr || {};
    return {
      bankIndex: item.bankIndex,
      classificationKey: item.classificationKey,
      sourceId: item.id,
      year: raw.year || source.year || "",
      type: raw.type || source.type || "",
      oldTopic: source.oldTopic || raw.topic || "",
      examTitle: source.examTitle || ocr.examTitle || "",
      questionNumber: ocr.questionNumber || "",
      questionPdf: questionPdfPath,
      questionPdfPage: source.questionSourcePage ?? ocr.questionSourcePage ?? ocr.sourcePage ?? "",
      questionPrintedPage: ocr.printedPage || "",
      answerPdf: answerPdfPath,
      answerPdfPage: source.answerSourcePage ?? ocr.answerSourcePage ?? "",
      sourceRef: source.sourceRef || raw.sourceRef || "",
      stemExcerpt: trimExcerpt(raw.stem, 120),
      reviewReasons: [
        ...(ocr.reviewReasons || []),
        ...(item.quality?.reasons || []),
      ],
      classificationConfidence: item.classification?.confidence || "",
    };
  });

if (manualItems.length !== 114) {
  throw new Error(`待人工归类题数量应为 114，实际为 ${manualItems.length}`);
}

const payload = {
  generatedAt: new Date().toISOString(),
  sourceQuestionBank: bankPath,
  sourceClassificationAudit: auditPath,
  count: manualItems.length,
  pdfs: {
    questions: questionPdfPath,
    answers: answerPdfPath,
  },
  items: manualItems,
};

writeFileSync(jsonOutputPath, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(markdownOutputPath, renderMarkdown(payload));

console.log(`Wrote ${manualItems.length} manual-classification items.`);
console.log(jsonOutputPath);
console.log(markdownOutputPath);

function renderMarkdown(payload) {
  const lines = [
    "# 待人工归类题 PDF 位置清单",
    "",
    `生成时间：${payload.generatedAt}`,
    "",
    `题目 PDF：${payload.pdfs.questions}`,
    "",
    `答案 PDF：${payload.pdfs.answers}`,
    "",
    `数量：${payload.count}`,
    "",
    "| # | bankIndex | sourceId | 考试/题号 | 题目PDF页 | 答案PDF页 | 旧分类 | 题干摘录 | 复核原因 |",
    "|---:|---:|---|---|---:|---:|---|---|---|",
  ];

  payload.items.forEach((item, index) => {
    const exam = [item.examTitle, item.questionNumber ? `第${item.questionNumber}题` : ""]
      .filter(Boolean)
      .join(" ");
    lines.push([
      index + 1,
      item.bankIndex,
      item.sourceId,
      exam,
      item.questionPdfPage,
      item.answerPdfPage,
      item.oldTopic,
      item.stemExcerpt,
      item.reviewReasons.join("；") || item.classificationConfidence || "分类置信度不足",
    ].map(escapeMarkdownCell).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  });

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function trimExcerpt(value, length) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function escapeMarkdownCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .trim();
}
