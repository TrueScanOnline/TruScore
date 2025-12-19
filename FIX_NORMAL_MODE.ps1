# Fix Normal Mode - Allow Node.js Through Firewall
# Run this script as Administrator to fix normal mode connectivity

Write-Host "Fixing Windows Firewall for Expo Metro Bundler..." -ForegroundColor Cyan

# Remove blocking rules for node.exe
Write-Host "`nRemoving blocking rules for node.exe..." -ForegroundColor Yellow
Get-NetFirewallRule | Where-Object {
    $_.DisplayName -like "*node.exe*" -and $_.Action -eq "Block"
} | Remove-NetFirewallRule -ErrorAction SilentlyContinue

# Add/Update allow rule for Metro Bundler port range
Write-Host "Adding firewall rule for Metro Bundler (ports 8081-8090)..." -ForegroundColor Yellow
$existingRule = Get-NetFirewallRule -DisplayName "Expo Metro Bundler" -ErrorAction SilentlyContinue
if ($existingRule) {
    Remove-NetFirewallRule -DisplayName "Expo Metro Bundler" -ErrorAction SilentlyContinue
}

New-NetFirewallRule -DisplayName "Expo Metro Bundler" `
    -Direction Inbound `
    -LocalPort 8081,8082,8083,8084,8085,8086,8087,8088,8089,8090 `
    -Protocol TCP `
    -Action Allow `
    -Description "Allow Expo Metro Bundler connections for React Native development" `
    -ErrorAction SilentlyContinue

Write-Host "`n✅ Firewall rules updated!" -ForegroundColor Green
Write-Host "`nYou can now try normal mode:" -ForegroundColor Cyan
Write-Host "  npx expo start --clear" -ForegroundColor White
Write-Host "`nIf it still doesn't work, check:" -ForegroundColor Yellow
Write-Host "  1. Router AP Isolation settings" -ForegroundColor White
Write-Host "  2. Antivirus blocking Node.js" -ForegroundColor White
Write-Host "  3. VPN or proxy interfering" -ForegroundColor White


