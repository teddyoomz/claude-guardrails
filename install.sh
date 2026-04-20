#!/usr/bin/env bash
# install.sh — copy claude-guardrails templates into your project
#
# Usage:
#   ./install.sh /path/to/your-project
#   ./install.sh .   # install into current directory
#
# What it copies:
#   - .claude/rules/         → iron-clad rule templates (00-04)
#   - .claude/skills/        → audit skill examples + _template
#   - .claude/hooks/         → PostToolUse grep-pair verifier
#   - .agents/               → trust priority + active + sessions scaffold
#   - docs/                  → methodology + cross-session + triangle-rule + ...
#   - CLAUDE.md              → project root quick-index (if not already exists)
#   - SESSION_HANDOFF.md     → cross-session state of truth (if not already exists)
#
# What it does NOT do:
#   - Does not overwrite existing files (safe to re-run)
#   - Does not fill in [FILL-IN] placeholders — you do that yourself per
#     `docs/methodology.md`
#   - Does not install any runtime (zero dependencies, just markdown + shell)

set -euo pipefail

TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  echo "Usage: $0 /path/to/your-project"
  echo "       $0 .   (install into current directory)"
  exit 1
fi

if [ ! -d "$TARGET" ]; then
  echo "Error: target directory $TARGET does not exist"
  exit 1
fi

TARGET="$(cd "$TARGET" && pwd)"
SRC="$(cd "$(dirname "$0")" && pwd)"

echo "Installing claude-guardrails from $SRC to $TARGET"
echo ""

copy_if_not_exists() {
  local src_path="$1"
  local dst_path="$2"

  if [ -e "$dst_path" ]; then
    echo "  SKIP (exists): $dst_path"
    return
  fi

  mkdir -p "$(dirname "$dst_path")"
  cp -R "$src_path" "$dst_path"
  echo "  COPY: $dst_path"
}

# .claude/ subdirs
for sub in rules skills hooks; do
  src_dir="$SRC/.claude/$sub"
  if [ -d "$src_dir" ]; then
    for item in "$src_dir"/*; do
      name="$(basename "$item")"
      copy_if_not_exists "$item" "$TARGET/.claude/$sub/$name"
    done
  fi
done

# .claude/ root templates (settings.template.json — copy as template only)
copy_if_not_exists "$SRC/.claude/settings.template.json" "$TARGET/.claude/settings.template.json"

# .agents/
for item in "$SRC/.agents"/*; do
  name="$(basename "$item")"
  copy_if_not_exists "$item" "$TARGET/.agents/$name"
done

# docs/
for item in "$SRC/docs"/*; do
  name="$(basename "$item")"
  copy_if_not_exists "$item" "$TARGET/docs/$name"
done

# Root templates (don't overwrite)
copy_if_not_exists "$SRC/CLAUDE.md" "$TARGET/CLAUDE.md"
copy_if_not_exists "$SRC/SESSION_HANDOFF.md" "$TARGET/SESSION_HANDOFF.md"

# Make the hook executable
if [ -f "$TARGET/.claude/hooks/PostToolUse-edit-verify.sh" ]; then
  chmod +x "$TARGET/.claude/hooks/PostToolUse-edit-verify.sh"
fi

echo ""
echo "✅ Install complete."
echo ""
echo "Next steps:"
echo "  1. Fill in [FILL-IN] placeholders in:"
echo "     - CLAUDE.md (stack + env + deploy command)"
echo "     - .claude/rules/00-session-start.md (character + expectations)"
echo "     - .claude/rules/01-iron-clad.md (rules B, E, H per your stack)"
echo "     - .claude/rules/02-workflow.md (test + build + deploy commands)"
echo "     - .claude/rules/03-stack.md (stack-specific gotchas)"
echo "     - .claude/rules/04-culture.md (domain / cultural rules)"
echo ""
echo "  2. Enable hooks (strongly recommended — makes rules self-enforcing):"
echo "     Copy .claude/settings.template.json → .claude/settings.json"
echo "     Fill in [FILL-IN] placeholders. The template has 4 hook types:"
echo "       PostToolUse  — pre-commit checklist after every Edit/Write"
echo "       PreToolUse   — deploy guard (block backend-only files from prod deploy)"
echo "       SessionStart — mandatory first-read reminder on new chat"
echo "       UserPromptSubmit — iron-clad rules injected every turn"
echo "     Without hooks, rules are voluntary. With hooks, they fire automatically."
echo ""
echo "  3. Read docs/methodology.md — this is the core reference."
echo ""
echo "  4. Start your next Claude session by reading CLAUDE.md first."
