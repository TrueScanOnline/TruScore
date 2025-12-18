# Normal Mode Network Issue - Diagnosis & Fix

## Why Tunnel Mode Works But Normal Mode Doesn't

### The Problem
Normal mode uses your **local network** (LAN) to connect Expo Go to Metro bundler:
- Metro bundler runs on your computer (e.g., `192.168.68.105:8082`)
- Expo Go on your phone tries to connect directly via Wi-Fi
- **Something is blocking this connection** (firewall, router, network settings)

### Why Tunnel Mode Works
Tunnel mode routes through **Expo's servers**:
- Your computer → Expo servers → Your phone
- Bypasses local network issues
- Works from anywhere (even different networks)

## Common Causes of Normal Mode Failure

### 1. Windows Firewall (Most Common)
Windows Firewall may be blocking incoming connections on port 8082.

**Fix:**
```powershell
# Allow Node.js through Windows Firewall
New-NetFirewallRule -DisplayName "Expo Metro Bundler" -Direction Inbound -LocalPort 8082 -Protocol TCP -Action Allow
```

Or manually:
1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Find "Node.js" or add port 8082

### 2. Router/Network Settings
Some routers block device-to-device communication.

**Check:**
- Router has "AP Isolation" or "Client Isolation" enabled? → Disable it
- Router firewall blocking local connections? → Check router settings

### 3. Antivirus Software
Antivirus may be blocking Node.js network connections.

**Fix:**
- Add Node.js to antivirus exceptions
- Temporarily disable to test

### 4. VPN or Network Proxy
VPNs or proxies can interfere with local network connections.

**Fix:**
- Disable VPN temporarily
- Check proxy settings

## Quick Diagnosis

Run these commands to check:

```powershell
# Check if port 8082 is listening
netstat -an | findstr 8082

# Check Windows Firewall rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Node*" -or $_.DisplayName -like "*Expo*"}

# Test local network connectivity
ping 192.168.68.105  # Replace with your computer's IP
```

## Recommendation

**For Development:** Use tunnel mode - it's more reliable and works from anywhere.

**For Production Testing:** Fix normal mode by:
1. Allowing Node.js through Windows Firewall
2. Checking router settings
3. Disabling AP Isolation if enabled

## Status

✅ **Tunnel mode works** - App is functional
⚠️ **Normal mode blocked** - Network/firewall issue (not code issue)
