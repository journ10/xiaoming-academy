# 小明书院：文字巡游 — 内容接入规范

> 文档定位：题库格式、导入规则、校验规则的唯一说明。内容生产团队和游戏开发团队共用此文档。
> 当前状态：真实题库已接入（4077 题，来自 2 份 PDF 的 OCR）。

---

## 1. 当前题库

### 1.1 真实题库来源

| 属性 | 值 |
|---|---|
| 文件 | `data/questions.from-pdf.json` |
| 题目数 | 4,077 |
| 来源 | 2 份 PDF 的 OCR 合并：《历年真题》+《历年真题答案》 |
| 年份范围 | 2012 — 2025 |
| 主题数 | 7（含"综合知识"） |
| 题型数 | 6 |
| 需复核 | 2,328 题（`ocr.requiresReview`） |

### 1.2 主题分布

| 主题 | 题数 | 对应章节 | 心法 | 心魔 |
|---|---|---|---|---|
| 综合知识 | 998 | — | 研习心法 | 研习心魔 |
| 教育心理学 | 868 | 第二章 观心花园 | 观心心法 | 观心心魔 |
| 教学设计 | 811 | 第三章 授业工坊 | 授业心法 | 授业心魔 |
| 教育法规 | 649 | 第一章 律令花窗 | 律令心法 | 律令心魔 |
| 班级管理 | 367 | 第五章 统御回廊 | 统御心法 | 统御心魔 |
| 儿童发展 | 260 | 第六章 童心星谷 | 童心心法 | 童心心魔 |
| 教师职业道德 | 124 | 第四章 师德星廊 | 师德心法 | 师德心魔 |

### 1.3 题型分布

| 题型 | 题数 | 说明 |
|---|---|---|
| 判断题 | 1,269 | 答案为 A/B（正确/错误） |
| 单项选择题 | 1,117 | 4 选项 |
| 多项选择题 | 979 | 多个正确答案 |
| 案例分析题 | 468 | 材料+问题 |
| 论述题 | 233 | 开放式 |
| 填空题 | 11 | 少量 |

---

## 2. 题库格式

### 2.1 导入格式

页面右上角提供 JSON 导入入口（HUD 操作区）。支持两种格式：

```json
// 格式A：题目数组
[
  { /* 题目对象 */ },
  { /* 题目对象 */ }
]
```

```json
// 格式B：包含 questions 的对象
{
  "questions": [
    { /* 题目对象 */ },
    { /* 题目对象 */ }
  ]
}
```

### 2.2 单题字段

```json
{
  "id": "pdf-0001",
  "year": "2013",
  "type": "单项选择题",
  "topic": "教育法规",
  "stem": "题干文本",
  "options": [
    { "key": "A", "text": "选项 A" },
    { "key": "B", "text": "选项 B" },
    { "key": "C", "text": "选项 C" },
    { "key": "D", "text": "选项 D" }
  ],
  "answer": "B",
  "explanation": "讲解文本，包含题眼和解析",
  "sourceRef": "讲解来源",
  "difficulty": 1,
  "lesson": {
    "title": "教育法规 · 第 1 题解析",
    "sourceRef": "题目 PDF OCR 第 1 页",
    "keyPoint": "教育法",
    "studyPrompt": "练功目标：先核对 OCR 原文，再记住本题解析中的题眼。"
  },
  "ocr": {
    "sourcePage": 1,
    "printedPage": "3",
    "examTitle": "2013年1月12日深圳事业单位教师招聘考试（小学）",
    "requiresReview": false,
    "reviewReasons": []
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 否 | 唯一标识符，缺省自动生成 |
| `year` | string | 否 | 年份 |
| `type` | string | 否 | 题型 |
| `topic` | string | **是** | 主题，决定所属章节和心法 |
| `stem` | string | **是** | 题干文本 |
| `options` | array | **是** | 选项数组，至少 2 个 |
| `answer` | string | **是** | 答案。多选题写连续字母如"ABC" |
| `explanation` | string | 否 | 解析文本，缺省时从解析自动提取题眼 |
| `sourceRef` | string | 否 | 讲解来源标注 |
| `difficulty` | number | 否 | 1-5，缺省自动推断 |
| `lesson` | object | 否 | 练功数据，缺省时从 explanation 自动生成 |
| `ocr` | object | 否 | OCR 元数据（`requiresReview` 标记复核题） |

### 2.3 自动推断字段

以下字段如缺失，由 `core.js` 的 `prepareQuestions()` 自动推断：

| 字段 | 推断来源 | 规则 |
|---|---|---|
| `enemy` | `topic` | 按主题映射到心魔名称 |
| `realm` | `year` + `topic` | "年份 + 主题秘境名" |
| `heartMethod` | `topic` | 按主题映射到心法名称 |
| `difficulty` | `type` | 多选/案例=3，判断=1，单选=2，论述=4，填空=5 |
| `lesson.id` | `question.id` | `lesson-${id}` |
| `lesson.title` | `topic` + `year` | "主题 · 年份讲解" |
| `lesson.keyPoint` | `explanation` | 正则提取"题眼是..."，或取首句前 36 字 |
| `lesson.studyPrompt` | `keyPoint` | "练功目标：先记住"XX"，再用战斗检验。" |

**主题映射表（硬编码在 `core.js` 的 `getTopicProfile` 中）：**

| 主题 | 心法 | 心魔 | 秘境名 |
|---|---|---|---|
| 教育法规 | 律令心法 | 律令心魔 | 入门秘境 |
| 教育心理学 | 观心心法 | 观心心魔 | 观心林 |
| 教学设计 | 授业心法 | 授业心魔 | 授业工坊 |
| 教师职业道德 | 师德心法 | 师德心魔 | 师德试炼 |
| 班级管理 | 统御心法 | 统御心魔 | 统御迷阵 |
| 儿童发展 | 童心心法 | 童心心魔 | 童心谷 |
| 综合知识 | 研习心法 | 研习心魔 | 综合秘境 |
| 其他 | 研习心法 | 研习心魔 | 综合秘境 |

---

## 3. 导入校验

**导入时拒绝的题目（`core.js` 的 `validateImportedQuestion`）：**
- 缺少 `stem`（题干）
- 缺少 `topic`（主题）
- 缺少 `answer`（答案）
- 选项少于 2 个
- 答案包含不存在的选项

**导入时清理的旧记录（`core.js` 的 `prunePlayerForQuestions`）：**
- 不在新题库中的旧练功记录
- 不在新题库中的旧错题心魔
- 不在新题库中的旧净化记录
- 旧章节通关状态（按新题库重新计算）

---

## 4. OCR 元数据与复核机制

### 4.1 OCR 字段

真实题库中的 `ocr` 对象包含：

| 字段 | 说明 |
|---|---|
| `sourcePage` | OCR 源页码 |
| `printedPage` | PDF 印刷页码 |
| `examTitle` | 考试名称 |
| `questionNumber` | 题号 |
| `pageAvgConfidence` | 页面平均置信度 |
| `pageMinConfidence` | 页面最低置信度 |
| `requiresReview` | 是否需要人工复核 |
| `reviewReasons` | 复核原因列表 |

### 4.2 复核规则

- `ocr.requiresReview = true` 的条目需人工复核
- 复核内容：题干完整性、选项正确性、答案准确性、解析可读性
- 复核通过后，将 `requiresReview` 设为 `false`
- 复核不通过：修正错误或删除题目

### 4.3 OCR 源文件

| 文件 | 说明 |
|---|---|
| `data/pdf-ocr-pages.jsonl` | 答案解析 PDF 的 512 页 OCR 原始数据 |
| `data/question-ocr-pages.jsonl` | 题目 PDF 的 465 页 OCR 原始数据 |
| `data/pdf-ocr-sample.json` | 早期样本（仅参考） |

---

## 5. 代码加载流程

```
app.js 启动
    ↓ fetch("./data/questions.from-pdf.json")
    ↓ parseQuestionImport(json)
    ↓ prepareQuestions(rawQuestions)
    ↓ createStoryChapters(questions)
    ↓ 渲染到页面
```

**备用机制：** 若真实题库加载失败，页面显示错误提示，玩家可手动导入 JSON 文件。

---

*版本：v3.1 | 真实题库已接入（4077 题） | 基于 core.js parseQuestionImport + prepareQuestions 提取*
