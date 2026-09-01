#!/bin/bash
#
# Install (or reinstall) the two LaunchAgents for the daily edition.
#
#   bash packages/runner/aibytes_runner/launchd/install.sh
#   bash packages/runner/aibytes_runner/launchd/install.sh --uninstall
#
# The plists carry absolute paths - to this checkout, to this interpreter - so
# they are rendered here rather than committed filled in. Re-run this after
# moving the repo or changing python.
#
# These are LaunchAgents, not LaunchDaemons, on purpose: an agent runs inside
# the logged-in GUI session, which is what gives it an unlocked login keychain
# and therefore working Claude Code credentials. A daemon has no session and
# would have to fall back to an API key.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
AGENTS="$HOME/Library/LaunchAgents"
LABELS=(io.aibytes.edition io.aibytes.watchdog)
DOMAIN="gui/$(id -u)"

uninstall() {
  for label in "${LABELS[@]}"; do
    launchctl bootout "$DOMAIN/$label" 2>/dev/null || true
    rm -f "$AGENTS/$label.plist"
    echo "removed $label"
  done
}

if [[ "${1:-}" == "--uninstall" ]]; then
  uninstall
  exit 0
fi

PYTHON="$(command -v python3)"
if [[ -z "$PYTHON" ]]; then
  echo "error: no python3 on PATH" >&2
  exit 1
fi

CLAUDE="$(command -v claude || true)"
if [[ -z "$CLAUDE" ]]; then
  echo "error: no claude on PATH; the summaries step needs it" >&2
  exit 1
fi

# Everything the job needs, spelled out: launchd gives a job a bare PATH and
# does not read a shell profile.
JOB_PATH="$(dirname "$CLAUDE"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$AGENTS" "$REPO/logs"

for label in "${LABELS[@]}"; do
  template="$HERE/$label.plist.template"
  target="$AGENTS/$label.plist"
  sed -e "s|__PYTHON__|$PYTHON|g" \
      -e "s|__REPO__|$REPO|g" \
      -e "s|__PATH__|$JOB_PATH|g" \
      -e "s|__HOME__|$HOME|g" \
      "$template" > "$target"
  plutil -lint "$target" > /dev/null
  launchctl bootout "$DOMAIN/$label" 2>/dev/null || true
  launchctl bootstrap "$DOMAIN" "$target"
  echo "installed $label"
done

echo
echo "repo:   $REPO"
echo "python: $PYTHON"
echo "claude: $CLAUDE"
echo
echo "edition  13:30 daily"
echo "watchdog 14:30 daily"
echo
echo "check:      launchctl list | grep io.aibytes"
echo "run now:    launchctl kickstart -p $DOMAIN/io.aibytes.edition"
echo "uninstall:  bash ${BASH_SOURCE[0]} --uninstall"

if [[ ! -f "$REPO/.env" ]] || ! grep -q '^AIBYTES_SLACK_WEBHOOK=' "$REPO/.env" 2>/dev/null; then
  echo
  echo "warning: AIBYTES_SLACK_WEBHOOK is not in $REPO/.env"
  echo "         the job will still run, but it will report to nobody."
fi
