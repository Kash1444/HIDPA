export default function Tile({ title, children, footer, tone }) {
  const accentLine = tone
    ? { borderColor: { ok: 'var(--ok-line)', warn: 'var(--warn-line)', alarm: 'var(--alarm-line)', critical: 'var(--critical-line)' }[tone] }
    : null;
  return (
    <section className="tile" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)', ...accentLine }}>
      <h3 style={{ color: 'var(--ink-dim)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--s3)', flexGrow: 1 }}>
        {children}
      </div>
      {footer && <div className="label">{footer}</div>}
    </section>
  );
}
