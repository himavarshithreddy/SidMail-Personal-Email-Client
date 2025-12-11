# Stage: builder
FROM node:20-alpine AS builder
WORKDIR /workspace

# Enable pnpm v10.24.0
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps ./apps

# Install dependencies only once for entire workspace
WORKDIR /workspace/apps/web
RUN pnpm install --frozen-lockfile

# Build Next.js in standalone mode
RUN pnpm build

# Stage: runner (production image)
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# Copy the standalone server output
COPY --from=builder /workspace/apps/web/.next/standalone ./
COPY --from=builder /workspace/apps/web/.next/static ./.next/static
COPY --from=builder /workspace/apps/web/public ./public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
