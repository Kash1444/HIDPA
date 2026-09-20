import { PROV } from '../services/provenance.js';

const TONE_COLOR = {
  ok: 'var(--ok)', warn: 'var(--warn)', alarm: 'var(--alarm)',
  critical: 'var(--critical)', accent: 'var(--accent)', ink: 'var(--ink)'
};

/**
 * A number never renders on its own. Untrustworthy provenance visibly dims the
 * value, so a frozen reading cannot masquerade as a current one.
 */
export default function Metric({ value, unit, provenance = PROV.LIVE, tone = 'ink', size = 'var(--step-3)', sub }) {
  const missing = value === null || value === undefined;
  const dimmed = provenance === PROV.STALE || provenance === PROV.UNAVAILABLE;
  const color = missing || dimmed ? 'var(--ink-dim)' : TONE_COLOR[tone] ?? TONE_COLOR.ink;

  return (
    <div>
      <div className="num" style={{ fontSize: size, lineHeight: 1, color }}>
        {missing ? '—' : value}
        {unit && !missing && (
          <span style={{ fontSize: '0.5em', color: 'var(--ink-dim)', marginLeft: 4, fontWeight: 500 }}>{unit}</span>
        )}
      </div>
      {sub && <div className="label" style={{ marginTop: 'var(--s2)' }}>{sub}</div>}
    </div>
  );
}
