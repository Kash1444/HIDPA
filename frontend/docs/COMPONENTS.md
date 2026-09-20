# Components

## Contracts

### `<Metric value unit provenance tone size sub />`
The only way a number reaches the screen.

- `value` — `null` renders `—`, never `0`.
- `provenance` — `STALE` and `UNAVAILABLE` force the value to `--ink-dim`.
- `tone` — `ok | warn | alarm | critical | accent | ink`. Severity only.

### `<ProvenanceBadge provenance detail />`
Always visible in the header. Pulses only for `LIVE`.

### `<Gauge value max tone size label dimmed />`
270° arc, drawn with `pathLength="100"` so the dash array is the percentage
directly. `label` becomes the accessible name; the SVG has `role="img"`.

### `<Tile title tone>{children}</Tile>`
Layout only. `tone` tints the border to match severity.

### `<StatusBanner tone title action>{children}</StatusBanner>`
`role="alert"` for `critical` and `offline`, `role="status"` otherwise, so
screen readers announce a genuine alarm but do not interrupt for information.

### `<EvidenceList evidence />`
`evidence[] = { tone: 'up'|'down'|'flat'|'ok', text }`. Each line must be a
statement defensible from the feature values.

### `<HypothesisBars alternatives />`
`alternatives[] = { label, weight }`, weights summing to 1. Always shows the
runner-up — that is what lets an operator disagree intelligently.

### `<SensorHealthList sensors />`
`sensors[] = { id, label, pin, state, reasons[] }`.

### `<FlowChart frames height />`
Recharts. Animation disabled: an animated line on live telemetry makes it
unclear whether motion is data or transition.

### `<DigitalTwin latest sensors dimmed />`
Mirrors the rig's plumbing order. A sensor under suspicion is drawn **hollow
with a dashed outline** rather than confidently coloured — an unverified
reading should not look like a measurement.

### `<ModeSwitch mode setMode scenario setScenario />`
Live/Demo is a deliberate choice. There is no automatic fallback.

### `<AppShell provenance latest modeProps modelStatus>{children}</AppShell>`
Nav rail, header, model-status card.

## Pages

| Page | Route | Job |
|---|---|---|
| Dashboard | `/` | The five-second answer: condition, confidence, flow, level, health |
| Diagnosis | `/diagnosis` | Why, competing explanations, firmware comparison, sensor health |
| Drain health | `/health` | DHI with its components exposed |
| Analytics | `/analytics` | Session trace and state transitions |
| Device view | `/device` | Raw datastreams, Blynk mirror, consistency flags |
| About | `/about` | What the layer does, and what it deliberately does not |

## Adding a component

1. Take `provenance` if it displays a value.
2. Use tokens; no literal hex in a component.
3. Reserve severity colour for severity.
4. Handle `null` as unknown, never as zero.
5. Give SVG a `role` and an accessible name.
