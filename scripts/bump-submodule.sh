#!/usr/bin/env bash
# Bump a (possibly nested) submodule pointer up the chain to the meta-repo.
#
# After you commit AND push changes inside a submodule, run this from the meta-repo
# to record the new pointer at every parent level and push each one:
#
#   pnpm submodule:bump ai/agents     # nested: agents → ai umbrella → meta
#   pnpm submodule:bump apps/web      # flat:   web → meta
#
# It walks from the leaf up to the meta-repo. At each real submodule boundary it
# checks out the branch, stages the child pointer, and commits + pushes if it moved.
# This script does NOT push the leaf's own changes — commit and push those first.
set -euo pipefail

LEAF="${1:-}"
BRANCH="${2:-main}"

if [[ -z "$LEAF" ]]; then
  echo "Usage: pnpm submodule:bump <submodule-path> [branch]" >&2
  echo "  e.g. pnpm submodule:bump ai/agents" >&2
  exit 1
fi

ROOT="$(git rev-parse --show-toplevel)"
LEAF="${LEAF%/}" # strip any trailing slash

if [[ ! -e "$ROOT/$LEAF" ]]; then
  echo "Error: '$LEAF' not found. Run 'git submodule update --init --recursive' first." >&2
  exit 1
fi

current="$LEAF"
while true; do
  current_abs="$ROOT/$current"
  # The parent repo is the git toplevel that owns the directory containing `current`.
  # For a nested submodule that's the umbrella repo; for a flat one it's the meta-repo.
  parent_fs="$(git -C "$(dirname "$current_abs")" rev-parse --show-toplevel)"
  child_rel="${current_abs#"$parent_fs"/}"

  pretty_parent="${parent_fs#"$ROOT"}"
  pretty_parent="${pretty_parent#/}"
  [[ -z "$pretty_parent" ]] && pretty_parent="(meta-repo)"
  echo "→ Bumping '$child_rel' in '$pretty_parent'"

  (
    cd "$parent_fs"
    # Submodules are usually checked out in detached HEAD — move onto the branch.
    git checkout -q "$BRANCH"
    git add "$child_rel"
    if git diff --cached --quiet -- "$child_rel"; then
      echo "  (no pointer change)"
    else
      sha="$(git -C "$child_rel" rev-parse --short HEAD)"
      git commit -q -m "chore($(basename "$child_rel")): Bump $(basename "$child_rel") submodule to $sha"
      git push -q origin "$BRANCH"
      echo "  ✓ committed and pushed ($child_rel → $sha)"
    fi
  )

  # Stop once we've committed in the meta-repo itself.
  [[ "$parent_fs" == "$ROOT" ]] && break
  current="${parent_fs#"$ROOT"/}"
done

echo "✓ Done. The meta-repo now points at the latest $LEAF."
