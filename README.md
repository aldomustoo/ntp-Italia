# NTP Server Italia - Appliance Docker per Rete Locale (LAN)

Server NTP ultra-leggero basato su **Alpine Linux** e **Chrony**, con WebUI minimale di telemetria, preconfigurato per l'orario italiano (**Europe/Rome**) e sincronizzato direttamente con l'**INRIM** (Istituto Nazionale di Ricerca Metrologica a Torino, campione nazionale di tempo) e il pool NTP italiano.

---

## Caratteristiche Principali

- **Leggerissimo**: Consumo RAM tipico inferiore a **15 MB**, basato su Alpine Linux.
- **Precisione Atomica Italiana**: Sincronizzato con `ntp1.inrim.it`, `ntp2.inrim.it` e `it.pool.ntp.org`.
- **Gestione Automatica Ora Legale/Solare**: Il demone Chrony opera in standard UTC; le transizioni CET (UTC+1) / CEST (UTC+2) avvengono in modo continuo tramite `tzdata` senza interruzioni di rete né salti indietro nell'orologio.
- **WebUI Minimale Inclusa**: Cruscotto moderno su porta TCP 8080 per verificare lo stato di sincronizzazione, stratum, offset e peers.
- **Multi-Architettura**: Compatibile nativamente sia con **x86_64/AMD64** (PC, server, Proxmox) che con **ARM64/v7** (Raspberry Pi 3/4/5, NAS Synology/QNAP).
- **Pronto per Open Source & GitHub**: Nessun account o username preimpostato. Ognuno può pubblicare sul proprio account Docker Hub personale o compilare localmente.

---

## 1. Deployment Immediato

### Opzione A: 1-Comando Docker Run

Puoi compilare direttamente in locale o usare la tua immagine Docker Hub:

```bash
docker run -d \
  --name ntp-server-italia \
  --restart unless-stopped \
  --cap-add=SYS_TIME \
  -p 123:123/udp \
  -p 8080:8080 \
  -e TZ=Europe/Rome \
  <tuo-username-dockerhub>/chrony-ntp-server:latest
```

> **Nota sui permessi (`--cap-add=SYS_TIME`)**: Questo privilegio permette al demone Chrony di effettuare lo "slewing" continuo dell'orologio senza dover eseguire il container come `--privileged`.

---

### Opzione B: Docker Compose (Consigliato per Home Assistant, NAS o Proxmox)

1. Clona il repository e prepara l'ambiente:
   ```bash
   cp .env.example .env
   # Modifica DOCKER_USER con il tuo username in .env
   ```

2. Avvia con `docker compose`:

```yaml
services:
  ntp-server:
    # Usa la variabile DOCKER_USER definita nel file .env, oppure compila in locale con 'build: .'
    image: ${DOCKER_USER:-tuo-username}/chrony-ntp-server:latest
    # build: .
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
  ntp_drift:
```

Avvia lo stack:
```bash
docker compose up -d
```

---

## 2. Pubblicazione su Docker Hub col Tuo Account

Abbiamo incluso lo script automatico `publish-dockerhub.sh`. Lo script:
1. Rileva automaticamente se hai già effettuato `docker login` o ti richiede il tuo username personale.
2. Configura automaticamente `docker buildx`.
3. Compila in contemporanea per **AMD64 (x86)** e **ARM64 (Raspberry Pi / Apple Silicon / NAS)**.
4. Esegue il push sul tuo repository personale di Docker Hub.

Esecuzione:
```bash
chmod +x publish-dockerhub.sh
./publish-dockerhub.sh 1.0.0
```

Oppure impostando la variabile al volo:
```bash
DOCKER_USER="tuo-account" ./publish-dockerhub.sh 1.0.0
```

---

## 3. Configurazione Automatica dei Dispositivi sulla LAN

Il modo più efficiente per sincronizzare **tutti** i dispositivi di casa o ufficio senza configurarli uno ad uno è impostare l'**Opzione DHCP 42 (NTP Server)** sul router di rete:

1. Accedi al pannello del tuo router (Fritz!Box, pfSense, OPNsense, UniFi, Keenetic, Mikrotik).
2. Nella sezione **Server DHCP**, inserisci l'indirizzo IP locale della macchina dove gira questo container (es. `192.168.1.100`) nel campo **NTP Server (Opzione 42)**.
3. Tutti i dispositivi collegati riceveranno automaticamente questo server come riferimento temporale.

### Configurazione Manuale dei Client Principali:

- **Windows 10 / 11**:
  ```cmd
  w32tm /config /syncfromflags:manual /manualpeerlist:"192.168.1.100,0x8"
  w32tm /config /update
  w32tm /resync
  ```

- **Linux (Ubuntu / Debian / systemd-timesyncd)**:
  Modifica `/etc/systemd/timesyncd.conf`:
  ```ini
  [Time]
  NTP=192.168.1.100
  ```
  Riavvia: `sudo systemctl restart systemd-timesyncd`

- **macOS**:
  ```bash
  sudo sntp -sS 192.168.1.100
  ```

- **Telecamere CCTV (Hikvision, Dahua, Reolink)**:
  Nel pannello web della telecamera > *Configurazione* > *Sistema* > *Ora*:
  - Modalità NTP: Seleziona **NTP**
  - Indirizzo Server: `192.168.1.100`
  - Porta: `123`
  - Fuso orario: `GMT+01:00 Amsterdam, Berlino, Roma`
  - Abilita DST: `Spuntato`

- **ESP8266 / ESP32 (Arduino)**:
  ```cpp
  // Fuso orario Italia: UTC+1 standard, 3600s di daylight offset durante l'ora legale
  configTime(3600, 3600, "192.168.1.100");
  ```

---

## 4. Verifica Funzionamento

Puoi verificare lo stato del demone Chrony all'interno del container:

```bash
# Mostra le sorgenti attive (INRIM e pool italiano)
docker exec -it ntp-server-italia chronyc sources -v

# Mostra lo stato di tracking (stratum, offset, jitter)
docker exec -it ntp-server-italia chronyc tracking
```
