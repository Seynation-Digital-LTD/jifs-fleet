# Creating a Double-Click App for JIFS Fleet

This guide explains how to create a nice macOS app icon that launches JIFS Fleet with a single double-click.

---

## Option A — Automator Application (Recommended)

1. Open **Automator** (Spotlight → "Automator")
2. Choose **New Document → Application**
3. In the search bar type **"Run Shell Script"** and double-click it
4. Paste this into the script box:

```bash
/bin/bash "/Users/sey/Desktop/jifs-fleet/start-jifs.command"
```

5. Go to **File → Save** and save as **"JIFS Fleet"** on the Desktop
6. To give it a custom icon:
   - Find a truck or fleet icon image (PNG, 512×512)
   - Open the image in Preview → Edit → Select All → Copy
   - Right-click **JIFS Fleet.app** → Get Info
   - Click the icon thumbnail in the top-left of the Get Info window
   - Press **⌘V** to paste the new icon

---

## Option B — Shell Script Alias

Add this to your `~/.zshrc` or `~/.bash_profile`:

```bash
alias jifs='bash ~/Desktop/jifs-fleet/start-jifs.command'
alias jifs-stop='bash ~/Desktop/jifs-fleet/stop-jifs.command'
alias jifs-backup='bash ~/Desktop/jifs-fleet/backup-jifs.command'
```

Then reload: `source ~/.zshrc`

---

## Auto-Start at Login

Double-click **install-autostart.command** once.  
JIFS Fleet will start automatically every time the Mac turns on — no manual launch needed.

To uninstall auto-start:
```bash
launchctl unload ~/Library/LaunchAgents/com.jifs.fleet.plist
rm ~/Library/LaunchAgents/com.jifs.fleet.plist
```

---

## Accessing from Other Computers on the Network

1. Find the Mac's IP address: **System Settings → Wi-Fi / Network → Details**  
   (or run `ipconfig getifaddr en0` in Terminal)
2. On any computer on the same network, open a browser and go to:  
   `http://[mac-ip-address]:3000`

---

## Files Summary

| File | Purpose |
|------|---------|
| `start-jifs.command` | Start the server + open browser |
| `stop-jifs.command` | Stop the server |
| `backup-jifs.command` | Copy database to ~/Desktop/JIFS-Backups |
| `install-autostart.command` | Register auto-start at login |
| `jifs-daemon.sh` | Internal script used by auto-start |
| `com.jifs.fleet.plist` | LaunchAgent configuration |
| `jifs.log` | Server log (created on first run) |
