#!/bin/bash
# Hook: check-arch-docs.sh
# Runs on Stop event. Checks if src/ files were modified and reminds Claude
# to update the corresponding architecture documentation.

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Get files changed (staged + unstaged) relative to HEAD
CHANGED=$(git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null)
[ -z "$CHANGED" ] && exit 0

# Deduplicate
CHANGED=$(echo "$CHANGED" | sort -u)

# Only care about src/ changes
SRC_CHANGES=$(echo "$CHANGED" | grep '^src/')
[ -z "$SRC_CHANGES" ] && exit 0

# Check if any architecture docs were already updated in this diff
DOCS_CHANGED=$(echo "$CHANGED" | grep '^docs/architecture/')

# Build reminder based on what changed
REMINDERS=""

# Route changes
if echo "$SRC_CHANGES" | grep -q '^src/app/'; then
  if ! echo "$DOCS_CHANGED" | grep -q '^docs/architecture/routes/'; then
    REMINDERS="${REMINDERS}\n- Route files changed in src/app/ -> update docs/architecture/routes/"
  fi
fi

# Component changes
if echo "$SRC_CHANGES" | grep -q '^src/components/'; then
  if ! echo "$DOCS_CHANGED" | grep -q '^docs/architecture/components/'; then
    REMINDERS="${REMINDERS}\n- Component files changed in src/components/ -> update docs/architecture/components/"
  fi
fi

# Service/lib changes
if echo "$SRC_CHANGES" | grep -q '^src/lib/'; then
  if ! echo "$DOCS_CHANGED" | grep -q '^docs/architecture/services/'; then
    REMINDERS="${REMINDERS}\n- Lib files changed in src/lib/ -> update docs/architecture/services/"
  fi
fi

# Type changes
if echo "$SRC_CHANGES" | grep -q '^src/types/'; then
  if ! echo "$DOCS_CHANGED" | grep -q '^docs/architecture/ARCHITECTURE.md'; then
    REMINDERS="${REMINDERS}\n- Type definitions changed -> update docs/architecture/ARCHITECTURE.md"
  fi
fi

# Store changes
if echo "$SRC_CHANGES" | grep -q '^src/stores/'; then
  if ! echo "$DOCS_CHANGED" | grep -q '^docs/architecture/'; then
    REMINDERS="${REMINDERS}\n- Store files changed in src/stores/ -> update relevant docs/architecture/ files"
  fi
fi

# Database/migration changes
if echo "$CHANGED" | grep -q 'migration'; then
  if ! echo "$DOCS_CHANGED" | grep -q '^docs/architecture/ARCHITECTURE.md'; then
    REMINDERS="${REMINDERS}\n- Migration files changed -> update Database Schema in docs/architecture/ARCHITECTURE.md"
  fi
fi

# If there are reminders, output them
if [ -n "$REMINDERS" ]; then
  echo "ARCHITECTURE DOCS UPDATE NEEDED:"
  echo -e "The following src/ files were modified but their corresponding architecture docs were not updated:${REMINDERS}"
  echo ""
  echo "Please update the architecture documentation to reflect these code changes before considering the task complete."
fi

exit 0
