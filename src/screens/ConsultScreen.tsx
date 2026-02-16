import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing, borderRadius } from '../constants/theme';
import { Colors } from '../constants/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MENUS = [
  {
    icon: '命',
    title: '사주 분석',
    desc: '사주팔자로 보는 나의 운명',
    route: 'SajuInput' as const,
    color: Colors.primary,
  },
  {
    icon: '運',
    title: '오늘의 운세',
    desc: '매일 달라지는 나의 운세 확인',
    route: 'Fortune' as const,
    color: Colors.info,
  },
  {
    icon: '緣',
    title: '궁합 분석',
    desc: '두 사람의 사주 궁합 보기',
    route: 'Compatibility' as const,
    color: Colors.secondary,
  },
  {
    icon: '記',
    title: '상담 기록',
    desc: '이전 사주 조회 기록 확인',
    route: 'History' as const,
    color: Colors.success,
  },
];

export default function ConsultScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>상담 메뉴</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          원하는 상담 유형을 선택하세요
        </Text>

        {MENUS.map((menu) => (
          <TouchableOpacity
            key={menu.route}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(menu.route)}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={[styles.iconCircle, { backgroundColor: menu.color + '18' }]}>
                  <Text style={[styles.icon, { color: menu.color }]}>{menu.icon}</Text>
                </View>
                <View style={styles.cardText}>
                  <Text variant="titleMedium" style={styles.menuTitle}>{menu.title}</Text>
                  <Text variant="bodySmall" style={styles.menuDesc}>{menu.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  title: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    elevation: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  menuDesc: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: Colors.textMuted,
    marginLeft: spacing.sm,
  },
});
