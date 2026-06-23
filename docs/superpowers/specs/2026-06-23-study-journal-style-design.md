# Study Journal Style Design

## Direction

The game style will move toward a "书院手账成长风": a refined study-journal fantasy where each short run feels like completing and decorating one page of a personal exam notebook.

The target feeling is warm, clear, and motivating. The game should not become a pink cute skin, a hard combat RPG, or a dense study dashboard. It should make the player feel that every 5-question run leaves visible progress: lit key points, organized mistakes, collected stickers, and a next page worth opening.

## Player Promise

When the player opens the game, they should immediately know:

1. What small goal to finish today.
2. Why answering this run matters.
3. What visible thing they will gain after the run.

The first-stage promise is:

> Finish one 5-question journal page, light up key points, organize mistakes, and receive a clear next goal.

## First-Stage Scope

Focus on three high-impact surfaces:

1. Start desk goal framing.
2. In-question reward and mistake feedback.
3. Post-run journal report.

Do not redesign the whole app, add large new systems, or replace the question bank. Existing roguelite modes, builds, short lessons, demons, and reports should be reused with new player-facing framing.

## Experience Changes

### Start Desk

Replace the current "今日推荐" framing with "今日小目标".

Examples:

- 今天点亮 5 个题眼
- 整理 1 个错因心魔
- 完成一页稳修手账
- 让教育学原理页完成度 +20%

The primary action remains one clear button. Secondary actions should stay quiet.

### Run Framing

A run is no longer presented mainly as a battle or route. It is a journal page in progress:

```text
今日小目标 -> 开一页题眼手账 -> 5 道题 -> 题眼贴纸 / 错因整理 -> 今日手账页 -> 下一页建议
```

The current vocabulary can stay, but harsh combat emphasis should be softened where it affects motivation.

Preferred vocabulary:

- 题眼贴纸
- 今日手账页
- 已点亮
- 已整理
- 书签
- 秘卷碎片
- 错因心结
- 心魔回廊

Avoid making the player feel punished for being wrong. Wrong answers should become organized review targets.

### Answer Feedback

Correct answer feedback should show concrete progress before abstract numbers:

- 点亮了哪个题眼
- 获得了什么 sticker/bookmark/page progress
- 当前 journal page progress

Wrong answer feedback should be calm and useful:

- "这道题暴露了一个容易混淆的点"
- "已收进心魔回廊"
- "下一局可以整理掉"

Keep accuracy, XP, materials, and demon pressure available where useful, but do not make them the emotional center of the result.

### Post-Run Report

The report should read like a completed journal page:

```text
今日手账页完成
点亮题眼：3/5
已整理心魔：1
新增待整理：1
本页书签：稳修
下一页建议：继续整理“概念混淆”
```

The next action should be specific enough that the player knows why to continue.

### Visual Direction

Use a refined study-space theme:

- paper pages
- bookmarks
- tabs
- stickers
- flower window details
- ink wash edges
- small star points
- osmanthus or lily-of-the-valley accents

Palette should feel clean and warm, not one-note pink. Suggested base direction:

- warm paper background
- ink text
- jade or teal interaction accents
- soft coral reward accents
- muted gold for completion

## Components To Adjust

Likely code surfaces:

- `renderWorldStage` for the start desk title, goal, and primary copy.
- `renderBuildSelectStage` for turning builds into journal styles rather than opaque risk labels.
- `renderBattleFeedback` for answer result copy and reward ordering.
- `createRogueliteRunReport` and report rendering for journal-page completion.
- CSS theme variables and card treatments in `styles.css`.

Likely tests:

- Runtime copy should assert "今日小目标" and journal framing.
- Feedback tests should assert correct and wrong answers use motivating, non-punitive copy.
- Report tests should assert journal summary fields or labels.
- Visual shell tests should guard mobile readability.

## Acceptance Criteria

The first stage is successful when:

1. A new player can understand the next action in 10 seconds.
2. A completed run feels like finishing a visible journal page, not only passing a quiz.
3. Wrong answers feel like organized review targets, not punishment.
4. The UI still works as a fast 5-question study loop on mobile.
5. Existing tests pass, and new tests cover the changed copy and report framing.

## Out Of Scope

- Full character relationship system.
- Large new asset pipeline.
- Shop, gacha, equipment, or decoration economy.
- Replacing the current roguelite run engine.
- Rewriting the question classification pipeline.

## Self Review

- No unresolved placeholders.
- Scope is limited to first-stage player-facing framing and UI feedback.
- The design preserves existing gameplay architecture while changing motivation and presentation.
- The main ambiguity is exact reward naming; the implementation should choose one consistent set rather than mixing all suggested terms.
