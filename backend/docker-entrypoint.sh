#!/bin/sh
# Wait for PostgreSQL, then apply schema + seed once (first boot only), then start the app.
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL is not set."
  exit 1
fi

echo "[entrypoint] Waiting for PostgreSQL to accept connections..."
until psql "$DATABASE_URL" -c 'SELECT 1' >/dev/null 2>&1; do
  echo "[entrypoint]   not ready, retrying in 2s..."
  sleep 2
done
echo "[entrypoint] PostgreSQL is up."

# Only initialize if the schema is not present yet (idempotent across restarts)
EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT to_regclass('public.users')" || echo "")
if [ -z "$EXISTS" ] || [ "$EXISTS" = "" ]; then
  echo "[entrypoint] Schema not found. Applying schema.sql..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f schema.sql
  echo "[entrypoint] Applying seed.sql (fake data)..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f seed.sql
  echo "[entrypoint] Database initialized."
else
  echo "[entrypoint] Schema already present, skipping init."
fi

echo "[entrypoint] Starting backend: $*"
exec "$@"
