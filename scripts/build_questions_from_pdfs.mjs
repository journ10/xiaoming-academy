import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildExamManifestFromQuestionPages,
  detectExamTitleLine,
  examKey as sourceExamKey,
  getTotalExpectedQuestionSlots,
} from "./pdf_source_manifest.mjs";

const DEFAULT_QUESTION_OCR = "data/question-ocr-pages.jsonl";
const DEFAULT_QUESTION_OCR_3X = "data/question-ocr-pages.3x.jsonl";
const DEFAULT_ANSWER_BANK = "data/answers.from-pdf.hybrid.json";
const DEFAULT_OUTPUT = "data/questions.from-pdf.json";
const DEFAULT_SOURCE_SLOTS_OUTPUT = "data/question-source-slots.from-pdf.json";
const DEFAULT_MANUAL_CORRECTIONS = "data/question-ocr-manual-corrections.json";
const DEFAULT_ANSWER_CORRECTIONS = "data/answer-ocr-manual-corrections.json";
const QUESTION_PDF = "docs/09小明课堂 历年真题.pdf";
const ANSWER_PDF = "docs/10小明课堂 《历年真题答案》.pdf";
const OPTION_KEYS = "ABCDEFGH".split("");

const HEADER_PATTERNS = [
  /深圳.{0,8}教师.{0,6}考编.{0,8}培训/,
  /微信号/,
  /公众号/,
  /总部电话/,
  /机构电话/,
  /^页\s*\d+/,
];
const KNOWN_OCR_TEXT_REPLACEMENTS = [
  ["教育数学任务", "教育教学任务"],
  ["賠", "赔"],
  ["学习动机造中", "学习动机适中"],
  ["情绪造中", "情绪适中"],
  ["材料难度造中", "材料难度适中"],
  ["学习較复杂", "学习较复杂"],
  ["缺之成就感", "缺乏成就感"],
];

export function parseQuestionPages(pages = []) {
  const entries = [];
  let currentExam = "";
  let currentSection = "";
  let currentEntry = null;

  function finishEntry() {
    if (!currentEntry) return;
    const parsed = parseQuestionBody(currentEntry.lines, currentSection);
    if (parsed.stem) {
      expandParsedQuestionEntry(currentEntry, parsed).forEach((entry) => entries.push({
          examTitle: currentEntry.examTitle,
          examKey: sourceExamKey(currentEntry.examTitle),
          section: currentEntry.section,
          questionNumber: entry.questionNumber,
          page: currentEntry.page,
          stem: entry.stem,
          options: parsed.options,
          requiresReview: entry.requiresReview,
          reviewReasons: entry.reviewReasons,
        }));
    }
    currentEntry = null;
  }

  const sortedPages = [...pages].sort((left, right) => getPageNumber(left.image, 0) - getPageNumber(right.image, 0));
  sortedPages.forEach((page, pageIndex) => {
    const pageNumber = getPageNumber(page.image, pageIndex);
    const lines = getPageLines(page);

    lines.forEach((rawLine) => {
      splitEmbeddedExamTitleSegments(rawLine).forEach((segment) => {
        if (segment.type === "examTitle") {
          finishEntry();
          currentExam = segment.text;
          currentSection = "";
          return;
        }

        const line = cleanLine(segment.text);
        if (!line) return;

        splitAdjacentQuestionStartSegments(line).forEach((linePart) => {
          const questionMatch = matchQuestionStart(linePart);
          if (questionMatch) {
            finishEntry();
            currentEntry = {
              examTitle: currentExam,
              section: currentSection,
              questionNumber: questionMatch.questionNumber,
              page: pageNumber,
              lines: [questionMatch.text],
            };
            return;
          }

          const section = detectSection(linePart);
          if (section) {
            finishEntry();
            currentSection = section;
            return;
          }

          if (currentEntry) {
            currentEntry.lines.push(linePart);
          }
        });
      });
    });
  });

  finishEntry();
  return entries.filter((entry) => entry.examTitle && entry.questionNumber);
}

export function mergeQuestionAndAnswerBanks(questionEntries = [], answerPayload = {}) {
  const answerQuestions = Array.isArray(answerPayload.questions) ? answerPayload.questions : [];
  const answerIndex = new Map();
  answerQuestions.forEach((answerQuestion, index) => {
    const key = answerEntryKey(answerQuestion);
    if (!key) return;
    if (!answerIndex.has(key)) answerIndex.set(key, []);
    answerIndex.get(key).push({ answerQuestion, index });
  });

  const usedAnswers = new Set();
  const merged = [];
  questionEntries.forEach((questionEntry) => {
    const key = `${questionEntry.examKey}::${questionEntry.questionNumber}`;
    const candidates = answerIndex.get(key) || [];
    const match = candidates.find((candidate) => !usedAnswers.has(candidate.index));
    if (!match) return;
    usedAnswers.add(match.index);

    const answerQuestion = match.answerQuestion;
    const reviewReasons = [
      ...(answerQuestion.ocr?.reviewReasons || []),
      ...(questionEntry.reviewReasons || []),
    ];
    let options = normalizeParsedOptions(questionEntry.options);
    const type = questionEntry.section || answerQuestion.type || "单项选择题";
    if (options.length < 2 && isJudgementType(type)) {
      options = [
        { key: "A", text: "正确" },
        { key: "B", text: "错误" },
      ];
    }

    const optionKeys = new Set(options.map((option) => option.key));
    for (const keyPart of String(answerQuestion.answer || "").split("")) {
      if (keyPart && !optionKeys.has(keyPart)) {
        options.push({ key: keyPart, text: "选项 OCR 待复核" });
        optionKeys.add(keyPart);
        reviewReasons.push(`答案 ${keyPart} 未在题目 OCR 选项中识别到`);
      }
    }
    options = sortOptions(options);
    if (options.length < 2) return;

    const sourceRef = `题目 PDF OCR 第 ${questionEntry.page} 页；${answerQuestion.sourceRef || "答案解析 OCR"}`;
    const lesson = answerQuestion.lesson || {};

    merged.push({
      ...answerQuestion,
      type,
      stem: normalizeBodyText(questionEntry.stem),
      options,
      sourceRef,
      lesson: {
        ...lesson,
        sourceRef,
      },
      ocr: {
        ...(answerQuestion.ocr || {}),
        examTitle: questionEntry.examTitle,
        answerExamTitle: answerQuestion.ocr?.examTitle || null,
        questionNumber: questionEntry.questionNumber,
        questionSourcePage: questionEntry.page,
        answerSourcePage: answerQuestion.ocr?.sourcePage || null,
        requiresReview: Boolean(answerQuestion.ocr?.requiresReview || questionEntry.requiresReview || reviewReasons.length),
        reviewReasons: [...new Set(reviewReasons)],
      },
    });
  });

  return merged;
}

export function buildHybridQuestionEntries(questionPageSources = [], manualCorrections = []) {
  const byKey = new Map();

  questionPageSources.forEach((source, sourceOrder) => {
    const label = source.label || `ocr-${sourceOrder + 1}`;
    const sourcePath = source.path || null;
    parseQuestionPages(source.pages || []).forEach((entry, entryIndex) => {
      upsertQuestionEntry(byKey, {
        ...entry,
        ocrSource: label,
        ocrSourcePath: sourcePath,
        ocrSourceOrder: sourceOrder,
        ocrEntryIndex: entryIndex,
        sourceStatus: "recognized",
      });
    });
  });

  normalizeManualCorrections(manualCorrections).forEach((correction, correctionIndex) => {
    const entry = {
      examTitle: correction.examTitle,
      examKey: correction.examKey || sourceExamKey(correction.examTitle),
      section: correction.section || "",
      questionNumber: Number(correction.questionNumber || 0),
      page: Number(correction.page || 0),
      stem: normalizeBodyText(correction.stem || ""),
      options: normalizeParsedOptions(correction.options || []),
      requiresReview: Boolean(correction.requiresReview),
      reviewReasons: [...new Set(correction.reviewReasons || [])],
      ocrSource: correction.ocrSource || "manual-visual-review",
      ocrSourcePath: DEFAULT_MANUAL_CORRECTIONS,
      ocrSourceOrder: Number.MAX_SAFE_INTEGER,
      ocrEntryIndex: correctionIndex,
      sourceStatus: correction.sourceStatus || inferSourceStatus(correction),
      manualCorrection: true,
    };
    if (!entry.examKey || !entry.questionNumber || !entry.stem) return;
    upsertQuestionEntry(byKey, entry, { force: correction.replace !== false });
  });

  return [...byKey.values()].sort(compareQuestionEntryOrder);
}

export function buildSourceSlotPayload({
  sourceManifest = [],
  questionEntries = [],
  generatedAt = new Date().toISOString(),
  questionPageSources = [],
  manualCorrectionsPath = DEFAULT_MANUAL_CORRECTIONS,
} = {}) {
  const sourceTotalQuestionSlots = getTotalExpectedQuestionSlots(sourceManifest);
  const entryIndex = new Map(questionEntries.map((entry) => [questionEntryKey(entry), entry]));
  const slots = [];

  sourceManifest.forEach((exam) => {
    const expectedQuestionCount = Number(exam.expectedQuestionCount || 0);
    for (let questionNumber = 1; questionNumber <= expectedQuestionCount; questionNumber += 1) {
      const key = `${exam.examKey}::${questionNumber}`;
      const entry = entryIndex.get(key);
      const status = entry ? sourceSlotStatus(entry) : "unmatched";
      const reviewReasons = entry?.reviewReasons || (status === "unmatched" ? ["题目 OCR 与人工核验均未定位该源题位"] : []);
      slots.push({
        id: `${exam.examKey}-${String(questionNumber).padStart(3, "0")}`,
        examTitle: entry?.examTitle || exam.title,
        examKey: exam.examKey,
        questionNumber,
        section: entry?.section || "",
        status,
        sourcePage: entry?.page || null,
        stem: entry?.stem || "",
        options: normalizeParsedOptions(entry?.options || []),
        requiresReview: Boolean(entry?.requiresReview || status !== "recognized"),
        reviewReasons: [...new Set(reviewReasons)],
        ocrSource: entry?.ocrSource || null,
        ocrSourcePath: entry?.ocrSourcePath || null,
      });
    }
  });

  const recognizedSourceSlotCount = slots.filter((slot) => slot.status === "recognized").length;
  const sourceMissingSlotCount = slots.filter((slot) => slot.status === "source-missing").length;
  const unmatchedSourceSlotCount = slots.filter((slot) => slot.status === "unmatched").length;

  return {
    source: {
      questionsPdf: QUESTION_PDF,
      answersPdf: ANSWER_PDF,
    },
    sourceType: "hybrid-vision-ocr-question-source-slots",
    generatedAt,
    notice:
      "本文件逐一记录《历年真题》PDF 的 4680 个源题位。status=recognized 表示题干/选项已从题目 PDF OCR 或人工读图确认；status=source-missing 表示原题目 PDF/答案 PDF 自身标注暂缺或跳号；status=unmatched 表示仍未定位。",
    ocr: {
      questionPageCount: questionPageSources[0]?.pages?.length || 0,
      sourceExamCount: sourceManifest.length,
      sourceTotalQuestionSlots,
      parsedQuestionCount: questionEntries.length,
      recognizedSourceSlotCount,
      sourceMissingSlotCount,
      unmatchedSourceSlotCount,
      questionPagesJsonl: DEFAULT_QUESTION_OCR,
      questionOcr3xPagesJsonl: questionPageSources.find((source) => source.path === DEFAULT_QUESTION_OCR_3X)?.path || null,
      manualQuestionCorrectionsJson: manualCorrectionsPath,
    },
    sourceManifest,
    slots,
  };
}

export function buildQuestionBankArtifacts({
  questionPages,
  questionPageSources,
  answerPayload,
  manualCorrections = [],
  answerCorrections = [],
  generatedAt = new Date().toISOString(),
} = {}) {
  const sources = questionPageSources?.length
    ? questionPageSources
    : [{ label: "2x", path: DEFAULT_QUESTION_OCR, pages: questionPages || [] }];
  const sourceManifest = buildExamManifestFromQuestionPages(questionPages);
  const sourceTotalQuestionSlots = getTotalExpectedQuestionSlots(sourceManifest);
  const questionEntries = buildHybridQuestionEntries(sources, manualCorrections);
  const sourceSlotPayload = buildSourceSlotPayload({
    sourceManifest,
    questionEntries,
    generatedAt,
    questionPageSources: sources,
  });
  const questions = normalizeKnownOcrTextDeep(applyManualMergedCorrections(
    mergeQuestionAndAnswerBanks(questionEntries, answerPayload),
    readCorrectionsArray(answerCorrections),
  ));
  const answerCount = Array.isArray(answerPayload.questions) ? answerPayload.questions.length : 0;
  const isHybridAnswerBank = String(answerPayload.sourceType || "").includes("hybrid");

  const questionBankPayload = {
    source: {
      questionsPdf: QUESTION_PDF,
      answersPdf: ANSWER_PDF,
    },
    sourceType: isHybridAnswerBank ? "hybrid-vision-ocr-question-answer-pages" : "vision-ocr-question-answer-pages",
    generatedAt,
    notice:
      "题干和选项来自《历年真题》PDF 的 OCR；答案和解析来自《历年真题答案》PDF 的 OCR。少量 OCR 低置信度或答案选项未完全识别的条目标记在 ocr.requiresReview 中。",
    ocr: {
      questionPageCount: questionPages.length,
      sourceExamCount: sourceManifest.length,
      sourceTotalQuestionSlots,
      parsedQuestionCount: questionEntries.length,
      recognizedSourceSlotCount: sourceSlotPayload.ocr.recognizedSourceSlotCount,
      sourceMissingSlotCount: sourceSlotPayload.ocr.sourceMissingSlotCount,
      unmatchedSourceSlotCount: sourceSlotPayload.ocr.unmatchedSourceSlotCount,
      answerQuestionCount: answerCount,
      mergedQuestionCount: questions.length,
      unmatchedQuestionSlotCount: Math.max(0, sourceTotalQuestionSlots - questions.length),
      unmatchedParsedQuestionCount: Math.max(0, questionEntries.length - questions.length),
      unmatchedQuestionCount: Math.max(0, questionEntries.length - questions.length),
      unmatchedAnswerCount: Math.max(0, answerCount - questions.length),
      reviewQuestionCount: questions.filter((question) => question.ocr?.requiresReview).length,
      questionPagesJsonl: DEFAULT_QUESTION_OCR,
      questionOcr3xPagesJsonl: sources.find((source) => source.path === DEFAULT_QUESTION_OCR_3X)?.path || null,
      answerBankJson: DEFAULT_ANSWER_BANK,
      sourceManifestJson: "data/pdf-source-manifest.json",
      completeSourceSlotsJson: DEFAULT_SOURCE_SLOTS_OUTPUT,
      manualQuestionCorrectionsJson: DEFAULT_MANUAL_CORRECTIONS,
      manualAnswerCorrectionsJson: DEFAULT_ANSWER_CORRECTIONS,
      answerOcrPagesJsonl: answerPayload.ocr?.answerOcrPagesJsonl || answerPayload.ocr?.rawPagesJsonl || null,
      answerOcr3xPagesJsonl: answerPayload.ocr?.answerOcr3xPagesJsonl || null,
      hybridAnswerStrategy: answerPayload.ocr?.hybridAnswerStrategy || null,
      hybridReplacedWith3x: answerPayload.ocr?.hybridReplacedWith3x ?? null,
      hybridKeptOld: answerPayload.ocr?.hybridKeptOld ?? null,
      hybridAddedFrom3x: answerPayload.ocr?.hybridAddedFrom3x ?? null,
    },
    sourceManifest,
    questions,
  };

  return { questionBankPayload, sourceSlotPayload };
}

export function buildQuestionBankPayload(args = {}) {
  return buildQuestionBankArtifacts(args).questionBankPayload;
}

function parseQuestionBody(lines, section) {
  const stemParts = [];
  const options = [];
  let currentOption = null;
  let sawOption = false;

  lines.forEach((rawLine) => {
    const line = cleanLine(rawLine);
    if (!line) return;
    const segments = splitOptionSegments(line);
    if (!segments.length) {
      if (currentOption) currentOption.text = appendText(currentOption.text, line);
      else stemParts.push(line);
      return;
    }

    const prefix = segments[0].prefix;
    if (prefix) {
      if (currentOption) currentOption.text = appendText(currentOption.text, prefix);
      else stemParts.push(prefix);
    }

    segments.forEach((segment) => {
      sawOption = true;
      currentOption = {
        key: segment.key,
        text: segment.text,
      };
      options.push(currentOption);
    });
  });

  const stem = normalizeBodyText(stemParts.join(""));
  const normalizedOptions = normalizeParsedOptions(options);
  const sourceMissing = Boolean(getSourceMissingQuestionRange(stem));
  const reviewReasons = [];
  if (sourceMissing) reviewReasons.push("原资料标注题目暂缺");
  if (!sawOption && !isJudgementType(section) && !sourceMissing) reviewReasons.push("题目 OCR 未识别到选项");
  if (hasDuplicateOptionKeys(normalizedOptions)) reviewReasons.push("题目 OCR 识别到重复选项");

  return {
    stem,
    options: normalizedOptions,
    requiresReview: reviewReasons.length > 0,
    reviewReasons,
  };
}

function expandParsedQuestionEntry(currentEntry, parsed) {
  const range = getSourceMissingQuestionRange(parsed.stem, currentEntry.questionNumber);
  if (!range) {
    return [{
      questionNumber: currentEntry.questionNumber,
      stem: parsed.stem,
      requiresReview: parsed.requiresReview,
      reviewReasons: parsed.reviewReasons,
    }];
  }

  const reviewReasons = [...new Set([...(parsed.reviewReasons || []), "原资料标注题目暂缺"])];
  const entries = [];
  for (let questionNumber = range.start; questionNumber <= range.end; questionNumber += 1) {
    entries.push({
      questionNumber,
      stem: `第${questionNumber}题暂缺`,
      requiresReview: true,
      reviewReasons,
    });
  }
  return entries;
}

function upsertQuestionEntry(byKey, candidate, { force = false } = {}) {
  const key = questionEntryKey(candidate);
  if (!key) return;
  const normalized = {
    ...candidate,
    stem: normalizeBodyText(candidate.stem),
    options: normalizeParsedOptions(candidate.options || []),
    reviewReasons: [...new Set(candidate.reviewReasons || [])],
  };
  const existing = byKey.get(key);
  if (!existing || force || questionEntryScore(normalized) > questionEntryScore(existing)) {
    byKey.set(key, normalized);
  }
}

function questionEntryKey(entry) {
  const key = entry?.examKey || sourceExamKey(entry?.examTitle || "");
  const questionNumber = Number(entry?.questionNumber || 0);
  return key && questionNumber ? `${key}::${questionNumber}` : "";
}

function questionEntryScore(entry) {
  if (!entry) return -Infinity;
  if (entry.sourceStatus === "source-missing") return -1000;
  const optionTextLength = (entry.options || [])
    .reduce((sum, option) => sum + Math.min(80, normalizeBodyText(option.text).length), 0);
  const stemLength = Math.min(240, normalizeBodyText(entry.stem).length);
  const reviewPenalty = entry.requiresReview ? 80 : 0;
  const optionPenalty = (entry.options || []).length < 2 && !isJudgementType(entry.section) ? 60 : 0;
  const noisePenalty = countLikelyNoiseCharacters(entry.stem) * 4;
  return stemLength + optionTextLength + (entry.options || []).length * 35 - reviewPenalty - optionPenalty - noisePenalty;
}

function countLikelyNoiseCharacters(text) {
  return (String(text || "").match(/[�◇◆□■●○]|[A-Za-z]{4,}/gu) || []).length;
}

function compareQuestionEntryOrder(left, right) {
  const pageDelta = Number(left.page || 0) - Number(right.page || 0);
  if (pageDelta) return pageDelta;
  const examDelta = String(left.examKey || "").localeCompare(String(right.examKey || ""));
  if (examDelta) return examDelta;
  return Number(left.questionNumber || 0) - Number(right.questionNumber || 0);
}

function normalizeManualCorrections(rawCorrections = []) {
  const corrections = Array.isArray(rawCorrections)
    ? rawCorrections
    : rawCorrections.questions || rawCorrections.corrections || [];
  return corrections.filter(Boolean);
}

function inferSourceStatus(correction) {
  const reasonText = (correction.reviewReasons || []).join(" ");
  const stem = normalizeBodyText(correction.stem || "");
  if (/跳号|暂缺|源题目缺失/u.test(`${reasonText} ${stem}`)) return "source-missing";
  return "recognized";
}

function sourceSlotStatus(entry) {
  if (entry.sourceStatus === "source-missing") return "source-missing";
  const reasonText = (entry.reviewReasons || []).join(" ");
  if (/原资料标注题目暂缺|题目 PDF 与答案 PDF 均跳号|源题目缺失/u.test(reasonText)) return "source-missing";
  return "recognized";
}

function readCorrectionsArray(rawCorrections = []) {
  return Array.isArray(rawCorrections)
    ? rawCorrections
    : rawCorrections.questions || rawCorrections.corrections || [];
}

function applyManualMergedCorrections(questions = [], corrections = []) {
  if (!corrections.length) return questions;
  const correctionIndex = new Map();
  corrections.forEach((correction) => {
    const key = mergedCorrectionKey(correction.id, correction.questionNumber);
    if (key) correctionIndex.set(key, correction);
  });

  return questions.map((question) => {
    const correction = correctionIndex.get(mergedCorrectionKey(question.id, question.ocr?.questionNumber));
    if (!correction) return question;

    const corrected = {
      ...question,
      options: applyOptionCorrections(question.options || [], correction.options || []),
      ocr: {
        ...(question.ocr || {}),
        manualCorrections: [
          ...(question.ocr?.manualCorrections || []),
          ...(correction.notes ? [correction.notes] : []),
        ].filter(Boolean),
      },
    };

    for (const replacement of correction.replacements || []) {
      const field = replacement.field || "explanation";
      corrected[field] = replaceText(corrected[field], replacement.from, replacement.to);
    }
    if (corrected.lesson) {
      corrected.lesson = { ...corrected.lesson };
      for (const replacement of correction.lessonReplacements || []) {
        const field = replacement.field || "studyPrompt";
        corrected.lesson[field] = replaceText(corrected.lesson[field], replacement.from, replacement.to);
      }
    }
    return corrected;
  });
}

function mergedCorrectionKey(id, questionNumber) {
  const normalizedId = String(id || "").trim();
  const normalizedQuestionNumber = Number(questionNumber || 0);
  return normalizedId && normalizedQuestionNumber ? `${normalizedId}::${normalizedQuestionNumber}` : "";
}

function applyOptionCorrections(options = [], corrections = []) {
  if (!corrections.length) return options;
  const byKey = new Map(corrections.map((option) => [String(option.key || "").trim().toUpperCase(), option]));
  return options.map((option) => {
    const correction = byKey.get(String(option.key || "").trim().toUpperCase());
    return correction ? { ...option, text: normalizeBodyText(correction.text || option.text) } : option;
  });
}

function replaceText(value, from, to) {
  if (!from) return value;
  return String(value || "").replaceAll(String(from), String(to || ""));
}

function normalizeKnownOcrTextDeep(value) {
  if (typeof value === "string") {
    return KNOWN_OCR_TEXT_REPLACEMENTS.reduce(
      (text, [from, to]) => text.replaceAll(from, to),
      value,
    );
  }
  if (Array.isArray(value)) return value.map((item) => normalizeKnownOcrTextDeep(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeKnownOcrTextDeep(item)]),
    );
  }
  return value;
}

function getSourceMissingQuestionRange(stem, expectedStart = null) {
  const normalized = normalizeBodyText(stem);
  const rangeMatch = normalized.match(/^第\s*(\d{1,3})\s*[-—－~～至]\s*(\d{1,3})\s*题\s*暂缺$/u);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (start > 0 && end >= start && end <= 100 && (expectedStart === null || start === Number(expectedStart))) {
      return { start, end };
    }
  }

  const singleMatch = normalized.match(/^第\s*(\d{1,3})\s*题\s*暂缺$/u);
  if (singleMatch) {
    const start = Number(singleMatch[1]);
    if (start > 0 && (expectedStart === null || start === Number(expectedStart))) return { start, end: start };
  }
  return null;
}

function splitEmbeddedExamTitleSegments(rawLine) {
  const line = normalizeBodyText(rawLine);
  if (!line) return [];

  const titleMatch = line.match(/(20\d{2}|19\d{2})\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*[-－]?\s*日.{0,100}?(?:教师|数师|救师).{0,30}?(?:招聘考试|考试|招考|真题|招聘)/u);
  if (!titleMatch) return [{ type: "text", text: line }];

  const titleEnd = getEmbeddedExamTitleEnd(line, titleMatch.index + titleMatch[0].length);
  const rawTitle = line.slice(titleMatch.index, titleEnd).trim();
  const title = detectExamTitle(rawTitle);
  if (!title) return [{ type: "text", text: line }];

  const before = line.slice(0, titleMatch.index).trim();
  const after = line.slice(titleEnd).trim();
  return [
    ...(before ? [{ type: "text", text: before }] : []),
    { type: "examTitle", text: title },
    ...(after ? [{ type: "text", text: after }] : []),
  ];
}

function getEmbeddedExamTitleEnd(line, baseEnd) {
  const rest = line.slice(baseEnd);
  const levelMatch = rest.match(/^\s*[（(]?(小学|初中|高中)[）)]?/u);
  return levelMatch ? baseEnd + levelMatch[0].length : baseEnd;
}

function splitAdjacentQuestionStartSegments(line) {
  const starts = [0];
  for (const match of line.matchAll(/\d{1,2}\s*[.．、，,]\s*/gu)) {
    if (match.index === 0) continue;
    const before = line.slice(Math.max(0, match.index - 3), match.index);
    const after = line.slice(match.index + match[0].length).trim();
    if (/[。））》】\]]$/.test(before.trim()) && /^[\u4e00-\u9fff（(《“"]/.test(after)) {
      starts.push(match.index);
    }
  }
  if (starts.length === 1) return [line];

  starts.push(line.length);
  return starts.slice(0, -1).map((start, index) =>
    normalizeBodyText(line.slice(start, starts[index + 1])),
  ).filter(Boolean);
}

function splitOptionSegments(line) {
  const optionPattern = /([A-H])\s*[.．、]\s*/g;
  const matches = [...line.matchAll(optionPattern)]
    .filter((match) => isLikelyOptionMarker(line, match.index));
  if (!matches.length) return [];

  return matches.map((match, index) => {
    const next = matches[index + 1];
    const rawPrefix = index === 0 ? line.slice(0, match.index) : "";
    return {
      key: match[1],
      prefix: cleanOptionPrefix(rawPrefix),
      text: normalizeBodyText(line.slice(match.index + match[0].length, next ? next.index : line.length)),
    };
  }).filter((segment) => segment.text || segment.prefix);
}

function matchQuestionStart(line) {
  const trimmed = normalizeBodyText(line)
    .replace(/^[\\\/|&~<《（(【\["'“”‘’.,，。:：;；VvXx]+/u, "")
    .trim();
  const sAsFiveMatch = trimmed.match(/^[Ss](\d{1,2})\s*[.．、，,]?\s*(.+)$/u);
  if (sAsFiveMatch) {
    const questionNumber = Number(`5${sAsFiveMatch[1]}`);
    const text = normalizeBodyText(sAsFiveMatch[2]);
    if (questionNumber >= 1 && questionNumber <= 90 && text) return { questionNumber, text };
  }

  const match = trimmed.match(/^(\d{1,3})(?:[iIlI])?\s*[.．、，,]?\s*(.+)$/u);
  if (!match) return null;

  const rawQuestionNumber = Number(match[1]);
  const questionNumber = rawQuestionNumber > 90 ? rawQuestionNumber % 100 : rawQuestionNumber;
  const text = normalizeBodyText(match[2]);
  if (questionNumber < 1 || questionNumber > 90 || !text) return null;
  return { questionNumber, text };
}

function isLikelyOptionMarker(line, index) {
  if (index === 0) return true;
  const before = line[index - 1];
  if (/[\s（(]/.test(before)) return true;
  return /[\u4e00-\u9fff\d）)]/.test(before);
}

function cleanOptionPrefix(text) {
  return normalizeBodyText(text.replace(/[（(]\s*$/u, ""));
}

function normalizeParsedOptions(options = []) {
  const byKey = new Map();
  options.forEach((option) => {
    const key = String(option.key || "").trim().toUpperCase();
    const text = normalizeBodyText(option.text || "");
    if (!OPTION_KEYS.includes(key) || !text) return;
    if (!byKey.has(key)) {
      byKey.set(key, { key, text });
    } else {
      byKey.get(key).text = appendText(byKey.get(key).text, text);
    }
  });
  return sortOptions([...byKey.values()]);
}

function sortOptions(options) {
  return [...options].sort((left, right) => OPTION_KEYS.indexOf(left.key) - OPTION_KEYS.indexOf(right.key));
}

function hasDuplicateOptionKeys(options = []) {
  return new Set(options.map((option) => option.key)).size !== options.length;
}

function answerEntryKey(question) {
  const title = question.ocr?.answerExamTitle || question.ocr?.examTitle || question.stem || "";
  const number = question.ocr?.questionNumber || inferQuestionNumber(question);
  const key = sourceExamKey(title);
  return key && number ? `${key}::${number}` : "";
}

function inferQuestionNumber(question) {
  const text = [question.stem, question.sourceRef, question.lesson?.title].filter(Boolean).join(" ");
  const match = text.match(/第\s*(\d{1,3})\s*题/u);
  return match ? Number(match[1]) : 0;
}

function detectExamTitle(line) {
  const normalized = normalizeBodyText(line);
  return detectExamTitleLine(normalized);
}

function detectSection(line) {
  const normalized = normalizeBodyText(line);
  if (/单项|单选|羊项|单顷/u.test(normalized)) return "单项选择题";
  if (/多项|多选|多顷/u.test(normalized)) return "多项选择题";
  if (/判断|是非/u.test(normalized)) return "判断题";
  if (/填空/u.test(normalized)) return "填空题";
  if (/简答/u.test(normalized)) return "简答题";
  if (/论述/u.test(normalized)) return "论述题";
  if (/案例/u.test(normalized)) return "案例分析题";
  return "";
}

function isJudgementType(type = "") {
  return /判断|是非/u.test(type);
}

function getPageLines(page) {
  if (Array.isArray(page.lines) && page.lines.length) {
    return page.lines.map((line) => line.text || "");
  }
  return String(page.text || "").split(/\n+/u);
}

function cleanLine(line) {
  const normalized = normalizeBodyText(line);
  if (!normalized) return "";
  if (HEADER_PATTERNS.some((pattern) => pattern.test(normalized))) return "";
  return normalized;
}

function normalizeBodyText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[　]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([，。；：？！、）》】])/gu, "$1")
    .replace(/([（《【])\s+/gu, "$1")
    .trim();
}

function appendText(left, right) {
  const first = normalizeBodyText(left);
  const second = normalizeBodyText(right);
  if (!first) return second;
  if (!second) return first;
  if (/[A-Za-z0-9]$/.test(first) && /^[A-Za-z0-9]/.test(second)) return `${first} ${second}`;
  return `${first}${second}`;
}

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\n+/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function readJsonIfExists(filePath, fallback = []) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getPageNumber(imagePath, fallback) {
  const match = String(imagePath || "").match(/page-(\d+)\.png$/u);
  return match ? Number(match[1]) : fallback + 1;
}

function main() {
  const questionOcrPath = process.argv[2] || DEFAULT_QUESTION_OCR;
  const answerBankPath = process.argv[3] || DEFAULT_ANSWER_BANK;
  const outputPath = process.argv[4] || DEFAULT_OUTPUT;
  const questionPages = readJsonl(questionOcrPath);
  const questionPageSources = [
    { label: questionOcrPath === DEFAULT_QUESTION_OCR ? "2x" : path.basename(questionOcrPath), path: questionOcrPath, pages: questionPages },
  ];
  if (questionOcrPath === DEFAULT_QUESTION_OCR && fs.existsSync(DEFAULT_QUESTION_OCR_3X)) {
    questionPageSources.push({ label: "3x", path: DEFAULT_QUESTION_OCR_3X, pages: readJsonl(DEFAULT_QUESTION_OCR_3X) });
  }
  const manualCorrections = readJsonIfExists(DEFAULT_MANUAL_CORRECTIONS, []);
  const answerCorrections = readJsonIfExists(DEFAULT_ANSWER_CORRECTIONS, []);
  const answerPayload = JSON.parse(fs.readFileSync(answerBankPath, "utf8"));
  const { questionBankPayload: payload, sourceSlotPayload } = buildQuestionBankArtifacts({
    questionPages,
    questionPageSources,
    answerPayload,
    manualCorrections,
    answerCorrections,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  if (outputPath === DEFAULT_OUTPUT) {
    fs.writeFileSync(DEFAULT_SOURCE_SLOTS_OUTPUT, `${JSON.stringify(sourceSlotPayload, null, 2)}\n`);
  }
  console.log(`Parsed ${payload.ocr.parsedQuestionCount} original questions from ${questionOcrPath}`);
  console.log(`Detected ${payload.ocr.sourceExamCount} source exams / ${payload.ocr.sourceTotalQuestionSlots} source question slots`);
  console.log(`Recognized ${payload.ocr.recognizedSourceSlotCount} source slots; ${payload.ocr.sourceMissingSlotCount} source slots are marked missing in the source material; ${payload.ocr.unmatchedSourceSlotCount} remain unmatched`);
  console.log(`Merged ${payload.ocr.mergedQuestionCount}/${payload.ocr.answerQuestionCount} answer entries`);
  console.log(`${payload.ocr.reviewQuestionCount} merged questions require OCR review`);
  if (outputPath === DEFAULT_OUTPUT) console.log(`Wrote ${DEFAULT_SOURCE_SLOTS_OUTPUT}`);
  console.log(`Wrote ${outputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
