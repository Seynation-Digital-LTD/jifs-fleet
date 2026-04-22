#!/bin/bash
# JIFS Fleet — daemon wrapper (called by LaunchAgent)
# Builds frontend if needed, then runs the backend in the foreground.

DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="$DIR/jifs.log"

echo "$(date): jifs-daemon starting" >> "$LOG"

# Ensure PATH includes nvm / homebrew Node
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | sort -V | tail -1)/bin:$PATH"

if ! command -v node &>/dev/null; then
    echo "$(date): node not found in PATH=$PATH" >> "$LOG"
    exit 1
fi

# Install backend deps if needed
if [ ! -d "$DIR/backend/node_modules" ]; then
    echo "$(date): installing backend deps" >> "$LOG"
    cd "$DIR/backend" && npm install >> "$LOG" 2>&1
fi

# Build frontend if dist is missing
if [ ! -f "$DIR/frontend/dist/index.html" ]; then
    echo "$(date): building frontend" >> "$LOG"
    if [ ! -d "$DIR/frontend/node_modules" ]; then
        cd "$DIR/frontend" && npm install >> "$LOG" 2>&1
    fi
    cd "$DIR/frontend" && npm run build >> "$LOG" 2>&1
fi

echo "$(date): starting backend" >> "$LOG"
cd "$DIR/backend"
exec node src/app.js >> "$LOG" 2>&1
