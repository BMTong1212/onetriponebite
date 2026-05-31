#!/bin/bash
CLASP="npx @google/clasp"
DEPLOYMENT_ID="AKfycbw-aHSJi-t1mxF-nSGO3tQqoTcIQLh060hVA6pUCof9sQmby0abzjFjy89DE9J0tOU"
VERSION="${1:-latest}"

# Sync Code.gs to gas/Code.js and other copies before pushing
if [ -f "Code.gs" ]; then
  echo "→ Syncing Code.gs to gas/Code.js..."
  cp Code.gs gas/Code.js
  cp Code.gs GAS_CODE.js
  cp Code.gs gas-script.js
fi

echo "→ Pushing code..."
$CLASP push --force || exit 1

echo "→ Deploying $VERSION..."
$CLASP deploy --deploymentId "$DEPLOYMENT_ID" --description "$VERSION" || exit 1

echo "✓ Done: https://script.google.com/macros/s/$DEPLOYMENT_ID/exec"
