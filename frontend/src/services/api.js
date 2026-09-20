/**
 * Thin client for the DrainGuard FastAPI backend.
 *
 * Rules this module follows, and the UI depends on:
 *  - A failed request returns { ok: false, error } and NEVER substitutes
 *    invented values. The caller renders an offline state instead.
 *  - Nothing here writes to the device. The pump, the relay and the Blynk
 *    datastreams are owned by the firmware; the intelligence layer is
 *    read-only by design, so an AI fault cannot move hardware (spec §9).
 */

const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

async function get(path, { signal } = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal,
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) {
      return { ok: false, error: `${res.status} ${res.statusText}`, status: res.status };
    }
    const body = await res.json();
    return { ok: true, data: body?.data ?? body, envelope: body };
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, aborted: true, error: 'aborted' };
    return { ok: false, error: err.message || 'network error' };
  }
}

export const api = {
  health:        (o) => get('/api/health', o),
  status:        (o) => get('/api/status', o),
  latest:        (o) => get('/api/sensors/latest', o),
  history:       (window = '30m', o) => get(`/api/sensors/history?window=${encodeURIComponent(window)}`, o),
  sensorHealth:  (o) => get('/api/sensors/health', o),
  prediction:    (o) => get('/api/ai/prediction', o),
  modelInfo:     (o) => get('/api/ai/model-info', o),
  drainHealth:   (o) => get('/api/drain-health', o),
  alerts:        (o) => get('/api/alerts', o),
  diagnostics:   (o) => get('/api/diagnostics', o)
};

export default api;
