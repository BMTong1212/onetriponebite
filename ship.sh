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
echo "------------------------------------------------"
echo "📦 Step 1: Deploying backend to Google Apps Script..."
echo "------------------------------------------------"
# Check if clasp is authenticated by running list
if ! npx @google/clasp list &>/dev/null; then
  echo "⚠️ Clasp is not logged in. Running clasp login..."
  echo "👉 A browser window will open. Please log in using the shared Google Account."
  npx @google/clasp login
fi

# Run the existing deploy-gas script
chmod +x deploy-gas.sh
./deploy-gas.sh "$MSG"
if [ $? -ne 0 ]; then
  echo "❌ Apps Script deployment failed. Aborting."
  exit 1
fi

# 3. Commit and push to GitHub
echo "------------------------------------------------"
echo "🐙 Step 2: Committing and pushing to GitHub..."
echo "------------------------------------------------"
git add .
git commit -m "$MSG"
git push
if [ $? -ne 0 ]; then
  echo "❌ Git push failed. Aborting."
  exit 1
fi

# 4. Deploy to Vercel production
echo "------------------------------------------------"
echo "⚡ Step 3: Deploying frontend to Vercel..."
echo "------------------------------------------------"
npx vercel --prod --yes
if [ $? -ne 0 ]; then
  echo "❌ Vercel deployment failed."
  exit 1
fi

echo "------------------------------------------------"
echo "🎉 SUCCESS: All changes are live and tracked on GitHub, Vercel, and Google Apps Script!"
echo "------------------------------------------------"
