# 小明书院：文字巡游 — 实施路线图

> 文档定位：基于当前实际代码状态的任务清单和演进计划。当前代码已可运行，文档描述现有架构和下一步优化方向。

---

## 1. 当前文件结构

```
academy/
├── index.html              # 41行，RPG舞台容器，纯文字界面
├── styles.css              # 371行，全局CSS变量 + 布局 + 组件样式
├── core.js                 # 1595行，游戏核心引擎（题目解析、成长、章节、战斗、心魔、法器、日课）
├── app.js                  # 1005行，前端渲染器（8个场景切换、事件处理、DOM操作）
├── data/
│   ├── questions.from-pdf.json      # 9.3MB，4077道真实题库（OCR合并）
│   ├── questions.example.json     # 6道样例（备用，代码不加载）
│   ├── question-ocr-pages.jsonl   # 465页，题目PDF OCR原始数据
│   ├── pdf-ocr-pages.jsonl        # 512页，答案PDF OCR原始数据
│   └── pdf-ocr-sample.json        # 早期样本
├── assets/                 # 素材目录（可能残留历史文件，代码不引用）
├── docs/                   # 本文档目录
│   ├── 01-game-overview.md
│   ├── 02-story-design.md
│   ├── 03-gameplay-systems.md
│   ├── 04-ui-spec.md
│   ├── 05-art-assets.md
│   ├── 06-content-pipeline.md
│   └── 07-implementation-roadmap.md  # 本文件
├── tests/
│   ├── core.test.mjs         # 核心引擎测试
│   ├── runtime.test.mjs      # 运行时集成测试
│   ├── pdf-question-bank.test.mjs  # 题库导入测试
│   └── redesign-gameplay.test.mjs  # 重设计玩法测试
└── package.json
```

---

## 2. 当前代码状态

| 文件 | 行数 | 职责 | 状态 |
|---|---|---|---|
| `index.html` | 41 | 容器 + 跳过链接 + 主Grid | ✅ 稳定 |
| `styles.css` | 371 | CSS变量 + Grid布局 + 8个组件样式 | ✅ 稳定 |
| `core.js` | 1595 | 全部游戏逻辑引擎 | ✅ 稳定 |
| `app.js` | 1005 | 全部渲染逻辑 + 事件处理 | ✅ 稳定 |
| `data/questions.from-pdf.json` | 4077题 | 真实题库（OCR合并） | ✅ 已接入 |
| `core.test.mjs` | — | 引擎测试 | 待确认 |

**游戏可运行状态：** 所有8个场景（world/story/training/battle/review/roster/daily/report）可正常切换，核心循环完整。

---

## 3. 架构现状

### 3.1 数据流

```
index.html (容器)
    ↓ import
app.js (渲染器)
    ↓ import
    ├── core.js (引擎API)
    │   ├── 题目解析 prepareQuestions / parseQuestionImport
    │   ├── 章节生成 createStoryChapters
    │   ├── 战斗结算 applyTrialAnswer
    │   ├── 心魔管理 updateMindDemon
    │   ├── 法器系统 upgradeArtifact
    │   ├── 日课系统 createDailyChallenges
    │   └── 数值公式 calculateDamage / calculateHeartDelta 等
    └── data/questions.from-pdf.json (4077题真实题库)
    ↓
localStorage (存档：xiaoming-academy-text-game-v1)
```

### 3.2 渲染器职责（app.js）

| 函数 | 场景 | 职责 |
|---|---|---|
| `renderWorldStage()` | world | 章节列表、进度、推荐行动 |
| `renderStoryStage()` | story | 剧情对话、已读记录、推进按钮 |
| `renderTrainingStage()` | training | 题眼、讲解、节点信息、练功按钮 |
| `renderBattleStage()` | battle | 题干、选项、招式、战斗反馈 |
| `renderReviewStage()` | review | 心魔列表、净化按钮 |
| `renderRosterStage()` | roster | 同伴信息、法器升级 |
| `renderDailyStage()` | daily | 日课任务列表、进度、奖励 |
| `renderReport()` | report | 战报、收益、事件记录、下一步 |
| `renderQuestPanel()` | 始终 | 右侧卷宗面板 |
| `renderBottomNav()` | 始终 | 底部6个导航按钮 |
| `renderHud()` | 始终 | 顶部资源统计 |

### 3.3 引擎职责（core.js）

| 模块 | 代码行 | 导出函数 | 说明 |
|---|---|---|---|
| 配置数据 | 1-208 | stances, materialTypes, artifactDefinitions, nodeTypes, storyCharacters, storyChapterTemplates | 游戏常量 |
| 章节剧情 | 265-296 | chapterNarrativeBeats | 硬编码台词 |
| 玩家状态 | 298-329 | initialPlayerState | 初始状态 |
| 题目处理 | 331-399 | prepareQuestions, parseQuestionImport, prunePlayerForQuestions | 解析+清理 |
| 章节系统 | 401-515 | createStoryChapters, getChapterProgress, isChapterCleared, getChapterActionState, getDialogueForChapter | 章节管理 |
| 路线系统 | 582-607 | createRouteRun, createMindDemonRun | 生成路线 |
| 战斗系统 | 609-769 | studyNode, applyTrialAnswer | 练功+战斗 |
| 结算系统 | 771-796 | createRunReport | 战报生成 |
| 心法系统 | 798-812 | getHeartMethod | 心法计算 |
| 法器系统 | 814-868 | getArtifactRoster, upgradeArtifact | 法器管理 |
| 日课系统 | 870-898 | createDailyChallenges | 每日挑战 |
| 数值公式 | 1010-1218 | 20+个 calculateXxx 函数 | 全部数值 |
| 工具函数 | 1220-1541 | normalizeXxx, addMaterials, clamp, unique 等 | 辅助工具 |

---

## 4. 验收标准

| 验收项 | 标准 | 检查方式 |
|---|---|---|
| 核心循环 | 地图→剧情→练功→战斗→心魔→报告 可完整走通 | 手动测试 |
| 单局时长 | 5题2-4分钟 | 手动计时 |
| 胜负明确 | 心力归零失败；完成5题成功 | 手动测试 |
| 首次说明 | 序章自动播放，可手动重开 | 手动测试 |
| 导入功能 | JSON文件可正常导入并生成章节 | 手动测试 |
| 存档恢复 | 刷新页面后进度保留 | 手动测试 |
| 桌面布局 | 无横向滚动，无文字溢出 | 浏览器检查 |
| 移动布局 | 无横向滚动，触控区域≥44px | 浏览器检查 |
| 测试覆盖 | 全部测试通过：`core.test.mjs` + `runtime.test.mjs` + `pdf-question-bank.test.mjs` | `npm test` |

---

## 5. 下一步优化方向（可选）

### 5.1 代码拆分（推荐）

当前 `core.js` 1595行、`app.js` 1005行，可考虑拆分：

```
src/
├── constants.js      # stances, nodeTypes, materialTypes, artifactDefinitions, storyCharacters
├── questions.js      # prepareQuestions, parseQuestionImport, validateImportedQuestion
├── chapters.js       # createStoryChapters, getChapterProgress, getDialogueForChapter
├── battle.js         # applyTrialAnswer, studyNode, createRunReport
├── demons.js         # updateMindDemon, totalDemonPressure
├── heart-methods.js  # getHeartMethod, calculateMasteryGain
├── artifacts.js      # getArtifactRoster, upgradeArtifact
├── daily.js          # createDailyChallenges
├── formulas.js       # 所有 calculateXxx 函数
├── utils.js          # clamp, unique, normalizeXxx, addMaterials 等
└── app/
    ├── render-world.js
    ├── render-story.js
    ├── render-training.js
    ├── render-battle.js
    ├── render-review.js
    ├── render-roster.js
    ├── render-daily.js
    ├── render-report.js
    └── dom.js          # el(), textButton(), panel(), meter() 等DOM工具
```

**收益：** 降低单文件维护成本，提升测试颗粒度。
**成本：** 需调整 import/export，确保测试框架兼容。

### 5.2 剧情扩展（可选）

当前剧情为硬编码数组，可扩展为：
- 更丰富的章节通关/返回对话
- 羁绊达标后的角色专属对话
- 全库通关后的结局文本

**实现方式：** 在 `chapterNarrativeBeats` 和 `getDialogueForChapter()` 中增加更多分支。

### 5.3 测试增强（推荐）

当前测试文件为 `core.test.mjs`，建议扩展：
- `formulas.test.mjs`：所有数值公式独立测试
- `battle.test.mjs`：完整战斗流程测试
- `chapters.test.mjs`：章节生成和通关判定测试
- `import.test.mjs`：题库导入和校验测试

### 5.4 题库扩展（可选）

- 接入更多JSON题库文件
- 增加PDF OCR后的题库导入
- 增加题目搜索/筛选功能

### 5.5 无障碍增强（可选）

- 增加 ARIA 角色标注（已完成部分）
- 增加键盘快捷键说明
- 增加高对比度模式

---

## 6. 依赖关系

```
index.html
    ↓
app.js ──→ core.js ──→ data/questions.from-pdf.json
    ↓              ↓
localStorage    tests/*.test.mjs
```

**无外部依赖：** 不依赖任何 npm 包、CDN、后端 API、图片资源。

---

*版本：v3.0 | 纯文字游戏版本 | 基于当前实际代码状态编写*
