import fs from "node:fs";
import zlib from "node:zlib";
import {
  browserRuntimeQuestionIndexSourceType,
  browserRuntimeQuestionBankSourceType,
  parseQuestionImport,
  summarizeQuestionBank,
} from "../core.js";

const DEFAULT_QUESTION_BANK = "data/questions.from-pdf.json";
const DEFAULT_CLASSIFICATION_AUDIT = "data/question-classification.audit.json";
const DEFAULT_OUTPUT = "data/questions.runtime.json";
const DEFAULT_INDEX_OUTPUT = "data/question-index.json";
const DEFAULT_CHUNK_DIR = "data/question-chunks";
const DEFAULT_CHUNK_SIZE = 80;

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
const runtimeIndexQuestionSchema = [
  "id",
  "sourceId",
  "bankIndex",
  "year",
  "type",
  "topic",
  "difficulty",
  "enemy",
  "concept",
  "dependencies",
  "errorPatterns",
  "chapterMechanic",
  "qualityStatus",
  "gameplayStatus",
  "lesson",
  "chunkId",
];
const runtimeIndexLessonSchema = ["id"];

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

export function buildRuntimeQuestionIndexArtifacts(questionBankPayload, classificationAudit, options = {}) {
  const chunkSize = Math.max(1, Number(options.chunkSize || DEFAULT_CHUNK_SIZE));
  const chunkDir = options.chunkDir || DEFAULT_CHUNK_DIR;
  const preparedQuestions = parseQuestionImport(questionBankPayload, { classificationAudit });
  const chunks = [];
  const questions = [];

  for (let index = 0; index < preparedQuestions.length; index += chunkSize) {
    const chunkQuestions = preparedQuestions.slice(index, index + chunkSize);
    const chunkNumber = chunks.length + 1;
    const id = `chunk-${String(chunkNumber).padStart(4, "0")}`;
    const url = `${chunkDir}/${id}.json`;
    const chunkPayload = {
      sourceType: browserRuntimeQuestionBankSourceType,
      runtime: {
        prepared: true,
        formatVersion: 1,
        encoding: "schema-array",
        questionSchema: runtimeQuestionSchema,
        optionSchema: runtimeOptionSchema,
        lessonSchema: runtimeLessonSchema,
      },
      chunk: {
        id,
        count: chunkQuestions.length,
      },
      questions: chunkQuestions.map(toRuntimeQuestionRecord),
    };

    chunks.push({
      id,
      url,
      compressedUrl: `${url}.gz`,
      count: chunkQuestions.length,
    });
    questions.push(...chunkQuestions.map((question) => toRuntimeQuestionIndexRecord(question, id)));
  }

  return {
    indexPayload: {
      sourceType: browserRuntimeQuestionIndexSourceType,
      runtime: {
        prepared: true,
        formatVersion: 1,
        encoding: "schema-array",
        questionSchema: runtimeIndexQuestionSchema,
        lessonSchema: runtimeIndexLessonSchema,
      },
      summary: summarizeQuestionBank(questionBankPayload, { classificationAudit }),
      chunks,
      questions,
    },
    chunkPayloads: chunks.map((chunk) => ({
      id: chunk.id,
      url: chunk.url,
      payload: {
        sourceType: browserRuntimeQuestionBankSourceType,
        runtime: {
          prepared: true,
          formatVersion: 1,
          encoding: "schema-array",
          questionSchema: runtimeQuestionSchema,
          optionSchema: runtimeOptionSchema,
          lessonSchema: runtimeLessonSchema,
        },
        chunk: {
          id: chunk.id,
          count: chunk.count,
        },
        questions: preparedQuestions
          .slice((Number(chunk.id.slice("chunk-".length)) - 1) * chunkSize, (Number(chunk.id.slice("chunk-".length)) - 1) * chunkSize + chunk.count)
          .map(toRuntimeQuestionRecord),
      },
    })),
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

function toRuntimeQuestionIndexRecord(question, chunkId) {
  const runtimeQuestion = {
    ...question,
    dependencies: [...(question.dependencies || [])],
    errorPatterns: [...(question.errorPatterns || [])],
    lesson: [
      question.lesson?.id || `lesson-${question.id}`,
    ],
    chunkId,
  };

  return runtimeIndexQuestionSchema.map((field) => runtimeQuestion[field]);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonAndGzip(outputPath, payload) {
  const payloadText = `${JSON.stringify(payload)}\n`;
  fs.writeFileSync(outputPath, payloadText);
  fs.writeFileSync(`${outputPath}.gz`, zlib.gzipSync(payloadText, { level: 9, mtime: 0 }));
  return payloadText;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const questionBankPath = process.argv[2] || DEFAULT_QUESTION_BANK;
  const classificationAuditPath = process.argv[3] || DEFAULT_CLASSIFICATION_AUDIT;
  const outputPath = process.argv[4] || DEFAULT_OUTPUT;
  const questionBankPayload = readJson(questionBankPath);
  const classificationAudit = readJson(classificationAuditPath);
  const payload = buildRuntimeQuestionBankPayload(questionBankPayload, classificationAudit);
  const { indexPayload, chunkPayloads } = buildRuntimeQuestionIndexArtifacts(questionBankPayload, classificationAudit);

  writeJsonAndGzip(outputPath, payload);
  writeJsonAndGzip(DEFAULT_INDEX_OUTPUT, indexPayload);
  fs.rmSync(DEFAULT_CHUNK_DIR, { recursive: true, force: true });
  fs.mkdirSync(DEFAULT_CHUNK_DIR, { recursive: true });
  chunkPayloads.forEach((chunk) => {
    writeJsonAndGzip(chunk.url, chunk.payload);
  });

  console.log(`Wrote ${payload.questions.length} runtime questions to ${outputPath}`);
  console.log(`Wrote compressed runtime question bank to ${outputPath}.gz`);
  console.log(`Wrote ${indexPayload.questions.length} index questions to ${DEFAULT_INDEX_OUTPUT}`);
  console.log(`Wrote ${chunkPayloads.length} lazy question chunks to ${DEFAULT_CHUNK_DIR}`);
}
