#!/bin/bash
# JIFS Fleet — Reset to factory fresh (wipes all data)

DIR="$(cd "$(dirname "$0")" && pwd)"
DB="$DIR/backend/data/fleet.db"

# Confirm before wiping
ANSWER=$(osascript -e 'button returned of (display dialog "This will DELETE all vehicles, expenses, suppliers, and users — the system will be completely empty and ready for first-time setup.\n\nAre you absolutely sure?" buttons {"Cancel", "Yes, Reset Everything"} default button "Cancel" with icon caution)')

if [ "$ANSWER" != "Yes, Reset Everything" ]; then
    exit 0
fi

# Stop any running server
pkill -f "node.*app.js" 2>/dev/null || true
sleep 1

# Delete the database
rm -f "$DB"

osascript -e 'display notification "System reset complete. Start the system and create a new Admin account." with title "JIFS Fleet Reset" sound name "Glass"'
echo "Reset complete. Run start-jifs.command to start fresh."
