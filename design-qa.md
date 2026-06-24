**Source Visual Truth Path**
- `/private/tmp/academy-qa/design-refs/D2wR2.png` - 夜读 PC 开局台
- `/private/tmp/academy-qa/design-refs/gaTqx.png` - 夜读 PC 题阵作答
- `/private/tmp/academy-qa/design-refs/CmBI1.png` - 夜读 PC 设置
- `/private/tmp/academy-qa/design-refs/ngJkq.png` - 夜读移动题阵作答
- `/private/tmp/academy-qa/design-refs/Z3c9Wq.png` - 夜读移动设置

**Implementation Screenshot Path**
- `/private/tmp/academy-qa/impl-shots/desktop-start-night.png`
- `/private/tmp/academy-qa/impl-shots/desktop-run-night.png`
- `/private/tmp/academy-qa/impl-shots/desktop-settings-night.png`
- `/private/tmp/academy-qa/impl-shots/desktop-settings-light.png`
- `/private/tmp/academy-qa/impl-shots/mobile-start-cdp-no-device.png`
- `/private/tmp/academy-qa/impl-shots/mobile-run-light.png`
- `/private/tmp/academy-qa/impl-shots/mobile-settings-light.png`

**Viewport**
- PC: `1360x820`
- Mobile: `390x844` browser viewport. The Pencil mobile screenshots include a simulated device status bar; implementation intentionally excludes that non-product layer.

**State**
- 开局台：夜读主题，未开始题阵
- 题阵：已选择流派后进入第 1 题
- 设置：夜读主题与明亮主题切换后状态

**Full-View Comparison Evidence**
- PC 开局台: `D2wR2.png` compared with `desktop-start-night.png`
- PC 题阵: `gaTqx.png` compared with `desktop-run-night.png`
- PC 设置: `CmBI1.png` compared with `desktop-settings-night.png`
- 移动开局台: source mobile frame content compared with `mobile-start-cdp-no-device.png`; device status simulation is intentionally excluded.
- 移动题阵: `ngJkq.png` compared with `mobile-run-light.png`
- 移动设置: `Z3c9Wq.png` compared with `mobile-settings-light.png`

**Focused Region Comparison Evidence**
- PC 题阵标题、左侧题号轨、右侧确认栏 are visible in the full-view screenshots at the target viewport; no additional crop was needed.
- Mobile 题阵底部确认抽屉 and bottom nav are visible in `mobile-run-light.png`; no additional crop was needed.
- 设置页存档卡 and theme switch are visible in the full-view screenshots; no additional crop was needed.

**Findings**
- No remaining P0/P1/P2 findings.
- [P2 resolved] Device simulation chrome was copied into the product UI.
  Location: prior `index.html` / `.status-bar`.
  Evidence: source mobile mock shows `20:41` and `5G 89%` as phone status simulation, not app content. The implementation previously rendered those strings in the Web page.
  Fix: removed the `status-bar` markup and CSS, and added regression coverage to prevent status-bar/device text from returning.
- [P3] 设置页主题切换 uses a two-button segmented switch instead of the mock's compact dropdown shape.
  Location: `renderSettings` / `.theme-segment`.
  Evidence: source shows one compact theme selector; implementation exposes both 明亮 and 夜读 for direct switching.
  Impact: improves required theme switching clarity, with minor visual drift from the static mock.
  Fix: acceptable for this requirement; use a select-style control later if exact mock interaction is preferred.

**Patches Made Since Previous QA Pass**
- Replaced the generic responsive card shell with the PC `1360x820` visual frame and a mobile content width capped at `390px`.
- Removed the simulated mobile status bar from implementation; mobile screens now start at the product content, not the device chrome.
- Rebuilt PC navigation as a horizontal top nav and hid it on mobile in favor of the bottom nav.
- Rebuilt 题阵 as left progress rail, central question board, and right answer dock on PC.
- Rebuilt mobile 题阵 with top progress and a fixed bottom confirmation drawer.
- Fixed page titles to match design vocabulary: 开局台, 题阵, 心魔, 学习报告, 设置.
- Reworked 设置 into storage and theme cards while preserving save-code import/export/reset.
- Added regression tests for the visual shell and removed old side-nav assertions.

**Required Fidelity Surfaces**
- Fonts and typography: uses Noto Sans SC/PingFang SC stack, bold page titles, compact UI labels, and zero letter spacing.
- Spacing and layout rhythm: matches the source PC frame, top-nav height, content card placement, and mobile app-content spacing after excluding the mock's simulated phone status area.
- Colors and visual tokens: maps light/night surfaces, borders, accent blue, danger, success, muted text, and app backgrounds to design tokens.
- Image quality and asset fidelity: no raster imagery or icons are present in the source screens; no placeholder image substitutions were introduced.
- Copy and content: player-facing copy uses current vocabulary and avoids banned legacy terms.

**Final Result**
final result: passed
