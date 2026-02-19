#!/bin/sh

# Ensure output directory exists
mkdir -p /test-results

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="/test-results/test-run-${TIMESTAMP}.log"

echo "--- Starting Test Runner Setup ---" | tee -a "$LOG_FILE"

# 1. Install necessary system dependencies for alpine
echo "Installing system dependencies..." | tee -a "$LOG_FILE"
apk add --no-cache netcat-openbsd postgresql-client | tee -a "$LOG_FILE"

# 2. Install devDependencies
echo "Installing node dependencies..." | tee -a "$LOG_FILE"
npm ci --include=dev | tee -a "$LOG_FILE"

# 3. Wait for Postgres
echo "Waiting for Postgres at ${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432}..." | tee -a "$LOG_FILE"
until pg_isready -h ${POSTGRES_HOST:-postgres} -p ${POSTGRES_PORT:-5432} -U ${POSTGRES_USER}; do
  echo "Postgres is unavailable - sleeping" | tee -a "$LOG_FILE"
  sleep 2
done

# 4. Wait for Redis (Cache)
echo "Waiting for Redis Cache at ${REDIS_HOST:-redis_cache}:6379..." | tee -a "$LOG_FILE"
until nc -z ${REDIS_HOST:-redis_cache} 6379; do
  echo "Redis Cache is unavailable - sleeping" | tee -a "$LOG_FILE"
  sleep 2
done

# 5. Wait for Redis (Queue)
echo "Waiting for Redis Queue at ${REDIS_QUEUE_HOST:-redis_queue}:6379..." | tee -a "$LOG_FILE"
until nc -z ${REDIS_QUEUE_HOST:-redis_queue} 6379; do
  echo "Redis Queue is unavailable - sleeping" | tee -a "$LOG_FILE"
  sleep 2
done

# 6. Prisma Generate
echo "Generating Prisma Client..." | tee -a "$LOG_FILE"
npx prisma generate | tee -a "$LOG_FILE"

# 7. Generate OpenAPI spec
echo "Generating OpenAPI spec..." | tee -a "$LOG_FILE"
npm run openapi:generate | tee -a "$LOG_FILE"

# 8. Construct DATABASE_URL from components (ensures internal container networking)
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}?schema=public"

# 9. Execute tests and capture output while preserving exit code
echo "Executing tests..." | tee -a "$LOG_FILE"

# We use a temporary file to capture output and preserve exit status in POSIX sh
NODE_ENV=production \
SANDBOX_MODE=true \
ALLOW_PROD_WRITES=false \
npx jest --config jest.config.test-runner.js --runInBand --verbose > /tmp/jest_output 2>&1

TEST_EXIT_CODE=$?

# Stream the captured output to console and log file
cat /tmp/jest_output | tee -a "$LOG_FILE"

echo "--- Test Runner Finished with code $TEST_EXIT_CODE ---" | tee -a "$LOG_FILE"

exit $TEST_EXIT_CODE
