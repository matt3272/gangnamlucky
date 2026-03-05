import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { appTheme } from './src/constants/theme';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <PaperProvider theme={appTheme}>
      <AppNavigator />
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <StatusBar style="dark" />
    </PaperProvider>
  );
}
