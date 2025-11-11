# E-Commerce Mobile App (iOS & Android)

A production-ready React Native mobile application for the e-commerce platform.

## 📱 Features

### Core Functionality
- ✅ **Authentication**
  - Email/Password login
  - User registration with email verification
  - Two-factor authentication (2FA)
  - Biometric authentication (Face ID / Touch ID)
  - Social login (Google, Facebook, Apple)
  - Password reset
  - Remember me functionality

- ✅ **Product Browsing**
  - Home screen with featured products
  - Category browsing
  - Advanced search with filters
  - Product details with images
  - Product recommendations
  - Recently viewed products
  - Wishlist functionality

- ✅ **Shopping Cart**
  - Add/remove items
  - Update quantities
  - Persistent cart across sessions
  - Real-time price calculations

- ✅ **Checkout & Payments**
  - Multiple address management
  - Stripe payment integration
  - Order placement
  - Order confirmation

- ✅ **Order Management**
  - Order history
  - Order tracking
  - Order details
  - Cancel orders
  - Reorder functionality

- ✅ **User Profile**
  - Profile management
  - Address book
  - Settings
  - Logout from all devices

## 🏗️ Tech Stack

- **Framework**: React Native 0.73+
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: Zustand
- **API Client**: Axios with interceptors
- **UI Components**: React Native Paper + React Native Elements
- **Icons**: React Native Vector Icons
- **Forms**: React Hook Form + Zod validation
- **Payments**: Stripe React Native SDK
- **Biometrics**: React Native Biometrics
- **Push Notifications**: React Native Push Notification + Firebase
- **Storage**: AsyncStorage
- **Image Handling**: React Native Fast Image
- **Security**: React Native Keychain

## 📁 Project Structure

```
mobile/
├── ios/                    # iOS native code
│   ├── Podfile            # CocoaPods dependencies
│   └── ECommerce/         # iOS app files
├── android/               # Android native code
├── src/
│   ├── navigation/        # Navigation configuration
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/           # App screens
│   │   ├── auth/          # Authentication screens
│   │   ├── home/          # Home screen
│   │   ├── products/      # Product screens
│   │   ├── cart/          # Cart screen
│   │   ├── checkout/      # Checkout screens
│   │   ├── orders/        # Order screens
│   │   └── profile/       # Profile screens
│   ├── components/        # Reusable components
│   ├── store/             # Zustand stores
│   │   ├── authStore.ts
│   │   └── cartStore.ts
│   ├── services/          # API services
│   │   └── api.ts
│   ├── utils/             # Utility functions
│   ├── config/            # App configuration
│   │   └── constants.ts
│   └── types/             # TypeScript types
├── App.tsx                # Root component
├── index.js               # Entry point
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Xcode 14+ (for iOS)
- CocoaPods (for iOS)
- Android Studio (for Android)
- React Native CLI

### Installation

1. **Install Dependencies**

```bash
cd mobile
npm install
```

2. **Install iOS Dependencies**

```bash
cd ios && pod install && cd ..
```

3. **Configure Environment**

Create a `.env` file in the mobile directory:

```env
API_URL=http://localhost:5000/api/v1
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Running the App

#### iOS

```bash
# Run on iOS simulator
npm run ios

# Run on specific simulator
npm run ios -- --simulator="iPhone 15 Pro"

# Run on device
npm run ios -- --device
```

#### Android

```bash
# Run on Android emulator/device
npm run android
```

### Development

```bash
# Start Metro bundler
npm start

# Clear cache
npm start -- --reset-cache

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🔧 Configuration

### iOS Setup

1. **Info.plist Permissions**

Add the following permissions to `ios/ECommerce/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to upload product images</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library</string>
<key>NSFaceIDUsageDescription</key>
<string>We use Face ID for secure authentication</string>
```

2. **Apple Sign In** (Optional)

Enable "Sign in with Apple" capability in Xcode.

3. **Push Notifications**

Enable Push Notifications capability in Xcode.

### Android Setup

1. **Permissions** in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

2. **Gradle Configuration**

Update `android/app/build.gradle` with proper signing configs.

## 🔐 Security Features

- **Secure Token Storage**: Tokens stored using React Native Keychain
- **Biometric Authentication**: Face ID / Touch ID / Fingerprint support
- **Automatic Token Refresh**: Seamless token renewal
- **Certificate Pinning**: SSL certificate pinning for API calls
- **Code Obfuscation**: ProGuard for Android, Xcode optimization for iOS
- **Secure HTTP**: All API calls use HTTPS
- **Input Validation**: Client-side validation with Zod

## 📲 Push Notifications

Configure Firebase Cloud Messaging:

1. Add `google-services.json` to `android/app/`
2. Add `GoogleService-Info.plist` to `ios/ECommerce/`
3. Configure notification handlers in `src/services/notifications.ts`

## 💳 Stripe Integration

The app uses Stripe for payment processing:

1. Payments are processed via Payment Intents
2. 3D Secure authentication supported
3. Apple Pay integration (iOS)
4. Google Pay integration (Android)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- AuthStore.test.ts
```

## 📦 Building for Production

### iOS

```bash
# Archive for App Store
1. Open ios/ECommerce.xcworkspace in Xcode
2. Select "Any iOS Device" as destination
3. Product > Archive
4. Upload to App Store Connect
```

### Android

```bash
# Generate release APK
cd android
./gradlew assembleRelease

# Generate AAB for Play Store
./gradlew bundleRelease

# Output: android/app/build/outputs/
```

## 🎨 Customization

### Theme Colors

Edit `src/config/constants.ts`:

```typescript
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  // ... customize colors
};
```

### App Icon & Splash Screen

- iOS: Replace images in `ios/ECommerce/Images.xcassets`
- Android: Replace images in `android/app/src/main/res/`

## 🐛 Troubleshooting

### Common Issues

**Metro bundler errors:**
```bash
npm start -- --reset-cache
rm -rf node_modules && npm install
```

**iOS build errors:**
```bash
cd ios
pod deintegrate
pod install
```

**Android build errors:**
```bash
cd android
./gradlew clean
cd .. && npm run android
```

**Module not found errors:**
```bash
watchman watch-del-all
rm -rf node_modules && npm install
```

## 📱 Screenshots

(Add screenshots here once UI is implemented)

## 🔄 CI/CD

Configure GitHub Actions or Fastlane for automated builds and deployments.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines first.

---

**Built with ❤️ using React Native**
