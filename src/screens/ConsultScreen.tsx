import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useSajuStore } from '../store/useSajuStore';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GREETINGS: Record<string, string[]> = {
  dawn:           ['고요한 새벽입니다', '맑은 새벽입니다'],
  early:          ['이른 아침입니다', '상서로운 아침입니다'],
  morning:        ['좋은 아침입니다', '맑은 아침입니다'],
  late_morning:   ['활기찬 오전입니다', '기운찬 오전입니다'],
  noon:           ['충만한 정오입니다', '양기 가득한 낮입니다'],
  afternoon:      ['따스한 오후입니다', '편안한 오후입니다'],
  late_afternoon: ['노을빛 오후입니다', '고운 석양입니다'],
  evening:        ['편안한 저녁입니다', '고요한 저녁입니다'],
  night:          ['깊은 밤입니다', '고요한 밤입니다'],
};

function getGreetingText(): string {
  const hour = new Date().getHours();
  const key =
    hour < 5 ? 'dawn' : hour < 7 ? 'early' : hour < 9 ? 'morning' :
    hour < 11 ? 'late_morning' : hour < 13 ? 'noon' : hour < 15 ? 'afternoon' :
    hour < 17 ? 'late_afternoon' : hour < 21 ? 'evening' : 'night';
  const pool = GREETINGS[key];
  return pool[new Date().getDate() % pool.length];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - spacing.md * 2;

const CATEGORIES = [
  { key: '전체', icon: '✦' },
  { key: '사주', icon: '命' },
  { key: '타로', icon: '🃏' },
  { key: '궁합', icon: '緣' },
  { key: '관상', icon: '相' },
  { key: '신점', icon: '🔮' },
  { key: '풍수', icon: '🏔️' },
];

const COUNSELORS = [
  {
    id: '1',
    name: '청운 선생',
    title: '정통 사주 전문',
    specialty: '사주',
    rating: 4.9,
    reviews: 2847,
    price: 30000,
    tag: '인기',
    tagColor: Colors.secondary,
    desc: '30년 경력의 정통 사주 해석, 운명의 흐름을 명확히 짚어드립니다.',
    avatar: '👨‍🦳',
    online: true,
  },
  {
    id: '2',
    name: '달빛 선생',
    title: '타로 & 연애운 전문',
    specialty: '타로',
    rating: 4.8,
    reviews: 1523,
    price: 25000,
    tag: '추천',
    tagColor: Colors.info,
    desc: '타로로 읽는 당신의 연애운, 따뜻하고 정확한 리딩을 약속합니다.',
    avatar: '👩',
    online: true,
  },
  {
    id: '3',
    name: '현암 도사',
    title: '궁합 & 택일 전문',
    specialty: '궁합',
    rating: 4.9,
    reviews: 3102,
    price: 40000,
    tag: '대가',
    tagColor: '#AF52DE',
    desc: '두 사람의 사주를 깊이 분석하여 인연의 흐름을 풀어드립니다.',
    avatar: '👴',
    online: false,
  },
  {
    id: '4',
    name: '소연 선생',
    title: '관상 & 수상 전문',
    specialty: '관상',
    rating: 4.7,
    reviews: 982,
    price: 20000,
    tag: '신규',
    tagColor: Colors.success,
    desc: '얼굴에 담긴 운명을 읽어드립니다. 사진 한 장이면 충분합니다.',
    avatar: '👩‍🦰',
    online: true,
  },
  {
    id: '5',
    name: '무경 선생',
    title: '신점 & 영통 전문',
    specialty: '신점',
    rating: 4.8,
    reviews: 1876,
    price: 50000,
    tag: '',
    tagColor: '',
    desc: '신의 메시지를 전달합니다. 깊은 고민이 있을 때 찾아주세요.',
    avatar: '🧙',
    online: false,
  },
  {
    id: '6',
    name: '하율 선생',
    title: '타로 & 진로상담',
    specialty: '타로',
    rating: 4.6,
    reviews: 724,
    price: 22000,
    tag: '',
    tagColor: '',
    desc: '진로와 직업 고민을 타로로 명쾌하게 풀어드립니다.',
    avatar: '👨',
    online: true,
  },
  {
    id: '7',
    name: '지산 선생',
    title: '풍수지리 전문',
    specialty: '풍수',
    rating: 4.9,
    reviews: 1341,
    price: 45000,
    tag: '인기',
    tagColor: Colors.secondary,
    desc: '집과 사무실의 기운을 읽어 최적의 배치를 안내해드립니다.',
    avatar: '🧓',
    online: true,
  },
];

function formatPrice(price: number) {
  return price.toLocaleString() + '원';
}

export default function ConsultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { activeProfile } = useSajuStore();
  const profile = activeProfile();
  const userName = profile?.sajuData.name ?? null;
  const greetingText = useMemo(() => getGreetingText(), []);

  const [selectedCategory, setSelectedCategory] = useState('전체');

  const filtered = selectedCategory === '전체'
    ? COUNSELORS
    : COUNSELORS.filter((c) => c.specialty === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.logo}>신묘상담</Text>
          <View style={styles.headerIcons}>
            <IconButton icon="magnify" size={22} iconColor={Colors.textSecondary} onPress={() => {}} style={styles.headerIconBtn} />
            <IconButton icon="bell-outline" size={22} iconColor={Colors.textSecondary} onPress={() => {}} style={styles.headerIconBtn} />
          </View>
        </View>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>
            {greetingText}{userName ? ', ' : ''}
          </Text>
          {userName && (
            <TouchableOpacity onPress={() => (navigation.getParent() as NavigationProp)?.navigate('ProfileList')} activeOpacity={0.6}>
              <Text style={styles.greetingName}>{userName}님 ›</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

    <ScrollView style={styles.scrollView}>
      <View style={styles.content}>
        {/* 1) 히어로 배너 */}
        <Card style={styles.heroBanner}>
          <Card.Content style={styles.heroContent}>
            <Text variant="headlineSmall" style={styles.heroTitle}>{'전문 상담사에게\n직접 상담받으세요'}</Text>
            <Text variant="bodyMedium" style={styles.heroSubtitle}>사주 · 타로 · 궁합 1:1 맞춤 상담</Text>
          </Card.Content>
        </Card>

        {/* 2) 카테고리 그리드 */}
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={styles.categoryItem}
              onPress={() => setSelectedCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryIcon, selectedCategory === cat.key && styles.categoryIconActive]}>{cat.icon}</Text>
              <Text style={[styles.categoryLabel, selectedCategory === cat.key && styles.categoryLabelActive]}>{cat.key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3) 상담사 리스트 */}
        {filtered.map((c) => (
          <Card key={c.id} style={styles.counselorCard}>
            <Card.Content style={styles.counselorContent}>
              <View style={styles.counselorTop}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatar}>{c.avatar}</Text>
                  {c.online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.counselorInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.counselorName}>{c.name}</Text>
                    {c.tag ? (
                      <View style={[styles.tag, { backgroundColor: c.tagColor + '18' }]}>
                        <Text style={[styles.tagText, { color: c.tagColor }]}>{c.tag}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.counselorTitle}>{c.title}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingStar}>★</Text>
                    <Text style={styles.ratingText}>{c.rating}</Text>
                    <Text style={styles.reviewCount}>({c.reviews.toLocaleString()})</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.counselorDesc} numberOfLines={2}>{c.desc}</Text>
              <View style={styles.counselorBottom}>
                <Text style={styles.price}>{formatPrice(c.price)}~</Text>
                <TouchableOpacity
                  style={[styles.consultButton, !c.online && styles.consultButtonOff]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.consultButtonText, !c.online && styles.consultButtonTextOff]}>
                    {c.online ? '상담하기' : '예약하기'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: Colors.surface },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  greeting: { fontSize: 14, fontWeight: '400', color: Colors.textSecondary, letterSpacing: 0.2 },
  greetingName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  headerIcons: { flexDirection: 'row', marginRight: -8 },
  headerIconBtn: { margin: 0 },
  logo: { fontSize: 32, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  scrollView: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 120 },

  heroBanner: {
    width: BANNER_WIDTH,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    marginBottom: spacing.md,
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
    elevation: 3,
  },
  heroContent: { paddingVertical: 32, paddingHorizontal: 24 },
  heroTitle: { color: '#fff', fontWeight: '700', lineHeight: 30, marginBottom: 8, letterSpacing: -0.3 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)' },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  categoryItem: { width: '25%', alignItems: 'center', paddingVertical: spacing.sm },
  categoryIcon: { fontSize: 20, marginBottom: 4 },
  categoryIconActive: { transform: [{ scale: 1.2 }] },
  categoryLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  categoryLabelActive: { color: Colors.primary, fontWeight: '700' },

  counselorCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginBottom: spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 10,
    elevation: 2,
  },
  counselorContent: { paddingVertical: 16, paddingHorizontal: 16 },
  counselorTop: { flexDirection: 'row', marginBottom: 10 },
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar: { fontSize: 40 },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  counselorInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  counselorName: { fontSize: 17, fontWeight: '700', color: Colors.text, marginRight: 6, letterSpacing: -0.2 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: '700' },
  counselorTitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingStar: { fontSize: 12, color: '#FF9500', marginRight: 2 },
  ratingText: { fontSize: 12, fontWeight: '600', color: Colors.text, marginRight: 2 },
  reviewCount: { fontSize: 11, color: Colors.textSecondary },

  counselorDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 12 },

  counselorBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  consultButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: Colors.primary, shadowOpacity: 0.25, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    elevation: 2,
  },
  consultButtonOff: { backgroundColor: Colors.gray200 },
  consultButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  consultButtonTextOff: { color: Colors.textSecondary },
});
