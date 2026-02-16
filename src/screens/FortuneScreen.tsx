import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../constants/saju';
import { useSajuStore } from '../store/useSajuStore';
import { getTodayPillar } from '../services/saju/calculator';
import { getStemElement, getElementRelationship } from '../services/saju/elements';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FortuneScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { history, loadHistory } = useSajuStore();

  useEffect(() => {
    loadHistory();
  }, []);

  const latestSaju = history.length > 0 ? history[0] : null;

  // 오늘의 일주 계산
  const todayPillar = useMemo(() => {
    return getTodayPillar();
  }, []);

  // 간단한 운세 점수 생성 (일간 기반)
  const fortune = useMemo(() => {
    if (!latestSaju) return null;

    const myDayStem = latestSaju.pillars.day.stem;
    const myElement = getStemElement(myDayStem);
    const todayElement = todayPillar.element;

    const relationship = getElementRelationship(myElement, todayElement);

    let baseScore: number;
    switch (relationship) {
      case '상생 (生)': baseScore = 85; break;
      case '역생 (被生)': baseScore = 80; break;
      case '같은 오행': baseScore = 75; break;
      case '중립': baseScore = 65; break;
      case '상극 (剋)': baseScore = 50; break;
      case '역극 (被剋)': baseScore = 45; break;
      default: baseScore = 60;
    }

    const dayVariation = (new Date().getDate() * 7 + new Date().getMonth() * 13) % 20 - 10;

    const overall = Math.min(100, Math.max(0, baseScore + dayVariation));
    const wealth = Math.min(100, Math.max(0, baseScore + ((dayVariation + 5) % 15)));
    const career = Math.min(100, Math.max(0, baseScore + ((dayVariation + 8) % 12)));
    const love = Math.min(100, Math.max(0, baseScore + ((dayVariation + 3) % 18) - 5));
    const health = Math.min(100, Math.max(0, baseScore + ((dayVariation + 11) % 10)));

    const advices: Record<string, string> = {
      '상생 (生)': '오늘은 기운이 조화를 이루는 좋은 날입니다. 새로운 도전에 적합합니다.',
      '역생 (被生)': '도움을 받을 수 있는 날입니다. 주변의 조언에 귀 기울이세요.',
      '같은 오행': '안정적인 하루가 될 것입니다. 계획했던 일을 추진하세요.',
      '중립': '무난한 하루입니다. 평소대로 꾸준히 진행하면 좋습니다.',
      '상극 (剋)': '도전적인 하루가 될 수 있습니다. 신중하게 행동하세요.',
      '역극 (被剋)': '에너지 소모가 클 수 있습니다. 충분한 휴식을 취하세요.',
    };

    return {
      overall,
      wealth,
      career,
      love,
      health,
      relationship,
      myElement,
      todayElement,
      advice: advices[relationship] || '오늘 하루도 좋은 하루 되세요.',
    };
  }, [latestSaju, todayPillar]);

  if (!latestSaju) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>命</Text>
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 오늘의 날짜 & 일주 */}
        <Card style={styles.card}>
          <Card.Content style={styles.todayHeader}>
            <Text variant="titleLarge" style={styles.todayTitle}>오늘의 운세</Text>
            <Text variant="bodyMedium" style={styles.todayDate}>
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </Text>
            <View style={styles.todayPillar}>
              <Text style={[styles.todayStem, { color: ELEMENT_COLORS[todayPillar.element] }]}>
                {todayPillar.stem}{todayPillar.branch}
              </Text>
              <Text variant="bodySmall" style={styles.todayElement}>
                {todayPillar.element} ({ELEMENT_NAMES[todayPillar.element]})
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* 나와의 관계 */}
        {fortune && (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>오행 관계</Text>
                <View style={styles.relationshipRow}>
                  <View style={styles.relationshipItem}>
                    <Text variant="bodySmall" style={styles.relationLabel}>내 일간</Text>
                    <Text style={[styles.elementBadge, { backgroundColor: ELEMENT_COLORS[fortune.myElement] }]}>
                      {fortune.myElement}
                    </Text>
                  </View>
                  <Text style={styles.relationshipArrow}>→</Text>
                  <View style={styles.relationshipItem}>
                    <Text variant="bodySmall" style={styles.relationLabel}>오늘</Text>
                    <Text style={[styles.elementBadge, { backgroundColor: ELEMENT_COLORS[fortune.todayElement] }]}>
                      {fortune.todayElement}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={styles.relationshipText}>
                    {fortune.relationship}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {/* 운세 점수 */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>운세 점수</Text>
                {[
                  { label: '종합운', score: fortune.overall, color: Colors.primary },
                  { label: '재물운', score: fortune.wealth, color: Colors.earth },
                  { label: '직업운', score: fortune.career, color: Colors.info },
                  { label: '애정운', score: fortune.love, color: Colors.fire },
                  { label: '건강운', score: fortune.health, color: Colors.success },
                ].map(({ label, score, color }) => (
                  <View key={label} style={styles.scoreRow}>
                    <Text variant="bodyMedium" style={styles.scoreLabel}>{label}</Text>
                    <View style={styles.scoreBarContainer}>
                      <ProgressBar progress={score / 100} color={color} style={styles.scoreBar} />
                    </View>
                    <Text variant="bodyMedium" style={styles.scoreValue}>{score}점</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>

            {/* 조언 */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>오늘의 조언</Text>
                <Text variant="bodyMedium" style={styles.advice}>{fortune.advice}</Text>
              </Card.Content>
            </Card>
          </>
        )}
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
  todayHeader: {
    alignItems: 'center',
  },
  todayTitle: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  todayDate: {
    color: Colors.textSecondary,
    marginTop: spacing.xs,
  },
  todayPillar: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  todayStem: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  todayElement: {
    color: Colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
    color: Colors.text,
  },
  relationshipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  relationshipItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  relationLabel: {
    color: Colors.textSecondary,
  },
  relationshipArrow: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  elementBadge: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    overflow: 'hidden',
  },
  relationshipText: {
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  scoreLabel: {
    width: 52,
    color: Colors.text,
  },
  scoreBarContainer: {
    flex: 1,
  },
  scoreBar: {
    height: 10,
    borderRadius: 5,
  },
  scoreValue: {
    width: 40,
    textAlign: 'right',
    fontWeight: 'bold',
    color: Colors.text,
  },
  advice: {
    lineHeight: 24,
    color: Colors.text,
  },
});
