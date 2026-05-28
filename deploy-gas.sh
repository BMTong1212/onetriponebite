#!/bin/bash
CLASP=clasp
DEPLOYMENT_ID="AKfycbzLpOS-rfBF0luOIRBs4z8KyffbG5CWwGljEbv7wrSjH0MalcLzLdSmoD7Cbxd_UG-9"
VERSION="${1:-latest}"

echo "→ Pushing code..."
$CLASP push --force || exit 1

echo "→ Deploying $VERSION..."
$CLASP deploy --deploymentId "$DEPLOYMENT_ID" --description "$VERSION" || exit 1

echo "✓ Done: https://script.google.com/macros/s/$DEPLOYMENT_ID/exec"
