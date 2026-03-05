import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.md * 2 - 12) / 2;

const CATEGORIES = [
  {
    key: 'daily',
    emoji: '🌅',
    label: '오늘의 타로',
    desc: '하루의 흐름을 한 장에 담다',
    count: 1,
    positions: ['오늘의 메시지'],
    color: '#FF9500',
  },
  {
    key: 'love',
    emoji: '💕',
    label: '연애운',
    desc: '사랑의 흐름을 읽다',
    count: 3,
    positions: ['마음', '관계', '방향'],
    color: '#FF2D55',
  },
  {
    key: 'money',
    emoji: '💰',
    label: '재물운',
    desc: '금전의 기운을 살피다',
    count: 3,
    positions: ['현재', '흐름', '조언'],
    color: '#34C759',
  },
  {
    key: 'career',
    emoji: '💼',
    label: '직업운',
    desc: '진로와 성취의 길을 보다',
    count: 3,
    positions: ['상황', '과제', '결과'],
    color: '#007AFF',
  },
  {
    key: 'health',
    emoji: '🌿',
    label: '건강운',
    desc: '몸과 마음의 균형을 읽다',
    count: 1,
    positions: ['건강 메시지'],
    color: '#5856D6',
  },
  {
    key: 'yesno',
    emoji: '⚖️',
    label: 'Yes or No',
    desc: '명쾌한 답을 구하다',
    count: 1,
    positions: ['답'],
    color: '#8E8E93',
  },
  {
    key: 'timeline',
    emoji: '⏳',
    label: '과거·현재·미래',
    desc: '시간의 흐름 속 나를 보다',
    count: 3,
    positions: ['과거', '현재', '미래'],
    color: '#AF52DE',
  },
  {
    key: 'advice',
    emoji: '🧭',
    label: '조언 타로',
    desc: '지금 내게 필요한 한마디',
    count: 1,
    positions: ['조언'],
    color: '#FF6482',
  },
];

export default function TarotScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>어떤 이야기를 들어볼까요?</Text>

      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('TarotReading', {
                category: cat.key,
                label: cat.label,
                count: cat.count,
                positions: cat.positions,
              })
            }
          >
            <View style={[styles.emojiCircle, { backgroundColor: cat.color + '18' }]}>
              <Text style={styles.emoji}>{cat.emoji}</Text>
            </View>
            <Text style={styles.cardLabel}>{cat.label}</Text>
            <Text style={styles.cardDesc}>{cat.desc}</Text>
            <Text style={[styles.cardCount, { color: cat.color }]}>
              {cat.count === 1 ? '원카드' : `${cat.count}카드`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: spacing.md, paddingBottom: 100 },

  title: {
    fontSize: 20, fontWeight: '700', color: Colors.text,
    marginBottom: spacing.lg, marginTop: spacing.sm,
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  card: {
    width: CARD_WIDTH, backgroundColor: Colors.surface,
    borderRadius: 16, padding: spacing.md,
  },
  emojiCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  emoji: { fontSize: 22 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 8 },
  cardCount: { fontSize: 11, fontWeight: '600' },
});
