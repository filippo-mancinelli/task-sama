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

# Apply schema if the tables are not present yet
EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT to_regclass('public.users')" || echo "")
if [ -z "$EXISTS" ] || [ "$EXISTS" = "" ]; then
  echo "[entrypoint] Schema not found. Applying schema.sql..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f schema.sql
  echo "[entrypoint] Schema applied."
else
  echo "[entrypoint] Schema already present."
fi

# Seed when there is no data yet (self-healing if a previous seed failed).
# seed.sql is idempotent for keyed tables; gating on an empty users table
# avoids inserting duplicates on subsequent boots.
USERCOUNT=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM users" 2>/dev/null | tr -d '[:space:]')
if [ "$USERCOUNT" = "0" ] || [ -z "$USERCOUNT" ]; then
  echo "[entrypoint] No data found. Applying seed.sql (fake data)..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f seed.sql
  echo "[entrypoint] Seed applied."
else
  echo "[entrypoint] Data present ($USERCOUNT users), skipping seed."
fi

echo "[entrypoint] Starting backend: $*"
exec "$@"
