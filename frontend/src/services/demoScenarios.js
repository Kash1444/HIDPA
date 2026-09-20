/**
 * Scripted demo scenarios.
 *
 * These are NOT measurements and are never presented as such: every frame
 * carries provenance DEMO and isDemo: true, and the backend's dataset builder
 * refuses rows with is_demo = 1.
 *
 * They exist so the interface can be rehearsed and reviewed without the rig
 * powered up, and so the UI's states can be exercised in a test.
 *
 * Values are plausible for this prototype but are authored, not recorded.
 * Replace this module with recorded CSV replay once experiments are captured.
 */

import { firmwareBlockage, firmwareLeds, waterLevelStatus } from './firmwareMirror.js';
import { PROV } from './provenance.js';

/** Deterministic jitter so a demo run is identical every time. */
function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * Phase definitions.
 *
 * Each phase declares flow rates and a water-level RATE, not an absolute
 * level. Level is then integrated across the whole run, so phases join
 * continuously. An earlier version declared absolute levels per phase, which
 * produced a step at every boundary and made the level look like it was
 * rising fast when it was not.
 */
const START_LEVEL = 41;

const PHASES = {
  normal: {
    label: 'Normal',
    seconds: 20,
    at: () => ({ flow1: 52, flow2: 49, levelRate: 0.2 })
  },
  partial: {
    label: 'Partial blockage',
    seconds: 25,
    at: (t, n) => ({ flow1: 52 - 1 * (t / n), flow2: 49 - 19 * (t / n), levelRate: 4 })
  },
  severe: {
    label: 'Severe blockage',
    seconds: 25,
    at: (t, n) => ({ flow1: 51 - 1 * (t / n), flow2: 30 - 16 * (t / n), levelRate: 26 })
  },
  sensorFault: {
    label: 'Flow sensor 2 disconnected',
    seconds: 25,
    at: () => ({ flow1: 51, flow2: 0, levelRate: 0.1, faultInjected: 'flow2' })
  },
  recovery: {
    label: 'Recovery',
    seconds: 25,
    at: (t, n) => ({ flow1: 52, flow2: 14 + 34 * (t / n), levelRate: -30 })
  },
  rapidRise: {
    label: 'Rapid water rise',
    seconds: 25,
    at: () => ({ flow1: 58, flow2: 56, levelRate: 84 })
  },
  critical: {
    label: 'Critical level',
    seconds: 25,
    at: () => ({ flow1: 57, flow2: 55, levelRate: 0.4 })
  }
};

export const SCENARIOS = {
  normal:       { name: 'Normal',            phases: ['normal'] },
  partial:      { name: 'Partial blockage',  phases: ['normal', 'partial'] },
  severe:       { name: 'Severe blockage',   phases: ['partial', 'severe'] },
  rapidRise:    { name: 'Rapid water rise',  phases: ['normal', 'rapidRise'] },
  critical:     { name: 'Critical level',    phases: ['rapidRise', 'critical'] },
  sensorFault:  { name: 'Sensor failure',    phases: ['normal', 'sensorFault'] },
  recovery:     { name: 'Recovery',          phases: ['severe', 'recovery'] },
  fullSequence: {
    name: 'Full demonstration',
    phases: ['normal', 'partial', 'severe', 'sensorFault', 'recovery']
  }
};

/**
 * Build the full frame list for a scenario.
 * Frames are 1 Hz, matching the firmware's reporting cadence.
 */
export function buildFrames(scenarioKey, startTime = Date.now()) {
  const scenario = SCENARIOS[scenarioKey] ?? SCENARIOS.normal;
  const rand = lcg(20260918);
  const frames = [];

  let blockageSeconds = 0;
  let fullLevelCount = 0;
  let pumpShutdown = false;
  let elapsed = 0;
  let levelTrue = START_LEVEL; // integrated across phases so they join smoothly

  for (const phaseKey of scenario.phases) {
    const phase = PHASES[phaseKey];
    for (let t = 0; t < phase.seconds; t++) {
      const target = phase.at(t, phase.seconds);
      const noise = (scale) => (rand() - 0.5) * scale;

      // A disconnected sensor reads exactly zero — no jitter at all. That
      // absence of noise is itself one of the fault signals.
      const faulted = target.faultInjected === 'flow2';
      const flow1 = Math.max(0, Math.round(target.flow1 + noise(2.2)));
      const flow2 = faulted ? 0 : Math.max(0, Math.round(target.flow2 + noise(2.2)));

      levelTrue = Math.max(0, Math.min(100, levelTrue + target.levelRate / 60));
      const level = Math.max(0, Math.min(100, +(levelTrue + noise(0.5)).toFixed(1)));

      const fw = firmwareBlockage(flow1, flow2, blockageSeconds);
      blockageSeconds = fw.seconds;

      if (!pumpShutdown && level >= 99) {
        fullLevelCount += 1;
        if (fullLevelCount >= 20) pumpShutdown = true;
      }

      const pumpOn = !pumpShutdown;

      frames.push({
        ts: new Date(startTime + elapsed * 1000).toISOString(),
        source: 'demo',
        seq: elapsed,
        flow1,
        flow2,
        flowDiff: flow1 - flow2,
        waterLevelPct: level,
        levelRate: target.levelRate,
        distanceCm: null,
        echoValid: null,
        pumpStatus: pumpShutdown ? 'OFF - SAFETY SHUTDOWN' : 'ON - MANUAL',
        pumpShutdown,
        fwBlockage: fw.detected,
        fullLevelCount,
        waterLevelStatus: waterLevelStatus(level, pumpShutdown),
        leds: firmwareLeds(level, pumpOn, pumpShutdown),
        phase: phase.label,
        faultInjected: target.faultInjected ?? null,
        isDemo: true,
        provenance: PROV.DEMO
      });
      elapsed += 1;
    }
  }
  return frames;
}
