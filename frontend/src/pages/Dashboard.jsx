import { Link } from 'react-router-dom';
import Tile from '../components/Tile.jsx';
import Metric from '../components/Metric.jsx';
import Gauge from '../components/Gauge.jsx';
import StatusBanner from '../components/StatusBanner.jsx';
import FlowChart from '../components/FlowChart.jsx';
import DigitalTwin from '../components/DigitalTwin.jsx';
import { CONDITION_LABEL, CONDITION_TONE } from '../services/diagnosis.js';
import { PROV } from '../services/provenance.js';

export default function Dashboard({ frames, latest, verdict, dhi, provenance, connection }) {
  if (connection.state === 'unreachable') {
    return (
      <StatusBanner tone="offline" title="Backend unreachable">
        {connection.error}. Nothing is shown rather than something invented — start the API, or
        switch to Demo above to walk through the interface without the rig.
      </StatusBanner>
    );
  }
  if (!latest) {
    return (
      <StatusBanner tone="info" title="Waiting for the first sample">
        The device reports once per second. If nothing arrives, check the serial adapter or the Blynk poller.
      </StatusBanner>
    );
  }

  const stale = provenance === PROV.STALE || provenance === PROV.UNAVAILABLE;
  const tone = CONDITION_TONE[verdict?.condition] ?? 'ok';
  const levelTone = latest.waterLevelPct >= 90 ? 'critical' : latest.waterLevelPct >= 60 ? 'warn' : 'accent';

  return (
    <div className="stack" style={{ gap: 'var(--s4)' }}>
      {provenance === PROV.DEMO && (
        <StatusBanner tone="warn" title="Demo data">
          A scripted scenario is playing. These numbers were authored to exercise the interface and
          are not measurements from the rig.
        </StatusBanner>
      )}
      {stale && (
        <StatusBanner tone="offline" title="Readings are not current">
          The values below are the last ones received. Treat them as history, not as the state of the drain now.
        </StatusBanner>
      )}

      <div className="grid-5">
        <Tile title="Condition" tone={tone}>
          <Metric
            value={CONDITION_LABEL[verdict?.condition] ?? '—'}
            size="var(--step-2)" tone={tone} provenance={provenance}
            sub={verdict?.risk == null ? 'risk not estimated' : `risk ${Math.round(verdict.risk * 100)}%`}
          />
        </Tile>

        <Tile title="Confidence">
          <Metric value={verdict ? Math.round(verdict.confidence * 100) : null} unit="%" provenance={provenance}
            sub={`data quality ${verdict?.dataQuality?.toLowerCase() ?? 'unknown'}`} />
          <Gauge value={(verdict?.confidence ?? 0) * 100} tone={(verdict?.confidence ?? 0) > 0.6 ? 'ok' : 'warn'} dimmed={stale} />
        </Tile>

        <Tile title="Flow balance">
          <Metric value={latest.flowDiff} unit="pulses/s" provenance={provenance}
            tone={Math.abs(latest.flowDiff) >= 15 ? 'alarm' : 'ok'}
            sub={`${latest.flow1} upstream, ${latest.flow2} downstream`} />
        </Tile>

        <Tile title="Water level">
          <Metric value={latest.waterLevelPct.toFixed(0)} unit="%" tone={levelTone} provenance={provenance}
            sub={latest.waterLevelStatus ?? ''} />
          <Gauge value={latest.waterLevelPct} tone={levelTone} dimmed={stale} />
        </Tile>

        <Tile title="Drain health">
          <Metric value={dhi?.dhi ?? null} unit="/100" provenance={provenance}
            tone={(dhi?.dhi ?? 0) >= 70 ? 'ok' : (dhi?.dhi ?? 0) >= 40 ? 'warn' : 'critical'}
            sub={`sensors ${Math.round((verdict?.sensorReliability ?? 0) * 100)}%`} />
          <Gauge value={dhi?.dhi ?? 0} tone={(dhi?.dhi ?? 0) >= 70 ? 'ok' : 'warn'} dimmed={stale} />
        </Tile>
      </div>

      <section className="panel">
        <div className="spread" style={{ marginBottom: 'var(--s3)' }}>
          <h2>Flow and level</h2>
          <Link to="/analytics">Open analytics</Link>
        </div>
        <FlowChart frames={frames} />
      </section>

      <section className="panel">
        <div className="spread" style={{ marginBottom: 'var(--s3)' }}>
          <h2>Rig twin</h2>
          <span className="label">Reflects the latest reading, at prototype scale</span>
        </div>
        <DigitalTwin latest={latest} sensors={verdict?.sensors ?? []} dimmed={stale} />
      </section>
    </div>
  );
}
