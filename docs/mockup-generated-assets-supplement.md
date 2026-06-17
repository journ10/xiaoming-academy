# Mockup Generated Assets Supplement

This document lists the assets generated to support pixel-level implementation of the current desktop and mobile mockups.

Generation method:

- Visual source: `image_gen`
- Transparency/post-processing: chroma-key removal only
- No SVG creation
- No PIL-created visual placeholders

The `_sources/imagegen` files are the original image-generation outputs. The `*-alpha.png` files are the transparent working assets after chroma-key removal.

## Global UI

| Asset | Output | Source |
| --- | --- | --- |
| Desktop textless HUD backplate | `assets/generated/ui/shell/mockup-hud-desktop-textless-alpha.png` | `assets/generated/_sources/imagegen/ui/shell/mockup-hud-desktop-textless-source.png` |
| Mobile textless HUD backplate | `assets/generated/ui/shell/mockup-hud-mobile-textless-alpha.png` | `assets/generated/_sources/imagegen/ui/shell/mockup-hud-mobile-textless-source.png` |
| Desktop bottom navigation backplate | `assets/generated/ui/nav/mockup-bottom-nav-desktop-alpha.png` | `assets/generated/_sources/imagegen/ui/nav/mockup-bottom-nav-desktop-source.png` |
| Mobile bottom navigation backplate | `assets/generated/ui/nav/mockup-bottom-nav-mobile-alpha.png` | `assets/generated/_sources/imagegen/ui/nav/mockup-bottom-nav-mobile-source.png` |
| Parchment panel component sheet | `assets/generated/ui/mockup-panels/parchment-panel-sheet-alpha.png` | `assets/generated/_sources/imagegen/ui/panels/mockup-parchment-panel-sheet-source.png` |
| Dark glass panel component sheet | `assets/generated/ui/mockup-panels/dark-panel-sheet-alpha.png` | `assets/generated/_sources/imagegen/ui/panels/mockup-dark-panel-sheet-source.png` |

## Page Components

| Page | Output | Source |
| --- | --- | --- |
| World map components | `assets/generated/map/mockup-components/world-map-components-alpha.png` | `assets/generated/_sources/imagegen/map/mockup-world-map-components-source.png` |
| Story dialogue components | `assets/generated/story/mockup-components/story-components-alpha.png` | `assets/generated/_sources/imagegen/story/mockup-story-components-source.png` |
| Training lesson components | `assets/generated/training/mockup-components/training-components-alpha.png` | `assets/generated/_sources/imagegen/training/mockup-training-components-source.png` |
| Battle quiz components | `assets/generated/battle/mockup-components/battle-components-alpha.png` | `assets/generated/_sources/imagegen/battle/mockup-battle-components-source.png` |
| Mind demon components | `assets/generated/mind-demon/mockup-components/mind-demon-components-alpha.png` | `assets/generated/_sources/imagegen/mind-demon/mockup-mind-demon-components-source.png` |
| Growth report components | `assets/generated/report/mockup-components/report-components-alpha.png` | `assets/generated/_sources/imagegen/report/mockup-report-components-source.png` |
| Daily task components | `assets/generated/daily/mockup-components/daily-components-alpha.png` | `assets/generated/_sources/imagegen/daily/mockup-daily-components-source.png` |
| Roster/artifact components | `assets/generated/roster/mockup-components/roster-artifact-components-alpha.png` | `assets/generated/_sources/imagegen/roster/mockup-roster-artifact-components-source.png` |

## Characters And Items

| Asset | Output | Source |
| --- | --- | --- |
| Character UI variants: card portrait, half-body, circular avatar | `assets/generated/characters/mockup-variants/character-ui-variants-alpha.png` | `assets/generated/_sources/imagegen/characters/mockup-character-ui-variants-source.png` |
| Reward/item/artifact icon sheet | `assets/generated/items/mockup-components/item-artifact-icon-sheet-alpha.png` | `assets/generated/_sources/imagegen/items/mockup-item-artifact-icon-sheet-source.png` |

## Split Assets

The following files are crop extractions from the image-generated sheets above. Cropping is post-processing only; no new visual content was drawn with PIL or SVG.

Character splits:

- `assets/generated/characters/mockup-variants/split/mingche-bust.png`
- `assets/generated/characters/mockup-variants/split/mingche-half.png`
- `assets/generated/characters/mockup-variants/split/mingche-avatar.png`
- `assets/generated/characters/mockup-variants/split/azhi-bust.png`
- `assets/generated/characters/mockup-variants/split/azhi-half.png`
- `assets/generated/characters/mockup-variants/split/azhi-avatar.png`
- `assets/generated/characters/mockup-variants/split/qinglan-bust.png`
- `assets/generated/characters/mockup-variants/split/qinglan-half.png`
- `assets/generated/characters/mockup-variants/split/qinglan-avatar.png`
- `assets/generated/characters/mockup-variants/split/xiaomo-bust.png`
- `assets/generated/characters/mockup-variants/split/xiaomo-half.png`
- `assets/generated/characters/mockup-variants/split/xiaomo-avatar.png`

Item/artifact splits:

- `assets/generated/items/mockup-components/split/currency-star-sand.png`
- `assets/generated/items/mockup-components/split/currency-spirit-page.png`
- `assets/generated/items/mockup-components/split/material-ink-jade.png`
- `assets/generated/items/mockup-components/split/artifact-heart-token.png`
- `assets/generated/items/mockup-components/split/artifact-lotus-token.png`
- `assets/generated/items/mockup-components/split/artifact-brush.png`
- `assets/generated/items/mockup-components/split/artifact-bell.png`
- `assets/generated/items/mockup-components/split/artifact-medallion.png`
- `assets/generated/items/mockup-components/split/artifact-mirror.png`
- `assets/generated/items/mockup-components/split/artifact-book.png`
- `assets/generated/items/mockup-components/split/reward-spark-burst.png`
- `assets/generated/items/mockup-components/split/material-stone.png`
- `assets/generated/items/mockup-components/split/material-scroll.png`
- `assets/generated/items/mockup-components/split/lotus-reward.png`
- `assets/generated/items/mockup-components/split/rarity-gem-common.png`
- `assets/generated/items/mockup-components/split/rarity-gem-rare.png`
- `assets/generated/items/mockup-components/split/rarity-gem-epic.png`
- `assets/generated/items/mockup-components/split/rarity-gem-legendary.png`
- `assets/generated/items/mockup-components/split/reward-chest-token.png`

## Notes For Implementation

- Treat these sheets as implementation source material. If the implementation needs individually addressable pieces, crop from these image-generated sheets or regenerate the exact single component with `image_gen`.
- Text should still be rendered by code. These assets intentionally avoid baked Chinese labels and numbers.
- If a generated sheet contains a component that is visually good but awkward to crop, regenerate that exact component as a single image instead of redrawing it procedurally.
- The split character files are convenience crops. For exact edge particles or alternate framing, use `characters.mockup.uiVariants.sheet` as the canonical source.
