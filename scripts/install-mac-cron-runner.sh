#!/usr/bin/env bash
# One-time: copy scheduler out of ~/Documents so macOS cron can execute it (otherwise "Operation not permitted").
set -euo pipefail
DEST="${1:-$HOME/Library/Application Support/naukri-resume-scheduler}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$DEST"
cp "$SCRIPT_DIR/run-naukri-scheduled.sh" "$DEST/run-naukri-scheduled.sh"
chmod +x "$DEST/run-naukri-scheduled.sh"
echo "Installed: $DEST/run-naukri-scheduled.sh"
echo "Point crontab at this path (escape spaces in Application\\\\ Support), not the copy under Documents."
