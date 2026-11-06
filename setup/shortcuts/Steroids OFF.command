#!/bin/sh
# macOS: double-click in Finder (after chmod +x once) to turn Steroids OFF.
node "$HOME/.claude/steroids/toggle.js" off
printf '\nPress Enter to close... '
read -r _
