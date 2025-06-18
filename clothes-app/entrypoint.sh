#!/bin/sh

# Wait for the database to be ready
until nc -z -v -w30 postgres 5432
do
  echo "Waiting for PostgreSQL database connection..."
  sleep 2
done

# Run Prisma migration
bun prisma migrate dev --name init
bun prisma generate

# for deploting the build version
# RUN bun next build
# and
# RUN bun next start

CMD bun run dev
