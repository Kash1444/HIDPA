export default function About({ modelStatus }) {
  return (
    <div className="stack" style={{ gap: 'var(--s4)', maxWidth: '78ch' }}>
      <section className="panel">
        <h2>What this layer does</h2>
        <p style={{ marginTop: 'var(--s3)' }}>
          The ESP32 rig measures flow at two points, water level in the reservoir, and switches a pump.
          It already decides, on its own, whether a blockage is present. DrainGuard sits beside it and
          answers a harder question: can that decision be trusted right now?
        </p>
        <p style={{ marginTop: 'var(--s3)', color: 'var(--ink-dim)' }}>
          The interesting case is a disconnected flow sensor. It reads zero, the firmware rule fires, and a
          naive dashboard reports a blockage. A disconnect changes one channel and leaves the physical
          world untouched, while a real restriction disturbs the upstream sensor and the water level too.
          That difference is what the diagnosis is built on.
        </p>
      </section>

      <section className="panel">
        <h2>What it deliberately does not do</h2>
        <ul style={{ marginTop: 'var(--s3)', paddingLeft: 20, color: 'var(--ink-dim)' }}>
          <li style={{ marginBottom: 6 }}>It never writes to the device. The pump, the relay and the safety latch stay with the firmware, so a fault in this layer cannot move hardware.</li>
          <li style={{ marginBottom: 6 }}>It never invents a reading. When the backend is unreachable you get an offline state, not a plausible number.</li>
          <li style={{ marginBottom: 6 }}>It does not claim accuracy it has not measured. Model status: <strong style={{ color: 'var(--warn)' }}>{modelStatus}</strong>.</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Where the numbers come from</h2>
        <dl style={{ marginTop: 'var(--s3)' }}>
          <dt style={{ fontWeight: 600 }}>Live</dt>
          <dd style={{ margin: '2px 0 10px', color: 'var(--ink-dim)' }}>Measured by the rig and fresh.</dd>
          <dt style={{ fontWeight: 600 }}>Stale</dt>
          <dd style={{ margin: '2px 0 10px', color: 'var(--ink-dim)' }}>Measured, but older than the freshness threshold. Shown dimmed.</dd>
          <dt style={{ fontWeight: 600 }}>Demo data</dt>
          <dd style={{ margin: '2px 0 10px', color: 'var(--ink-dim)' }}>Authored scenarios for rehearsing the interface. Never a measurement, always badged.</dd>
          <dt style={{ fontWeight: 600 }}>Simulated</dt>
          <dd style={{ margin: '2px 0 0', color: 'var(--ink-dim)' }}>Output of the what-if model rather than the rig.</dd>
        </dl>
      </section>
    </div>
  );
}
