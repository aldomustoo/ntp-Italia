import React, { useState, useEffect } from 'react';
import { Clock, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { getItalianTimeInfo, ItalianTimeInfo } from '../utils/timeUtils.ts';

export const AtomicClockHeader: React.FC = () => {
  const [timeInfo, setTimeInfo] = useState<ItalianTimeInfo>(() => getItalianTimeInfo());
  const [showDstExplainer, setShowDstExplainer] = useState(false);
  const [microTick, setMicroTick] = useState(0);

  useEffect(() => {
    // 50ms interval for smooth millisecond display without high CPU load
    const interval = setInterval(() => {
      const now = new Date();
      setTimeInfo(getItalianTimeInfo(now));
      setMicroTick(now.getMilliseconds());
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const formattedMillis = microTick.toString().padStart(3, '0');

  return (
    <section className="bg-slate-900/60 border-b border-slate-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Main Atomic Clock Display */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Sincronizzato: INRIM Torino (Campione Nazionale)</span>
              <span>·</span>
              <span className="text-emerald-400 font-semibold">UTC offset {timeInfo.offsetString}</span>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-mono tracking-tight text-white tabular-nums">
                {timeInfo.italyTimeFormatted}
                <span className="text-xl sm:text-2xl text-slate-500 font-normal ml-1">
                  .{formattedMillis}
                </span>
              </h1>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-emerald-400 tracking-wider font-mono">
                  {timeInfo.timeZoneName}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Europe/Rome
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-sans">
              <span className="capitalize text-slate-300 font-medium">{timeInfo.italyDateFormatted}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono text-slate-400">{timeInfo.utcTimeFormatted}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400/90 font-medium">{timeInfo.timeZoneFullName}</span>
            </div>
          </div>

          {/* DST Countdown & Automatic Transition Widget */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gestione Automatica Ora Legale / Solare</span>
              </div>
              <button
                onClick={() => setShowDstExplainer(!showDstExplainer)}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                title="Come gestisce NTP il cambio orario?"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Info DST</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              {timeInfo.nextTransition.label} prevsisto per il{' '}
              <strong className="text-slate-200">{timeInfo.nextTransition.formattedDate}</strong>.
            </p>

            {/* Countdown Grid */}
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg py-1.5 px-1">
                <span className="block text-lg font-bold text-white tabular-nums">
                  {timeInfo.nextTransition.days}
                </span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-sans">
                  Giorni
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg py-1.5 px-1">
                <span className="block text-lg font-bold text-white tabular-nums">
                  {timeInfo.nextTransition.hours.toString().padStart(2, '0')}
                </span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-sans">
                  Ore
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg py-1.5 px-1">
                <span className="block text-lg font-bold text-white tabular-nums">
                  {timeInfo.nextTransition.minutes.toString().padStart(2, '0')}
                </span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-sans">
                  Minuti
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg py-1.5 px-1">
                <span className="block text-lg font-bold text-emerald-400 tabular-nums">
                  {timeInfo.nextTransition.seconds.toString().padStart(2, '0')}
                </span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-sans">
                  Secondi
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Zero salti di clock
              </span>
              <span>{timeInfo.nextTransition.description}</span>
            </div>
          </div>
        </div>

        {/* DST Technical Explanation Expandable Panel */}
        {showDstExplainer && (
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                Come gestisce NTP il passaggio tra Ora Solare e Ora Legale senza disservizi?
              </h4>
              <button
                onClick={() => setShowDstExplainer(false)}
                className="text-slate-400 hover:text-white px-2 py-0.5"
              >
                Chiudi
              </button>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Il protocollo <strong>NTP (RFC 5905)</strong> opera rigorosamente in <strong>UTC (Tempo Coordinato Universale)</strong>, una scala temporale atomica continua e monotonica che <em>non ha alcun fuso orario né ora legale</em>. 
              Il nostro demone <strong>Chrony</strong> sincronizza tutti i dispositivi della tua LAN su questo riferimento UTC assoluto.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-slate-300">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <strong className="text-emerald-400 block mb-1">1. Zero Salti o Collisioni nei Log</strong>
                Poiché NTP non sposta mai le lancette indietro a livello di rete, i database, i log di sicurezza e le registrazioni delle telecamere CCTV non subiscono mai timestamp duplicati o inversioni causali.
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <strong className="text-emerald-400 block mb-1">2. Gestione Fuso Automatica via tzdata</strong>
                Il passaggio da CET (UTC+1) a CEST (UTC+2) viene calcolato automaticamente dai sistemi operativi dei client (Windows, Linux, macOS, iOS, Android) attraverso le tabelle <code>tzdata</code> di <em>Europe/Rome</em>, senza richiedere alcun riavvio o intervento manuale.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
