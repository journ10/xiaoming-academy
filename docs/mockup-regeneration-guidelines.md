# Mockup Regeneration Guidelines

## Goal

Regenerate desktop and mobile mockup pages as product reference images first, then use the pixel-level implementation pass to identify which assets are missing, mismatched, or unsuitable.

The mockups should reduce asset waste by respecting the current asset library's style and functional vocabulary, but they do not need to force every existing asset into the page if the asset does not fit the required layout.

## Source Of Truth

- Existing `assets/generated` files define the current visual direction: Chinese fantasy academy, jade-and-gold parchment UI, soft night lantern lighting, ornate chapter portals, character standees, combat demons, and decorative game interface elements.
- Mockup pages define the target screen composition and cross-device behavior.
- Any visual element required by a mockup but absent or unsuitable in `assets/generated` must be recorded as an asset gap for later generation.

## Generation Rules

- Generate each mockup as a complete page image with `image_gen`, not as a deterministic coordinate collage.
- Use existing assets as style and functional references, not as a contact-sheet layout to imitate.
- Avoid passing dense asset boards as the primary reference because that encourages stretched/collaged output.
- Use the same page contract for desktop and mobile: same scene, same character role, same main task, same component vocabulary.
- Mobile must be a real responsive redesign, not a crop of desktop.
- Chinese text in image mockups is a visual guide; exact production text should be rendered by code during pixel-level implementation.

## Required Pages

1. World Map: chapter progression, current goal, mentor guidance, global navigation.
2. Story Dialogue: two-character story scene, dialogue dock, action choices.
3. Training: short lesson board, topic breakdown, practice CTA, guide character.
4. Battle: enemy, question panel, answer choices, stance actions.
5. Mind Demon: wrong-answer cleanup, pressure state, purification contract, Xiao Mo guidance.
6. Report Growth: score, radar/progress summary, rewards, next-step suggestion.
7. Daily: daily tasks, weekly trial, reward state.
8. Roster Artifacts: companion cards, bond state, artifact upgrade.

## Consistency Checks

- Desktop and mobile for the same page must share the same page identity, scene, role character, and primary UI purpose.
- Global HUD and bottom navigation should look like one product system across all pages.
- Characters should not change identity between pages unless the page role changes.
- UI panels, buttons, cards, and chips should stay within the same ornate material language.
- No page should contain duplicate global navigation, broken Chinese, obvious text overlap, or UI covering the character's face/body in a way that harms readability.

## Asset Gap Criteria

Record an asset gap when:

- A mockup requires a reusable component that does not exist in `assets/generated`.
- An existing asset exists but its shape, resolution, or state does not fit desktop and mobile implementation.
- Desktop and mobile need the same functional component but the current asset only works for one layout.
- The mockup reveals a missing state: selected, disabled, locked, active, complete, reward-ready, cooldown, warning, or empty.

Do not record a gap merely because desktop and mobile place the same scene differently.
