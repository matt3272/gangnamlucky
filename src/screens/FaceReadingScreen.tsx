import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { useSajuStore } from '../store/useSajuStore';
import { getStemElement } from '../services/saju/elements';
import { SajuData, Element } from '../types/saju';

/* ── 로컬 관상 분석 (나중에 API로 교체) ── */
interface FaceReadingResult {
  overall: { score: number; desc: string };
  impression: { label: string; desc: string };
  social: { score: number; desc: string };
  health: { score: number; desc: string };
  advice: string[];
}

const ELEMENT_TRAITS: Record<Element, { impression: string; social: string; health: string; advice: string }> = {
  '목': {
    impression: '부드럽고 인자한 인상으로, 주변 사람들에게 편안한 느낌을 줍니다.',
    social: '넓은 인맥을 가지며, 새로운 사람과도 쉽게 어울립니다.',
    health: '간과 눈 건강에 신경 쓰면 좋습니다. 초록색 음식이 도움됩니다.',
    advice: '창의적인 에너지를 활용하되, 지나친 고집은 줄이세요.',
  },
  '화': {
    impression: '밝고 활력 넘치는 인상으로, 첫인상이 강렬하고 기억에 남습니다.',
    social: '리더십이 있어 사람들이 따르지만, 때로 급한 성격이 오해를 살 수 있습니다.',
    health: '심장과 혈액순환에 주의하세요. 규칙적인 운동이 도움됩니다.',
    advice: '열정을 유지하되, 감정 조절에 힘쓰면 더 좋은 결과를 얻습니다.',
  },
  '토': {
    impression: '듬직하고 신뢰감을 주는 인상으로, 안정적인 느낌을 줍니다.',
    social: '깊은 신뢰 관계를 형성하며, 조율 능력이 뛰어납니다.',
    health: '소화기 건강에 유의하세요. 규칙적인 식습관이 중요합니다.',
    advice: '변화를 두려워하지 말고, 새로운 시도로 성장의 기회를 만드세요.',
  },
  '금': {
    impression: '단정하고 깔끔한 인상으로, 전문적이고 믿음직한 느낌을 줍니다.',
    social: '소수의 깊은 관계를 선호하며, 의리가 있습니다.',
    health: '폐와 호흡기에 신경 쓰세요. 맑은 공기 속 산책이 좋습니다.',
    advice: '완벽주의를 내려놓으면 마음이 편해지고 관계도 좋아집니다.',
  },
  '수': {
    impression: '지적이고 차분한 인상으로, 깊은 생각을 가진 사람으로 보입니다.',
    social: '관찰력이 뛰어나 상대방의 마음을 잘 읽으며, 조용한 배려가 강점입니다.',
    health: '신장과 방광 건강에 유의하세요. 충분한 수분 섭취가 중요합니다.',
    advice: '생각을 행동으로 옮기는 결단력을 기르면 큰 성과를 냅니다.',
  },
};

function analyzeFaceReading(sajuData: SajuData): FaceReadingResult {
  const element = getStemElement(sajuData.pillars.day.stem);
  const traits = ELEMENT_TRAITS[element];

  // 시드 기반 점수 (프로필마다 고정 결과)
  const seed = sajuData.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const overallScore = 60 + (seed % 30);
  const socialScore = 55 + ((seed * 3) % 35);
  const healthScore = 58 + ((seed * 7) % 32);

  const impressionLabels: Record<Element, string> = {
    '목': '인자상', '화': '귀인상', '토': '복덕상', '금': '관록상', '수': '문창상',
  };

  return {
    overall: {
      score: overallScore,
      desc: overallScore >= 80
        ? '매우 좋은 관상입니다. 오늘 하루 자신감을 가지고 활동하세요.'
        : overallScore >= 65
        ? '안정적인 관상입니다. 꾸준한 노력이 좋은 결과를 만듭니다.'
        : '차분하게 하루를 보내는 것이 좋겠습니다. 무리한 결정은 피하세요.',
    },
    impression: { label: impressionLabels[element], desc: traits.impression },
    social: { score: socialScore, desc: traits.social },
    health: { score: healthScore, desc: traits.health },
    advice: [
      traits.advice,
      '오늘은 밝은 표정을 유지하면 좋은 기운이 찾아옵니다.',
      element === '화' || element === '목'
        ? '활동적인 일에 집중하면 효율이 높은 하루입니다.'
        : '차분하게 계획을 세우고 실행하면 좋은 성과가 있습니다.',
    ],
  };
}

/* ── 로딩 애니메이션 ── */
function LoadingScanner() {
  const scanLine = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [scanLine]);

  const translateY = scanLine.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] });

  return (
    <Animated.View style={[loadingStyles.scanLine, { transform: [{ translateY }] }]} />
  );
}

const loadingStyles = StyleSheet.create({
  scanLine: {
    position: 'absolute', width: '80%', height: 3,
    backgroundColor: Colors.primary, borderRadius: 2, opacity: 0.7,
  },
});

/* ── 점수 뱃지 ── */
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? Colors.success : score >= 60 ? Colors.warning : Colors.info;
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: color + '18' }]}>
      <Text style={[badgeStyles.text, { color }]}>{score}점</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  text: { fontSize: 13, fontWeight: '700' },
});

/* ── 메인 화면 ── */
export default function FaceReadingScreen() {
  const { activeProfile } = useSajuStore();
  const profile = activeProfile();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FaceReadingResult | null>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;

  const pickImage = async (useCamera: boolean) => {
    const permFn = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== 'granted') return;

    const pickerFn = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const res = await pickerFn({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setResult(null);
    }
  };

  const handleAnalyze = () => {
    if (!profile) return;
    setAnalyzing(true);
    fadeIn.setValue(0);

    setTimeout(() => {
      const r = analyzeFaceReading(profile.sajuData);
      setResult(r);
      setAnalyzing(false);
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* 타이틀 */}
      <Text style={styles.heading}>관상으로 보는{'\n'}오늘의 운세</Text>
      <Text style={styles.subheading}>사진을 선택하고 AI 관상 분석을 받아보세요</Text>

      {/* 사진 영역 */}
      <View style={styles.photoCard}>
        {imageUri ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            {analyzing && <LoadingScanner />}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="person-circle-outline" size={64} color={Colors.gray400} />
            <Text style={styles.placeholderText}>사진을 선택해주세요</Text>
          </View>
        )}

        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(true)} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={20} color={Colors.primary} />
            <Text style={styles.photoBtnText}>카메라</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(false)} activeOpacity={0.7}>
            <Ionicons name="images-outline" size={20} color={Colors.primary} />
            <Text style={styles.photoBtnText}>갤러리</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 분석 버튼 */}
      {imageUri && !result && !analyzing && (
        <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze} activeOpacity={0.7}>
          <Text style={styles.analyzeBtnText}>관상 분석하기</Text>
        </TouchableOpacity>
      )}

      {analyzing && (
        <Text style={styles.analyzingText}>관상을 분석하고 있습니다...</Text>
      )}

      {/* 결과 */}
      {result && (
        <Animated.View style={{ opacity: fadeIn }}>
          {/* 전체운 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>전체운</Text>
              <ScoreBadge score={result.overall.score} />
            </View>
            <Text style={styles.cardDesc}>{result.overall.desc}</Text>
          </View>

          {/* 인상 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>인상</Text>
              <View style={[badgeStyles.wrap, { backgroundColor: Colors.primary + '18' }]}>
                <Text style={[badgeStyles.text, { color: Colors.primary }]}>{result.impression.label}</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>{result.impression.desc}</Text>
          </View>

          {/* 대인관계 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>대인관계</Text>
              <ScoreBadge score={result.social.score} />
            </View>
            <Text style={styles.cardDesc}>{result.social.desc}</Text>
          </View>

          {/* 건강 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>건강</Text>
              <ScoreBadge score={result.health.score} />
            </View>
            <Text style={styles.cardDesc}>{result.health.desc}</Text>
          </View>

          {/* 조언 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>오늘의 관상 조언</Text>
            {result.advice.map((a, i) => (
              <View key={i} style={styles.adviceRow}>
                <Text style={styles.adviceDot}>●</Text>
                <Text style={styles.adviceText}>{a}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.disclaimer}>사주 기반 관상 분석이며, 재미로 참고해주세요.</Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: spacing.md, paddingBottom: 80 },

  heading: { fontSize: 24, fontWeight: '700', color: Colors.text, lineHeight: 34 },
  subheading: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, marginBottom: spacing.lg },

  // Photo
  photoCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: spacing.md, alignItems: 'center',
    marginBottom: spacing.md,
  },
  imageWrap: {
    width: 200, height: 200, borderRadius: 100,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  image: { width: 200, height: 200 },
  placeholder: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  placeholderText: { fontSize: 14, color: Colors.textMuted, marginTop: 8 },
  photoButtons: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.surfaceLight, borderRadius: 12,
  },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  // Analyze
  analyzeBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: spacing.md,
  },
  analyzeBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  analyzingText: {
    fontSize: 14, color: Colors.textSecondary, textAlign: 'center',
    marginBottom: spacing.md,
  },

  // Result Cards
  card: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardDesc: { fontSize: 14, lineHeight: 22, color: Colors.text },

  // Advice
  adviceRow: { flexDirection: 'row', marginTop: 10 },
  adviceDot: { fontSize: 8, color: Colors.primary, marginTop: 5, marginRight: 8 },
  adviceText: { flex: 1, fontSize: 14, lineHeight: 22, color: Colors.text },

  disclaimer: {
    fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: spacing.md,
  },
});
