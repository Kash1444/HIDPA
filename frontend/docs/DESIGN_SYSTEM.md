# Design system

## Direction

`AI_APPLICATION_SPEC.md` §59 fixes the direction: deep background, cyan/blue
technology accent, no gaming aesthetic, restrained gradients. The visual
vocabulary of the tiles and arc gauges is borrowed from two references the team
already uses — a weather app's tile grid, and the project's own Blynk panel —
so the layout is familiar to anyone who has used either.

## Colour

Defined in `src/styles/tokens.css`.

| Token | Value | Use |
|---|---|---|
| `--ground` | `#070C15` | Page background |
| `--surface` | `#131C2B` | Tiles and panels |
| `--surface-sunk` | `#0B1220` | Insets, nav, nested blocks |
| `--surface-raised` | `#16263C` | Active nav, pressed controls |
| `--line` | `#24324A` | Borders, gauge tracks |
| `--ink` | `#E6EDF7` | Primary text |
| `--ink-dim` | `#8FA3BF` | Labels, secondary text |
| `--accent` | `#38BDF8` | Neutral data, primary series |
| `--accent-alt` | `#A78BFA` | Second data series only |
| `--ok` | `#34D399` | Normal / healthy |
| `--warn` | `#FBBF24` | Caution, demo badge |
| `--alarm` | `#FB923C` | Blockage, suspected sensor fault |
| `--critical` | `#F87171` | Critical level, offline |

**The one rule that matters:** green, amber, orange and red are reserved for
severity and are never used decoratively. If a colour appears, it is making a
claim about how bad something is. This is why the Blynk panel's orange chrome
was not carried over — there, `CRITICAL`, `NORMAL` and the pump button are all
roughly the same hue, so colour carries no information.

Contrast: all text pairs meet WCAG AA (4.5:1) against their own background.
`--ink-dim` on `--surface` is 7.0:1; `--ink-faint` is used only for chart tick
labels at 11px and above, never for prose.

## Type

Three faces, each with a distinct job:

- **Space Grotesk** (500/700) — numerals and headings. Chosen for its tight,
  slightly technical geometry and because its figures are unambiguous at a
  glance, which matters when the number is a flow rate.
- **IBM Plex Sans** (400/500/600) — all prose and labels. It belongs to an
  engineering lineage and reads cleanly at 13px on a dark ground.
- **IBM Plex Mono** (400/500) — raw datastream values, pin numbers, timestamps.
  Used where a value is literally what the device said, which visually separates
  measurements from the platform's own words.

Scale: 11 / 13 / 16 / 22 / 34 px. Numerals use `font-variant-numeric:
tabular-nums` so values do not shift as they update.

**Deliberate divergence from the artboards:** the early mockups used tracked
all-caps eyebrow labels above every tile. Those were dropped for sentence case.
All-caps survives in exactly one place — literal firmware strings such as
`NORMAL`, `CRITICAL` and `BLOCKAGE DETECTED` — where the uppercase is a quotation
of the device, not decoration.

## Space and shape

4px base scale (`--s1` … `--s7`). Three radii, each tied to a level of
hierarchy rather than applied uniformly: `--r-chip` 10px for badges and buttons,
`--r-tile` 16px for tiles, `--r-panel` 20px for full panels.

## Motion

One piece of non-user-triggered motion exists in the whole product: the pulsing
dot on the live provenance badge. It has a job — it answers "is this screen
frozen?" without the operator having to read a timestamp. Everything else moves
only in response to an action. `prefers-reduced-motion` disables it.

## Layout

Desktop is a 224px navigation rail plus a fluid content column. Tiles are a
5-up grid that collapses to 2-up below 900px and 1-up below 560px. Charts use
`ResponsiveContainer`, so they reflow rather than clip.
