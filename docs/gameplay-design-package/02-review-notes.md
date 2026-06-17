# Review Notes

## Candidate Directions

| 方向名 | 玩家身份 | 重复动作 | 最强感受 | 范围压力 | 舍弃原因 |
|---|---|---|---|---|---|
| 秘卷巡游网页 RPG | 秘卷巡游者 | 地图巡游、剧情对话、短课、战斗、净化心魔 | 游戏感先于题库感，学习目标藏在 RPG 主线内 | 高 | 选中 |
| 真题秘境 RPG 主线 | 破阵学徒 | 练功、破招、净化心魔、点亮章节 | 学会题目后推动角色和章节成长 | 中 | 被吸收为学习与战斗系统 |
| 破阵试炼 | 破阵弟子 | 选破招式、答题、推进路线 | 每题都有风险承诺和反杀反馈 | 中 | 被主线 RPG 吸收为战斗层 |
| 书院经营养成 | 书院掌院 | 答题拿资源、升级建筑 | 看书院成长 | 低 | 答题前没有决策，仍像题库外包一层经营 |
| 心法卡组构筑 | 心法修士 | 组招式牌、抽牌、答题战斗 | 策略感强 | 高 | 需要牌库、抽牌、平衡和大量 UI，超出 2 周原型 |

## Final Choice

- chosen direction: 秘卷巡游网页 RPG
- strongest promise: 玩家第一眼看到的是地图、角色立绘和剧情任务；学习以短课和战斗准备出现，通关仍严格代表题库熟练覆盖。
- biggest scope risk: 生成位图资产、全屏舞台、剧情对话、短课和战斗同时重构，会显著增加 UI 状态复杂度。
- cut-first target: 砍掉开放式移动、装备背包、支线分支和复杂动画，只保留世界地图节点、视觉小说对话、短课练功、战斗检验、心魔复训和队伍成长。

## Major Revisions

| revision_id | triggering_stage | what_failed | changed_decision | why_stronger_now | downstream_implications |
|---|---|---|---|---|---|
| REV-01 | system weaving -> fantasy loop | 卡组构筑方向要求过多系统，核心题库验证会被抽牌和平衡拖慢 | 改为三种固定破招式，不做牌组 | 保留答题前决策和风险感，同时可在 2 周 Web 原型内完成 | SYS-02 使用配置表驱动三种招式，首版不需要牌库对象 |
| REV-02 | pacing -> fantasy loop | 当前版本的地图和奖励都在答题后发生，前 10 秒没有新玩法 | 把选择破招式前置到答题前 | 第一题即可展示玩家承诺，不依赖长线成长 | UI-01 必须出现在题卡选项前，FML-01 到 FML-03 都依赖 VAR-02 |
| REV-03 | user playtest -> fantasy loop | 玩家指出缺少学习部分，单纯战斗不能承载题库讲解价值 | 增加练功卷，学习与战斗并列；练功影响战斗检验和心法收益，但不强制先后 | 学习内容成为可玩对象，战斗负责检验学习成果，不再只是答题包装 | 新增 OBJ-08 Lesson、UI-00 练功卷、EVT-03 study_lesson |
| REV-04 | user playtest -> asset scope | 玩家指出美术资源不足，首版视觉反馈不够像游戏 | 提前补成套 SVG 美术资源，覆盖练功、招式、节点、心魔、资源和战报 | 视觉对象和运行时对象一一对应，状态反馈更明确 | 旧版 `assets/reference/legacy/trial-art.svg` 已归档，运行时主素材改为位图 |
| REV-05 | user playtest -> full package | 玩家仍不满意，指出缺一次性说明、故事主线、角色关卡、女性向美术、玩家成长和“通关代表题库熟练” | 升级为真题秘境 RPG 主线：四角色、六章、星辉、羁绊、等级、章节封印、首次序章 | 正反馈被绑定到学习和答对，通关条件被绑定到题库覆盖，游戏目标从短局胜利升级为全库熟练 | 新增 SYS-08, SYS-09, SYS-10, RES-06, RES-07, RES-08, CFG-05, CFG-06, VAR-11 到 VAR-15 |
| REV-06 | user playtest -> UI and asset architecture | 玩家指出版本仍像套游戏 UI 的答题机器，布局逻辑没有破坏性变化，角色缺生成头像和立绘，剧情与特效不足 | 废弃三栏结构，改为秘卷巡游网页 RPG：全屏地图、生成场景图、角色头像与立绘、视觉小说对话、短课练功、战斗背景、底部导航和任务板 | 首屏游戏感从信息面板变成地图巡游，学习被包装为技能准备和战斗检验，主线剧情成为章节通关条件 | 新增 `assets/generated/` 位图资产；`app.js` 改为 scene controller；章节通关新增 storySeen 门槛 |

## Loop-back Summary

- loop-back count: 6
- highest-cost revision: 从三栏主线 RPG 进一步重构为全屏网页 RPG 舞台，需要替换 HTML/CSS/JS 呈现结构并生成位图资产。
- still-open fragility: PDF OCR 和完整题库生产仍未进入主流程；当前先验证游戏本体，内容扩展在本体稳定后推进。
