import fs from "node:fs";
import path from "node:path";

const DEFAULT_INPUT = "data/pdf-ocr-pages.jsonl";
const DEFAULT_OUTPUT = "data/questions.from-pdf.json";
const SOURCE_PDF = "docs/10小明课堂 《历年真题答案》.pdf";
const OPTION_KEYS = "ABCDEFGH".split("");

const HEADER_PATTERNS = [
  /深圳教师考编专业培训/,
  /微信号\s*\d+/,
  /公众号/,
  /机构电话/,
  /^页\s*\d+/,
  /\d{7,}/,
];

const SECTION_PATTERN = /[一二三四五六七八九十]+[、.．]\s*.{0,12}(单项选择题|多项选择题|判断题|填空题|简答题|论述题|案例分析题|客观题|主观题)/;
const EXAM_TITLE_PATTERN = /(20\d{2}|19\d{2}).{0,60}(考试|招聘|招考|真题|参考答案|答案及解析)/;
const ANSWER_PATTERN = /(?:^|[\s　])(\d{1,3})\s*[,，.．、]?\s*[【\[]\s*[^】\]]{0,6}?(?:答案|答第|答業|答紫|案答|梁答|染荟)[^】\]]{0,6}?\s*[】\]]\s*([A-HO0QG]{1,8})/i;

const TOPIC_RULES = [
  {
    topic: "教师职业道德",
    keywords: ["教师职业道德", "职业道德", "师德", "爱岗敬业", "关爱学生", "为人师表", "教书育人"],
  },
  {
    topic: "教育法规",
    keywords: [
      "教育法",
      "教师法",
      "义务教育法",
      "未成年人",
      "教师资格",
      "法律",
      "法规",
      "条例",
      "教育行政",
      "学业证书",
      "免试入学",
    ],
  },
  {
    topic: "班级管理",
    keywords: ["班主任", "班级", "班集体", "课堂纪律", "师生关系", "人际关系", "突发", "管理", "领导方式"],
  },
  {
    topic: "儿童发展",
    keywords: ["儿童", "小学生", "小学儿童", "身心发展", "年龄特征", "发展规律", "低年级", "高年级"],
  },
  {
    topic: "教育心理学",
    keywords: [
      "心理",
      "学习动机",
      "学习迁移",
      "认知",
      "元认知",
      "记忆",
      "注意",
      "情绪",
      "思维",
      "皮亚杰",
      "维果斯基",
      "埃里克森",
      "投射效应",
    ],
  },
  {
    topic: "教学设计",
    keywords: ["教学目标", "教案", "教学", "课程", "导入", "讲授法", "教学模式", "评价", "教材", "课程标准"],
  },
];

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function getPageNumber(imagePath, fallback) {
  const match = String(imagePath || "").match(/page-(\d+)\.png$/);
  return match ? Number(match[1]) : fallback + 1;
}

function getPrintedPage(text) {
  const match = text.match(/页\s*(\d{1,4})/);
  return match ? match[1] : "";
}

function isHeaderOrFooter(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return HEADER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function detectExamTitle(line) {
  const trimmed = normalizeLine(line);
  return EXAM_TITLE_PATTERN.test(trimmed) ? trimmed : "";
}

function detectSection(line) {
  const trimmed = normalizeLine(line);
  const match = trimmed.match(SECTION_PATTERN);
  return match ? match[1] : "";
}

function normalizeAnswer(rawAnswer) {
  let review = false;
  const answer = rawAnswer
    .toUpperCase()
    .replace(/O|0|Q/g, () => {
      review = true;
      return "D";
    })
    .replace(/[^A-H]/g, "");

  if (!answer || /[FGH]/.test(answer)) review = true;
  return {
    answer: [...new Set(answer.split(""))].join(""),
    rawAnswer,
    answerNeedsReview: review,
  };
}

function trimMarker(line, match) {
  const raw = normalizeLine(line);
  const marker = normalizeLine(match[0]);
  const index = raw.indexOf(marker);
  const after = index >= 0 ? raw.slice(index + marker.length) : raw;
  return after.replace(/^[。．.、，,：:\s]*(解析)?[：:\s]*/u, "").trim();
}

function inferTopic(text) {
  const scores = TOPIC_RULES.map(({ topic, keywords }) => ({
    topic,
    score: keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score);
  return scores[0]?.score ? scores[0].topic : "综合知识";
}

function inferDifficulty(text) {
  if (text.length > 900) return 4;
  if (text.length > 520) return 3;
  if (text.length > 220) return 2;
  return 1;
}

function extractKeyPoint(text, topic) {
  const compact = text.replace(/\s+/g, "");
  for (const { keywords } of TOPIC_RULES.filter((rule) => rule.topic === topic)) {
    const hit = keywords.find((keyword) => compact.includes(keyword));
    if (hit) return hit;
  }
  const firstSentence = compact.split(/[。；;，,]/).find((part) => part.length >= 4) || topic;
  return firstSentence.slice(0, 24);
}

function makeOptions(answer) {
  const letters = answer.split("").filter(Boolean);
  const maxAnswerIndex = Math.max(3, ...letters.map((key) => OPTION_KEYS.indexOf(key)));
  return OPTION_KEYS.slice(0, Math.max(4, maxAnswerIndex + 1)).map((key) => ({ key, text: key }));
}

function hasSuspiciousText(text) {
  return /[€𣂼�]|[A-Za-z]{5,}|[{}<>]/.test(text);
}

function buildEntries(pages) {
  const entries = [];
  let currentExam = "";
  let currentSection = "";
  let currentEntry = null;

  function finishEntry() {
    if (!currentEntry) return;
    currentEntry.explanation = currentEntry.lines.join("\n").trim();
    entries.push(currentEntry);
    currentEntry = null;
  }

  pages.forEach((page, pageIndex) => {
    const pageNumber = getPageNumber(page.image, pageIndex);
    const printedPage = getPrintedPage(page.text || "");
    const lines = (page.lines || []).map((line) => ({
      text: normalizeLine(line.text || ""),
      confidence: Number(line.confidence || 0),
    }));

    lines.forEach((line) => {
      if (!line.text) return;
      const examTitle = detectExamTitle(line.text);
      if (examTitle) {
        if (currentEntry && currentEntry.lines.length === 0) finishEntry();
        currentExam = examTitle;
        return;
      }

      const section = detectSection(line.text);
      if (section) {
        currentSection = section;
        return;
      }

      const answerMatch = line.text.match(ANSWER_PATTERN);
      if (answerMatch) {
        finishEntry();
        const answer = normalizeAnswer(answerMatch[2]);
        const firstText = trimMarker(line.text, answerMatch);
        currentEntry = {
          page: pageNumber,
          printedPage,
          examTitle: currentExam,
          section: currentSection || "答案解析",
          questionNumber: Number(answerMatch[1]),
          rawAnswer: answer.rawAnswer,
          answer: answer.answer,
          answerNeedsReview: answer.answerNeedsReview,
          pageAvgConfidence: Number(page.avgConfidence || 0),
          pageMinConfidence: Number(page.minConfidence || 0),
          markerConfidence: line.confidence,
          lines: firstText && !isHeaderOrFooter(firstText) ? [firstText] : [],
        };
        return;
      }

      if (currentEntry && !isHeaderOrFooter(line.text)) {
        currentEntry.lines.push(line.text);
      }
    });
  });

  finishEntry();
  return entries.filter((entry) => entry.answer && entry.explanation);
}

function buildQuestions(entries) {
  return entries.map((entry, index) => {
    const yearMatch = entry.examTitle.match(/(20\d{2}|19\d{2})/);
    const year = yearMatch ? yearMatch[1] : "未标注";
    const topic = inferTopic(entry.explanation);
    const difficulty = inferDifficulty(entry.explanation);
    const sourceRef = `PDF OCR 第 ${entry.page} 页${entry.printedPage ? `（原页码 ${entry.printedPage}）` : ""}：第 ${entry.questionNumber} 题解析`;
    const reviewReasons = [];

    if (entry.answerNeedsReview) {
      reviewReasons.push(
        entry.rawAnswer === entry.answer
          ? `答案 OCR 为 ${entry.rawAnswer}，含非常规选项字母，需按原页确认`
          : `答案 OCR 为 ${entry.rawAnswer}，已规范为 ${entry.answer}`,
      );
    }
    if (entry.markerConfidence < 0.7 || entry.pageAvgConfidence < 0.72) reviewReasons.push("OCR 置信度偏低");
    if (hasSuspiciousText(entry.explanation)) reviewReasons.push("解析文本含疑似 OCR 噪声");
    if (/暂时未收集完整|略/.test(entry.explanation)) reviewReasons.push("原资料标注题干或解析不完整");

    return {
      id: `pdf-${String(index + 1).padStart(4, "0")}`,
      year,
      type: entry.section || "答案解析",
      topic,
      stem: `${entry.examTitle || `${year} 年深圳教师招聘考试`}第 ${entry.questionNumber} 题参考答案是？`,
      options: makeOptions(entry.answer),
      answer: entry.answer,
      explanation: entry.explanation,
      sourceRef,
      difficulty,
      lesson: {
        title: `${topic} · 第 ${entry.questionNumber} 题解析`,
        sourceRef,
        keyPoint: extractKeyPoint(entry.explanation, topic),
        studyPrompt: "练功目标：先核对 OCR 原文，再记住本题解析中的题眼。",
      },
      ocr: {
        sourcePage: entry.page,
        printedPage: entry.printedPage || null,
        examTitle: entry.examTitle || null,
        rawAnswer: entry.rawAnswer,
        markerConfidence: entry.markerConfidence,
        pageAvgConfidence: entry.pageAvgConfidence,
        pageMinConfidence: entry.pageMinConfidence,
        requiresReview: reviewReasons.length > 0,
        reviewReasons,
      },
    };
  });
}

function main() {
  const input = process.argv[2] || DEFAULT_INPUT;
  const output = process.argv[3] || DEFAULT_OUTPUT;
  const pages = readJsonl(input).sort((a, b) => getPageNumber(a.image, 0) - getPageNumber(b.image, 0));
  const entries = buildEntries(pages);
  const questions = buildQuestions(entries);
  const payload = {
    source: SOURCE_PDF,
    sourceType: "vision-ocr-answer-pages",
    generatedAt: new Date().toISOString(),
    notice:
      "该 PDF 无可抽取文本层，内容由 macOS Vision OCR 从扫描页识别。源文件主要是参考答案及解析页，不包含完整原题选项；因此本文件按项目导入格式生成“答案回忆/解析题”，不会补造原题。带 ocr.requiresReview=true 的条目需要人工按页图复核后再作为正式题库使用。",
    ocr: {
      pageCount: pages.length,
      parsedQuestionCount: questions.length,
      reviewQuestionCount: questions.filter((question) => question.ocr.requiresReview).length,
      rawPagesJsonl: input,
    },
    questions,
  };

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${questions.length} questions to ${output}`);
  console.log(`${payload.ocr.reviewQuestionCount} questions require OCR review`);
}

main();
