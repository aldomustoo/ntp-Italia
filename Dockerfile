# ==============================================================================
# Dockerfile: Ultra-lightweight NTP Server Italia con Minimal WebUI
# Base: Alpine Linux 3.21 (~7MB footprint, <15MB RAM a regime)
# Multi-arch: linux/amd64 (x86_64) + linux/arm64 (Raspberry Pi, NAS)
# ==============================================================================

# Stage 1: Build WebUI e Server autonomo
FROM node:22-alpine AS webui-builder
WORKDIR /app

# Copia definizioni package
COPY package*.json ./

# Installazione con --legacy-peer-deps per evitare blocchi ERESOLVE con o senza package-lock.json
RUN npm install --legacy-peer-deps --no-audit

# Copia codice sorgente e compilazione completa (client Vite + server Node)
COPY . .
RUN npm run build

# Stage 2: Immagine finale ultraleggera di produzione (~35MB)
FROM alpine:3.21

ARG DOCKER_USER=""
LABEL maintainer="Open Source Community"
LABEL description="Chrony NTP Server locale sincronizzato con INRIM e pool italiano (Europe/Rome)"
LABEL org.opencontainers.image.source="https://github.com/${DOCKER_USER}/chrony-ntp-server"

# Installazione Chrony, tzdata (per gestione fuso Europe/Rome e DST) e runtime Node.js (senza npm)
RUN apk add --no-cache \
    chrony \
    tzdata \
    nodejs \
    bash \
    curl \
    && cp /usr/share/zoneinfo/Europe/Rome /etc/localtime \
    && echo "Europe/Rome" > /etc/timezone \
    && mkdir -p /var/lib/chrony /var/log/chrony /app \
    && chown -R chrony:chrony /var/lib/chrony /var/log/chrony

WORKDIR /app

# Copia solo la build prodotta (dist/ con asset HTML/JS e server.js autonomo)
COPY --from=webui-builder /app/dist ./dist
COPY chrony.conf entrypoint.sh ./

RUN chmod +x entrypoint.sh

# 123/udp: NTP service standard (RFC 5905)
# 8080/tcp: Minimal WebUI dashboard
EXPOSE 123/udp
EXPOSE 8080/tcp

ENV TZ=Europe/Rome \
    PORT=8080 \
    NODE_ENV=production

HEALTHCHECK --interval=60s --timeout=5s --start-period=10s --retries=3 \
  CMD chronyc tracking || exit 1

ENTRYPOINT ["./entrypoint.sh"]
