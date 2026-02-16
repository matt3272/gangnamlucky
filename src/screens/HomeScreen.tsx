import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
} from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { spacing, borderRadius } from '../constants/theme';
import { Colors } from '../constants/colors';
import { useSajuStore } from '../store/useSajuStore';
import { getTodayPillar } from '../services/saju/calculator';
import { getStemElement, getElementRelationship } from '../services/saju/elements';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type HomeTab = 'fortune' | 'lucky';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const BANNER_HEIGHT = 160;

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const BANNERS = [
  { title: '이번 주 운세를\n확인하세요', subtitle: '요일별로 달라지는 나의 운세', bg: Colors.primary, route: 'WeeklyFortune' as const },
  { title: '두 사람의 궁합을\n알아보세요', subtitle: '사주로 보는 우리의 인연', bg: Colors.secondary, route: 'Compatibility' as const },
  { title: 'AI가 분석하는\n당신의 사주', subtitle: 'Gemini AI 상세 해석', bg: Colors.info, route: 'SajuInput' as const },
];

const FEATURES = [
  { icon: '✦', label: '사주분석', action: 'SajuInput' },
  { icon: '🌟', label: '신년운', action: 'NewYearFortune' },
  { icon: '☯', label: '궁합분석', action: 'Compatibility' },
  { icon: '🔮', label: '오늘의 관상', action: 'FaceReading' },
  { icon: '🎯', label: '정통사주', action: 'SajuInput' },
  { icon: '⋯', label: '전체메뉴', action: 'Consult' },
];

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
    hour < 5 ? 'dawn' :
    hour < 7 ? 'early' :
    hour < 9 ? 'morning' :
    hour < 11 ? 'late_morning' :
    hour < 13 ? 'noon' :
    hour < 15 ? 'afternoon' :
    hour < 17 ? 'late_afternoon' :
    hour < 21 ? 'evening' : 'night';
  const pool = GREETINGS[key];
  const seed = new Date().getDate();
  return pool[seed % pool.length];
}

const FORTUNE_MESSAGES: Record<string, string> = {
  '상생 (生)': '기운이 조화를 이루는 좋은 날입니다',
  '역생 (被生)': '주변의 도움을 받을 수 있는 날입니다',
  '같은 오행': '안정적이고 편안한 하루가 될 것입니다',
  '중립': '무난하지만 꾸준히 나아가면 좋습니다',
  '상극 (剋)': '신중한 판단이 필요한 하루입니다',
  '역극 (被剋)': '충분한 휴식으로 에너지를 충전하세요',
};

const LUCKY_COORDI = [
  { item: '화이트 셔츠 + 슬랙스', desc: '깔끔한 인상이 행운을 부릅니다', icon: '👔' },
  { item: '파스텔톤 니트', desc: '부드러운 색감이 좋은 기운을 끌어옵니다', icon: '🧶' },
  { item: '네이비 재킷', desc: '신뢰감 있는 스타일이 좋은 만남을 만듭니다', icon: '🧥' },
  { item: '베이지 트렌치코트', desc: '클래식한 멋이 품격을 높여줍니다', icon: '🧥' },
  { item: '캐주얼 데님', desc: '편안한 복장이 창의력을 높여줍니다', icon: '👖' },
  { item: '블랙 올블랙', desc: '강렬한 인상이 결단력을 높여줍니다', icon: '🖤' },
  { item: '스트라이프 셔츠', desc: '활동적인 에너지를 불러옵니다', icon: '👕' },
];

const LUCKY_FOOD = [
  { item: '따뜻한 된장찌개', desc: '몸의 기운을 따뜻하게 채워줍니다', icon: '🍲' },
  { item: '삼겹살', desc: '활력을 높이는 에너지 음식입니다', icon: '🥩' },
  { item: '해물파전', desc: '수(水) 기운을 보충해줍니다', icon: '🥞' },
  { item: '비빔밥', desc: '오행의 균형을 맞춰줍니다', icon: '🍚' },
  { item: '녹차', desc: '목(木) 기운으로 마음을 안정시킵니다', icon: '🍵' },
  { item: '갈비찜', desc: '풍요로운 기운이 재물운을 높입니다', icon: '🍖' },
  { item: '초밥', desc: '정돈된 에너지가 집중력을 높입니다', icon: '🍣' },
];

const LUCKY_PLACE = [
  { item: '산 근처 공원', desc: '목(木) 기운이 강한 곳에서 활력을 얻으세요', icon: '🏔️' },
  { item: '카페', desc: '화(火) 기운의 따뜻한 공간에서 영감을 얻으세요', icon: '☕' },
  { item: '도서관', desc: '고요한 에너지가 지혜를 높여줍니다', icon: '📚' },
  { item: '강가·호수', desc: '수(水) 기운이 감성을 풍부하게 합니다', icon: '🌊' },
  { item: '서점', desc: '새로운 지식이 운의 흐름을 바꿉니다', icon: '📖' },
  { item: '전시관·미술관', desc: '예술적 에너지가 창의력을 높입니다', icon: '🎨' },
  { item: '광장·넓은 공간', desc: '토(土) 기운이 안정감을 줍니다', icon: '🏛️' },
];

const LUCKY_COLOR = [
  { item: '보라색', desc: '영적 에너지를 높여줍니다', color: '#5856D6' },
  { item: '파란색', desc: '수(水) 기운으로 마음을 안정시킵니다', color: '#007AFF' },
  { item: '초록색', desc: '목(木) 기운으로 성장의 에너지입니다', color: '#34C759' },
  { item: '노란색', desc: '토(土) 기운으로 재물운을 높입니다', color: '#FF9500' },
  { item: '빨간색', desc: '화(火) 기운으로 열정을 불어넣습니다', color: '#FF3B30' },
  { item: '흰색', desc: '금(金) 기운으로 결단력을 줍니다', color: '#8E8E93' },
  { item: '분홍색', desc: '애정운을 높여주는 색입니다', color: '#FF2D55' },
];

/** Battery score indicator */
function BatteryScore({ score }: { score: number }) {
  const fillPct = Math.max(8, Math.min(100, score));
  const color =
    score > 60 ? Colors.success :
    score >= 20 ? Colors.warning :
    Colors.error;

  return (
    <View style={bat.wrap}>
      <Text style={bat.score}>{score}%</Text>
      <View style={bat.batteryRow}>
        <View style={bat.body}>
          <View style={[bat.fill, { width: `${fillPct}%`, backgroundColor: color }]} />
        </View>
        <View style={bat.tip} />
      </View>
    </View>
  );
}

const bat = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10 },
  score: { fontSize: 56, fontWeight: '700', color: Colors.text },
  batteryRow: { flexDirection: 'row', alignItems: 'center' },
  body: {
    width: 100, height: 36, borderRadius: 8,
    borderWidth: 2, borderColor: Colors.gray500,
    overflow: 'hidden',
    padding: 3,
  },
  fill: {
    height: '100%', borderRadius: 5,
  },
  tip: {
    width: 5, height: 16, borderTopRightRadius: 3, borderBottomRightRadius: 3,
    backgroundColor: Colors.gray500, marginLeft: -0.5,
  },
});

function getWeekDates(): Date[] {
  const today = new Date();
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}


export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { history, loadHistory, loadProfiles, activeProfile } = useSajuStore();
  const profile = activeProfile();

  const [activeTab, setActiveTab] = useState<HomeTab>('fortune');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const bannerRef = useRef<ScrollView>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const weekDates = useMemo(() => getWeekDates(), []);

  useEffect(() => {
    loadHistory();
    loadProfiles();
  }, []);

  // Auto-slide banner
  const startAutoSlide = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
        return next;
      });
    }, 3000);
  }, []);

  useEffect(() => {
    if (activeTab === 'fortune') startAutoSlide();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startAutoSlide, activeTab]);

  const handleBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    if (index >= 0 && index < BANNERS.length && index !== currentBanner) {
      setCurrentBanner(index);
    }
  };

  const handleBannerScrollEnd = () => {
    startAutoSlide();
  };

  // Fortune score calculation (profile 기준)
  const fortune = useMemo(() => {
    if (!profile) return null;

    const todayPillar = getTodayPillar();
    const myElement = getStemElement(profile.sajuData.pillars.day.stem);
    const todayElement = todayPillar.element;
    const relationship = getElementRelationship(myElement, todayElement);

    const scoreMap: Record<string, number> = {
      '상생 (生)': 85, '역생 (被生)': 80, '같은 오행': 75,
      '중립': 65, '상극 (剋)': 50, '역극 (被剋)': 45,
    };
    const base = scoreMap[relationship] || 60;
    const dayVar = (new Date().getDate() * 7 + new Date().getMonth() * 13) % 20 - 10;
    const score = Math.min(100, Math.max(0, base + dayVar));
    const message = FORTUNE_MESSAGES[relationship] || '오늘 하루도 좋은 하루 되세요';

    return { score, message };
  }, [profile]);

  const selectedDate = weekDates[selectedDayIndex];

  const luckyData = useMemo(() => {
    const d = selectedDate;
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return {
      coordi: LUCKY_COORDI[(seed + 1) % LUCKY_COORDI.length],
      food: LUCKY_FOOD[(seed + 37) % LUCKY_FOOD.length],
      place: LUCKY_PLACE[(seed + 73) % LUCKY_PLACE.length],
      color: LUCKY_COLOR[(seed + 53) % LUCKY_COLOR.length],
    };
  }, [selectedDate]);

  const handleFeaturePress = (action: string) => {
    switch (action) {
      case 'SajuInput':
        // 프로필 있으면 결과 직행, 없으면 입력 화면
        if (profile) {
          navigation.navigate('SajuResult', { sajuData: profile.sajuData });
        } else {
          navigation.navigate('SajuInput');
        }
        break;
      case 'Fortune': case 'Compatibility': case 'History': case 'FaceReading': case 'NewYearFortune':
        navigation.navigate(action as any);
        break;
      case 'lucky':
        setActiveTab('lucky');
        break;
      case 'Shop': case 'Consult':
        (navigation.getParent() as any)?.navigate(action);
        break;
    }
  };

  const userName = profile?.sajuData.name ?? null;
  const greetingText = useMemo(() => getGreetingText(), []);

  const formatHeaderDate = (date: Date) =>
    date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.greeting}>
            {greetingText}{userName ? ',' : ''}
            {userName && <Text style={styles.greetingName}> {userName}님</Text>}
          </Text>
          <View style={styles.headerIcons}>
            <IconButton icon="magnify" size={22} iconColor={Colors.textSecondary} onPress={() => {}} style={styles.headerIconBtn} />
            <IconButton icon="bell-outline" size={22} iconColor={Colors.textSecondary} onPress={() => {}} style={styles.headerIconBtn} />
          </View>
        </View>
        <Text style={styles.logo}>신묘</Text>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabBar}>
        <View style={styles.tabButtons}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'fortune' && styles.tabButtonActive]}
            onPress={() => setActiveTab('fortune')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'fortune' && styles.tabTextActive]}>운세보고서</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'lucky' && styles.tabButtonActive]}
            onPress={() => setActiveTab('lucky')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'lucky' && styles.tabTextActive]}>행운보고서</Text>
          </TouchableOpacity>
        </View>
        {profile && (
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('ProfileList')} activeOpacity={0.5}>
            <Text style={styles.profileBtnText}>{profile.sajuData.name}님</Text>
            <Text style={styles.profileChevron}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'fortune' ? (
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* 1) Banner Slider */}
            <View style={styles.bannerContainer}>
              <ScrollView
                ref={bannerRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleBannerScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleBannerScrollEnd}
                snapToInterval={BANNER_WIDTH}
                decelerationRate="fast"
              >
                {BANNERS.map((banner, index) => (
                  <Card
                    key={index}
                    style={[styles.bannerCard, { backgroundColor: banner.bg }]}
                    onPress={() => navigation.navigate(banner.route as any)}
                  >
                    <Card.Content style={styles.bannerContent}>
                      <Text variant="headlineSmall" style={styles.bannerTitle}>{banner.title}</Text>
                      <Text variant="bodyMedium" style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                    </Card.Content>
                  </Card>
                ))}
              </ScrollView>
              <View style={styles.dotOverlay}>
                {BANNERS.map((_, index) => (
                  <View key={index} style={[styles.dot, currentBanner === index ? styles.dotActive : styles.dotInactive]} />
                ))}
              </View>
            </View>

            {/* 2) Feature Grid */}
            <View style={styles.featureGrid}>
              {FEATURES.map((feat, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.featureItem}
                  onPress={() => handleFeaturePress(feat.action)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.featureIcon}>{feat.icon}</Text>
                  <Text style={styles.featureLabel}>{feat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 3) Fortune Card */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate(fortune ? 'WeeklyFortune' : 'SajuInput')}
            >
              <Card style={styles.fortuneCard}>
                <Card.Content style={styles.fortuneContent}>
                  <Text style={styles.fortuneLabel}>오늘의 운세</Text>
                  {fortune ? (
                    <>
                      <Text style={styles.fortuneTitle}>
                        {userName ?? '회원'}님의 운세 배터리 ⚡
                      </Text>
                      <View style={styles.fortuneScoreWrap}>
                        <BatteryScore score={fortune.score} />
                      </View>
                      <Text style={styles.fortuneMessage}>{fortune.message}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.fortuneTitle}>사주를 등록해보세요</Text>
                      <View style={styles.fortuneScoreWrap}>
                        <View style={styles.fortunePlaceholder}>
                          <Text style={styles.fortunePlaceholderText}>?</Text>
                        </View>
                      </View>
                    </>
                  )}
                </Card.Content>
                {fortune && (
                  <View style={styles.fortuneFooter}>
                    <Text style={styles.fortuneFooterText}>탭하여 주간 운세 보기</Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* ===== 행운보고서 ===== */
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text variant="titleLarge" style={styles.luckyDateTitle}>
              {formatHeaderDate(selectedDate)}
            </Text>

            <View style={styles.daySelector}>
              {weekDates.map((date, index) => {
                const isSelected = index === selectedDayIndex;
                const isToday = index === 0;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayItem, isSelected && styles.dayItemActive]}
                    onPress={() => setSelectedDayIndex(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                      {DAY_NAMES[date.getDay()]}
                    </Text>
                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                      {date.getDate()}
                    </Text>
                    {isToday && <View style={styles.todayDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Card style={styles.luckyCard}>
              <Card.Content>
                <View style={styles.luckyHeader}>
                  <Text style={styles.luckyEmoji}>{luckyData.coordi.icon}</Text>
                  <Text variant="titleMedium" style={styles.luckyTitle}>오늘의 코디</Text>
                </View>
                <Text variant="titleSmall" style={styles.luckyItem}>{luckyData.coordi.item}</Text>
                <Text variant="bodyMedium" style={styles.luckyDesc}>{luckyData.coordi.desc}</Text>
              </Card.Content>
            </Card>

            <Card style={styles.luckyCard}>
              <Card.Content>
                <View style={styles.luckyHeader}>
                  <Text style={styles.luckyEmoji}>{luckyData.food.icon}</Text>
                  <Text variant="titleMedium" style={styles.luckyTitle}>오늘의 음식</Text>
                </View>
                <Text variant="titleSmall" style={styles.luckyItem}>{luckyData.food.item}</Text>
                <Text variant="bodyMedium" style={styles.luckyDesc}>{luckyData.food.desc}</Text>
              </Card.Content>
            </Card>

            <Card style={styles.luckyCard}>
              <Card.Content>
                <View style={styles.luckyHeader}>
                  <Text style={styles.luckyEmoji}>{luckyData.place.icon}</Text>
                  <Text variant="titleMedium" style={styles.luckyTitle}>오늘의 장소</Text>
                </View>
                <Text variant="titleSmall" style={styles.luckyItem}>{luckyData.place.item}</Text>
                <Text variant="bodyMedium" style={styles.luckyDesc}>{luckyData.place.desc}</Text>
              </Card.Content>
            </Card>

            <Card style={styles.luckyCard}>
              <Card.Content>
                <View style={styles.luckyHeader}>
                  <View style={[styles.colorDot, { backgroundColor: luckyData.color.color }]} />
                  <Text variant="titleMedium" style={styles.luckyTitle}>오늘의 컬러</Text>
                </View>
                <Text variant="titleSmall" style={styles.luckyItem}>{luckyData.color.item}</Text>
                <Text variant="bodyMedium" style={styles.luckyDesc}>{luckyData.color.desc}</Text>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: Colors.surface,
  },
  headerTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { fontSize: 13, fontWeight: '300', color: Colors.textSecondary, flex: 1, letterSpacing: 0.5 },
  greetingName: { fontWeight: '600', color: Colors.text },
  logo: { fontSize: 28, fontWeight: '700', color: Colors.text },
  headerIcons: { flexDirection: 'row', marginRight: -8 },
  headerIconBtn: { margin: 0 },
  profileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 30,
  },
  profileBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 13 },
  profileChevron: { fontSize: 16, fontWeight: '300', color: Colors.textSecondary, marginLeft: -2 },

  tabBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    elevation: 0, shadowOpacity: 0,
  },
  tabButtons: { flexDirection: 'row', gap: spacing.xs },
  tabButton: {
    paddingVertical: 6, paddingHorizontal: 16,
    borderRadius: 16, backgroundColor: Colors.surfaceLight,
  },
  tabButtonActive: { backgroundColor: Colors.text },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },

  scrollView: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 120 },

  // Banner
  bannerContainer: { marginBottom: spacing.lg },
  bannerCard: { width: BANNER_WIDTH, height: BANNER_HEIGHT, borderRadius: 20, justifyContent: 'center' },
  bannerContent: { justifyContent: 'center', height: '100%' },
  bannerTitle: { color: Colors.white, fontWeight: 'bold', lineHeight: 30 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', marginTop: spacing.sm },
  dotOverlay: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: spacing.xs,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: Colors.white },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.4)' },

  // Feature Grid
  featureGrid: {
    flexDirection: 'row', flexWrap: 'wrap', backgroundColor: Colors.surface,
    borderRadius: 16, paddingVertical: spacing.sm, marginBottom: spacing.lg,
  },
  featureItem: { width: '25%', alignItems: 'center', paddingVertical: spacing.sm },
  featureIcon: { fontSize: 20, marginBottom: 4 },
  featureLabel: { fontSize: 12, color: Colors.text, fontWeight: '500' },

  // Fortune Card
  fortuneCard: { backgroundColor: Colors.surface, borderRadius: 16, marginBottom: spacing.lg, elevation: 0 },
  fortuneContent: { paddingVertical: spacing.lg },
  fortuneLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', marginBottom: 6 },
  fortuneTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  fortuneScoreWrap: { alignItems: 'center', paddingVertical: 28 },
  fortuneMessage: { fontSize: 20, fontWeight: '600', color: Colors.text, textAlign: 'center', lineHeight: 30 },
  fortuneFooter: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.borderLight,
    paddingVertical: 10, alignItems: 'center',
  },
  fortuneFooterText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  fortunePlaceholder: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center',
  },
  fortunePlaceholderText: { fontSize: 28, color: Colors.textMuted },

  // Lucky Report
  luckyDateTitle: { fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: spacing.md },
  daySelector: {
    flexDirection: 'row', marginBottom: spacing.lg,
    backgroundColor: Colors.surface, borderRadius: borderRadius.lg, padding: 4,
    justifyContent: 'space-around',
  },
  dayItem: { width: (SCREEN_WIDTH - spacing.md * 2 - 8) / 7, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  dayItemActive: { backgroundColor: Colors.primary },
  dayLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  dayLabelActive: { color: Colors.white },
  dayNumber: { fontSize: 14, fontWeight: 'bold', color: Colors.text, marginTop: 2 },
  dayNumberActive: { color: Colors.white },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, marginTop: 3 },

  luckyCard: { marginBottom: spacing.md, backgroundColor: Colors.surface, borderRadius: 16, elevation: 0 },
  luckyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  luckyEmoji: { fontSize: 24 },
  luckyTitle: { fontWeight: 'bold', color: Colors.text },
  luckyItem: { fontWeight: '600', color: Colors.text, marginBottom: spacing.xs },
  luckyDesc: { color: Colors.textSecondary, lineHeight: 22 },
  colorDot: { width: 24, height: 24, borderRadius: 12 },
});
