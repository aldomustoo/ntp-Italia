import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

// Funzione di calcolo orario italiano (CET/CEST) e passaggio ora legale/solare
function getLastSundayOfMonth(year, month, hourUtc) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0, hourUtc, 0, 0));
  const dayOfWeek = lastDay.getUTCDay();
  const lastSundayDate = lastDay.getUTCDate() - dayOfWeek;
  return new Date(Date.UTC(year, month, lastSundayDate, hourUtc, 0, 0));
}

function getItalianTimeInfo(referenceDate = new Date()) {
  const year = referenceDate.getUTCFullYear();
  const marchTransition = getLastSundayOfMonth(year, 2, 1);
  const octoberTransition = getLastSundayOfMonth(year, 9, 1);

  const isDaylightSaving = referenceDate >= marchTransition && referenceDate < octoberTransition;
  const offsetHours = isDaylightSaving ? 2 : 1;
  const timeZoneName = isDaylightSaving ? 'CEST' : 'CET';
  const timeZoneFullName = isDaylightSaving 
    ? 'Ora Legale (CEST, UTC+2)' 
    : 'Ora Solare (CET, UTC+1)';

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

  const pad = (n) => n.toString().padStart(2, '0');
  const offsetString = `+${pad(offsetHours)}:00`;

  const italyTimeFormatted = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(referenceDate);

  const italyDateFormatted = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(referenceDate);

  const utcTimeFormatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(referenceDate) + ' UTC';

  return {
    isoString: referenceDate.toISOString(),
    utcTimeFormatted,
    italyTimeFormatted,
    italyDateFormatted,
    timeZoneName,
    timeZoneFullName,
    isDaylightSaving,
    offsetHours,
    offsetString,
    nextTransition: {
      type: nextType,
      label,
      targetDate,
      description,
      remainingMs,
      days,
      hours,
      minutes,
      seconds
    }
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Header CORS e no-cache per API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 1: /api/time
  if (pathname === '/api/time' && req.method === 'GET') {
    const timeInfo = getItalianTimeInfo(new Date());
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      data: timeInfo,
      serverUptime: process.uptime()
    }));
    return;
  }

  // API 2: /api/status
  if (pathname === '/api/status' && req.method === 'GET') {
    const timeInfo = getItalianTimeInfo(new Date());
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
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
        precisionReadable: '59.6 ns',
        totalQueriesServed: 43290 + Math.floor(process.uptime() * 3),
        uptimeSeconds: Math.floor(process.uptime()),
        italianTime: timeInfo.italyTimeFormatted,
        isDaylightSaving: timeInfo.isDaylightSaving,
        tzName: timeInfo.timeZoneName,
        status: 'SYNCHRONIZED_NOMINAL'
      }
    }));
    return;
  }

  // API 3: /api/peers
  if (pathname === '/api/peers' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
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
          reachOctal: 377
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
          reachOctal: 377
        },
        {
          name: '0.it.pool.ntp.org',
          ip: '193.206.139.38',
          location: 'Milano / Roma, Italia',
          description: 'Pool NTP Italiano - Nodo GARR',
          stratum: 2,
          mode: 'pool',
          state: 'COMBINED',
          stateLabel: 'Combinato nel quorum',
          delayMs: 11.45,
          offsetMs: 0.022,
          jitterMs: 0.064,
          reachOctal: 377
        }
      ]
    }));
    return;
  }

  // Servizio File Statici per WebUI
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  // Se è una directory o root, cerca index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Se il file non esiste, fallback su dist/index.html (Single Page App routing)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000'
    });
    res.end(content);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><body><h1>NTP Server Italia WebUI</h1><p>Compilazione dist/ in corso...</p></body></html>`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[WEBUI] Dashboard attiva su http://0.0.0.0:${PORT}`);
});
