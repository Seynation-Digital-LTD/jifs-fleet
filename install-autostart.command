#!/bin/bash
# JIFS Fleet — Install auto-start at login (double-click to run)

DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_SRC="$DIR/com.jifs.fleet.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.jifs.fleet.plist"

# Substitute actual directory path into the plist
sed "s|JIFS_DIR|$DIR|g" "$PLIST_SRC" > "$PLIST_DEST"

# Unload if already loaded (ignore errors)
launchctl unload "$PLIST_DEST" 2>/dev/null || true

# Load the agent
launchctl load "$PLIST_DEST"

if [ $? -eq 0 ]; then
    osascript -e 'display notification "JIFS Fleet will now start automatically at login." with title "Auto-Start Installed" sound name "Glass"'
    echo "LaunchAgent installed at $PLIST_DEST"
else
    osascript -e 'display alert "Auto-Start Install Failed" message "Could not register the LaunchAgent. Check Console.app for details." as critical'
fi
