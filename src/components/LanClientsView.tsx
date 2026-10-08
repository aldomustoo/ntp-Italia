import React, { useState, useEffect } from 'react';
import { Network, Laptop, Wifi, ShieldCheck, RefreshCw, Terminal, ArrowRight, Clock } from 'lucide-react';

interface RealLanClient {
  ip: string;
  hostname: string;
  deviceType: string;
  ntpPackets: number;
  droppedPackets: number;
  pollInterval: string;
  lastSeen: string;
  status: string;
  rawLine?: string;
}

interface ClientsResponse {
  realData: boolean;
  clientLoggingEnabled: boolean;
  clientsCount: number;
  clients: RealLanClient[];
  rawOutput: string;
}

export const LanClientsView: React.FC = () => {
  const [clientsData, setClientsData] = useState<ClientsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRawLogs, setShowRawLogs] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/lan-clients');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setClientsData(json.data);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.warn('Errore recupero client da chronyc:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // Polling automatico ogni 3 secondi per vedere i client comparire in tempo reale
    const interval = setInterval(fetchClients, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchClients();
  };

  const clients = clientsData?.clients || [];
  const isReal = clientsData?.realData ?? false;

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Client Rete Locale (LAN) Sincronizzati
            </h2>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              isReal
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {isReal ? '● SOCKET REALE CHRONYD' : 'IN ASCOLTO UDP 123'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dati estratti direttamente dalla memoria del demone (<code>chronyc clients</code>). Mostra solo gli IP che hanno effettuato almeno una query NTP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
            title="Esegui chronyc clients adesso"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Aggiorna Adesso</span>
          </button>
          <button
            onClick={() => setShowRawLogs(!showRawLogs)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output Console</span>
          </button>
        </div>
      </div>

      {/* Raw Output Terminal Collapsible */}
      {showRawLogs && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span>$ chronyc clients</span>
            <span className="text-[11px]">{lastUpdated.toLocaleTimeString('it-IT')}</span>
          </div>
          <pre className="text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
            {clientsData?.rawOutput || 'Nessun output registrato.'}
          </pre>
        </div>
      )}

      {/* Real Clients Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block font-sans">Dispositivi Connessi</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {clients.length} {clients.length === 1 ? 'client' : 'client'}
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block font-sans">Totale Pacchetti Ricevuti</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {clients.reduce((acc, c) => acc + c.ntpPackets, 0)} pacchetti
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block font-sans">Pacchetti Scartati (Drop)</span>
          <span className="text-xl font-bold font-mono text-slate-200 mt-1 block">
            {clients.reduce((acc, c) => acc + c.droppedPackets, 0)} drop
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block font-sans">Frequenza Monitoraggio</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">Live (3s)</span>
        </div>
      </div>

      {/* Main Content Area: Real Table vs Zero-Clients State */}
      {isLoading ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs font-mono">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
          <span>Interrogazione demone Chrony in corso...</span>
        </div>
      ) : clients.length === 0 ? (
        /* Empty State: NO mock data, real explanation & test guide */
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Wifi className="w-6 h-6 animate-pulse text-emerald-400" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-white">
              In ascolto su porta UDP 123
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Il server NTP è operativo, ma nessun dispositivo sulla tua rete locale (LAN) ha ancora inviato una richiesta di sincronizzazione oraria.
            </p>
          </div>

          {/* Quick instructions to generate the first real connection */}
          <div className="max-w-xl mx-auto bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Come far apparire subito i tuoi dispositivi qui:</span>
            </div>

            <div className="space-y-2 text-slate-300 font-mono text-[11px]">
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-0.5">1. Test rapido da un PC Windows sulla LAN:</span>
                <code>w32tm /config /manualpeerlist:&quot;IP-DEL-SERVER,0x8&quot; /syncfromflags:manual /update &amp;&amp; w32tm /resync</code>
              </div>

              <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-0.5">2. Test rapido da Linux / macOS:</span>
                <code>sudo sntp -sS IP-DEL-SERVER</code>
              </div>

              <div className="p-2.5 bg-slate-900 rounded border border-slate-800 font-sans">
                <span className="text-emerald-400 font-bold block mb-0.5 font-mono">3. Sincronizzazione automatica globale (Router):</span>
                <span className="text-slate-400">
                  Imposta l&apos;IP del server nel campo <strong>Opzione DHCP 42 (NTP)</strong> del tuo router. Tutti i PC, smartphone, telecamere e nodi IoT appariranno qui automaticamente ad ogni rinnovo IP.
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Real Connected Clients Table */
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Client Attivi Rilevati da Chrony
            </h4>
            <span className="text-xs font-mono text-emerald-400">
              {clients.length} nodi LAN registrati
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Indirizzo IP Client</th>
                  <th className="py-2.5 px-3 font-medium">Tipologia Rilevata</th>
                  <th className="py-2.5 px-3 font-medium text-right font-mono">Pacchetti NTP</th>
                  <th className="py-2.5 px-3 font-medium text-right font-mono">Drop</th>
                  <th className="py-2.5 px-3 font-medium font-mono">Intervallo Poll</th>
                  <th className="py-2.5 px-3 font-medium font-mono">Ultimo Accesso</th>
                  <th className="py-2.5 px-4 font-medium text-center">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono tabular-nums">
                {clients.map((client, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-bold text-emerald-400">
                        <Laptop className="w-4 h-4 text-slate-400" />
                        <span>{client.ip}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      {client.deviceType}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-white">
                      {client.ntpPackets} req
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {client.droppedPackets}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      log2 = {client.pollInterval}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {client.lastSeen}s fa
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[11px]">
                        Attivo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Dati in tempo reale estratti dal comando <code>chronyc clients</code>.</span>
            <span className="text-emerald-400 font-mono">Aggiornato alle {lastUpdated.toLocaleTimeString('it-IT')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
