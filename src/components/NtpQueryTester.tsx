import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, Zap } from 'lucide-react';
import { getItalianTimeInfo } from '../utils/timeUtils.ts';

export const NtpQueryTester: React.FC = () => {
  const [targetIp, setTargetIp] = useState('127.0.0.1');
  const [port, setPort] = useState(123);
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    queryTarget: string;
    responseTimeMs: number;
    localOffsetMs: number;
    packet: {
      leapIndicator: number;
      leapName: string;
      versionNumber: number;
      mode: number;
      modeName: string;
      stratum: number;
      stratumType: string;
      pollInterval: string;
      precision: string;
      rootDelay: string;
      rootDispersion: string;
      referenceId: string;
      referenceTimestamp: string;
      originTimestamp: string;
      receiveTimestamp: string;
      transmitTimestamp: string;
      destinationTimestamp: string;
    };
    italianTimeInterpretation: {
      serverTimeItaly: string;
      timeZone: string;
      isDaylightSaving: boolean;
      offsetFromUtc: string;
    };
  } | null>(null);

  const handleTestQuery = () => {
    setIsLoading(true);
    
    // Simulate high precision NTP exchange (or fetch from /api/test-ntp)
    setTimeout(() => {
      const now = new Date();
      const timeInfo = getItalianTimeInfo(now);
      const t1 = Date.now() - 2;
      const t2 = Date.now() - 1;
      const t3 = Date.now();
      const t4 = Date.now() + 1;
      const roundtrip = (t4 - t1) - (t3 - t2);
      const offset = ((t2 - t1) + (t3 - t4)) / 2;

      setQueryResult({
        queryTarget: targetIp,
        responseTimeMs: Number((roundtrip + Math.random() * 0.4).toFixed(3)),
        localOffsetMs: Number(offset.toFixed(4)),
        packet: {
          leapIndicator: 0,
          leapName: 'no_warning (0 - Nessun secondo intercalare pendente)',
          versionNumber: 4,
          mode: 4,
          modeName: 'Server (4) - Risposta Unicast RFC 5905',
          stratum: 2,
          stratumType: 'Secondary Reference (Stratum 2, Sincronizzato con INRIM Torino)',
          pollInterval: '6 (64 secondi)',
          precision: '-24 (~59.6 nanosecondi)',
          rootDelay: '0.007629 s (7.62 ms)',
          rootDispersion: '0.000854 s (0.85 ms)',
          referenceId: 'C1CC72E8 (ntp1.inrim.it)',
          referenceTimestamp: new Date(Date.now() - 14000).toISOString(),
          originTimestamp: new Date(t1).toISOString(),
          receiveTimestamp: new Date(t2).toISOString(),
          transmitTimestamp: new Date(t3).toISOString(),
          destinationTimestamp: new Date(t4).toISOString(),
        },
        italianTimeInterpretation: {
          serverTimeItaly: timeInfo.italyTimeFormatted,
          timeZone: timeInfo.timeZoneName,
          isDaylightSaving: timeInfo.isDaylightSaving,
          offsetFromUtc: timeInfo.offsetString,
        }
      });
      setIsLoading(false);
    }, 350);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            NTP Query Tester &amp; Analizzatore Pacchetti (RFC 5905)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simula una richiesta client inviata al server Chrony e ispeziona l&apos;intestazione a 48 byte del protocollo NTP v4.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <Zap className="w-4 h-4" />
          <span>Porta UDP 123 Ready</span>
        </div>
      </div>

      {/* Query Form */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-6">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Indirizzo IP Host o FQDN Server NTP
            </label>
            <input
              type="text"
              value={targetIp}
              onChange={e => setTargetIp(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              placeholder="127.0.0.1 o 192.168.1.100"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Porta UDP
            </label>
            <input
              type="number"
              value={port}
              onChange={e => setPort(parseInt(e.target.value, 10) || 123)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              onClick={handleTestQuery}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`} />
              <span>{isLoading ? 'Interrogazione...' : 'Invia Pacchetto NTP'}</span>
            </button>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400 font-mono">Preset rapidi:</span>
          <button
            onClick={() => setTargetIp('127.0.0.1')}
            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono transition-colors"
          >
            Localhost (127.0.0.1)
          </button>
          <button
            onClick={() => setTargetIp('ntp1.inrim.it')}
            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono transition-colors"
          >
            ntp1.inrim.it (Torino)
          </button>
          <button
            onClick={() => setTargetIp('it.pool.ntp.org')}
            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono transition-colors"
          >
            it.pool.ntp.org (Pool Italia)
          </button>
        </div>
      </div>

      {/* Packet Breakdown Display */}
      {queryResult && (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-xs text-slate-400 block">Tempo di Risposta (RTT)</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {queryResult.responseTimeMs} ms
              </span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-xs text-slate-400 block">Offset Locale Stimato</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {queryResult.localOffsetMs >= 0 ? `+${queryResult.localOffsetMs}` : queryResult.localOffsetMs} ms
              </span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-xs text-slate-400 block">Orario Italiano Decodificato</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {queryResult.italianTimeInterpretation.serverTimeItaly} ({queryResult.italianTimeInterpretation.timeZone})
              </span>
            </div>
          </div>

          {/* Raw Header Fields Breakdown Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Decodifica Intestazione Pacchetto NTP v4 (Header Breakdown)
              </h4>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pacchetto Valido (48 bytes)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Campo RFC 5905</th>
                    <th className="py-2.5 px-3 font-medium">Valore Binario/Raw</th>
                    <th className="py-2.5 px-4 font-medium font-sans">Interpretazione &amp; Descrizione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-white">Leap Indicator (LI)</td>
                    <td className="py-2.5 px-3 text-emerald-400">{queryResult.packet.leapIndicator} (00b)</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">{queryResult.packet.leapName}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-white">Version Number (VN)</td>
                    <td className="py-2.5 px-3 text-emerald-400">{queryResult.packet.versionNumber} (100b)</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">NTP Versione 4 (Compatibile retroattivamente con v3)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-white">Mode</td>
                    <td className="py-2.5 px-3 text-emerald-400">{queryResult.packet.mode} (100b)</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">{queryResult.packet.modeName}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-white">Stratum</td>
                    <td className="py-2.5 px-3 text-emerald-400">{queryResult.packet.stratum}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">{queryResult.packet.stratumType}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-white">Poll Interval</td>
                    <td className="py-2.5 px-3 text-slate-300">{queryResult.packet.pollInterval}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">Intervallo massimo consentito tra richieste consecutive</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-white">Precision</td>
                    <td className="py-2.5 px-3 text-slate-300">{queryResult.packet.precision}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">Risoluzione del clock di sistema sottostante</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-white">Root Delay</td>
                    <td className="py-2.5 px-3 text-slate-300">{queryResult.packet.rootDelay}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">Ritardo cumulativo verso la sorgente primaria di tempo</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-white">Root Dispersion</td>
                    <td className="py-2.5 px-3 text-slate-300">{queryResult.packet.rootDispersion}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">Incertezza massima complessiva stimata</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-white">Reference ID</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{queryResult.packet.referenceId}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">Identificativo della sorgente atomica upstream sincronizzata</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-white">Transmit Timestamp (T3)</td>
                    <td className="py-2.5 px-3 text-slate-300">{queryResult.packet.transmitTimestamp}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">Momento esatto in cui il pacchetto ha lasciato il server</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
