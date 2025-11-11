#!/bin/bash
# Deploy updated code to production server
# This script will update the production server with your fixed local code

echo "🚀 Deploying to production server..."

# Configuration (UPDATE THESE!)
SERVER_USER="your-username"
SERVER_HOST="your-server-ip-or-domain"
SERVER_PATH="/var/www/mytodoo/mytodo-backend"

echo "📦 Step 1: Committing local changes..."
git add .
git commit -m "Fix npm typo in tasks.services.js" || echo "No changes to commit"
git push origin main

echo "🔄 Step 2: Pulling changes on server..."
ssh $SERVER_USER@$SERVER_HOST << 'EOF'
cd /var/www/mytodoo/mytodo-backend
git pull origin main
echo "✅ Code updated on server"

echo "📦 Step 3: Installing dependencies (if needed)..."
npm install --production

echo "🔄 Step 4: Restarting server..."
pm2 restart mytodo-backend

echo "✅ Deployment complete!"
pm2 logs mytodo-backend --lines 20
EOF

echo "🎉 Done! Check the logs above for any errors."
