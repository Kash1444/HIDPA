# Diagnostic rules

The reasoning in `src/services/diagnosis.js`, stated in full so it can be
reviewed, argued with, and ported to the backend.

None of this is machine learning. It is physics plus evidence, which is why it
works with zero training data and can always explain itself. The ML model, once
trained on recorded experiments, augments this — it does not replace it.

## The core discriminator

> A disconnect changes **one channel** and leaves the physical world untouched.
> A real restriction changes the physics, so it leaves fingerprints on the
> upstream sensor and on the water level too.

Everything below is a way of asking "did anything else react?"

## Features

Computed over a rolling 12-sample window (12 s at 1 Hz):

| Feature | Definition |
|---|---|
| `flowDiff` | `flow1 − flow2` |
| `flowRatio` | `flow2 / flow1`, `null` when `flow1 = 0` (guarded) |
| `flowDropPct` | `(flow1 − flow2) / flow1 × 100` |
| `levelRatePerMin` | Level change across the window, scaled to %/min |
| `rollStdFlow2` | Standard deviation of downstream flow |
| `flow1Drift` | `|flow1[last] − flow1[first]|` |
| `zeroRunSeconds` | Consecutive samples of exactly `0` ending now |
| `maxStepDrop` | Largest single-sample fall in `flow2` in the window |
| `flow2ExceedsFlow1` | Count of samples where `flow2 > flow1 + 3` |

## Sensor-fault evidence

| Condition | Weight | Why it is evidence |
|---|---|---|
| `zeroRunSeconds ≥ 5` and `flow1 ≥ 20` | +0.34 | Downstream dead while upstream flows |
| `maxStepDrop ≥ 25` | +0.26 | A closing valve ramps; a disconnect steps |
| `rollStdFlow2 = 0` over ≥ 8 samples | +0.16 | A live impeller jitters; a dead line does not |
| `flow1Drift < 2.5` while `flowDiff ≥ 15` | +0.16 | A real restriction disturbs upstream |
| `|levelRatePerMin| < 0.4` while `flowDiff ≥ 15` | +0.16 | Blocked water has to accumulate somewhere |
| `flow2ExceedsFlow1 ≥ 3` | +0.50 | Conservation of mass forbids it |

## Blockage evidence

| Condition | Weight | Why |
|---|---|---|
| `flowDropPct > 8` | up to +0.50, scaled | Downstream is losing flow |
| `levelRatePerMin > 0.8` | up to +0.30, scaled | Water is accumulating |
| Diff growing gradually, `maxStepDrop < 25` | +0.20 | Ramp shape fits a restriction |
| `waterLevel ≥ 90` | +0.15 | Near the critical band |

## Arbitration

A suspected sensor fault **suppresses** the blockage claim rather than competing
with it on equal terms. An unverifiable measurement cannot justify a maintenance
dispatch. Order of decision:

1. Sensor fault suspected and `faultScore ≥ blockScore` → `SENSOR_FAULT_SUSPECTED`, `risk = null`
2. `waterLevel ≥ 99` → `CRITICAL_WATER_ACCUMULATION`
3. `blockScore ≥ 0.6` → `BLOCKAGE`
4. `blockScore ≥ 0.3` → `DEVELOPING_BLOCKAGE`
5. Both scores > 0.25 → `UNCERTAIN` (a first-class answer, not an error)
6. Otherwise → `NORMAL`

## Confidence

```
confidence = clamp01(0.25 + 0.4·separation + 0.2·coverage) × (0.35 + 0.65·reliability)
```

Confidence is about how much the **input** can be trusted, not how loud the
output is. Poor sensor reliability lowers it even when a score is extreme. That
is the whole point: a system that is certain while its sensors are broken is
worse than one that admits doubt.

## Drain Health Index

```
DHI = 0.30·flowHealth + 0.25·levelHeadroom + 0.25·(100 − blockageRisk) + 0.20·sensorReliability
```

The weights are a documented engineering judgement, not a fitted result. They
are stated here so a reader can disagree with them explicitly.

## Measured behaviour

Run against the scripted scenarios (`node` over `demoScenarios` + `diagnosis`):

| Check | Result |
|---|---|
| Fault flagged after a normal period | **5 s** |
| Fault flagged after a severe blockage | **12 s** |
| Severe blockage misread as a sensor fault | **0 of 46 samples** |
| Normal misclassified | **0 of 16 samples** |

The 5 s versus 12 s difference is not a defect. When the fault follows a real
blockage, the water level genuinely was rising, and that evidence stays in the
12-sample window until it ages out. The system holds the blockage hypothesis
until the physical evidence for it expires, which is the correct behaviour.

**These figures describe the rules running on authored scenarios. They are not
accuracy metrics and must never be presented as such.** Real metrics require
recorded experiments and leave-one-experiment-out validation.

## Known limits

- Thresholds are engineering choices, not tuned against recorded data.
- Ultrasonic fault detection is weak until the firmware exposes `echoValid`,
  because no-echo and an empty tank are currently the same byte.
- The 100%-reading failure mode (a short echo presenting as flooding) is
  detected only by its inconsistency with the full-level counter.
- Flow units are pulses/second throughout. No litres-per-minute conversion is
  claimed, because these sensors have not been calibrated on this rig.
