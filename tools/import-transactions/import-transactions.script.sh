#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

if ! command -v node >/dev/null 2>&1 && [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
  # Load the user's configured Node version when a non-login shell omits it from PATH.
  source "${HOME}/.nvm/nvm.sh"
  nvm use --silent default >/dev/null
fi

if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js >=22.22.3 is required. Install or activate Node.js, then rerun this script.' >&2
  exit 127
fi

node --experimental-transform-types tools/import-transactions/import-transactions.script.ts "$@"
