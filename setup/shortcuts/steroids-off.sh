#!/bin/sh
# Turn Steroids OFF. macOS / Linux. Make it executable once: chmod +x steroids-off.sh
node "$HOME/.claude/steroids/toggle.js" off
printf '\nPress Enter to close... '
read -r _
