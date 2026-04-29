#!/usr/bin/env bash
# Scheduled Naukri run. macOS cron often cannot write under ~/Documents (TCC); primary logs/artifacts
# go to ~/Library/Logs/naukri-resume-scheduler/ so the job can complete and leave evidence.

export HOME="${HOME:-/Users/arunkumarbalkutty}"
PROJECT_DIR="/Users/arunkumarbalkutty/Documents/salesforce-cpq-bdd/resume update"

# Primary log root (not under Documents — reliable for cron)
LOG_ROOT="${NAUKRI_SCHEDULER_LOG_ROOT:-$HOME/Library/Logs/naukri-resume-scheduler}"
TMP_HEARTBEAT_LOG="/tmp/naukri-cron-heartbeat.log"
PROJECT_LOG_DIR="$PROJECT_DIR/reports/logs"

log_heartbeat() {
  local msg="$1"
  echo "$msg" >> "$TMP_HEARTBEAT_LOG" 2>/dev/null || true
  mkdir -p "$LOG_ROOT" 2>/dev/null || true
  echo "$msg" >> "$LOG_ROOT/cron-heartbeat.log" 2>/dev/null || true
  mkdir -p "$PROJECT_LOG_DIR" 2>/dev/null || true
  echo "$msg" >> "$PROJECT_LOG_DIR/cron-heartbeat.log" 2>/dev/null || true
}

# Must succeed or we have nowhere to log failures
if ! mkdir -p "$LOG_ROOT" 2>/dev/null; then
  echo "[$(date)] FATAL: cannot create LOG_ROOT=$LOG_ROOT" >> "$TMP_HEARTBEAT_LOG"
  exit 1
fi

RUN_LOG="$LOG_ROOT/scheduler.log"

log_heartbeat "[$(date)] cron invoked user=$(whoami) uid=$(id -u) shell=$0"
log_heartbeat "[$(date)] pre-cd PWD=$PWD LOG_ROOT=$LOG_ROOT"

set -euo pipefail

SECRETS_FILE=""
if [ -n "${NAUKRI_SECRETS_FILE:-}" ] && [ -f "${NAUKRI_SECRETS_FILE}" ]; then
  SECRETS_FILE="$NAUKRI_SECRETS_FILE"
elif [ -f "$PROJECT_DIR/config/env/naukri-secrets.env" ]; then
  SECRETS_FILE="$PROJECT_DIR/config/env/naukri-secrets.env"
elif [ -f "$HOME/.config/naukri/naukri-secrets.env" ]; then
  SECRETS_FILE="$HOME/.config/naukri/naukri-secrets.env"
fi

NODE20_BIN="$PROJECT_DIR/node_modules/.bin/node"

mkdir -p "$PROJECT_LOG_DIR" || true

cd "$PROJECT_DIR" || {
  log_heartbeat "[$(date)] ERROR: cd to PROJECT_DIR failed: $PROJECT_DIR"
  echo "[$(date)] ERROR: cd to PROJECT_DIR failed: $PROJECT_DIR" >> "$RUN_LOG"
  exit 1
}
log_heartbeat "[$(date)] post-cd OK PWD=$(pwd)"

# Cron has a minimal environment; stable PATH (Homebrew on Apple Silicon)
export PATH="${HOME}/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NPM_CONFIG_CACHE="$PROJECT_DIR/.npm-cache"
unset PLAYWRIGHT_BROWSERS_PATH

# Cucumber HTML JSON + Winston logs + screenshots: outside Documents when cron blocks TCC
export CUCUMBER_REPORT_DIR="${CUCUMBER_REPORT_DIR:-$LOG_ROOT/cucumber-html-report}"
export FRAMEWORK_ARTIFACTS_ROOT="${FRAMEWORK_ARTIFACTS_ROOT:-$LOG_ROOT/framework-artifacts}"

mkdir -p "$NPM_CONFIG_CACHE" "$CUCUMBER_REPORT_DIR" "${FRAMEWORK_ARTIFACTS_ROOT}/logs" "${FRAMEWORK_ARTIFACTS_ROOT}/screenshots" || true

if [ -z "$SECRETS_FILE" ] || [ ! -f "$SECRETS_FILE" ]; then
  {
    echo "[$(date)] Missing secrets file."
    echo "Set NAUKRI_SECRETS_FILE, or place secrets at:"
    echo "  - $PROJECT_DIR/config/env/naukri-secrets.env"
    echo "  - $HOME/.config/naukri/naukri-secrets.env"
  } >> "$RUN_LOG"
  log_heartbeat "[$(date)] ERROR: missing naukri-secrets.env (see $RUN_LOG)"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$SECRETS_FILE"
set +a

ENV=${ENV:-qa}
BROWSER=${BROWSER:-chromium}
HEADLESS=${HEADLESS:-false}

if [ ! -x "$NODE20_BIN" ]; then
  echo "[$(date)] Node binary not found at $NODE20_BIN. Run: npm install" >> "$RUN_LOG"
  log_heartbeat "[$(date)] ERROR: node missing at NODE20_BIN"
  exit 1
fi

{
  echo "[$(date)] Starting scheduled Naukri run"
  echo "[$(date)] Using SECRETS_FILE=$SECRETS_FILE"
  echo "[$(date)] LOG_ROOT=$LOG_ROOT RUN_LOG=$RUN_LOG"
  echo "[$(date)] CUCUMBER_REPORT_DIR=$CUCUMBER_REPORT_DIR FRAMEWORK_ARTIFACTS_ROOT=$FRAMEWORK_ARTIFACTS_ROOT"
} >> "$RUN_LOG"

set +e
ENV="$ENV" BROWSER="$BROWSER" HEADLESS="$HEADLESS" \
NAUKRI_USER="$NAUKRI_USER" NAUKRI_PASS="$NAUKRI_PASS" RESUME_PATH="$RESUME_PATH" \
"$NODE20_BIN" node_modules/.bin/cucumber-js --tags "@naukri and @resume" \
  >> "$RUN_LOG" 2>&1
CUC_EXIT=$?
set -e

# HTML report (same env as Cucumber JSON path)
"$NODE20_BIN" scripts/generate-report.js >> "$RUN_LOG" 2>&1 || true

{
  echo "[$(date)] cucumber-js exit=$CUC_EXIT"
  echo "[$(date)] Scheduled run finished (report generated best-effort). HTML: ${CUCUMBER_REPORT_DIR}/index.html"
} >> "$RUN_LOG"

exit "$CUC_EXIT"
