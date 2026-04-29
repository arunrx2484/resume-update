#!/usr/bin/env bash
# Log before strict mode: cron can fail `cd` or env setup and exit with no other trace.
PROJECT_DIR="/Users/arunkumarbalkutty/Documents/salesforce-cpq-bdd/resume update"
HEARTBEAT_LOG="$PROJECT_DIR/reports/logs/cron-heartbeat.log"
TMP_HEARTBEAT_LOG="/tmp/naukri-cron-heartbeat.log"
log_heartbeat() {
  local msg="$1"
  echo "$msg" >> "$TMP_HEARTBEAT_LOG" 2>/dev/null || true
  echo "$msg" >> "$HEARTBEAT_LOG" 2>/dev/null || true
}
mkdir -p "$PROJECT_DIR/reports/logs" || true
log_heartbeat "[$(date)] cron invoked user=$(whoami) uid=$(id -u) shell=$0"
log_heartbeat "[$(date)] pre-cd PWD=$PWD"

set -euo pipefail

SECRETS_FILE="$PROJECT_DIR/config/env/naukri-secrets.env"
LOG_DIR="$PROJECT_DIR/reports/logs"
NODE20_BIN="$PROJECT_DIR/node_modules/.bin/node"
RUN_LOG="$LOG_DIR/scheduler.log"

mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR" || {
  log_heartbeat "[$(date)] ERROR: cd to PROJECT_DIR failed: $PROJECT_DIR"
  exit 1
}
log_heartbeat "[$(date)] post-cd OK PWD=$(pwd)"

# Cron has a minimal environment; set stable defaults explicitly.
export HOME="/Users/arunkumarbalkutty"
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NPM_CONFIG_CACHE="$PROJECT_DIR/.npm-cache"
# IDE/agent sandboxes point here without a full browser install — use OS default (~Library/Caches/ms-playwright).
unset PLAYWRIGHT_BROWSERS_PATH
mkdir -p "$NPM_CONFIG_CACHE"

if [ -f "$SECRETS_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
  set +a
else
  echo "[$(date)] Missing secrets file: $SECRETS_FILE" >> "$RUN_LOG"
  exit 1
fi

ENV=${ENV:-qa}
BROWSER=${BROWSER:-chromium}
HEADLESS=${HEADLESS:-false}

if [ ! -x "$NODE20_BIN" ]; then
  echo "[$(date)] Node 20 binary not found at $NODE20_BIN. Run: npm install" >> "$RUN_LOG"
  exit 1
fi

echo "[$(date)] Starting scheduled Naukri run" >> "$RUN_LOG"
ENV="$ENV" BROWSER="$BROWSER" HEADLESS="$HEADLESS" \
NAUKRI_USER="$NAUKRI_USER" NAUKRI_PASS="$NAUKRI_PASS" RESUME_PATH="$RESUME_PATH" \
"$NODE20_BIN" node_modules/.bin/cucumber-js --tags "@naukri and @resume" \
  >> "$RUN_LOG" 2>&1

echo "[$(date)] Scheduled run completed" >> "$RUN_LOG"
