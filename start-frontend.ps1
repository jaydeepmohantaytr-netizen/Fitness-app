# Starts the FitTrack frontend on http://localhost:5173
Set-Location "$PSScriptRoot\frontend"
if (-not (Test-Path ".\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
}
Write-Host "Frontend running at http://localhost:5173" -ForegroundColor Green
npm run dev
