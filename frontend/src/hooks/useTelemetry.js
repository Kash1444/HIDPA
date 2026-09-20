import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api.js';
import { buildFrames } from '../services/demoScenarios.js';
import { diagnose, drainHealthIndex } from '../services/diagnosis.js';
import { PROV, ageProvenance } from '../services/provenance.js';
import { ageSeconds } from '../utils/format.js';
import {
  normalizeTelemetry,
  normalizePrediction
} from '../services/normalize.js';

const POLL_MS = Number(import.meta.env.VITE_POLL_MS ?? 2000);
const STALE_AFTER_S = Number(import.meta.env.VITE_STALE_AFTER_S ?? 10);
const OFFLINE_AFTER_S = Number(import.meta.env.VITE_OFFLINE_AFTER_S ?? 30);
const BUFFER = 300;

export function useTelemetry({ mode, scenario }) {
  const [frames, setFrames] = useState([]);
  const [connection, setConnection] = useState({
    state: 'connecting',
    error: null
  });

  const [backendVerdict, setBackendVerdict] = useState(null);

  const demoIndex = useRef(0);
  const demoFrames = useRef([]);

  useEffect(() => {
    if (mode !== 'demo') return undefined;

    demoFrames.current = buildFrames(scenario);
    demoIndex.current = 0;

    setFrames([]);
    setBackendVerdict(null);
    setConnection({
      state: 'demo',
      error: null
    });

    const id = setInterval(() => {
      const all = demoFrames.current;

      if (!all.length) return;

      const i = demoIndex.current;

      const frame = {
        ...all[i],
        ts: new Date().toISOString()
      };

      setFrames((prev) =>
        [...prev, frame].slice(-BUFFER)
      );

      demoIndex.current =
        (i + 1) % all.length;
    }, 1000);

    return () => clearInterval(id);
  }, [mode, scenario]);

  useEffect(() => {
    if (mode !== 'live') return undefined;

    let cancelled = false;

    const controller = new AbortController();

    async function tick() {
      const [latest, prediction] =
        await Promise.all([
          api.latest({
            signal: controller.signal
          }),

          api.prediction({
            signal: controller.signal
          })
        ]);

      if (cancelled) return;

      if (!latest.ok) {
        if (!latest.aborted) {
          setConnection({
            state: 'unreachable',
            error: latest.error
          });
        }

        return;
      }

      setConnection({
        state: 'connected',
        error: null
      });

      const normalized =
        normalizeTelemetry(latest.data);

      if (normalized) {
        setFrames((prev) => {
          const last =
            prev[prev.length - 1];

          // Backend uses timestamp.
          // The adapter exposes it as ts.
          if (
            last?.ts &&
            normalized.ts &&
            last.ts === normalized.ts
          ) {
            return prev;
          }

          return [
            ...prev,
            normalized
          ].slice(-BUFFER);
        });
      }

      if (prediction.ok) {
        setBackendVerdict(
          normalizePrediction(
            prediction.data,
            latest.data
          )
        );
      } else {
        setBackendVerdict(null);
      }
    }

    tick();

    const id = setInterval(
      tick,
      POLL_MS
    );

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
    };
  }, [mode]);

  const latest =
    frames.length
      ? frames[frames.length - 1]
      : null;

  const age =
    latest
      ? ageSeconds(latest.ts)
      : null;

  const provenance = useMemo(() => {
    if (!latest) {
      return PROV.UNAVAILABLE;
    }

    if (latest.isDemo) {
      return PROV.DEMO;
    }

    return ageProvenance(
      PROV.LIVE,
      age,
      STALE_AFTER_S,
      OFFLINE_AFTER_S
    );
  }, [latest, age]);

  const verdict = useMemo(() => {
    if (backendVerdict) {
      return {
        ...backendVerdict,
        engine:
          backendVerdict.engine ??
          'FUSION'
      };
    }

    if (!frames.length) {
      return null;
    }

    return diagnose(frames);
  }, [backendVerdict, frames]);

  const dhi = useMemo(
    () =>
      verdict
        ? drainHealthIndex(verdict)
        : null,
    [verdict]
  );

  return {
    frames,
    latest,
    verdict,
    dhi,
    connection,
    provenance,
    ageSeconds: age
  };
}