import React from 'react';
import { ShieldCheck, Server, Globe2, CheckCircle2, Award } from 'lucide-react';

interface PeerItem {
  name: string;
  ip: string;
  location: string;
  description: string;
  stratum: number;
  mode: string;
  state: string;
  stateLabel: string;
  delayMs: number;
  offsetMs: number;
  jitterMs: number;
  reachOctal: number;
  reachPercent: number;
  lastSeen: string;
}

const PEERS_DATA: PeerItem[] = [
  {
    name: 'ntp1.inrim.it',
    ip: '193.204.114.232',
    location: 'Torino (INRIM)',
    description: 'Campione Nazionale di Tempo - Orologio Atomico al Cesio (Fontana atomica IT)',
    stratum: 1,
    mode: 'server (prefer)',
    state: 'SYNC',
    stateLabel: 'Sorgente Principale Selezionata (*)',
    delayMs: 8.24,
    offsetMs: 0.012,
    jitterMs: 0.028,
    reachOctal: 377,
    reachPercent: 100,
    lastSeen: '12s fa',
  },
  {
    name: 'ntp2.inrim.it',
    ip: '193.204.114.233',
    location: 'Torino (INRIM)',
    description: 'Campione Nazionale di Tempo - Secondo Nodo Atomico Ridondato',
    stratum: 1,
    mode: 'server',
    state: 'CANDIDATE',
    stateLabel: 'Candidato di Riserva (+)',
    delayMs: 8.91,
    offsetMs: -0.008,
    jitterMs: 0.035,
    reachOctal: 377,
    reachPercent: 100,
    lastSeen: '18s fa',
  },
  {
    name: '0.it.pool.ntp.org',
    ip: '193.206.139.38',
    location: 'Milano (GARR)',
    description: 'Pool Italiano - Rete Telematica Nazionale della Ricerca Italiana',
    stratum: 2,
    mode: 'pool',
    state: 'COMBINED',
    stateLabel: 'Combinato nel Quorum (+)',
    delayMs: 11.45,
    offsetMs: 0.022,
    jitterMs: 0.064,
    reachOctal: 377,
    reachPercent: 100,
    lastSeen: '34s fa',
  },
  {
    name: '1.it.pool.ntp.org',
    ip: '194.116.83.250',
    location: 'Bologna (CINECA)',
    description: 'Pool Italiano - Consorzio Interuniversitario di Calcolo CINECA',
    stratum: 2,
    mode: 'pool',
    state: 'COMBINED',
    stateLabel: 'Combinato nel Quorum (+)',
    delayMs: 10.12,
    offsetMs: -0.015,
    jitterMs: 0.058,
    reachOctal: 377,
    reachPercent: 100,
    lastSeen: '40s fa',
  },
  {
    name: '2.it.pool.ntp.org',
    ip: '151.12.18.9',
    location: 'Roma (TIM)',
    description: 'Pool Italiano - Backbone TIM / Sparkle Roma',
    stratum: 2,
    mode: 'pool',
    state: 'COMBINED',
    stateLabel: 'Combinato nel Quorum (+)',
    delayMs: 14.80,
    offsetMs: 0.031,
    jitterMs: 0.076,
    reachOctal: 377,
    reachPercent: 100,
    lastSeen: '45s fa',
  },
  {
    name: 'europe.pool.ntp.org',
    ip: '162.159.200.123',
    location: 'Milano Anycast',
    description: 'Pool Geografico Europeo - Ridondanza Anycast ad alta capacità',
    stratum: 3,
    mode: 'pool',
    state: 'BACKUP',
    stateLabel: 'Backup Caldo',
    delayMs: 6.85,
    offsetMs: 0.018,
    jitterMs: 0.042,
    reachOctal: 377,
    reachPercent: 100,
    lastSeen: '58s fa',
  },
];

export const UpstreamPeersView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Sorgenti Ufficiali Italiane &amp; Quorum Chrony
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Il demone locale interroga costantemente l&apos;Istituto Metrologico Nazionale e il pool nazionale selezionando la sorgente a minor dispersione.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <Award className="w-4 h-4" />
          <span>INRIM Stratum 1 Confermato</span>
        </div>
      </div>

      {/* Focus on INRIM */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">
              Perché synchronizzarsi con l&apos;INRIM (Istituto Nazionale di Ricerca Metrologica)?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              L&apos;INRIM di Torino è l&apos;ente pubblico di ricerca che custodisce e genera il <strong>Tempo Legale Italiano (UTC(IT))</strong> attraverso orologi atomici al cesio e maser a idrogeno primari.
              Configurando <code>ntp1.inrim.it</code> e <code>ntp2.inrim.it</code> con la direttiva <code>prefer</code> nel nostro file <code>chrony.conf</code>, la tua rete locale attinge direttamente alla fonte temporale con valore legale e scientifico in Italia, senza intermediari o latenze transfrontaliere.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> UTC(IT) Campione Primario
              </span>
              <span>·</span>
              <span>Frequenza Cesareo: 9.192.631.770 Hz</span>
              <span>·</span>
              <span>Incertezza &lt; 10⁻¹⁵ s</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-density Peers Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Tabella Peers Upstream (chronyc sources -v)
          </h4>
          <span className="text-xs font-mono text-slate-400">
            6 server configurati · 1 preferito
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-medium">Server / Hostname</th>
                <th className="py-2.5 px-3 font-medium">Ubicazione</th>
                <th className="py-2.5 px-3 font-medium text-center">Stratum</th>
                <th className="py-2.5 px-3 font-medium">Stato Chrony</th>
                <th className="py-2.5 px-3 font-medium text-right font-mono">RTT Delay</th>
                <th className="py-2.5 px-3 font-medium text-right font-mono">Offset</th>
                <th className="py-2.5 px-3 font-medium text-right font-mono">Jitter</th>
                <th className="py-2.5 px-4 font-medium text-center font-mono">Reach (Ottale)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono tabular-nums">
              {PEERS_DATA.map((peer, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      {peer.state === 'SYNC' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Sorgente Attiva" />
                      )}
                      <span>{peer.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {peer.ip} · {peer.mode}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-300">
                    <div>{peer.location}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {peer.description}
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
                      peer.state === 'SYNC'
                        ? 'text-emerald-400 font-semibold'
                        : peer.state === 'CANDIDATE'
                        ? 'text-sky-300'
                        : 'text-slate-400'
                    }`}>
                      {peer.stateLabel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-white">
                    {peer.delayMs.toFixed(2)} ms
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={peer.offsetMs >= 0 ? 'text-emerald-400' : 'text-sky-400'}>
                      {peer.offsetMs >= 0 ? `+${peer.offsetMs.toFixed(3)}` : peer.offsetMs.toFixed(3)} ms
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    ±{peer.jitterMs.toFixed(3)} ms
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-semibold text-[11px]">
                      {peer.reachOctal} (100%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <span>Legenda Chrony: (*) = Sincronizzato primario · (+) = Nel quorum selezionato · (=) = Backup</span>
          <span className="text-emerald-400">Tutti i 6 nodi raggiungibili (0 pacchetti persi)</span>
        </div>
      </div>
    </div>
  );
};
