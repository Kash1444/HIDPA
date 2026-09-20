import Gauge from '../components/Gauge.jsx';
import StatusBanner from '../components/StatusBanner.jsx';
import SensorHealthList from '../components/SensorHealthList.jsx';

export default function DrainHealth({ verdict, dhi }) {
  if (!dhi) return <StatusBanner tone="info" title="No health index yet">Telemetry has to arrive first.</StatusBanner>;

  const tone = dhi.dhi >= 70 ? 'ok' : dhi.dhi >= 40 ? 'warn' : 'critical';
  const priority = dhi.dhi >= 70 ? 'Routine' : dhi.dhi >= 40 ? 'Schedule within the week' : 'Inspect now';

  return (
    <div className="stack" style={{ gap: 'var(--s4)' }}>
      <section className="panel">
        <div className="row" style={{ gap: 'var(--s5)', flexWrap: 'wrap' }}>
          <Gauge value={dhi.dhi} tone={tone} size={128} label={`Drain health ${dhi.dhi} of 100`} />
          <div>
            <div className="num" style={{ fontSize: 'var(--step-3)', color: `var(--${tone === 'ok' ? 'ok' : tone === 'warn' ? 'warn' : 'critical'})` }}>
              {dhi.dhi}<span style={{ fontSize: '0.45em', color: 'var(--ink-dim)' }}>/100</span>
            </div>
            <p style={{ marginTop: 'var(--s2)' }}>Maintenance priority: {priority}</p>
            <p className="label" style={{ marginTop: 'var(--s2)', maxWidth: '60ch' }}>
              A weighted summary, not a measurement. The weights are an engineering choice and are
              documented so you can disagree with them.
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 style={{ marginBottom: 'var(--s3)' }}>What makes up the score</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
          {dhi.components.map((c) => (
            <div key={c.label} className="row" style={{ gap: 'var(--s3)' }}>
              <span style={{ width: 210, flexShrink: 0 }}>{c.label}</span>
              <div style={{ flexGrow: 1, height: 8, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
                <div style={{ width: `${c.value}%`, height: '100%', background: 'var(--accent)' }} />
              </div>
              <span className="mono" style={{ width: 82, textAlign: 'right', fontSize: 'var(--step--1)' }}>
                {c.value} × {c.weight}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 style={{ marginBottom: 'var(--s3)' }}>Sensor health</h2>
        <SensorHealthList sensors={verdict?.sensors ?? []} />
      </section>
    </div>
  );
}
