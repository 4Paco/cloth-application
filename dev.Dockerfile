# syntax=docker.io/docker/dockerfile:1

FROM oven/bun:1 AS base

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

RUN apt-get update -y && apt-get install -y openssl

COPY app ./app
COPY public ./public
COPY lib ./lib
COPY hooks ./hooks
COPY components ./components
COPY prisma ./prisma
# COPY generated ./generated
COPY next.config.ts .
COPY tsconfig.json .
COPY postcss.config.mjs .

# Next.js collects completely anonymous telemetry data about general usage. Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at run time
ENV NEXT_TELEMETRY_DISABLED 1

RUN bunx prisma generate

CMD bun run dev
