import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Vicoo',
  slug: 'vicoo-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  platforms: ['ios', 'android'],
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FFD166'
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.vicoo.mobile'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFD166'
    },
    package: 'com.vicoo.mobile'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  scheme: 'vicoo',
  extra: {
    apiBase: process.env.EXPO_PUBLIC_API_BASE
  }
};

export default config;
