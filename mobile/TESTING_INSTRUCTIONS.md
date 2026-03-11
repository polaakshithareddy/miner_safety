# Mobile App Testing Instructions

## Quick Start Guide

### Step 1: Start the Backend Server
The mobile app requires the backend API to be running. Make sure the backend server is started first:
```powershell
cd ..\backend
npm start
```

### Step 2: Start Expo Development Server
In a new terminal:
```powershell
cd mobile
npm start
```

This will:
- Start the Metro bundler
- Display a QR code for Expo Go
- Show options to open on Android/iOS/Web

### Step 3: Test on Device/Emulator

#### Option A: Physical Device (Recommended)
1. Install **Expo Go** app from:
   - [App Store](https://apps.apple.com/app/expo-go/id982107779) (iOS)
   - [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android)

2. Ensure your phone and computer are on the **same Wi-Fi network**

3. Scan the QR code displayed in the terminal with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

#### Option B: Android Emulator
1. Start Android Studio and launch an emulator
2. In the Expo terminal, press `a` or run:
   ```powershell
   npm run android
   ```

#### Option C: iOS Simulator (Mac only)
1. Ensure Xcode is installed
2. In the Expo terminal, press `i` or run:
   ```powershell
   npm run ios
   ```

#### Option D: Web Browser
1. In the Expo terminal, press `w` or run:
   ```powershell
   npm run web
   ```

## Testing Checklist

### ✅ Basic Functionality
- [ ] App launches without errors
- [ ] Login screen displays correctly
- [ ] Can navigate to Register screen
- [ ] Forms accept input
- [ ] Buttons are responsive

### ✅ Authentication (Requires Backend)
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] Token is stored correctly
- [ ] Logout works
- [ ] Navigation changes based on login state

### ✅ Role-Based Dashboards
- [ ] Worker dashboard displays for worker role
- [ ] Supervisor dashboard displays for supervisor role
- [ ] Admin dashboard displays for admin role
- [ ] Dashboard data loads (requires backend)

### ✅ Core Features
- [ ] Hazard reporting form works
- [ ] Image picker opens (camera/library)
- [ ] Daily checklist loads and can be completed
- [ ] Video library displays videos
- [ ] Videos can be played
- [ ] Incident list displays
- [ ] Profile screen shows user info

### ✅ Network & API
- [ ] API calls work (check console for errors)
- [ ] Error handling displays properly
- [ ] Loading states show during API calls

## Troubleshooting

### Issue: "Unable to connect to Expo"
**Solution**: 
- Check that both devices are on same network
- Try using tunnel mode: `npm start -- --tunnel`
- Check firewall settings

### Issue: "Network request failed"
**Solution**:
- Verify backend is running on `http://172.16.58.131:5000`
- For Android emulator, change API URL to `http://10.0.2.2:5000`
- Check network connectivity

### Issue: "Module not found"
**Solution**:
- Run `npm install` in mobile directory
- Clear cache: `npm start -- --clear`

### Issue: App crashes on launch
**Solution**:
- Check console for error messages
- Verify all dependencies are installed
- Try clearing Expo cache

## Network Configuration Notes

The app is configured to connect to: `http://172.16.58.131:5000`

- **Physical Device**: Use your computer's LAN IP address
- **Android Emulator**: Use `10.0.2.2` instead of LAN IP
- **iOS Simulator**: Use `localhost` or LAN IP
- **Web**: Use `localhost` or LAN IP

To change the API URL, edit: `mobile/src/services/api.js`

## Expected Behavior

1. **On Launch**: 
   - Shows loading spinner briefly
   - Displays Login screen if not authenticated
   - Shows appropriate dashboard if already logged in

2. **After Login**:
   - Navigates to role-specific dashboard
   - Shows user-specific data
   - Allows navigation to other screens

3. **Navigation**:
   - Smooth transitions between screens
   - Back button works correctly
   - Tab navigation works (if implemented)

## Performance Checks

- [ ] App loads within 3-5 seconds
- [ ] Smooth scrolling on lists
- [ ] Images load properly
- [ ] No memory leaks (check with React DevTools)
- [ ] No console errors/warnings

## Device Compatibility

Tested on:
- ✅ Android (via Expo Go)
- ✅ iOS (via Expo Go)
- ✅ Web browser

Minimum Requirements:
- Android: API level 21+ (Android 5.0+)
- iOS: iOS 13.0+
- Modern web browser

## Next Steps After Testing

1. Document any bugs found
2. Test on multiple devices/screen sizes
3. Test with slow network connection
4. Test offline functionality (if implemented)
5. Performance testing with large datasets

