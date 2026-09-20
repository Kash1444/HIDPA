# UI architecture

## The shape of the problem

The rig publishes a small number of values once per second. Turning those into a
dashboard is easy and not very useful. The hard part is that **any of those
values can be wrong**, and a wrong value looks exactly like a right one.

Two concrete cases from this hardware:

1. **Flow sensor 2 disconnected.** `INPUT_PULLUP` means the line floats high, no
   edges are counted, and the sensor reads exactly `0`. The firmware rule
   `flow1 >= 20 && diff >= 15` is then trivially satisfied, so the device
   reports `BLOCKAGE DETECTED` with full confidence.
2. **Ultrasonic reading short.** The firmware maps distance to percentage
   linearly. An obstruction or a fault that returns a small duration maps to
   **100%**, which presents as flooding.

So the interface is built around a single idea: every number arrives with its
origin and its trustworthiness attached, and the interface renders both.

## Layers

```
        ┌───────────────────────────────────────────┐
        │  ESP32 firmware  (unchanged, authoritative)│
        │  sensors · thresholds · pump · safety latch│
        └───────────────┬───────────────────────────┘
                        │ serial 2 Hz  /  Blynk 1 Hz
        ┌───────────────▼───────────────────────────┐
        │  FastAPI backend                           │
        │  ingest · validate · features · DDE · ML   │
        └───────────────┬───────────────────────────┘
                        │ REST, read-only
        ┌───────────────▼───────────────────────────┐
        │  useTelemetry()                            │
        │  one buffer · one provenance decision      │
        └───────┬───────────────────────┬───────────┘
                │                       │
        ┌───────▼────────┐      ┌───────▼───────────┐
        │ backend verdict │  or  │ diagnosis.js       │
        │ (authoritative) │      │ (mirror, demo/offline)│
        └───────┬────────┘      └───────┬───────────┘
                └───────────┬───────────┘
                    ┌───────▼────────┐
                    │  six screens    │
                    └────────────────┘
```

## Why the diagnostic engine exists twice

`diagnosis.js` is a JS port of the backend's Python DDE. Duplicated logic is
normally a mistake, so the reasoning for it:

- **Demo mode produces real reasoning.** Scripted frames go through the actual
  rules and get a real verdict with real evidence, instead of canned text that
  could drift away from what the system does.
- **The rules stay reviewable.** A reader can follow the whole argument in one
  file without a Python environment.
- **The backend stays authoritative.** When a backend verdict is present,
  `useTelemetry` uses it and the local engine is unused. They never blend.

If they ever disagree on the same input, the backend is right and the port has a
bug. `docs/DIAGNOSTIC_RULES.md` lists the thresholds so the two can be diffed.

## Why there is no automatic demo fallback

When the backend is unreachable, the app renders an offline state. It does not
quietly switch to demo data. An outage is exactly when an operator most needs to
know that the screen is not telling them about the real world, and a dashboard
that keeps showing plausible numbers through an outage is worse than one that
goes blank.

Demo mode is therefore a deliberate, visible choice in the header, and it paints
a badge on every screen while it is on.

## State ownership

There is one buffer (`useTelemetry`, 300 samples ≈ 5 minutes) and one provenance
decision, both at the top of the tree and passed down. No component fetches for
itself. This means freshness cannot disagree between two parts of the screen,
which is the usual way dashboards start lying.
