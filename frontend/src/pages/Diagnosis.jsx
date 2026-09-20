import Metric from '../components/Metric.jsx';
import StatusBanner from '../components/StatusBanner.jsx';
import EvidenceList from '../components/EvidenceList.jsx';
import HypothesisBars from '../components/HypothesisBars.jsx';
import SensorHealthList from '../components/SensorHealthList.jsx';
import { CONDITION_LABEL, CONDITION_TONE } from '../services/diagnosis.js';

export default function Diagnosis({ latest, verdict, provenance }) {
  if (!verdict) {
    return <StatusBanner tone="info" title="No diagnosis yet">Telemetry has to arrive before anything can be diagnosed.</StatusBanner>;
  }
  const tone = CONDITION_TONE[verdict.condition] ?? 'ok';

  return (
    <div className="stack" style={{ gap: 'var(--s4)' }}>
      <StatusBanner tone={tone} title={CONDITION_LABEL[verdict.condition] ?? verdict.condition}>
        {verdict.recommendedAction}
      </StatusBanner>

      <div className="grid-3">
        <div className="tile"><span className="label">Confidence</span>
          <Metric value={Math.round(verdict.confidence * 100)} unit="%" provenance={provenance} size="var(--step-2)" />
        </div>
        <div className="tile"><span className="label">Sensor reliability</span>
          <Metric value={Math.round(verdict.sensorReliability * 100)} unit="%" provenance={provenance} size="var(--step-2)"
            tone={verdict.sensorReliability > 0.8 ? 'ok' : 'warn'} />
        </div>
        <div className="tile"><span className="label">Data quality</span>
          <Metric value={verdict.dataQuality} provenance={provenance} size="var(--step-2)"
            tone={verdict.dataQuality === 'GOOD' ? 'ok' : verdict.dataQuality === 'FAIR' ? 'warn' : 'alarm'} />
        </div>
      </div>

      <section className="panel">
        <h2 style={{ marginBottom: 'var(--s3)' }}>Why</h2>
        <EvidenceList evidence={verdict.evidence} />
        <p className="label" style={{ marginTop: 'var(--s4)' }}>
          These are the feature values that drove the verdict. They explain the model's reasoning, not
          the physical cause — a strong contribution is not proof.
        </p>
      </section>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="panel">
          <h2 style={{ marginBottom: 'var(--s3)' }}>Competing explanations</h2>
          <HypothesisBars alternatives={verdict.alternatives} />
        </section>

        <section className="panel">
          <h2 style={{ marginBottom: 'var(--s3)' }}>Firmware verdict</h2>
          <p>
            The ESP32 rule reports{' '}
            <strong style={{ color: latest?.fwBlockage ? 'var(--critical)' : 'var(--ok)' }}>
              {latest?.fwBlockage ? 'BLOCKAGE DETECTED' : 'NORMAL'}
            </strong>.
          </p>
          <p style={{ color: 'var(--ink-dim)', marginTop: 'var(--s3)' }}>
            DrainGuard never overrides it. The firmware owns the pump and the safety latch; this layer
            only explains why the two views differ when they do.
          </p>
        </section>
      </div>

      <section className="panel">
        <h2 style={{ marginBottom: 'var(--s3)' }}>Sensor health</h2>
        <SensorHealthList sensors={verdict.sensors} />
      </section>
    </div>
  );
}
