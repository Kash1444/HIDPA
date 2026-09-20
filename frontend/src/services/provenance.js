/**
 * Provenance is a type, not a convention.
 *
 * Every number that reaches the screen is wrapped here, and the shared
 * <Metric> component refuses to render a bare number. That makes it
 * structurally awkward to present demo or simulated values as live sensor
 * output, which AI_APPLICATION_SPEC.md §53 and §61 forbid.
 */

export const PROV = {
  LIVE: 'LIVE',               // measured by the physical rig, fresh
  STALE: 'STALE',             // measured, but older than the stale threshold
  DEMO: 'DEMO',               // scripted scenario, never a measurement
  SIMULATED: 'SIMULATED',     // output of the what-if model
  UNAVAILABLE: 'UNAVAILABLE'  // we do not know; show a dash, never a zero
};

export const PROV_META = {
  LIVE:        { label: 'Live',        tone: 'ok' },
  STALE:       { label: 'Stale',       tone: 'warn' },
  DEMO:        { label: 'Demo data',   tone: 'warn' },
  SIMULATED:   { label: 'Simulated',   tone: 'accent' },
  UNAVAILABLE: { label: 'No data',     tone: 'dim' }
};

/** Wrap a value with its origin. `value` may be null — that is meaningful. */
export function reading(value, unit = null, provenance = PROV.LIVE, asOf = null) {
  return { value, unit, provenance, asOf };
}

export const unavailable = (unit = null) =>
  reading(null, unit, PROV.UNAVAILABLE, null);

/**
 * Downgrade a whole frame's provenance by age. A measurement does not stop
 * being a measurement when it gets old, but it stops being *current*, and the
 * operator needs to see the difference (spec §48).
 */
export function ageProvenance(provenance, ageSeconds, staleAfter, offlineAfter) {
  if (provenance !== PROV.LIVE) return provenance;
  if (ageSeconds == null) return PROV.UNAVAILABLE;
  if (ageSeconds >= offlineAfter) return PROV.UNAVAILABLE;
  if (ageSeconds >= staleAfter) return PROV.STALE;
  return PROV.LIVE;
}

export function isTrustworthy(provenance) {
  return provenance === PROV.LIVE;
}
