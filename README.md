# 🚀 My Frontend Application

A modern React Native application built with Expo, featuring a comprehensive dashboard system for users, service providers, and administrators.

## 📱 Features

### 👤 User Dashboard
- **Profile Management**: Complete user profile setup and management
- **Service Exploration**: Browse and discover available services
- **Order Management**: Track and manage your orders
- **Measurements**: Store and manage your measurements
- **Real-time Updates**: Get instant notifications and updates

### 🏪 Provider Dashboard
- **Service Management**: Add and manage your services
- **Order Processing**: Handle incoming orders efficiently
- **Offer Creation**: Create and manage special offers
- **Rider Management**: Coordinate with delivery riders
- **Analytics**: Track your business performance

### 👨‍💼 Admin Dashboard
- **Application Review**: Review and approve service provider applications
- **Service Management**: Oversee all services in the platform
- **User Management**: Monitor and manage platform users
- **System Analytics**: Comprehensive platform insights

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **UI Components**: React Native Paper
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Payments**: Stripe Integration
- **Location**: Expo Location
- **Icons**: Expo Vector Icons

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Expo Go app** on your mobile device (for testing)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd my-frontend-application
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment
Update the `baseURL.js` file with your backend API URL:
```javascript
export const BASE_URL = "http://your-backend-url:5000/api";
export const API_URL = `${BASE_URL}/v1`;
```

### 4. Start the Development Server
```bash
npm start
# or
expo start
```

### 5. Run on Device/Simulator

#### For Android:
```bash
npm run android
# or
expo run:android
```

#### For iOS:
```bash
npm run ios
# or
expo run:ios
```

#### For Web:
```bash
npm run web
# or
expo start --web
```

## 📱 Running on Physical Device

1. Install **Expo Go** from App Store (iOS) or Google Play Store (Android)
2. Start the development server: `expo start`
3. Scan the QR code with Expo Go app
4. The app will load on your device

## 🏗️ Project Structure

```
my-frontend-application/
├── app/                          # Main application screens
│   ├── adminDashboard/           # Admin-specific screens
│   ├── auth/                     # Authentication screens
│   ├── components/               # Reusable components
│   ├── context/                  # React Context providers
│   ├── providerDashboard/        # Service provider screens
│   └── userDashboard/            # User-specific screens
├── assets/                       # Images, icons, and static files
├── App.js                        # Main app component
├── baseURL.js                    # API configuration
└── package.json                  # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

## 🔐 Authentication Flow

1. **Sign Up**: Users can register as regular users or service providers
2. **Login**: Secure authentication with OTP verification
3. **Protected Routes**: Role-based access control
4. **Session Management**: Automatic token refresh and logout

## 📊 Dashboard Features

### User Dashboard
- View available services
- Place orders
- Manage measurements
- Track order history
- Update profile

### Provider Dashboard
- Manage service offerings
- Process orders
- Create promotional offers
- Coordinate with riders
- View analytics

### Admin Dashboard
- Review applications
- Manage services
- Monitor platform activity
- User management
- System configuration

## 🔌 API Integration

The app connects to a Node.js backend with the following endpoints:
- User authentication and management
- Service provider operations
- Order processing
- Payment integration
- File uploads
- Real-time notifications

## 🎨 UI/UX Features

- **Modern Design**: Clean and intuitive interface
- **Responsive Layout**: Works on all screen sizes
- **Dark/Light Theme**: Automatic theme switching
- **Smooth Animations**: Enhanced user experience
- **Accessibility**: Screen reader support

## 🚨 Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start --clear
   ```

2. **Dependencies conflicts**:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Cache issues**:
   ```bash
   npx expo start --clear
   ```

4. **Network connectivity**:
   - Ensure your device and computer are on the same network
   - Check firewall settings

## 📱 Device Requirements

- **iOS**: iOS 11.0 or later
- **Android**: Android 6.0 (API level 23) or later
- **RAM**: Minimum 2GB recommended
- **Storage**: At least 100MB free space

## 🔒 Security Features

- Secure authentication with JWT tokens
- Encrypted data transmission
- Role-based access control
- Input validation and sanitization
- Secure payment processing

## 📈 Performance Optimizations

- Lazy loading of screens
- Image optimization
- Efficient state management
- Minimal re-renders
- Optimized bundle size

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🎯 Future Enhancements

- Push notifications
- Offline mode support
- Advanced analytics
- Multi-language support
- Enhanced security features

---

**Happy Coding! 🎉**

Built with ❤️ using React Native and Expo
