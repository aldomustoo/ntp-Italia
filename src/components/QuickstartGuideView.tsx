import React, { useState } from 'react';
import { BookOpen, Copy, Check, Terminal, Wifi, Laptop, Camera, Cpu, ShieldCheck } from 'lucide-react';

export const QuickstartGuideView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Guida Rapida al Deployment Immediato
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tutto ciò che serve per avviare il container in 30 secondi e sincronizzare tutti i dispositivi della tua rete locale.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4" />
          <span>Testato su Ubuntu, Debian, Proxmox, NAS e Raspberry Pi</span>
        </div>
      </div>

      {/* Step 1: Docker Run vs Docker Compose */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">
            1
          </span>
          <h3 className="text-base font-semibold text-white">
            Avvio Immediato del Container (Scegli tra Docker Run o Compose)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card A: Docker Run */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Opzione A: 1-Comando Docker Run
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ideale per test rapido o macchine standalone.
                </p>
              </div>
              <button
                onClick={() => handleCopy(`docker run -d \\
  --name ntp-server-italia \\
  --restart unless-stopped \\
  --cap-add=SYS_TIME \\
  -p 123:123/udp \\
  -p 8080:8080 \\
  -e TZ=Europe/Rome \\
  \${DOCKER_USER:-<tuo-username>}/chrony-ntp-server:latest`, 'doc-run')}
                className="p-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded border border-slate-700 transition-colors flex items-center gap-1"
              >
                {copiedKey === 'doc-run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'doc-run' ? 'Copiato' : 'Copia'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-200 border border-slate-800/80 overflow-x-auto leading-relaxed">
{`docker run -d \\
  --name ntp-server-italia \\
  --restart unless-stopped \\
  --cap-add=SYS_TIME \\
  -p 123:123/udp \\
  -p 8080:8080 \\
  -e TZ=Europe/Rome \\
  \${DOCKER_USER:-<tuo-username>}/chrony-ntp-server:latest`}
            </pre>

            <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
              <strong className="text-emerald-400 font-medium block mb-0.5">Perché --cap-add=SYS_TIME?</strong>
              Permette al container di aggiustare la frequenza dell&apos;orologio a livello kernel (slewing) in sicurezza, senza concedere privilegi di root totali (<code>--privileged</code>).
            </div>
          </div>

          {/* Card B: Docker Compose */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Opzione B: Docker Compose
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consigliato per Proxmox LXC, Home Assistant, NAS Synology/QNAP.
                </p>
              </div>
              <button
                onClick={() => handleCopy(`services:
  ntp-server:
    image: \${DOCKER_USER:-tuo-username}/chrony-ntp-server:latest
    container_name: ntp-server-italia
    restart: unless-stopped
    cap_add:
      - SYS_TIME
    environment:
      - TZ=Europe/Rome
      - PORT=8080
    ports:
      - "123:123/udp"
      - "8080:8080/tcp"
    volumes:
      - ntp_drift:/var/lib/chrony

volumes:
  ntp_drift:`, 'doc-comp')}
                className="p-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded border border-slate-700 transition-colors flex items-center gap-1"
              >
                {copiedKey === 'doc-comp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'doc-comp' ? 'Copiato' : 'Copia'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-200 border border-slate-800/80 overflow-x-auto leading-relaxed">
{`docker compose up -d`}
            </pre>

            <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
              <strong className="text-emerald-400 font-medium block mb-0.5">Volume ntp_drift persistente</strong>
              Mantiene memorizzato il coefficiente di deriva del cristallo al quarzo della macchina host per evitare qualsiasi correzione brusca al riavvio.
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: DHCP Option 42 (The Pro Strategy) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">
            2
          </span>
          <h3 className="text-base font-semibold text-white">
            Configurazione Automatica di Tutta la LAN via Router (Opzione DHCP 42)
          </h3>
        </div>

        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 shrink-0">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Sincronizza centinaia di dispositivi senza configurarne uno ad uno
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                L&apos;<strong>Opzione DHCP 42 (Network Time Protocol Servers)</strong> è lo standard IETF RFC 2132 con cui il tuo router comunica a tutti i dispositivi (PC, smartphone, telecamere, stampanti, termostati IoT) quale server NTP usare nel momento stesso in cui richiedono un indirizzo IP in rete.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <strong className="text-white block mb-1">AVM Fritz!Box</strong>
              <p className="text-slate-400">
                Home Network &gt; Network &gt; Network Settings &gt; Time (NTP) Synchronization: inserisci l&apos;IP del container (es. <code>192.168.1.100</code>).
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <strong className="text-white block mb-1">pfSense / OPNsense</strong>
              <p className="text-slate-400">
                Services &gt; DHCP Server &gt; LAN &gt; Additional BOOTP/DHCP Options: seleziona <strong>NTP Server (42)</strong> e inserisci l&apos;IP locale.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <strong className="text-white block mb-1">Ubiquiti UniFi</strong>
              <p className="text-slate-400">
                Settings &gt; Networks &gt; Default LAN &gt; DHCP Service Management &gt; DHCP Options &gt; Aggiungi opzione codice <strong>42</strong> con l&apos;IP del server.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Manual Client Configuration Guides */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">
            3
          </span>
          <h3 className="text-base font-semibold text-white">
            Configurazione Manuale Client Specifici (Windows, Linux, macOS, IoT, Telecamere)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Client: Windows 11 / 10 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Laptop className="w-4 h-4 text-indigo-400" />
                <span>Windows 11 / Windows 10 (Prompt Amministratore)</span>
              </div>
              <button
                onClick={() => handleCopy(`w32tm /config /syncfromflags:manual /manualpeerlist:"192.168.1.100,0x8"
w32tm /config /update
w32tm /resync`, 'win-cmd')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                {copiedKey === 'win-cmd' ? 'Copiato!' : 'Copia'}
              </button>
            </div>
            <pre className="p-2.5 bg-slate-950 rounded font-mono text-slate-300 overflow-x-auto">
{`w32tm /config /syncfromflags:manual /manualpeerlist:"192.168.1.100,0x8"
w32tm /config /update
w32tm /resync`}
            </pre>
            <p className="text-slate-400">
              Verifica lo stato con: <code>w32tm /query /status</code> (mostrerà Stratum 2 e l&apos;IP del server locale).
            </p>
          </div>

          {/* Client: Linux Ubuntu / Debian */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Linux (systemd-timesyncd o Chrony)</span>
              </div>
              <button
                onClick={() => handleCopy(`sudo bash -c 'echo "NTP=192.168.1.100" >> /etc/systemd/timesyncd.conf'
sudo systemctl restart systemd-timesyncd
timedatectl timesync-status`, 'linux-cmd')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                {copiedKey === 'linux-cmd' ? 'Copiato!' : 'Copia'}
              </button>
            </div>
            <pre className="p-2.5 bg-slate-950 rounded font-mono text-slate-300 overflow-x-auto">
{`sudo sed -i 's/^#NTP=.*/NTP=192.168.1.100/' /etc/systemd/timesyncd.conf
sudo systemctl restart systemd-timesyncd
timedatectl timesync-status`}
            </pre>
            <p className="text-slate-400">
              Imposta istantaneamente il server locale come riferimento primario.
            </p>
          </div>

          {/* Client: Telecamere CCTV & NVR */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Telecamere CCTV (Hikvision, Dahua, Reolink)</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-950 rounded font-mono text-slate-300 space-y-1">
              <div>Modalità: <strong>NTP</strong></div>
              <div>Server NTP: <strong>192.168.1.100</strong></div>
              <div>Porta: <strong>123</strong></div>
              <div>Intervallo Sincronizzazione: <strong>60 min</strong></div>
              <div>Fuso Orario: <strong>GMT+01:00 Amsterdam, Berlino, Roma</strong></div>
              <div>Ora Legale (DST): <strong>Abilitata</strong></div>
            </div>
            <p className="text-slate-400">
              Garantisce registrazioni con timestamp sincronizzati al millisecondo per indagini e salvataggi NVR.
            </p>
          </div>

          {/* Client: IoT ESP32 / Arduino */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Microcontrollori IoT (ESP32, ESP8266, Pico W)</span>
              </div>
              <button
                onClick={() => handleCopy(`// Sincronizzazione NTP locale con gestione automatica CET/CEST Italia
configTime(3600, 3600, "192.168.1.100");`, 'iot-cmd')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                {copiedKey === 'iot-cmd' ? 'Copiato!' : 'Copia'}
              </button>
            </div>
            <pre className="p-2.5 bg-slate-950 rounded font-mono text-slate-300 overflow-x-auto">
{`#include <WiFi.h>
#include <time.h>

void setup() {
  WiFi.begin("TuaSSID", "Password");
  // Fuso Italia: 3600s base (UTC+1 CET), 3600s daylight offset (UTC+2 CEST)
  configTime(3600, 3600, "192.168.1.100");
}`}
            </pre>
            <p className="text-slate-400">
              Zero consumo di banda Internet verso server esterni da parte di lampade o termostati smart!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
