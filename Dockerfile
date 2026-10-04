# syntax=docker/dockerfile:1.7

# --- deps -------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- builder ----------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ARG alone is NOT visible to the build process. Without the matching ENV every
# NEXT_PUBLIC_* is empty in the client bundle, the WhatsApp group buttons do
# nothing, and you find out when a participant taps one.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_WA_GRUP_IKHWAN
ARG NEXT_PUBLIC_WA_GRUP_AKHWAT
ARG NEXT_PUBLIC_WA_ADMIN
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_WA_GRUP_IKHWAN=$NEXT_PUBLIC_WA_GRUP_IKHWAN
ENV NEXT_PUBLIC_WA_GRUP_AKHWAT=$NEXT_PUBLIC_WA_GRUP_AKHWAT
ENV NEXT_PUBLIC_WA_ADMIN=$NEXT_PUBLIC_WA_ADMIN

# Fail here, in the build, rather than in a participant's hands.
RUN test -n "$NEXT_PUBLIC_BASE_URL" || (echo "NEXT_PUBLIC_BASE_URL is empty" && exit 1)

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# --- migrator ---------------------------------------------------------------
# A separate stage on purpose. Copying node_modules/.bin/drizzle-kit copies a
# symlink without its package, and `pnpm db:migrate` then fails with
# "command not found" mid-pipeline, after the image is already pushed.
FROM node:22-alpine AS migrator
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY drizzle ./drizzle
COPY db ./db
COPY drizzle.config.ts package.json pnpm-workspace.yaml tsconfig.json ./
ENV NODE_ENV=production
CMD ["pnpm", "db:migrate"]

# --- runner -----------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Not a formality on somebody else's server: if the app is breached, the blast
# radius stops at the container.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.json()).then(j=>process.exit(j.db==='ok'?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
