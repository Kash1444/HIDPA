/**
 * Deterministic Diagnostic Engine — browser mirror.
 *
 * The authoritative implementation is the backend's DDE (Python). This module
 * is a faithful JS port so that:
 *   1. demo mode produces real reasoning rather than canned text, and
 *   2. the rules can be reviewed, tested and ported without a running backend.
 *
 * When the backend is reachable, its verdict wins and this module is unused.
 *
 * Nothing here is a machine-learning model. It is physics plus evidence, which
 * is why it works with zero training data and can always explain itself. The
 * ML model, once trained on real experiments, augments this — it does not
 * replace it (spec §8, §68).
 */

import { FW } from './firmwareMirror.js';

const WINDOW = 12; // samples of context, 12 s at 1 Hz

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const std = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** Features the engine reasons over. Kept identical to the backend's names. */
export function computeFeatures(frames) {
  const w = frames.slice(-WINDOW);
  if (!w.length) return null;
  const last = w[w.length - 1];
  const f1 = w.map((f) => f.flow1);
  const f2 = w.map((f) => f.flow2);
  const lv = w.map((f) => f.waterLevelPct);

  // Longest run of exactly-zero flow2 ending at the latest sample.
  let zeroRun = 0;
  for (let i = w.length - 1; i >= 0 && w[i].flow2 === 0; i--) zeroRun++;

  // Largest single-sample drop in flow2 across the window.
  let maxStepDrop = 0;
  for (let i = 1; i < w.length; i++) {
    maxStepDrop = Math.max(maxStepDrop, w[i - 1].flow2 - w[i].flow2);
  }

  const levelRatePerMin = w.length > 1
    ? ((lv[lv.length - 1] - lv[0]) / w.length) * 60
    : 0;

  return {
    flow1: last.flow1,
    flow2: last.flow2,
    flowDiff: last.flow1 - last.flow2,
    flowRatio: last.flow1 > 0 ? last.flow2 / last.flow1 : null, // guarded, spec §21
    flowDropPct: last.flow1 > 0 ? ((last.flow1 - last.flow2) / last.flow1) * 100 : null,
    waterLevel: last.waterLevelPct,
    levelRatePerMin,
    rollMeanDiff: mean(w.map((f) => f.flow1 - f.flow2)),
    rollStdDiff: std(w.map((f) => f.flow1 - f.flow2)),
    rollStdFlow2: std(f2),
    rollStdFlow1: std(f1),
    flow1Drift: Math.abs(f1[f1.length - 1] - f1[0]),
    zeroRunSeconds: zeroRun,
    maxStepDrop,
    flow2ExceedsFlow1: w.filter((f) => f.flow2 > f.flow1 + 3).length,
    samples: w.length
  };
}

/** Per-sensor health, rule-based (spec §67). */
export function assessSensors(features, frames) {
  const out = [];
  const last = frames[frames.length - 1] ?? {};

  // Flow sensor 1
  const fs1Reasons = [];
  let fs1 = 'HEALTHY';
  if (features.rollStdFlow1 === 0 && features.samples >= 8 && features.flow1 > 0) {
    fs1 = 'WARNING';
    fs1Reasons.push('Reading is perfectly constant, which a real impeller rarely is.');
  }
  if (features.flow1 === 0 && features.flow2 > 5) {
    fs1 = 'SUSPECTED FAULT';
    fs1Reasons.push('Downstream flow present with no upstream flow — physically inconsistent.');
  }
  out.push({ id: 'flow1', label: 'Flow sensor 1', pin: 'GPIO 32', state: fs1, reasons: fs1Reasons });

  // Flow sensor 2
  const fs2Reasons = [];
  let fs2 = 'HEALTHY';
  if (features.zeroRunSeconds >= 5 && features.flow1 >= FW.BLOCKAGE_MIN_FLOW1) {
    fs2 = 'SUSPECTED FAULT';
    fs2Reasons.push(`Reads exactly zero for ${features.zeroRunSeconds}s while upstream flow continues.`);
  }
  if (features.maxStepDrop >= 25) {
    if (fs2 === 'HEALTHY') fs2 = 'WARNING';
    fs2Reasons.push(`Fell ${Math.round(features.maxStepDrop)} pulses/s in one sample — a step, not a ramp.`);
  }
  if (features.rollStdFlow2 === 0 && features.samples >= 8) {
    fs2Reasons.push('No sample-to-sample variation at all over the window.');
  }
  if (features.flow2ExceedsFlow1 >= 3) {
    fs2 = 'SUSPECTED FAULT';
    fs2Reasons.push('Downstream flow exceeds upstream flow, which conservation of mass forbids.');
  }
  out.push({ id: 'flow2', label: 'Flow sensor 2', pin: 'GPIO 33', state: fs2, reasons: fs2Reasons });

  // Ultrasonic
  const usReasons = [];
  let us = 'HEALTHY';
  if (last.echoValid === false) {
    us = 'SUSPECTED FAULT';
    usReasons.push('No echo returned; firmware reports this as 0%.');
  } else if (last.echoValid == null) {
    us = 'UNCERTAIN';
    usReasons.push('Echo-validity flag is not exposed by the current firmware.');
  }
  if (features.waterLevel >= 99.5 && features.levelRatePerMin < 0.2 && last.fullLevelCount === 0) {
    us = 'SUSPECTED FAULT';
    usReasons.push('Pinned at 100% with no rise and no full-level count — consistent with a short reading.');
  }
  out.push({ id: 'ultrasonic', label: 'Ultrasonic level', pin: 'GPIO 27/26', state: us, reasons: usReasons });

  return out;
}

const STATE_WEIGHT = { HEALTHY: 1, UNCERTAIN: 0.75, WARNING: 0.6, 'SUSPECTED FAULT': 0.2, OFFLINE: 0 };

export function sensorReliability(sensors) {
  if (!sensors.length) return 0;
  return mean(sensors.map((s) => STATE_WEIGHT[s.state] ?? 0.5));
}

/**
 * The core judgement.
 *
 * The discriminator that matters: a disconnect changes ONE channel and leaves
 * the physical world untouched. A real restriction changes the physics, so it
 * leaves fingerprints on the upstream sensor and the water level. We weigh
 * both hypotheses instead of forcing every anomaly into "blockage" (spec §14).
 */
export function diagnose(frames) {
  const features = computeFeatures(frames);
  if (!features || features.samples < 3) {
    return {
      condition: 'UNCERTAIN',
      risk: null,
      confidence: 0,
      dataQuality: 'POOR',
      sensors: [],
      sensorReliability: 0,
      evidence: [{ tone: 'flat', text: 'Not enough history yet to reason about.' }],
      alternatives: [],
      recommendedAction: 'Wait for the buffer to fill.',
      engine: 'DDE'
    };
  }

  const sensors = assessSensors(features, frames);
  const reliability = sensorReliability(sensors);
  const fs2 = sensors.find((s) => s.id === 'flow2');

  // --- Sensor-fault evidence ------------------------------------------------
  let faultScore = 0;
  const faultEvidence = [];

  if (features.zeroRunSeconds >= 5 && features.flow1 >= FW.BLOCKAGE_MIN_FLOW1) {
    faultScore += 0.34;
    faultEvidence.push({
      tone: 'down',
      text: `Downstream flow has been exactly 0 for ${features.zeroRunSeconds}s while upstream still reads ${features.flow1}.`
    });
  }
  if (features.maxStepDrop >= 25) {
    faultScore += 0.26;
    faultEvidence.push({
      tone: 'down',
      text: `Downstream flow fell ${Math.round(features.maxStepDrop)} pulses/s in a single sample. Closing a valve ramps; a disconnect steps.`
    });
  }
  if (features.rollStdFlow2 === 0 && features.samples >= 8) {
    faultScore += 0.16;
    faultEvidence.push({ tone: 'flat', text: 'Downstream reading has zero variance. A live sensor jitters.' });
  }
  if (features.flow1Drift < 2.5 && features.flowDiff >= FW.BLOCKAGE_DIFFERENCE) {
    faultScore += 0.16;
    faultEvidence.push({
      tone: 'ok',
      text: `Upstream flow is unchanged (drift ${features.flow1Drift.toFixed(1)}). A real restriction would disturb it.`
    });
  }
  if (Math.abs(features.levelRatePerMin) < 0.4 && features.flowDiff >= FW.BLOCKAGE_DIFFERENCE) {
    faultScore += 0.16;
    faultEvidence.push({
      tone: 'ok',
      text: `Water level is flat at ${features.waterLevel.toFixed(1)}% (${features.levelRatePerMin >= 0 ? '+' : ''}${features.levelRatePerMin.toFixed(1)} %/min). Blocked water has to go somewhere.`
    });
  }
  if (features.flow2ExceedsFlow1 >= 3) {
    faultScore += 0.5;
    faultEvidence.push({ tone: 'down', text: 'Downstream exceeds upstream — impossible without a fault.' });
  }
  faultScore = clamp01(faultScore);

  // --- Blockage evidence ----------------------------------------------------
  let blockScore = 0;
  const blockEvidence = [];

  const dropPct = features.flowDropPct ?? 0;
  if (dropPct > 8) {
    blockScore += clamp01(dropPct / 90) * 0.5;
    blockEvidence.push({
      tone: 'up',
      text: `Downstream flow is ${dropPct.toFixed(0)}% below upstream (${features.flow1} → ${features.flow2}).`
    });
  }
  if (features.levelRatePerMin > 0.8) {
    blockScore += clamp01(features.levelRatePerMin / 8) * 0.3;
    blockEvidence.push({
      tone: 'up',
      text: `Water level is rising at ${features.levelRatePerMin.toFixed(1)} %/min.`
    });
  }
  if (features.rollStdDiff > 1.5 && features.maxStepDrop < 25 && dropPct > 8) {
    blockScore += 0.2;
    blockEvidence.push({ tone: 'up', text: 'Flow difference is growing gradually, as a restriction would.' });
  }
  if (features.waterLevel >= 90) {
    blockScore += 0.15;
    blockEvidence.push({ tone: 'up', text: `Water level is at ${features.waterLevel.toFixed(0)}%, near the critical band.` });
  }
  blockScore = clamp01(blockScore);

  // --- Arbitrate ------------------------------------------------------------
  // A suspected sensor fault suppresses the blockage claim rather than
  // competing with it on equal footing: an unverifiable measurement cannot
  // support a maintenance dispatch (spec §17).
  const faultSuspected = fs2?.state === 'SUSPECTED FAULT';
  const total = faultScore + blockScore || 1;
  const pFault = faultScore / total;
  const pBlock = blockScore / total;

  let condition, severity, action, risk;
  const evidence = [];

  if (faultSuspected && faultScore >= blockScore) {
    condition = 'SENSOR_FAULT_SUSPECTED';
    severity = 'DIAGNOSTIC';
    risk = null;
    action = 'Inspect the flow sensor 2 wiring at GPIO 33 before dispatching blockage maintenance.';
    evidence.push(...faultEvidence);
  } else if (features.waterLevel >= 99) {
    condition = 'CRITICAL_WATER_ACCUMULATION';
    severity = 'CRITICAL';
    risk = Math.max(blockScore, 0.85);
    action = 'Follow the existing pump-protection procedure. The firmware latch is authoritative.';
    evidence.push(...blockEvidence);
  } else if (blockScore >= 0.6) {
    condition = 'BLOCKAGE';
    severity = 'HIGH';
    risk = blockScore;
    action = 'Inspect the downstream pipe section.';
    evidence.push(...blockEvidence);
  } else if (blockScore >= 0.3) {
    condition = 'DEVELOPING_BLOCKAGE';
    severity = 'MEDIUM';
    risk = blockScore;
    action = 'Increase monitoring frequency and watch the level trend.';
    evidence.push(...blockEvidence);
  } else if (faultScore > 0.25 && blockScore > 0.25) {
    condition = 'UNCERTAIN';
    severity = 'DIAGNOSTIC';
    risk = blockScore;
    action = 'Evidence conflicts. Verify the sensor before acting on the reading.';
    evidence.push(...faultEvidence, ...blockEvidence);
  } else {
    condition = 'NORMAL';
    severity = 'NONE';
    risk = blockScore;
    action = 'Continue routine monitoring.';
    evidence.push(
      { tone: 'ok', text: `Upstream and downstream agree within ${Math.abs(features.flowDiff)} pulses/s.` },
      { tone: 'ok', text: `Water level steady at ${features.waterLevel.toFixed(1)}%.` }
    );
  }

  // --- Confidence -----------------------------------------------------------
  // Confidence is about how much we trust the *input*, not how loud the
  // output is. Poor data quality must lower it even when the score is extreme
  // (spec §18).
  const separation = Math.abs(faultScore - blockScore);
  const coverage = clamp01(features.samples / WINDOW);
  let confidence = clamp01(0.25 + 0.4 * separation + 0.2 * coverage) * (0.35 + 0.65 * reliability);
  if (condition === 'UNCERTAIN') confidence = Math.min(confidence, 0.45);

  const dataQuality = reliability >= 0.9 ? 'GOOD' : reliability >= 0.6 ? 'FAIR' : 'POOR';

  const alternatives = [
    { label: 'Sensor fault', weight: pFault },
    { label: 'Physical blockage', weight: pBlock }
  ].sort((a, b) => b.weight - a.weight);

  return {
    condition,
    severity,
    risk,
    confidence,
    dataQuality,
    sensors,
    sensorReliability: reliability,
    evidence: evidence.slice(0, 5),
    alternatives,
    recommendedAction: action,
    features,
    engine: 'DDE'
  };
}

/**
 * Drain Health Index (spec §33).
 *
 * DHI = 0.30·flowHealth + 0.25·levelHealth + 0.25·(100 − blockageRisk)
 *     + 0.20·sensorReliability
 *
 * Every term is on a 0–100 scale. The weights are a documented engineering
 * choice, not a fitted result — they are stated here and in docs/DHI.md so a
 * reader can disagree with them explicitly.
 */
export function drainHealthIndex(verdict) {
  const f = verdict.features;
  if (!f) return null;
  const flowHealth = f.flowRatio == null ? 50 : clamp01(f.flowRatio) * 100;
  const levelHealth = Math.max(0, 100 - f.waterLevel);
  const blockageComponent = 100 - (verdict.risk ?? 0) * 100;
  const sensorComponent = verdict.sensorReliability * 100;

  const dhi = 0.30 * flowHealth + 0.25 * levelHealth + 0.25 * blockageComponent + 0.20 * sensorComponent;

  return {
    dhi: Math.round(dhi),
    components: [
      { label: 'Flow health', value: Math.round(flowHealth), weight: 0.30 },
      { label: 'Water level headroom', value: Math.round(levelHealth), weight: 0.25 },
      { label: 'Blockage risk (inverted)', value: Math.round(blockageComponent), weight: 0.25 },
      { label: 'Sensor reliability', value: Math.round(sensorComponent), weight: 0.20 }
    ]
  };
}

export const CONDITION_LABEL = {
  NORMAL: 'Normal',
  DEVELOPING_BLOCKAGE: 'Developing blockage',
  BLOCKAGE: 'Blockage',
  CRITICAL_WATER_ACCUMULATION: 'Critical water accumulation',
  SENSOR_FAULT_SUSPECTED: 'Sensor fault suspected',
  UNCERTAIN: 'Uncertain'
};

export const CONDITION_TONE = {
  NORMAL: 'ok',
  DEVELOPING_BLOCKAGE: 'warn',
  BLOCKAGE: 'alarm',
  CRITICAL_WATER_ACCUMULATION: 'critical',
  SENSOR_FAULT_SUSPECTED: 'alarm',
  UNCERTAIN: 'warn'
};
