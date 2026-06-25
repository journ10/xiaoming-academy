**Source Visual Truth Path**
- Pencil exports: `/private/tmp/academy-pixel/source-20260625-r2/*.png`
- Source contains 38 top-level frames from `academy-design.pen`.
- Mobile source frames include a simulated phone status area. The runtime intentionally does not render that mock device chrome.

**Implementation Screenshot Path**
- Runtime captures: `/private/tmp/academy-pixel/impl-20260625-r2-final2/*.png`
- Side-by-side comparison sheets: `/private/tmp/academy-pixel/compare-20260625-r2-final/*.png`

**Viewport**
- PC: `1360x820`
- Mobile app viewport: `390x844`

**State Coverage**
- 38 covered design states across 明亮/夜读, PC/mobile, and core scenes: 开局台, 题阵空状态, 题阵未选, 题阵已选, 观照, 破招反馈, 心魔, 学习报告空状态, 学习报告, 设置.
- Captures use fixed localStorage QA states so source and implementation compare the same route, theme, and interaction state.
- Feedback comparison uses the design-provided correct-answer feedback state. Wrong-answer feedback remains a runtime state without a dedicated design frame.

**Fixed-Region Checks**
- Mobile 题阵未选: no lower confirmation popup; title, progress, question card, independent option cards, and bottom navigation match the `题阵未选` frames.
- Mobile 题阵已选: selected options use the design selected card state; lower confirmation sheet appears only after selection and hides bottom navigation.
- PC 题阵已选: right confirmation card is inside the main board at the design position, with the confirm button pinned to the lower card area.
- PC 观照: right `观照提示` side card is present; mobile keeps the inline hint bar from the mobile design.
- 设置: storage card, save-code controls, and single 明亮/夜读 selector match the static design state.
- 学习报告: PC uses the design left progress rail, main board, metric row, right gain card, and action buttons; mobile uses the card stack.

**Patches Made In This Pass**
- Split 题阵 options out of the question card so the design’s `题面短卡 + 独立选项卡` structure is preserved.
- Added app-shell answer-dock state so mobile bottom navigation is hidden only while the selected-answer sheet is open.
- Repositioned PC answer/observe side cards and removed nav progress text from the PC top navigation.
- Added PC-only 观照提示 side card.
- Rebuilt PC 学习报告 layout with left rail, metric row, right gain card, and design-sized actions.
- Fixed mobile 开局台 button/流派 overlap by restoring normal card flow for mobile while preserving PC absolute layout.
- Tightened 设置 theme selector copy and mobile storage-card border.

**Design Gaps Found**
- No separate PC `题阵未选` frame exists. Runtime still needs that state on wide screens; current implementation uses the PC 题阵 layout without the right confirmation/observe card.
- No dedicated wrong-answer `破招反馈` frame exists. Runtime supports wrong feedback using the same feedback layout with danger styling, but this state cannot be pixel-matched to a design frame.
- No separate design frame exists for loading/error states or opened save-code import/export text areas.

**Remaining Acceptable Variance**
- Real question stems/options and report data differ from static design sample copy, so content-driven vertical movement is expected.
- Mobile source includes the simulated phone status bar; runtime excludes it by requirement.
- Browser and Pencil font rasterization differ slightly for Chinese bold text.

**Final Result**
final result: passed
