FROM oven/bun:latest

WORKDIR /app/next-app

COPY package.json ./
COPY bun.lock ./

RUN bun install

COPY . .


# Next.js collects completely anonymous telemetry data about general usage. Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at run time
ENV NEXT_TELEMETRY_DISABLED 1

# for deploting the build version

# RUN bun next build
# and
# CMD bun next start

CMD bun run dev
