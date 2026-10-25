FROM node:24-bookworm-slim AS frontend
WORKDIR /build
COPY 2026706445/frontend/package*.json ./
RUN npm ci
COPY 2026706445/frontend/ ./
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
RUN test -n "$SUPABASE_URL" && test -n "$SUPABASE_ANON_KEY"
RUN VITE_SUPABASE_URL="$SUPABASE_URL" VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" VITE_API_BASE_URL=/api npm run build

FROM node:24-bookworm-slim
ARG REVISION_SHA
LABEL org.opencontainers.image.revision=$REVISION_SHA
ENV NODE_ENV=production PORT=4000
WORKDIR /app/backend
COPY 2026706445/backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY 2026706445/backend/src/ ./src/
COPY --from=frontend /build/dist/ /app/frontend/dist/
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
