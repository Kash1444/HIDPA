import { NavLink } from 'react-router-dom';
import { Activity, Stethoscope, BarChart3, HeartPulse, Cpu, BookOpen } from 'lucide-react';
import ProvenanceBadge from './ProvenanceBadge.jsx';
import ModeSwitch from './ModeSwitch.jsx';
import { ago } from '../utils/format.js';

const LINKS = [
  { to: '/',            label: 'Live monitoring', Icon: Activity, end: true },
  { to: '/diagnosis',   label: 'AI diagnosis',    Icon: Stethoscope },
  { to: '/health',      label: 'Drain health',    Icon: HeartPulse },
  { to: '/analytics',   label: 'Analytics',       Icon: BarChart3 },
  { to: '/device',      label: 'Device view',     Icon: Cpu },
  { to: '/about',       label: 'How this works',  Icon: BookOpen }
];

export default function AppShell({ children, provenance, latest, modeProps, modelStatus }) {
  const link = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 'var(--s3)',
    padding: '11px 12px', borderRadius: 'var(--r-chip)', textDecoration: 'none',
    color: isActive ? 'var(--ink)' : 'var(--ink-dim)',
    background: isActive ? 'var(--surface-raised)' : 'transparent',
    fontWeight: isActive ? 500 : 400
  });

  return (
    <div style={{ display: 'flex', minHeight: '100%' }}>
      <nav aria-label="Sections" style={{
        width: 224, flexShrink: 0, background: 'var(--surface-sunk)',
        borderRight: '1px solid var(--line-soft)', padding: 'var(--s5) var(--s4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--s5)', position: 'sticky', top: 0, height: '100vh'
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-1)', fontWeight: 700 }}>DrainGuard AI</div>
          <div className="label" style={{ marginTop: 2 }}>Node A, prototype rig</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {LINKS.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} style={link}>
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="tile" style={{ marginTop: 'auto', padding: 'var(--s3)' }}>
          <div className="label">Model status</div>
          <div className="mono" style={{ color: 'var(--warn)', marginTop: 4 }}>{modelStatus}</div>
          <p className="label" style={{ marginTop: 5 }}>
            Verdicts come from the rule engine until real experiments are captured.
          </p>
        </div>
      </nav>

      <div style={{ flexGrow: 1, minWidth: 0, padding: 'var(--s6) var(--s6) var(--s7)' }}>
        <header className="spread" style={{ flexWrap: 'wrap', gap: 'var(--s3)', marginBottom: 'var(--s5)' }}>
          <ModeSwitch {...modeProps} />
          <div className="row" style={{ gap: 'var(--s3)' }}>
            <ProvenanceBadge provenance={provenance} />
            <span className="label mono">{latest ? ago(latest.ts) : 'no samples yet'}</span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
