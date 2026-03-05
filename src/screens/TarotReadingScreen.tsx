import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';
import { useSajuStore } from '../store/useSajuStore';
import { getStemElement } from '../services/saju/elements';
import { RootStackParamList } from '../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PICK_COLS = 7;
const PICK_GAP = 6;
const PICK_CARD_W = (SCREEN_WIDTH - spacing.md * 2 - PICK_GAP * (PICK_COLS - 1)) / PICK_COLS;
const PICK_CARD_H = PICK_CARD_W * 1.45;

const RESULT_CARD_W = (SCREEN_WIDTH - spacing.md * 2 - 24) / 3;
const RESULT_CARD_H = RESULT_CARD_W * 1.6;

const TAROT_CARDS = [
  { name: '마법사', meaning: '새로운 시작, 의지와 창조', reversed: '우유부단, 재능 낭비', emoji: '🧙' },
  { name: '여사제', meaning: '직감, 내면의 지혜', reversed: '비밀, 감춰진 진실', emoji: '🌙' },
  { name: '여황제', meaning: '풍요, 모성, 자연의 은혜', reversed: '의존, 불안정', emoji: '👑' },
  { name: '황제', meaning: '권위, 안정, 리더십', reversed: '독단, 경직된 사고', emoji: '🦁' },
  { name: '교황', meaning: '가르침, 전통, 신뢰', reversed: '독선, 형식주의', emoji: '📿' },
  { name: '연인', meaning: '사랑, 조화, 선택', reversed: '갈등, 불균형', emoji: '💕' },
  { name: '전차', meaning: '승리, 전진, 강한 의지', reversed: '방향 상실, 폭주', emoji: '⚡' },
  { name: '힘', meaning: '용기, 인내, 내면의 힘', reversed: '자기 의심, 나약함', emoji: '🔥' },
  { name: '은둔자', meaning: '성찰, 탐구, 내면의 빛', reversed: '고립, 외로움', emoji: '🏔️' },
  { name: '운명의 수레바퀴', meaning: '전환, 행운, 순환', reversed: '불운, 저항', emoji: '☸️' },
  { name: '정의', meaning: '공정, 진실, 균형', reversed: '불공정, 편견', emoji: '⚖️' },
  { name: '매달린 사람', meaning: '인내, 새로운 관점', reversed: '희생, 지연', emoji: '🔄' },
  { name: '죽음', meaning: '변화, 끝과 새 시작', reversed: '변화 거부, 집착', emoji: '🦋' },
  { name: '절제', meaning: '균형, 조화, 절제', reversed: '불균형, 과잉', emoji: '🏺' },
  { name: '악마', meaning: '속박, 유혹, 욕망', reversed: '해방, 자유', emoji: '⛓️' },
  { name: '탑', meaning: '급변, 해방, 깨달음', reversed: '혼란 회피, 두려움', emoji: '🗼' },
  { name: '별', meaning: '희망, 영감, 평화', reversed: '절망, 의미 상실', emoji: '⭐' },
  { name: '달', meaning: '환상, 불안, 잠재의식', reversed: '혼란 해소, 직감', emoji: '🌕' },
  { name: '태양', meaning: '기쁨, 성공, 활력', reversed: '낙관 과잉, 지연', emoji: '☀️' },
  { name: '심판', meaning: '부활, 판단, 각성', reversed: '자기 비판, 후회', emoji: '📯' },
  { name: '세계', meaning: '완성, 성취, 조화', reversed: '미완성, 지연', emoji: '🌍' },
];

type TarotCard = typeof TAROT_CARDS[0];

const CATEGORY_ADVICE: Record<string, Record<string, string>> = {
  love: {
    '목': '새로운 인연이 싹트는 시기입니다',
    '화': '뜨거운 감정에 솔직해져도 좋습니다',
    '토': '안정된 관계가 신뢰를 쌓아갑니다',
    '금': '냉철한 판단이 좋은 인연을 가려냅니다',
    '수': '감성을 열면 깊은 만남이 옵니다',
  },
  money: {
    '목': '성장하는 투자에 기회가 있습니다',
    '화': '과감한 결단이 재물을 부릅니다',
    '토': '꾸준한 저축이 큰 부를 만듭니다',
    '금': '정리와 절제가 재물의 열쇠입니다',
    '수': '유동적인 자산 관리가 유리합니다',
  },
  career: {
    '목': '새로운 도전이 성장을 이끕니다',
    '화': '열정으로 임하면 인정을 받습니다',
    '토': '묵묵한 실력이 기회를 만듭니다',
    '금': '체계적인 정리가 성과를 높입니다',
    '수': '유연한 대처가 돌파구를 열어줍니다',
  },
  health: {
    '목': '간과 근육 관리에 신경 쓰세요',
    '화': '심장과 혈액순환을 챙기세요',
    '토': '소화기 건강에 주의하세요',
    '금': '호흡기와 피부를 돌보세요',
    '수': '신장과 수분 섭취에 신경 쓰세요',
  },
  daily: {
    '목': '성장과 새로운 시작의 기운이 함께합니다',
    '화': '열정과 변화의 기운이 카드에 담겼습니다',
    '토': '안정과 신뢰의 기운이 길을 비춥니다',
    '금': '결단과 명확함의 기운이 함께합니다',
    '수': '지혜와 유연함의 기운이 깃들었습니다',
  },
  yesno: {
    '목': '긍정적인 방향으로 흐르고 있습니다',
    '화': '강한 의지가 답을 이끌어냅니다',
    '토': '신중한 판단이 바른 길입니다',
    '금': '명확한 기준으로 결정하세요',
    '수': '직감을 믿어도 좋습니다',
  },
  timeline: {
    '목': '성장과 새로운 시작의 기운이 함께합니다',
    '화': '열정과 변화의 기운이 카드에 담겼습니다',
    '토': '안정과 신뢰의 기운이 길을 비춥니다',
    '금': '결단과 명확함의 기운이 함께합니다',
    '수': '지혜와 유연함의 기운이 깃들었습니다',
  },
  advice: {
    '목': '나아감 속에 답이 있습니다',
    '화': '마음의 소리에 귀 기울이세요',
    '토': '기다림도 하나의 지혜입니다',
    '금': '비울수록 채워지는 법입니다',
    '수': '흐름에 몸을 맡겨보세요',
  },
};

export default function TarotReadingScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'TarotReading'>>();
  const { category, count, positions } = route.params;
  const profile = useSajuStore((s) => s.activeProfile());

  const [phase, setPhase] = useState<'picking' | 'result'>('picking');
  const [shuffledCards, setShuffledCards] = useState<TarotCard[]>([]);
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  const [pickedCards, setPickedCards] = useState<{ card: TarotCard; reversed: boolean }[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const flipAnims = useRef<Animated.Value[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const seed = profile
      ? profile.sajuData.name.charCodeAt(0) + new Date().getDate() + category.charCodeAt(0)
      : new Date().getTime();
    const shuffled = [...TAROT_CARDS]
      .map((c, i) => ({ card: c, sort: (seed * (i + 7) * 13 + i * 31) % 1000 }))
      .sort((a, b) => a.sort - b.sort)
      .map((c) => c.card);
    setShuffledCards(shuffled);
    flipAnims.current = Array.from({ length: count }, () => new Animated.Value(0));
  }, []);

  const pickCard = useCallback((index: number) => {
    setPickedIndices(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      if (prev.length >= count) return prev;
      return [...prev, index];
    });
  }, [count]);

  const confirmSelection = useCallback(() => {
    // 완전 랜덤: 전체 카드에서 count장을 랜덤으로 뽑고 방향도 랜덤
    const pool = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    const results = pool.slice(0, count).map(card => ({
      card,
      reversed: Math.random() < 0.35,
    }));
    setPickedCards(results);
    setPhase('result');
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
    results.forEach((_, i) => {
      setTimeout(() => {
        Animated.spring(flipAnims.current[i], {
          toValue: 1, useNativeDriver: true, tension: 40, friction: 8,
        }).start();
        setRevealedCount((c) => c + 1);
      }, i * 500);
    });
  }, [count, fadeAnim]);

  const getAdvice = () => {
    if (!profile) return '';
    const element = getStemElement(profile.sajuData.pillars.day.stem);
    return CATEGORY_ADVICE[category]?.[element] || '';
  };

  const getYesNo = () => {
    if (category !== 'yesno' || pickedCards.length === 0) return null;
    const card = pickedCards[0];
    return card.reversed ? 'No' : 'Yes';
  };

  if (phase === 'picking') {
    const allSelected = pickedIndices.length === count;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.pickContent}>
          <Text style={styles.pickTitle}>
            카드를 {count}장 선택하세요 ({pickedIndices.length}/{count})
          </Text>
          <Text style={styles.pickSubtitle}>직감을 따라 끌리는 카드를 골라주세요</Text>
          <View style={styles.cardGrid}>
            {shuffledCards.map((_, index) => {
              const isPicked = pickedIndices.includes(index);
              const pickOrder = isPicked ? pickedIndices.indexOf(index) + 1 : 0;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.cardBack, isPicked && styles.cardBackPicked]}
                  onPress={() => pickCard(index)}
                  activeOpacity={0.7}
                  disabled={false}
                >
                  <Text style={styles.cardBackSymbol}>{isPicked ? '✓' : '✦'}</Text>
                  <Text style={styles.cardBackNumber}>{isPicked ? pickOrder : index + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.bottomArea}>
          <View style={styles.confirmBar}>
            <TouchableOpacity style={styles.resetBtn} onPress={() => setPickedIndices([])} activeOpacity={0.7}>
              <Text style={styles.resetBtnText}>다시 고르기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !allSelected && styles.confirmBtnDisabled]}
              onPress={confirmSelection}
              activeOpacity={0.7}
              disabled={!allSelected}
            >
              <Text style={[styles.confirmBtnText, !allSelected && styles.confirmBtnTextDisabled]}>결과 보기</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.adBanner}>
            <Text style={styles.adEmoji}>🔮</Text>
            <View style={styles.adTextWrap}>
              <Text style={styles.adTitle}>프리미엄 타로 상담</Text>
              <Text style={styles.adDesc}>전문 타로마스터의 1:1 리딩</Text>
            </View>
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText}>AD</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const advice = getAdvice();
  const yesNo = getYesNo();

  return (
    <Animated.ScrollView style={[styles.container, { opacity: fadeAnim }]} contentContainerStyle={styles.resultContent}>
      {yesNo && (
        <View style={styles.yesNoWrap}>
          <Text style={[styles.yesNoText, { color: yesNo === 'Yes' ? Colors.success : Colors.error }]}>
            {yesNo}
          </Text>
        </View>
      )}

      <View style={styles.resultCards}>
        {pickedCards.map((picked, i) => {
          const anim = flipAnims.current[i];
          const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.1, 1] });
          const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.5, 1] });

          return (
            <Animated.View key={i} style={[styles.resultCard, { transform: [{ scale }], opacity }]}>
              <Text style={styles.positionLabel}>{positions[i]}</Text>
              <Text style={styles.cardEmoji}>{picked.card.emoji}</Text>
              <Text style={styles.cardName}>
                {picked.card.name}
                {picked.reversed && <Text style={styles.reversedTag}> 역방향</Text>}
              </Text>
              <Text style={styles.cardMeaning}>
                {picked.reversed ? picked.card.reversed : picked.card.meaning}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      {revealedCount >= count && (
        <>
          {advice ? (
            <View style={styles.adviceBox}>
              <Text style={styles.adviceLabel}>사주 기반 조언</Text>
              <Text style={styles.adviceText}>{advice}</Text>
            </View>
          ) : null}
        </>
      )}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  bottomArea: { backgroundColor: Colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  pickContent: { padding: spacing.md },
  resultContent: { padding: spacing.md, paddingBottom: 100 },

  pickTitle: {
    fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center',
    marginBottom: 4, marginTop: spacing.sm,
  },
  pickSubtitle: {
    fontSize: 13, color: Colors.textSecondary, textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cardGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: PICK_GAP,
  },
  cardBack: {
    width: PICK_CARD_W, height: PICK_CARD_H, borderRadius: 8,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4,
  },
  cardBackPicked: { backgroundColor: Colors.primaryLight, opacity: 0.85 },
  cardBackSymbol: { fontSize: 18, color: 'rgba(255,255,255,0.7)' },
  cardBackNumber: { fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  confirmBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
  },
  resetBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.surfaceLight, alignItems: 'center',
  },
  resetBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  confirmBtnDisabled: { backgroundColor: Colors.gray300 },
  confirmBtnTextDisabled: { color: Colors.textMuted },

  yesNoWrap: { alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.sm },
  yesNoText: { fontSize: 48, fontWeight: '800' },

  resultCards: {
    gap: 14, marginBottom: spacing.lg,
  },
  resultCard: {
    backgroundColor: Colors.surface, borderRadius: 20,
    padding: spacing.lg, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10,
  },
  positionLabel: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 10, letterSpacing: 1 },
  cardEmoji: { fontSize: 52, marginBottom: 12 },
  cardName: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  reversedTag: { fontSize: 13, fontWeight: '600', color: Colors.error },
  cardMeaning: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  adviceBox: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: spacing.md,
    marginBottom: spacing.md,
  },
  adviceLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginBottom: 6 },
  adviceText: { fontSize: 14, color: Colors.text, lineHeight: 22 },

  adBanner: {
    height: 64, backgroundColor: Colors.surface, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  adEmoji: { fontSize: 28, marginRight: 12 },
  adTextWrap: { flex: 1 },
  adTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  adDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  adBadge: {
    backgroundColor: Colors.gray300, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  adBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
});
