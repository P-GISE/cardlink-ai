FROM node:24-alpine3.24@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS frontend
RUN apk upgrade --no-cache && apk add --no-cache openssl ca-certificates
WORKDIR /build
COPY 2026706445/frontend/package*.json ./
RUN npm ci
COPY 2026706445/frontend/ ./
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
RUN test -n "$SUPABASE_URL" && test -n "$SUPABASE_ANON_KEY"
RUN VITE_SUPABASE_URL="$SUPABASE_URL" VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" VITE_API_BASE_URL=/api npm run build

FROM node:24-alpine3.24@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53
RUN apk upgrade --no-cache && apk add --no-cache openssl ca-certificates
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
