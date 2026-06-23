import fs from "node:fs";
import {
  browserRuntimeQuestionBankSourceType,
  parseQuestionImport,
  summarizeQuestionBank,
} from "../core.js";

const DEFAULT_QUESTION_BANK = "data/questions.from-pdf.json";
const DEFAULT_CLASSIFICATION_AUDIT = "data/question-classification.audit.json";
const DEFAULT_OUTPUT = "data/questions.runtime.json";

const runtimeQuestionSchema = [
  "id",
  "sourceId",
  "bankIndex",
  "year",
  "type",
  "topic",
  "stem",
  "options",
  "answer",
  "difficulty",
  "realm",
  "enemy",
  "heartMethod",
  "concept",
  "dependencies",
  "errorPatterns",
  "chapterMechanic",
  "qualityStatus",
  "gameplayStatus",
  "lesson",
];
const runtimeOptionSchema = ["key", "text"];
const runtimeLessonSchema = ["id", "title", "keyPoint", "explanation", "studyPrompt"];

export function buildRuntimeQuestionBankPayload(questionBankPayload, classificationAudit) {
  const questions = parseQuestionImport(questionBankPayload, { classificationAudit })
    .map(toRuntimeQuestionRecord);

  return {
    sourceType: browserRuntimeQuestionBankSourceType,
    runtime: {
      prepared: true,
      formatVersion: 1,
      encoding: "schema-array",
      questionSchema: runtimeQuestionSchema,
      optionSchema: runtimeOptionSchema,
      lessonSchema: runtimeLessonSchema,
    },
    summary: summarizeQuestionBank(questionBankPayload, { classificationAudit }),
    questions,
  };
}

function toRuntimeQuestionRecord(question) {
  const runtimeQuestion = {
    ...question,
    options: (question.options || []).map((option) => [option.key, option.text]),
    dependencies: [...(question.dependencies || [])],
    errorPatterns: [...(question.errorPatterns || [])],
    lesson: [
      question.lesson?.id || `lesson-${question.id}`,
      question.lesson?.title || `${question.topic} · ${question.year}讲解`,
      question.lesson?.keyPoint || question.concept || question.topic,
      question.lesson?.explanation || question.explanation,
      question.lesson?.studyPrompt || "",
    ],
  };

  return runtimeQuestionSchema.map((field) => runtimeQuestion[field]);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const questionBankPath = process.argv[2] || DEFAULT_QUESTION_BANK;
  const classificationAuditPath = process.argv[3] || DEFAULT_CLASSIFICATION_AUDIT;
  const outputPath = process.argv[4] || DEFAULT_OUTPUT;
  const payload = buildRuntimeQuestionBankPayload(
    readJson(questionBankPath),
    readJson(classificationAuditPath),
  );

  fs.writeFileSync(outputPath, `${JSON.stringify(payload)}\n`);
  console.log(`Wrote ${payload.questions.length} runtime questions to ${outputPath}`);
}
