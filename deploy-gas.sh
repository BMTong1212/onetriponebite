#!/bin/bash
CLASP=clasp
DEPLOYMENT_ID="AKfycbwaNGURto97SUbYk6tXUCndsiuglGsjIU1mKFF6Iz3sn_xUkBluwrUMCpUyg_NRPnNm"
VERSION="${1:-latest}"

echo "→ Pushing code..."
$CLASP push --force || exit 1

echo "→ Deploying $VERSION..."
$CLASP deploy --deploymentId "$DEPLOYMENT_ID" --description "$VERSION" || exit 1

echo "✓ Done: https://script.google.com/macros/s/$DEPLOYMENT_ID/exec"
