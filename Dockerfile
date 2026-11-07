# FrameFuzz live operator backend (OCI / any persistent host)
FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production \
    FRAMEFUZZ_ALLOW_PUBLIC_HOST=1 \
    FRAMEFUZZ_BIND=0.0.0.0 \
    PORT=4190

COPY package.json package-lock.json ./
COPY web-ui/package.json web-ui/package-lock.json ./web-ui/
RUN npm ci && npm run ui:install

COPY . .
RUN npm run ui:build \
  && mkdir -p /data/runs

EXPOSE 4190
# Secrets come from the process environment / --env-file mounted by the host.
CMD ["sh", "-c", "if [ -f /etc/framefuzz/framefuzz.env ]; then ENVFILE=--env-file=/etc/framefuzz/framefuzz.env; fi; exec node $ENVFILE bin/framefuzz.mjs serve --mode \"${FRAMEFUZZ_MODE:-LIVE_AUTHORIZED}\" --results /data/runs --port \"${PORT}\" --bind 0.0.0.0 --allow-chain \"${FRAMEFUZZ_ALLOW_CHAIN:-1337}\""]
