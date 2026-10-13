#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
command -v node >/dev/null || { echo 'Install Node.js 24 LTS first.'; exit 1; }
node scripts/setup.mjs
npm ci --ignore-scripts
read -r -p 'Invite the bot using the URL above, then press Enter. ' response
npm run register
echo 'Ready. Run ./start.sh to keep the bot online.'
