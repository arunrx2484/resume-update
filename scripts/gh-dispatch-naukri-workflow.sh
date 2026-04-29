#!/usr/bin/env bash
# Authenticate gh if needed (interactive), then trigger "Naukri Resume Update" on GitHub Actions.
#
# Usage:
#   ./scripts/gh-dispatch-naukri-workflow.sh
#   ./scripts/gh-dispatch-naukri-workflow.sh --watch    # tail the latest run
#   npm run workflow:naukri
#
# Requires: gh (brew install gh), git remote pointing at github.com, repo push access.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WORKFLOW_FILE="naukri-resume.yml"
WORKFLOW_NAME="Naukri Resume Update"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"

die() {
  echo "Error: $*" >&2
  exit 1
}

watch_latest=false
for arg in "$@"; do
  case "$arg" in
    --watch|-w) watch_latest=true ;;
    --help|-h)
      grep '^#' "$0" | head -14 | sed 's/^# \{0,1\}//'
      exit 0
      ;;
  esac
done

command -v gh >/dev/null 2>&1 || die "Install GitHub CLI: brew install gh"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "GitHub CLI is not logged in yet. Starting interactive gh auth login …"
    gh auth login || die "gh auth login failed"
  fi
else
  die "Run this script from inside the Git repository clone."
fi

echo "Authenticated as:"
gh auth status

echo ""
echo "Dispatching workflow «${WORKFLOW_NAME}» (ref=${DEFAULT_BRANCH}) …"
gh workflow run "${WORKFLOW_NAME}" --ref "${DEFAULT_BRANCH}"

sleep 4
echo ""
echo "Recent runs for ${WORKFLOW_FILE}:"
gh run list --workflow="${WORKFLOW_FILE}" --limit 6 || true

repo_url=""
repo_url="$(gh repo view --json url -q .url 2>/dev/null || true)"
run_id=""
run_id="$(gh run list --workflow="${WORKFLOW_FILE}" --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)"

if [[ -n "${run_id}" && "${run_id}" != "null" ]]; then
  echo ""
  echo "Latest run id: ${run_id}"
  echo "  gh run watch ${run_id}"
  echo "  gh run view ${run_id} --web"
  if [[ "${watch_latest}" == true ]]; then
    gh run watch "${run_id}" || true
  fi
else
  echo ""
  echo "Listing runs succeeded; newest run id not parsed yet — try again or open Actions in the repo."
fi

if [[ -n "${repo_url}" ]]; then
  echo ""
  echo "Workflow page: ${repo_url%/}/actions/workflows/${WORKFLOW_FILE}"
fi
