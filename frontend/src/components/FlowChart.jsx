import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { clockTime } from '../utils/format.js';

const axis = { stroke: 'var(--ink-faint)', fontSize: 11, fontFamily: 'var(--font-mono)' };

export default function FlowChart({ frames = [], height = 260 }) {
  if (frames.length < 2) {
    return (
      <div style={{ height, display: 'grid', placeItems: 'center', color: 'var(--ink-dim)' }}>
        Waiting for enough samples to plot.
      </div>
    );
  }
  const data = frames.map((f) => ({
    t: clockTime(f.ts),
    'Flow 1': f.flow1,
    'Flow 2': f.flow2,
    'Water level': f.waterLevelPct
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="var(--line-soft)" vertical={false} />
        <XAxis dataKey="t" {...axis} tickLine={false} minTickGap={48} />
        <YAxis {...axis} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: 'var(--surface-sunk)', border: '1px solid var(--line)',
            borderRadius: 12, fontSize: 12, color: 'var(--ink)'
          }}
          labelStyle={{ color: 'var(--ink-dim)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: 'var(--ink-dim)' }} />
        <Line type="monotone" dataKey="Flow 1" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="Flow 2" stroke="var(--accent-alt)" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="Water level" stroke="var(--ok)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
