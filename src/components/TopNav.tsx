import React from 'react';
import { Activity, Radio, Network, Container, BookOpen, Terminal, Download, ShieldCheck } from 'lucide-react';

export type ActiveTab = 'telemetry' | 'peers' | 'clients' | 'docker' | 'guide' | 'tester';

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onDownloadAll: () => void;
  isDownloading: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onDownloadAll,
  isDownloading,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Zone: Clean single-element wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white font-mono">
                CHRONY-NTP<span className="text-emerald-400">.IT</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-mono">
                Europe/Rome · Stratum 2
              </span>
            </div>
          </div>

          {/* Nav Links: Accessible tabs with distinct active states */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'telemetry'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Telemetria
            </button>

            <button
              onClick={() => setActiveTab('peers')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'peers'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Sorgenti INRIM
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Client LAN
            </button>

            <button
              onClick={() => setActiveTab('docker')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'docker'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Container className="w-3.5 h-3.5" />
              Docker & Hub Script
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guida Deployment
            </button>

            <button
              onClick={() => setActiveTab('tester')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'tester'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              NTP Query Test
            </button>
          </nav>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadAll}
              disabled={isDownloading}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-emerald-950 font-sans disabled:opacity-50"
              title="Scarica archivio ZIP completo con Dockerfile, compose, chrony.conf e script Docker Hub"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generazione ZIP...' : 'Scarica File (.zip)'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800/80 no-scrollbar">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
              activeTab === 'telemetry' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
            }`}
          >
            Telemetria
          </button>
          <button
            onClick={() => setActiveTab('peers')}
            className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
              activeTab === 'peers' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
            }`}
          >
            Sorgenti INRIM
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
              activeTab === 'clients' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
            }`}
          >
            Client LAN
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
              activeTab === 'docker' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
            }`}
          >
            Docker & Hub Script
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
              activeTab === 'guide' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
            }`}
          >
            Guida Rapida
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
              activeTab === 'tester' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
            }`}
          >
            Test Query
          </button>
        </div>
      </div>
    </header>
  );
};
