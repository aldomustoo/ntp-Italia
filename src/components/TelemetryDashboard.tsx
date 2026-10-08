import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Cpu, HardDrive, Zap, Terminal, RefreshCw } from 'lucide-react';

interface TelemetryDashboardProps {
  onNavigateToDocker: () => void;
  onNavigateToGuide: () => void;
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
  onNavigateToDocker,
  onNavigateToGuide,
}) => {
  const [offsetHistory, setOffsetHistory] = useState<number[]>([
    0.012, 0.015, 0.009, 0.014, 0.011, 0.013, 0.010, 0.012, 0.016, 0.012
  ]);
  const [currentOffset, setCurrentOffset] = useState(0.012);
  const [queriesCount, setQueriesCount] = useState(43290);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real microsecond subtle jitter around 0.012 ms
      const jitter = (Math.random() - 0.5) * 0.006;
      const nextOffset = Number((0.012 + jitter).toFixed(3));
      setCurrentOffset(nextOffset);
      setOffsetHistory(prev => [...prev.slice(1), nextOffset]);
      setQueriesCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Status Overview & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Cruscotto Telemetria Demone Chrony
            </h2>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              NOMINALE · STRATUM 2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Demone <code>chronyd</code> attivo in modalità NTP Server broadcast/unicast per subnet LAN.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
            title="Aggiorna metriche di sincronizzazione"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Poll Immediato</span>
          </button>
          <button
            onClick={onNavigateToDocker}
            className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap"
          >
            Configura Docker
          </button>
        </div>
      </div>

      {/* 6 Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Metric 1: System Offset */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Offset di Sistema (Δt)</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              +{currentOffset} ms
            </span>
            <span className="text-xs font-mono text-slate-400">
              (~{(currentOffset * 1000).toFixed(0)} µs)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, (currentOffset / 0.05) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Rif: INRIM Torino</span>
            <span className="text-emerald-400">Precisione microsecondo</span>
          </div>
        </div>

        {/* Metric 2: Root Delay */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Root Delay (Latenza RTT)</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              7.62 ms
            </span>
            <span className="text-xs font-mono text-emerald-400">
              fibra ottica IT
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[25%]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Andata/Ritorno INRIM</span>
            <span className="text-slate-300">Ottimale (&lt; 20ms)</span>
          </div>
        </div>

        {/* Metric 3: Root Dispersion */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Root Dispersion (Errore Max)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              0.85 ms
            </span>
            <span className="text-xs font-mono text-slate-400">
              errore max garantito
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[18%]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Stabilità quarzo host</span>
            <span className="text-emerald-400">Eccellente</span>
          </div>
        </div>

        {/* Metric 4: Frequency Drift (ppm) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Compensazione Frequenza (Drift)</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              -1.782 ppm
            </span>
            <span className="text-xs font-mono text-slate-400">
              parti per milione
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[35%]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Salvataggio su /var/lib/chrony</span>
            <span className="text-slate-300">Driftfile attivo</span>
          </div>
        </div>

        {/* Metric 5: Clock Precision */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Risoluzione Timer Hardware</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              59.6 ns
            </span>
            <span className="text-xs font-mono text-slate-400">
              (log2 = -24)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[95%]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Timer TSC / HPET Linux</span>
            <span className="text-emerald-400">Sub-microsecondo</span>
          </div>
        </div>

        {/* Metric 6: Total Queries Served */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Pacchetti NTP Serviti alla LAN</span>
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {queriesCount.toLocaleString('it-IT')}
            </span>
            <span className="text-xs font-mono text-slate-400">
              query UDP 123
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[100%]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Tasso richieste</span>
            <span className="text-slate-300">~2-4 req/sec</span>
          </div>
        </div>
      </div>

      {/* Real-time Offset Wave Visualizer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Stabilità Temporale e Jitter in Tempo Reale
            </h3>
            <p className="text-xs text-slate-400">
              Variazione dell&apos;offset rispetto all&apos;orologio atomico INRIM (finestra mobile ultimi 20 secondi).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Min: <strong className="text-white">0.009 ms</strong></span>
            <span>Max: <strong className="text-white">0.016 ms</strong></span>
            <span>Jitter: <strong className="text-emerald-400">0.003 ms</strong></span>
          </div>
        </div>

        {/* Minimal Bar Chart without bloated external dependencies */}
        <div className="h-28 flex items-end gap-2 pt-4 px-2 bg-slate-950/60 rounded-lg border border-slate-800/80">
          {offsetHistory.map((val, idx) => {
            const heightPercent = Math.min(100, Math.max(20, (val / 0.02) * 85));
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
                  t-{10 - idx * 2}s
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Command Output Simulation */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="text-slate-300 ml-2 font-medium">docker exec -it ntp-server-italia chronyc tracking</span>
          </div>
          <span className="text-slate-400">Output Diagnostica Ufficiale</span>
        </div>

        <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
{`Reference ID    : C1CC72E8 (ntp1.inrim.it)
Stratum         : 2
Ref time (UTC)  : ${new Date(Date.now() - 14000).toUTCString()}
System time     : 0.000012480 seconds fast of NTP time
Last offset     : -0.000003921 seconds
RMS offset      : 0.000021480 seconds
Frequency       : -1.782 ppm slow
Residual freq   : +0.001 ppm
Skew            : 0.028 ppm
Root delay      : 0.007629412 seconds
Root dispersion : 0.000854128 seconds
Update interval : 64.2 seconds
Leap status     : Normal`}
        </pre>
      </div>
    </div>
  );
};
