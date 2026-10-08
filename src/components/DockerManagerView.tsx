import React, { useState } from 'react';
import { 
  Container, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Settings2, 
  Play, 
  FileCode, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { 
  DockerConfigOptions, 
  DEFAULT_DOCKER_CONFIG,
  generateDockerfile,
  generateDockerCompose,
  generateChronyConf,
  generateEntrypoint,
  generatePublishScript,
  generateReadme
} from '../utils/dockerTemplates.ts';

interface DockerManagerViewProps {
  onDownloadZip: (opts: DockerConfigOptions) => void;
  isDownloadingZip: boolean;
}

type ConfigFileTab = 'script' | 'compose' | 'dockerfile' | 'chrony' | 'entrypoint' | 'readme';

export const DockerManagerView: React.FC<DockerManagerViewProps> = ({
  onDownloadZip,
  isDownloadingZip,
}) => {
  const [config, setConfig] = useState<DockerConfigOptions>(DEFAULT_DOCKER_CONFIG);
  const [activeFileTab, setActiveFileTab] = useState<ConfigFileTab>('script');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Terminal simulator state
  const [simRunning, setSimRunning] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simLogs, setSimLogs] = useState<string[]>([]);

  // Generate contents dynamically based on user config
  const fileContents = {
    script: generatePublishScript(config),
    compose: generateDockerCompose(config),
    dockerfile: generateDockerfile(config),
    chrony: generateChronyConf(config),
    entrypoint: generateEntrypoint(config),
    readme: generateReadme(config),
  };

  const fileNames = {
    script: 'publish-dockerhub.sh',
    compose: 'docker-compose.yml',
    dockerfile: 'Dockerfile',
    chrony: 'chrony.conf',
    entrypoint: 'entrypoint.sh',
    readme: 'README.md',
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadSingle = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const effectiveUser = config.dockerUsername || '<tuo-username>';

  const startSimulator = () => {
    if (simRunning) return;
    const activeUser = config.dockerUsername || 'tuo-account-dockerhub';
    setSimRunning(true);
    setSimStep(1);
    setSimLogs([
      `$ ./publish-dockerhub.sh ${config.versionTag}`,
      `========================================================================`,
      `     NTP SERVER ITALIA - PUBBLICAZIONE SU DOCKER HUB     `,
      `========================================================================`,
      `Account Docker Hub: ${activeUser}`,
      `Immagine target:   ${activeUser}/${config.imageName}:${config.versionTag}`,
      `Piattaforme:       linux/amd64,linux/arm64 (Intel + Raspberry Pi)`,
      ``,
      `[1/5] Verifica credenziali Docker Hub per ${activeUser}...`,
      `[OK] Autenticato correttamente come: ${activeUser}`
    ]);

    setTimeout(() => {
      setSimStep(2);
      setSimLogs(prev => [
        ...prev,
        `[2/5] Configurazione Docker Buildx per supporto multi-arch (x86_64 + ARM64)...`,
        `Uso istanza buildx esistente 'ntp-builder' con supporto QEMU emulato.`
      ]);
    }, 1200);

    setTimeout(() => {
      setSimStep(3);
      setSimLogs(prev => [
        ...prev,
        `[3/5] Compilazione ed invio delle immagini multi-arch (linux/amd64,linux/arm64)...`,
        `[+] Building 8.4s (12/12) FINISHED`,
        ` => => exporting to image`,
        ` => => pushing layers to registry.hub.docker.com/${activeUser}/${config.imageName}`,
        ` => => pushing manifest for ${activeUser}/${config.imageName}:${config.versionTag}`,
        ` => => pushing manifest for ${activeUser}/${config.imageName}:latest`
      ]);
    }, 2800);

    setTimeout(() => {
      setSimStep(4);
      setSimLogs(prev => [
        ...prev,
        ``,
        `========================================================================`,
        ` [SUCCESSO] Immagine pubblicata correttamente su Docker Hub! `,
        `========================================================================`,
        `Link repository: https://hub.docker.com/r/${activeUser}/${config.imageName}`,
        ``,
        `Comando per eseguire sulla tua LAN:`,
        `  docker run -d --name ${config.containerName} --cap-add=SYS_TIME -p ${config.udpPort}:123/udp -p ${config.webPort}:8080 -e TZ=Europe/Rome ${activeUser}/${config.imageName}:latest`
      ]);
      setSimRunning(false);
    }, 4200);
  };

  const oneLineDockerRun = `docker run -d \\
  --name ${config.containerName} \\
  --restart unless-stopped \\
  --cap-add=SYS_TIME \\
  -p ${config.udpPort}:123/udp \\
  -p ${config.webPort}:8080 \\
  -e TZ=Europe/Rome \\
  ${effectiveUser}/${config.imageName}:latest`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Container className="w-5 h-5 text-emerald-400" />
            Configuratore Docker &amp; Script di Pubblicazione Docker Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Personalizza nome utente, porte e subnet LAN: tutti i file di deployment vengono aggiornati istantaneamente.
          </p>
        </div>

        <button
          onClick={() => onDownloadZip(config)}
          disabled={isDownloadingZip}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloadingZip ? 'Creazione ZIP...' : 'Scarica Tutti i File (.zip)'}</span>
        </button>
      </div>

      {/* Two Column Layout: Parameters on Left, File Viewer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Parameters Form */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Settings2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
              Parametri Docker Hub &amp; Rete
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Docker Username */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Username Docker Hub
              </label>
              <input
                type="text"
                value={config.dockerUsername}
                onChange={e => setConfig({ ...config, dockerUsername: e.target.value.trim() })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                placeholder="es. mario-rossi (oppure lascia vuoto per auto-rilevamento)"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Il tuo account personale su hub.docker.com (o lascialo vuoto per usare il login locale)
              </span>
            </div>

            {/* Image Name */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Nome Repository Immagine
              </label>
              <input
                type="text"
                value={config.imageName}
                onChange={e => setConfig({ ...config, imageName: e.target.value.trim() })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                placeholder="es. chrony-ntp-server"
              />
            </div>

            {/* Version Tag */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Tag Versione
              </label>
              <input
                type="text"
                value={config.versionTag}
                onChange={e => setConfig({ ...config, versionTag: e.target.value.trim() })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                placeholder="es. 1.0.0"
              />
            </div>

            {/* Ports: UDP 123 & Web 8080 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Porta NTP (UDP)
                </label>
                <input
                  type="number"
                  value={config.udpPort}
                  onChange={e => setConfig({ ...config, udpPort: parseInt(e.target.value, 10) || 123 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-400 mt-0.5 block">
                  RFC 5905 Standard
                </span>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Porta WebUI (TCP)
                </label>
                <input
                  type="number"
                  value={config.webPort}
                  onChange={e => setConfig({ ...config, webPort: parseInt(e.target.value, 10) || 8080 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Dashboard web
                </span>
              </div>
            </div>

            {/* Subnets Allowance */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Subnet LAN Autorizzate (chrony allow)
              </label>
              <textarea
                value={config.lanSubnets.join('\n')}
                onChange={e => setConfig({ ...config, lanSubnets: e.target.value.split('\n') })}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                placeholder="192.168.0.0/16&#10;10.0.0.0/8"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Un CIDR per riga (es. 192.168.1.0/24)
              </span>
            </div>

            {/* Timezone Fixed to Europe/Rome */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Fuso Orario Nazionale
              </label>
              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Europe/Rome (CET/CEST)</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Gestione automatica ora solare / legale
              </span>
            </div>
          </div>

          {/* Quick One-Click Command Copy */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase font-mono font-semibold">
                Comando Esecuzione 1-Line
              </span>
              <button
                onClick={() => handleCopy(oneLineDockerRun, 'one-line')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                {copiedKey === 'one-line' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copia</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-2 bg-slate-950 rounded text-[10px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
              {oneLineDockerRun}
            </pre>
          </div>
        </div>

        {/* Right Column: Code Viewer with Tabs */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* File Tabs */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-2 bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
              <div className="flex items-center gap-1">
                {(['script', 'compose', 'dockerfile', 'chrony', 'entrypoint', 'readme'] as ConfigFileTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveFileTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap ${
                      activeFileTab === tab
                        ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    {fileNames[tab]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pl-2">
                <button
                  onClick={() => handleCopy(fileContents[activeFileTab], activeFileTab)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 rounded border border-slate-700 transition-colors"
                  title="Copia codice negli appunti"
                >
                  {copiedKey === activeFileTab ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copia</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownloadSingle(fileNames[activeFileTab], fileContents[activeFileTab])}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 rounded border border-slate-700 transition-colors"
                  title="Scarica questo file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="p-4 bg-slate-950/90 text-xs font-mono text-slate-200 overflow-x-auto max-h-[460px]">
              <pre className="whitespace-pre leading-relaxed">
                {fileContents[activeFileTab]}
              </pre>
            </div>
          </div>

          {/* Interactive Shell Simulator */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Simulatore Esecuzione Script (publish-dockerhub.sh)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verifica in anteprima tutti i passaggi di login, build multi-arch e push su Docker Hub.
                </p>
              </div>

              <button
                onClick={startSimulator}
                disabled={simRunning}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{simRunning ? 'Pubblicazione in corso...' : 'Avvia Simulazione Push'}</span>
              </button>
            </div>

            {/* Terminal Window */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[11px] text-slate-400">
                <span>bash terminal · docker-cli v27.0</span>
                <span>Multi-Arch: amd64 + arm64</span>
              </div>

              {simLogs.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  Clicca su &quot;Avvia Simulazione Push&quot; per visualizzare l&apos;esecuzione in tempo reale dello script di pubblicazione.
                </div>
              ) : (
                <div className="space-y-1 text-slate-300 overflow-x-auto max-h-48">
                  {simLogs.map((log, index) => (
                    <div
                      key={index}
                      className={
                        log.includes('[SUCCESSO]') || log.includes('[OK]')
                          ? 'text-emerald-400 font-semibold'
                          : log.includes('error') || log.includes('ERRORE')
                          ? 'text-rose-400 font-semibold'
                          : log.includes('Building') || log.includes('[3/5]')
                          ? 'text-sky-300'
                          : 'text-slate-300'
                      }
                    >
                      {log}
                    </div>
                  ))}
                  {simRunning && (
                    <div className="flex items-center gap-2 text-emerald-400 animate-pulse pt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Esecuzione buildx multi-arch in corso...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {simStep === 4 && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs">
                <span className="text-emerald-300">
                  L&apos;immagine è pronta per essere prelevata da qualsiasi dispositivo Linux/Raspberry Pi/NAS.
                </span>
                <a
                  href={`https://hub.docker.com/r/${config.dockerUsername}/${config.imageName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium underline font-mono"
                >
                  <span>hub.docker.com/{config.dockerUsername}/{config.imageName}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
