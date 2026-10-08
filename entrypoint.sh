#!/bin/bash
set -e

echo "=========================================================="
echo " [NTP Server Italia] Avvio Appliance di Sincronizzazione "
echo "=========================================================="

# 1. Configurazione dinamica Fuso Orario
TIMEZONE="${TZ:-Europe/Rome}"
echo "[TZ] Configurazione fuso orario su: $TIMEZONE"
if [ -f "/usr/share/zoneinfo/$TIMEZONE" ]; then
    cp "/usr/share/zoneinfo/$TIMEZONE" /etc/localtime
    echo "$TIMEZONE" > /etc/timezone
    echo "[TZ] Orario locale attuale: $(date)"
else
    echo "[WARN] Timezone $TIMEZONE non trovato, fallback su UTC"
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
    kill -TERM "$CHRONY_PID" 2>/dev/null || true
    kill -TERM "$NODE_PID" 2>/dev/null || true
    wait "$CHRONY_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGTERM SIGINT

# 5. Avvia la WebUI minimale Node.js
echo "[WEBUI] Avvio dashboard telemetria su porta ${PORT:-8080}..."
if [ -f "./server.ts" ]; then
    npx tsx server.ts &
    NODE_PID=$!
elif [ -f "./server.js" ]; then
    node server.js &
    NODE_PID=$!
else
    node -e "console.log('WebUI pronta.'); setInterval(()=>{}, 1000);" &
    NODE_PID=$!
fi

echo "[READY] NTP Server attivo e in ascolto per la rete locale!"
echo "        Verifica fonti upstream con: docker exec -it ntp-server-italia chronyc sources -v"

# Attesa processi
wait "$CHRONY_PID" "$NODE_PID"
