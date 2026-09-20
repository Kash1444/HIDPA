/**
 * A 270° arc gauge. Borrowed from the Blynk panel's vocabulary so operators
 * who know that dashboard recognise this one, with severity colour added.
 */
export default function Gauge({ value, max = 100, tone = 'accent', size = 58, label, dimmed = false }) {
  const TONE = { accent: 'var(--accent)', ok: 'var(--ok)', warn: 'var(--warn)', alarm: 'var(--alarm)', critical: 'var(--critical)' };
  const pct = value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const stroke = TONE[tone] ?? TONE.accent;
  const arc = 'M14.74 47.26 A23 23 0 1 1 47.26 47.26';

  return (
    <svg width={size} height={size} viewBox="0 0 62 62" role="img" aria-label={label ?? `${Math.round(pct)} percent`}>
      <path d={arc} fill="none" stroke="var(--line)" strokeWidth="6" strokeLinecap="round" />
      <path
        d={arc} fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round"
        pathLength="100" strokeDasharray={`${pct} ${100 - pct}`}
        opacity={dimmed ? 0.45 : 1}
      />
    </svg>
  );
}
