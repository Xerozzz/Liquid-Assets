#!/bin/sh
set -e

if [ ! -d node_modules/.prisma/client ]; then
  echo "Generating Prisma client..."
  npx prisma generate
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ "${SEED_ON_START}" = "true" ]; then
  echo "Seeding database..."
  node prisma/seed.js || echo "Seed skipped or failed (may already be seeded)."
fi

echo "Starting backend..."
exec node src/index.js
