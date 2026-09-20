/**
 * Adapter between the existing DrainGuard FastAPI backend
 * and the friend's React frontend data model.
 *
 * IMPORTANT:
 * The backend is authoritative and is not modified.
 * This file only translates backend field names/shapes.
 */

import { PROV } from './provenance.js';

function toNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSensors(sensorHealth = {}) {
  const labels = {
    flow1: { label: 'Flow sensor 1', pin: 'GPIO 32' },
    flow2: { label: 'Flow sensor 2', pin: 'GPIO 33' },
    ultrasonic: { label: 'Ultrasonic level', pin: 'GPIO 27/26' }
  };

  return Object.entries(labels).map(([id, meta]) => ({
    id,
    label: meta.label,
    pin: meta.pin,
    state: sensorHealth[id] ?? 'UNCERTAIN',
    reasons: []
  }));
}

function normalizeDiagnosis(diagnosis = {}, raw) {
  const sensors = normalizeSensors(raw?.sensor_health);

  const condition = diagnosis.condition ?? 'UNCERTAIN';

  const risk =
    diagnosis.risk_score == null
      ? null
      : toNumber(diagnosis.risk_score);

  const confidence = toNumber(diagnosis.confidence, 0);

  const sensorReliability = toNumber(
    diagnosis.sensor_reliability,
    0
  );

  const severity = diagnosis.severity ?? 'UNKNOWN';

  const dataQuality =
    sensorReliability >= 0.9
      ? 'GOOD'
      : sensorReliability >= 0.6
        ? 'FAIR'
        : 'POOR';

  const evidence = Array.isArray(diagnosis.reasons)
    ? diagnosis.reasons.map((text) => ({
        tone: 'flat',
        text
      }))
    : [];

  const flowDifference = toNumber(raw?.flow_difference, 0);
  const flowRatio = raw?.flow_ratio == null
    ? null
    : toNumber(raw.flow_ratio);

  const alternatives = [
    {
      label: 'Sensor fault',
      weight: condition === 'SENSOR_FAULT_SUSPECTED' ? 1 : 0
    },
    {
      label: 'Physical blockage',
      weight:
        risk == null
          ? 0
          : risk
    }
  ];

  return {
    condition,
    severity,
    risk,
    confidence,
    dataQuality,
    sensors,
    sensorReliability,
    evidence,
    alternatives,
    recommendedAction:
      diagnosis.recommended_action ??
      'Continue monitoring.',

    features: {
      flow1: toNumber(raw?.flow1, 0),
      flow2: toNumber(raw?.flow2, 0),
      flowDiff: flowDifference,
      flowRatio,
      waterLevel: toNumber(raw?.water_level, 0)
    },

    modelUsed: diagnosis.model_used ?? false,
    modelStatus:
      diagnosis.model_status ?? 'RULE_BASED_FALLBACK',

    engine: diagnosis.model_used ? 'FUSION' : 'DDE'
  };
}

/**
 * Convert one /api/sensors/latest response into the
 * structure expected by the React frontend.
 */
export function normalizeTelemetry(raw) {
  if (!raw) return null;

  const blockageStatus =
    String(raw.blockage_status ?? '').toUpperCase();

  const waterLevelStatus =
    raw.water_level_status ?? 'UNKNOWN';

  return {
    // Timestamp
    ts: raw.timestamp ?? null,

    // Original backend metadata
    id: raw.id ?? null,
    source: raw.source ?? null,

    // Flow
    flow1: toNumber(raw.flow1, 0),
    flow2: toNumber(raw.flow2, 0),
    flowDiff: toNumber(
      raw.flow_difference,
      toNumber(raw.flow1, 0) - toNumber(raw.flow2, 0)
    ),

    flowRatio:
      raw.flow_ratio == null
        ? null
        : toNumber(raw.flow_ratio),

    // Water
    waterLevelPct: toNumber(raw.water_level, 0),
    waterLevelStatus,

    // Pump
    pumpStatus: raw.pump_status ?? 'UNKNOWN',

    // Firmware state
    fwBlockage:
      blockageStatus === 'BLOCKAGE' ||
      blockageStatus === 'BLOCKED' ||
      blockageStatus === 'BLOCKAGE_DETECTED',

    blockageStatus,

    // Firmware counters
    fullLevelCount: toNumber(raw.full_level_count, 0),

    // LEDs
    leds: {
      blue: Boolean(raw.blue_led),
      green: Boolean(raw.green_led),
      yellow: Boolean(raw.yellow_led),
      red: Boolean(raw.red_led)
    },

    // Keep original backend data available for debugging
    backend: raw,

    // Provenance
    isDemo: false,
    provenance: PROV.LIVE
  };
}

/**
 * Convert the backend /api/ai/prediction response into
 * the structure expected by the React diagnosis UI.
 */
export function normalizePrediction(raw, latestRaw = null) {
  if (!raw) return null;

  const diagnosis = raw.diagnosis ?? raw;

  return normalizeDiagnosis(
    diagnosis,
    latestRaw ?? raw
  );
}