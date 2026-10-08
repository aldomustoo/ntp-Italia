#!/usr/bin/env bash
# ==============================================================================
# Script di Compilazione e Pubblicazione su Docker Hub
# Progetto: NTP Server Italia
# Supporto Multi-Arch: linux/amd64 (PC/Server x86) + linux/arm64 (Raspberry Pi/ARM)
# ==============================================================================

set -euo pipefail

# Colori per il terminale
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

IMAGE_NAME="${IMAGE_NAME:-chrony-ntp-server}"
TAG="${1:-${VERSION:-1.0.0}}"
PLATFORMS="linux/amd64,linux/arm64"

echo -e "${BLUE}${BOLD}========================================================================${NC}"
echo -e "${GREEN}${BOLD}     NTP SERVER ITALIA - PUBBLICAZIONE SU DOCKER HUB     ${NC}"
echo -e "${BLUE}${BOLD}========================================================================${NC}"

# 1. Verifica che Docker sia in esecuzione
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}[ERRORE] Docker non è in esecuzione sul sistema locale. Avvia Docker Desktop o dockerd.${NC}"
    exit 1
fi

# 2. Rilevamento automatico dell'account Docker Hub:
# - Se passata come variabile d'ambiente $DOCKER_USER, usa quella.
# - Altrimenti, rileva l'utente già autenticato nel client locale con docker system info.
# - Se non è autenticato o vuoto, richiede lo username interattivamente da tastiera.
DETECTED_USER=$(docker system info 2>/dev/null | grep -i "Username:" | awk '{print $2}' || true)
DOCKER_USER="${DOCKER_USER:-${DETECTED_USER:-}}"

if [ -z "$DOCKER_USER" ]; then
    echo -e "${YELLOW}[INFO] Nessun account Docker Hub specificato o rilevato nella sessione locale.${NC}"
    read -p "Inserisci il tuo username Docker Hub personale: " DOCKER_USER
fi

if [ -z "$DOCKER_USER" ]; then
    echo -e "${RED}[ERRORE] Lo username Docker Hub è obbligatorio per procedere con la pubblicazione.${NC}"
    exit 1
fi

FULL_IMAGE="$DOCKER_USER/$IMAGE_NAME:$TAG"
LATEST_IMAGE="$DOCKER_USER/$IMAGE_NAME:latest"

echo -e "Account Docker Hub: ${BOLD}$DOCKER_USER${NC}"
echo -e "Immagine target:   ${BOLD}$FULL_IMAGE${NC}"
echo -e "Tag addizionale:   ${BOLD}$LATEST_IMAGE${NC}"
echo -e "Piattaforme:       ${BOLD}$PLATFORMS${NC} (Intel/AMD + ARM64/Raspberry Pi)"
echo ""

# 3. Controllo o esecuzione login su Docker Hub
echo -e "${BLUE}[1/5] Verifica credenziali Docker Hub per $DOCKER_USER...${NC}"
if ! docker system info 2>/dev/null | grep -q "Username:"; then
    echo -e "${YELLOW}[AVVISO] Sessione Docker Hub non trovata. Richiesto login per l'account $DOCKER_USER:${NC}"
    docker login -u "$DOCKER_USER"
else
    LOGGED_USER=$(docker system info 2>/dev/null | grep -i "Username:" | awk '{print $2}')
    if [ "$LOGGED_USER" != "$DOCKER_USER" ]; then
        echo -e "${YELLOW}[ATTENZIONE] Sei attualmente autenticato come '$LOGGED_USER' ma stai pubblicando su '$DOCKER_USER'.${NC}"
        read -p "Vuoi eseguire il login con l'account $DOCKER_USER? [s/N]: " RELOGIN
        if [[ "$RELOGIN" =~ ^[sSyY]$ ]]; then
            docker login -u "$DOCKER_USER"
        fi
    else
        echo -e "${GREEN}[OK] Autenticato correttamente come: $LOGGED_USER${NC}"
    fi
fi

# 4. Configurazione Docker Buildx per build multi-architettura
echo -e "${BLUE}[2/5] Configurazione Docker Buildx per supporto multi-arch (x86_64 + ARM64)...${NC}"
BUILDER_NAME="ntp-builder"
if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
    echo -e "Creazione istanza buildx '$BUILDER_NAME'..."
    docker buildx create --name "$BUILDER_NAME" --use
    docker buildx inspect --bootstrap
else
    echo -e "Uso istanza buildx esistente '$BUILDER_NAME'..."
    docker buildx use "$BUILDER_NAME"
fi

# 5. Conferma prima del push
echo ""
echo -e "${YELLOW}Sei pronto per compilare ed inviare su Docker Hub?${NC}"
echo -e "Verranno pubblicati i tag:"
echo -e "  - ${GREEN}$FULL_IMAGE${NC}"
echo -e "  - ${GREEN}$LATEST_IMAGE${NC}"
read -p "Procedere con il build e push? [S/n]: " CONFIRM
if [[ "$CONFIRM" =~ ^[nN]$ ]]; then
    echo -e "${RED}Operazione annullata dall'utente.${NC}"
    exit 0
fi

# 6. Compilazione e Push Multi-Arch
echo -e "${BLUE}[3/5] Compilazione ed invio delle immagini multi-arch (${PLATFORMS})...${NC}"
docker buildx build \
    --platform "$PLATFORMS" \
    --build-arg DOCKER_USER="$DOCKER_USER" \
    --tag "$FULL_IMAGE" \
    --tag "$LATEST_IMAGE" \
    --push \
    .

echo ""
echo -e "${GREEN}${BOLD}========================================================================${NC}"
echo -e "${GREEN}${BOLD} [SUCCESSO] Immagine pubblicata correttamente su Docker Hub! ${NC}"
echo -e "${GREEN}${BOLD}========================================================================${NC}"
echo -e "Link repository: ${BOLD}https://hub.docker.com/r/$DOCKER_USER/$IMAGE_NAME${NC}"
echo ""
echo -e "Per eseguire l'appliance sulla tua rete locale:"
echo -e "  ${BOLD}docker run -d \\${NC}"
echo -e "    --name ntp-server-italia \\"
echo -e "    --restart unless-stopped \\"
echo -e "    --cap-add=SYS_TIME \\"
echo -e "    -p 123:123/udp \\"
echo -e "    -p 8080:8080 \\"
echo -e "    -e TZ=Europe/Rome \\"
echo -e "    ${FULL_IMAGE}"
echo ""
