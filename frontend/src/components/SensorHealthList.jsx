const STATE_TONE = {
  HEALTHY: { color: 'var(--ok)', label: 'Healthy' },
  WARNING: { color: 'var(--warn)', label: 'Warning' },
  UNCERTAIN: { color: 'var(--ink-dim)', label: 'Not verifiable' },
  'SUSPECTED FAULT': { color: 'var(--alarm)', label: 'Suspected fault' },
  OFFLINE: { color: 'var(--critical)', label: 'Offline' }
};

export default function SensorHealthList({ sensors = [] }) {
  if (!sensors.length) return <p className="label">Sensor health is computed once telemetry arrives.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
      {sensors.map((s) => {
        const tone = STATE_TONE[s.state] ?? STATE_TONE.UNCERTAIN;
        return (
          <div key={s.id} style={{ padding: 'var(--s3)', borderRadius: 'var(--r-tile)', background: 'var(--surface-sunk)', border: '1px solid var(--line)' }}>
            <div className="spread">
              <span style={{ fontWeight: 500 }}>{s.label}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s2)', color: tone.color }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone.color }} />
                {tone.label}
              </span>
            </div>
            <div className="label mono" style={{ marginTop: 3 }}>{s.pin}</div>
            {s.reasons?.length > 0 && (
              <ul style={{ margin: 'var(--s2) 0 0', paddingLeft: 18, color: 'var(--ink-dim)' }}>
                {s.reasons.map((r, i) => <li key={i} style={{ marginTop: 2 }}>{r}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
