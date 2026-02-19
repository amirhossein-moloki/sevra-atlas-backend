#!/bin/sh

# Exit on any error
set -e

# Ensure output directory exists
mkdir -p /test-results

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="/test-results/test-run-${TIMESTAMP}.log"

echo "--- Starting Test Runner [$(date)] ---" | tee -a "$LOG_FILE"

# 1. Environment Guard
export NODE_ENV=${NODE_ENV:-test}
export SANDBOX_MODE=${SANDBOX_MODE:-true}
export SKIP_CRITICAL_SECRETS_CHECK=${SKIP_CRITICAL_SECRETS_CHECK:-true}

echo "Running in NODE_ENV=$NODE_ENV (Sandbox: $SANDBOX_MODE)" | tee -a "$LOG_FILE"

# 2. Install necessary system dependencies for alpine (only if missing)
echo "Checking system dependencies..." | tee -a "$LOG_FILE"
if ! command -v pg_isready >/dev/null 2>&1 || ! command -v nc >/dev/null 2>&1; then
  echo "Installing system dependencies (alpine)..." | tee -a "$LOG_FILE"
  apk add --no-cache netcat-openbsd postgresql-client openssl libc6-compat | tee -a "$LOG_FILE"
else
  echo "System dependencies already installed." | tee -a "$LOG_FILE"
fi

# 3. Install node dependencies
# In a containerized environment, we prefer npm ci for reproducibility
if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Installing node dependencies..." | tee -a "$LOG_FILE"
  npm ci --include=dev | tee -a "$LOG_FILE"
else
  echo "node_modules found. Skipping full install (to force reinstall, remove node_modules or use --build)." | tee -a "$LOG_FILE"
fi

# 4. Wait for Postgres
PG_HOST=${POSTGRES_HOST:-postgres-test}
PG_PORT=${POSTGRES_PORT:-5432}
PG_USER=${POSTGRES_USER:-testuser}
PG_DB=${POSTGRES_DB:-testdb}

echo "Waiting for Postgres at ${PG_HOST}:${PG_PORT}..." | tee -a "$LOG_FILE"
MAX_RETRIES=30
COUNT=0
until pg_isready -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" >/dev/null 2>&1; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "Timeout waiting for Postgres" | tee -a "$LOG_FILE"
    exit 1
  fi
  echo "Postgres is unavailable (attempt $COUNT/$MAX_RETRIES) - sleeping" | tee -a "$LOG_FILE"
  sleep 2
done
echo "Postgres is ready." | tee -a "$LOG_FILE"

# 5. Wait for Redis
REDIS_H=${REDIS_HOST:-redis-test}
echo "Waiting for Redis at ${REDIS_H}:6379..." | tee -a "$LOG_FILE"
COUNT=0
until nc -z "$REDIS_H" 6379; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "Timeout waiting for Redis" | tee -a "$LOG_FILE"
    exit 1
  fi
  echo "Redis is unavailable (attempt $COUNT/$MAX_RETRIES) - sleeping" | tee -a "$LOG_FILE"
  sleep 2
done
echo "Redis is ready." | tee -a "$LOG_FILE"

# 6. Prisma Generate
echo "Generating Prisma Client..." | tee -a "$LOG_FILE"
npx prisma generate | tee -a "$LOG_FILE"

# 7. Construct URLs for app
export DATABASE_URL="postgresql://${PG_USER}:${POSTGRES_PASSWORD:-testpass}@${PG_HOST}:${PG_PORT}/${PG_DB}?schema=public"

if [ -n "$REDIS_PASSWORD" ]; then
  export REDIS_URL="redis://:${REDIS_PASSWORD}@${REDIS_H}:6379"
  export REDIS_QUEUE_URL="redis://:${REDIS_PASSWORD}@${REDIS_HOST:-$REDIS_H}:6379"
else
  export REDIS_URL="redis://${REDIS_H}:6379"
  export REDIS_QUEUE_URL="redis://${REDIS_HOST:-$REDIS_H}:6379"
fi

# 8. Database Migration (for test DB)
echo "Applying migrations to test database..." | tee -a "$LOG_FILE"
npx prisma migrate deploy | tee -a "$LOG_FILE"

# 9. Generate OpenAPI spec (needed for contract tests)
echo "Generating OpenAPI spec..." | tee -a "$LOG_FILE"
npm run openapi:generate | tee -a "$LOG_FILE"

# 10. Execute tests
echo "Executing tests..." | tee -a "$LOG_FILE"

# Ensure we capture Jest's exit code
set +e # Allow tests to fail without stopping the script
# Added --detectOpenHandles for debugging and --forceExit to ensure CI doesn't hang
npx jest --config jest.config.test-runner.js --runInBand --verbose --detectOpenHandles --forceExit 2>&1 | tee -a "$LOG_FILE"
TEST_EXIT_CODE=$?
set -e

echo "--- Test Runner Finished with code $TEST_EXIT_CODE ---" | tee -a "$LOG_FILE"

# Final report path info
echo "Results available in: /test-results" | tee -a "$LOG_FILE"

exit $TEST_EXIT_CODE
