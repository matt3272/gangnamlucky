import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';

export default function ShopScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🏪</Text>
      <Text variant="titleLarge" style={styles.title}>천기몰</Text>
      <Text variant="bodyMedium" style={styles.desc}>
        준비 중입니다
      </Text>
      <Text variant="bodySmall" style={styles.subDesc}>
        부적, 풍수 용품 등 다양한 상품이{'\n'}곧 출시될 예정입니다
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: Colors.background,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: spacing.sm,
  },
  desc: {
    color: Colors.textSecondary,
    marginBottom: spacing.sm,
  },
  subDesc: {
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
