FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./

RUN apk add --no-cache libc6-compat python3 make g++ musl-dev && \
    npm ci

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

ARG NEXTAUTH_SECRET=build-placeholder
ARG ENCRYPTION_MASTER_KEY=build-placeholder
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV ENCRYPTION_MASTER_KEY=${ENCRYPTION_MASTER_KEY}

RUN npm run build

FROM base AS runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=0 --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=0 --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=0 /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
