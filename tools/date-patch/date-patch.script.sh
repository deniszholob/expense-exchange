#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "$SCRIPT_DIRECTORY/../.." && pwd)"
cd "$REPOSITORY_ROOT"
exec node --experimental-strip-types "$SCRIPT_DIRECTORY/date-patch.script.ts" "$@"
