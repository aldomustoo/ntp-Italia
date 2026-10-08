import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Funzione di calcolo orario italiano (CET/CEST) e passaggio ora legale/solare
function getLastSundayOfMonth(year, month, hourUtc) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0, hourUtc, 0, 0));
  const dayOfWeek = lastDay.getUTCDay();
  return new Date(Date.UTC(year, month, lastDay.getUTCDate() - dayOfWeek, hourUtc, 0, 0));
}

function getItalianTimeInfo(referenceDate = new Date()) {
  const year = referenceDate.getUTCFullYear();
  const marchTransition = getLastSundayOfMonth(year, 2, 1);
  const octoberTransition = getLastSundayOfMonth(year, 9, 1);
  const isDst = referenceDate >= marchTransition && referenceDate < octoberTransition;
  const offsetHours = isDst ? 2 : 1;

  let nextType;
  let targetDate;
  let label;
  let description;

  if (referenceDate < marchTransition) {
    nextType = 'to_cest';
    targetDate = marchTransition;
    label = 'Passaggio a Ora Legale (CEST)';
    description = 'Le lancette si sposteranno avanti di 1 ora (+1h, UTC+2)';
  } else if (referenceDate < octoberTransition) {
    nextType = 'to_cet';
    targetDate = octoberTransition;
    label = 'Ritorno a Ora Solare (CET)';
    description = 'Le lancette si sposteranno indietro di 1 ora (-1h, UTC+1)';
  } else {
    const nextMarch = getLastSundayOfMonth(year + 1, 2, 1);
    nextType = 'to_cest';
    targetDate = nextMarch;
    label = 'Passaggio a Ora Legale (CEST)';
    description = 'Le lancette si sposteranno avanti di 1 ora (+1h, UTC+2)';
  }

  const remainingMs = Math.max(0, targetDate.getTime() - referenceDate.getTime());
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    isoString: referenceDate.toISOString(),
    italyTimeFormatted: new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(referenceDate),
    italyDateFormatted: new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(referenceDate),
    utcTimeFormatted: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(referenceDate) + ' UTC',
    timeZoneName: isDst ? 'CEST' : 'CET',
    timeZoneFullName: isDst ? 'Ora Legale (CEST, UTC+2)' : 'Ora Solare (CET, UTC+1)',
    isDaylightSaving: isDst,
    offsetHours,
    offsetString: isDst ? '+02:00' : '+01:00',
    nextTransition: {
      type: nextType,
      label,
      targetDate,
      formattedDate: new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome',
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(targetDate),
      description,
      remainingMs,
      days,
      hours,
      minutes,
      seconds
    }
  };
}

// -----------------------------------------------------------------------------
// Lettura Real-Time dal Demone Chrony (chronyc tracking, sources, clients)
// -----------------------------------------------------------------------------

async function queryChronyTracking() {
  try {
    const { stdout } = await execAsync('chronyc tracking', { timeout: 1500 });
    const lines = stdout.split('\n');
    const parsed = {};

    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        parsed[key] = value;
      }
    }

    // Parsing valori numerici
    const parseNumber = (val) => {
      if (!val) return 0;
      const match = val.match(/[-+]?[0-9]*\.?[0-9]+/);
      return match ? parseFloat(match[0]) : 0;
    };

    return {
      realData: true,
      sourceType: 'CHRONYD_LIVE_SOCKET',
      stratum: parseInt(parsed['Stratum'], 10) || 2,
      referenceId: parsed['Reference ID'] || 'N/A',
      refTimeUtc: parsed['Ref time (UTC)'] || 'N/A',
      systemOffsetSeconds: parseNumber(parsed['System time']),
      lastOffsetSeconds: parseNumber(parsed['Last offset']),
      rmsOffsetSeconds: parseNumber(parsed['RMS offset']),
      frequencyPpm: parseNumber(parsed['Frequency']),
      residualFreqPpm: parseNumber(parsed['Residual freq']),
      skewPpm: parseNumber(parsed['Skew']),
      rootDelaySeconds: parseNumber(parsed['Root delay']),
      rootDispersionSeconds: parseNumber(parsed['Root dispersion']),
      updateIntervalSeconds: parseNumber(parsed['Update interval']) || 64.0,
      leapStatus: parsed['Leap status'] || 'Normal',
      status: 'SYNCHRONIZED_NOMINAL',
      uptimeSeconds: Math.floor(process.uptime()),
      rawOutput: stdout.trim()
    };
  } catch (_err) {
    // Fallback se chronyc non è installato nell'ambiente (es. sviluppo locale)
    return {
      realData: false,
      sourceType: 'FALLBACK_SIMULATED',
      stratum: 2,
      referenceId: 'INRIM (ntp1.inrim.it)',
      systemOffsetSeconds: 0.000012,
      lastOffsetSeconds: -0.000003,
      rmsOffsetSeconds: 0.000021,
      frequencyPpm: -1.782,
      residualFreqPpm: 0.001,
      skewPpm: 0.028,
      rootDelaySeconds: 0.0076,
      rootDispersionSeconds: 0.00085,
      updateIntervalSeconds: 64.0,
      leapStatus: 'Normal (Nessun secondo intercalare)',
      status: 'DEMO_STANDALONE',
      uptimeSeconds: Math.floor(process.uptime()),
      rawOutput: 'chronyc tracking: comando non disponibile sull\'host (attivo dentro il container Alpine)'
    };
  }
}

async function queryChronySources() {
  try {
    const { stdout } = await execAsync('chronyc sources -v', { timeout: 1500 });
    const lines = stdout.split('\n');
    const peers = [];

    // Righe sorgenti effettive iniziano dopo la riga di intestazione ===...
    let isData = false;
    for (const line of lines) {
      if (line.startsWith('===')) {
        isData = true;
        continue;
      }
      if (!isData || !line.trim()) continue;

      // Esempio riga: ^* 193.204.114.232   1   6   377    12   +12us[  +15us] +/- 8200us
      const modeChar = line[0]; // ^, =, #
      const stateChar = line[1]; // *, +, -, ?, x, ~
      const content = line.substring(2).trim();
      const cols = content.split(/\s+/);

      if (cols.length >= 6) {
        const nameOrIp = cols[0];
        const stratum = parseInt(cols[1], 10) || 2;
        const poll = cols[2];
        const reach = cols[3];
        const lastRx = cols[4];
        
        let stateLabel = 'Candidato di Riserva';
        if (stateChar === '*') stateLabel = 'Sorgente Principale Sincronizzata (*)';
        else if (stateChar === '+') stateLabel = 'Combinato nel Quorum (+)';
        else if (stateChar === '-') stateLabel = 'Non selezionato (-)';
        else if (stateChar === '?') stateLabel = 'Non raggiungibile (?)';

        peers.push({
          name: nameOrIp,
          ip: nameOrIp,
          modeChar,
          stateChar,
          stateLabel,
          stratum,
          pollInterval: poll,
          reachOctal: reach,
          lastSeenSeconds: lastRx,
          rawLine: line
        });
      }
    }

    return {
      realData: true,
      peers,
      rawOutput: stdout.trim()
    };
  } catch (_err) {
    return {
      realData: false,
      peers: [
        {
          name: 'ntp1.inrim.it',
          ip: '193.204.114.232',
          stateChar: '*',
          stateLabel: 'Sorgente Principale Sincronizzata (*)',
          stratum: 1,
          pollInterval: '6',
          reachOctal: '377',
          lastSeenSeconds: '14'
        },
        {
          name: 'ntp2.inrim.it',
          ip: '193.204.114.233',
          stateChar: '+',
          stateLabel: 'Combinato nel Quorum (+)',
          stratum: 1,
          pollInterval: '6',
          reachOctal: '377',
          lastSeenSeconds: '22'
        },
        {
          name: 'it.pool.ntp.org',
          ip: '193.206.139.38',
          stateChar: '+',
          stateLabel: 'Pool Italiano (+)',
          stratum: 2,
          pollInterval: '7',
          reachOctal: '377',
          lastSeenSeconds: '35'
        }
      ],
      rawOutput: 'chronyc sources: sim'
    };
  }
}

async function queryChronyClients() {
  try {
    const { stdout } = await execAsync('chronyc clients', { timeout: 1500 });
    const lines = stdout.split('\n');
    const clients = [];

    // Header chronyc clients:
    // Hostname                      NTP   Drop Int IntL Command ...
    // =========================================================
    let isData = false;
    for (const line of lines) {
      if (line.startsWith('===')) {
        isData = true;
        continue;
      }
      if (!isData || !line.trim()) continue;

      const cols = line.trim().split(/\s+/);
      if (cols.length >= 4) {
        const hostOrIp = cols[0];
        const ntpPackets = parseInt(cols[1], 10) || 0;
        const droppedPackets = parseInt(cols[2], 10) || 0;
        const interval = cols[3] || '-';
        const lastSeen = cols[4] || '-';

        // Determina il tipo dispositivo presunto in base alla subnet o IP
        let inferredDevice = 'Dispositivo Rete Locale (LAN)';
        if (hostOrIp.endsWith('.1')) inferredDevice = 'Router / Gateway';
        else if (hostOrIp.startsWith('127.') || hostOrIp === '::1') inferredDevice = 'Localhost (Container)';

        clients.push({
          ip: hostOrIp,
          hostname: hostOrIp,
          deviceType: inferredDevice,
          ntpPackets,
          droppedPackets,
          pollInterval: interval,
          lastSeen,
          status: 'SYNCHRONIZED',
          rawLine: line
        });
      }
    }

    return {
      realData: true,
      clientLoggingEnabled: true,
      clientsCount: clients.length,
      clients,
      rawOutput: stdout.trim()
    };
  } catch (_err) {
    return {
      realData: false,
      clientLoggingEnabled: false,
      clientsCount: 0,
      clients: [],
      rawOutput: 'chronyc clients non attivo o demone non raggiungibile'
    };
  }
}

// -----------------------------------------------------------------------------
// HTTP Server
// -----------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: /api/time
  if (pathname === '/api/time' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      data: getItalianTimeInfo()
    }));
    return;
  }

  // API: /api/status (Real chronyc tracking)
  if (pathname === '/api/status' && req.method === 'GET') {
    const tracking = await queryChronyTracking();
    const timeInfo = getItalianTimeInfo();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      data: {
        ...tracking,
        italianTime: timeInfo.italyTimeFormatted,
        isDaylightSaving: timeInfo.isDaylightSaving,
        tzName: timeInfo.timeZoneName
      }
    }));
    return;
  }

  // API: /api/peers (Real chronyc sources)
  if (pathname === '/api/peers' && req.method === 'GET') {
    const sources = await queryChronySources();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      data: sources
    }));
    return;
  }

  // API: /api/lan-clients (Real chronyc clients)
  if (pathname === '/api/lan-clients' && req.method === 'GET') {
    const clientsData = await queryChronyClients();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      data: clientsData
    }));
    return;
  }

  // Servizio File Statici per WebUI
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Content-Length': content.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000'
    });
    res.end(content);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><body><h1>NTP Server Italia</h1><p>WebUI attiva.</p></body></html>`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[WEBUI] Dashboard attiva su http://0.0.0.0:${PORT}`);
});
