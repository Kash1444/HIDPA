# Provenance

## The problem

`AI_APPLICATION_SPEC.md` §53 and §61 forbid fabricating sensor values, model
metrics or predictions, and require demo data to be visibly marked. A rule like
that is easy to state and easy to violate by accident — one placeholder left in
a component during a late night is all it takes.

So it is enforced by the shape of the data rather than by discipline.

## The mechanism

Every value that reaches the screen is wrapped:

```js
{ value, unit, provenance, asOf }
```

`provenance` is one of:

| Value | Meaning | Rendering |
|---|---|---|
| `LIVE` | Measured by the rig, fresher than the stale threshold | Full colour, pulsing dot |
| `STALE` | Measured, but older than the threshold | Value dimmed to `--ink-dim`, banner above |
| `DEMO` | Scripted scenario, never a measurement | Amber badge on every screen |
| `SIMULATED` | Output of the what-if model | Accent badge |
| `UNAVAILABLE` | Not known | Em dash, never a zero |

The last row is the one people get wrong most often. A missing reading rendered
as `0` is indistinguishable from a real zero, and on this rig a real zero is
meaningful — it is what a disconnected flow sensor reports. `<Metric>` therefore
renders `—` for `null` and will not coerce it.

## Where it is enforced

- `src/services/provenance.js` — the type and the ageing function.
- `src/components/Metric.jsx` — refuses to render a bare number; dims anything
  not `LIVE`.
- `src/components/ProvenanceBadge.jsx` — the always-visible badge in the header.
- `src/hooks/useTelemetry.js` — one provenance decision for the whole app, so
  two parts of the screen cannot disagree about freshness.
- `src/services/api.js` — a failed request returns `{ ok: false }`. It never
  substitutes a default.

## Ageing

`LIVE` decays with age, using thresholds from `.env`:

```
age < VITE_STALE_AFTER_S        -> LIVE
age >= VITE_STALE_AFTER_S       -> STALE
age >= VITE_OFFLINE_AFTER_S     -> UNAVAILABLE
```

Defaults are 10s and 30s against a 1 Hz device. This is what the Blynk panel
does not do: there, a value frozen a minute ago renders identically to one that
arrived this second.

## Demo data

`demoScenarios.js` stamps every frame with `isDemo: true` and
`provenance: DEMO`. The backend mirrors this with an `is_demo` column, and its
dataset builder asserts `WHERE is_demo = 0`, so authored frames cannot reach
model training even by accident.
