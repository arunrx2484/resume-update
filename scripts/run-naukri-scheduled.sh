#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/Users/arunkumarbalkutty/Documents/salesforce-cpq-bdd/resume update"
SECRETS_FILE="$PROJECT_DIR/config/env/naukri-secrets.env"
LOG_DIR="$PROJECT_DIR/reports/logs"
NODE20_BIN="$PROJECT_DIR/node_modules/.bin/node"
RUN_LOG="$LOG_DIR/scheduler.log"

mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR"

# Cron has a minimal environment; set stable defaults explicitly.
export HOME="/Users/arunkumarbalkutty"
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NPM_CONFIG_CACHE="$PROJECT_DIR/.npm-cache"
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
