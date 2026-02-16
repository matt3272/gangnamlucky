import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { appTheme } from './src/constants/theme';

export default function App() {
  return (
    <PaperProvider theme={appTheme}>
      <AppNavigator />
      <StatusBar style="dark" />
    </PaperProvider>
  );
}
