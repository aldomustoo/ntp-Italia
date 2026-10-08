import { useState } from 'react';
import JSZip from 'jszip';
import { TopNav, ActiveTab } from './components/TopNav.tsx';
import { AtomicClockHeader } from './components/AtomicClockHeader.tsx';
import { TelemetryDashboard } from './components/TelemetryDashboard.tsx';
import { UpstreamPeersView } from './components/UpstreamPeersView.tsx';
import { LanClientsView } from './components/LanClientsView.tsx';
import { DockerManagerView } from './components/DockerManagerView.tsx';
import { QuickstartGuideView } from './components/QuickstartGuideView.tsx';
import { NtpQueryTester } from './components/NtpQueryTester.tsx';
import { 
  DEFAULT_DOCKER_CONFIG, 
  DockerConfigOptions,
  generateDockerfile,
  generateDockerCompose,
  generateChronyConf,
  generateEntrypoint,
  generatePublishScript,
  generateReadme
} from './utils/dockerTemplates.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('telemetry');
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadZip = async (opts: DockerConfigOptions = DEFAULT_DOCKER_CONFIG) => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      zip.file('publish-dockerhub.sh', generatePublishScript(opts));
      zip.file('docker-compose.yml', generateDockerCompose(opts));
      zip.file('Dockerfile', generateDockerfile(opts));
      zip.file('chrony.conf', generateChronyConf(opts));
      zip.file('entrypoint.sh', generateEntrypoint(opts));
      zip.file('README.md', generateReadme(opts));

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ntp-server-italia-${opts.versionTag}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Errore generazione pacchetto zip:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar Contract: 3 Zones */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadAll={() => handleDownloadZip()}
        isDownloading={isDownloadingZip}
      />

      {/* Atomic Clock Header & DST Countdown Banner */}
      <AtomicClockHeader />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'telemetry' && (
          <TelemetryDashboard
            onNavigateToDocker={() => setActiveTab('docker')}
            onNavigateToGuide={() => setActiveTab('guide')}
          />
        )}

        {activeTab === 'peers' && <UpstreamPeersView />}

        {activeTab === 'clients' && <LanClientsView />}

        {activeTab === 'docker' && (
          <DockerManagerView
            onDownloadZip={handleDownloadZip}
            isDownloadingZip={isDownloadingZip}
          />
        )}

        {activeTab === 'guide' && <QuickstartGuideView />}

        {activeTab === 'tester' && <NtpQueryTester />}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>NTP Server Italia</span>
            <span className="mx-2">·</span>
            <span>Chrony RFC 5905</span>
            <span className="mx-2">·</span>
            <span>Europe/Rome (CET/CEST)</span>
          </div>
          <div>
            <span>Sorgente Primaria: INRIM Torino (UTC(IT))</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
