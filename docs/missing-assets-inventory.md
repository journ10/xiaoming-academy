# Mockup 缺失素材盘点

日期：2026-06-16

## 范围

本清单基于以下内容合并判断：

- 桌面 mockup：`docs/mockups/final-world-map.png`、`final-story-dialogue.png`、`final-training.png`、`final-battle.png`、`final-mind-demon.png`、`final-report-growth.png`、`final-daily.png`、`final-roster-artifacts.png`
- 移动 mockup：`docs/mockups/mobile-*-ai-generated.png` 8 张
- 现有素材：`assets/generated` 与 `src/assets.js` 中登记的背景、角色、怪物、材料、法器、地图节点、封印与 logo

## 判定原则

1. 按“功能位置”判断是否缺素材，不按桌面/移动视觉差异重复拆分。同一功能位置只需要一套统一风格素材，桌面和移动通过布局、缩放、裁切复用。
2. 文案、数字、进度值、题目、选项文字不生成为图片，后续应由代码渲染。素材只提供容器、图标、纹理、状态、装饰、反馈特效。
3. 能用纯 CSS 稳定复刻的纯色块、普通圆角、简单阴影不列为必需素材；但 mockup 中带有手绘边缘、宣纸纹理、玉石高光、金属包边、墨迹装饰的 UI 需要独立素材。
4. 像素级复刻需要把“内容主体”和“UI 框架”分开。现有资产基本覆盖内容主体，但 UI 框架、控件状态、页面反馈和地图章节门仍明显不足。
5. 后续生成素材不必逐像素照搬当前 mockup 样式，但必须统一到同一套“小明书院”国风学院、宣纸、青金、墨色、玉石、柔和发光的风格体系。

## 现有可复用素材

| 类别 | 已有素材 | 结论 |
| --- | --- | --- |
| 背景 | 世界地图、战斗场景、书院门口、练功、心魔走廊、夜色、日课、队伍、6 个章节背景 | 可作为页面主背景继续复用 |
| 角色 | 明澈、阿芷、青岚、小墨的头像和立绘 cutout | 可作为统一人物基准，不应再生成不同长相的人物 |
| 心魔 / 敌人 | 法规、心理、设计、师德、班级、儿童、混合心魔 | 可覆盖战斗和心魔页面的怪物主体 |
| 道具 / 资源 | 树叶、星砂、墨玉、灵签 | 可覆盖奖励材料，但不等同于 HUD 资源图标 |
| 法器 | 笔灵、砚灵、纸灵、墨灵 | 可覆盖队伍法器主体 |
| 地图节点 | 普通、精英、恢复、宝箱、心魔、神秘、共鸣、试炼 | 可覆盖小型路线节点，但不足以覆盖大章节门 |
| 状态封印 | locked、unlocked、glowing | 可作为封印概念，但缺少通用选中、完成、通知等 UI 状态 |
| 品牌 | 书院 logo、墨迹 mark | 可复用 |

## 需要补齐的素材总览

建议新增资产按 P0 / P1 / P2 分级：

- P0：代码像素级复刻必须优先补齐。没有这些素材会导致页面整体不像 mockup。
- P1：影响质感、反馈和局部高保真。没有也能搭页面，但会明显缺少完成度。
- P2：可选增强，用于后续动效、皮肤或更细的状态表现。

数量口径：下表的“资产组 ID”用于管理和命名，“建议数量”是该组下需要的功能子素材数量。按最细状态拆分，P0 约 90 个资产组、224 个功能子素材；P1 约 12 个资产组、26 个功能子素材；P2 约 4 个资产组、12 个角色变体。实际落地时如果用九宫格框体、状态 overlay、CSS 着色和代码绘制，可以减少最终 PNG 文件数，但功能覆盖不应少于表中定义。

建议后续统一放入 `assets/generated/ui/`、`assets/generated/map/`、`assets/generated/fx/` 等子目录，并补充到 `src/assets.js`。

## P0 全局 UI 框架素材

这些素材跨 8 个页面复用，不需要桌面和移动各生成一套。

| 资产组 ID | 功能位置 | 建议数量 | 覆盖页面 | 缺失说明 |
| --- | --- | ---: | --- | --- |
| `ui.shell.top-hud-frame` | 顶部 HUD 主框 | 1 | 全部页面 | 需要宣纸/玉石/金边统一框体，支持横向拉伸 |
| `ui.shell.avatar-chip-frame` | 玩家头像与等级区域 | 1 | 世界、练功、战斗、心魔、日课、队伍 | 现有头像可用，但头像外框缺失 |
| `ui.shell.resource-chip-frame` | 资源数值胶囊 | 1 | 全部页面 | 当前缺少统一资源 chip 容器 |
| `ui.shell.progress-bar` | 通用进度条 | 4 | HUD、任务、羁绊、修行进度 | 需要轨道、填充、端点、高光，颜色可由 CSS 或多色贴图控制 |
| `ui.shell.bottom-nav-frame` | 底部导航底座 | 1 | 全部移动页、桌面底部导航 | 当前导航只能 CSS 近似，缺少统一纹理底座 |
| `ui.nav.icon-map` | 地图导航图标 | 1 | 全部主页面 | 不应复用地图节点图标 |
| `ui.nav.icon-training` | 练功导航图标 | 1 | 全部主页面 | 需要独立修行/书卷/打坐图标 |
| `ui.nav.icon-battle` | 战斗导航图标 | 1 | 全部主页面 | 需要独立刀剑/符阵图标 |
| `ui.nav.icon-mind-demon` | 心魔导航图标 | 1 | 全部主页面 | 需要独立心火/魔影图标 |
| `ui.nav.icon-roster` | 队伍导航图标 | 1 | 全部主页面 | 需要独立同伴/名册图标 |
| `ui.nav.icon-daily` | 日课导航图标 | 1 | 日课入口与移动底栏 | 需要独立日课/清单图标 |
| `ui.nav.state-overlays` | 导航状态 | 4 | 全部主页面 | active 发光、inactive 暗态、notice 红点、locked 覆盖 |
| `ui.icon.system-actions` | 系统操作图标 | 8 | 顶栏、弹窗、详情卡 | 返回、关闭、设置、邮件、退出、加号、帮助、刷新 |
| `ui.panel.parchment` | 宣纸信息面板 | 4 | 全部页面 | 大卡、中卡、小卡、弹窗/报告卡，需要 9-slice 或等效可拉伸规格 |
| `ui.panel.dark-glass` | 深色半透明信息面板 | 2 | 战斗、心魔、队伍 | 当前缺少深色框与内发光质感 |
| `ui.panel.title-plaque` | 标题牌 / 章节牌 | 2 | 全部页面 | 页面标题、章节名称、卡片标题都需要统一牌匾 |
| `ui.button.primary` | 主按钮框 | 4 | 全部页面 | normal、pressed、disabled、glow 四种状态 |
| `ui.button.secondary` | 次按钮框 | 3 | 全部页面 | normal、pressed、disabled |
| `ui.choice.option-card` | 选项卡框 | 5 | 剧情、战斗、心魔 | normal、selected、correct、wrong、disabled |
| `ui.badge.common-states` | 通用状态徽章 | 8 | 全部页面 | 当前、完成、锁定、奖励、新、精英、危险、推荐 |
| `ui.decor.corners-dividers` | 边角和分割装饰 | 8 | 全部页面 | 角花、墨线、云纹、短分割线，用于复刻卡片细节 |

## P0 页面专属核心素材

### 世界地图

| 资产组 ID | 功能位置 | 建议数量 | 缺失说明 |
| --- | --- | ---: | --- |
| `map.chapter-portal.*` | 6 个章节大门 / 传送门 | 6 | 现有 `node-*` 只适合小节点，无法承担章节入口主视觉。按功能需要法规、心理、设计、师德、班级、儿童 6 个主题门，桌面/移动共用 |
| `map.chapter-portal.state-overlays` | 章节门状态覆盖 | 4 | locked、available、current、cleared，不要为每个章节重复生成整套门 |
| `map.route-path-segments` | 地图路线连接 | 6 | 直线、弯线、短桥、虚线、发光连接、断开连接 |
| `map.current-marker` | 当前所在关卡标记 | 1 | 需要明显发光指针或脚印标记 |
| `map.chapter-label-plaque` | 章节名称牌 | 1 | 文案由代码写入，素材只做牌子 |
| `map.fortune-card-frame` | 今日运势悬挂卡 | 1 | 世界地图右/上方的日签卡缺框体 |
| `map.quest-tracker-frame` | 当前任务追踪卡 | 1 | 世界地图任务卡需要统一框体 |
| `map.progress-ribbon` | 地图进度飘带 | 1 | 用于章节进度或路线完成度 |

### 剧情对话

| 资产组 ID | 功能位置 | 建议数量 | 缺失说明 |
| --- | --- | ---: | --- |
| `story.dialogue-dock-frame` | 底部对话框 | 1 | 桌面和移动共用同一对话容器，按布局拉伸 |
| `story.speaker-nameplate` | 说话人名牌 | 1 | 文案由代码渲染 |
| `story.avatar-ring` | 对话头像环 | 1 | 复用现有角色头像，但需要统一头像外框 |
| `story.choice-stack-frame` | 剧情选项组容器 | 1 | 选项按钮可复用 `ui.choice.option-card`，这里补整组底框 |
| `story.progress-step` | 剧情进度点 / 线 | 3 | 点、已读点、连接线 |
| `story.skip-auto-icons` | 剧情控制图标 | 3 | 跳过、自动、回看 |

### 练功

| 资产组 ID | 功能位置 | 建议数量 | 缺失说明 |
| --- | --- | ---: | --- |
| `training.lesson-board-frame` | 中央课程板 / 开卷区域 | 1 | 当前只有背景和角色，缺课程主容器 |
| `training.lesson-card-frame` | 课程条目卡 | 3 | normal、active、completed |
| `training.topic-badges` | 学科主题徽章 | 6 | 法规、心理、设计、师德、班级、儿童 |
| `training.method-icons` | 心法 / 技能图标 | 6 | 速记、理解、演练、复盘、专注、突破 |
| `training.route-pip` | 练功路线小点 | 4 | normal、current、done、locked |
| `training.exp-reward-slot` | 经验 / 奖励槽 | 1 | 复用现有道具主体，缺统一槽位 |
| `training.practice-seal` | 练功完成印章 | 2 | passed、perfect |
| `training.start-cta-emblem` | 开始练功按钮装饰 | 1 | 用于主 CTA 上的图形符号 |

### 战斗

| 资产组 ID | 功能位置 | 建议数量 | 缺失说明 |
| --- | --- | ---: | --- |
| `battle.enemy-hp-frame` | 敌人血条与名称框 | 1 | 现有怪物图可用，但敌方 HUD 缺失 |
| `battle.player-status-frame` | 玩家战斗状态框 | 1 | 需要回合、连击、护盾、心力等信息容器 |
| `battle.question-panel-frame` | 题目主卡 | 1 | 题目文字由代码渲染，素材只提供带纹理主卡 |
| `battle.answer-option-rune` | 答案选项符牌 | 5 | normal、selected、correct、wrong、disabled |
| `battle.stance-icons` | 战斗策略按钮图标 | 3 | 稳破、强攻、观照 |
| `battle.stance-button-frame` | 战斗策略按钮框 | 3 | normal、active、disabled |
| `battle.release-sigil-button` | 大招 / 释放按钮符阵 | 2 | ready、cooldown |
| `battle.reward-condition-card` | 战斗条件与奖励卡 | 1 | 缺右侧或下方信息卡框体 |
| `battle.hit-fx` | 命中反馈特效 | 3 | 普通命中、暴击、净化命中，透明 PNG |
| `battle.wrong-fx` | 错误反馈特效 | 2 | 墨迹破裂、暗色震荡 |
| `battle.combo-badge` | 连击徽章 | 1 | 用于连击数字外框 |
| `battle.damage-number-style` | 伤害数字底纹 | 2 | 正向伤害、负向惩罚的底纹或描边素材 |

### 心魔

| 资产组 ID | 功能位置 | 建议数量 | 缺失说明 |
| --- | --- | ---: | --- |
| `mind-demon.list-item-frame` | 左侧 / 顶部心魔列表项 | 3 | normal、selected、cleared |
| `mind-demon.pressure-gauge` | 压力 / 污染值环形表 | 3 | 轨道、填充、高危发光 |
| `mind-demon.contract-panel` | 净化契约主卡 | 1 | 心魔问题和约束条件容器 |
| `mind-demon.answer-card` | 净化选项卡 | 5 | 可复用 battle option，但建议独立更偏净化契约风格 |
| `mind-demon.xiaomo-advice-frame` | 小墨提示条 | 1 | 角色已有，缺提示气泡 / 横条 |
| `mind-demon.purify-button-sigil` | 净化按钮符阵 | 2 | ready、disabled |
| `mind-demon.purify-fx` | 净化成功特效 | 3 | 光环、碎墨、封印亮起 |
| `mind-demon.corruption-overlay` | 污染覆盖层 | 2 | 轻度、重度，可叠在卡片或背景上 |

### 成长报告

| 资产组 ID | 功能位置 | 建议数量 | 缺失说明 |
| --- | --- | ---: | --- |
| `report.paper-frame` | 报告主纸张 | 1 | 当前缺独立报告纸张框体 |
| `report.result-title-plaque` | 结果标题牌 | 1 | 文案由代码渲染 |
| `report.score-ring` | 成绩圆环 | 3 | 轨道、填充、高光 |
| `report.radar-chart-frame` | 能力雷达底图 | 1 | 雷达数据由代码绘制，底图和外框需统一 |
| `report.reward-slot` | 奖励格 | 2 | normal、highlight |
| `report.next-route-card` | 下一步路线建议卡 | 1 | 用于展示推荐章节或练功路线 |
| `report.stamp-seal` | 评价印章 | 3 | 通过、优秀、需复盘 |
| `report.companion-comment-frame` | 同伴点评框 | 1 | 复用阿芷头像/立绘，缺评论容器 |

### 日课

| 资产组 ID | 功能位置 | 建议数量 | 缺失说明 |
| --- | --- | ---: | --- |
| `daily.board-frame` | 日课主任务板 | 1 | 缺任务看板框体 |
| `daily.task-row-frame` | 任务行 | 4 | normal、active、done、locked |
| `daily.progress-ring` | 日课进度环 | 3 | 轨道、填充、高光 |
| `daily.weekly-trial-board` | 周试炼看板 | 1 | 缺周任务/试炼区域主容器 |
| `daily.weekly-path-node` | 周试炼节点 | 4 | normal、current、done、boss |
| `daily.calendar-clock-icons` | 日期 / 时间图标 | 3 | 日历、时辰、刷新 |
| `daily.reward-chest-slot` | 日课奖励宝箱 / 槽位 | 2 | closed、open |
| `daily.claim-button-emblem` | 领取按钮装饰 | 1 | 用于奖励领取 CTA |
| `daily.streak-badge` | 连续完成徽章 | 1 | 用于天数数字外框 |

### 队伍与法器

| 资产组 ID | 功能位置 | 建议数量 | 缺失说明 |
| --- | --- | ---: | --- |
| `roster.companion-card-frame` | 同伴卡 | 4 | normal、selected、locked、upgrade-ready |
| `roster.companion-role-badges` | 同伴定位徽章 | 4 | 引导、练功、战斗、心魔 |
| `roster.bond-bar` | 羁绊进度条 | 3 | 轨道、填充、高光 |
| `roster.stat-pill` | 属性小标签 | 1 | 用于攻、防、悟、心等属性值 |
| `artifact.card-frame` | 法器卡 | 4 | normal、selected、locked、max |
| `artifact.rarity-gems` | 法器稀有度宝石 | 4 | 普通、稀有、史诗、传说 |
| `artifact.material-cost-chip` | 升级材料消耗 chip | 1 | 可放现有材料图标与数字 |
| `artifact.upgrade-button-frame` | 升级按钮 | 3 | normal、ready、disabled |
| `artifact.upgrade-fx` | 升级成功特效 | 3 | 闪光、环绕、碎星 |
| `artifact.lock-overlay` | 法器锁定覆盖 | 1 | 不要复用章节封印，法器锁定需要更小的覆盖层 |

## P1 质感与反馈增强素材

| 资产组 ID | 功能位置 | 建议数量 | 说明 |
| --- | --- | ---: | --- |
| `fx.page-transition-ink` | 页面切换墨迹 | 3 | 淡入、展开、收束 |
| `fx.selection-glow` | 通用选中光 | 3 | 小、中、大，可叠在按钮、卡片、节点后 |
| `fx.reward-pop` | 奖励获得反馈 | 3 | 星光、金币闪、材料弹出 |
| `fx.lock-shake-lines` | 锁定反馈 | 2 | 锁定提示震动线和暗纹 |
| `fx.correct-answer` | 正确反馈 | 2 | 绿/金色柔光，不写文字 |
| `fx.wrong-answer` | 错误反馈 | 2 | 墨裂/红暗光，不写文字 |
| `fx.loading-spinner` | 加载 / 等待 | 1 | 可作为静态序列第一帧或 CSS mask |
| `ui.tooltip-frame` | 悬浮提示框 | 1 | 桌面端 hover 信息需要 |
| `ui.modal-frame` | 通用弹窗 | 2 | 小弹窗、大弹窗 |
| `ui.scrollbar-themed` | 风格化滚动条 | 2 | 轨道、滑块 |
| `ui.input-frame` | 输入 / 搜索框 | 2 | 搜索、兑换码或未来弹窗使用 |
| `ui.empty-state-illustration` | 空状态小插图 | 3 | 无任务、无奖励、未解锁 |

## P2 可选角色变体

现有四名角色的头像和立绘已经足够作为代码实现基准。不要因为桌面和移动 mockup 中同一角色画法不完全一致就生成两套人物。

如果后续要提高剧情表现，可以在保持同一角色设定、发型、服饰、配色的前提下补以下变体：

| 资产组 ID | 功能位置 | 建议数量 | 说明 |
| --- | --- | ---: | --- |
| `character.mingche.expression-set` | 明澈表情 / 半身变体 | 3 | calm、encourage、serious |
| `character.azhi.expression-set` | 阿芷表情 / 半身变体 | 3 | teach、happy、thinking |
| `character.qinglan.expression-set` | 青岚表情 / 半身变体 | 3 | battle-ready、focused、victory |
| `character.xiaomo.expression-set` | 小墨表情 / 半身变体 | 3 | whisper、worry、relief |

这些属于 P2，不是当前像素级落地的必需条件。生成时必须以 `character-sheet.png` 和现有 cutout 为硬参考，避免再次出现人物素材变脸。

## 不建议重复生成的素材

以下素材已有功能等价物，不应仅因为桌面和移动图里构图不同就重复生成：

- 同一角色的桌面版 / 移动版立绘
- 同一背景的桌面版 / 移动版背景
- 同一怪物的桌面版 / 移动版怪物
- 同一材料、法器、节点的不同尺寸版本
- 带固定中文文案的按钮、卡片、标题图。除非是纯装饰性印章，否则文字应由代码渲染

## 生成规格建议

| 类型 | 建议规格 | 背景 | 备注 |
| --- | --- | --- | --- |
| 图标 | 256 x 256 或 512 x 512 | 透明 | 保留 12%-16% 安全边距 |
| 大章节门 / 传送门 | 768 x 960 或 1024 x 1280 | 透明 | 不带章节文字，状态用 overlay 叠加 |
| UI 面板 / 卡片 | 1024 x 512、1024 x 768、1024 x 1024 | 透明 | 需要可九宫格拉伸，角部纹理不能被拉坏 |
| 按钮 | 512 x 160 或 768 x 192 | 透明 | 不带文字，保留中心文字安全区 |
| 徽章 / 状态 | 256 x 256 | 透明 | 统一光源和描边厚度 |
| 特效 | 512 x 512 或 1024 x 1024 | 透明 | 可叠加，中心点清晰 |
| 角色变体 | 1024 x 1536 起 | 透明 | 只作为 P2，必须严格参考现有角色 |

## 最小补齐顺序

1. 先补 P0 全局 UI 框架素材：HUD、底栏、面板、按钮、选项卡、通用状态。它们决定全部页面是否统一。
2. 再补地图章节门和路线素材。世界地图是进入其它页面的总入口，对像素级观感影响最大。
3. 补战斗和心魔的题卡、选项、血条、净化/命中特效。它们是交互反馈最密集的页面。
4. 补练功、日课、报告、队伍的页面专属容器和槽位。
5. 最后视需要补角色表情变体，不作为当前缺失素材的阻塞项。

## 结论

当前不是缺少整套桌面/移动页面素材，而是缺少一套可复用、统一风格、可被代码组合的 UI 与状态资产。现有 `assets/generated` 已覆盖大部分“谁”和“在哪里”，但还没有充分覆盖“界面怎么装载信息、状态如何变化、操作如何反馈”。后续只要按本清单补齐这些功能素材，就可以避免再次用 mockup 截图裁切拼接，也能让桌面和移动页面共享同一套视觉资产完成像素级复刻。
