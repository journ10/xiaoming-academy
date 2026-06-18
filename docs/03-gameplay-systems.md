# 小明书院：文字巡游 — 玩法系统文档

> 文档定位：所有玩法规则、数值公式、系统交互的单一来源。开发人员从此文档读取系统定义，测试人员据此编写测试用例。

---

## 1. 系统索引

| 系统 | 一句话定位 | 代码位置 |
|---|---|---|
| 破招式 | 答题前选择风险策略 | `core.js` stances |
| 路线节点 | 把一局5题组织成可选择类型 | `core.js` nodeTypes |
| 心魔 | 把错题转成可削弱敌人 | `core.js` updateMindDemon |
| 心法成长 | 主题熟练度改变招式参数 | `core.js` getHeartMethod |
| 资源与心力 | 局内生命 + 局外奖励 | `core.js` initialPlayerState |
| 法器升级 | 材料用于升级法器，影响全局属性 | `core.js` artifactDefinitions + upgradeArtifact |
| 招式精通 | 使用招式积累XP，提升等级 | `core.js` stanceMastery + applyStanceMastery |
| 结算与推荐 | 每局给出成长、错因和下一目标 | `core.js` createRunReport + getNextRecommendation |
| 章节主线 | 把题库主题组织成RPG章节 | `core.js` createStoryChapters + getChapterProgress |
| 角色羁绊 | 学习和答对映射到角色成长 | `core.js` applyBondGains |
| 日课 | 每日4个目标驱动日常行为 | `core.js` createDailyChallenges |
| 能量系统 | 局内消耗，答对恢复/答错消耗 | `core.js` calculateEnergyDelta |

---

## 2. 核心系统详解

### 2.1 破招式系统

**定义位置：** `core.js` 第1-35行

| 招式ID | 名称 | 伤害倍率 | 奖励倍率 | 失误心力损失倍率 | 心魔压迫倍率 | 提供提示 |
|---|---|---|---|---|---|---|
| `steady` | 稳破 | 1.0 | 1.0 | 1.0 | 1.0 | 否 |
| `assault` | 强攻 | 1.55 | 1.5 | 2.0 | 2.0 | 否 |
| `observe` | 观照 | 0.72 | 0.58 | 0.65 | 0.65 | 是 |

**用法：** 战斗页面先选招式，再选答案。招式选择通过按钮切换，选中后高亮。

### 2.2 路线节点系统

**定义位置：** `core.js` 第79-177行

| 节点ID | 名称 | 奖励倍率 | 压迫倍率 | 伤害倍率 | 心力恢复 | 材料奖励 |
|---|---|---|---|---|---|---|
| `normal` | 常阵 | 1.0 | 1.0 | 1.0 | 0 | 书页+1 |
| `elite` | 锐阵 | 1.35 | 1.35 | 1.18 | 0 | 书页+2, 星砂+1 |
| `recover` | 息阵 | 0.78 | 0.82 | 0.92 | +1 | 书页+1 |
| `treasure` | 宝阵 | 1.6 | 1.0 | 1.0 | 0 | 书页+2, 星砂+2 |
| `demon` | 心魔回廊 | 1.1 | 1.2 | 1.0 | 0 | 墨玉+1 |
| `mystery` | 奇遇 | 1.12 | 0.92 | 1.0 | 0 | 书页+1, 墨玉+1 |
| `resonance` | 共鸣 | 1.25 | 0.95 | 1.08 | 0 | 星砂+2 |
| `trial` | 试炼 | 1.85 | 1.55 | 1.28 | 0 | 书页+3, 星砂+1, 灵签+1 |

**路线模式：** 按固定序列循环：`[normal, elite, recover, treasure, normal, mystery, resonance, trial, demon]`

**节点风味文本：** 每种节点有 `nodeFlavor` 文字描述，用于渲染时展示氛围。

### 2.3 心魔系统

**定义位置：** `core.js` 第1079-1120行 `updateMindDemon`

**生成机制：** 答错时，心魔压力增加：`pressureGain = max(1, ceil(difficulty × stance.demonPressureMultiplier × nodeConfig.pressureMultiplier))`

**状态：**
- `born`：压力 < 4
- `rampaging`：压力 ≥ 4
- `weakened`：净化中（答对一次，压力-2，purifyCount+1）
- 净化：连续答对2次后删除，标记为 `purified`

**压迫上限：** 单局总压迫达到12或心力归零或强攻失误3次 → 失败。

### 2.4 心法成长系统

**定义位置：** `core.js` 第798-812行 `getHeartMethod`

| 等级 | 熟练度要求 | 效果 |
|---|---|---|
| 1 | 0-24% | 基础状态 |
| 2 | 25-49% | 稳破防御+1 |
| 3 | 50-74% | 强攻伤害+5% |
| 4 | 75-99% | 观照额外回看1个关键词 |
| 5 | 100% | 全部加成生效 |

**心法效果：**
- `steadyGuardBonus`：稳破失误时，减少 `level-1` 点心力损失
- `assaultDamageBonus`：强攻伤害增加 `(level-1) × 5%`
- `observeHintBonus`：观照提示额外回看 `floor((level-1)/2)` 个关键词

### 2.5 法器系统

**定义位置：** `core.js` 第44-77行

| 法器ID | 名称 | 描述 | 最大等级 | 基础消耗 |
|---|---|---|---|---|
| `biling` | 碧灵笔 | 强化练功收益 | 5 | 书页8, 星砂2 |
| `yanling` | 言灵铃 | 强化答对反馈 | 5 | 书页10, 星砂3, 灵签1 |
| `zhiling` | 知灵佩 | 强化观照招式 | 5 | 书页6, 星砂4, 墨玉1 |
| `moling` | 墨灵镜 | 强化心魔回廊 | 5 | 书页12, 星砂2, 墨玉2, 灵签1 |

**升级成本：** `cost = baseCost × currentLevel`（逐级递增）

**升级条件：** 法器已解锁、未满级、材料充足。

### 2.6 招式精通系统

**定义位置：** `core.js` 第1280-1306行

| 等级 | XP要求 | 计算方式 |
|---|---|---|
| 1 | 0-44 | 初始 |
| 2 | 45-89 | 每级+45 XP |
| 3 | 90-134 | |
| 4 | 135-179 | |
| 5 | 180+ | 满级 |

**XP来源：** 答对时获得 `8 + difficulty + nodeBonus + (studiedBeforeBattle ? 3 : 0)`

**nodeBonus：** trial节点+4，resonance节点+3。

### 2.7 资源系统

**定义位置：** `core.js` 第298-329行 `initialPlayerState`

| 资源 | 初始值 | 最大值 | 说明 |
|---|---|---|---|
| 心力 | 6 | 6 | 局内生命，答错消耗 |
| 能量 | 12 | 12 | 进入战斗消耗，答对恢复 |
| 星辉 | 0 | — | 局外货币，成长显示 |
| 灵页 | 0 | — | 局外货币 |
| 书页 | 0 | — | 材料 |
| 星砂 | 0 | — | 材料 |
| 墨玉 | 0 | — | 材料 |
| 灵签 | 0 | — | 材料 |
| 修为 | 0 | — | 成长XP |
| 等级 | 1 | — | 修为/50 + 1 |
| 连破 | 0 | — | 连续答对计数 |

### 2.8 能量系统

**定义位置：** `core.js` 第1213-1218行

| 情况 | 能量变化 |
|---|---|
| 稳破答对 | +1 |
| 强攻答对 | +2 |
| 观照答对 | +1 |
| 稳破答错 | -2 |
| 强攻答错 | -3 |
| 观照答错 | -1 |

能量用于限制战斗频率，非局内生命。心力才是局内生命。

### 2.9 日课系统

**定义位置：** `core.js` 第870-898行

| 日课ID | 名称 | 目标 | 奖励 |
|---|---|---|---|
| `daily-study` | 晨课三问 | 完成3次练功 | 书页3, 星砂1 |
| `daily-battle` | 连破题阵 | 答对5题 | 书页4, 星砂2 |
| `daily-demon` | 净墨回廊 | 净化1个心魔 | 墨玉2, 书页1 |
| `daily-resonance` | 心法共鸣 | 2个主题心法≥50% | 星砂2, 灵签1 |

---

## 3. 数值公式

### 3.1 伤害计算

```javascript
// core.js 第1122-1128行
function calculateDamage({ question, stance, nodeConfig, method, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return max(8, question.difficulty * 8);
  const base = 42 + question.difficulty * 12;
  const methodBonus = stance.id === "assault" ? method.assaultDamageBonus : 0;
  const studyBonus = studiedBeforeBattle ? 0.1 : 0;
  return round(base * stance.damageMultiplier * nodeConfig.damageMultiplier * (1 + methodBonus + studyBonus));
}
```

### 3.2 心力变化

```javascript
// core.js 第1130-1138行
function calculateHeartDelta({ question, stance, nodeConfig, method, isCorrect }) {
  if (isCorrect) return nodeConfig.heartRecovery;  // 常阵=0, 息阵=+1
  const guard = stance.id === "steady" ? method.steadyGuardBonus : 0;
  const loss = max(1, ceil((question.difficulty + 1) * stance.heartLossMultiplier * nodeConfig.pressureMultiplier) - guard);
  return -loss;
}
```

### 3.3 灵页奖励

```javascript
// core.js 第1140-1145行
function calculateSpiritPages({ question, stance, nodeConfig, isCorrect, studiedBeforeBattle }) {
  const base = 8 + question.difficulty * 2;
  if (!isCorrect) return 0;
  const studyBonus = studiedBeforeBattle ? 1.15 : 1;
  return max(1, round(base * stance.rewardMultiplier * nodeConfig.rewardMultiplier * studyBonus));
}
```

### 3.4 材料掉落

```javascript
// core.js 第1147-1159行
function calculateMaterialsGain({ question, nodeConfig, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return 全零;
  const base = nodeConfig.materialRewards;
  const studyBonus = studiedBeforeBattle && question.difficulty >= 3 ? 1 : 0;
  const resonanceBonus = nodeConfig.resonanceMultiplier && studiedBeforeBattle ? 1 : 0;
  return {
    shuye: base.shuye + studyBonus,
    xingsha: base.xingsha + resonanceBonus,
    moyu: base.moyu,
    lingqian: base.lingqian,
  };
}
```

### 3.5 心法熟练度

```javascript
// core.js 第1161-1165行
function calculateMasteryGain({ question, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return 0;
  const base = 10 + question.difficulty * 2;
  return base + (studiedBeforeBattle ? 4 : 0);
}
```

### 3.6 练功奖励

```javascript
// core.js 第1173-1193行
function calculateStudyRewards(wasStudied) {
  if (wasStudied) return { 星辉:0, 修为:0, 材料:零, 羁绊:零 };
  return {
    starGlimmerGain: 3,
    growthXpGain: 8,
    materials: { shuye: 1 },
    bondGains: { mingche: 1, azhi: 3 },
  };
}
```

### 3.7 战斗星辉与修为

```javascript
// core.js 第1195-1203行
function calculateBattleStarGlimmer({ question, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return 0;
  return 4 + question.difficulty + (studiedBeforeBattle ? 1 : 0);
}

function calculateBattleGrowthXp({ question, isCorrect, studiedBeforeBattle }) {
  if (!isCorrect) return 0;
  return 10 + question.difficulty * 2 + (studiedBeforeBattle ? 4 : 0);
}
```

### 3.8 战斗羁绊

```javascript
// core.js 第1205-1211行
function calculateBattleBondGains({ isCorrect, purifiedDemonId }) {
  return {
    qinglan: isCorrect ? 3 : 0,
    xiaomo: purifiedDemonId ? 4 : 0,
  };
}
```

### 3.9 玩家等级

```javascript
// core.js 第1372-1374行
function calculatePlayerLevel(growthXp) {
  return max(1, floor(growthXp / 50) + 1);
}
```

---

## 4. 玩家状态

**定义位置：** `core.js` 第298-329行

```javascript
initialPlayerState = {
  playerLevel: 1,
  growthXp: 0,              // 修为
  starGlimmer: 0,          // 星辉
  energy: 12,              // 能量
  maxEnergy: 12,
  heartPower: 6,            // 心力
  maxHeartPower: 6,
  spiritPages: 0,          // 灵页
  materials: { shuye:0, xingsha:0, moyu:0, lingqian:0 },
  artifacts: { biling:{level:1}, yanling:{level:1}, zhiling:{level:1}, moling:{level:1} },
  stanceMastery: { steady:{xp:0,level:1}, assault:{xp:0,level:1}, observe:{xp:0,level:1} },
  streak: 0,               // 连破
  seenIntro: false,          // 序章标记
  bonds: { mingche:0, azhi:0, qinglan:0, xiaomo:0 },
  storyFlags: {},            // 章节剧情标记
  mastery: {},               // 主题心法熟练度 {topic: percentage}
  studiedLessonIds: [],      // 已练功题目
  answeredQuestionIds: [],   // 已答题题目
  correctQuestionIds: [],    // 答对题目
  wrongQuestionIds: [],      // 答错题目
  mindDemons: {},            // 活跃心魔 {questionId: demon}
  purifiedDemonIds: [],      // 已净化心魔
  chapterClears: {},         // 章节通关标记
  stanceStats: { steady:0, assault:0, observe:0 },
}
```

---

## 5. 正反馈原则

- **成长只来自：** 首次学习、答对题目、净化心魔
- **答错不给任何成长奖励**，只累积心魔压迫
- **点击/跳过/重复学习不给奖励**

---

*版本：v3.0 | 纯文字游戏版本 | 基于 core.js 全部系统代码提取*
