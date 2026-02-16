import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { GoogleGenAI } from '@google/genai';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { getStemElement, getElementRelationship } from '../services/saju/elements';
import { getDayPillar } from '../services/saju/calculator';
import { SajuData } from '../types/saju';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

type FortuneAnalysisRoute = RouteProp<RootStackParamList, 'FortuneAnalysis'>;

function buildFortunePrompt(sajuData: SajuData, fortune: RootStackParamList['FortuneAnalysis']['fortune']): string {
  const { pillars } = sajuData;
  const myElement = getStemElement(pillars.day.stem);
  const todayPillar = getDayPillar(new Date());
  const relationship = getElementRelationship(myElement, todayPillar.element);

  return `당신은 사주 전문가입니다. 아래 사주 정보와 오늘의 운세 점수를 바탕으로 카테고리별 상세 운세 풀이를 작성해주세요.

[사주 정보]
- 이름: ${sajuData.name}
- 성별: ${sajuData.gender === 'male' ? '남' : '여'}
- 사주 팔자: ${pillars.year.stem}${pillars.year.branch} ${pillars.month.stem}${pillars.month.branch} ${pillars.day.stem}${pillars.day.branch} ${pillars.hour.stem}${pillars.hour.branch}
- 일간(나를 나타내는 글자): ${pillars.day.stem} (${myElement})
- 오늘 일주: ${todayPillar.stem}${todayPillar.branch} (${todayPillar.element})
- 오늘과의 관계: ${relationship}

[오늘 카테고리별 점수 (100점 만점)]
- 종합운: ${fortune.overall}점
- 재물운: ${fortune.wealth}점
- 직업운: ${fortune.career}점
- 애정운: ${fortune.love}점
- 건강운: ${fortune.health}점
- 대인운: ${fortune.social}점

아래 형식으로 각 카테고리별 운세를 작성해주세요:
- 각 카테고리 제목을 **굵게** 표시
- 각 카테고리 2~3문장으로 구체적이고 실용적인 조언
- 마지막에 오늘의 총평을 2~3문장으로 작성
- 한국어로 자연스럽고 따뜻한 톤으로 작성
- 점수가 높으면 긍정적, 낮으면 주의사항 위주로 작성`;
}

function BlinkingCursor() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 530, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 530, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return <Animated.View style={[styles.cursor, { opacity }]} />;
}

export default function FortuneAnalysisScreen() {
  const { params } = useRoute<FortuneAnalysisRoute>();
  const { sajuData, fortune } = params;

  const [streamingText, setStreamingText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        console.log('API Key loaded:', GEMINI_API_KEY ? `${GEMINI_API_KEY.slice(0, 8)}...` : 'EMPTY');
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const prompt = buildFortunePrompt(sajuData, fortune);
        const stream = await ai.models.generateContentStream({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });

        let fullText = '';
        for await (const chunk of stream) {
          if (cancelled) return;
          if (chunk.text) {
            fullText += chunk.text;
            setStreamingText(fullText);
            setIsLoading(false);
            setIsStreaming(true);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
          }
        }
        if (!cancelled) {
          setIsStreaming(false);
          setIsDone(true);
        }
      } catch (e: any) {
        console.error('FortuneAnalysis error:', e);
        if (!cancelled) {
          const msg = e?.message || '';
          const isRateLimit = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
          setStreamingText(isRateLimit
            ? 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
            : `분석 중 오류가 발생했습니다: ${msg || '알 수 없는 오류'}`);
          setIsLoading(false);
          setIsStreaming(false);
          setIsDone(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [sajuData, fortune]);

  return (
    <ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerName}>{sajuData.name}님의 오늘의 운세</Text>
        <Text style={styles.headerSaju}>
          {sajuData.pillars.year.stem}{sajuData.pillars.year.branch}{' '}
          {sajuData.pillars.month.stem}{sajuData.pillars.month.branch}{' '}
          {sajuData.pillars.day.stem}{sajuData.pillars.day.branch}{' '}
          {sajuData.pillars.hour.stem}{sajuData.pillars.hour.branch}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.contentCard}>
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>AI가 운세를 분석하고 있습니다...</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.analysisText}>{streamingText}</Text>
            {isStreaming && <BlinkingCursor />}
          </View>
        )}
      </View>

      {isDone && (
        <Text style={styles.disclaimer}>AI가 생성한 운세 풀이로, 재미로 참고해주세요.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: spacing.md, paddingBottom: 60 },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerName: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  headerSaju: { fontSize: 15, fontWeight: '600', color: Colors.primary, letterSpacing: 2 },
  contentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 200,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  analysisText: { fontSize: 15, lineHeight: 26, color: Colors.text },
  cursor: { width: 2, height: 18, backgroundColor: Colors.primary, marginTop: 2 },
  disclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
