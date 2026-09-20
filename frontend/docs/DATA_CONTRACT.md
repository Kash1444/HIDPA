# Data contract

What the frontend expects from the FastAPI backend. Every endpoint is GET and
read-only; the UI has no write path to the device by design.

## Envelope

```json
{ "data": { }, "provenance": "LIVE", "as_of": "2026-09-19T06:14:02Z", "warnings": [] }
```

`api.js` unwraps `data` if present and passes the object through otherwise, so
a bare object is also acceptable during early development.

## `GET /api/sensors/latest`

The one endpoint the UI cannot work without.

```json
{
  "ts": "2026-09-19T06:14:02Z",
  "source": "serial",
  "seq": 1841,
  "flow1": 52,
  "flow2": 49,
  "flowDiff": 3,
  "waterLevelPct": 41.2,
  "distanceCm": 24.8,
  "echoValid": true,
  "pumpStatus": "ON - MANUAL",
  "pumpShutdown": false,
  "fwBlockage": false,
  "fullLevelCount": 0,
  "waterLevelStatus": "LOW-MEDIUM",
  "leds": { "blue": true, "green": false, "yellow": true, "red": false }
}
```

Field notes:

- `flow1` / `flow2` are **pulses per second**, not litres per minute. The
  firmware never converts, and neither does the UI, because the conversion
  factor for these sensors has not been calibrated on this rig. Do not invent
  one.
- `distanceCm` and `echoValid` are `null` on the current firmware. `echoValid`
  is the field that makes ultrasonic fault detection possible; without it a
  no-echo reading is indistinguishable from an empty tank, because the firmware
  reports both as `0`.
- `fwBlockage` is the **firmware's** verdict, shown beside the platform's. It is
  not the platform's own conclusion.

## `GET /api/ai/prediction`

When present, this is authoritative and replaces the browser's rule engine.

```json
{
  "condition": "SENSOR_FAULT_SUSPECTED",
  "severity": "DIAGNOSTIC",
  "risk": null,
  "confidence": 0.31,
  "dataQuality": "POOR",
  "sensorReliability": 0.47,
  "engine": "FUSION",
  "evidence": [{ "tone": "down", "text": "Downstream flow has been exactly 0 for 14s…" }],
  "alternatives": [
    { "label": "Sensor fault", "weight": 0.71 },
    { "label": "Physical blockage", "weight": 0.29 }
  ],
  "recommendedAction": "Inspect the flow sensor 2 wiring at GPIO 33…",
  "sensors": [
    { "id": "flow2", "label": "Flow sensor 2", "pin": "GPIO 33",
      "state": "SUSPECTED FAULT", "reasons": ["Reads exactly zero for 14s…"] }
  ]
}
```

`condition` must be one of: `NORMAL`, `DEVELOPING_BLOCKAGE`, `BLOCKAGE`,
`CRITICAL_WATER_ACCUMULATION`, `SENSOR_FAULT_SUSPECTED`, `UNCERTAIN`.

`risk` may be `null`. That is not an error — it means the platform declines to
put a number on blockage risk because the inputs cannot support one. The UI
renders "risk not estimated" rather than `0%`.

`sensors[].state` must be one of: `HEALTHY`, `WARNING`, `UNCERTAIN`,
`SUSPECTED FAULT`, `OFFLINE`.

## `GET /api/ai/model-info`

```json
{ "status": "UNTRAINED — awaiting real training data" }
```

or, once experiments exist:

```json
{
  "status": "Trained",
  "version": "rf-2026-10-02",
  "trainedAt": "2026-10-02T11:20:00Z",
  "nExperiments": 34,
  "nSamples": 2870,
  "metrics": { "accuracy": 0.86, "perClass": { } },
  "validation": "leave-one-experiment-out"
}
```

The UI displays whatever `status` says and never assumes a model is trained. It
will not display an accuracy figure the backend has not sent.

## Other endpoints

| Endpoint | Used by | Notes |
|---|---|---|
| `GET /api/health` | connection check | liveness of process, DB and ingestion |
| `GET /api/sensors/history?window=30m` | analytics | array of `latest` shapes |
| `GET /api/sensors/health` | diagnosis page | array of `sensors[]` shapes |
| `GET /api/drain-health` | health page | `{ dhi, components[] }` |
| `GET /api/alerts` | alerts | `{ id, type, severity, startedAt, status }` |
| `GET /api/diagnostics` | device page | component reachability |

## Errors

Any non-2xx or network failure produces an offline state in the UI. The backend
should never return a synthesised reading to keep the dashboard populated —
a blank screen that says why is more useful than a plausible lie.
