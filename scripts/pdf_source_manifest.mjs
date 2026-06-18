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

export function buildExamManifestFromQuestionPages(pages = []) {
  const sortedPages = [...pages].sort((left, right) => getPageNumber(left.image, 0) - getPageNumber(right.image, 0));
  const starts = [];

  sortedPages.forEach((page, pageIndex) => {
    const pageNumber = getPageNumber(page.image, pageIndex);
    for (const rawLine of getPageLines(page)) {
      const title = detectExamTitleLine(rawLine);
      if (title) starts.push({ title, examKey: examKey(title), startPage: pageNumber });
    }
  });

  return starts
    .filter((exam) => exam.examKey)
    .map((exam, index) => ({
      ...exam,
      endPage: index < starts.length - 1 ? starts[index + 1].startPage : sortedPages.length,
      expectedQuestionCount: QUESTIONS_PER_EXAM,
    }));
}

export function getTotalExpectedQuestionSlots(manifest = []) {
  return manifest.reduce((sum, exam) => sum + Number(exam.expectedQuestionCount || 0), 0);
}

function getPageLines(page) {
  if (Array.isArray(page.lines) && page.lines.length) {
    return page.lines.map((line) => line.text || "");
  }
  return String(page.text || "").split(/\n+/u);
}

function getPageNumber(imagePath, fallback) {
  const match = String(imagePath || "").match(/page-(\d+)\.png$/u);
  return match ? Number(match[1]) : fallback + 1;
}
