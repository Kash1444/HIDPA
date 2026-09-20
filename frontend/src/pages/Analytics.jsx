import FlowChart from '../components/FlowChart.jsx';
import StatusBanner from '../components/StatusBanner.jsx';
import { clockTime } from '../utils/format.js';

export default function Analytics({ frames, provenance }) {
  if (frames.length < 2) {
    return <StatusBanner tone="info" title="Not enough history">Analytics needs at least a few samples.</StatusBanner>;
  }

  const diffs = frames.map((f) => f.flowDiff);
  const levels = frames.map((f) => f.waterLevelPct);
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const stats = [
    { label: 'Samples held', value: frames.length },
    { label: 'Mean flow difference', value: avg(diffs).toFixed(1) },
    { label: 'Peak flow difference', value: Math.max(...diffs) },
    { label: 'Peak water level', value: `${Math.max(...levels).toFixed(0)}%` }
  ];

  const events = [];
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].phase && frames[i].phase !== frames[i - 1].phase) {
      events.push({ ts: frames[i].ts, text: frames[i].phase });
    }
    if (frames[i].fwBlockage && !frames[i - 1].fwBlockage) {
      events.push({ ts: frames[i].ts, text: 'Firmware raised a blockage flag' });
    }
  }

  return (
    <div className="stack" style={{ gap: 'var(--s4)' }}>
      <div className="grid-5">
        {stats.map((s) => (
          <div key={s.label} className="tile">
            <span className="label">{s.label}</span>
            <div className="num" style={{ fontSize: 'var(--step-2)', marginTop: 'var(--s2)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <section className="panel">
        <h2 style={{ marginBottom: 'var(--s3)' }}>Session trace</h2>
        <FlowChart frames={frames} height={320} />
        <p className="label" style={{ marginTop: 'var(--s3)' }}>
          Held in memory for this session only. Long-range history comes from the backend's
          readings table once it is running.
        </p>
      </section>

      <section className="panel">
        <h2 style={{ marginBottom: 'var(--s3)' }}>Transitions</h2>
        {events.length === 0
          ? <p className="label">No state changes in the buffer.</p>
          : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {events.slice(-12).reverse().map((e, i) => (
                <li key={i} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
                  <span className="mono label" style={{ width: 96 }}>{clockTime(e.ts)}</span>
                  <span>{e.text}</span>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}
