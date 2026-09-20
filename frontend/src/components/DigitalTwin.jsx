/**
 * Prototype-scale digital twin.
 *
 * It mirrors the rig's actual plumbing order: reservoir -> pump -> FS1 ->
 * ball valve -> FS2 -> outfall. Element colour reflects the live reading, and
 * a sensor under suspicion is drawn hollow rather than confidently coloured.
 */
export default function DigitalTwin({ latest, sensors = [], dimmed = false }) {
  const fs2 = sensors.find((s) => s.id === 'flow2');
  const fs2Suspect = fs2?.state === 'SUSPECTED FAULT';
  const flow1 = latest?.flow1 ?? 0;
  const flow2 = latest?.flow2 ?? 0;
  const level = latest?.waterLevelPct ?? 0;
  const restricted = flow1 > 0 && flow2 / Math.max(flow1, 1) < 0.7 && !fs2Suspect;

  const dots = Array.from({ length: 9 }, (_, i) => 190 + i * 80);

  return (
    <svg viewBox="0 0 1060 112" width="100%" role="img"
      aria-label={`Rig twin. Upstream flow ${flow1}, downstream flow ${flow2}, reservoir ${Math.round(level)} percent.`}
      style={{ opacity: dimmed ? 0.5 : 1 }}>
      <rect x="10" y="30" width="86" height="62" rx="8" fill="var(--surface-sunk)" stroke="var(--line)" />
      <rect x="14" y={88 - (level / 100) * 56} width="78" height={(level / 100) * 56} rx="4" fill="var(--accent)" opacity="0.5" />
      <text x="53" y="24" fontSize="11" fill="var(--ink-dim)" textAnchor="middle">Reservoir {Math.round(level)}%</text>

      <rect x="130" y="48" width="800" height="26" rx="13" fill="var(--surface-sunk)" stroke="var(--line)" />
      {dots.map((cx) => (
        <circle key={cx} cx={cx} cy="61" r="4" fill="var(--accent)" opacity={flow2 === 0 && cx > 770 ? 0.15 : 0.9} />
      ))}

      <circle cx="150" cy="61" r="17" fill="var(--surface-sunk)" stroke="var(--accent)" strokeWidth="2" />
      <text x="150" y="104" fontSize="11" fill="var(--ink-dim)" textAnchor="middle">Pump</text>

      <rect x="300" y="38" width="10" height="46" rx="3" fill="var(--accent)" />
      <text x="305" y="28" fontSize="11" fill="var(--ink)" textAnchor="middle">FS1 {flow1}</text>

      <path d="M525 40 L545 61 L525 82 Z" fill="var(--surface-sunk)" stroke={restricted ? 'var(--alarm)' : 'var(--ok)'} strokeWidth="2" />
      <path d="M565 40 L545 61 L565 82 Z" fill="var(--surface-sunk)" stroke={restricted ? 'var(--alarm)' : 'var(--ok)'} strokeWidth="2" />
      <text x="545" y="28" fontSize="11" fill={restricted ? 'var(--alarm)' : 'var(--ok)'} textAnchor="middle">
        {restricted ? 'Restricted' : 'Valve open'}
      </text>

      <rect x="770" y="38" width="10" height="46" rx="3"
        fill={fs2Suspect ? 'none' : 'var(--accent-alt)'}
        stroke={fs2Suspect ? 'var(--alarm)' : 'none'} strokeWidth="2" strokeDasharray={fs2Suspect ? '3 3' : undefined} />
      <text x="775" y="28" fontSize="11" fill={fs2Suspect ? 'var(--alarm)' : 'var(--ink)'} textAnchor="middle">
        {fs2Suspect ? 'FS2 unverified' : `FS2 ${flow2}`}
      </text>

      <rect x="960" y="30" width="86" height="62" rx="8" fill="var(--surface-sunk)" stroke="var(--line)" />
      <text x="1003" y="24" fontSize="11" fill="var(--ink-dim)" textAnchor="middle">Outfall</text>
      <path d="M930 61 L956 61" stroke="var(--line)" strokeWidth="2" />
    </svg>
  );
}
