#!/bin/zsh
# メニューバーアプリをコンパイルしてログイン時に起動する。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NODE="$(command -v node)"
if [[ -z "${NODE}" ]]; then
  echo "node が見つかりません" >&2
  exit 1
fi

DEST="${HOME}/Library/Application Support/UniterzGlance"
AGENTS="${HOME}/Library/LaunchAgents"
PLIST="${AGENTS}/app.uniterz.glance.plist"
LABEL="app.uniterz.glance"
UID_NUM="$(id -u)"

mkdir -p "${DEST}" "${AGENTS}"
launchctl bootout "gui/${UID_NUM}/${LABEL}" >/dev/null 2>&1 || true
swiftc -O -o "${DEST}/UniterzGlance" "${ROOT}/tools/mac-glance/main.swift"

cat > "${PLIST}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${DEST}/UniterzGlance</string>
    <string>--root</string>
    <string>${ROOT}</string>
    <string>--node</string>
    <string>${NODE}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key>
    <false/>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap "gui/${UID_NUM}" "${PLIST}"
launchctl enable "gui/${UID_NUM}/${LABEL}" >/dev/null 2>&1 || true
launchctl kickstart -k "gui/${UID_NUM}/${LABEL}"
echo "デスクトップに出しました"
