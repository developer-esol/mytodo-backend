# Deploy to Production Server (PowerShell)
# Run this on your Windows machine to deploy to production

Write-Host "🚀 Deploying to production server..." -ForegroundColor Green

# Configuration (UPDATE THESE!)
$SERVER_USER = "your-username"
$SERVER_HOST = "your-server-ip-or-domain"
$SERVER_PATH = "/var/www/mytodoo/mytodo-backend"

Write-Host "📦 Step 1: Committing and pushing local changes..." -ForegroundColor Cyan
git add .
git commit -m "Fix npm typo in tasks.services.js"
if ($LASTEXITCODE -ne 0) {
    Write-Host "No changes to commit (or error occurred)" -ForegroundColor Yellow
}
git push origin main

Write-Host "`n🔄 Step 2: SSHing to server and deploying..." -ForegroundColor Cyan
Write-Host "You'll need to enter your server password..." -ForegroundColor Yellow

$sshCommands = @"
cd $SERVER_PATH
echo '📥 Pulling latest code...'
git pull origin main
echo '✅ Code updated'

echo '📦 Installing dependencies...'
npm install --production

echo '🔄 Restarting server...'
pm2 restart mytodo-backend

echo '✅ Deployment complete!'
echo '📊 Showing recent logs...'
pm2 logs mytodo-backend --lines 20 --nostream
"@

ssh "$SERVER_USER@$SERVER_HOST" $sshCommands

Write-Host "`n🎉 Deployment finished!" -ForegroundColor Green
Write-Host "Check the logs above to verify the server is running correctly." -ForegroundColor Cyan
