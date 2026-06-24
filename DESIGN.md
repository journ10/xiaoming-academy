# DESIGN.md

## Purpose

This document defines durable design rules for 小明书院. It is a design constitution, not a screen specification, feature list, implementation plan, or record of past design problems.

If a mockup, page, feature, or visual treatment conflicts with this document, change the mockup or implementation. If the product direction itself changes, update this document first, then update screens and code.

## Product Positioning

小明书院 is a text-first exam-prep learning game. Its game layer exists to improve focus, recall, review, and continuation, not to decorate a normal quiz app.

The product must make real learning easier to enter and harder to abandon. Game systems should create momentum, stakes, and feedback, but they must not obscure the learning task or distort the source material.

The primary experience is short-cycle study through real questions, focused explanations, review pressure, and progress recovery. Narrative, flavor, and visual atmosphere may exist only when they support that loop.

## Design Priority Order

When design choices conflict, use this priority order:

1. Learning correctness
2. Player comprehension
3. Interaction efficiency
4. Continuity and recoverability
5. Game feeling
6. Visual polish

A lower-priority layer must not weaken a higher-priority layer. For example, atmosphere cannot make text harder to read, and visual novelty cannot make the next action harder to find.

## Language System

Player-facing copy must sound like part of the game experience, not like implementation notes, design annotations, analytics, or audit output.

Use the current product vocabulary consistently. New vocabulary may be introduced only when it gives the player a clearer mental model than an existing term. Do not mix old product metaphors, internal data labels, or temporary design names into player-facing UI.

Copy should be brief, active, and oriented around what the player can do or understand next. Avoid explaining background systems unless the player is making a decision that depends on that knowledge.

When a system is working in the background, do not repeatedly announce it. Surface it only at points where it changes player confidence, recovery, or control.

## Source Material Integrity

The built-in question bank is learning material, not raw content to be freely gamified.

Do not rewrite the meaning of a question, option, answer, explanation, or classification to fit a mechanic. If a design needs a different interaction shape, it must preserve the original learning relationship between prompt, options, answer, and reasoning.

When content appears uncertain, unclear, or manually classified, the interface must not present it as fully verified learning material.

## Core Interaction Principles

Every screen or state must make three things immediately clear:

1. Where the player is
2. What matters now
3. What action moves the run forward

One state should have one dominant action. Secondary actions must be visually and spatially subordinate, and rare actions should not compete with the current learning task.

Critical actions must appear where the player needs them. A player should not have to hunt, scroll, or infer that a new control has appeared after making a decision.

Temporary confirmation, review, or feedback layers may interrupt the normal layout only when they are directly tied to the player's current decision and provide a clear way forward.

## State Expression

Content and state are separate.

Stable content, such as option text, explanations, labels, and learning descriptions, must not change merely because the player selected, focused, hovered, or confirmed something. If the underlying meaning did not change, the text should stay stable.

Use visual treatment to express state: position, emphasis, border, fill, icon, progress, disabled treatment, or motion. Use text only when the state would otherwise be ambiguous.

Every important state must be understandable without relying on color alone. Shape, placement, weight, or text should carry enough meaning for accessibility and low-attention use.

## Feedback Principles

Feedback must help the player understand cause, consequence, and next step.

A result-only message is insufficient when the player needs to learn from the outcome. Feedback should connect the player's action to the reasoning that matters for future attempts.

Feedback should be close to the action that caused it. Do not force the player to compare distant regions of the screen to understand what happened.

Feedback should reduce uncertainty, not add system noise. Avoid repeating status assurances when the state is already clear.

## Continuity And Recovery

The player should feel that progress is durable without needing to understand storage internals.

Recovery and continuation should be available and discoverable, but they must not dominate the main learning flow. Present continuity controls as confidence and control, not as constant reminders.

If the player leaves, returns, switches context, or resumes later, the product should preserve the mental thread: current task, recent outcome, unresolved review pressure, and next useful action.

Destructive or irreversible actions require explicit confirmation. Routine continuation should not require extra ceremony.

## Information Hierarchy

The current learning task has the highest visual priority.

Progress, streaks, recommendations, review pressure, and system controls are supporting information. They should help the player choose or continue action, not become equal-weight panels competing for attention.

Avoid dense surfaces where every card, chip, button, and note has similar emphasis. Hierarchy should be visible through size, spacing, contrast, and placement before the player reads every word.

Long explanations should be progressively disclosed or staged after the player has enough context. Short prompts and decisions should remain uncluttered.

## Navigation Principles

Navigation is for changing destination, not for performing the current task.

Top-level destinations should remain predictable across the product. Deep or temporary states may reduce navigation chrome only when the player is inside a focused action and has a clear next step or exit path.

Do not mix multiple navigation models at the same hierarchy level. Tabs, sidebars, drawers, sheets, and inline controls must each have a distinct role.

The current location must always be visible or inferable from the page title, active navigation state, or focused flow context.

## Cross-Device Principles

PC and mobile must share the same product model, vocabulary, state logic, and learning sequence. They may use different layouts, density, and control placement.

Mobile design should prioritize one-handed reach, safe areas, visible primary actions, and short scanning paths. Fixed bottom controls must not hide necessary content.

PC design should use extra space to improve comparison, context, and review efficiency. It should not become a generic dashboard or split attention across unrelated panels.

A design is cross-device only when the same player decision feels equivalent on both device classes.

## Visual System Principles

Text is the main game surface. Typography, spacing, and contrast must make reading feel effortless.

Interactive targets must be large enough for touch and visually clear enough for repeated use. Hover-only affordances are not sufficient.

Layouts must be stable. State changes should not shift unrelated content, collapse text, clip labels, or cause controls to jump.

Use a coherent color and elevation system. Accent colors should identify meaning and action, not decorate every surface equally.

Cards, panels, chips, and buttons should exist only when they create structure or affordance. Do not wrap every piece of content in a separate container by default.

## Motion Principles

Motion should explain state change, reward progress, or guide attention. It should not compete with reading or become a permanent distraction.

Micro-interactions should feel responsive and brief. Long or decorative animation must be optional and respect reduced-motion preferences.

Motion must not block input, hide important information, or make the player wait before continuing a learning action.

## Design Artifact Governance

Design artifacts must identify the current canonical product shape. Old explorations should be removed, archived, or clearly separated so they cannot be mistaken for current direction.

Do not create a new version label when the task is to revise the current direction. Update the active design directly unless a separate exploration is explicitly requested.

Related PC and mobile designs should stay close enough in the canvas and naming system that reviewers can compare equivalent states without searching.

Design comments and canvas labels may help collaborators, but they must not leak into player-facing copy.

## Review Depth Standard

Design review must reach the level where a real player would experience the interface. A design cannot be considered aligned with this document if it has only been checked at the concept, structure, or layout-tree level.

Every player-visible surface must be reviewed in rendered form at its target device size. Structural validation may prove that nodes exist and do not overflow, but it does not prove that text is visible, layering is correct, alignment is professional, or hierarchy is understandable.

Every player-facing sentence must be read in context. It must be clear whether the sentence helps the player understand the current task, the result, the reason, or the next action. Text that only explains system routing, storage behavior, internal classification, design intent, or implementation safety fails this standard even if the wording is short.

Every repeated component must be checked as a system, not as isolated instances. Navigation items, buttons, cards, chips, option rows, feedback panels, and fixed bars must preserve the same geometry, active state, inactive state, text alignment, and layering rules across equivalent surfaces.

Every interactive state must preserve content integrity. Default, selected, confirmed, disabled, success, error, and continuation states may change emphasis or affordance, but they must not make stable content disappear, move unpredictably, or change meaning unless the underlying state truly changes.

Every primary action must be visually and geometrically verified. Its label must be centered within the control, the control must be reachable where the decision is made, and no competing secondary action may appear to have equal or stronger priority.

Every fixed or overlaying surface must be checked against the content behind it. Bottom navigation, confirmation sheets, sticky actions, and floating panels must not cover required content, hide selected states, or create a false pass by existing in the node tree while being visually obscured.

Every cross-device pair must be compared by player decision, not by visual resemblance alone. If PC and mobile ask the player to make the same decision, they must preserve the same vocabulary, state logic, action priority, and feedback meaning even when their layouts differ.

Automated layout checks are necessary but insufficient. A design with no detected layout problems can still fail this document because of hidden layers, weak hierarchy, misaligned labels, clipped-looking text, confusing copy, inconsistent states, or player-facing system noise.

## Readiness Standard

A design is ready only when its rendered screens satisfy the rules above without needing a designer's explanation. If a reviewer can identify a player-visible inconsistency, unclear state, unstable text, hidden affordance, or misaligned repeated component, the design remains unfinished regardless of whether the file has no structural layout errors.
