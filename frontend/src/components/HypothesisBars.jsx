/**
 * Competing explanations, shown together.
 *
 * Presenting a single verdict hides the fact that the evidence supports more
 * than one story. Showing the runner-up is what lets an operator disagree
 * with the system intelligently (spec §16).
 */
export default function HypothesisBars({ alternatives = [] }) {
  if (!alternatives.length) return null;
  const colors = ['var(--alarm)', 'var(--accent)', 'var(--ink-faint)'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
      {alternatives.map((a, i) => (
        <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
          <span style={{ width: 132, flexShrink: 0 }}>{a.label}</span>
          <div style={{ flexGrow: 1, height: 8, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.round(a.weight * 100)}%`, height: '100%', background: colors[i] ?? colors[2] }} />
          </div>
          <span className="mono" style={{ width: 40, textAlign: 'right', fontSize: 'var(--step--1)' }}>
            {Math.round(a.weight * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
