#!/bin/bash
# JIFS Fleet — Backup database (double-click to run)

DIR="$(cd "$(dirname "$0")" && pwd)"
DB="$DIR/backend/data/fleet.db"
BACKUP_DIR="$HOME/Desktop/JIFS-Backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
DEST="$BACKUP_DIR/fleet_$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB" ]; then
    osascript -e 'display alert "Database not found" message "No fleet.db file found. Has the server been started at least once?" as critical'
    exit 1
fi

cp "$DB" "$DEST"

if [ $? -eq 0 ]; then
    osascript -e "display notification \"Saved to: JIFS-Backups/fleet_$TIMESTAMP.db\" with title \"Backup Complete\" sound name \"Glass\""
    # Keep only last 30 backups
    ls -t "$BACKUP_DIR"/fleet_*.db 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null
    open "$BACKUP_DIR"
else
    osascript -e 'display alert "Backup failed" message "Could not copy the database file." as critical'
fi
