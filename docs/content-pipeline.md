# 内容接入说明

当前优先级是游戏本体可玩，PDF/OCR 不阻塞主循环。

## 当前可用入口

- 页面右上角可以导入 JSON。
- 导入数据必须是题目数组，或包含 `questions` 数组的对象。
- 导入后会自动清理不属于新题库的旧练功记录、错题、心魔和净化记录。
- 缺少 `stem`、`topic`、`answer` 或少于 2 个选项的题目会被拒绝。

## 单题格式

```json
{
  "id": "question-001",
  "year": "2026",
  "type": "单项选择",
  "topic": "教育法规",
  "stem": "题干文本",
  "options": [
    { "key": "A", "text": "选项 A" },
    { "key": "B", "text": "选项 B" }
  ],
  "answer": "B",
  "explanation": "讲解文本",
  "sourceRef": "人工清洗 JSON",
  "difficulty": 2,
  "lesson": {
    "title": "讲解标题",
    "sourceRef": "讲解来源",
    "keyPoint": "题眼关键词",
    "studyPrompt": "练功目标"
  }
}
```

`lesson` 是可选字段。缺省时游戏会从 `explanation` 自动生成练功卷。

## PDF/OCR 当前产物

- `data/pdf-ocr-pages.jsonl`：512 页扫描图的逐页 Vision OCR 原文，保留页面图路径、整页文本、行文本、行框和置信度。
- `data/questions.from-pdf.json`：按项目导入格式生成的“答案回忆/解析题”JSON，可直接通过页面右上角导入。
- `data/pdf-ocr-sample.json`：早期第 1 页样本，仅保留接入示例，不再代表全量结果。

注意：`docs/10小明课堂 《历年真题答案》.pdf` 是无文本层扫描版答案解析页，主要包含参考答案与解析，不包含完整原题选项。全量导入文件不会补造原题，只把解析页转换成“第 N 题参考答案是？”这类可玩题。`ocr.requiresReview=true` 的条目需要按原页图人工复核后再作为正式题库使用。

## PDF/OCR 复跑顺序

1. 从 `docs/10小明课堂 《历年真题答案》.pdf` 渲染页面。
2. 对渲染图做 OCR，保留页码、行文本和置信度。
3. 运行转换脚本生成题库 JSON：

```bash
node scripts/build_questions_from_pdf_ocr.mjs data/pdf-ocr-pages.jsonl data/questions.from-pdf.json
```

4. 人工复核 `ocr.requiresReview=true` 的条目，必要时修正答案、解析、主题和题眼。
5. 在页面导入 JSON，检查练功卷和战斗题阵是否正常。

`data/pdf-ocr-sample.json` 只是现有扫描版答案解析页的样本，不代表完整题库已经结构化。
