# TrueScan – Food Transparency Scanner

A React Native + Expo mobile app that provides complete transparency about food products by scanning barcodes.

## Features

- 📸 **Barcode Scanning** - Scan UPC/EAN barcodes with your camera
- 🌍 **Country of Origin** - See where your food actually comes from
- 🏆 **Ethical Certifications** - Fairtrade, Rainforest Alliance, UTZ, cage-free, etc.
- 🌱 **Sustainability Data** - Eco-Score, carbon footprint, water usage
- 🐾 **Animal Welfare** - Ratings for animal products
- 📊 **Full Nutrition** - Complete nutrition facts, allergens, additives
- 📱 **Offline Support** - Cache last 100 scans for offline viewing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Yarn or npm
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)

### Installation

1. **Navigate to the project directory:**
   ```powershell
   cd C:\TrueScan-FoodScanner
   ```

2. **Install dependencies:**
   ```powershell
   yarn install
   # or
   npm install
   ```

3. **Install Expo dependencies:**
   ```powershell
   npx expo install expo-file-system expo-linking react-native-maps
   ```

4. **Start the development server:**
   ```powershell
   npx expo start
   ```

5. **Run on your device:**
   - Scan the QR code with Expo Go (iOS) or Camera app (Android)
   - Grant camera permission when prompted
   - Start scanning barcodes!

## Project Structure

```
TrueScan-FoodScanner/
├── app/                    # App screens (Expo Router style)
│   ├── _layout.tsx         # Root navigation layout
│   ├── index.tsx           # Scan screen (barcode scanner)
│   ├── onboarding.tsx      # Onboarding flow
│   ├── result/[barcode].tsx # Product result screen
│   ├── history.tsx         # Scan history
│   └── settings.tsx        # Settings
├── src/
│   └── store/              # Zustand state management
│       ├── useScanStore.ts
│       └── useSettingsStore.ts
├── assets/                 # Images, fonts, icons
├── app.config.js          # Expo configuration
├── package.json           # Dependencies
└── README.md              # This file
```

## Tech Stack

- **React Native** + **Expo** (~53.0)
- **TypeScript**
- **React Navigation** (Stack navigation)
- **Zustand** (State management)
- **NativeWind** (Tailwind CSS for React Native)
- **Expo Camera** (Barcode scanning)
- **AsyncStorage** (Offline caching)

## Development

### Available Scripts

- `yarn start` - Start Expo development server
- `yarn android` - Run on Android emulator
- `yarn ios` - Run on iOS simulator
- `yarn web` - Run in web browser
- `npx expo doctor` - Check for common issues

### Building for Production

```powershell
# Build Android APK
npx eas build -p android --profile preview

# Build Android AAB (for Play Store)
npx eas build -p android --profile production
```

## Status

✅ **Phase 1 Complete** - Scanner & Navigation Ready
- Barcode scanner working
- Navigation set up
- Basic screens created
- State management configured

🚧 **Phase 2 In Progress** - Result Screen & API Integration
- Product details screen
- Open Food Facts API integration
- Trust score calculation
- UI components

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

