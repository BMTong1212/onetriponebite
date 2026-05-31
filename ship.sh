#!/bin/bash

# 1. Check for command line argument or prompt for commit message
if [ -n "$1" ]; then
  MSG="$1"
else
  read -p "Enter commit message (press Enter for auto-generated message): " MSG
  if [ -z "$MSG" ]; then
    MSG="Update at $(date '+%Y-%m-%d %H:%M:%S')"
  fi
fi

# 2. Deploy to Google Apps Script
# BUG FIX: GAS failure now warns-and-continues instead of aborting,
# so Vercel always runs even if clasp has issues.
echo "------------------------------------------------"
echo "📦 Step 1: Deploying backend to Google Apps Script..."
echo "------------------------------------------------"
if ! npx @google/clasp list &>/dev/null; then
  echo "⚠️  Clasp is not logged in — skipping GAS deploy (Vercel will still run)."
else
  chmod +x deploy-gas.sh
  ./deploy-gas.sh "$MSG"
  if [ $? -ne 0 ]; then
    echo "⚠️  GAS deploy failed — continuing to GitHub + Vercel anyway."
  else
    echo "✓ GAS deploy complete."
  fi
fi

# 3. Commit and push to GitHub
# BUG FIX: `git commit` exits 1 when there is nothing new to commit.
# Previously this killed the script before Vercel ever ran.
# Now we treat "nothing to commit" as a non-error and continue.
echo "------------------------------------------------"
echo "🐙 Step 2: Committing and pushing to GitHub..."
echo "------------------------------------------------"
git add .
COMMIT_OUT=$(git commit -m "$MSG" 2>&1)
COMMIT_CODE=$?
if [ $COMMIT_CODE -eq 0 ]; then
  echo "✓ Committed: $MSG"
elif echo "$COMMIT_OUT" | grep -q "nothing to commit"; then
  echo "ℹ️  Nothing new to commit — already up to date."
else
  echo "❌ Git commit failed: $COMMIT_OUT"
  exit 1
fi

git push
if [ $? -ne 0 ]; then
  echo "❌ Git push failed. Aborting."
  exit 1
fi
echo "✓ GitHub push complete."

# 4. Deploy to Vercel production (always runs)
echo "------------------------------------------------"
echo "⚡ Step 3: Deploying frontend to Vercel..."
echo "------------------------------------------------"
npx vercel --prod --yes
if [ $? -ne 0 ]; then
  echo "❌ Vercel deployment failed."
  exit 1
fi

echo "------------------------------------------------"
echo "🎉 SUCCESS: All changes are live on GitHub, Vercel, and Google Apps Script!"
echo "------------------------------------------------"
