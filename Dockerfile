# ==============================================================================
# Dockerfile: Ultra-lightweight NTP Server Italia con Minimal WebUI
# Base: Alpine Linux 3.21 (~7MB footprint, <15MB RAM a regime)
# Multi-arch: linux/amd64 (x86_64) + linux/arm64 (Raspberry Pi, NAS)
# ==============================================================================

FROM node:22-alpine AS webui-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev
COPY . .
RUN npm run build || true

# Immagine finale ultraleggera di produzione
FROM alpine:3.21

ARG DOCKER_USER=""
LABEL maintainer="Open Source Community"
LABEL description="Chrony NTP Server locale sincronizzato con INRIM e pool italiano (Europe/Rome)"
LABEL org.opencontainers.image.source="https://github.com/${DOCKER_USER}/chrony-ntp-server"

# Installazione Chrony, tzdata (per gestione fuso Europe/Rome e DST) e Node.js
RUN apk add --no-cache \
    chrony \
    tzdata \
    nodejs \
    npm \
    bash \
    curl \
    && cp /usr/share/zoneinfo/Europe/Rome /etc/localtime \
    && echo "Europe/Rome" > /etc/timezone \
    && mkdir -p /var/lib/chrony /var/log/chrony /app \
    && chown -R chrony:chrony /var/lib/chrony /var/log/chrony

WORKDIR /app

# Copia dei file applicativi e webUI
COPY --from=webui-builder /app/dist ./dist
COPY --from=webui-builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server.ts entrypoint.sh chrony.conf ./

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
