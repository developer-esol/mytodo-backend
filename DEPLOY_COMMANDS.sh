#!/bin/bash
# Quick deployment commands for production server
# Copy and paste these commands into your SSH session

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/mytodoo/mytodo-backend

# Pull latest changes from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install any new dependencies (optional, only if package.json changed)
# npm install --production

# Restart the application with PM2
echo "🔄 Restarting application..."
pm2 restart mytodo-backend

# Show recent logs to verify everything is working
echo "📊 Showing recent logs..."
pm2 logs mytodo-backend --lines 30 --nostream

echo "✅ Deployment complete!"
echo ""
echo "Monitor logs in real-time with: pm2 logs mytodo-backend"
