#!/bin/bash
# Fix npm typo on production server
# Run this on your server: bash fix-npm-error.sh

echo "🔍 Checking for 'npm' typo in tasks.services.js..."

FILE="/var/www/mytodoo/mytodo-backend/servicesN/tasks/tasks.services.js"

if [ ! -f "$FILE" ]; then
    echo "❌ File not found: $FILE"
    echo "Are you on the production server?"
    exit 1
fi

# Check if npm typo exists
if grep -n "^\s*npm;" "$FILE"; then
    echo "✅ Found the typo! Removing it..."
    
    # Create backup
    cp "$FILE" "${FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 Backup created"
    
    # Remove the npm; line
    sed -i '/^\s*npm;/d' "$FILE"
    
    echo "✅ Fixed! Restarting server..."
    
    # Restart using PM2 (adjust if you use different process manager)
    pm2 restart mytodo-backend
    
    echo "🎉 Done! Check logs: pm2 logs mytodo-backend"
else
    echo "❌ 'npm;' typo not found in the file"
    echo "Showing line 173:"
    sed -n '170,176p' "$FILE"
fi
