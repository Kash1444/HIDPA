/**
 * A faithful mirror of the rules actually running in DBDS_code.ino.
 *
 * This exists so demo frames behave exactly like the hardware, and so the UI
 * can show the firmware's own verdict beside the platform's. It is a mirror,
 * never a replacement: the real safety logic lives on the ESP32 (spec §9).
 *
 * Source of truth: DBDS_code.ino, loop() and sendDataToBlynk().
 */

export const FW = {
  BLOCKAGE_MIN_FLOW1: 20,      // hardcoded `flow1Pulses >= 20`
  BLOCKAGE_DIFFERENCE: 15,     // BLOCKAGE_DIFFERENCE
  BLOCKAGE_CONFIRM_TIME: 3,    // BLOCKAGE_CONFIRM_TIME, in 1 Hz samples
  FULL_LEVEL_CONFIRM_COUNT: 20,
  EMPTY_DISTANCE_CM: 27.75,
  FULL_DISTANCE_CM: 20.49
};

/** Firmware's blockage rule, including its 3-sample confirmation counter. */
export function firmwareBlockage(flow1, flow2, prevSeconds = 0) {
  const diff = flow1 - flow2;
  const conditionMet = flow1 >= FW.BLOCKAGE_MIN_FLOW1 && diff >= FW.BLOCKAGE_DIFFERENCE;
  const seconds = conditionMet ? prevSeconds + 1 : 0;
  return { seconds, detected: seconds >= FW.BLOCKAGE_CONFIRM_TIME };
}

/**
 * Firmware's LED bands. Note these are driven ONLY by water level —
 * blockageDetected never touches an LED. The Blynk panel currently labels
 * them as blockage severity, which does not match the firmware.
 */
export function firmwareLeds(waterLevel, pumpOn, pumpShutdown) {
  if (pumpShutdown || !pumpOn) return { blue: pumpOn && !pumpShutdown, green: false, yellow: false, red: false };
  if (waterLevel <= 30) return { blue: true, green: true,  yellow: false, red: false };
  if (waterLevel <= 60) return { blue: true, green: false, yellow: true,  red: false };
  if (waterLevel <= 80) return { blue: true, green: false, yellow: false, red: true };
  if (waterLevel <= 90) return { blue: true, green: false, yellow: false, red: true };  // rapid blink
  return { blue: true, green: true, yellow: true, red: true };                           // all blink
}

/** Firmware's V7 water-level string. */
export function waterLevelStatus(waterLevel, pumpShutdown) {
  if (pumpShutdown) return 'CRITICAL - PUMP SHUTDOWN';
  if (waterLevel >= 99) return 'CRITICAL';
  if (waterLevel >= 90) return 'VERY HIGH';
  if (waterLevel >= 80) return 'HIGH';
  if (waterLevel >= 60) return 'MEDIUM';
  if (waterLevel >= 30) return 'LOW-MEDIUM';
  return 'NORMAL';
}

/**
 * Distance -> level %, exactly as the firmware computes it.
 * Worth knowing: a *short* reading (obstruction, or a disconnected sensor
 * returning a tiny duration) maps to 100%, not 0%. The ultrasonic can
 * therefore fail HIGH and look like flooding.
 */
export function levelFromDistance(distanceCm) {
  const pct = ((FW.EMPTY_DISTANCE_CM - distanceCm) / (FW.EMPTY_DISTANCE_CM - FW.FULL_DISTANCE_CM)) * 100;
  return Math.max(0, Math.min(100, pct));
}
