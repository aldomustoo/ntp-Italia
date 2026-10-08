import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getItalianTimeInfo } from './src/utils/timeUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API: Live Time Info
app.get('/api/time', (_req, res) => {
  const timeInfo = getItalianTimeInfo(new Date());
  res.json({
    success: true,
    data: timeInfo,
    serverUptime: process.uptime(),
  });
});

// API: Chrony Daemon Tracking Status
app.get('/api/status', (_req, res) => {
  const timeInfo = getItalianTimeInfo(new Date());
  
  res.json({
    success: true,
    data: {
      stratum: 2,
      referenceId: 'INRIM (ntp1.inrim.it)',
      referenceIp: '193.204.114.232',
      leapStatus: 'Normal (Nessun secondo intercalare pendente)',
      systemOffsetSeconds: 0.000012,
      lastOffsetSeconds: -0.000004,
      rmsOffsetSeconds: 0.000021,
      frequencyPpm: -1.782,
      residualFreqPpm: 0.001,
      skewPpm: 0.028,
      rootDelaySeconds: 0.0076,
      rootDispersionSeconds: 0.00085,
      updateIntervalSeconds: 64.0,
      precisionLog2: -24, // ~59.6 nanosecondi
      precisionReadable: '59.6 ns',
      totalQueriesServed: 43290 + Math.floor(process.uptime() * 3),
      uptimeSeconds: Math.floor(process.uptime()),
      italianTime: timeInfo.italyTimeFormatted,
      isDaylightSaving: timeInfo.isDaylightSaving,
      tzName: timeInfo.timeZoneName,
      status: 'SYNCHRONIZED_NOMINAL',
    }
  });
});

// API: Upstream NTP Peers
app.get('/api/peers', (_req, res) => {
  res.json({
    success: true,
    data: [
      {
        name: 'ntp1.inrim.it',
        ip: '193.204.114.232',
        location: 'Torino, Italia (INRIM)',
        description: 'Campione Nazionale di Tempo - Orologio Atomico al Cesio',
        stratum: 1,
        mode: 'server (prefer)',
        state: 'SELECTED_SYNC',
        stateLabel: 'Sorgente Primaria Attiva',
        delayMs: 8.24,
        offsetMs: 0.012,
        jitterMs: 0.028,
        reachOctal: 377,
        reachPercent: 100,
        pollIntervalSeconds: 64,
        lastSeenSeconds: 14,
      },
      {
        name: 'ntp2.inrim.it',
        ip: '193.204.114.233',
        location: 'Torino, Italia (INRIM)',
        description: 'Campione Nazionale di Tempo - Secondo nodo ridondato',
        stratum: 1,
        mode: 'server',
        state: 'CANDIDATE',
        stateLabel: 'Candidato Ridondante',
        delayMs: 8.91,
        offsetMs: -0.008,
        jitterMs: 0.035,
        reachOctal: 377,
        reachPercent: 100,
        pollIntervalSeconds: 64,
        lastSeenSeconds: 22,
      },
      {
        name: '0.it.pool.ntp.org',
        ip: '193.206.139.38',
        location: 'Milano / Roma, Italia',
        description: 'Pool NTP Italiano - Nodo GARR Rete della Ricerca',
        stratum: 2,
        mode: 'pool',
        state: 'COMBINED',
        stateLabel: 'Combinato nel quorum',
        delayMs: 11.45,
        offsetMs: 0.022,
        jitterMs: 0.064,
        reachOctal: 377,
        reachPercent: 100,
        pollIntervalSeconds: 128,
        lastSeenSeconds: 38,
      },
      {
        name: '1.it.pool.ntp.org',
        ip: '194.116.83.250',
        location: 'Bologna, Italia',
        description: 'Pool NTP Italiano - Nodo CINECA Supercomputing',
        stratum: 2,
        mode: 'pool',
        state: 'COMBINED',
        stateLabel: 'Combinato nel quorum',
        delayMs: 10.12,
        offsetMs: -0.015,
        jitterMs: 0.058,
        reachOctal: 377,
        reachPercent: 100,
        pollIntervalSeconds: 128,
        lastSeenSeconds: 41,
      },
      {
        name: '2.it.pool.ntp.org',
        ip: '151.12.18.9',
        location: 'Roma, Italia',
        description: 'Pool NTP Italiano - Nodo TIM Enterprise Backbone',
        stratum: 2,
        mode: 'pool',
        state: 'COMBINED',
        stateLabel: 'Combinato nel quorum',
        delayMs: 14.80,
        offsetMs: 0.031,
        jitterMs: 0.076,
        reachOctal: 377,
        reachPercent: 100,
        pollIntervalSeconds: 128,
        lastSeenSeconds: 50,
      },
      {
        name: 'europe.pool.ntp.org',
        ip: '162.159.200.123',
        location: 'Milano (Cloudflare Anycast)',
        description: 'Fallback Geografico Europeo ad alta disponibilità',
        stratum: 3,
        mode: 'pool',
        state: 'BACKUP',
        stateLabel: 'Riserva Calda',
        delayMs: 6.85,
        offsetMs: 0.018,
        jitterMs: 0.042,
        reachOctal: 377,
        reachPercent: 100,
        pollIntervalSeconds: 256,
        lastSeenSeconds: 112,
      }
    ]
  });
});

// API: Active Local LAN Clients
app.get('/api/lan-clients', (_req, res) => {
  res.json({
    success: true,
    data: [
      {
        ip: '192.168.1.1',
        hostname: 'fritz.box (Router Gateway)',
        deviceType: 'Router & DHCP Server',
        pollIntervalSeconds: 1024,
        lastPollAgo: '12m fa',
        version: 'NTP v4',
        offsetMs: 0.045,
        delayMs: 0.42,
        status: 'OK',
      },
      {
        ip: '192.168.1.15',
        hostname: 'homeassistant.local',
        deviceType: 'Home Automation Hub',
        pollIntervalSeconds: 64,
        lastPollAgo: '32s fa',
        version: 'NTP v4 (Chrony)',
        offsetMs: 0.008,
        delayMs: 0.35,
        status: 'OK',
      },
      {
        ip: '192.168.1.40',
        hostname: 'cam-giardino-est.lan',
        deviceType: 'Telecamera CCTV PoE Dahua',
        pollIntervalSeconds: 300,
        lastPollAgo: '2m fa',
        version: 'SNTP v4',
        offsetMs: -0.12,
        delayMs: 1.15,
        status: 'OK',
      },
      {
        ip: '192.168.1.41',
        hostname: 'cam-ingresso-nord.lan',
        deviceType: 'Telecamera CCTV PoE Hikvision',
        pollIntervalSeconds: 300,
        lastPollAgo: '1m fa',
        version: 'SNTP v4',
        offsetMs: -0.09,
        delayMs: 1.08,
        status: 'OK',
      },
      {
        ip: '192.168.1.102',
        hostname: 'workstation-win11.lan',
        deviceType: 'PC Windows 11 (W32Time)',
        pollIntervalSeconds: 1024,
        lastPollAgo: '8m fa',
        version: 'NTP v3/v4',
        offsetMs: 0.032,
        delayMs: 0.51,
        status: 'OK',
      },
      {
        ip: '192.168.1.105',
        hostname: 'macbook-pro.lan',
        deviceType: 'macOS Sonoma (timed)',
        pollIntervalSeconds: 512,
        lastPollAgo: '4m fa',
        version: 'NTP v4',
        offsetMs: 0.015,
        delayMs: 0.62,
        status: 'OK',
      },
      {
        ip: '192.168.1.66',
        hostname: 'esp32-termostato-salone.lan',
        deviceType: 'IoT Microcontroller ESP32',
        pollIntervalSeconds: 3600,
        lastPollAgo: '24m fa',
        version: 'SNTP (configTime)',
        offsetMs: 0.25,
        delayMs: 2.10,
        status: 'OK',
      },
      {
        ip: '192.168.1.200',
        hostname: 'synology-ds920.lan',
        deviceType: 'NAS Synology DSM 7.2',
        pollIntervalSeconds: 256,
        lastPollAgo: '1m fa',
        version: 'NTP v4',
        offsetMs: 0.011,
        delayMs: 0.38,
        status: 'OK',
      }
    ]
  });
});

// API: NTP Packet Simulator / Test Query
app.post('/api/test-ntp', (req, res) => {
  const targetIp = req.body?.ip || '127.0.0.1';
  const now = new Date();
  const timeInfo = getItalianTimeInfo(now);

  const t1 = Date.now() - 2; // Client Origin
  const t2 = Date.now() - 1; // Server Receive
  const t3 = Date.now();     // Server Transmit
  const t4 = Date.now() + 1; // Client Destination
  
  const roundtripMs = (t4 - t1) - (t3 - t2);
  const localOffsetMs = ((t2 - t1) + (t3 - t4)) / 2;

  res.json({
    success: true,
    data: {
      queryTarget: targetIp,
      queryPort: 123,
      protocol: 'UDP / NTPv4 (RFC 5905)',
      responseTimeMs: Math.max(0.5, roundtripMs),
      localOffsetMs: Number(localOffsetMs.toFixed(4)),
      packet: {
        leapIndicator: 0,
        leapName: 'no_warning (0 - No Leap Second Pending)',
        versionNumber: 4,
        mode: 4,
        modeName: 'Server (4)',
        stratum: 2,
        stratumType: 'Secondary Reference (Stratum 2, INRIM Synced)',
        pollInterval: '6 (64 seconds)',
        precision: '-24 (~59.6 ns precision clock)',
        rootDelay: '0.007629 s (7.6 ms)',
        rootDispersion: '0.000854 s (0.85 ms)',
        referenceId: 'INRIM (193.204.114.232)',
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
    }
  });
});

// Setup Vite or Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NTP Server WebUI] In ascolto su http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ERRORE AVVIO SERVER]', err);
  process.exit(1);
});
