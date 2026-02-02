FROM oven/bun:1.3

RUN bun add -g opencode-ai

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY src/ ./src/
COPY drizzle.config.ts ./

RUN mkdir -p /data/sessions

EXPOSE 3000

ENV NODE_ENV=production

CMD ["bun", "run", "start"]
