# 小明书院：秘卷巡游 — 内容接入规范

> 当前基准：PDF 题源和分类审计是学习游戏的内容底座。运行时使用六个真实学习域；旧 `topic: "综合知识"` 只代表历史导入兜底桶，不再作为章节或正式学习域。

## 1. 题库口径

| 属性 | 值 |
|---|---|
| 题库文件 | `data/questions.from-pdf.json` |
| 题目 PDF | `docs/09小明课堂 历年真题.pdf` |
| 答案 PDF | `docs/10小明课堂 《历年真题答案》.pdf` |
| PDF 源题位 | 4680 |
| 当前可玩题 | 4374 |
| 未合并源题位 | 306 |
| 待人工归类 | 114 |
| 分类审计 | `data/question-classification.audit.json` |
| 人工复核清单 | `docs/manual-classification-review.md` |

## 2. 重新分类结果

| 学习域 | 题数 | 用途 |
|---|---:|---|
| 学习心理与认知机制 | 1144 | 概念辨析、学习理论、认知规律 |
| 教育学原理、课程与教学 | 990 | 教育原理、课程、教学设计与评价 |
| 教育法律法规与政策制度 | 768 | 法规、政策、权利义务 |
| 德育、班级管理与家校协同 | 638 | 班级管理、德育、家校沟通 |
| 学生身心发展与个体差异 | 507 | 儿童发展、差异、特殊需要 |
| 教师职业素养与专业规范 | 213 | 师德、教师素养、专业行为 |
| 待人工归类 | 114 | 需人工回 PDF 判定 |

质量状态：

| 状态 | 题数 |
|---|---:|
| clean | 1885 |
| needs_review | 1324 |
| usable_with_caution | 1165 |

置信度：

| 置信度 | 题数 |
|---|---:|
| high | 1999 |
| medium | 1387 |
| low | 988 |

## 3. 旧主题处理规则

`data/questions.from-pdf.json` 中仍保留旧 `topic` 字段，原因是运行时和历史数据需要兼容。但新系统不得直接把旧主题作为真实分类。

处理规则：

1. 游戏推荐、报告和后续内容生产优先使用 `data/question-classification.audit.json` 的 `primaryDomain`。
2. `综合知识` 不进入章节、模式或知识域命名。
3. `待人工归类` 不进入正式推荐题池，除非用户导入或人工确认。
4. 旧 `topic` 仅可作为来源追踪和兼容字段。

旧 `综合知识` 拆分结果：

| 新学习域 | 来自旧综合知识的题数 |
|---|---:|
| 学习心理与认知机制 | 261 |
| 德育、班级管理与家校协同 | 215 |
| 教育学原理、课程与教学 | 209 |
| 学生身心发展与个体差异 | 147 |
| 教育法律法规与政策制度 | 68 |
| 教师职业素养与专业规范 | 52 |
| 待人工归类 | 114 |

## 4. 人工归类清单

114 道待人工归类题必须保留可定位信息：

- `bankIndex`
- `sourceId`
- `year`
- `type`
- `examTitle`
- `questionNumber`
- `questionPdfPage`
- `answerPdfPage`
- `stemExcerpt`
- `reviewReasons`

人工处理流程：

1. 打开 `docs/manual-classification-review.md`。
2. 根据题目 PDF 页码和答案 PDF 页码核对原题与解析。
3. 判定 `primaryDomain`。
4. 如题干或解析 OCR 不可信，先修正文案，再更新分类。
5. 更新后重新生成 `data/question-classification.audit.json`。

## 5. 题库字段

运行时兼容格式：

```json
{
  "id": "pdf-0001",
  "year": "2013",
  "type": "单项选择题",
  "topic": "教育法规",
  "stem": "题干文本",
  "options": [
    { "key": "A", "text": "选项 A" }
  ],
  "answer": "A",
  "explanation": "解析文本",
  "sourceRef": "题目 PDF OCR 第 x 页；答案 PDF OCR 第 y 页",
  "difficulty": 2,
  "ocr": {
    "requiresReview": false,
    "examTitle": "考试名称"
  }
}
```

分类审计字段：

```json
{
  "classificationKey": "pdf-0001#0",
  "primaryDomain": "教育法律法规与政策制度",
  "classificationConfidence": "high",
  "qualityStatus": "clean",
  "reviewReasons": []
}
```

## 6. 与 Roguelite 玩法的关系

| 内容数据 | 玩法用途 |
|---|---|
| primaryDomain | 探索局题池、报告学习域 |
| classificationConfidence | 是否进入正式推荐 |
| qualityStatus | 是否需要人工复核 |
| reviewReasons | 内容生产任务，不直接显示给玩家 |
| old topic | 兼容和追踪 |
| error pattern | 心魔错因推断 |

选题时：

- 探索局优先 clean / usable_with_caution 且非待人工归类题。
- 净化局优先玩家已答错题，不因旧主题阻断。
- 冲刺局从多个 primaryDomain 混合抽题。
- 待人工归类题默认不自动推荐。

## 7. 内容生产优先级

| 优先级 | 任务 | 说明 |
|---|---|---|
| P0 | 保持 4374 道可玩题可加载 | 不能破坏运行时 |
| P1 | 人工处理 114 道待归类题 | 用户已明确需要人工位置清单 |
| P2 | 修正 low confidence 题 | 优先影响正式推荐的题 |
| P3 | 标注错因和相似概念 | 提升心魔诊断质量 |
| P4 | 追踪 306 个未合并源题位 | 只在题干和答案均确认后补入 |

---

*版本：Roguelite 内容基准 | 4680 源题位 / 4374 可玩题 / 6 学习域 + 114 待人工归类*
