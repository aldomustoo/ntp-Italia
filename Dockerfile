# ==============================================================================
# Dockerfile: Ultra-lightweight NTP Server Italia con Minimal WebUI
# Base: Alpine Linux 3.21 (~7MB footprint, <15MB RAM a regime)
# Multi-arch: linux/amd64 (x86_64) + linux/arm64 (Raspberry Pi, NAS)
# ==============================================================================

# Stage 1: Build WebUI con Vite
FROM node:22-alpine AS webui-builder
WORKDIR /app

# Copia definizioni package
COPY package*.json ./

# Installazione con --legacy-peer-deps
RUN npm install --legacy-peer-deps --no-audit

# Compilazione WebUI statica
COPY . .
RUN npm run build

# Stage 2: Immagine finale ultraleggera di produzione (~25MB)
FROM alpine:3.21

ARG DOCKER_USER=""
LABEL maintainer="Open Source Community"
LABEL description="Chrony NTP Server locale sincronizzato con INRIM e pool italiano (Europe/Rome)"
LABEL org.opencontainers.image.source="https://github.com/${DOCKER_USER}/chrony-ntp-server"

# Chrony, tzdata e runtime Node.js minimale (zero pacchetti npm di terze parti a runtime)
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

# Copia gli asset WebUI compilati e il server HTTP nativo zero-dipendenze
COPY --from=webui-builder /app/dist ./dist
COPY server.js chrony.conf entrypoint.sh ./

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
