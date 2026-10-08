import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, Terminal, RefreshCw, Award } from 'lucide-react';

interface RealPeer {
  name: string;
  ip: string;
  modeChar?: string;
  stateChar: string;
  stateLabel: string;
  stratum: number;
  pollInterval: string;
  reachOctal: string;
  lastSeenSeconds: string;
  rawLine?: string;
}

interface PeersResponse {
  realData: boolean;
  peers: RealPeer[];
  rawOutput: string;
}

export const UpstreamPeersView: React.FC = () => {
  const [peersData, setPeersData] = useState<PeersResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRawOutput, setShowRawOutput] = useState(false);

  const fetchPeers = async () => {
    try {
      const res = await fetch('/api/peers');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setPeersData(json.data);
        }
      }
    } catch (err) {
      console.warn('Errore lettura sorgenti chrony:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPeers();
    const interval = setInterval(fetchPeers, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchPeers();
  };

  const peers = peersData?.peers || [];
  const isReal = peersData?.realData ?? false;

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Sorgenti Upstream &amp; Quorum Chrony
            </h2>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              isReal
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {isReal ? '● SORGENTI REALI ATTIVE' : 'DEMO SORGENTI'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Server interrogati attivamente da Chrony (<code>chronyc sources -v</code>) per mantenere l&apos;orologio sincronizzato.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
            title="Esegui chronyc sources adesso"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Aggiorna Sorgenti</span>
          </button>
          <button
            onClick={() => setShowRawOutput(!showRawOutput)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output Console</span>
          </button>
        </div>
      </div>

      {/* Raw Output Terminal Collapsible */}
      {showRawOutput && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span>$ chronyc sources -v</span>
            <span className="text-[11px] text-emerald-400">Demone locale</span>
          </div>
          <pre className="text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
            {peersData?.rawOutput || 'Nessun output registrato.'}
          </pre>
        </div>
      )}

      {/* High-density Real Peers Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Tabella Nodi Attivi (chronyc sources)
          </h4>
          <span className="text-xs font-mono text-slate-400">
            {peers.length} server attivi nel quorum
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-medium">Server / Hostname</th>
                <th className="py-2.5 px-3 font-medium text-center">Stratum</th>
                <th className="py-2.5 px-3 font-medium">Stato Selezione</th>
                <th className="py-2.5 px-3 font-medium font-mono text-center">Intervallo Poll</th>
                <th className="py-2.5 px-3 font-medium font-mono text-center">Reach (Ottale)</th>
                <th className="py-2.5 px-4 font-medium font-mono text-right">Ultimo Rx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono tabular-nums">
              {peers.map((peer, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      {peer.stateChar === '*' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sorgente Attiva Sincronizzata" />
                      )}
                      <span>{peer.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      peer.stratum === 1
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      Stratum {peer.stratum}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className={`text-xs ${
                      peer.stateChar === '*'
                        ? 'text-emerald-400 font-semibold'
                        : peer.stateChar === '+'
                        ? 'text-sky-300'
                        : 'text-slate-400'
                    }`}>
                      {peer.stateLabel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-400 font-mono">
                    log2 = {peer.pollInterval}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-semibold text-[11px]">
                      {peer.reachOctal}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono">
                    {peer.lastSeenSeconds}s fa
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <span>Legenda Chrony: (*) = Sincronizzato attivo · (+) = Nel quorum · (-) = Scartato</span>
          <span className="text-emerald-400">Sincronizzazione orologio attiva</span>
        </div>
      </div>
    </div>
  );
};
