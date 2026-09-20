import { PROV, PROV_META } from '../services/provenance.js';

const TONE_STYLE = {
  ok:     { bg: 'var(--ok-bg)',       bd: 'var(--ok-line)',       fg: 'var(--ok)' },
  warn:   { bg: 'var(--warn-bg)',     bd: 'var(--warn-line)',     fg: 'var(--warn)' },
  accent: { bg: 'var(--accent-soft)', bd: 'var(--line)',          fg: 'var(--accent)' },
  dim:    { bg: 'var(--surface-sunk)',bd: 'var(--line)',          fg: 'var(--ink-dim)' }
};

/**
 * The badge that makes demo and simulated data impossible to mistake for a
 * measurement. It is never optional and never subtle.
 */
export default function ProvenanceBadge({ provenance, detail }) {
  const meta = PROV_META[provenance] ?? PROV_META[PROV.UNAVAILABLE];
  const tone = TONE_STYLE[meta.tone];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--s2)',
        padding: '6px 11px', borderRadius: 'var(--r-chip)',
        background: tone.bg, border: `1px solid ${tone.bd}`,
        color: tone.fg, fontSize: 'var(--step--1)', fontWeight: 500
      }}
    >
      {provenance === PROV.LIVE && (
        <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: tone.fg }} />
      )}
      {meta.label}
      {detail && <span style={{ color: 'var(--ink-dim)', fontWeight: 400 }}>{detail}</span>}
    </span>
  );
}
