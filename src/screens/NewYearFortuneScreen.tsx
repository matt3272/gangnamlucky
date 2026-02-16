import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { useSajuStore } from '../store/useSajuStore';
import { getStemElement, isGenerating, isControlling } from '../services/saju/elements';
import { SajuData, Element } from '../types/saju';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const YEAR = 2026;
const YEAR_STEM = '병';
const YEAR_BRANCH = '오';
const YEAR_ELEMENT: Element = '화';
const YEAR_LABEL = '병오년(丙午年)';

/* ── 신년운 계산 ── */
interface YearFortuneResult {
  overall: number;
  wealth: number;
  career: number;
  love: number;
  health: number;
  monthlyHighlights: { month: number; desc: string }[];
  summary: string;
  advice: string[];
  luckyColor: string;
  luckyNumber: number;
  luckyDirection: string;
}

const ELEMENT_YEAR_TRAITS: Record<Element, { good: string; caution: string }> = {
  '목': {
    good: '화의 기운이 목을 설기하여 창의적 에너지가 넘치는 해입니다. 새로운 프로젝트를 시작하기 좋습니다.',
    caution: '에너지를 너무 분산하지 않도록 주의하세요. 핵심에 집중하는 것이 중요합니다.',
  },
  '화': {
    good: '같은 화의 해를 맞아 열정과 자신감이 최고조에 달하는 해입니다. 리더십을 발휘할 기회가 옵니다.',
    caution: '지나친 자신감은 독이 될 수 있습니다. 겸손함을 유지하세요.',
  },
  '토': {
    good: '화생토로 든든한 지원을 받는 해입니다. 안정적인 성장과 결실을 기대할 수 있습니다.',
    caution: '변화보다 꾸준함이 성과를 만드는 해입니다. 급한 결정은 피하세요.',
  },
  '금': {
    good: '화극금의 기운이 있어 도전과 변화가 예상됩니다. 위기를 기회로 만들 수 있는 해입니다.',
    caution: '갈등 상황에서 감정적 대응을 피하고 냉정하게 판단하세요.',
  },
  '수': {
    good: '수극화로 자신의 능력을 증명할 기회가 많은 해입니다. 적극적으로 도전하세요.',
    caution: '체력 관리에 유의하세요. 무리하지 말고 적절한 휴식을 취하는 것이 중요합니다.',
  },
};

const LUCKY_COLORS: Record<Element, string> = {
  '목': '초록', '화': '빨강', '토': '노랑', '금': '흰색', '수': '파랑',
};

const LUCKY_DIRS: Record<Element, string> = {
  '목': '동쪽', '화': '남쪽', '토': '중앙', '금': '서쪽', '수': '북쪽',
};

function calculateYearFortune(sajuData: SajuData): YearFortuneResult {
  const myElement = getStemElement(sajuData.pillars.day.stem);
  const seed = sajuData.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);

  let base = 65;
  if (myElement === YEAR_ELEMENT) base = 75;
  else if (isGenerating(YEAR_ELEMENT, myElement)) base = 82;
  else if (isGenerating(myElement, YEAR_ELEMENT)) base = 70;
  else if (isControlling(YEAR_ELEMENT, myElement)) base = 52;
  else if (isControlling(myElement, YEAR_ELEMENT)) base = 60;

  const v = (i: number) => ((seed * (i + 3)) % 20) - 10;
  const clamp = (n: number) => Math.max(30, Math.min(95, n));

  const overall = clamp(base + v(0));
  const wealth = clamp(base + v(1) + (isGenerating(YEAR_ELEMENT, myElement) ? 8 : 0));
  const career = clamp(base + v(2) + 3);
  const love = clamp(base + v(3) - 2);
  const health = clamp(base + v(4) + (isControlling(YEAR_ELEMENT, myElement) ? -5 : 3));

  const traits = ELEMENT_YEAR_TRAITS[myElement];

  // 월별 하이라이트 (3개)
  const goodMonths = [
    ((seed % 4) + 2),
    ((seed % 3) + 6),
    ((seed % 2) + 10),
  ];
  const monthDescs = [
    '새로운 기회가 찾아오는 달입니다. 적극적으로 움직이세요.',
    '재물운이 상승하는 시기입니다. 투자나 계획에 좋습니다.',
    '대인관계에서 좋은 인연을 만날 수 있는 달입니다.',
  ];
  const monthlyHighlights = goodMonths.map((m, i) => ({ month: m, desc: monthDescs[i] }));

  const needElement: Element = isControlling(YEAR_ELEMENT, myElement) ? '토' : myElement;

  return {
    overall,
    wealth,
    career,
    love,
    health,
    monthlyHighlights,
    summary: traits.good,
    advice: [
      traits.caution,
      `${YEAR}년은 ${YEAR_ELEMENT}의 기운이 강한 해이므로, ${myElement}의 기질을 잘 활용하세요.`,
      '상반기에 기초를 다지고, 하반기에 성과를 거두는 전략이 좋습니다.',
    ],
    luckyColor: LUCKY_COLORS[needElement],
    luckyNumber: (seed % 9) + 1,
    luckyDirection: LUCKY_DIRS[needElement],
  };
}

/* ── 프로그레스 바 ── */
function AnimBar({ label, score, color, delay }: { label: string; score: number; color: string; delay: number }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: score, duration: 1000, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [score, delay, w]);
  const barW = w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <Animated.View style={[barStyles.fill, { width: barW, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.score, { color }]}>{score}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  label: { width: 48, fontSize: 13, fontWeight: '600', color: Colors.text },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.gray200, marginHorizontal: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  score: { width: 30, fontSize: 14, fontWeight: '700', textAlign: 'right' },
});

/* ── 메인 화면 ── */
export default function NewYearFortuneScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { activeProfile } = useSajuStore();
  const profile = activeProfile();

  const [result, setResult] = useState<YearFortuneResult | null>(null);
  const [loading, setLoading] = useState(true);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      const r = calculateYearFortune(profile.sajuData);
      setResult(r);
      setLoading(false);
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 1200);
    return () => clearTimeout(timer);
  }, [profile, fadeIn]);

  if (!profile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>프로필을 먼저 등록해주세요</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🌟</Text>
        <Text style={styles.loadingTitle}>{YEAR}년 신년운 분석 중</Text>
        <Text style={styles.loadingSub}>{profile.sajuData.name}님의 {YEAR_LABEL} 운세를 준비하고 있습니다...</Text>
      </View>
    );
  }

  if (!result) return null;

  const scoreColor = (s: number) => s >= 75 ? Colors.success : s >= 55 ? Colors.warning : Colors.info;

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 헤더 */}
        <View style={styles.headerCard}>
          <Text style={styles.yearBadge}>{YEAR_LABEL}</Text>
          <Text style={styles.headerTitle}>{profile.sajuData.name}님의 {YEAR}년 운세</Text>
          <Text style={styles.headerSaju}>
            {profile.sajuData.pillars.day.stem}{profile.sajuData.pillars.day.branch}일주 · {getStemElement(profile.sajuData.pillars.day.stem)} 오행
          </Text>
        </View>

        {/* 종합 점수 */}
        <View style={styles.overallCard}>
          <Text style={styles.overallLabel}>종합운</Text>
          <View style={[styles.overallCircle, { borderColor: scoreColor(result.overall) }]}>
            <Text style={[styles.overallScore, { color: scoreColor(result.overall) }]}>{result.overall}</Text>
            <Text style={styles.overallUnit}>점</Text>
          </View>
          <Text style={styles.summaryText}>{result.summary}</Text>
        </View>

        {/* 카테고리 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>카테고리별 운세</Text>
          <View style={{ marginTop: 12 }}>
            <AnimBar label="재물" score={result.wealth} color={Colors.warning} delay={200} />
            <AnimBar label="직업" score={result.career} color={Colors.info} delay={350} />
            <AnimBar label="애정" score={result.love} color={Colors.secondary} delay={500} />
            <AnimBar label="건강" score={result.health} color={Colors.success} delay={650} />
          </View>
        </View>

        {/* 월별 하이라이트 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>주목할 시기</Text>
          {result.monthlyHighlights.map((m, i) => (
            <View key={i} style={styles.monthRow}>
              <View style={styles.monthBadge}>
                <Text style={styles.monthBadgeText}>{m.month}월</Text>
              </View>
              <Text style={styles.monthDesc}>{m.desc}</Text>
            </View>
          ))}
        </View>

        {/* 럭키 아이템 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>행운의 키워드</Text>
          <View style={styles.luckyRow}>
            <View style={styles.luckyItem}>
              <Text style={styles.luckyIcon}>🎨</Text>
              <Text style={styles.luckyLabel}>행운색</Text>
              <Text style={styles.luckyValue}>{result.luckyColor}</Text>
            </View>
            <View style={styles.luckyItem}>
              <Text style={styles.luckyIcon}>🔢</Text>
              <Text style={styles.luckyLabel}>행운숫자</Text>
              <Text style={styles.luckyValue}>{result.luckyNumber}</Text>
            </View>
            <View style={styles.luckyItem}>
              <Text style={styles.luckyIcon}>🧭</Text>
              <Text style={styles.luckyLabel}>행운방향</Text>
              <Text style={styles.luckyValue}>{result.luckyDirection}</Text>
            </View>
          </View>
        </View>

        {/* 조언 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{YEAR}년 조언</Text>
          {result.advice.map((a, i) => (
            <View key={i} style={styles.adviceRow}>
              <Text style={styles.adviceDot}>●</Text>
              <Text style={styles.adviceText}>{a}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>사주 기반 신년운 분석이며, 재미로 참고해주세요.</Text>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: spacing.md, paddingBottom: 60 },

  // Loading / Empty
  loadingContainer: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg,
  },
  loadingEmoji: { fontSize: 48, marginBottom: 16 },
  loadingTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  loadingSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  emptyContainer: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 16, color: Colors.textSecondary },

  // Header
  headerCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: spacing.md, marginBottom: spacing.md, alignItems: 'center',
  },
  yearBadge: {
    fontSize: 13, fontWeight: '700', color: Colors.primary,
    backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 10, overflow: 'hidden', marginBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  headerSaju: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

  // Overall
  overallCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: spacing.md, marginBottom: spacing.md, alignItems: 'center',
  },
  overallLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  overallCircle: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 4, alignItems: 'center', justifyContent: 'center',
    marginVertical: 14,
  },
  overallScore: { fontSize: 30, fontWeight: '800' },
  overallUnit: { fontSize: 12, color: Colors.textSecondary, marginTop: -4 },
  summaryText: { fontSize: 14, lineHeight: 22, color: Colors.text, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

  // Monthly
  monthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  monthBadge: {
    backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, marginRight: 10,
  },
  monthBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  monthDesc: { flex: 1, fontSize: 14, lineHeight: 20, color: Colors.text },

  // Lucky
  luckyRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
  luckyItem: { alignItems: 'center' },
  luckyIcon: { fontSize: 28, marginBottom: 6 },
  luckyLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  luckyValue: { fontSize: 15, fontWeight: '700', color: Colors.text },

  // Advice
  adviceRow: { flexDirection: 'row', marginTop: 10 },
  adviceDot: { fontSize: 8, color: Colors.warning, marginTop: 5, marginRight: 8 },
  adviceText: { flex: 1, fontSize: 14, lineHeight: 22, color: Colors.text },

  disclaimer: {
    fontSize: 12, color: Colors.textMuted,
    textAlign: 'center', marginTop: spacing.md,
  },
});
