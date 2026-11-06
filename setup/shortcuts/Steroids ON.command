#!/bin/sh
# macOS: double-click in Finder (after chmod +x once) to turn Steroids ON.
node "$HOME/.claude/steroids/toggle.js" on
printf '\nPress Enter to close... '
read -r _
