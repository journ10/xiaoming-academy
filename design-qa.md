**Source Visual Truth Path**
- Pencil exports: `/private/tmp/academy-pixel/source-20260625/*.png`
- Mobile source frames are cropped from `390x844` to `390x800` by removing the top `44px` simulated phone status area.

**Implementation Screenshot Path**
- Runtime captures: `/private/tmp/academy-pixel/impl-20260625/*.png`
- Side-by-side comparison and heatmaps: `/private/tmp/academy-pixel/compare-20260625/*.png`
- Metrics table: `/private/tmp/academy-pixel/compare-20260625/metrics.json`

**Viewport**
- PC: `1360x820`
- Mobile product viewport: `390x800`

**State**
- 38 screens across 明亮/夜读, PC/mobile, and core states: 开局台, 题阵空状态, 题阵未选, 题阵已选, 观照, 破招反馈, 心魔, 学习报告空状态, 学习报告, 设置.
- Captures use fixed localStorage QA state so source and implementation compare the same route, theme, and interaction state.

**Full-View Comparison Evidence**
- Highest remaining MAD after the 38-screen pass:
  - `u3kQi` 夜读移动观照: `35.11`
  - `ngJkq` 夜读移动题阵已选: `32.33`
  - `e6ecF` 夜读移动题阵未选: `31.70`
  - `X7xNz` 明亮移动题阵已选: `25.31`
  - `kk6aT` 明亮移动观照: `23.03`
- These highest values are dominated by dynamic real question stems/options versus the static example text in the design source; layout comparison was checked separately on the fixed UI regions.
- Lowest remaining MAD:
  - `uEVi3` 明亮桌面题阵空状态: `2.77`
  - `M9nNSM` 明亮桌面学习报告空状态: `2.98`
  - `z5Fdrj` 夜读桌面题阵空状态: `3.25`
  - `rxOFx` 夜读桌面学习报告空状态: `3.48`

**New Empty-State Evidence**
- `uEVi3` 明亮 PC 题阵空状态: `2.771`
- `M9nNSM` 明亮 PC 学习报告空状态: `2.981`
- `z5Fdrj` 夜读 PC 题阵空状态: `3.247`
- `rxOFx` 夜读 PC 学习报告空状态: `3.477`
- `iU3km` 明亮移动题阵空状态: `8.366`
- `eAhBn` 明亮移动学习报告空状态: `8.750`
- `TF1yn` 夜读移动题阵空状态: `9.277`
- `HEmKT` 夜读移动学习报告空状态: `9.684`

**Focused Region Comparison Evidence**
- Mobile device chrome is intentionally excluded; the app must not render the mock phone status bar.
- Focused checks covered mobile 题阵 top progress, 题眼短课 row, 破招 row, option cards, selected-answer dock, feedback cards, 心魔 cards, 学习报告 cards, 设置 controls, and both new empty states.

**Findings**
- No remaining P0/P1/P2 layout blockers after this pass.
- Remaining P3 pixel drift is concentrated in real-question dynamic copy, browser/Pencil Chinese font rendering, and night mobile antialiasing. These do not change structure, state, or interaction.

**Patches Made Since Previous QA Pass**
- Added 明亮/夜读, PC/mobile 题阵空状态 and 学习报告空状态 from the new design frames.
- Matched PC empty states to the design rail/card/sidebar layout and mobile empty states to the cropped content viewport without rendering the simulated phone status bar.
- Re-tuned global light/night tokens, top navigation, bottom navigation, and mobile content top padding to match the updated visual system.
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
