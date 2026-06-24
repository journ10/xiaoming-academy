**Source Visual Truth Path**
- Pencil exports: `/private/tmp/academy-pixel/source/*.png`
- Mobile source frames are cropped from `390x844` to `390x800` by removing the top `44px` simulated phone status area.

**Implementation Screenshot Path**
- Runtime captures: `/private/tmp/academy-pixel/impl/*.png`
- Side-by-side comparison and heatmaps: `/private/tmp/academy-pixel/compare/*.png`
- Metrics table: `/private/tmp/academy-pixel/compare/metrics.json`

**Viewport**
- PC: `1360x820`
- Mobile product viewport: `390x800`

**State**
- 30 screens across 明亮/夜读, PC/mobile, and core states: 开局台, 题阵未选, 题阵已选, 观照, 破招反馈, 心魔, 学习报告, 设置.
- Captures use fixed localStorage QA state so source and implementation compare the same route, theme, and interaction state.

**Full-View Comparison Evidence**
- Highest remaining MAD after fixes:
  - `u3kQi` 夜读移动观照: `20.43`
  - `ngJkq` 夜读移动题阵已选: `20.41`
  - `e6ecF` 夜读移动题阵未选: `17.35`
  - `CgyVs` 夜读移动开局台: `17.29`
  - `ooPsf` 夜读移动反馈: `16.52`
- Lowest remaining MAD:
  - `znPOf` 明亮桌面设置: `6.49`
  - `kCV6M` 明亮桌面反馈: `7.09`
  - `PMZd5` 夜读桌面反馈: `7.23`

**Focused Region Comparison Evidence**
- Mobile device chrome is intentionally excluded; the app must not render the mock phone status bar.
- Focused checks covered mobile 题阵 top progress, 题眼短课 row, 破招 row, option cards, selected-answer dock, feedback cards, 心魔 cards, 学习报告 cards, and 设置 controls.

**Findings**
- No remaining P0/P1/P2 layout blockers after this pass.
- Remaining P3 pixel drift is concentrated in night mobile text antialiasing, dynamic copy width, and color-token differences. These do not change structure, state, or interaction.

**Patches Made Since Previous QA Pass**
- Rebuilt submitted state as a dedicated 破招反馈 page instead of 题阵 plus bottom result dock.
- Matched mobile 题阵 behavior: no confirmation dock until an answer is selected; progress uses current step.
- Moved 观照 hint into the compact hint bar under 破招 and removed the dock for unselected observe state.
- Rebuilt 心魔 as a highest-pressure card plus compact pending-review list.
- Rebuilt 学习报告 as three stacked summary cards with 再来一局 / 换目标 actions.
- Tightened 开局台 recommendation copy, card content, mobile button placement, and desktop style selector layout.
- Matched 设置 to storage and single theme selector while preserving save-code import/export/reset and theme switching.

**Required Fidelity Surfaces**
- Fonts and typography: uses the existing Chinese sans stack with bold headings and compact UI labels.
- Spacing and layout rhythm: all 30 states captured at matching viewport, theme, and interaction state.
- Colors and visual tokens: light/night tokens, accent, success, warning, danger, and surfaces are mapped in CSS variables.
- Image quality and asset fidelity: no raster assets are present in these source screens.
- Copy and content: current player vocabulary is preserved; banned legacy terms remain covered by tests.

**Final Result**
final result: passed
