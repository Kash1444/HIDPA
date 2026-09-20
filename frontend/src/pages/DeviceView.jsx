import Gauge from '../components/Gauge.jsx';
import Metric from '../components/Metric.jsx';
import StatusBanner from '../components/StatusBanner.jsx';
import { PROV } from '../services/provenance.js';

const LED_ROWS = [
  { key: 'blue',   color: '#2563EB', label: 'Pump running',          stream: 'V8' },
  { key: 'green',  color: '#16A34A', label: 'Water level 0 to 30%',  stream: 'V9' },
  { key: 'yellow', color: '#CA8A04', label: 'Water level 30 to 60%', stream: 'V10' },
  { key: 'red',    color: '#DC2626', label: 'Water level above 60%', stream: 'V11' }
];

/**
 * A faithful mirror of the Blynk panel, with two differences that matter:
 * stale values are drawn as stale, and the LED rows are labelled by what the
 * firmware actually drives them with.
 */
export default function DeviceView({ latest, provenance }) {
  if (!latest) return <StatusBanner tone="info" title="No device data">Nothing has been received from the node yet.</StatusBanner>;

  const stale = provenance === PROV.STALE || provenance === PROV.UNAVAILABLE;
  const flags = [];
  if (latest.waterLevelPct >= 99 && latest.fullLevelCount === 0) {
    flags.push('Level reads 100% but the full-level counter is 0. A short ultrasonic echo also reads as 100%, so a sensor fault cannot be ruled out.');
  }
  if (latest.flow2 === 0 && latest.flow1 >= 20) {
    flags.push('Downstream flow is exactly zero while upstream continues. The firmware treats this as a blockage; it may be a disconnected sensor.');
  }

  const gauges = [
    { label: 'Flow 1', value: latest.flow1, unit: 'pulses/s', tone: 'accent' },
    { label: 'Flow 2', value: latest.flow2, unit: 'pulses/s', tone: latest.flow2 === 0 && latest.flow1 > 20 ? 'alarm' : 'accent' },
    { label: 'Water level', value: latest.waterLevelPct, unit: '%', tone: latest.waterLevelPct >= 90 ? 'critical' : 'accent' }
  ];

  return (
    <div className="stack" style={{ gap: 'var(--s4)' }}>
      <StatusBanner tone={stale ? 'offline' : 'info'} title={stale ? 'Device offline' : 'Raw datastreams'}>
        {stale
          ? 'Values below are frozen at the last report. Blynk would keep showing them as if they were current.'
          : 'Exactly what the ESP32 published on V0 to V12. This page is read-only and writes nothing back.'}
      </StatusBanner>

      {flags.length > 0 && (
        <StatusBanner tone="alarm" title={`${flags.length} consistency ${flags.length === 1 ? 'flag' : 'flags'}`}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>{flags.map((f, i) => <li key={i}>{f}</li>)}</ul>
        </StatusBanner>
      )}

      <div className="grid-3">
        {gauges.map((g) => (
          <div key={g.label} className="tile" style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
            <span className="label">{g.label}</span>
            <Gauge value={g.value} tone={g.tone} size={104} dimmed={stale} label={`${g.label} ${g.value}`} />
            <Metric value={typeof g.value === 'number' ? g.value.toFixed(g.unit === '%' ? 0 : 0) : null}
              unit={g.unit} provenance={provenance} size="var(--step-2)" />
          </div>
        ))}
      </div>

      <div className="grid-3">
        <div className="tile"><span className="label">Flow difference</span>
          <Metric value={latest.flowDiff} provenance={provenance} size="var(--step-2)" sub="threshold 15" /></div>
        <div className="tile"><span className="label">Full-level count</span>
          <Metric value={`${latest.fullLevelCount}/20`} provenance={provenance} size="var(--step-2)" sub="latches the pump at 20" /></div>
        <div className="tile"><span className="label">Pump</span>
          <Metric value={latest.pumpStatus} provenance={provenance} size="var(--step-1)" sub="manual control on V12" /></div>
      </div>

      <section className="panel">
        <div className="spread" style={{ marginBottom: 'var(--s3)' }}>
          <h2>Indicator LEDs</h2>
          <span className="label">Labelled to match the firmware</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
          {LED_ROWS.map((r) => {
            const on = latest.leds?.[r.key];
            return (
              <div key={r.key} className="row" style={{ gap: 'var(--s4)' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: on ? r.color : 'transparent', border: `2px solid ${on ? r.color : 'var(--line)'}`,
                  opacity: stale ? 0.5 : 1
                }} />
                <span style={{ flexGrow: 1, color: on ? 'var(--ink)' : 'var(--ink-dim)' }}>{r.label}</span>
                <span className="label mono">{r.stream}</span>
              </div>
            );
          })}
        </div>
        <p className="label" style={{ marginTop: 'var(--s4)' }}>
          The Blynk panel labels these three as blockage severity. In the firmware they are driven only by
          water-level bands, and <code>blockageDetected</code> never touches an LED.
        </p>
      </section>
    </div>
  );
}
