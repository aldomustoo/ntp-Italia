/**
 * Docker and Chrony configuration templates generator for Italian NTP server.
 * Progettato per repository open-source: nessun username hardcoded,
 * supporto per variabili d'ambiente $DOCKER_USER e rilevamento dinamico della sessione Docker.
 */

export interface DockerConfigOptions {
  dockerUsername: string;
  imageName: string;
  versionTag: string;
  containerName: string;
  udpPort: number;
  webPort: number;
  lanSubnets: string[];
  includeInrimServers: boolean;
  includeItalianPool: boolean;
  timezone: string;
}

export const DEFAULT_DOCKER_CONFIG: DockerConfigOptions = {
  dockerUsername: '', // Vuoto per default: viene rilevato da docker login o richiesto all'utente
  imageName: 'chrony-ntp-server',
  versionTag: '1.0.0',
  containerName: 'ntp-server-italia',
  udpPort: 123,
  webPort: 8080,
  lanSubnets: ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'],
  includeInrimServers: true,
  includeItalianPool: true,
  timezone: 'Europe/Rome'
};

export function generateChronyConf(opts: DockerConfigOptions = DEFAULT_DOCKER_CONFIG): string {
  const allowDirectives = opts.lanSubnets
    .filter(s => s.trim().length > 0)
    .map(s => `allow ${s.trim()}`)
    .join('\n');

  return `# ==============================================================================
# Chrony NTP Server - Configurazione Ufficiale Italia (Europe/Rome)
# Ottimizzato per sincronizzazione rete LAN locale (PC, Router, IoT, CCTV, NAS)
# ==============================================================================

# 1. Server Ufficiali Italiani
# INRIM: Istituto Nazionale di Ricerca Metrologica (Torino) - Campione Nazionale di Tempo
${opts.includeInrimServers ? `server ntp1.inrim.it iburst prefer minpoll 4 maxpoll 8
server ntp2.inrim.it iburst minpoll 4 maxpoll 8` : '# INRIM disabilitato dall\'utente'}

# 2. Pool NTP Italiano (Centinaia di server distribuiti a bassa latenza)
${opts.includeItalianPool ? `pool it.pool.ntp.org iburst maxsources 4` : '# Pool it.pool.ntp.org disabilitato'}

# 3. Fallback Europeo ad alta affidabilità
pool europe.pool.ntp.org iburst maxsources 2

# 4. Compensazione Drift e Hardware Clock
driftfile /var/lib/chrony/drift

# 5. Step Iniziale: Se l'orologio di avvio differisce di oltre 1s, correggi nei primi 3 aggiornamenti
# Dopodiché, applica solo smooth slewing continuo per non rompere database/log
makestep 1.0 3

# 6. Sincronizzazione con Real Time Clock hardware (RTC) del sistema host
rtcsync

# 7. Abilitazione servizio NTP per la rete locale (LAN)
${allowDirectives}

# Abilita query locali di diagnostica
allow 127.0.0.1
allow ::1
cmdallow 127.0.0.1
cmdallow ::1

# 8. Protezione da attacchi Amplification DDoS sulla porta UDP 123
ratelimit interval 1 burst 8

# 9. Mantieni il servizio NTP attivo anche se momentaneamente offline (Stratum 10 local)
local stratum 10 orphan

# 10. File di log e statistiche
logdir /var/log/chrony
log measurements statistics tracking
`;
}

export function generateDockerfile(opts: DockerConfigOptions = DEFAULT_DOCKER_CONFIG): string {
  const maintainerRef = opts.dockerUsername ? opts.dockerUsername : 'Open Source Community';
  return `# ==============================================================================
# Dockerfile: Ultra-lightweight NTP Server Italia con Minimal WebUI
# Base: Alpine Linux 3.21 (~7MB footprint, <15MB RAM a regime)
# Multi-arch support: linux/amd64, linux/arm64 (Raspberry Pi, NAS, Proxmox)
# ==============================================================================

# Stage 1: Build WebUI e Server autonomo
FROM node:22-alpine AS webui-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit
COPY . .
RUN npm run build

# Stage 2: Immagine finale ultraleggera di produzione (~35MB)
FROM alpine:3.21

ARG DOCKER_USER=""
LABEL maintainer="${maintainerRef}"
LABEL description="Chrony NTP Server locale sincronizzato con INRIM e pool italiano (Europe/Rome)"
LABEL org.opencontainers.image.source="https://github.com/\${DOCKER_USER}/${opts.imageName}"

# 1. Installazione Chrony, tzdata (per gestione fuso Europe/Rome e DST) e runtime Node.js (senza npm)
RUN apk add --no-cache \\
    chrony \\
    tzdata \\
    nodejs \\
    bash \\
    curl \\
    && cp /usr/share/zoneinfo/${opts.timezone} /etc/localtime \\
    && echo "${opts.timezone}" > /etc/timezone \\
    && mkdir -p /var/lib/chrony /var/log/chrony /app \\
    && chown -R chrony:chrony /var/lib/chrony /var/log/chrony

WORKDIR /app

# 2. Copia solo la build prodotta (dist/ con asset HTML/JS e server.js autonomo)
COPY --from=webui-builder /app/dist ./dist
COPY chrony.conf entrypoint.sh ./

RUN chmod +x entrypoint.sh

# 3. Esposizione porte:
# 123/udp: Porta standard NTP (RFC 5905)
# 8080/tcp: Porta WebUI minimale per telemetria e stato
EXPOSE ${opts.udpPort}/udp
EXPOSE ${opts.webPort}/tcp

# Variabili d'ambiente di default
ENV TZ=${opts.timezone} \\
    PORT=${opts.webPort} \\
    NODE_ENV=production

# Healthcheck automatico Docker per verificare lo stato di sincronizzazione Chrony
HEALTHCHECK --interval=60s --timeout=5s --start-period=10s --retries=3 \\
  CMD chronyc tracking || exit 1

ENTRYPOINT ["./entrypoint.sh"]
`;
}

export function generateDockerCompose(opts: DockerConfigOptions = DEFAULT_DOCKER_CONFIG): string {
  const userPlaceholder = opts.dockerUsername ? opts.dockerUsername : '\${DOCKER_USER:-tuo-username}';
  return `name: ntp-italia-stack

services:
  ntp-server:
    # Usa la variabile DOCKER_USER (dal file .env) o compila localmente con 'build: .'
    image: ${userPlaceholder}/${opts.imageName}:${opts.versionTag}
    # In alternativa, per compilare direttamente dal codice sorgente locale:
    # build: .
    container_name: ${opts.containerName}
    restart: unless-stopped
    
    # Privilegio kernel richiesto per la regolazione precisa dell'orologio host (slewing)
    cap_add:
      - SYS_TIME
    
    environment:
      - TZ=${opts.timezone}
      - PORT=${opts.webPort}
      - NODE_ENV=production
    
    ports:
      # Porta NTP UDP ufficiale: DEVE essere 123 su UDP per tutti i client LAN
      - "${opts.udpPort}:123/udp"
      # Porta WebUI per consultare lo stato, offset e peers INRIM
      - "${opts.webPort}:8080/tcp"
    
    volumes:
      # Persistenza del drift file per evitare salti di clock dopo un riavvio
      - ntp_drift_data:/var/lib/chrony
      # Opzionale: monta la configurazione personalizzata
      # - ./chrony.conf:/etc/chrony/chrony.conf:ro

volumes:
  ntp_drift_data:
    name: ${opts.containerName}_drift
`;
}

export function generateEntrypoint(opts: DockerConfigOptions = DEFAULT_DOCKER_CONFIG): string {
  return `#!/bin/bash
set -e

echo "=========================================================="
echo " [NTP Server Italia] Avvio Appliance di Sincronizzazione "
echo "=========================================================="

# 1. Configurazione dinamica Fuso Orario
TIMEZONE="\${TZ:-${opts.timezone}}"
echo "[TZ] Configurazione fuso orario su: \$TIMEZONE"
if [ -f "/usr/share/zoneinfo/\$TIMEZONE" ]; then
    cp "/usr/share/zoneinfo/\$TIMEZONE" /etc/localtime
    echo "\$TIMEZONE" > /etc/timezone
    echo "[TZ] Orario locale attuale: \$(date)"
else
    echo "[WARN] Timezone \$TIMEZONE non trovato, fallback su UTC"
fi

# 2. Verifica privilegi SYS_TIME
if ! capsh --print 2>/dev/null | grep -q "cap_sys_time"; then
    echo "[INFO] Suggerimento: Per permettere al container di correggere il drift a livello kernel,"
    echo "       assicurati di aver passato '--cap-add=SYS_TIME' nel comando docker."
fi

# 3. Assicura file di configurazione chrony
if [ ! -f "/etc/chrony/chrony.conf" ] && [ -f "./chrony.conf" ]; then
    mkdir -p /etc/chrony
    cp ./chrony.conf /etc/chrony/chrony.conf
fi

# 4. Avvia Chrony Daemon in background (modalità server NTP)
echo "[CHRONY] Avvio demone NTP su porta UDP 123..."
chronyd -d -f /etc/chrony/chrony.conf &
CHRONY_PID=$!

# Handler pulito di terminazione SIGTERM/SIGINT
cleanup() {
    echo "[NTP] Segnale di arresto ricevuto. Chiusura in corso..."
    kill -TERM "\$CHRONY_PID" 2>/dev/null || true
    kill -TERM "\$NODE_PID" 2>/dev/null || true
    wait "\$CHRONY_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGTERM SIGINT

# 5. Avvia la WebUI minimale Node.js
echo "[WEBUI] Avvio dashboard telemetria su porta \${PORT:-${opts.webPort}}..."
if [ -f "./dist/server.js" ]; then
    node ./dist/server.js &
    NODE_PID=$!
elif [ -f "./server.js" ]; then
    node server.js &
    NODE_PID=$!
elif [ -f "./server.ts" ]; then
    npx tsx server.ts &
    NODE_PID=$!
else
    node -e "console.log('WebUI pronta.'); setInterval(()=>{}, 1000);" &
    NODE_PID=$!
fi

echo "[READY] NTP Server attivo e in ascolto per la rete locale!"
echo "        Verifica fonti upstream con: docker exec -it <container> chronyc sources -v"

# Attesa processi
wait "\$CHRONY_PID" "\$NODE_PID"
`;
}

export function generatePublishScript(opts: DockerConfigOptions = DEFAULT_DOCKER_CONFIG): string {
  const defaultUserFallback = opts.dockerUsername ? opts.dockerUsername : '';
  return `#!/usr/bin/env bash
# ==============================================================================
# Script di Compilazione e Pubblicazione su Docker Hub
# Progetto: NTP Server Italia
# Supporto Multi-Arch: linux/amd64 (PC/Server x86) + linux/arm64 (Raspberry Pi/ARM)
# ==============================================================================

set -euo pipefail

# Colori per il terminale
RED='\\033[0;31m'
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
YELLOW='\\033[1;33m'
BOLD='\\033[1m'
NC='\\033[0m'

IMAGE_NAME="\${IMAGE_NAME:-${opts.imageName}}"
TAG="\${1:-\${VERSION:-${opts.versionTag}}}"
PLATFORMS="linux/amd64,linux/arm64"

echo -e "\${BLUE}\${BOLD}========================================================================\${NC}"
echo -e "\${GREEN}\${BOLD}     NTP SERVER ITALIA - PUBBLICAZIONE SU DOCKER HUB     \${NC}"
echo -e "\${BLUE}\${BOLD}========================================================================\${NC}"

# 1. Verifica che Docker sia in esecuzione
if ! docker info >/dev/null 2>&1; then
    echo -e "\${RED}[ERRORE] Docker non è in esecuzione sul sistema locale. Avvia Docker Desktop o dockerd.\${NC}"
    exit 1
fi

# 2. Rilevamento automatico e dinamico dell'utente Docker Hub
# Prova prima: variabile d'ambiente DOCKER_USER
# Prova seconda: sessione docker login attiva nel sistema
# Prova terza: richiesta interattiva all'utente
DETECTED_USER=\$(docker system info 2>/dev/null | grep -i "Username:" | awk '{print \$2}' || true)
INITIAL_USER="\${DOCKER_USER:-${defaultUserFallback}}"
DOCKER_USER="\${INITIAL_USER:-\${DETECTED_USER:-}}"

if [ -z "\$DOCKER_USER" ]; then
    echo -e "\${YELLOW}[INFO] Nessun account Docker Hub specificato o rilevato.\${NC}"
    read -p "Inserisci il tuo username Docker Hub personale: " DOCKER_USER
fi

if [ -z "\$DOCKER_USER" ]; then
    echo -e "\${RED}[ERRORE] Lo username Docker Hub è obbligatorio per pubblicare l'immagine.\${NC}"
    exit 1
fi

FULL_IMAGE="\$DOCKER_USER/\$IMAGE_NAME:\$TAG"
LATEST_IMAGE="\$DOCKER_USER/\$IMAGE_NAME:latest"

echo -e "Account Docker Hub: \${BOLD}\$DOCKER_USER\${NC}"
echo -e "Immagine target:   \${BOLD}\$FULL_IMAGE\${NC}"
echo -e "Tag addizionale:   \${BOLD}\$LATEST_IMAGE\${NC}"
echo -e "Piattaforme:       \${BOLD}\$PLATFORMS\${NC} (Intel/AMD + ARM64/Raspberry Pi)"
echo ""

# 3. Controllo o esecuzione login su Docker Hub
echo -e "\${BLUE}[1/5] Verifica credenziali Docker Hub per \$DOCKER_USER...\${NC}"
if ! docker system info 2>/dev/null | grep -q "Username:"; then
    echo -e "\${YELLOW}[AVVISO] Sessione Docker Hub non trovata. Richiesto login per \$DOCKER_USER:\${NC}"
    docker login -u "\$DOCKER_USER"
else
    LOGGED_USER=\$(docker system info 2>/dev/null | grep -i "Username:" | awk '{print \$2}')
    if [ "\$LOGGED_USER" != "\$DOCKER_USER" ]; then
        echo -e "\${YELLOW}[ATTENZIONE] Sei attualmente autenticato come '\$LOGGED_USER' ma stai pubblicando su '\$DOCKER_USER'.\${NC}"
        read -p "Vuoi eseguire il login con l'account \$DOCKER_USER? [s/N]: " RELOGIN
        if [[ "\$RELOGIN" =~ ^[sSyY]$ ]]; then
            docker login -u "\$DOCKER_USER"
        fi
    else
        echo -e "\${GREEN}[OK] Autenticato correttamente come: \$LOGGED_USER\${NC}"
    fi
fi

# 4. Configurazione Docker Buildx per build multi-architettura
echo -e "\${BLUE}[2/5] Configurazione Docker Buildx per supporto multi-arch (x86_64 + ARM64)...\${NC}"
BUILDER_NAME="ntp-builder"
if ! docker buildx inspect "\$BUILDER_NAME" >/dev/null 2>&1; then
    echo -e "Creazione istanza buildx '\$BUILDER_NAME'..."
    docker buildx create --name "\$BUILDER_NAME" --use
    docker buildx inspect --bootstrap
else
    echo -e "Uso istanza buildx esistente '\$BUILDER_NAME'..."
    docker buildx use "\$BUILDER_NAME"
fi

# 5. Conferma prima del push
echo ""
echo -e "\${YELLOW}Sei pronto per compilare ed inviare su Docker Hub?\${NC}"
echo -e "Verranno pubblicati i tag:"
echo -e "  - \${GREEN}\$FULL_IMAGE\${NC}"
echo -e "  - \${GREEN}\$LATEST_IMAGE\${NC}"
read -p "Procedere con il build e push? [S/n]: " CONFIRM
if [[ "\$CONFIRM" =~ ^[nN]$ ]]; then
    echo -e "\${RED}Operazione annullata dall'utente.\${NC}"
    exit 0
fi

# 6. Compilazione e Push Multi-Arch
echo -e "\${BLUE}[3/5] Compilazione ed invio delle immagini multi-arch (\${PLATFORMS})...\${NC}"
docker buildx build \\
    --platform "\$PLATFORMS" \\
    --build-arg DOCKER_USER="\$DOCKER_USER" \\
    --tag "\$FULL_IMAGE" \\
    --tag "\$LATEST_IMAGE" \\
    --push \\
    .

echo ""
echo -e "\${GREEN}\${BOLD}========================================================================\${NC}"
echo -e "\${GREEN}\${BOLD} [SUCCESSO] Immagine pubblicata correttamente su Docker Hub! \${NC}"
echo -e "\${GREEN}\${BOLD}========================================================================\${NC}"
echo -e "Link Docker Hub: \${BOLD}https://hub.docker.com/r/\$DOCKER_USER/\$IMAGE_NAME\${NC}"
echo ""
echo -e "Per eseguire l'appliance sulla tua rete locale:"
echo -e "  \${BOLD}docker run -d \\\\\${NC}"
echo -e "    --name ${opts.containerName} \\\\"
echo -e "    --restart unless-stopped \\\\"
echo -e "    --cap-add=SYS_TIME \\\\"
echo -e "    -p ${opts.udpPort}:123/udp \\\\"
echo -e "    -p ${opts.webPort}:8080 \\\\"
echo -e "    -e TZ=${opts.timezone} \\\\"
echo -e "    \${FULL_IMAGE}"
echo ""
`;
}

export function generateReadme(opts: DockerConfigOptions = DEFAULT_DOCKER_CONFIG): string {
  const userPlaceholder = opts.dockerUsername ? opts.dockerUsername : '<tuo-username-dockerhub>';
  return `# NTP Server Italia - Appliance Docker per Rete Locale (LAN)

Server NTP ultra-leggero basato su **Alpine Linux** e **Chrony**, con WebUI minimale di telemetria, preconfigurato per l'orario italiano (**Europe/Rome**) e sincronizzato direttamente con l'**INRIM** (Istituto Nazionale di Ricerca Metrologica a Torino, campione nazionale di tempo) e il pool NTP italiano.

---

## Caratteristiche Principali

- **Leggerissimo**: Consumo RAM tipico inferiore a **15 MB**, basato su Alpine Linux.
- **Precisione Atomica Italiana**: Sincronizzato con \`ntp1.inrim.it\`, \`ntp2.inrim.it\` e \`it.pool.ntp.org\`.
- **Gestione Automatica Ora Legale/Solare**: Il demone Chrony opera in standard UTC; le transizioni CET (UTC+1) / CEST (UTC+2) avvengono in modo continuo tramite \`tzdata\` senza interruzioni di rete né salti indietro nell'orologio.
- **WebUI Minimale Inclusa**: Cruscotto moderno su porta TCP 8080 per verificare lo stato di sincronizzazione, stratum, offset e peers.
- **Multi-Architettura**: Compatibile nativamente sia con **x86_64/AMD64** (PC, server, Proxmox) che con **ARM64/v7** (Raspberry Pi 3/4/5, NAS Synology/QNAP).
- **Pronto per Open Source**: Nessun account hardcoded. Ogni utente può compilare in locale o pubblicare sul proprio account Docker Hub.

---

## 1. Deployment Immediato

### Opzione A: 1-Comando Docker Run

Puoi compilare direttamente in locale o usare la tua immagine Docker Hub:

\`\`\`bash
# Se usi la tua immagine Docker Hub pubblicata:
docker run -d \\
  --name ${opts.containerName} \\
  --restart unless-stopped \\
  --cap-add=SYS_TIME \\
  -p ${opts.udpPort}:123/udp \\
  -p ${opts.webPort}:8080 \\
  -e TZ=Europe/Rome \\
  ${userPlaceholder}/${opts.imageName}:latest
\`\`\`

> **Nota sui permessi (\`--cap-add=SYS_TIME\`)**: Questo privilegio permette al demone Chrony di effettuare lo "slewing" continuo dell'orologio senza dover eseguire il container come \`--privileged\`.

---

### Opzione B: Docker Compose (Consigliato per Home Assistant, NAS o Proxmox)

Copia il file di configurazione ambiente:
\`\`\`bash
cp .env.example .env
# Imposta DOCKER_USER="tuo-username" all'interno di .env
\`\`\`

Crea o avvia il file \`docker-compose.yml\`:

\`\`\`yaml
services:
  ntp-server:
    # Usa la variabile DOCKER_USER da .env, oppure compila in locale con 'build: .'
    image: \${DOCKER_USER:-${userPlaceholder}}/${opts.imageName}:latest
    # build: .
    container_name: ${opts.containerName}
    restart: unless-stopped
    cap_add:
      - SYS_TIME
    environment:
      - TZ=Europe/Rome
      - PORT=8080
    ports:
      - "${opts.udpPort}:123/udp"
      - "${opts.webPort}:8080/tcp"
    volumes:
      - ntp_drift:/var/lib/chrony

volumes:
  ntp_drift:
\`\`\`

Avvia lo stack:
\`\`\`bash
docker compose up -d
\`\`\`

---

## 2. Pubblicazione su Docker Hub col Tuo Account

Lo script \`publish-dockerhub.sh\` rileva automaticamente chi è loggato sul sistema o ti chiede in modo interattivo il tuo username Docker Hub personale:

1. Rende eseguibile lo script:
   \`\`\`bash
   chmod +x publish-dockerhub.sh
   \`\`\`
2. Esegue lo script (puoi anche passare la versione desiderata come argomento):
   \`\`\`bash
   ./publish-dockerhub.sh 1.0.0
   \`\`\`
3. Lo script ti chiederà il login su Docker Hub (se non già attivo), configurerà \`docker buildx\`, compilerà per **AMD64** e **ARM64** ed effettuerà il push automatico sulla tua repository.

In alternativa, puoi passare il tuo username direttamente come variabile d'ambiente:
\`\`\`bash
DOCKER_USER="tuo-username" ./publish-dockerhub.sh 1.0.0
\`\`\`

---

## 3. Configurazione Automatica dei Dispositivi sulla LAN

Il modo più efficiente per sincronizzare **tutti** i dispositivi di casa o ufficio senza configurarli uno ad uno è impostare l'**Opzione DHCP 42 (NTP Server)** sul router di rete:

1. Accedi al pannello del tuo router (Fritz!Box, pfSense, OPNsense, UniFi, Keenetic, Mikrotik).
2. Nella sezione **Server DHCP**, inserisci l'indirizzo IP locale della macchina dove gira questo container (es. \`192.168.1.100\`) nel campo **NTP Server (Opzione 42)**.
3. Tutti i dispositivi collegati riceveranno automaticamente questo server come riferimento temporale.

### Configurazione Manuale dei Client Principali:

- **Windows 10 / 11**:
  \`\`\`cmd
  w32tm /config /syncfromflags:manual /manualpeerlist:"192.168.1.100,0x8"
  w32tm /config /update
  w32tm /resync
  \`\`\`

- **Linux (Ubuntu / Debian / systemd-timesyncd)**:
  Modifica \`/etc/systemd/timesyncd.conf\`:
  \`\`\`ini
  [Time]
  NTP=192.168.1.100
  \`\`\`
  Riavvia: \`sudo systemctl restart systemd-timesyncd\`

- **macOS**:
  \`\`\`bash
  sudo sntp -sS 192.168.1.100
  \`\`\`

- **Telecamere CCTV (Hikvision, Dahua, Reolink)**:
  Nel pannello web della telecamera > *Configurazione* > *Sistema* > *Ora*:
  - Modalità NTP: Seleziona **NTP**
  - Indirizzo Server: \`192.168.1.100\`
  - Porta: \`123\`
  - Fuso orario: \`GMT+01:00 Amsterdam, Berlino, Roma\`
  - Abilita DST: \`Spuntato\`

- **ESP8266 / ESP32 (Arduino)**:
  \`\`\`cpp
  // Fuso orario Italia: UTC+1 standard, 3600s di daylight offset durante l'ora legale
  configTime(3600, 3600, "192.168.1.100");
  \`\`\`

---

## 4. Verifica Funzionamento

Puoi verificare lo stato del demone Chrony all'interno del container:

\`\`\`bash
# Mostra le sorgenti attive (INRIM e pool italiano)
docker exec -it ${opts.containerName} chronyc sources -v

# Mostra lo stato di tracking (stratum, offset, jitter)
docker exec -it ${opts.containerName} chronyc tracking
\`\`\`
`;
}
