import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Svg, { Polygon, Line, Circle as SvgCircle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { useSajuStore } from '../store/useSajuStore';
import { getDayPillar } from '../services/saju/calculator';
import { getStemElement, getElementRelationship } from '../services/saju/elements';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HexKey = 'overall' | 'wealth' | 'career' | 'love' | 'health' | 'social';

const HEX_CATEGORIES: { key: HexKey; label: string; color: string }[] = [
  { key: 'overall', label: '종합운', color: '#5856D6' },
  { key: 'wealth', label: '재물운', color: '#FF9500' },
  { key: 'career', label: '직업운', color: '#007AFF' },
  { key: 'love', label: '애정운', color: '#FF2D55' },
  { key: 'health', label: '건강운', color: '#34C759' },
  { key: 'social', label: '대인운', color: '#AF52DE' },
];

const CATEGORY_MESSAGES: Record<HexKey, { high: string; mid: string; low: string }> = {
  overall: {
    high: '전반적으로 좋은 기운이 흐르는 하루입니다. 자신감을 갖고 적극적으로 행동하세요.',
    mid: '무난한 하루가 예상됩니다. 꾸준히 노력하면 좋은 결과가 따릅니다.',
    low: '컨디션 관리에 유의하세요. 무리하지 말고 차분하게 하루를 보내세요.',
  },
  wealth: {
    high: '재물운이 상승하는 날입니다. 투자나 재테크에 좋은 소식이 있을 수 있습니다.',
    mid: '금전적으로 안정적인 흐름입니다. 계획된 지출 위주로 관리하세요.',
    low: '충동적인 소비를 자제하세요. 큰 지출은 미루는 것이 좋습니다.',
  },
  career: {
    high: '업무에서 성과를 낼 수 있는 날입니다. 중요한 프로젝트에 집중하세요.',
    mid: '업무가 순조롭게 진행됩니다. 기본에 충실하면 좋은 평가를 받습니다.',
    low: '직장에서 신중한 판단이 필요합니다. 중요한 결정은 다음으로 미루세요.',
  },
  love: {
    high: '연인과의 관계가 더욱 깊어지는 날입니다. 솔로라면 좋은 만남이 기대됩니다.',
    mid: '애정 관계가 편안하게 유지됩니다. 상대에게 따뜻한 말 한마디를 건네보세요.',
    low: '감정적인 오해가 생기기 쉽습니다. 대화할 때 상대의 말에 귀 기울이세요.',
  },
  health: {
    high: '활력이 넘치는 하루입니다. 운동이나 야외 활동을 즐기기 좋습니다.',
    mid: '건강 상태가 양호합니다. 규칙적인 생활 리듬을 유지하세요.',
    low: '피로가 쌓이기 쉬운 날입니다. 충분한 수면과 휴식을 취하세요.',
  },
  social: {
    high: '대인관계에서 좋은 인연이 찾아옵니다. 모임이나 네트워킹에 적극 참여하세요.',
    mid: '주변 사람들과 원만한 관계를 유지합니다. 소소한 대화가 힘이 됩니다.',
    low: '사람들과의 마찰에 주의하세요. 말을 아끼고 경청하는 자세가 필요합니다.',
  },
};

function getCategoryMessage(key: HexKey, score: number): string {
  const msgs = CATEGORY_MESSAGES[key];
  if (score > 60) return msgs.high;
  if (score >= 20) return msgs.mid;
  return msgs.low;
}

const CARD_PADDING = 16;
const CHART_SIZE = SCREEN_WIDTH - spacing.md * 2 - CARD_PADDING * 2;
const CENTER = CHART_SIZE / 2;
const RADIUS = CHART_SIZE / 2 - 36;

function getHexPt(index: number, radius: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

function hexPts(radius: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const p = getHexPt(i, radius);
    return `${p.x},${p.y}`;
  }).join(' ');
}

function HexagonChart({ scores }: { scores: Record<HexKey, number> }) {
  const dataPoints = HEX_CATEGORIES.map((cat, i) => {
    const r = (scores[cat.key] / 100) * RADIUS;
    return getHexPt(i, r);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={chartStyles.wrap}>
      <View style={{ position: 'relative', alignItems: 'center' }}>
        <Svg width={CHART_SIZE} height={CHART_SIZE} style={{ marginVertical: spacing.sm }}>
          <Defs>
            <LinearGradient id="hexFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#007AFF" stopOpacity="0.2" />
              <Stop offset="1" stopColor="#5AC8FA" stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <Polygon key={ratio} points={hexPts(RADIUS * ratio)} fill="none" stroke={Colors.border} strokeWidth={0.8} />
          ))}

          {HEX_CATEGORIES.map((_, i) => {
            const p = getHexPt(i, RADIUS);
            return <Line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke={Colors.border} strokeWidth={0.5} />;
          })}

          <Polygon points={dataPolygon} fill="url(#hexFill)" stroke="#007AFF" strokeWidth={2} strokeLinejoin="round" />

          {dataPoints.map((p, i) => (
            <SvgCircle key={i} cx={p.x} cy={p.y} r={4} fill={Colors.white} stroke="#007AFF" strokeWidth={2} />
          ))}
        </Svg>

        {HEX_CATEGORIES.map((cat, i) => {
          const p = getHexPt(i, RADIUS + 24);
          const score = scores[cat.key];
          return (
            <View key={cat.key} style={[chartStyles.labelWrap, { left: p.x - 28, top: p.y - 18 + spacing.sm }]}>
              <Text style={chartStyles.labelText}>{cat.label}</Text>
              <Text style={chartStyles.labelScore}>{score}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  labelWrap: { position: 'absolute', width: 56, alignItems: 'center' },
  labelText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  labelScore: { fontSize: 13, fontWeight: '700', color: '#007AFF' },
});

export default function FortuneDetailScreen() {
  const { activeProfile } = useSajuStore();
  const profile = activeProfile();

  const hexScores = useMemo(() => {
    if (!profile) return null;
    const myElement = getStemElement(profile.sajuData.pillars.day.stem);
    const today = new Date();
    const pillar = getDayPillar(today);
    const relationship = getElementRelationship(myElement, pillar.element);
    const scoreMap: Record<string, number> = {
      '상생 (生)': 85, '역생 (被生)': 80, '같은 오행': 75,
      '중립': 65, '상극 (剋)': 50, '역극 (被剋)': 45,
    };
    const base = scoreMap[relationship] || 60;
    const dv = (today.getDate() * 7 + today.getMonth() * 13) % 20 - 10;
    return {
      overall: Math.min(100, Math.max(0, base + dv)),
      wealth:  Math.min(100, Math.max(0, base + ((dv + 5) % 15))),
      career:  Math.min(100, Math.max(0, base + ((dv + 8) % 12))),
      love:    Math.min(100, Math.max(0, base + ((dv + 3) % 18) - 5)),
      health:  Math.min(100, Math.max(0, base + ((dv + 11) % 10))),
      social:  Math.min(100, Math.max(0, base + ((dv + 7) % 14) - 3)),
    };
  }, [profile]);

  if (!profile || !hexScores) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sajuBasis}>
          {profile.sajuData.name}님의 사주 데이터를 바탕으로 분석한 결과입니다
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <HexagonChart scores={hexScores} />
          </Card.Content>
        </Card>

        {HEX_CATEGORIES.map((cat) => {
          const score = hexScores[cat.key];
          const barColor = score > 60 ? Colors.success : score >= 20 ? Colors.warning : Colors.error;
          return (
            <Card key={cat.key} style={styles.card}>
              <Card.Content>
                <View style={styles.catHeader}>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <Text style={[styles.catScore, { color: barColor }]}>{score}점</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.max(4, score)}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={styles.catDesc}>{getCategoryMessage(cat.key, score)}</Text>
              </Card.Content>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: spacing.md, paddingBottom: 48 },
  sajuBasis: {
    fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginBottom: spacing.md,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, elevation: 0, marginBottom: spacing.md,
  },
  catHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  catLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  catScore: { fontSize: 15, fontWeight: '700' },
  barTrack: {
    height: 6, borderRadius: 3, backgroundColor: Colors.surfaceLight, overflow: 'hidden', marginBottom: 12,
  },
  barFill: { height: '100%', borderRadius: 3 },
  catDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
});
