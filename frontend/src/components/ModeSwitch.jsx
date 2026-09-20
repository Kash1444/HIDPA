import { SCENARIOS } from '../services/demoScenarios.js';

/**
 * Choosing demo mode is a deliberate, visible act. There is no automatic
 * fallback from live to demo — that would let invented data appear during an
 * outage, exactly when an operator most needs to know the truth.
 */
export default function ModeSwitch({ mode, setMode, scenario, setScenario }) {
  const base = {
    padding: '9px 14px', borderRadius: 'var(--r-chip)', cursor: 'pointer',
    border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-dim)', minHeight: 40
  };
  const on = { ...base, background: 'var(--surface-raised)', color: 'var(--ink)', borderColor: 'var(--accent)' };

  return (
    <div className="row" style={{ flexWrap: 'wrap' }}>
      <div role="group" aria-label="Data source" style={{ display: 'flex', gap: 'var(--s2)' }}>
        <button type="button" style={mode === 'live' ? on : base} aria-pressed={mode === 'live'} onClick={() => setMode('live')}>
          Live rig
        </button>
        <button type="button" style={mode === 'demo' ? on : base} aria-pressed={mode === 'demo'} onClick={() => setMode('demo')}>
          Demo
        </button>
      </div>
      {mode === 'demo' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
          <span className="sr-only">Scenario</span>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            style={{ ...base, color: 'var(--ink)', minWidth: 190 }}
          >
            {Object.entries(SCENARIOS).map(([key, s]) => (
              <option key={key} value={key}>{s.name}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
