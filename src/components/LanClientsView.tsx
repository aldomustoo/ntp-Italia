import React from 'react';
import { Network, Laptop, Camera, Home, HardDrive, Wifi, Cpu, ShieldCheck } from 'lucide-react';

interface LanClient {
  ip: string;
  hostname: string;
  deviceType: string;
  icon: 'router' | 'camera' | 'iot' | 'pc' | 'nas' | 'home';
  pollInterval: string;
  lastPollAgo: string;
  version: string;
  offsetMs: number;
  delayMs: number;
  status: 'SYNCHRONIZED' | 'NOMINAL';
}

const LAN_CLIENTS_DATA: LanClient[] = [
  {
    ip: '192.168.1.1',
    hostname: 'fritz.box',
    deviceType: 'Router & Server DHCP',
    icon: 'router',
    pollInterval: '1024s (~17 min)',
    lastPollAgo: '12m fa',
    version: 'NTP v4',
    offsetMs: 0.045,
    delayMs: 0.42,
    status: 'SYNCHRONIZED',
  },
  {
    ip: '192.168.1.15',
    hostname: 'homeassistant.lan',
    deviceType: 'Home Automation Green / Pi 5',
    icon: 'home',
    pollInterval: '64s (~1 min)',
    lastPollAgo: '32s fa',
    version: 'NTP v4 (Chrony Client)',
    offsetMs: 0.008,
    delayMs: 0.35,
    status: 'SYNCHRONIZED',
  },
  {
    ip: '192.168.1.40',
    hostname: 'cam-poe-giardino.lan',
    deviceType: 'Telecamera CCTV PoE Dahua 4K',
    icon: 'camera',
    pollInterval: '300s (5 min)',
    lastPollAgo: '2m fa',
    version: 'SNTP v4',
    offsetMs: -0.12,
    delayMs: 1.15,
    status: 'SYNCHRONIZED',
  },
  {
    ip: '192.168.1.41',
    hostname: 'cam-poe-ingresso.lan',
    deviceType: 'Telecamera CCTV PoE Hikvision ColorVu',
    icon: 'camera',
    pollInterval: '300s (5 min)',
    lastPollAgo: '1m fa',
    version: 'SNTP v4',
    offsetMs: -0.09,
    delayMs: 1.08,
    status: 'SYNCHRONIZED',
  },
  {
    ip: '192.168.1.102',
    hostname: 'workstation-win11.lan',
    deviceType: 'PC Desktop Windows 11 (W32Time)',
    icon: 'pc',
    pollInterval: '1024s (~17 min)',
    lastPollAgo: '8m fa',
    version: 'NTP v3/v4',
    offsetMs: 0.032,
    delayMs: 0.51,
    status: 'SYNCHRONIZED',
  },
  {
    ip: '192.168.1.105',
    hostname: 'macbook-pro-m3.lan',
    deviceType: 'Apple Mac (timed daemon)',
    icon: 'pc',
    pollInterval: '512s (~8 min)',
    lastPollAgo: '4m fa',
    version: 'NTP v4',
    offsetMs: 0.015,
    delayMs: 0.62,
    status: 'SYNCHRONIZED',
  },
  {
    ip: '192.168.1.66',
    hostname: 'esp32-cronotermostato.lan',
    deviceType: 'Nodo IoT ESP32 (Arduino core)',
    icon: 'iot',
    pollInterval: '3600s (1 ora)',
    lastPollAgo: '24m fa',
    version: 'SNTP (configTime)',
    offsetMs: 0.25,
    delayMs: 2.10,
    status: 'SYNCHRONIZED',
  },
  {
    ip: '192.168.1.200',
    hostname: 'synology-ds920.lan',
    deviceType: 'NAS Synology Storage Server',
    icon: 'nas',
    pollInterval: '256s (~4 min)',
    lastPollAgo: '1m fa',
    version: 'NTP v4',
    offsetMs: 0.011,
    delayMs: 0.38,
    status: 'SYNCHRONIZED',
  },
];

export const LanClientsView: React.FC = () => {
  const getDeviceIcon = (type: LanClient['icon']) => {
    switch (type) {
      case 'router': return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'camera': return <Camera className="w-4 h-4 text-sky-400" />;
      case 'home': return <Home className="w-4 h-4 text-amber-400" />;
      case 'pc': return <Laptop className="w-4 h-4 text-indigo-400" />;
      case 'nas': return <HardDrive className="w-4 h-4 text-purple-400" />;
      case 'iot': return <Cpu className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-emerald-400" />
            Dispositivi Rete Locale (LAN) Sincronizzati
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualizzazione dei client interni che interrogano questo server NTP (porta UDP 123) per mantenere sincronizzati i log e i timestamp.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Subnet Autorizzate: 192.168.0.0/16 · 10.0.0.0/8</span>
        </div>
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block font-sans">Client Attivi Monitorati</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">8 dispositivi</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block font-sans">Latenza LAN Media (RTT)</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">&lt; 0.95 ms</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block font-sans">Offset Massimo LAN</span>
          <span className="text-xl font-bold font-mono text-slate-200 mt-1 block">±0.25 ms</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block font-sans">Policy di Accesso</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">Ratelimit Attivo</span>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Registro Query Client LAN (chronyc clients)
          </h4>
          <span className="text-xs font-mono text-slate-400">
            Filtro: Tutti i client attivi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-medium">Dispositivo / Hostname</th>
                <th className="py-2.5 px-3 font-medium font-mono">Indirizzo IP</th>
                <th className="py-2.5 px-3 font-medium">Tipologia &amp; Ruolo</th>
                <th className="py-2.5 px-3 font-medium">Protocollo</th>
                <th className="py-2.5 px-3 font-medium font-mono">Intervallo Poll</th>
                <th className="py-2.5 px-3 font-medium font-mono">Ultimo Poll</th>
                <th className="py-2.5 px-3 font-medium text-right font-mono">Offset LAN</th>
                <th className="py-2.5 px-4 font-medium text-center">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono tabular-nums">
              {LAN_CLIENTS_DATA.map((client, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      {getDeviceIcon(client.icon)}
                      <span>{client.hostname}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-400">
                    {client.ip}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-300">
                    {client.deviceType}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-400">
                    {client.version}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {client.pollInterval}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {client.lastPollAgo}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={Math.abs(client.offsetMs) < 0.1 ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                      {client.offsetMs > 0 ? `+${client.offsetMs.toFixed(3)}` : client.offsetMs.toFixed(3)} ms
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[11px]">
                      Sincronizzato
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Configura l&apos;Opzione DHCP 42 del router per propagare l&apos;IP del container a tutti i futuri client.</span>
          <span className="text-emerald-400 font-mono">0 pacchetti scartati · Accesso LAN illimitato</span>
        </div>
      </div>
    </div>
  );
};
