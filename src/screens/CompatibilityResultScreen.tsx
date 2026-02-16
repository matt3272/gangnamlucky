import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, Easing, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { SajuData, Element } from '../types/saju';
import { getStemElement, isGenerating, isControlling } from '../services/saju/elements';

const { width: SCREEN_W } = Dimensions.get('window');

type ResultRoute = RouteProp<RootStackParamList, 'CompatibilityResult'>;

/* ── 궁합 계산 ── */
interface CompatibilityResult {
  overall: number;
  personality: number;
  love: number;
  marriage: number;
  wealth: number;
  summary: string;
  strengths: string[];
  advice: string[];
}

const BRANCH_GROUP: Record<string, number> = {
  '인': 0, '오': 0, '술': 0,   // 화국 삼합
  '사': 1, '유': 1, '축': 1,   // 금국 삼합
  '신': 2, '자': 2, '진': 2,   // 수국 삼합
  '해': 3, '묘': 3, '미': 3,   // 목국 삼합
};

const YUKAP_PAIRS: [string, string][] = [
  ['자', '축'], ['인', '해'], ['묘', '술'],
  ['진', '유'], ['사', '신'], ['오', '미'],
];

function isYukhap(b1: string, b2: string): boolean {
  return YUKAP_PAIRS.some(([a, b]) => (b1 === a && b2 === b) || (b1 === b && b2 === a));
}

function isSamhap(b1: string, b2: string): boolean {
  return BRANCH_GROUP[b1] !== undefined && BRANCH_GROUP[b1] === BRANCH_GROUP[b2] && b1 !== b2;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function calculateCompatibility(saju1: SajuData, saju2: SajuData): CompatibilityResult {
  const el1 = getStemElement(saju1.pillars.day.stem);
  const el2 = getStemElement(saju2.pillars.day.stem);

  // 일간 오행 기본 점수
  let base = 60;
  if (el1 === el2) base = 70;
  else if (isGenerating(el1, el2) || isGenerating(el2, el1)) base = 82;
  else if (isControlling(el1, el2) || isControlling(el2, el1)) base = 48;

  // 일지 관계
  const dayB1 = saju1.pillars.day.branch;
  const dayB2 = saju2.pillars.day.branch;
  let branchBonus = 0;
  if (isYukhap(dayB1, dayB2)) branchBonus = 12;
  else if (isSamhap(dayB1, dayB2)) branchBonus = 8;

  // 월지 관계
  const monthB1 = saju1.pillars.month.branch;
  const monthB2 = saju2.pillars.month.branch;
  if (isYukhap(monthB1, monthB2)) branchBonus += 6;
  else if (isSamhap(monthB1, monthB2)) branchBonus += 4;

  // 오행 균형 보완도
  const e1 = saju1.elements;
  const e2 = saju2.elements;
  const complement = (e1.weak === e2.dominant || e2.weak === e1.dominant) ? 8 : 0;

  // 카테고리별 점수 생성
  const seed = (saju1.id + saju2.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const variation = (idx: number) => ((seed * (idx + 7)) % 15) - 7;

  const overall = clamp(base + branchBonus + complement + variation(0), 30, 98);
  const personality = clamp(base + complement + variation(1) + 5, 30, 98);
  const love = clamp(base + branchBonus + variation(2) + 3, 30, 98);
  const marriage = clamp(base + branchBonus + complement + variation(3), 30, 98);
  const wealth = clamp(base + variation(4) + (isGenerating(el1, el2) ? 10 : 0), 30, 98);

  // 요약 / 강점 / 조언 생성
  const relDesc = getRelationDescription(el1, el2);
  const summary = buildSummary(saju1.name, saju2.name, el1, el2, overall, relDesc);
  const strengths = buildStrengths(el1, el2, dayB1, dayB2, branchBonus);
  const advice = buildAdvice(el1, el2, overall);

  return { overall, personality, love, marriage, wealth, summary, strengths, advice };
}

function getRelationDescription(el1: Element, el2: Element): string {
  if (el1 === el2) return '같은 오행으로 서로 공감이 잘 되는 사이';
  if (isGenerating(el1, el2)) return `${el1}이(가) ${el2}을(를) 생하여 자연스럽게 돕는 관계`;
  if (isGenerating(el2, el1)) return `${el2}이(가) ${el1}을(를) 생하여 따뜻한 지지의 관계`;
  if (isControlling(el1, el2)) return `${el1}이(가) ${el2}을(를) 극하여 긴장감이 있는 관계`;
  if (isControlling(el2, el1)) return `${el2}이(가) ${el1}을(를) 극하여 도전적인 관계`;
  return '서로 직접적 영향이 적은 중립적 관계';
}

function buildSummary(name1: string, name2: string, el1: Element, el2: Element, score: number, relDesc: string): string {
  if (score >= 80) return `${name1}님과 ${name2}님은 ${relDesc}입니다. 서로의 부족한 부분을 자연스럽게 채워주며, 함께할수록 더 좋은 시너지를 만들어내는 좋은 궁합입니다.`;
  if (score >= 60) return `${name1}님과 ${name2}님은 ${relDesc}입니다. 서로 다른 점이 매력이 될 수 있으며, 노력에 따라 더욱 깊은 관계로 발전할 수 있습니다.`;
  return `${name1}님과 ${name2}님은 ${relDesc}입니다. 서로의 차이를 이해하고 존중하는 것이 중요하며, 소통을 통해 관계를 발전시킬 수 있습니다.`;
}

function buildStrengths(el1: Element, el2: Element, b1: string, b2: string, branchBonus: number): string[] {
  const list: string[] = [];
  if (isGenerating(el1, el2) || isGenerating(el2, el1)) list.push('오행이 상생하여 서로를 자연스럽게 돕습니다');
  if (el1 === el2) list.push('같은 오행으로 가치관과 성향이 비슷합니다');
  if (branchBonus >= 10) list.push('일지가 합(合)하여 일상적 궁합이 매우 좋습니다');
  else if (branchBonus >= 4) list.push('지지 관계가 좋아 생활 속 조화가 기대됩니다');
  if (list.length === 0) list.push('서로 다른 성향이 새로운 관점을 줍니다');
  list.push('서로의 부족한 오행을 보완할 수 있습니다');
  return list;
}

function buildAdvice(el1: Element, el2: Element, score: number): string[] {
  const list: string[] = [];
  if (isControlling(el1, el2) || isControlling(el2, el1)) {
    list.push('의견 충돌 시 한 발짝 물러서 상대방의 입장을 경청하세요');
  }
  if (score < 65) {
    list.push('작은 것부터 함께하는 시간을 늘려 신뢰를 쌓아가세요');
  }
  list.push('서로의 장점을 인정하고 자주 표현해주세요');
  if (el1 !== el2) list.push('다른 성향을 비난하지 말고 다양성으로 받아들이세요');
  return list;
}

/* ── 원형 점수 애니메이션 ── */
function AnimatedCircleScore({ score, delay, color }: { score: number; delay: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: score,
      duration: 1200,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score, delay, anim]);

  const displayScore = anim.interpolate({ inputRange: [0, 100], outputRange: [0, 100] });

  return (
    <View style={[circStyles.wrap, { borderColor: color }]}>
      <Animated.Text style={[circStyles.num, { color }]}>
        {displayScore.interpolate({ inputRange: [0, 100], outputRange: ['0', String(score)] })}
      </Animated.Text>
      <Text style={circStyles.pct}>점</Text>
    </View>
  );
}

const circStyles = StyleSheet.create({
  wrap: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 4, alignItems: 'center', justifyContent: 'center',
  },
  num: { fontSize: 32, fontWeight: '800' },
  pct: { fontSize: 13, color: Colors.textSecondary, marginTop: -2 },
});

/* ── 카테고리 바 ── */
function CategoryBar({ label, score, color, delay }: { label: string; score: number; color: string; delay: number }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: score,
      duration: 1000,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score, delay, width]);

  const barWidth = width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <Animated.View style={[barStyles.fill, { width: barWidth, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.score, { color }]}>{score}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  label: { width: 52, fontSize: 13, fontWeight: '600', color: Colors.text },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.gray200, marginHorizontal: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  score: { width: 30, fontSize: 14, fontWeight: '700', textAlign: 'right' },
});

/* ── 로딩 하트 ── */
function LoadingHeart() {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: 500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 3000, useNativeDriver: true }),
    ).start();
  }, [scale, rotate]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={loadStyles.container}>
      <Animated.View style={[loadStyles.ring, { transform: [{ rotate: spin }] }]}>
        <View style={[loadStyles.dot, { top: -6, left: '50%', marginLeft: -6 }]} />
        <View style={[loadStyles.dot, { bottom: -6, left: '50%', marginLeft: -6 }]} />
        <View style={[loadStyles.dot, { left: -6, top: '50%', marginTop: -6 }]} />
        <View style={[loadStyles.dot, { right: -6, top: '50%', marginTop: -6 }]} />
      </Animated.View>
      <Animated.Text style={[loadStyles.heart, { transform: [{ scale }] }]}>♥</Animated.Text>
    </View>
  );
}

const loadStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', width: 120, height: 120 },
  ring: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: Colors.gray300,
    position: 'absolute',
  },
  dot: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.secondary,
  },
  heart: { fontSize: 48, color: Colors.secondary },
});

/* ── 메인 화면 ── */
export default function CompatibilityResultScreen() {
  const { params } = useRoute<ResultRoute>();
  const { saju1, saju2, color1 = Colors.primary, color2 = Colors.primary } = params;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      const r = calculateCompatibility(saju1, saju2);
      setResult(r);
      setLoading(false);
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 2200);
    return () => clearTimeout(timer);
  }, [saju1, saju2, fadeIn]);

  const scoreColor = (s: number) => s >= 75 ? Colors.secondary : s >= 55 ? Colors.warning : Colors.info;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingHeart />
        <Text style={styles.loadingTitle}>궁합을 분석하고 있어요</Text>
        <Text style={styles.loadingSub}>
          {saju1.name}님과 {saju2.name}님의{'\n'}사주를 비교하고 있습니다...
        </Text>
      </View>
    );
  }

  if (!result) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 두 사람 정보 */}
        <View style={styles.headerCard}>
          <View style={styles.personRow}>
            <View style={styles.personCol}>
              <View style={[styles.personAvatar, { backgroundColor: color1 }]}>
                <Text style={styles.personAvatarText}>{saju1.name.charAt(0)}</Text>
              </View>
              <Text style={styles.personName}>{saju1.name}</Text>
              <Text style={styles.personInfo}>{saju1.pillars.day.stem}{saju1.pillars.day.branch}일주</Text>
            </View>

            <View style={styles.heartBadge}>
              <Text style={styles.heartBadgeIcon}>☯</Text>
            </View>

            <View style={styles.personCol}>
              <View style={[styles.personAvatar, { backgroundColor: color2 }]}>
                <Text style={styles.personAvatarText}>{saju2.name.charAt(0)}</Text>
              </View>
              <Text style={styles.personName}>{saju2.name}</Text>
              <Text style={styles.personInfo}>{saju2.pillars.day.stem}{saju2.pillars.day.branch}일주</Text>
            </View>
          </View>
        </View>

        {/* 종합 점수 */}
        <View style={styles.overallCard}>
          <Text style={styles.overallLabel}>종합 궁합</Text>
          <View style={styles.overallCenter}>
            <AnimatedCircleScore score={result.overall} delay={200} color={scoreColor(result.overall)} />
          </View>
          <Text style={styles.summaryText}>{result.summary}</Text>
        </View>

        {/* 카테고리 점수 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>카테고리별 궁합</Text>
          <View style={{ marginTop: 12 }}>
            <CategoryBar label="성격" score={result.personality} color={Colors.info} delay={400} />
            <CategoryBar label="연애" score={result.love} color={Colors.secondary} delay={550} />
            <CategoryBar label="결혼" score={result.marriage} color={Colors.primary} delay={700} />
            <CategoryBar label="재물" score={result.wealth} color={Colors.warning} delay={850} />
          </View>
        </View>

        {/* 강점 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>두 사람의 강점</Text>
          {result.strengths.map((s, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>●</Text>
              <Text style={styles.bulletText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* 조언 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>궁합 조언</Text>
          {result.advice.map((a, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={[styles.bulletDot, { color: Colors.warning }]}>●</Text>
              <Text style={styles.bulletText}>{a}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>사주 기반 궁합 참고 자료이며, 재미로 봐주세요.</Text>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: spacing.md, paddingBottom: 60 },

  // Loading
  loadingContainer: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg,
  },
  loadingTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 28 },
  loadingSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },

  // Header
  headerCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: spacing.md, marginBottom: spacing.md,
  },
  personRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  personCol: { alignItems: 'center', flex: 1 },
  personAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  personAvatarText: { fontSize: 24, fontWeight: '700', color: Colors.white },
  personName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  personInfo: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  heartBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(88,86,214,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  heartBadgeIcon: { fontSize: 20, color: Colors.primary },

  // Overall
  overallCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: spacing.md, marginBottom: spacing.md, alignItems: 'center',
  },
  overallLabel: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  overallCenter: { marginVertical: 16 },
  summaryText: { fontSize: 14, lineHeight: 22, color: Colors.text, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

  // Bullet
  bulletRow: { flexDirection: 'row', marginTop: 10 },
  bulletDot: { fontSize: 8, color: Colors.primary, marginTop: 5, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 22, color: Colors.text },

  disclaimer: {
    fontSize: 12, color: Colors.textMuted,
    textAlign: 'center', marginTop: spacing.md,
  },
});
