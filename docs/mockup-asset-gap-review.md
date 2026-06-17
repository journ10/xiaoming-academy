# Mockup Asset Gap Review

Generated mockups reviewed:

- Desktop: `docs/mockups/final-*.png`
- Mobile: `docs/mockups/mobile-*-ai-generated.png`
- Contact sheets:
  - `docs/mockups/desktop-current-assets-contact-sheet.png`
  - `docs/mockups/mobile-ai-generated-contact-sheet.png`

## Summary

The regenerated mockups are now useful as page references: each page reads as a complete product screen, and desktop/mobile pairs keep the same page purpose, role character, and overall ornate academy style.

The mockups should not be treated as final reusable assets. They expose where the current asset library is either incomplete, too fixed-size, or not specialized enough for pixel-level implementation.

Chinese text in the generated mockups should be treated as layout guidance only. Production text should be rendered in code on top of reusable UI backplates, because image generation cannot guarantee exact Chinese copy across iterations.

## Cross-Page Gaps

| Area | Gap | Why It Matters |
| --- | --- | --- |
| Global HUD | Need separate desktop and mobile HUD backplates with clean title/subtitle zones, resource-chip row, and safe icon slot. | Current mockups show a consistent HUD direction, but image-generated text varies. Implementation needs reusable HUD chrome without baked text. |
| Resource chips | Need code-friendly chip backplates in normal/active/disabled states, plus numeric text rendered by code. | Chips appear on every page and must stay consistent across desktop/mobile. |
| Bottom navigation | Need desktop and mobile nav bar variants with active ring, inactive state, notice dot, and label-safe spacing. | Existing nav materials are useful, but final pages need one system that does not collide with content or safe areas. |
| Resizable panels | Need 9-slice or multi-size parchment/dark-glass panels: large content, compact card, modal, advice bubble, list container. | Pixel-level implementation cannot rely on one fixed PNG stretched to every size. |
| Text-bearing UI | Need mostly textless UI backplates for buttons, rows, cards, and panels. | Generated text is not reliable; text should be rendered in code. |
| Character usage | Need consistent full-body, half-body, card-portrait, and avatar variants for 明澈 / 阿芷 / 青岚 / 小墨. | Current standees work for scene placement, but roster cards, dialogue portraits, and mobile side characters need stable crops. |
| State language | Need a shared state set: normal, selected, active, disabled, locked, completed, reward-ready, cooldown, warning. | Mockups use these states across many pages; ad hoc one-off states will make implementation inconsistent. |
| Mobile-safe composition | Need mobile-specific component sizes for nav, answer buttons, task rows, lesson cards, and report cards. | Desktop assets cannot simply be scaled down without hurting touch targets and readability. |

## Page-Specific Gaps

### 1. World Map

- Chapter portal labels/progress tags that can sit beside portals without being baked into the portal art.
- Glowing path segments for desktop curved paths and mobile vertical progression.
- Current-goal / fortune card variants with textless interior.
- Mentor guidance panel variant that can pair with 明澈 without covering the map.

### 2. Story Dialogue

- Desktop and mobile dialogue dock backplates with text-safe interior.
- Speaker nameplate and portrait frame variants for avatar + name + dialogue text.
- Choice stack buttons in normal/selected/disabled states, sized separately for desktop and mobile.
- Optional half-body character variants for dialogue scenes so full standees do not collide with the dialogue dock.

### 3. Training

- Lesson row/card component with icon slot, title, description, completion state, and active state.
- Open-book lesson board backplate with larger text-safe area.
- 阿芷 advice panel/dark glass bubble with textless interior.
- Method icon button states for focus/practice/review.
- Training CTA backplate sized for desktop and mobile.

### 4. Battle

- Mobile answer option buttons with enough height for multiline answer text.
- Desktop answer option buttons arranged as a row without stretching.
- Stance action tray with three states and one release sigil slot.
- Enemy HP bar with textless label/progress zones.
- Player/companion status panel for 青岚 that does not require placing the full standee beside every battle screen.

### 5. Mind Demon

- Wrong-answer category list items with selected/normal/cleared states.
- Pressure gauge variants for desktop side layout and mobile compact layout.
- Purification contract row with checkbox/progress/completed states.
- 小墨 advice bubble/card and a compact companion portrait/half-body variant.
- Purify CTA button with ready/disabled/cooldown states.

### 6. Report Growth

- Textless report paper backplate with separate zones for score, chart, rewards, and recommendation.
- Score ring assets separated into track/fill/highlight, with score rendered by code.
- Radar/growth chart frame that supports code-rendered chart data.
- Reward slot/row components for desktop grid and mobile single-column layout.
- Result stamp states: excellent, passed, review.
- Next-step recommendation card with companion avatar slot.

### 7. Daily

- Task row states: normal, active, completed, claimable, locked.
- Weekly trial path/nodes and chest states that work in horizontal desktop and stacked mobile layouts.
- Claim reward button states: ready, pressed, disabled.
- Daily reward summary row/cards with item slot + quantity text rendered by code.
- Streak badge backplate without baked text.

### 8. Roster Artifacts

- Companion card system with consistent portrait crops, name zone, role badge, rarity/level, and bond bar.
- Separate card portraits/half-body assets for 明澈 / 阿芷 / 青岚 / 小墨; current full-body standees are not enough for card UI.
- Role badge states for guide/training/battle/mind support.
- Artifact card system with rarity frame, selected state, locked state, and stat text zones.
- Material cost chip and upgrade panel/button sized for both desktop and mobile.

## Not Gaps

- Desktop and mobile using different layout positions for the same scene is not a missing asset by itself.
- Minor generated-text inaccuracies are not asset gaps; production text should be rendered by code.
- Background crop differences are not gaps unless a page requires a different functional scene or a UI-safe empty region that does not exist.

## Recommended Next Step

Use these mockups as the visual target for the first pixel-level implementation pass. When implementation hits a component that cannot be recreated cleanly from current assets, generate that specific reusable asset group instead of regenerating whole pages.
