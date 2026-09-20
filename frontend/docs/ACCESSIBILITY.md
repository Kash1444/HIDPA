# Accessibility

The quality floor, built in rather than retrofitted.

## Colour and contrast
- All text meets WCAG AA (4.5:1) against its own background. `--ink-dim` on
  `--surface` is 7.0:1.
- Colour never carries meaning alone. Every severity state also has a word
  (`Suspected fault`), a shape (hollow dashed sensor in the twin), or an icon.
  This matters here more than usual: green/amber/red severity is exactly the
  encoding that fails for the most common form of colour blindness.

## Keyboard
- Every control is a real `<button>`, `<a>` or `<select>`.
- `:focus-visible` gives a 2px accent ring with a ground-coloured offset, so it
  is visible on every surface.
- Interactive targets are at least 40px tall; 44px in the mobile layouts.

## Screen readers
- `StatusBanner` uses `role="alert"` for critical and offline states, and
  `role="status"` otherwise, so an alarm interrupts and information does not.
- Gauges and the digital twin are `role="img"` with a descriptive
  `aria-label` that states the actual values.
- The mode switch uses `aria-pressed`; the nav is a labelled `<nav>`.
- `.sr-only` labels selects that are visually self-evident.

## Motion
- One non-user-triggered animation exists (the live dot).
- `prefers-reduced-motion: reduce` collapses all durations to ~0.
- Chart animation is off, so movement always means the data changed.

## Responsive
- 5-up tiles → 2-up below 900px → 1-up below 560px.
- Charts reflow via `ResponsiveContainer`.
- No horizontal scroll at 360px.

## Not yet done
- No automated axe run in CI.
- The nav rail does not collapse to a drawer on small screens; it stacks.
- Screen-reader testing has been reasoned about, not performed with NVDA or
  VoiceOver. Worth doing before the competition if time allows.
