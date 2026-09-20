export const pct = (x, digits = 0) => (x == null ? '—' : `${x.toFixed(digits)}`);

export const pct01 = (x, digits = 0) => (x == null ? '—' : `${(x * 100).toFixed(digits)}%`);

export function ago(iso, now = Date.now()) {
  if (!iso) return 'never';
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 2) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}

export function ageSeconds(iso, now = Date.now()) {
  if (!iso) return null;
  return Math.max(0, (now - new Date(iso).getTime()) / 1000);
}

export const clockTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
