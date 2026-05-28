#!/bin/bash
CLASP="npx @google/clasp"
DEPLOYMENT_ID="AKfycbw-aHSJi-t1mxF-nSGO3tQqoTcIQLh060hVA6pUCof9sQmby0abzjFjy89DE9J0tOU"
VERSION="${1:-latest}"

echo "→ Pushing code..."
$CLASP push --force || exit 1

echo "→ Deploying $VERSION..."
$CLASP deploy --deploymentId "$DEPLOYMENT_ID" --description "$VERSION" || exit 1

echo "✓ Done: https://script.google.com/macros/s/$DEPLOYMENT_ID/exec"
