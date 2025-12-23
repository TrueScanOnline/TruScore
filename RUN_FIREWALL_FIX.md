# How to Run the Firewall Fix Script

## Step 1: Navigate to Project Directory

Open PowerShell and navigate to the project:

```powershell
cd C:\TrueScan-FoodScanner
```

## Step 2: Run Script as Administrator

**Option A: Right-click PowerShell and "Run as Administrator"**

1. Close current PowerShell
2. Right-click PowerShell icon
3. Select "Run as Administrator"
4. Navigate to project: `cd C:\TrueScan-FoodScanner`
5. Run script: `.\FIX_NORMAL_MODE.ps1`

**Option B: Run from current PowerShell (if you have admin rights)**

```powershell
cd C:\TrueScan-FoodScanner
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\FIX_NORMAL_MODE.ps1
```

## Step 3: Verify Fix

After running the script, try normal mode:

```powershell
npx expo start --clear
```

If it still doesn't work, check the script output for any errors.

## Alternative: Manual Firewall Fix

If the script doesn't work, manually add the firewall rule:

1. Open **Windows Security** → **Firewall & network protection**
2. Click **Advanced settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → Next
5. Select **TCP** and enter ports: `8081,8082,8083,8084,8085,8086,8087,8088,8089,8090`
6. Select **Allow the connection** → Next
7. Check all profiles → Next
8. Name: "Expo Metro Bundler" → Finish

## Note

If you're happy with tunnel mode, you don't need to fix normal mode. Tunnel mode works perfectly and is often more reliable.





