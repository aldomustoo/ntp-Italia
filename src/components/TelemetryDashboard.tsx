import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Cpu, HardDrive, Zap, Terminal, RefreshCw } from 'lucide-react';

interface TelemetryDashboardProps {
  onNavigateToDocker: () => void;
  onNavigateToGuide: () => void;
}

interface RealTrackingData {
  realData: boolean;
  sourceType: string;
  stratum: number;
  referenceId: string;
  systemOffsetSeconds: number;
  lastOffsetSeconds: number;
  rmsOffsetSeconds: number;
  frequencyPpm: number;
  residualFreqPpm: number;
  skewPpm: number;
  rootDelaySeconds: number;
  rootDispersionSeconds: number;
  updateIntervalSeconds: number;
  leapStatus: string;
  uptimeSeconds: number;
  rawOutput: string;
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
  onNavigateToDocker,
}) => {
  const [trackingData, setTrackingData] = useState<RealTrackingData | null>(null);
  const [offsetHistory, setOffsetHistory] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRawTracking, setShowRawTracking] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data as RealTrackingData;
          setTrackingData(d);
          const offsetMs = Number((d.systemOffsetSeconds * 1000).toFixed(4));
          setOffsetHistory(prev => {
            const next = [...prev, offsetMs];
            return next.length > 12 ? next.slice(1) : next;
          });
        }
      }
    } catch (err) {
      console.warn('Errore lettura telemetria chrony:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchStatus();
  };

  const isReal = trackingData?.realData ?? false;
  const currentOffsetSeconds = trackingData?.systemOffsetSeconds ?? 0.000012;
  const currentOffsetMs = Number((currentOffsetSeconds * 1000).toFixed(3));
  const rootDelayMs = Number(((trackingData?.rootDelaySeconds ?? 0.0076) * 1000).toFixed(2));
  const rootDispersionMs = Number(((trackingData?.rootDispersionSeconds ?? 0.00085) * 1000).toFixed(2));
  const frequencyPpm = trackingData?.frequencyPpm ?? -1.782;

  return (
    <div className="space-y-6">
      {/* Top Banner: Status Overview & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isReal ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Cruscotto Telemetria Demone Chrony
            </h2>
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              isReal
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {isReal ? '● TELEMETRIA REALE CHRONYD' : 'STANDALONE DEMO'} · STRATUM {trackingData?.stratum ?? 2}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sorgente di riferimento attiva: <strong className="text-white font-mono">{trackingData?.referenceId ?? 'INRIM (ntp1.inrim.it)'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
            title="Esegui chronyc tracking adesso"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Poll Reale</span>
          </button>
          <button
            onClick={() => setShowRawTracking(!showRawTracking)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output chronyc</span>
          </button>
          <button
            onClick={onNavigateToDocker}
            className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap"
          >
            Configura Docker
          </button>
        </div>
      </div>

      {/* Raw Output Terminal Collapsible */}
      {showRawTracking && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span>$ chronyc tracking</span>
            <span className="text-[11px] text-emerald-400">Socket locale Linux</span>
          </div>
          <pre className="text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
            {trackingData?.rawOutput || 'Nessun output registrato.'}
          </pre>
        </div>
      )}

      {/* 6 Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Metric 1: System Offset */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Offset di Sistema Reale (Δt)</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {currentOffsetMs >= 0 ? `+${currentOffsetMs}` : currentOffsetMs} ms
            </span>
            <span className="text-xs font-mono text-slate-400">
              ({currentOffsetSeconds >= 0 ? `+${currentOffsetSeconds.toFixed(6)}` : currentOffsetSeconds.toFixed(6)}s)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, Math.abs(currentOffsetMs) * 50))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Rif: {trackingData?.referenceId || 'Demone attivo'}</span>
            <span className="text-emerald-400">Sincronizzazione attiva</span>
          </div>
        </div>

        {/* Metric 2: Root Delay */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Root Delay Reale (Latenza RTT)</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {rootDelayMs} ms
            </span>
            <span className="text-xs font-mono text-emerald-400">
              verso la sorgente
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[25%]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Ritardo di rete cumulativo</span>
            <span className="text-slate-300">Misurato da Chrony</span>
          </div>
        </div>

        {/* Metric 3: Root Dispersion */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Root Dispersion (Incertezza Max)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {rootDispersionMs} ms
            </span>
            <span className="text-xs font-mono text-slate-400">
              errore max garantito
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[18%]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Stabilità orologio locale</span>
            <span className="text-emerald-400">Nominale</span>
          </div>
        </div>

        {/* Metric 4: Frequency Drift (ppm) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Deriva Frequenza Quarzo (ppm)</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {frequencyPpm.toFixed(3)} ppm
            </span>
            <span className="text-xs font-mono text-slate-400">
              parti per milione
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[35%]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Residual: {trackingData?.residualFreqPpm ?? 0} ppm</span>
            <span className="text-slate-300">Driftfile attivo</span>
          </div>
        </div>

        {/* Metric 5: Leap Status */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Stato Secondo Intercalare (Leap)</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {trackingData?.leapStatus || 'Normal'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[100%]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Scala UTC continua</span>
            <span className="text-emerald-400">Nessun salto pendente</span>
          </div>
        </div>

        {/* Metric 6: Interval & Stratum */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Intervallo di Aggiornamento</span>
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {trackingData?.updateIntervalSeconds ?? 64}s
            </span>
            <span className="text-xs font-mono text-slate-400">
              intervallo poll Chrony
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[70%]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Livello di Stratum</span>
            <span className="text-slate-200">Stratum {trackingData?.stratum ?? 2}</span>
          </div>
        </div>
      </div>

      {/* Live Wave Visualizer with Real Samples */}
      {offsetHistory.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Stabilità Offset nel Tempo (Campioni Reali Registrati)
              </h3>
              <p className="text-xs text-slate-400">
                Variazione in millisecondi registrata direttamente dai cicli di poll del demone locale.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>Campione Attuale: <strong className="text-emerald-400">{currentOffsetMs} ms</strong></span>
            </div>
          </div>

          <div className="h-24 flex items-end gap-2 pt-4 px-2 bg-slate-950/60 rounded-lg border border-slate-800/80">
            {offsetHistory.map((val, idx) => {
              const maxVal = Math.max(...offsetHistory.map(Math.abs), 0.05);
              const heightPercent = Math.min(100, Math.max(15, (Math.abs(val) / maxVal) * 90));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}ms
                  </span>
                  <div
                    className="w-full bg-emerald-500/80 group-hover:bg-emerald-400 rounded-t transition-all duration-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] font-mono text-slate-400">
                    #{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
