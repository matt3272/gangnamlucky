import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect, Polygon, Line } from 'react-native-svg';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { useSajuStore } from '../store/useSajuStore';
import { getDayPillar } from '../services/saju/calculator';
import { getStemElement, getElementRelationship } from '../services/saju/elements';
import { Element } from '../types/saju';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/** 카테고리별 iOS 시스템 컬러 */
const CAT_COLORS: Record<string, string> = {
  overall: '#5856D6', // 인디고
  wealth:  '#FF9500', // 오렌지
  career:  '#007AFF', // 블루
  love:    '#FF2D55', // 핑크
  health:  '#34C759', // 그린
  social:  '#AF52DE', // 퍼플
};

const CARD_PADDING = 16;
const CHART_OUTER_WIDTH = Dimensions.get('window').width - spacing.md * 2 - CARD_PADDING * 2;
const CHART_PAD_X = 20;
const CHART_WIDTH = CHART_OUTER_WIDTH;
const GRAPH_WIDTH = CHART_WIDTH - CHART_PAD_X * 2;
const CHART_HEIGHT = 200;
const CHART_PADDING_TOP = 32;
const CHART_PADDING_BOTTOM = 48;
const GRAPH_HEIGHT = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

interface DayFortune {
  date: Date;
  overall: number;
  wealth: number;
  career: number;
  love: number;
  health: number;
  social: number;
}

function calculateDayFortune(date: Date, myElement: Element): DayFortune {
  const pillar = getDayPillar(date);
  const relationship = getElementRelationship(myElement, pillar.element);

  const scoreMap: Record<string, number> = {
    '상생 (生)': 85, '역생 (被生)': 80, '같은 오행': 75,
    '중립': 65, '상극 (剋)': 50, '역극 (被剋)': 45,
  };
  const baseScore = scoreMap[relationship] || 60;
  const dayVar = (date.getDate() * 7 + date.getMonth() * 13) % 20 - 10;

  return {
    date,
    overall: Math.min(100, Math.max(0, baseScore + dayVar)),
    wealth: Math.min(100, Math.max(0, baseScore + ((dayVar + 5) % 15))),
    career: Math.min(100, Math.max(0, baseScore + ((dayVar + 8) % 12))),
    love: Math.min(100, Math.max(0, baseScore + ((dayVar + 3) % 18) - 5)),
    health: Math.min(100, Math.max(0, baseScore + ((dayVar + 11) % 10))),
    social: Math.min(100, Math.max(0, baseScore + ((dayVar + 7) % 14) - 3)),
  };
}

const FORTUNE_MESSAGES: Record<string, string> = {
  '상생 (生)': '기운이 조화를 이루는 좋은 날입니다',
  '역생 (被生)': '주변의 도움을 받을 수 있는 날입니다',
  '같은 오행': '안정적이고 편안한 하루가 될 것입니다',
  '중립': '무난하지만 꾸준히 나아가면 좋습니다',
  '상극 (剋)': '신중한 판단이 필요한 하루입니다',
  '역극 (被剋)': '충분한 휴식으로 에너지를 충전하세요',
};

function BatteryScore({ score }: { score: number }) {
  const fillPct = Math.max(8, Math.min(100, score));
  const color = score > 60 ? Colors.success : score >= 20 ? Colors.warning : Colors.error;
  return (
    <View style={batStyles.wrap}>
      <Text style={batStyles.score}>{score}%</Text>
      <View style={batStyles.row}>
        <View style={batStyles.body}>
          <View style={[batStyles.fill, { width: `${fillPct}%`, backgroundColor: color }]} />
        </View>
        <View style={batStyles.tip} />
      </View>
    </View>
  );
}

const batStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  score: { fontSize: 32, fontWeight: '700', color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center' },
  body: {
    width: 68, height: 28, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.gray500,
    overflow: 'hidden', padding: 2,
  },
  fill: { height: '100%', borderRadius: 4 },
  tip: {
    width: 4, height: 12, borderTopRightRadius: 2, borderBottomRightRadius: 2,
    backgroundColor: Colors.gray500, marginLeft: -0.5,
  },
});


const RADAR_SIZE = Dimensions.get('window').width - spacing.md * 2 - CARD_PADDING * 2;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = RADAR_SIZE / 2 - 36;

const CATEGORY_LIST = [
  { key: 'overall' as const, label: '종합운', icon: '✦' },
  { key: 'wealth' as const, label: '재물운', icon: '💰' },
  { key: 'career' as const, label: '직업운', icon: '💼' },
  { key: 'love' as const, label: '애정운', icon: '💕' },
  { key: 'health' as const, label: '건강운', icon: '🍀' },
  { key: 'social' as const, label: '대인운', icon: '🤝' },
];

function getHexPoint(index: number, radius: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  return {
    x: RADAR_CENTER + radius * Math.cos(angle),
    y: RADAR_CENTER + radius * Math.sin(angle),
  };
}

function hexPoints(radius: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const p = getHexPoint(i, radius);
    return `${p.x},${p.y}`;
  }).join(' ');
}

function RadarChart({ fortune }: { fortune: DayFortune }) {
  const dataPoints = CATEGORY_LIST.map((cat, i) => {
    const score = fortune[cat.key];
    const r = (score / 100) * RADAR_RADIUS;
    return getHexPoint(i, r);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={radarStyles.container}>
      <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
        <Defs>
          <LinearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#007AFF" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#5AC8FA" stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid hexagons */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <Polygon
            key={ratio}
            points={hexPoints(RADAR_RADIUS * ratio)}
            fill="none"
            stroke={Colors.border}
            strokeWidth={0.8}
          />
        ))}

        {/* Axis lines */}
        {CATEGORY_LIST.map((_, i) => {
          const p = getHexPoint(i, RADAR_RADIUS);
          return (
            <Line key={i} x1={RADAR_CENTER} y1={RADAR_CENTER} x2={p.x} y2={p.y} stroke={Colors.border} strokeWidth={0.5} />
          );
        })}

        {/* Data polygon */}
        <Polygon points={dataPolygon} fill="url(#radarFill)" stroke="#007AFF" strokeWidth={2} strokeLinejoin="round" />

        {/* Data dots — each category color */}
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={Colors.white} stroke="#007AFF" strokeWidth={2} />
        ))}
      </Svg>

      {/* Labels */}
      {CATEGORY_LIST.map((cat, i) => {
        const p = getHexPoint(i, RADAR_RADIUS + 24);
        const score = fortune[cat.key];
        return (
          <View key={cat.key} style={[radarStyles.labelWrap, { left: p.x - 28, top: p.y - 18 }]}>
            <Text style={radarStyles.labelText}>{cat.label}</Text>
            <Text style={radarStyles.labelScore}>{score}</Text>
          </View>
        );
      })}
    </View>
  );
}

const radarStyles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center' },
  labelWrap: { position: 'absolute', width: 56, alignItems: 'center' },
  labelText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  labelScore: { fontSize: 13, fontWeight: '700', color: '#007AFF' },
});

const barStyles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, width: 48 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.surfaceLight, overflow: 'hidden', marginHorizontal: 10 },
  fill: { height: '100%', borderRadius: 3 },
  score: { fontSize: 13, fontWeight: '700', width: 28, textAlign: 'right' },
});

function FortuneChart({ fortunes }: { fortunes: DayFortune[] }) {
  const keyIndices = [0, 1, 2, 3, 4, 5, 6];
  const keyFortunes = keyIndices.map((i) => fortunes[i]);

  const stepX = GRAPH_WIDTH / (keyFortunes.length - 1);

  const points = keyFortunes.map((f, i) => ({
    x: CHART_PAD_X + i * stepX,
    y: CHART_PADDING_TOP + GRAPH_HEIGHT - (f.overall / 100) * GRAPH_HEIGHT,
  }));

  // Smooth cubic bezier curve (monotone spline)
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cpX = (points[i].x + points[i + 1].x) / 2;
    linePath += ` C ${cpX} ${points[i].y}, ${cpX} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
  }
  const bottomY = CHART_HEIGHT - CHART_PADDING_BOTTOM;
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

  return (
    <View style={chartStyles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#007AFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#5AC8FA" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#007AFF" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#5AC8FA" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* Horizontal guide lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = CHART_PADDING_TOP + GRAPH_HEIGHT * (1 - ratio);
          return (
            <Rect key={ratio} x={CHART_PAD_X} y={y} width={GRAPH_WIDTH} height={0.5} fill={Colors.border} />
          );
        })}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <Path d={linePath} stroke="url(#lineGrad)" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i === 3 ? 6 : 4} fill={Colors.white} stroke={i === 3 ? '#007AFF' : '#5AC8FA'} strokeWidth={2.5} />
        ))}
      </Svg>

      {/* Score labels */}
      {points.map((p, i) => (
        <View key={i} style={[chartStyles.scoreLabelWrap, { left: p.x - 18, top: p.y - 24 }]}>
          <Text style={[chartStyles.scoreText, i === 3 && chartStyles.scoreTextToday]}>
            {keyFortunes[i].overall}
          </Text>
        </View>
      ))}

      {/* Day labels */}
      {points.map((p, i) => {
        const isToday = i === 3;
        return (
          <View key={`d${i}`} style={[chartStyles.dayLabelWrap, { left: p.x - 18, top: bottomY + 10 }]}>
            <Text style={[chartStyles.dayText, isToday && chartStyles.dayTextToday]}>
              {DAY_NAMES[keyFortunes[i].date.getDay()]}
            </Text>
            <Text style={[chartStyles.dateText, isToday && chartStyles.dateTextToday]}>
              {keyFortunes[i].date.getMonth() + 1}/{keyFortunes[i].date.getDate()}
            </Text>
            {isToday && <Text style={chartStyles.todayArrow}>▲</Text>}
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { position: 'relative' },
  scoreLabelWrap: { position: 'absolute', width: 36, alignItems: 'center' },
  scoreText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  scoreTextToday: { color: '#007AFF', fontWeight: '700', fontSize: 14 },
  dayLabelWrap: { position: 'absolute', width: 36, alignItems: 'center' },
  dayText: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  dayTextToday: { color: '#007AFF', fontWeight: '700' },
  dateText: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  dateTextToday: { color: '#007AFF' },
  todayArrow: { fontSize: 8, color: '#007AFF', marginTop: 2 },
});

export default function WeeklyFortuneScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { activeProfile } = useSajuStore();
  const profile = activeProfile();

  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const weekFortunes = useMemo(() => {
    if (!profile) return [];
    const myElement = getStemElement(profile.sajuData.pillars.day.stem);
    return weekDates.map((date) => calculateDayFortune(date, myElement));
  }, [profile, weekDates]);

  const todayFortune = weekFortunes[3];

  if (!profile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>運</Text>
        <Text variant="titleMedium" style={styles.emptyTitle}>
          사주 정보가 필요합니다
        </Text>
        <Text variant="bodyMedium" style={styles.emptyDesc}>
          운세를 보려면 먼저 사주를 등록해주세요
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('SajuInput')}
          style={styles.emptyButton}
          buttonColor={Colors.primary}
          textColor={Colors.white}
        >
          사주 등록하기
        </Button>
      </View>
    );
  }

  const todayMessage = useMemo(() => {
    if (!profile) return '';
    const myElement = getStemElement(profile.sajuData.pillars.day.stem);
    const todayPillar = getDayPillar(new Date());
    const relationship = getElementRelationship(myElement, todayPillar.element);
    return FORTUNE_MESSAGES[relationship] || '오늘 하루도 좋은 하루 되세요';
  }, [profile]);

  if (!todayFortune) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sajuBasis}>
              {profile.sajuData.name}님의 사주 데이터를 바탕으로 분석한 결과입니다
            </Text>
            <Text variant="titleMedium" style={styles.sectionTitle}>주간 종합운 추이</Text>
            <View style={styles.chartWrap}>
              <FortuneChart fortunes={weekFortunes} />
            </View>

            <View style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>오늘의 운세</Text>
            <View style={styles.summaryContent}>
              <BatteryScore score={todayFortune.overall} />
              <Text style={styles.fortuneMessage}>{todayMessage}</Text>
            </View>
            <RadarChart fortune={todayFortune} />
            <View style={styles.divider} />
            <View style={barStyles.container}>
              {CATEGORY_LIST.map((cat) => {
                const score = todayFortune[cat.key];
                const barColor = score > 60 ? Colors.success : score >= 20 ? Colors.warning : Colors.error;
                return (
                  <View key={cat.key} style={barStyles.row}>
                    <Text style={barStyles.label}>{cat.label}</Text>
                    <View style={barStyles.track}>
                      <View style={[barStyles.fill, { width: `${Math.max(4, score)}%`, backgroundColor: barColor }]} />
                    </View>
                    <Text style={[barStyles.score, { color: barColor }]}>{score}</Text>
                  </View>
                );
              })}
            </View>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('FortuneAnalysis', { sajuData: profile.sajuData, fortune: todayFortune })}
              style={styles.analyzeBtn}
              buttonColor={Colors.primary}
              textColor={Colors.white}
            >
              오늘의 운세 분석하기
            </Button>
          </Card.Content>
        </Card>
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
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: Colors.background,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: Colors.text,
  },
  emptyDesc: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {},
  card: {
    marginBottom: spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    elevation: 0,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
    color: Colors.text,
  },
  chartWrap: {
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: spacing.lg,
  },
  summaryContent: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  fortuneMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  analyzeBtn: {
    marginTop: spacing.lg,
    borderRadius: 12,
  },
  sajuBasis: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
