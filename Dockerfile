FROM node:24-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS frontend
RUN apt-get update && apt-get upgrade -y --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY 2026706445/frontend/package*.json ./
RUN npm ci
COPY 2026706445/frontend/ ./
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
RUN test -n "$SUPABASE_URL" && test -n "$SUPABASE_ANON_KEY"
RUN VITE_SUPABASE_URL="$SUPABASE_URL" VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" VITE_API_BASE_URL=/api npm run build

FROM node:24-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205
RUN apt-get update && apt-get upgrade -y --no-install-recommends && rm -rf /var/lib/apt/lists/*
ARG REVISION_SHA
LABEL org.opencontainers.image.revision=$REVISION_SHA
ENV NODE_ENV=production PORT=4000
WORKDIR /app/backend
COPY 2026706445/backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
RUN rm -rf /usr/local/lib/node_modules /opt/yarn-* /root/.npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/corepack
COPY 2026706445/backend/src/ ./src/
COPY --from=frontend /build/dist/ /app/frontend/dist/
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
