import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error("Usage: node scripts/ocr_pdf_in_batches.mjs INPUT.pdf OUTPUT.jsonl --page-count N [--scale 3] [--batch-size 20] [--work-dir tmp/pdfs/ocr-batches]");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) usage();

const inputPdf = args[0];
const outputJsonl = args[1];
let pageCount = 0;
let scale = "3";
let batchSize = 20;
let workDir = "tmp/pdfs/ocr-batches";

for (let index = 2; index < args.length; index += 1) {
  const arg = args[index];
  const value = args[index + 1];
  if (arg === "--page-count") {
    pageCount = Number(value);
    index += 1;
  } else if (arg === "--scale") {
    scale = value;
    index += 1;
  } else if (arg === "--batch-size") {
    batchSize = Number(value);
    index += 1;
  } else if (arg === "--work-dir") {
    workDir = value;
    index += 1;
  } else {
    usage();
  }
}

if (!pageCount || pageCount < 1 || !batchSize || batchSize < 1) usage();

const env = {
  ...process.env,
  CLANG_MODULE_CACHE_PATH: "tmp/clang-cache",
};
const swiftArgs = ["-module-cache-path", "tmp/swift-cache"];

fs.mkdirSync(path.dirname(outputJsonl), { recursive: true });
fs.writeFileSync(outputJsonl, "");
fs.rmSync(workDir, { recursive: true, force: true });
fs.mkdirSync(workDir, { recursive: true });

for (let start = 1; start <= pageCount; start += batchSize) {
  const end = Math.min(pageCount, start + batchSize - 1);
  const batchDir = path.join(workDir, `pages-${String(start).padStart(3, "0")}-${String(end).padStart(3, "0")}`);
  const batchJsonl = path.join(workDir, `ocr-${String(start).padStart(3, "0")}-${String(end).padStart(3, "0")}.jsonl`);
  fs.rmSync(batchDir, { recursive: true, force: true });
  fs.mkdirSync(batchDir, { recursive: true });

  console.error(`Batch ${start}-${end}: render`);
  execFileSync("swift", [
    ...swiftArgs,
    "scripts/render_pdf_pages.swift",
    inputPdf,
    batchDir,
    "--scale",
    scale,
    "--pages",
    `${start}-${end}`,
  ], { stdio: "inherit", env });

  console.error(`Batch ${start}-${end}: OCR`);
  execFileSync("swift", [
    ...swiftArgs,
    "scripts/ocr_image_vision.swift",
    "--output",
    batchJsonl,
    "--input-dir",
    batchDir,
  ], { stdio: "inherit", env });

  fs.appendFileSync(outputJsonl, fs.readFileSync(batchJsonl, "utf8"));
  fs.rmSync(batchDir, { recursive: true, force: true });
  fs.rmSync(batchJsonl, { force: true });
}

fs.rmSync(workDir, { recursive: true, force: true });
console.log(`Wrote OCR JSONL: ${outputJsonl}`);
