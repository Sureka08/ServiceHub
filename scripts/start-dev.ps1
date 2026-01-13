Write-Host "Starting ServiceHub Development Environment..." -ForegroundColor Green
Write-Host ""

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm run install-all

Write-Host ""
Write-Host "Starting server and client..." -ForegroundColor Yellow
npm run dev








