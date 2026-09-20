import { ArrowDown, ArrowUp, Minus, Check } from 'lucide-react';

const MARKS = {
  up:   { Icon: ArrowUp,   color: 'var(--alarm)' },
  down: { Icon: ArrowDown, color: 'var(--alarm)' },
  flat: { Icon: Minus,     color: 'var(--warn)' },
  ok:   { Icon: Check,     color: 'var(--ok)' }
};

/**
 * Evidence, not decoration. Each line is a statement the engine can defend
 * from the feature values, written so a maintenance crew can act on it.
 */
export default function EvidenceList({ evidence = [] }) {
  if (!evidence.length) return <p className="label">No evidence recorded for this verdict.</p>;
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
      {evidence.map((e, i) => {
        const m = MARKS[e.tone] ?? MARKS.flat;
        const { Icon } = m;
        return (
          <li key={i} style={{ display: 'flex', gap: 'var(--s3)', alignItems: 'flex-start' }}>
            <Icon size={15} color={m.color} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span style={{ lineHeight: 1.45 }}>{e.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
