import { AlertTriangle, WifiOff, Info, CheckCircle2 } from 'lucide-react';

const TONES = {
  ok:       { bg: 'var(--ok-bg)',       bd: 'var(--ok-line)',       fg: 'var(--ok)',       Icon: CheckCircle2 },
  warn:     { bg: 'var(--warn-bg)',     bd: 'var(--warn-line)',     fg: 'var(--warn)',     Icon: AlertTriangle },
  alarm:    { bg: 'var(--alarm-bg)',    bd: 'var(--alarm-line)',    fg: 'var(--alarm)',    Icon: AlertTriangle },
  critical: { bg: 'var(--critical-bg)', bd: 'var(--critical-line)', fg: 'var(--critical)', Icon: AlertTriangle },
  offline:  { bg: 'var(--critical-bg)', bd: 'var(--critical-line)', fg: 'var(--critical)', Icon: WifiOff },
  info:     { bg: 'var(--surface)',     bd: 'var(--line)',          fg: 'var(--ink-dim)',  Icon: Info }
};

export default function StatusBanner({ tone = 'info', title, children, action }) {
  const t = TONES[tone] ?? TONES.info;
  const { Icon } = t;
  return (
    <div
      role={tone === 'critical' || tone === 'offline' ? 'alert' : 'status'}
      style={{
        display: 'flex', gap: 'var(--s3)', alignItems: 'flex-start',
        padding: 'var(--s3) var(--s4)', borderRadius: 'var(--r-tile)',
        background: t.bg, border: `1px solid ${t.bd}`
      }}
    >
      <Icon size={17} color={t.fg} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      <div style={{ flexGrow: 1 }}>
        <div style={{ color: t.fg, fontWeight: 600 }}>{title}</div>
        {children && <div style={{ color: 'var(--ink-dim)', marginTop: 3 }}>{children}</div>}
      </div>
      {action}
    </div>
  );
}
