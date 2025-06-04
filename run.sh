#!/usr/bin/env bash

# 1) Determine project root and local IP
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IP="$(ipconfig getifaddr en0)"
if [ -z "$IP" ]; then
  echo "Could not detect en0 IP. Make sure en0 is up."
  exit 1
fi

# 2) Update .env → SERVER_URL
ENV_FILE="$PROJECT_ROOT/.env"
[ -f "$ENV_FILE" ] || touch "$ENV_FILE"

if grep -q '^SERVER_URL=' "$ENV_FILE"; then
  # macOS sed in-place edit
  sed -i '' "s|^SERVER_URL=.*|SERVER_URL=$IP|" "$ENV_FILE"
else
  echo "SERVER_URL=$IP" >> "$ENV_FILE"
fi

# 3) Helper: open a new Terminal window and run a bash login shell
open_in_new_terminal() {
  # No need to escape quotes here if paths don’t contain spaces
  local CMD="$1"
  osascript <<EOF
tell application "Terminal"
  activate
  do script "bash -lc '$CMD'"
end tell
EOF
}

# 4) Launch each service in its own window
BACKEND_PATH="$PROJECT_ROOT/code/Backend"
open_in_new_terminal "cd '$BACKEND_PATH' && source ../VirtualEnv/bin/activate && python app.py"

ADMIN_UI_PATH="$PROJECT_ROOT/code/Backend/admin_ui"
open_in_new_terminal "cd '$ADMIN_UI_PATH' && npm install --legacy-peer-deps && npm start"

FRONTEND_PATH="$PROJECT_ROOT/code/Frontend"
open_in_new_terminal "cd '$FRONTEND_PATH' && npm install --legacy-peer-deps && npm run dev -- -c"

# 5) Print ASCII QR codes (requires qrencode)
echo
echo "QR (HTTPS):"
qrencode -t ansiutf8 "https://$IP:8081"
echo
echo "QR (EXP):"
qrencode -t ansiutf8 "exp://$IP:8081"
echo