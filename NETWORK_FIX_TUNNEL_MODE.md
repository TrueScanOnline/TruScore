# Network Fix - Use Tunnel Mode for Expo Go

## Root Cause
The "Failed to download remote update" error is likely a **network connectivity issue** between your device and the Metro bundler, not an EAS updates issue.

## Solution: Use Tunnel Mode

Tunnel mode routes traffic through Expo's servers, bypassing local network issues.

### Steps:

1. **Stop current Metro bundler** (if running)

2. **Start Metro with tunnel mode:**
   ```bash
   npx expo start --tunnel --clear
   ```

3. **Scan the new QR code** that appears (it will be different - tunnel mode uses a different URL)

4. **The app should load** without the network error

## Why This Works

- **Tunnel mode** uses Expo's servers as a relay
- Bypasses local network firewall/port issues
- Works even if device and computer are on different networks
- Resolves "Failed to download remote update" errors caused by network connectivity

## Alternative: Check Network Settings

If tunnel mode doesn't work, check:

1. **Same Wi-Fi network:** Device and computer must be on same network
2. **Firewall:** Windows Firewall might be blocking port 8082
3. **Port forwarding:** Some routers block certain ports

## Status

✅ **Try tunnel mode first** - This resolves most "Failed to download remote update" errors
