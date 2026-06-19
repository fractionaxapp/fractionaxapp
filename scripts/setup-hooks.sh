#!/usr/bin/env bash
# Enable the version-controlled git hooks (.githooks/) in the meta-repo and every
# initialized submodule. Run once after cloning (the meta `setup` script calls it).
# core.hooksPath is local config and is NOT carried by clone, hence this helper.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"

enable() {
  local dir="$1"
  if [[ -f "$dir/.githooks/commit-msg" ]]; then
    git -C "$dir" config core.hooksPath .githooks
    echo "  ✓ ${dir#"$ROOT"/}"
  fi
}

echo "Enabling git hooks…"
enable "$ROOT"
git -C "$ROOT" submodule status --recursive 2>/dev/null | awk '{print $2}' | while read -r sm; do
  enable "$ROOT/$sm"
done
echo "✓ Commit-message validation is now active."
