# 小明书院：真题题阵

一个无后端、无外部依赖的浏览器备考学习游戏。

当前产品定位是文字版真题答题游戏：玩家从开局台进入 5 题题阵，保留历年真题的原题干、原选项和原作答结构，通过流派、破招、题眼短课、心魔和学习报告完成短局复盘。

## 运行

```bash
cd /Users/wangzexu/Documents/Codex/academy
npm run start
```

浏览器打开：

```text
http://localhost:4190
```

## 测试

```bash
npm test
```

运行时代码变更后需要按项目要求运行完整测试。文档变更通常不需要启动本地服务。

## 当前玩法

- 第一屏是开局台，系统直接推荐本局目标。
- 一局题阵固定 5 道真题。
- 题干、选项和答案结构保持历年真题原貌。
- 玩家按原选项作答，单选、多选、判断等结构不被改写。
- 流派是局前学习策略：稳修、突击、复盘。
- 破招是每题前的轻策略：稳破、强攻、观照。
- 答后展示题眼短课，解释考点、题眼和错因。
- 答错会生成或强化心魔。
- 学习报告会总结本局目标、主要错因和下一局建议。

## 主要文档

- `docs/01-game-overview.md`：当前游戏形态总纲。
- `docs/02-text-feedback.md`：文字反馈与题眼短课规范。
- `docs/03-gameplay-systems.md`：玩法系统文档。
- `docs/04-ui-spec.md`：文字版 UI 规范。
- `docs/05-art-assets.md`：文字视觉规范。
- `docs/06-content-pipeline.md`：内容与题库规范。
- `docs/07-product-acceptance.md`：产品验收口径。
- `docs/08-verification-report.md`：验证记录与检查清单。
- `docs/manual-classification-review.md`：人工复核清单。

## 内容与题库

当前主要数据产物：

- `data/questions.from-pdf.json`：从 PDF 抽取的题库。
- `data/questions.runtime.json`：运行时题库。
- `data/question-classification.audit.json`：重新分类审计。
- `data/manual-classification-review.json`：待人工归类题清单。

运行时使用六个学习域：

- 学习心理与认知机制。
- 教育学原理、课程与教学。
- 教育法律法规与政策制度。
- 德育、班级管理与家校协同。
- 学生身心发展与个体差异。
- 教师职业素养与专业规范。

待人工归类题保留在复核清单中，不进入系统推荐题阵。

## 题库格式

页面保留 JSON 导入入口。格式支持：

```json
{
  "questions": []
}
```

或直接使用题目数组：

```json
[]
```

单题字段：

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
  "sourceRef": "讲解来源",
  "difficulty": 2
}
```

多选题的 `answer` 写连续字母，例如 `ABC`。
