#!/bin/bash
# JIFS Fleet — Start (double-click to run)

DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="$DIR/jifs.log"

# ── Check Node ────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    osascript -e 'display alert "Node.js not found" message "Please install Node.js from https://nodejs.org and try again." as critical'
    exit 1
fi

# ── Kill any existing instance ────────────────────────────────────────────
pkill -f "node.*app.js" 2>/dev/null || true
sleep 1

# ── Install backend dependencies if needed ────────────────────────────────
if [ ! -d "$DIR/backend/node_modules" ]; then
    echo "Installing backend dependencies..." | tee -a "$LOG"
    cd "$DIR/backend" && npm install >> "$LOG" 2>&1
fi

# ── Build frontend if dist is missing or stale ────────────────────────────
DIST="$DIR/frontend/dist/index.html"
SRC_NEWER=false
if [ ! -f "$DIST" ]; then
    SRC_NEWER=true
elif [ "$DIR/frontend/src" -nt "$DIST" ]; then
    SRC_NEWER=true
fi

if $SRC_NEWER; then
    echo "Building frontend..." | tee -a "$LOG"
    if [ ! -d "$DIR/frontend/node_modules" ]; then
        cd "$DIR/frontend" && npm install >> "$LOG" 2>&1
    fi
    cd "$DIR/frontend" && npm run build >> "$LOG" 2>&1
    if [ $? -ne 0 ]; then
        osascript -e 'display alert "Frontend build failed" message "Check jifs.log for details." as critical'
        exit 1
    fi
fi

# ── Start backend ─────────────────────────────────────────────────────────
echo "$(date): Starting JIFS Fleet server..." | tee -a "$LOG"
cd "$DIR/backend"
nohup node src/app.js >> "$LOG" 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID" | tee -a "$LOG"

# ── Wait for server to be ready ───────────────────────────────────────────
echo "Waiting for server to start..."
for i in {1..20}; do
    if curl -s http://localhost:3000 &>/dev/null; then
        break
    fi
    sleep 0.5
done

# ── Get LAN IP ────────────────────────────────────────────────────────────
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")

# ── Open browser ──────────────────────────────────────────────────────────
open "http://localhost:3000"

# ── Notify ────────────────────────────────────────────────────────────────
osascript -e "display notification \"JIFS Fleet is running.\\nLAN: http://$LAN_IP:3000\" with title \"JIFS Fleet Started\" sound name \"Glass\""

echo "JIFS Fleet running at http://localhost:3000 | LAN: http://$LAN_IP:3000" | tee -a "$LOG"
