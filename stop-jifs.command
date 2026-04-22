#!/bin/bash
# JIFS Fleet — Stop (double-click to run)

pkill -f "node.*app.js" 2>/dev/null && \
    osascript -e 'display notification "JIFS Fleet server has been stopped." with title "JIFS Fleet Stopped" sound name "Funk"' || \
    osascript -e 'display notification "JIFS Fleet was not running." with title "JIFS Fleet"'
