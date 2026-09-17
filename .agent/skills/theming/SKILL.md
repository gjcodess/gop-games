---
name: theming
description: Add or review GOP Games dynamic game themes, semantic design tokens, dark mode, typography, animation, and game-specific visual identity.
---

# Theming

Use this skill when adding a game identity, theme mode, token, visual effect, or theme-aware component.

## Token architecture

Resolve semantic tokens in layers: application base, light/dark mode, active game theme, then interaction/accessibility state. Apply tokens as CSS custom properties on the app/game root. Components consume semantic names such as surface, accent, score, focus, and motion tokens; they do not hard-code game hex values.

## Game identities

- Uno No Mercy: aggressive red/black, hard edges, high-impact type and motion.
- Taco Cat Goat Cheese Pizza: pastel, playful, bouncy, friendly.
- Flip 7: casino-table surface, competitive score lanes, chip/card cues.
- Billiards: green felt, rails, numbered ball depth and physical state.

Themes must remain legible in dark mode and must not use color as the only status channel.

## Accessibility and performance

Define contrast-safe token pairs, visible focus tokens, and reduced-motion variants. Animate transforms/opacity where possible. Avoid global selectors that leak between themes. Add a visual regression and contrast check when introducing a theme.

## Extensibility

Register themes by stable game key. Adding a game should add configuration and tokens without rewriting shared components or importing another game's styles.

