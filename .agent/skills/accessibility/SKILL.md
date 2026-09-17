---
name: accessibility
description: Design or audit GOP Games routes and game controls for semantic HTML, keyboard access, focus, touch, contrast, reduced motion, forms, dialogs, and screen readers.
---

# Accessibility

Use this skill for any UI feature, visual theme, modal, form, animation, or game control.

## Baseline

- Use semantic landmarks and a skip-to-content link.
- Keep interactive targets at least 44px and keyboard reachable.
- Provide visible theme-aware focus states.
- Use labels, descriptions, field-level errors, and an error summary.
- Implement dialogs with focus containment, Escape, and focus restoration.
- Use `aria-live` sparingly for committed score/result changes.
- Support keyboard and non-animated alternatives for wheels, coins, score flights, and billiard visuals.

## Visual rules

Meet contrast requirements in every game theme. Never communicate ball ownership or score state by color alone; include number, text, icon, pattern, or state label. Test dark mode and reduced-motion preferences.

## Interaction and realtime

Expose connection/degraded state as text, not only an icon. Do not announce animation frames. If a mutation rolls back or conflicts, move focus to a clear actionable status message.

## Verification

Use automated accessibility checks plus keyboard-only and screen-reader-oriented tests on login, navigation, dialogs, match setup, score entry, billiards controls, utilities, search, and result confirmation.

