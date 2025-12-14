FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# Copy workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps ./apps

# Install deps for web app
WORKDIR /app/apps/web
RUN pnpm install --frozen-lockfile

# Build Next.js
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "start"]
