import React, { useState, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Switch, GestureResponderEvent } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { useSajuStore } from '../store/useSajuStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MBTI_INFO: Record<string, { emoji: string; title: string; desc: string; match: string; detail: string }> = {
  INTJ: { emoji: '🧠', title: '전략가', desc: '독립적이고 분석적인 사고의 소유자', match: 'ENFP', detail: '깊은 통찰력과 장기적 비전으로 목표를 달성합니다. 혼자만의 시간이 에너지 원천이며 체계적으로 세상을 이해하려 합니다.' },
  INTP: { emoji: '🔬', title: '논리술사', desc: '끝없는 지적 호기심의 탐구자', match: 'ENTJ', detail: '논리와 패턴으로 세상을 분석합니다. 새로운 아이디어에 몰두하며 지적 자유를 가장 소중히 여깁니다.' },
  ENTJ: { emoji: '👑', title: '통솔자', desc: '대담하고 결단력 있는 리더', match: 'INTP', detail: '자연스러운 리더십으로 팀을 이끕니다. 효율성을 추구하며 큰 그림을 그리는 전략적 사고가입니다.' },
  ENTP: { emoji: '💡', title: '변론가', desc: '도전을 즐기는 창의적 사고가', match: 'INFJ', detail: '새로운 가능성을 탐구하며 토론을 즐깁니다. 기존의 틀을 깨는 혁신적 아이디어를 끊임없이 생산합니다.' },
  INFJ: { emoji: '🌌', title: '옹호자', desc: '이상을 추구하는 조용한 영감가', match: 'ENTP', detail: '깊은 직관과 공감 능력으로 타인을 이해합니다. 의미 있는 삶을 추구하며 세상을 더 나은 곳으로 만들고자 합니다.' },
  INFP: { emoji: '🦋', title: '중재자', desc: '깊은 감성과 이상을 품은 몽상가', match: 'ENFJ', detail: '풍부한 내면 세계와 강한 가치관을 지닙니다. 진정성을 중시하며 자신만의 방식으로 세상에 기여합니다.' },
  ENFJ: { emoji: '🌟', title: '선도자', desc: '타인을 이끄는 따뜻한 카리스마', match: 'INFP', detail: '사람들의 잠재력을 이끌어내는 능력이 탁월합니다. 따뜻한 리더십으로 주변을 변화시킵니다.' },
  ENFP: { emoji: '🎭', title: '활동가', desc: '자유로운 영혼의 열정적 탐험가', match: 'INTJ', detail: '넘치는 열정과 창의력으로 새로운 가능성을 발견합니다. 사람들과의 깊은 연결을 소중히 여깁니다.' },
  ISTJ: { emoji: '📋', title: '현실주의자', desc: '신뢰할 수 있는 책임감의 상징', match: 'ESFP', detail: '성실하고 체계적으로 맡은 일을 완수합니다. 전통과 규칙을 존중하며 안정적인 환경을 만듭니다.' },
  ISFJ: { emoji: '🛡️', title: '수호자', desc: '헌신적이고 따뜻한 보호자', match: 'ESTP', detail: '조용하지만 깊은 헌신으로 주변을 돌봅니다. 세심한 관찰력과 배려로 사랑받는 존재입니다.' },
  ESTJ: { emoji: '⚖️', title: '경영자', desc: '질서와 규율을 중시하는 관리자', match: 'ISFP', detail: '명확한 원칙과 리더십으로 조직을 이끕니다. 실용적이고 결과 중심적인 사고를 합니다.' },
  ESFJ: { emoji: '🤝', title: '집정관', desc: '조화를 이루는 사교적 돌봄이', match: 'ISTP', detail: '사교적이고 친절하며 주변의 조화를 중시합니다. 타인의 필요를 세심하게 파악하고 돕습니다.' },
  ISTP: { emoji: '🔧', title: '장인', desc: '냉철하고 실용적인 문제 해결사', match: 'ESFJ', detail: '논리적 분석과 손재주를 겸비한 실행가입니다. 위기 상황에서 냉정하게 대처하는 능력이 뛰어납니다.' },
  ISFP: { emoji: '🎨', title: '모험가', desc: '유연하고 감성적인 예술가', match: 'ESTJ', detail: '아름다움을 추구하며 현재 순간을 즐깁니다. 조용하지만 강한 내면의 가치관을 지닌 예술적 영혼입니다.' },
  ESTP: { emoji: '🏄', title: '사업가', desc: '에너지 넘치는 행동파', match: 'ISFJ', detail: '현재를 즐기며 빠른 판단력으로 행동합니다. 위험을 두려워하지 않는 대담한 도전가입니다.' },
  ESFP: { emoji: '🎉', title: '연예인', desc: '삶을 즐기는 자유로운 영혼', match: 'ISTJ', detail: '밝은 에너지로 주변을 즐겁게 합니다. 순간을 사랑하며 사람들과 함께하는 것을 최고로 여깁니다.' },
};

const MBTI_TYPES = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];

// 각 MBTI 차원과 오행의 연관 분석 데이터
const DIMENSION_LABELS: Record<string, { label: string; desc: string; element: string; elementDesc: string }> = {
  E: { label: '외향 (E)', desc: '에너지를 외부에서 얻으며 사교적이고 활동적입니다.', element: '화·목', elementDesc: '화(火)의 열정과 목(木)의 성장 기운이 외향성을 나타냅니다.' },
  I: { label: '내향 (I)', desc: '내면의 세계에서 에너지를 충전하며 깊은 사고를 선호합니다.', element: '수·금', elementDesc: '수(水)의 깊은 사색과 금(金)의 절제가 내향성을 나타냅니다.' },
  S: { label: '감각 (S)', desc: '현실적이고 구체적인 사실과 경험을 중시합니다.', element: '토·금', elementDesc: '토(土)의 안정성과 금(金)의 실용성이 감각형을 나타냅니다.' },
  N: { label: '직관 (N)', desc: '가능성과 의미를 탐구하며 큰 그림을 봅니다.', element: '화·목', elementDesc: '화(火)의 영감과 목(木)의 창의력이 직관형을 나타냅니다.' },
  T: { label: '사고 (T)', desc: '논리와 객관적 기준으로 판단합니다.', element: '금·수', elementDesc: '금(金)의 분석력과 수(水)의 지혜가 사고형을 나타냅니다.' },
  F: { label: '감정 (F)', desc: '가치와 사람 중심으로 결정하며 공감력이 뛰어납니다.', element: '화·목', elementDesc: '화(火)의 따뜻함과 목(木)의 인자함이 감정형을 나타냅니다.' },
  J: { label: '판단 (J)', desc: '계획적이고 체계적이며 결단력이 있습니다.', element: '토·금', elementDesc: '토(土)의 안정 추구와 금(金)의 결단력이 판단형을 나타냅니다.' },
  P: { label: '인식 (P)', desc: '유연하고 즉흥적이며 변화에 열려 있습니다.', element: '수·목', elementDesc: '수(水)의 유연함과 목(木)의 적응력이 인식형을 나타냅니다.' },
};

// 사주 vs MBTI 차원별 비교 인사이트 생성
function generateComparison(sajuType: string, userType: string) {
  const dims = ['EI', 'SN', 'TF', 'JP'] as const;
  const dimNames = { EI: '에너지 방향', SN: '인식 기능', TF: '판단 기능', JP: '생활 양식' };
  const results: { dim: string; dimName: string; sajuLetter: string; userLetter: string; match: boolean; insight: string }[] = [];

  for (let i = 0; i < 4; i++) {
    const sajuLetter = sajuType[i];
    const userLetter = userType[i];
    const dim = dims[i];
    const isMatch = sajuLetter === userLetter;

    let insight: string;
    if (isMatch) {
      const info = DIMENSION_LABELS[sajuLetter];
      insight = `사주의 오행 기운과 성격 검사 결과가 일치합니다. ${info.elementDesc} 이 성향이 일상에서도 자연스럽게 드러나고 있습니다.`;
    } else {
      const sajuInfo = DIMENSION_LABELS[sajuLetter];
      const userInfo = DIMENSION_LABELS[userLetter];
      insight = `사주는 ${sajuInfo.element}의 기운으로 ${sajuInfo.label} 성향을 보이지만, 실제 성격은 ${userInfo.label}에 가깝습니다. 타고난 기질과 환경이 만든 성격 사이에서 독특한 균형을 이루고 있습니다.`;
    }

    results.push({ dim, dimName: dimNames[dim], sajuLetter, userLetter, match: isMatch, insight });
  }

  return results;
}

// 종합 분석 메시지 생성
function generateSummary(sajuType: string, userType: string): { matchCount: number; title: string; message: string } {
  const matchCount = [0,1,2,3].filter(i => sajuType[i] === userType[i]).length;

  if (matchCount === 4) {
    return {
      matchCount,
      title: '완벽한 조화',
      message: '사주의 선천적 기질과 후천적 성격이 완벽하게 일치합니다. 타고난 운명의 흐름대로 자연스럽게 성장해왔으며, 자기 자신에 대한 이해가 깊습니다. 본연의 모습 그대로가 가장 큰 강점입니다.',
    };
  } else if (matchCount === 3) {
    return {
      matchCount,
      title: '높은 일치도',
      message: '대부분의 성향이 사주와 일치하며, 하나의 차이가 당신만의 개성을 만들어냅니다. 기본 기질에 충실하면서도 특정 영역에서 독자적인 발전을 이루어낸 유형입니다.',
    };
  } else if (matchCount === 2) {
    return {
      matchCount,
      title: '균형 잡힌 이중성',
      message: '선천적 기질과 후천적 성격이 반반씩 조화를 이룹니다. 상황에 따라 타고난 면과 발전시킨 면을 유연하게 전환할 수 있어, 다양한 환경에 적응하는 능력이 탁월합니다.',
    };
  } else if (matchCount === 1) {
    return {
      matchCount,
      title: '성장의 여정',
      message: '타고난 기질과 현재 성격 사이에 큰 변화가 있었습니다. 환경과 경험을 통해 자신만의 성격을 적극적으로 만들어온 유형으로, 내면의 깊이와 외면의 강인함을 동시에 갖추고 있습니다.',
    };
  } else {
    return {
      matchCount,
      title: '극적인 변화',
      message: '사주의 기질과 완전히 다른 성격으로 성장했습니다. 이는 강한 의지와 환경의 영향이 만들어낸 결과입니다. 타고난 잠재력과 현재의 능력 모두를 활용할 수 있는 특별한 존재입니다.',
    };
  }
}

const QUIZ_QUESTIONS = [
  { q: '주말에 에너지를 충전하는 방법은?', a: '사람들과 어울리기', b: '혼자만의 시간 보내기', dim: 'EI' as const },
  { q: '새로운 사람을 만나면?', a: '먼저 말을 건다', b: '상대가 말 걸기를 기다린다', dim: 'EI' as const },
  { q: '문제를 해결할 때?', a: '경험과 사실을 기반으로', b: '직감과 영감을 따라', dim: 'SN' as const },
  { q: '더 관심가는 이야기는?', a: '실제로 일어난 일', b: '상상 속의 가능성', dim: 'SN' as const },
  { q: '중요한 결정을 내릴 때?', a: '논리적으로 분석한다', b: '감정과 가치를 고려한다', dim: 'TF' as const },
  { q: '친구가 고민을 말하면?', a: '해결책을 제시한다', b: '공감하고 들어준다', dim: 'TF' as const },
  { q: '여행 계획은?', a: '꼼꼼하게 일정을 짠다', b: '그때그때 즉흥적으로', dim: 'JP' as const },
  { q: '마감 전에 일하는 스타일은?', a: '미리미리 끝낸다', b: '마감 직전에 집중한다', dim: 'JP' as const },
  { q: '모임에서 나는?', a: '다양한 사람과 이야기', b: '친한 사람과 깊은 대화', dim: 'EI' as const },
  { q: '더 끌리는 수업은?', a: '실습 위주', b: '이론 위주', dim: 'SN' as const },
  { q: '갈등 상황에서?', a: '공정함을 우선시', b: '관계의 조화를 우선시', dim: 'TF' as const },
  { q: '하루 일과는?', a: '계획대로 움직인다', b: '기분에 따라 유연하게', dim: 'JP' as const },
];

type MbtiMode = 'home' | 'quiz' | 'select' | 'result';

export default function MbtiScreen() {
  const insets = useSafeAreaInsets();
  const { activeProfile, userMbti, setUserMbti: storeSetMbti } = useSajuStore();
  const profile = activeProfile();

  const [mode, setMode] = useState<MbtiMode>(() => userMbti ? 'result' : 'home');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScores, setQuizScores] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
  const [quizAnswers, setQuizAnswers] = useState<('a' | 'b')[]>([]);

  // 직접 입력 상태
  const [selectLetters, setSelectLetters] = useState({
    EI: (userMbti?.[0] as 'E' | 'I') || 'E',
    SN: (userMbti?.[1] as 'S' | 'N') || 'S',
    TF: (userMbti?.[2] as 'T' | 'F') || 'T',
    JP: (userMbti?.[3] as 'J' | 'P') || 'J',
  });
  const [showRatios, setShowRatios] = useState(false);
  const [ratios, setRatios] = useState({ EI: 50, SN: 50, TF: 50, JP: 50 });
  const barLayouts = useRef<Record<string, { pageX: number; width: number }>>({ EI: { pageX: 0, width: 0 }, SN: { pageX: 0, width: 0 }, TF: { pageX: 0, width: 0 }, JP: { pageX: 0, width: 0 } });
  const barRefs = useRef<Record<string, View | null>>({});

  const setUserMbti = (mbti: string | null) => {
    storeSetMbti(mbti);
  };

  // 사주 기반 MBTI + 점수
  const sajuAnalysis = useMemo(() => {
    if (!profile) return null;
    const el = profile.sajuData.elements;
    const scores = {
      E: Math.min(100, Math.round(((el.fire + el.wood) / 8) * 100)),
      S: Math.min(100, Math.round(((el.earth + el.metal) / 8) * 100)),
      T: Math.min(100, Math.round(((el.metal + el.water) / 8) * 100)),
      J: Math.min(100, Math.round(((el.earth + el.metal) / 8) * 100)),
      I: 0, N: 0, F: 0, P: 0,
    };
    scores.I = 100 - scores.E;
    scores.N = 100 - scores.S;
    scores.F = 100 - scores.T;
    scores.P = 100 - scores.J;
    const type = (scores.E >= 50 ? 'E' : 'I') + (scores.S >= 50 ? 'S' : 'N') + (scores.T >= 50 ? 'T' : 'F') + (scores.J >= 50 ? 'J' : 'P');
    return { type, scores, elements: el };
  }, [profile]);
  const sajuMbti = sajuAnalysis?.type ?? null;

  const info = userMbti ? MBTI_INFO[userMbti] : null;

  const handleQuizAnswer = (choice: 'a' | 'b') => {
    const q = QUIZ_QUESTIONS[quizIndex];
    const dim = q.dim;
    const newScores = { ...quizScores };
    if (choice === 'a') newScores[dim[0] as keyof typeof newScores]++;
    else newScores[dim[1] as keyof typeof newScores]++;
    setQuizScores(newScores);
    setQuizAnswers([...quizAnswers.slice(0, quizIndex), choice]);

    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      const result =
        (newScores.E >= newScores.I ? 'E' : 'I') +
        (newScores.S >= newScores.N ? 'S' : 'N') +
        (newScores.T >= newScores.F ? 'T' : 'F') +
        (newScores.J >= newScores.P ? 'J' : 'P');
      setUserMbti(result);
      setMode('result');
    }
  };

  const handleQuizBack = () => {
    if (quizIndex <= 0) return;
    const prevIndex = quizIndex - 1;
    const prevAnswer = quizAnswers[prevIndex];
    if (prevAnswer) {
      const q = QUIZ_QUESTIONS[prevIndex];
      const dim = q.dim;
      const newScores = { ...quizScores };
      if (prevAnswer === 'a') newScores[dim[0] as keyof typeof newScores]--;
      else newScores[dim[1] as keyof typeof newScores]--;
      setQuizScores(newScores);
    }
    setQuizIndex(prevIndex);
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizScores({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
    setQuizAnswers([]);
    setMode('quiz');
  };

  // ===== 퀴즈 모드 =====
  if (mode === 'quiz') {
    const q = QUIZ_QUESTIONS[quizIndex];
    const progress = ((quizIndex + 1) / QUIZ_QUESTIONS.length) * 100;
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={() => quizIndex > 0 ? handleQuizBack() : setMode('home')}>
            <Text style={styles.quizBack}>← {quizIndex > 0 ? '이전 질문' : '돌아가기'}</Text>
          </TouchableOpacity>
          <Text style={styles.quizProgress}>{quizIndex + 1} / {QUIZ_QUESTIONS.length}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.quizBody}>
          <Text style={styles.quizQuestion}>{q.q}</Text>
          <TouchableOpacity style={styles.quizOption} activeOpacity={0.7} onPress={() => handleQuizAnswer('a')}>
            <Text style={styles.quizOptionText}>{q.a}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quizOption} activeOpacity={0.7} onPress={() => handleQuizAnswer('b')}>
            <Text style={styles.quizOptionText}>{q.b}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.adBanner}>
          <Text style={styles.adEmoji}>🧬</Text>
          <View style={styles.adTextWrap}>
            <Text style={styles.adTitle}>AI 성격 심층 분석</Text>
            <Text style={styles.adDesc}>사주 + MBTI 종합 리포트</Text>
          </View>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>AD</Text>
          </View>
        </View>
      </View>
    );
  }

  // ===== 직접 선택 모드 =====
  if (mode === 'select') {
    const DIMS: { key: 'EI' | 'SN' | 'TF' | 'JP'; name: string; left: string; right: string; leftFull: string; rightFull: string; colors: [string, string] }[] = [
      { key: 'EI', name: '에너지 방향', left: 'E', right: 'I', leftFull: '외향', rightFull: '내향', colors: ['#FF9500', '#007AFF'] },
      { key: 'SN', name: '인식 기능', left: 'S', right: 'N', leftFull: '감각', rightFull: '직관', colors: ['#34C759', '#AF52DE'] },
      { key: 'TF', name: '판단 기능', left: 'T', right: 'F', leftFull: '사고', rightFull: '감정', colors: ['#007AFF', '#FF2D55'] },
      { key: 'JP', name: '생활 양식', left: 'J', right: 'P', leftFull: '판단', rightFull: '인식', colors: ['#5856D6', '#FF9500'] },
    ];
    const previewType = selectLetters.EI + selectLetters.SN + selectLetters.TF + selectLetters.JP;
    const previewInfo = MBTI_INFO[previewType];

    const updateRatio = (dim: 'EI' | 'SN' | 'TF' | 'JP', pageX: number) => {
      const layout = barLayouts.current[dim];
      if (!layout || layout.width <= 0) return;
      const x = pageX - layout.pageX;
      const raw = Math.round((x / layout.width) * 100);
      const clamped = Math.max(15, Math.min(85, raw));
      const snapped = Math.round(clamped / 5) * 5;
      setRatios(prev => ({ ...prev, [dim]: snapped }));
      const d = DIMS.find(d => d.key === dim)!;
      setSelectLetters(prev => ({ ...prev, [dim]: snapped >= 50 ? d.left : d.right }));
    };

    const handleBarGrant = (dim: 'EI' | 'SN' | 'TF' | 'JP', e: GestureResponderEvent) => {
      const ref = barRefs.current[dim];
      if (ref) {
        ref.measureInWindow((x, _y, width) => {
          barLayouts.current[dim] = { pageX: x, width };
          updateRatio(dim, e.nativeEvent.pageX);
        });
      }
    };

    const handleConfirm = () => {
      setUserMbti(previewType);
      setMode('result');
    };

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={() => setMode(userMbti ? 'result' : 'home')}>
            <Text style={styles.quizBack}>← 돌아가기</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.content}>
            <Text style={styles.selectTitle}>나의 MBTI 입력</Text>

            {/* 비율 상세 입력 토글 */}
            <View style={styles.ratioToggleRow}>
              <Text style={styles.ratioToggleLabel}>비율 상세 입력</Text>
              <Switch
                value={showRatios}
                onValueChange={setShowRatios}
                trackColor={{ false: Colors.gray300, true: Colors.primary + '40' }}
                thumbColor={showRatios ? Colors.primary : Colors.gray500}
              />
            </View>

            {/* 4개 차원 선택 */}
            {DIMS.map((dim) => {
              const selected = selectLetters[dim.key];
              const isLeft = selected === dim.left;
              const ratio = ratios[dim.key];
              return (
                <Card key={dim.key} style={styles.dimCard}>
                  <Card.Content style={styles.dimContent}>
                    <Text style={styles.dimName}>{dim.name}</Text>
                    <View style={styles.dimBtnRow}>
                      <TouchableOpacity
                        style={[styles.dimBtn, isLeft && { backgroundColor: dim.colors[0] + '18', borderColor: dim.colors[0] }]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectLetters(prev => ({ ...prev, [dim.key]: dim.left }));
                          if (showRatios && ratios[dim.key] < 50) setRatios(prev => ({ ...prev, [dim.key]: 100 - prev[dim.key] }));
                        }}
                      >
                        <Text style={[styles.dimBtnLetter, isLeft && { color: dim.colors[0] }]}>{dim.left}</Text>
                        <Text style={[styles.dimBtnLabel, isLeft && { color: dim.colors[0] }]}>{dim.leftFull}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.dimBtn, !isLeft && { backgroundColor: dim.colors[1] + '18', borderColor: dim.colors[1] }]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectLetters(prev => ({ ...prev, [dim.key]: dim.right }));
                          if (showRatios && ratios[dim.key] >= 50) setRatios(prev => ({ ...prev, [dim.key]: 100 - prev[dim.key] }));
                        }}
                      >
                        <Text style={[styles.dimBtnLetter, !isLeft && { color: dim.colors[1] }]}>{dim.right}</Text>
                        <Text style={[styles.dimBtnLabel, !isLeft && { color: dim.colors[1] }]}>{dim.rightFull}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 비율 바 */}
                    {showRatios && (
                      <View style={styles.ratioSection}>
                        <View style={styles.ratioLabels}>
                          <Text style={[styles.ratioLabelText, { color: dim.colors[0] }]}>{dim.left} {ratio}%</Text>
                          <Text style={[styles.ratioLabelText, { color: dim.colors[1] }]}>{dim.right} {100 - ratio}%</Text>
                        </View>
                        <View
                          ref={(ref) => { barRefs.current[dim.key] = ref; }}
                          style={styles.ratioBar}
                          onStartShouldSetResponder={() => true}
                          onMoveShouldSetResponder={() => true}
                          onResponderTerminationRequest={() => false}
                          onResponderGrant={(e) => handleBarGrant(dim.key, e)}
                          onResponderMove={(e) => updateRatio(dim.key, e.nativeEvent.pageX)}
                        >
                          <View pointerEvents="none" style={styles.ratioBarInner}>
                            <View style={[styles.ratioBarFill, { width: `${ratio}%`, backgroundColor: dim.colors[0] + '30' }]} />
                            <View style={[styles.ratioBarFill, { width: `${100 - ratio}%`, backgroundColor: dim.colors[1] + '30' }]} />
                          </View>
                          <View pointerEvents="none" style={[styles.ratioThumb, { left: `${ratio}%`, borderColor: isLeft ? dim.colors[0] : dim.colors[1] }]} />
                        </View>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              );
            })}

            {/* 미리보기 + 확인 */}
            {previewInfo && (
              <View style={styles.previewRow}>
                <Text style={styles.previewEmoji}>{previewInfo.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewType}>{previewType}</Text>
                  <Text style={styles.previewTitle}>{previewInfo.title}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={[styles.actionBtn, { marginTop: spacing.sm }]} onPress={handleConfirm} activeOpacity={0.7}>
              <Text style={styles.actionBtnText}>확인</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ===== 결과 모드 / 홈 모드 =====
  return (
    <ScrollView style={styles.container}>
      <View style={[styles.content, { paddingTop: mode === 'home' ? 0 : insets.top }]}>
        {/* 결과가 있을 때 (등록된 MBTI가 있을 때만) */}
        {userMbti && info ? (() => {
          const hasBoth = !!userMbti && !!sajuMbti;
          const comparison = hasBoth ? generateComparison(sajuMbti!, userMbti!) : null;
          const summary = hasBoth ? generateSummary(sajuMbti!, userMbti!) : null;
          const dimColors = { EI: ['#FF9500', '#007AFF'], SN: ['#34C759', '#AF52DE'], TF: ['#007AFF', '#FF2D55'], JP: ['#5856D6', '#FF9500'] };

          return (
          <>
            {/* MBTI 결과 카드 */}
            <Card style={styles.resultCard}>
              <Card.Content style={styles.resultContent}>
                <Text style={styles.resultEmoji}>{info.emoji}</Text>
                <Text style={styles.resultType}>{userMbti}</Text>
                <Text style={styles.resultTitle}>{info.title}</Text>
                <Text style={styles.resultDesc}>{info.desc}</Text>
              </Card.Content>
            </Card>

            {/* 상세 설명 */}
            <Card style={styles.detailCard}>
              <Card.Content style={{ padding: spacing.md }}>
                <Text style={styles.sectionLabel}>성격 분석</Text>
                <Text style={styles.detailText}>{info.detail}</Text>
              </Card.Content>
            </Card>

            {/* ===== 사주 × MBTI 비교 분석 ===== */}
            {hasBoth && comparison && summary ? (
              <>
                {/* 종합 일치도 */}
                <Card style={[styles.detailCard, { overflow: 'hidden' }]}>
                  <View style={styles.compHeader}>
                    <Text style={styles.compHeaderLabel}>사주 × MBTI</Text>
                    <Text style={styles.compHeaderTitle}>{summary.title}</Text>
                  </View>
                  <Card.Content style={{ padding: spacing.md }}>
                    {/* VS 비교 */}
                    <View style={styles.vsRow}>
                      <View style={styles.vsSide}>
                        <Text style={styles.vsEmoji}>🔮</Text>
                        <Text style={styles.vsTypeLabel}>사주 분석</Text>
                        <Text style={styles.vsType}>{sajuMbti}</Text>
                        <Text style={styles.vsTypeName}>{MBTI_INFO[sajuMbti!]?.title}</Text>
                      </View>
                      <View style={styles.vsCenter}>
                        <View style={styles.matchCircle}>
                          <Text style={styles.matchCircleNum}>{summary.matchCount}</Text>
                          <Text style={styles.matchCircleDenom}>/4</Text>
                        </View>
                        <Text style={styles.vsCenterLabel}>일치</Text>
                      </View>
                      <View style={styles.vsSide}>
                        <Text style={styles.vsEmoji}>{MBTI_INFO[userMbti!]?.emoji}</Text>
                        <Text style={styles.vsTypeLabel}>성격 검사</Text>
                        <Text style={styles.vsType}>{userMbti}</Text>
                        <Text style={styles.vsTypeName}>{MBTI_INFO[userMbti!]?.title}</Text>
                      </View>
                    </View>
                    <Text style={styles.summaryText}>{summary.message}</Text>
                  </Card.Content>
                </Card>

                {/* 차원별 상세 비교 */}
                <Card style={styles.detailCard}>
                  <Card.Content style={{ padding: spacing.md }}>
                    <Text style={styles.sectionLabel}>차원별 비교 분석</Text>
                    {comparison.map((c, idx) => {
                      const colors = dimColors[c.dim as keyof typeof dimColors];
                      const sa = sajuAnalysis!;
                      const sajuScore = sa.scores[c.sajuLetter as keyof typeof sa.scores];
                      const userScore = quizScores[c.userLetter as keyof typeof quizScores];
                      return (
                        <View key={c.dim} style={[styles.compDimCard, idx < comparison.length - 1 && { marginBottom: 16 }]}>
                          <View style={styles.compDimHeader}>
                            <Text style={styles.compDimName}>{c.dimName}</Text>
                            {c.match ? (
                              <View style={styles.compMatchTag}>
                                <Text style={styles.compMatchTagText}>일치</Text>
                              </View>
                            ) : (
                              <View style={styles.compDiffTag}>
                                <Text style={styles.compDiffTagText}>차이</Text>
                              </View>
                            )}
                          </View>
                          {/* 비교 바 */}
                          <View style={styles.compBarRow}>
                            <Text style={[styles.compBarLabel, { color: colors[0] }]}>
                              {DIMENSION_LABELS[c.dim[0]].label}
                            </Text>
                            <Text style={[styles.compBarLabel, { color: colors[1], textAlign: 'right' }]}>
                              {DIMENSION_LABELS[c.dim[1]].label}
                            </Text>
                          </View>
                          <View style={styles.compBarGroup}>
                            <Text style={styles.compBarTag}>사주</Text>
                            <View style={styles.compBar}>
                              <View style={[styles.compBarFill, { width: `${sajuScore}%`, backgroundColor: colors[0] }]} />
                            </View>
                          </View>
                          <View style={styles.compBarGroup}>
                            <Text style={styles.compBarTag}>검사</Text>
                            <View style={styles.compBar}>
                              <View style={[styles.compBarFill, {
                                width: `${userScore > 0 ? Math.round((userScore / 3) * 100) : 50}%`,
                                backgroundColor: colors[0],
                              }]} />
                            </View>
                          </View>
                          <Text style={styles.compInsight}>{c.insight}</Text>
                        </View>
                      );
                    })}
                  </Card.Content>
                </Card>

                {/* 오행 기반 근거 */}
                <Card style={styles.detailCard}>
                  <Card.Content style={{ padding: spacing.md }}>
                    <Text style={styles.sectionLabel}>오행 분석 근거</Text>
                    <Text style={[styles.detailText, { marginBottom: 16 }]}>
                      사주팔자의 오행 분포가 선천적 성격 기질을 결정합니다.
                    </Text>
                    <View style={styles.elementsRow}>
                      {[
                        { label: '목', count: sajuAnalysis!.elements.wood, color: Colors.wood, traits: 'E·N·F' },
                        { label: '화', count: sajuAnalysis!.elements.fire, color: Colors.fire, traits: 'E·N·F' },
                        { label: '토', count: sajuAnalysis!.elements.earth, color: Colors.earth, traits: 'S·J' },
                        { label: '금', count: sajuAnalysis!.elements.metal, color: Colors.metal, traits: 'S·T·J' },
                        { label: '수', count: sajuAnalysis!.elements.water, color: Colors.water, traits: 'I·T·P' },
                      ].map((item) => (
                        <View key={item.label} style={styles.elementItem}>
                          <View style={[styles.elementCircle, { backgroundColor: item.color + '20' }]}>
                            <Text style={[styles.elementCount, { color: item.color }]}>{item.count}</Text>
                          </View>
                          <Text style={styles.elementLabel}>{item.label}</Text>
                          <Text style={styles.elementTraits}>{item.traits}</Text>
                        </View>
                      ))}
                    </View>
                  </Card.Content>
                </Card>

                {/* 공통점 & 차이점 요약 */}
                <Card style={styles.detailCard}>
                  <Card.Content style={{ padding: spacing.md }}>
                    <Text style={styles.sectionLabel}>공통점과 차이점</Text>
                    {comparison.filter(c => c.match).length > 0 && (
                      <View style={styles.summaryBlock}>
                        <Text style={styles.summaryBlockTitle}>✦ 공통점</Text>
                        {comparison.filter(c => c.match).map(c => (
                          <View key={c.dim} style={styles.summaryItem}>
                            <Text style={styles.summaryItemDot}>●</Text>
                            <Text style={styles.summaryItemText}>
                              {c.dimName}: 사주와 성격 모두 {DIMENSION_LABELS[c.sajuLetter].label} — {DIMENSION_LABELS[c.sajuLetter].desc}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {comparison.filter(c => !c.match).length > 0 && (
                      <View style={[styles.summaryBlock, { marginTop: 16 }]}>
                        <Text style={styles.summaryBlockTitle}>✧ 차이점</Text>
                        {comparison.filter(c => !c.match).map(c => (
                          <View key={c.dim} style={styles.summaryItem}>
                            <Text style={[styles.summaryItemDot, { color: Colors.secondary }]}>●</Text>
                            <Text style={styles.summaryItemText}>
                              {c.dimName}: 사주는 {DIMENSION_LABELS[c.sajuLetter].label}이지만 실제로는 {DIMENSION_LABELS[c.userLetter].label} — 환경과 경험이 만든 변화입니다.
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Card.Content>
                </Card>
              </>
            ) : sajuMbti && !userMbti ? (
              /* 사주만 있고 검사 안 했을 때 비교 유도 */
              <Card style={styles.detailCard}>
                <Card.Content style={{ padding: spacing.md, alignItems: 'center' }}>
                  <Text style={styles.sectionLabel}>사주 × MBTI 비교 분석</Text>
                  <Text style={{ fontSize: 40, marginVertical: 12 }}>🔮 ↔ 📝</Text>
                  <Text style={[styles.detailText, { textAlign: 'center', marginBottom: 16 }]}>
                    MBTI 검사를 받으면{'\n'}사주와의 비교 분석을 확인할 수 있어요
                  </Text>
                  <TouchableOpacity style={[styles.actionBtn, { width: '100%' }]} onPress={resetQuiz} activeOpacity={0.7}>
                    <Text style={styles.actionBtnText}>MBTI 검사 받기</Text>
                  </TouchableOpacity>
                </Card.Content>
              </Card>
            ) : null}

            {/* 궁합 카드 */}
            <Card style={styles.detailCard}>
              <Card.Content style={styles.matchContent}>
                <Text style={styles.sectionLabel}>최고의 궁합</Text>
                <View style={styles.matchRow}>
                  <View style={styles.matchSide}>
                    <Text style={{ fontSize: 32 }}>{info.emoji}</Text>
                    <Text style={styles.matchType}>{userMbti}</Text>
                  </View>
                  <Text style={styles.matchHeart}>💕</Text>
                  <View style={styles.matchSide}>
                    <Text style={{ fontSize: 32 }}>{MBTI_INFO[info.match]?.emoji}</Text>
                    <Text style={styles.matchType}>{info.match}</Text>
                  </View>
                </View>
                <Text style={styles.matchDesc}>{MBTI_INFO[info.match]?.title} - {MBTI_INFO[info.match]?.desc}</Text>
              </Card.Content>
            </Card>

            {/* 광고 배너 */}
            <View style={[styles.adBanner, { marginHorizontal: 0 }]}>
              <Text style={styles.adEmoji}>🧬</Text>
              <View style={styles.adTextWrap}>
                <Text style={styles.adTitle}>AI 성격 심층 분석</Text>
                <Text style={styles.adDesc}>사주 + MBTI 종합 리포트</Text>
              </View>
              <View style={styles.adBadge}>
                <Text style={styles.adBadgeText}>AD</Text>
              </View>
            </View>

            {/* 다시 검사 / 변경 버튼 */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={resetQuiz} activeOpacity={0.7}>
                <Text style={styles.actionBtnText}>다시 검사하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={() => setMode('select')} activeOpacity={0.7}>
                <Text style={[styles.actionBtnText, styles.actionBtnOutlineText]}>직접 변경</Text>
              </TouchableOpacity>
            </View>
          </>
          );
        })() : (
          <>
            {/* 시작 화면 */}
            <Card style={[styles.resultCard, { backgroundColor: Colors.primary }]}>
              <Card.Content style={styles.resultContent}>
                <Text style={{ fontSize: 56, marginBottom: 12 }}>🧬</Text>
                <Text style={[styles.resultType, { color: '#fff' }]}>MBTI</Text>
                <Text style={[styles.resultDesc, { color: 'rgba(255,255,255,0.8)' }]}>
                  사주와 성격 검사로{'\n'}나의 MBTI를 알아보세요
                </Text>
              </Card.Content>
            </Card>

            <TouchableOpacity style={styles.startBtn} onPress={() => setMode('quiz')} activeOpacity={0.7}>
              <Card style={styles.startCard}>
                <Card.Content style={styles.startCardContent}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📝</Text>
                  <Text style={styles.startCardTitle}>간단 MBTI 검사</Text>
                  <Text style={styles.startCardDesc}>12문항으로 알아보는 나의 성격 유형</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity style={styles.startBtn} onPress={() => setMode('select')} activeOpacity={0.7}>
              <Card style={styles.startCard}>
                <Card.Content style={styles.startCardContent}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>✏️</Text>
                  <Text style={styles.startCardTitle}>직접 입력</Text>
                  <Text style={styles.startCardDesc}>이미 알고 있는 MBTI를 선택하세요</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>

            {sajuMbti && (
              <TouchableOpacity style={styles.startBtn} onPress={() => setMode('result')} activeOpacity={0.7}>
                <Card style={styles.startCard}>
                  <Card.Content style={styles.startCardContent}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>🔮</Text>
                    <Text style={styles.startCardTitle}>사주 기반 분석 보기</Text>
                    <Text style={styles.startCardDesc}>오행 분석으로 예측한 MBTI: {sajuMbti}</Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },

  // 퀴즈
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 12 },
  quizBack: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  quizProgress: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: Colors.gray200, marginHorizontal: spacing.md, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  quizBody: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingBottom: 60 },
  quizQuestion: { fontSize: 24, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 44, lineHeight: 34, letterSpacing: -0.3 },
  quizOption: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
    elevation: 1,
  },
  quizOptionText: { fontSize: 16, fontWeight: '600', color: Colors.text },

  // 직접 선택
  selectTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 20, letterSpacing: -0.3 },
  ratioToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  ratioToggleLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  dimCard: {
    backgroundColor: Colors.surface, borderRadius: 20, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 10,
    elevation: 2,
  },
  dimContent: { paddingVertical: 16, paddingHorizontal: 16 },
  dimName: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 12 },
  dimBtnRow: { flexDirection: 'row', gap: 10 },
  dimBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.gray100, borderWidth: 1.5, borderColor: 'transparent',
  },
  dimBtnLetter: { fontSize: 20, fontWeight: '800', color: Colors.textMuted },
  dimBtnLabel: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  ratioSection: { marginTop: 14 },
  ratioLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ratioLabelText: { fontSize: 12, fontWeight: '700' },
  ratioBar: {
    height: 28, borderRadius: 14, overflow: 'hidden',
    backgroundColor: Colors.gray100, position: 'relative',
  },
  ratioBarInner: { flexDirection: 'row', height: '100%' },
  ratioBarFill: { height: '100%' },
  ratioThumb: {
    position: 'absolute', top: 2, width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.surface, borderWidth: 2.5,
    marginLeft: -12,
    shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
    elevation: 3,
  },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginTop: 4,
  },
  previewEmoji: { fontSize: 36 },
  previewType: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: 3 },
  previewTitle: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginTop: 2 },

  // 결과
  resultCard: {
    backgroundColor: Colors.surface, borderRadius: 24, marginBottom: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 16,
    elevation: 3,
  },
  resultContent: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  resultEmoji: { fontSize: 60, marginBottom: 16 },
  resultType: { fontSize: 40, fontWeight: '800', color: Colors.text, letterSpacing: 6, marginBottom: 6 },
  resultTitle: { fontSize: 18, fontWeight: '600', color: Colors.primary, marginBottom: 8 },
  resultDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  compareBadge: { backgroundColor: Colors.warning + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  compareBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.warning },

  // 상세
  detailCard: {
    backgroundColor: Colors.surface, borderRadius: 20, marginBottom: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 10,
    elevation: 2,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 12, letterSpacing: 1.5, textTransform: 'uppercase' as const },
  detailText: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },

  // 궁합
  matchContent: { padding: spacing.md, alignItems: 'center' },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 16, gap: 24 },
  matchSide: { alignItems: 'center' },
  matchType: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 4 },
  matchHeart: { fontSize: 24 },
  matchDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  // 액션 버튼
  actionRow: { flexDirection: 'row', gap: 12, marginTop: spacing.xs },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.25, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
    elevation: 2,
  },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  actionBtnOutline: {
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary,
    shadowColor: 'transparent', shadowOpacity: 0, elevation: 0,
  },
  actionBtnOutlineText: { color: Colors.primary },

  // 시작
  startBtn: { marginBottom: 0 },
  startCard: {
    backgroundColor: Colors.surface, borderRadius: 20, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 10,
    elevation: 2,
  },
  startCardContent: { alignItems: 'center', paddingVertical: 28 },
  startCardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 4, letterSpacing: -0.2 },
  startCardDesc: { fontSize: 13, color: Colors.textSecondary },

  // 비교 분석
  compHeader: { backgroundColor: Colors.primary, paddingVertical: 24, paddingHorizontal: spacing.md, alignItems: 'center' },
  compHeaderLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 3, marginBottom: 6, textTransform: 'uppercase' as const },
  compHeaderTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  vsSide: { flex: 1, alignItems: 'center' },
  vsEmoji: { fontSize: 36, marginBottom: 6 },
  vsTypeLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 2 },
  vsType: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: 2 },
  vsTypeName: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginTop: 2 },
  vsCenter: { alignItems: 'center', marginHorizontal: 8 },
  matchCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2, borderColor: Colors.primary + '20',
  },
  matchCircleNum: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  matchCircleDenom: { fontSize: 14, fontWeight: '600', color: Colors.primary + '80', marginTop: 4 },
  vsCenterLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginTop: 4, letterSpacing: 1 },
  summaryText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center' },

  compDimCard: { backgroundColor: Colors.background, borderRadius: 14, padding: 16 },
  compDimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  compDimName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  compMatchTag: { backgroundColor: Colors.success + '18', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  compMatchTagText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  compDiffTag: { backgroundColor: Colors.secondary + '18', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  compDiffTagText: { fontSize: 10, fontWeight: '700', color: Colors.secondary },
  compBarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  compBarLabel: { fontSize: 11, fontWeight: '600' },
  compBarGroup: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  compBarTag: { fontSize: 9, fontWeight: '600', color: Colors.textSecondary, width: 24 },
  compBar: { flex: 1, height: 6, backgroundColor: Colors.gray200, borderRadius: 3, overflow: 'hidden' },
  compBarFill: { height: '100%', borderRadius: 3 },
  compInsight: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginTop: 8 },

  elementsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  elementItem: { alignItems: 'center' },
  elementCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  elementCount: { fontSize: 18, fontWeight: '700' },
  elementLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  elementTraits: { fontSize: 9, color: Colors.textSecondary, fontWeight: '500' },

  summaryBlock: {},
  summaryBlockTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  summaryItem: { flexDirection: 'row', marginBottom: 8 },
  summaryItemDot: { fontSize: 8, color: Colors.primary, marginRight: 8, marginTop: 4 },
  summaryItemText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  // 광고
  adBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 6,
    elevation: 1,
  },
  adEmoji: { fontSize: 28, marginRight: 12 },
  adTextWrap: { flex: 1 },
  adTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  adDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  adBadge: { backgroundColor: Colors.primary + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  adBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
});
