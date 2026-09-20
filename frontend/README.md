# DrainGuard AI — user interface

The software intelligence layer for an existing ESP32 drainage rig. The hardware
already measures flow at two points, measures reservoir level, drives a pump and
decides for itself whether a blockage is present. This interface answers a
different question: **can that decision be trusted right now?**

It is deliberately read-only. The pump, the relay and the safety latch stay with
the firmware, so a fault in this layer cannot move hardware.

---

## Quick start

```bash
npm install
cp .env.example .env     # optional; defaults work with the Vite proxy
npm run dev              # http://localhost:5173
```

Without a backend running, the app shows an honest offline state. Switch the
source control at the top to **Demo** to walk through every screen using
scripted scenarios, which are badged as demo data everywhere they appear.

```bash
npm run build            # production build into dist/
npm run preview          # serve the build locally
```

## What is in here

| Path | Purpose |
|---|---|
| `src/services/provenance.js` | The origin type every number carries |
| `src/services/api.js` | Backend client; fails loudly, never invents data |
| `src/services/firmwareMirror.js` | Faithful port of the rules in `DBDS_code.ino` |
| `src/services/diagnosis.js` | Deterministic Diagnostic Engine (browser mirror) |
| `src/services/demoScenarios.js` | Scripted scenarios, all tagged `DEMO` |
| `src/hooks/useTelemetry.js` | Single telemetry source for the whole app |
| `src/components/` | Presentational pieces |
| `src/pages/` | The six screens |
| `docs/` | Architecture, design system, data contract, rules, runbook |

## Documentation

- [Architecture](docs/UI_ARCHITECTURE.md) — how data flows and why the layers split that way
- [Design system](docs/DESIGN_SYSTEM.md) — tokens, type, colour rules
- [Components](docs/COMPONENTS.md) — every component, its props and its contract
- [Data contract](docs/DATA_CONTRACT.md) — exactly what the backend must return
- [Provenance](docs/PROVENANCE.md) — the anti-fabrication mechanism
- [Diagnostic rules](docs/DIAGNOSTIC_RULES.md) — the reasoning, with measured behaviour
- [Demo runbook](docs/DEMO_RUNBOOK.md) — the competition script
- [Accessibility](docs/ACCESSIBILITY.md) — the quality floor

## Honest status

- The ML model is **untrained**. No accuracy figure is displayed anywhere,
  because none has been measured. Verdicts come from the rule engine, which
  needs no training data and can always explain itself.
- Demo scenarios are **authored**, not recorded. They are plausible for this rig
  but they are not measurements, and the backend's dataset builder rejects them.
- The rule thresholds are engineering choices, documented in
  `docs/DIAGNOSTIC_RULES.md`. They have not been tuned against recorded
  experiments, because those experiments have not been captured yet.
