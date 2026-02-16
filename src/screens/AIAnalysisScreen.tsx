import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { ELEMENT_NAMES, STEM_YIN_YANG, BRANCH_YIN_YANG } from '../constants/saju';
import { SajuData } from '../types/saju';
import { formatSaju, getBasicPersonality } from '../services/saju/calculator';
import { calculateTenGods, getInnateTenGod } from '../services/saju/tenGods';
import { calculateTwelveStages } from '../services/saju/twelveStages';
import { getDayAnimal } from '../services/saju/animals';
import { calculateElementBalance, getStemElement } from '../services/saju/elements';
import { GoogleGenAI } from '@google/genai';

type AIRouteProp = RouteProp<RootStackParamList, 'AIAnalysis'>;

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

function getYinYangDistribution(pillars: SajuData['pillars']): { yang: number; yin: number } {
  const stems = [pillars.year.stem, pillars.month.stem, pillars.day.stem, pillars.hour.stem];
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch];

  let yang = 0;
  let yin = 0;

  stems.forEach((s) => { STEM_YIN_YANG[s] === 'yang' ? yang++ : yin++; });
  branches.forEach((b) => { BRANCH_YIN_YANG[b] === 'yang' ? yang++ : yin++; });

  return { yang, yin };
}

function buildEnrichedPrompt(sajuData: SajuData): string {
  const { year, month, day, hour } = sajuData.pillars;
  const tenGods = calculateTenGods(sajuData.pillars);
  const innateTenGod = getInnateTenGod(sajuData.pillars);
  const twelveStages = calculateTwelveStages(sajuData.pillars);
  const dayAnimal = getDayAnimal(day.stem, day.branch);
  const balance = calculateElementBalance(sajuData.elements);
  const yinYang = getYinYangDistribution(sajuData.pillars);

  return `당신은 전문 사주팔자 분석가입니다. 아래 상세 정보를 바탕으로 깊이 있는 분석을 해주세요.

대상: ${sajuData.name} (${sajuData.gender === 'male' ? '남성' : '여성'})

【사주팔자】
시주  일주  월주  연주
━━━  ━━━  ━━━  ━━━
${hour.stem}    ${day.stem}    ${month.stem}    ${year.stem}
${hour.branch}    ${day.branch}    ${month.branch}    ${year.branch}

【십신 분석】(일간 ${day.stem} 기준)
천간: ${tenGods.stems[0]} | 일원 | ${tenGods.stems[2]} | ${tenGods.stems[3]}
지지: ${tenGods.branches[0]} | ${tenGods.branches[1]} | ${tenGods.branches[2]} | ${tenGods.branches[3]}
타고난 성향(일지): ${innateTenGod}

【십이운성】
시주: ${twelveStages[0]} | 일주: ${twelveStages[1]} | 월주: ${twelveStages[2]} | 연주: ${twelveStages[3]}

【일주 동물】${dayAnimal}

【오행 분석】
목: ${sajuData.elements.wood} | 화: ${sajuData.elements.fire} | 토: ${sajuData.elements.earth} | 금: ${sajuData.elements.metal} | 수: ${sajuData.elements.water}
강한 오행: ${sajuData.elements.dominant}(${ELEMENT_NAMES[sajuData.elements.dominant]}) | 약한 오행: ${sajuData.elements.weak}(${ELEMENT_NAMES[sajuData.elements.weak]})
균형도: ${balance}/100점

【음양 분포】양: ${yinYang.yang}개 | 음: ${yinYang.yin}개

위 정보를 종합하여 다음 항목들을 상세히 분석해주세요:

1. 종합 성격 분석 (십신과 십이운성 고려)
2. 직업/적성 분석 (일주 동물과 오행 균형 반영)
3. 재물운 (재성과 식신상관 분석)
4. 대인관계 (음양 균형과 관성 분석)
5. 건강 유의사항 (약한 오행 중심)
6. ${new Date().getFullYear()}년 운세 조언

한국어로 자세하고 친절하게, 실질적인 조언을 포함하여 작성해주세요.`;
}

function buildEnrichedLocalAnalysis(sajuData: SajuData): string {
  const { day } = sajuData.pillars;
  const personality = getBasicPersonality(day.stem);
  const tenGods = calculateTenGods(sajuData.pillars);
  const innateTenGod = getInnateTenGod(sajuData.pillars);
  const twelveStages = calculateTwelveStages(sajuData.pillars);
  const dayAnimal = getDayAnimal(day.stem, day.branch);
  const balance = calculateElementBalance(sajuData.elements);
  const yinYang = getYinYangDistribution(sajuData.pillars);
  const dayElement = day.element;
  const { dominant, weak } = sajuData.elements;

  const careerMap: Record<string, string> = {
    '목': '교육, 출판, 환경, 농업, 패션 분야에 적합합니다.',
    '화': '방송, 엔터테인먼트, 마케팅, 예술 분야에 적합합니다.',
    '토': '부동산, 건설, 농업, 중개업 분야에 적합합니다.',
    '금': '금융, 법률, IT, 기계 분야에 적합합니다.',
    '수': '무역, 유통, 관광, 연구 분야에 적합합니다.',
  };

  const healthMap: Record<string, string> = {
    '목': '간, 담, 눈 건강에 유의하세요. 녹색 채소를 충분히 섭취하세요.',
    '화': '심장, 혈액순환에 유의하세요. 적절한 유산소 운동을 권합니다.',
    '토': '위장, 소화기 건강에 유의하세요. 규칙적인 식사가 중요합니다.',
    '금': '폐, 호흡기 건강에 유의하세요. 깊은 호흡 운동을 추천합니다.',
    '수': '신장, 방광 건강에 유의하세요. 충분한 수분 섭취가 중요합니다.',
  };

  const relMap: Record<string, string> = {
    '목': '곧은 성격으로 신뢰감을 주지만, 때로 고집이 세 보일 수 있습니다.',
    '화': '밝고 사교적이지만, 성급한 면이 있을 수 있습니다.',
    '토': '믿음직하고 안정적이지만, 보수적일 수 있습니다.',
    '금': '원칙적이고 정의로운 성격이지만, 날카로워 보일 수 있습니다.',
    '수': '지혜롭고 융통성 있지만, 우유부단해 보일 수 있습니다.',
  };

  const wealthMap: Record<string, string> = {
    '금': '재물에 대한 감각이 뛰어납니다.',
    '수': '재물 흐름을 잘 파악합니다.',
    '토': '안정적인 재테크에 강합니다.',
    '화': '투자에 대한 직감이 좋습니다.',
    '목': '꾸준한 성장형 재테크가 적합합니다.',
  };

  return `【일주 동물】
${dayAnimal}

【종합 성격 분석】
${personality}

타고난 성향은 "${innateTenGod}"입니다. 일주의 십이운성은 "${twelveStages[1]}"로, 현재 삶의 에너지 단계를 나타냅니다.
음양 분포는 양 ${yinYang.yang}개, 음 ${yinYang.yin}개로 ${yinYang.yang > yinYang.yin ? '양의 기운이 강하여 외향적이고 적극적인 면이 돋보입니다.' : yinYang.yang < yinYang.yin ? '음의 기운이 강하여 내면이 깊고 신중한 면이 돋보입니다.' : '음양이 균형을 이루어 조화로운 성격을 가지고 있습니다.'}

【직업/적성 분석】
일간이 ${dayElement}(${ELEMENT_NAMES[dayElement]})인 분은 ${careerMap[dayElement]}

【재물운】
${dominant} 기운이 강하여 ${wealthMap[dominant]}

【대인관계】
${relMap[dayElement]}

【건강 유의사항】
${weak}(${ELEMENT_NAMES[weak]}) 기운이 약합니다. ${healthMap[weak]}

【오행 균형】
균형도 ${balance}/100점. ${balance >= 70 ? '오행이 비교적 균형을 이루고 있습니다.' : balance >= 40 ? '일부 오행의 편중이 있어 보완이 필요합니다.' : '오행 편중이 심하므로 약한 오행을 보충하는 것이 좋습니다.'}`;
}

/** 블링킹 커서 */
function BlinkingCursor() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  return <View style={[styles.cursor, { opacity: visible ? 1 : 0 }]} />;
}

export default function AIAnalysisScreen() {
  const route = useRoute<AIRouteProp>();
  const { sajuData } = route.params;
  const { year, month, day, hour } = sajuData.pillars;

  const [analysis, setAnalysis] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasApiKey = !!GEMINI_API_KEY && GEMINI_API_KEY !== 'your_api_key_here';
  const scrollViewRef = useRef<ScrollView>(null);

  const dayAnimal = getDayAnimal(day.stem, day.branch);

  const requestAIAnalysis = async () => {
    if (!hasApiKey) {
      setAnalysis(buildEnrichedLocalAnalysis(sajuData));
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    setStreamingText('');
    setAnalysis('');

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = buildEnrichedPrompt(sajuData);

      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      let fullText = '';
      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
          setStreamingText(fullText);
          setIsLoading(false);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }

      setAnalysis(fullText);
    } catch (e: any) {
      setError(e.message || '알 수 없는 오류가 발생했습니다');
      setAnalysis(buildEnrichedLocalAnalysis(sajuData));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    requestAIAnalysis();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <View style={styles.content}>
        {/* 헤더 카드 */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <Text style={styles.headerName}>
              {sajuData.name}님의 사주
            </Text>
            <Text style={styles.headerSubtitle}>
              {sajuData.gender === 'male' ? '남성' : '여성'} · {dayAnimal}
            </Text>
            <Text style={styles.pillarSummary}>
              {year.stem}{year.branch} {month.stem}{month.branch} {day.stem}{day.branch} {hour.stem}{hour.branch}
            </Text>
          </Card.Content>
        </Card>

        {/* 분석 콘텐츠 카드 */}
        <Card style={styles.contentCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              {hasApiKey ? 'AI 사주 분석' : '사주 분석'}
            </Text>

            {/* 로딩 */}
            {isLoading && !streamingText && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>
                  AI가 사주를 분석하고 있습니다...
                </Text>
              </View>
            )}

            {/* 스트리밍 중 */}
            {isStreaming && streamingText ? (
              <View>
                <Text style={styles.analysisText}>{streamingText}</Text>
                <BlinkingCursor />
              </View>
            ) : null}

            {/* 최종 결과 */}
            {!isStreaming && analysis ? (
              <Text style={styles.analysisText}>{analysis}</Text>
            ) : null}

            {/* 에러 + 다시 시도 */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  분석 중 오류가 발생했습니다
                </Text>
                <Button
                  mode="outlined"
                  onPress={requestAIAnalysis}
                  style={styles.retryButton}
                  textColor={Colors.primary}
                >
                  다시 시도
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* API 키 안내 */}
        {!hasApiKey && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.infoText}>
                Gemini API 키를 설정하면 AI 기반 상세 분석을 받을 수 있습니다.
              </Text>
            </Card.Content>
          </Card>
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

  // 헤더 카드
  headerCard: {
    marginBottom: spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    elevation: 0,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: spacing.xs,
  },
  pillarSummary: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: spacing.sm,
    letterSpacing: 2,
  },

  // 콘텐츠 카드
  contentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    elevation: 0,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: Colors.text,
  },

  // 로딩
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },

  // 분석 텍스트
  analysisText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
  },

  // 커서
  cursor: {
    width: 2,
    height: 18,
    backgroundColor: Colors.primary,
    marginTop: spacing.xs,
    borderRadius: 1,
  },

  // 에러
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    borderColor: Colors.primary,
  },

  // 안내 카드
  infoCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    elevation: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
