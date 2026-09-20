import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Diagnosis from './pages/Diagnosis.jsx';
import DrainHealth from './pages/DrainHealth.jsx';
import Analytics from './pages/Analytics.jsx';
import DeviceView from './pages/DeviceView.jsx';
import About from './pages/About.jsx';
import { useTelemetry } from './hooks/useTelemetry.js';
import api from './services/api.js';

export default function App() {
  const [mode, setMode] = useState('live');
  const [scenario, setScenario] = useState('fullSequence');
  const [modelStatus, setModelStatus] = useState('Untrained');

  const telemetry = useTelemetry({ mode, scenario });

  // Ask the backend what the model's real status is. We never assume it is
  // trained, and we never display metrics the backend has not reported.
  useEffect(() => {
    let cancelled = false;
    api.modelInfo().then((res) => {
      if (cancelled) return;
      if (res.ok && res.data?.status) setModelStatus(res.data.status);
      else setModelStatus('Untrained');
    });
    return () => { cancelled = true; };
  }, []);

  const shared = { ...telemetry, modelStatus };

  return (
    <AppShell
      provenance={telemetry.provenance}
      latest={telemetry.latest}
      modelStatus={modelStatus}
      modeProps={{ mode, setMode, scenario, setScenario }}
    >
      <Routes>
        <Route path="/" element={<Dashboard {...shared} />} />
        <Route path="/diagnosis" element={<Diagnosis {...shared} />} />
        <Route path="/health" element={<DrainHealth {...shared} />} />
        <Route path="/analytics" element={<Analytics {...shared} />} />
        <Route path="/device" element={<DeviceView {...shared} />} />
        <Route path="/about" element={<About modelStatus={modelStatus} />} />
      </Routes>
    </AppShell>
  );
}
