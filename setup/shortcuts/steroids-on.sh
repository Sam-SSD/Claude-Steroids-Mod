#!/bin/sh
# Turn Steroids ON. macOS / Linux. Make it executable once: chmod +x steroids-on.sh
node "$HOME/.claude/steroids/toggle.js" on
printf '\nPress Enter to close... '
read -r _
