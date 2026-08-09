# Dual UAT setup (standing)

| Tester | Device | App delivery |
|--------|--------|----------------|
| Australia | iPhone | TestFlight (EAS iOS build) |
| New Zealand | Android | Expo Go + Metro QR (`npx expo start -c`) |

Both are accepted for ongoing development UAT.

## NZ — Expo Go (simple)

1. Latest project code on the Metro computer  
2. `npx expo start -c`  
3. Open **Expo Go** on Android → scan the QR code  
4. Scan products  

Dynamic Signals flags are on by default via `.env.development` (no manual env editing).

**Control check:** Cadbury Dairy Milk `9300617064879` → product/TruScore, then governed Signals.

Ignore Qonversion warnings in Expo Go.

## AU — TestFlight

Install the current authorised iOS UAT/TestFlight build and test on device as usual. Store/release EAS profiles must keep `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1` so Signals are not silently off.
