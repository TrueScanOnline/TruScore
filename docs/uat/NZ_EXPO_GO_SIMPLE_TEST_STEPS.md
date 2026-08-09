# NZ Expo Go — how to test (simple)

You do **not** need to edit environment flags. They stay on by default for local development.

Australia tests on **TestFlight (iPhone)**. New Zealand tests on **Expo Go (Android)** this way.

## Each time you want to test

1. On the computer with the project, open PowerShell in the project folder.
2. Get the latest code (if you use git): `git pull`
3. Start the app: `npx expo start -c`
4. On your Android phone, open **Expo Go** and scan the QR code.
5. Wait until the app loads, then scan products as usual.

## First check (Cadbury Dairy Milk)

Scan barcode: **9300617064879**

You should see the normal product / TruScore result, then Dynamic Signals for that product (not only the old Alerts / “animal testing” style cards).

## Notes

- A message about **Qonversion** failing in Expo Go is normal. Ignore it.
- Phone and computer must be on the **same Wi‑Fi**.
- If something looks stuck after a big update, stop Metro (Ctrl+C) and run `npx expo start -c` again.
