# 美术资产回归报告

日期：2026-06-16

## 结论

当前正式资产集可以支撑代码侧按现有桌面与移动 mockup 做像素级复刻的第一轮实现。正式实现应优先使用 `assets/generated/mockup-generated-assets-index.json` 中登记的资产；历史 `missing-assets-index.json` 只能作为审计和参考，不应作为最终美术来源。

如果实现过程中发现某个 sheet 内的单个组件难以精准裁切，应使用 `image_gen` 重新生成该单件组件，再做透明背景清理或裁切，不要用 SVG 或 PIL 直接绘制替代。

## 已确认的正式资产

- Mockup 参考图：桌面 8 张，移动端 8 张，均位于 `docs/mockups`。
- 当前实现资产索引：`assets/generated/mockup-generated-assets-index.json`。
- 正式 image_gen 资产数量：47 个。
- 其中原始 image_gen 透明资产/sheet：16 个。
- 其中从 image_gen sheet 裁切出的便捷单件：31 个。

正式资产来源规则：

- 原始视觉内容来自 `image_gen`。
- 允许的后处理：chroma-key 去底、透明通道清理、裁切拆分。
- 不允许作为最终美术来源：SVG 直接生成、PIL 直接绘制。

## 拆分结果

已经拆分并登记：

- 角色 UI 资产：4 个角色，每个包含 bust、half、avatar，共 12 个。
- 道具/法器/奖励图标：19 个。

未继续拆分的 sheet：

- HUD、底部导航、通用面板、各页面组件 sheet 暂保留为 sheet。
- 原因：这些图存在装饰边缘、粒子、重叠阴影或成组布局，自动拆分容易带入残片。代码侧可以按 mockup 坐标裁切；若需要稳定单件，再用 `image_gen` 单独补图。

## 问题与处理

- 角色拆分初版发现相邻角色残片，已按 alpha 内容和功能位置重新裁切。
- 两个未索引的非透明 HUD 副本已删除，仅保留 `*-alpha.png` 透明正式版本和 `_sources/imagegen` 原图。
- `.DS_Store` 已从 `assets` 和 `docs` 清理。
- 历史 procedural/PIL 资产共 99 个，已移至 `assets/generated/_deprecated/procedural-placeholders`，并在历史索引中标记为 `deprecated-placeholder`。
- procedural 资产迁移后遗留的空目录已删除。
- `scripts/generate_missing_assets.py` 已明确标注为历史占位生成器，默认需要 `--allow-procedural-placeholders` 才能运行。

## SVG 与旧参考素材

以下文件保留为历史参考，不应在代码实现中当作最终图片资产使用：

- `assets/reference/legacy/academy-map.svg`
- `assets/reference/legacy/game-symbols.svg`
- `assets/reference/legacy/trial-art.svg`
- `assets/reference/legacy/visual-direction-key-art.png`

## 缺失资产判断

按当前 mockup 的页面功能位判断，暂未发现必须立即补生图的缺口：

- 桌面和移动端共享同一角色、道具、场景与页面功能素材。
- HUD 与导航因版式不同，已分别保留桌面/移动版本。
- 页面内复杂组件已有对应 image_gen sheet 覆盖。
- 单件图标和角色常用变体已有裁切资产，代码侧可直接引用。

后续实现中若出现以下情况，需要补生图：

- 某个组件在 sheet 中被相邻装饰遮挡，无法干净裁切。
- 某个交互状态需要独立视觉而当前 mockup 未展示。
- 同一功能位在桌面与移动端实际需要不同构图，而当前 sheet 只覆盖一种。

## 使用建议

代码侧优先引用 `src/assets.js` 中的 manifest id。对 sheet 资产，先按 mockup 坐标裁切；对已拆分角色和道具，直接使用 split 文件。不要回退到 `_deprecated/procedural-placeholders` 里的图片做正式 UI。
