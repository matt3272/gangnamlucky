import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  Modal,
  Switch,
  Animated,
  PanResponder,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { spacing, borderRadius } from '../constants/theme';
import { Colors } from '../constants/colors';
import { useSajuStore } from '../store/useSajuStore';
import { getTodayPillar, getDayPillar } from '../services/saju/calculator';
import { getStemElement, getElementRelationship } from '../services/saju/elements';
import Svg, { Polygon, Line, Circle as SvgCircle, Defs, LinearGradient, Stop } from 'react-native-svg';
// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type HomeTab = 'fortune' | 'lucky' | 'tarot' | 'mbti';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const BANNER_HEIGHT = 160;

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const BANNERS = [
  { title: '이번 주 운세를\n확인하세요', subtitle: '요일별로 달라지는 나의 운세', bg: Colors.primary, route: 'WeeklyFortune' as const, params: undefined },
  { title: '두 사람의 궁합을\n알아보세요', subtitle: '사주로 보는 우리의 인연', bg: Colors.secondary, route: 'Compatibility' as const, params: undefined },
  { title: 'AI가 분석하는\n당신의 사주', subtitle: 'Gemini AI 상세 해석', bg: Colors.info, route: 'SajuInput' as const, params: undefined },
  { title: '관상으로 보는\n오늘의 운', subtitle: '사진 한 장으로 운세 분석', bg: Colors.success, route: 'FaceReading' as const, params: undefined },
  { title: '타로 카드가\n당신을 기다립니다', subtitle: '지금 카드를 뽑아보세요', bg: '#AF52DE', route: 'TarotReading' as const, params: { category: 'daily', label: '오늘의 타로', count: 1, positions: ['오늘의 메시지'] } },
];

const MBTI_BRIEF: Record<string, { emoji: string; title: string; desc: string }> = {
  INTJ: { emoji: '🧠', title: '전략가', desc: '독립적이고 분석적인 사고의 소유자' },
  INTP: { emoji: '🔬', title: '논리술사', desc: '끝없는 지적 호기심의 탐구자' },
  ENTJ: { emoji: '👑', title: '통솔자', desc: '대담하고 결단력 있는 리더' },
  ENTP: { emoji: '💡', title: '변론가', desc: '도전을 즐기는 창의적 사고가' },
  INFJ: { emoji: '🌌', title: '옹호자', desc: '이상을 추구하는 조용한 영감가' },
  INFP: { emoji: '🦋', title: '중재자', desc: '깊은 감성과 이상을 품은 몽상가' },
  ENFJ: { emoji: '🌟', title: '선도자', desc: '타인을 이끄는 따뜻한 카리스마' },
  ENFP: { emoji: '🎭', title: '활동가', desc: '자유로운 영혼의 열정적 탐험가' },
  ISTJ: { emoji: '📋', title: '현실주의자', desc: '신뢰할 수 있는 책임감의 상징' },
  ISFJ: { emoji: '🛡️', title: '수호자', desc: '헌신적이고 따뜻한 보호자' },
  ESTJ: { emoji: '⚖️', title: '경영자', desc: '질서와 규율을 중시하는 관리자' },
  ESFJ: { emoji: '🤝', title: '집정관', desc: '조화를 이루는 사교적 돌봄이' },
  ISTP: { emoji: '🔧', title: '장인', desc: '냉철하고 실용적인 문제 해결사' },
  ISFP: { emoji: '🎨', title: '모험가', desc: '유연하고 감성적인 예술가' },
  ESTP: { emoji: '🏄', title: '사업가', desc: '에너지 넘치는 행동파' },
  ESFP: { emoji: '🎉', title: '연예인', desc: '삶을 즐기는 자유로운 영혼' },
};

const FEATURES = [
  { icon: '✦', label: '사주분석', action: 'SajuInput' },
  { icon: '🌟', label: '신년운', action: 'NewYearFortune' },
  { icon: '☯', label: '궁합분석', action: 'Compatibility' },
  { icon: '🔮', label: '오늘의 관상', action: 'FaceReading' },
  { icon: '🎯', label: '정통사주', action: 'SajuInput' },
  { icon: '⋯', label: '전체메뉴', action: 'Consult' },
];

const GREETINGS: Record<string, string[]> = {
  dawn:           ['고요한 새벽입니다', '맑은 새벽입니다'],
  early:          ['이른 아침입니다', '상서로운 아침입니다'],
  morning:        ['좋은 아침입니다', '맑은 아침입니다'],
  late_morning:   ['활기찬 오전입니다', '기운찬 오전입니다'],
  noon:           ['충만한 정오입니다', '양기 가득한 낮입니다'],
  afternoon:      ['따스한 오후입니다', '편안한 오후입니다'],
  late_afternoon: ['노을빛 오후입니다', '고운 석양입니다'],
  evening:        ['편안한 저녁입니다', '고요한 저녁입니다'],
  night:          ['깊은 밤입니다', '고요한 밤입니다'],
};

function getGreetingText(): string {
  const hour = new Date().getHours();
  const key =
    hour < 5 ? 'dawn' :
    hour < 7 ? 'early' :
    hour < 9 ? 'morning' :
    hour < 11 ? 'late_morning' :
    hour < 13 ? 'noon' :
    hour < 15 ? 'afternoon' :
    hour < 17 ? 'late_afternoon' :
    hour < 21 ? 'evening' : 'night';
  const pool = GREETINGS[key];
  const seed = new Date().getDate();
  return pool[seed % pool.length];
}

const FORTUNE_MESSAGES: Record<string, string> = {
  '상생 (生)': '기운이 조화를 이루는 좋은 날입니다',
  '역생 (被生)': '주변의 도움을 받을 수 있는 날입니다',
  '같은 오행': '안정적이고 편안한 하루가 될 것입니다',
  '중립': '무난하지만 꾸준히 나아가면 좋습니다',
  '상극 (剋)': '신중한 판단이 필요한 하루입니다',
  '역극 (被剋)': '충분한 휴식으로 에너지를 충전하세요',
};

const LUCKY_COORDI = [
  { item: '화이트 셔츠 + 슬랙스', desc: '깔끔한 인상이 행운을 부릅니다', icon: '👔' },
  { item: '파스텔톤 니트', desc: '부드러운 색감이 좋은 기운을 끌어옵니다', icon: '🧶' },
  { item: '네이비 재킷', desc: '신뢰감 있는 스타일이 좋은 만남을 만듭니다', icon: '🧥' },
  { item: '베이지 트렌치코트', desc: '클래식한 멋이 품격을 높여줍니다', icon: '🧥' },
  { item: '캐주얼 데님', desc: '편안한 복장이 창의력을 높여줍니다', icon: '👖' },
  { item: '블랙 올블랙', desc: '강렬한 인상이 결단력을 높여줍니다', icon: '🖤' },
  { item: '스트라이프 셔츠', desc: '활동적인 에너지를 불러옵니다', icon: '👕' },
];

const LUCKY_FOOD = [
  { item: '따뜻한 된장찌개', desc: '몸의 기운을 따뜻하게 채워줍니다', icon: '🍲' },
  { item: '삼겹살', desc: '활력을 높이는 에너지 음식입니다', icon: '🥩' },
  { item: '해물파전', desc: '수(水) 기운을 보충해줍니다', icon: '🥞' },
  { item: '비빔밥', desc: '오행의 균형을 맞춰줍니다', icon: '🍚' },
  { item: '녹차', desc: '목(木) 기운으로 마음을 안정시킵니다', icon: '🍵' },
  { item: '갈비찜', desc: '풍요로운 기운이 재물운을 높입니다', icon: '🍖' },
  { item: '초밥', desc: '정돈된 에너지가 집중력을 높입니다', icon: '🍣' },
];

const LUCKY_PLACE = [
  { item: '산 근처 공원', desc: '목(木) 기운이 강한 곳에서 활력을 얻으세요', icon: '🏔️' },
  { item: '카페', desc: '화(火) 기운의 따뜻한 공간에서 영감을 얻으세요', icon: '☕' },
  { item: '도서관', desc: '고요한 에너지가 지혜를 높여줍니다', icon: '📚' },
  { item: '강가·호수', desc: '수(水) 기운이 감성을 풍부하게 합니다', icon: '🌊' },
  { item: '서점', desc: '새로운 지식이 운의 흐름을 바꿉니다', icon: '📖' },
  { item: '전시관·미술관', desc: '예술적 에너지가 창의력을 높입니다', icon: '🎨' },
  { item: '광장·넓은 공간', desc: '토(土) 기운이 안정감을 줍니다', icon: '🏛️' },
];

const LUCKY_COLOR = [
  { item: '보라색', desc: '영적 에너지를 높여줍니다', color: '#5856D6' },
  { item: '파란색', desc: '수(水) 기운으로 마음을 안정시킵니다', color: '#007AFF' },
  { item: '초록색', desc: '목(木) 기운으로 성장의 에너지입니다', color: '#34C759' },
  { item: '노란색', desc: '토(土) 기운으로 재물운을 높입니다', color: '#FF9500' },
  { item: '빨간색', desc: '화(火) 기운으로 열정을 불어넣습니다', color: '#FF3B30' },
  { item: '흰색', desc: '금(金) 기운으로 결단력을 줍니다', color: '#8E8E93' },
  { item: '분홍색', desc: '애정운을 높여주는 색입니다', color: '#FF2D55' },
];

const LUCKY_DRINK = [
  { item: '아메리카노', desc: '집중력을 높이는 에너지가 필요합니다', icon: '☕' },
  { item: '카모마일 차', desc: '마음의 안정이 행운을 부릅니다', icon: '🍵' },
  { item: '생과일 주스', desc: '목(木) 기운이 활력을 줍니다', icon: '🧃' },
  { item: '따뜻한 라떼', desc: '부드러운 에너지가 대인운을 높입니다', icon: '🥛' },
  { item: '탄산수', desc: '수(水) 기운으로 머리를 맑게 합니다', icon: '💧' },
  { item: '녹차 라떼', desc: '균형 잡힌 기운이 흐릅니다', icon: '🍵' },
  { item: '히비스커스 티', desc: '화(火) 기운이 열정을 불어넣습니다', icon: '🌺' },
];

const LUCKY_SNACK = [
  { item: '다크 초콜릿', desc: '집중력과 창의력을 높여줍니다', icon: '🍫' },
  { item: '견과류 믹스', desc: '토(土) 기운으로 안정감을 줍니다', icon: '🥜' },
  { item: '과일 플레이트', desc: '목(木) 기운이 건강을 채워줍니다', icon: '🍇' },
  { item: '떡', desc: '전통의 기운이 복을 부릅니다', icon: '🍡' },
  { item: '마카롱', desc: '달콤한 에너지가 애정운을 높입니다', icon: '🧁' },
  { item: '크래커와 치즈', desc: '금(金) 기운이 결단력을 줍니다', icon: '🧀' },
  { item: '고구마', desc: '토(土) 기운으로 재물운이 상승합니다', icon: '🍠' },
];

const LUCKY_ALCOHOL = [
  { item: '레드 와인', desc: '화(火) 기운이 사교운을 높입니다', icon: '🍷' },
  { item: '생맥주', desc: '수(水) 기운으로 스트레스를 풀어줍니다', icon: '🍺' },
  { item: '소주', desc: '금(金) 기운이 솔직한 대화를 이끕니다', icon: '🍶' },
  { item: '하이볼', desc: '가벼운 에너지가 새로운 인연을 부릅니다', icon: '🥂' },
  { item: '막걸리', desc: '토(土) 기운이 편안한 모임을 만듭니다', icon: '🍶' },
  { item: '화이트 와인', desc: '금(金) 기운이 우아한 자리를 만듭니다', icon: '🥂' },
  { item: '위스키', desc: '깊은 사색과 통찰의 에너지입니다', icon: '🥃' },
];

const LUCKY_BASEBALL = [
  { item: '오늘은 응원팀 승리!', desc: '강한 양(陽) 기운이 승리를 이끕니다', icon: '⚾' },
  { item: '접전 끝 짜릿한 승리', desc: '끈기의 기운이 역전을 만듭니다', icon: '🏆' },
  { item: '타선 폭발 대승', desc: '화(火) 기운이 타격에 불을 붙입니다', icon: '🔥' },
  { item: '투수전 승리', desc: '수(水) 기운이 마운드를 지배합니다', icon: '💪' },
  { item: '아쉬운 패배', desc: '충전의 시간이 필요한 날입니다', icon: '😢' },
  { item: '역전패 주의', desc: '끝까지 긴장을 늦추지 마세요', icon: '⚡' },
  { item: '비 예보, 우천 취소?', desc: '수(水) 기운이 과하게 흐릅니다', icon: '🌧️' },
];

const LUCKY_GOLF = [
  { item: '드라이버 호조', desc: '목(木) 기운이 비거리를 늘려줍니다', icon: '🏌️' },
  { item: '퍼팅감 최고', desc: '수(水) 기운이 손끝에 집중됩니다', icon: '⛳' },
  { item: '숏게임 자신감', desc: '금(金) 기운이 정밀함을 줍니다', icon: '🎯' },
  { item: '버디 찬스 많음', desc: '전반적으로 좋은 라운딩 기운입니다', icon: '🦅' },
  { item: '인내심이 필요한 날', desc: '토(土) 기운으로 차분하게 플레이하세요', icon: '🧘' },
  { item: '동반자와 좋은 케미', desc: '대인운이 라운딩을 즐겁게 합니다', icon: '🤝' },
  { item: 'OB 주의보', desc: '화(火) 기운이 과해 힘 조절이 필요합니다', icon: '⚠️' },
];

const LUCKY_EXERCISE = [
  { item: '조깅·러닝', desc: '목(木) 기운을 끌어올리는 유산소입니다', icon: '🏃' },
  { item: '요가·스트레칭', desc: '유연한 기운이 몸과 마음을 풀어줍니다', icon: '🧘' },
  { item: '웨이트 트레이닝', desc: '금(金) 기운으로 단단함을 채우세요', icon: '🏋️' },
  { item: '수영', desc: '수(水) 기운이 스트레스를 씻어냅니다', icon: '🏊' },
  { item: '자전거', desc: '바람의 기운이 새 에너지를 줍니다', icon: '🚴' },
  { item: '등산', desc: '토(土)와 목(木) 기운이 균형을 이룹니다', icon: '🥾' },
  { item: '댄스', desc: '화(火) 기운으로 즐겁게 칼로리를 태우세요', icon: '💃' },
];

const LUCKY_NUMBER = [
  { item: '3', desc: '목(木) 기운의 숫자, 성장과 시작', icon: '🔢' },
  { item: '7', desc: '화(火) 기운의 숫자, 행운과 완성', icon: '🔢' },
  { item: '8', desc: '토(土) 기운의 숫자, 재물과 풍요', icon: '🔢' },
  { item: '5', desc: '중앙의 숫자, 균형과 조화', icon: '🔢' },
  { item: '9', desc: '금(金) 기운의 숫자, 결실과 완성', icon: '🔢' },
  { item: '1', desc: '수(水) 기운의 숫자, 새로운 시작', icon: '🔢' },
  { item: '6', desc: '천지의 조화수, 안정과 평화', icon: '🔢' },
];

const LUCKY_DIRECTION = [
  { item: '동쪽', desc: '목(木) 기운, 새로운 시작의 방향입니다', icon: '🧭' },
  { item: '남쪽', desc: '화(火) 기운, 활력과 열정의 방향입니다', icon: '🧭' },
  { item: '서쪽', desc: '금(金) 기운, 결실과 수확의 방향입니다', icon: '🧭' },
  { item: '북쪽', desc: '수(水) 기운, 지혜와 성찰의 방향입니다', icon: '🧭' },
  { item: '남동쪽', desc: '화(火)+목(木), 성장하는 에너지입니다', icon: '🧭' },
  { item: '남서쪽', desc: '화(火)+토(土), 안정된 활력입니다', icon: '🧭' },
  { item: '북동쪽', desc: '수(水)+목(木), 지혜로운 시작입니다', icon: '🧭' },
];

const LUCKY_TIME = [
  { item: '오전 7~9시 (진시)', desc: '양기가 상승하는 시간, 중요한 일을 시작하세요', icon: '⏰' },
  { item: '오전 9~11시 (사시)', desc: '화(火) 기운이 강한 시간, 회의와 발표에 좋습니다', icon: '⏰' },
  { item: '오후 1~3시 (미시)', desc: '토(土) 기운의 시간, 안정적인 업무에 적합합니다', icon: '⏰' },
  { item: '오후 3~5시 (신시)', desc: '금(金) 기운의 시간, 결단과 마무리에 좋습니다', icon: '⏰' },
  { item: '오후 5~7시 (유시)', desc: '기운이 전환되는 시간, 사교 활동에 좋습니다', icon: '⏰' },
  { item: '오전 5~7시 (묘시)', desc: '목(木) 기운의 시간, 운동과 명상에 최적입니다', icon: '⏰' },
  { item: '오후 7~9시 (술시)', desc: '수(水) 기운이 시작되는 시간, 휴식을 취하세요', icon: '⏰' },
];

const LUCKY_AROMA = [
  { item: '라벤더', desc: '마음을 진정시키고 숙면을 도와줍니다', icon: '💜' },
  { item: '페퍼민트', desc: '목(木) 기운으로 집중력을 높여줍니다', icon: '🌿' },
  { item: '시트러스 (레몬)', desc: '상쾌한 에너지로 기분을 전환합니다', icon: '🍋' },
  { item: '로즈', desc: '애정운을 높이는 화(火) 기운입니다', icon: '🌹' },
  { item: '유칼립투스', desc: '금(金) 기운으로 호흡을 깨끗이 합니다', icon: '🍃' },
  { item: '샌달우드', desc: '토(土) 기운으로 마음을 안정시킵니다', icon: '🪵' },
  { item: '자스민', desc: '달콤한 기운이 인간관계를 부드럽게 합니다', icon: '🤍' },
];

const LUCKY_ACCESSORY = [
  { item: '실버 반지', desc: '금(金) 기운이 결단력을 높여줍니다', icon: '💍' },
  { item: '가죽 시계', desc: '토(土) 기운이 안정감을 줍니다', icon: '⌚' },
  { item: '원석 팔찌', desc: '자연의 기운이 에너지를 채워줍니다', icon: '📿' },
  { item: '스카프·머플러', desc: '보호의 기운이 건강운을 높입니다', icon: '🧣' },
  { item: '모자·캡', desc: '화(火) 기운을 조절하는 아이템입니다', icon: '🧢' },
  { item: '선글라스', desc: '금(金) 기운이 카리스마를 높여줍니다', icon: '🕶️' },
  { item: '가방·백팩', desc: '토(土) 기운으로 안정적인 하루를 만듭니다', icon: '🎒' },
];

const LUCKY_MUSIC = [
  { item: '잔잔한 어쿠스틱', desc: '목(木) 기운이 마음을 편안하게 합니다', icon: '🎸' },
  { item: '신나는 K-POP', desc: '화(火) 기운으로 에너지를 충전하세요', icon: '🎤' },
  { item: '클래식 피아노', desc: '금(金) 기운이 집중력을 높여줍니다', icon: '🎹' },
  { item: '재즈·보사노바', desc: '수(水) 기운이 감성을 풍부하게 합니다', icon: '🎷' },
  { item: 'Lo-fi 힙합', desc: '토(土) 기운으로 안정적인 리듬을 줍니다', icon: '🎧' },
  { item: 'EDM·일렉트로닉', desc: '강한 화(火) 기운이 활력을 줍니다', icon: '🔊' },
  { item: 'R&B·소울', desc: '수(水) 기운이 감정을 다스려줍니다', icon: '🎵' },
];

const LUCKY_QUOTE = [
  { item: '"오늘 할 수 있는 일에 최선을 다하라"', desc: '마크 트웨인', icon: '📜' },
  { item: '"천 리 길도 한 걸음부터"', desc: '노자', icon: '📜' },
  { item: '"실패는 성공의 어머니"', desc: '토마스 에디슨', icon: '📜' },
  { item: '"행복은 습관이다, 그것을 몸에 지녀라"', desc: '허버드', icon: '📜' },
  { item: '"뜻이 있는 곳에 길이 있다"', desc: '속담', icon: '📜' },
  { item: '"위대한 일은 작은 일들이 모여 이루어진다"', desc: '빈센트 반 고흐', icon: '📜' },
  { item: '"변화는 고통스럽지만, 변하지 않는 건 더 고통스럽다"', desc: '짐 론', icon: '📜' },
];

const LUCKY_MOVIE = [
  { item: '가벼운 로맨스 영화', desc: '애정운이 높은 날, 감성을 채우세요', icon: '🎬' },
  { item: '액션·어드벤처', desc: '화(火) 기운이 강한 날에 어울립니다', icon: '🎬' },
  { item: '다큐멘터리', desc: '수(水) 기운의 날, 지식을 넓히세요', icon: '🎬' },
  { item: '코미디', desc: '웃음이 운의 흐름을 바꿔줍니다', icon: '🎬' },
  { item: '힐링 드라마', desc: '토(土) 기운의 날, 마음을 달래세요', icon: '🎬' },
  { item: '스릴러·미스터리', desc: '금(金) 기운의 날, 직감이 날카롭습니다', icon: '🎬' },
  { item: '애니메이션', desc: '목(木) 기운의 날, 동심이 행운을 부릅니다', icon: '🎬' },
];

const LUCKY_FLOWER = [
  { item: '장미', desc: '화(火) 기운, 사랑과 열정의 꽃', icon: '🌹' },
  { item: '해바라기', desc: '토(土) 기운, 밝은 에너지의 꽃', icon: '🌻' },
  { item: '라벤더', desc: '금(金) 기운, 평화와 안정의 꽃', icon: '💐' },
  { item: '튤립', desc: '목(木) 기운, 새로운 시작의 꽃', icon: '🌷' },
  { item: '수국', desc: '수(水) 기운, 조화와 감사의 꽃', icon: '💠' },
  { item: '벚꽃', desc: '목(木) 기운, 아름다운 순간의 꽃', icon: '🌸' },
  { item: '카네이션', desc: '화(火) 기운, 사랑과 존경의 꽃', icon: '🌺' },
];

const LUCKY_EMOJI = [
  { item: '✨', desc: '반짝이는 에너지가 행운을 부릅니다', icon: '✨' },
  { item: '🍀', desc: '네잎클로버의 행운이 함께합니다', icon: '🍀' },
  { item: '🔥', desc: '불꽃 에너지로 열정을 태우세요', icon: '🔥' },
  { item: '🌊', desc: '파도의 기운이 새 흐름을 만듭니다', icon: '🌊' },
  { item: '⭐', desc: '별의 기운이 빛나는 하루를 만듭니다', icon: '⭐' },
  { item: '🦋', desc: '변화의 기운이 새 기회를 가져옵니다', icon: '🦋' },
  { item: '🌈', desc: '무지개 기운으로 모든 일이 순조롭습니다', icon: '🌈' },
];

const LUCKY_ANIMAL = [
  { item: '호랑이', desc: '용맹한 기운이 도전 정신을 높입니다', icon: '🐯' },
  { item: '용', desc: '최고의 행운 동물, 큰 성취를 암시합니다', icon: '🐉' },
  { item: '토끼', desc: '목(木) 기운, 부드럽고 유연한 하루입니다', icon: '🐰' },
  { item: '거북이', desc: '수(水) 기운, 느리지만 확실한 진전입니다', icon: '🐢' },
  { item: '봉황', desc: '화(火) 기운, 화려한 성공이 기대됩니다', icon: '🦅' },
  { item: '사슴', desc: '목(木) 기운, 우아한 행운이 찾아옵니다', icon: '🦌' },
  { item: '잉어', desc: '수(水) 기운, 출세와 도약의 상징입니다', icon: '🐟' },
];

const LUCKY_WEATHER = [
  { item: '맑은 날 최고!', desc: '양(陽) 기운이 충만해 모든 일이 순조롭습니다', icon: '☀️' },
  { item: '구름 낀 하늘도 괜찮아요', desc: '차분한 기운이 깊은 사고를 돕습니다', icon: '⛅' },
  { item: '비 오면 우산은 필수', desc: '수(水) 기운이 과해 실내 활동이 좋습니다', icon: '🌧️' },
  { item: '바람이 행운을 실어옵니다', desc: '목(木) 기운이 새 소식을 가져옵니다', icon: '🌬️' },
  { item: '눈이 오면 행운의 날', desc: '순수한 수(水) 기운이 마음을 정화합니다', icon: '❄️' },
  { item: '안개 낀 날, 신중하게', desc: '기운이 흐려 중요한 결정은 미루세요', icon: '🌫️' },
  { item: '무지개가 뜰 기운!', desc: '비 뒤 맑음, 어려움 뒤 좋은 일이 옵니다', icon: '🌈' },
];

type WidgetKey = 'coordi' | 'food' | 'place' | 'color' | 'drink' | 'snack' | 'alcohol' |
  'baseball' | 'golf' | 'exercise' | 'number' | 'direction' | 'time' | 'aroma' |
  'accessory' | 'music' | 'quote' | 'movie' | 'flower' | 'emoji' | 'animal' | 'weather';

type WidgetCategory = '기본' | '먹거리/음료' | '스포츠/레저' | '라이프스타일' | '문화/감성' | '동물/자연';

interface WidgetConfig {
  key: WidgetKey;
  title: string;
  icon: string;
  data: { item: string; desc: string; icon?: string; color?: string }[];
  seedOffset: number;
  category: WidgetCategory;
}

const ALL_WIDGETS: WidgetConfig[] = [
  { key: 'coordi', title: '오늘의 코디', icon: '👔', data: LUCKY_COORDI, seedOffset: 1, category: '기본' },
  { key: 'food', title: '오늘의 음식', icon: '🍽️', data: LUCKY_FOOD, seedOffset: 37, category: '기본' },
  { key: 'place', title: '오늘의 장소', icon: '📍', data: LUCKY_PLACE, seedOffset: 73, category: '기본' },
  { key: 'color', title: '오늘의 컬러', icon: '🎨', data: LUCKY_COLOR, seedOffset: 53, category: '기본' },
  { key: 'drink', title: '오늘의 음료', icon: '☕', data: LUCKY_DRINK, seedOffset: 11, category: '먹거리/음료' },
  { key: 'snack', title: '오늘의 간식', icon: '🍫', data: LUCKY_SNACK, seedOffset: 23, category: '먹거리/음료' },
  { key: 'alcohol', title: '오늘의 술', icon: '🍷', data: LUCKY_ALCOHOL, seedOffset: 41, category: '먹거리/음료' },
  { key: 'baseball', title: '야구 승패 예측', icon: '⚾', data: LUCKY_BASEBALL, seedOffset: 59, category: '스포츠/레저' },
  { key: 'golf', title: '오늘의 골프운', icon: '⛳', data: LUCKY_GOLF, seedOffset: 67, category: '스포츠/레저' },
  { key: 'exercise', title: '오늘의 운동', icon: '🏃', data: LUCKY_EXERCISE, seedOffset: 79, category: '스포츠/레저' },
  { key: 'number', title: '행운의 숫자', icon: '🔢', data: LUCKY_NUMBER, seedOffset: 83, category: '라이프스타일' },
  { key: 'direction', title: '행운의 방위', icon: '🧭', data: LUCKY_DIRECTION, seedOffset: 89, category: '라이프스타일' },
  { key: 'time', title: '행운의 시간', icon: '⏰', data: LUCKY_TIME, seedOffset: 97, category: '라이프스타일' },
  { key: 'aroma', title: '오늘의 향기', icon: '🌸', data: LUCKY_AROMA, seedOffset: 31, category: '라이프스타일' },
  { key: 'accessory', title: '오늘의 액세서리', icon: '💍', data: LUCKY_ACCESSORY, seedOffset: 43, category: '라이프스타일' },
  { key: 'music', title: '오늘의 음악', icon: '🎵', data: LUCKY_MUSIC, seedOffset: 61, category: '문화/감성' },
  { key: 'quote', title: '오늘의 명언', icon: '📜', data: LUCKY_QUOTE, seedOffset: 71, category: '문화/감성' },
  { key: 'movie', title: '오늘의 영화', icon: '🎬', data: LUCKY_MOVIE, seedOffset: 47, category: '문화/감성' },
  { key: 'flower', title: '오늘의 꽃', icon: '💐', data: LUCKY_FLOWER, seedOffset: 29, category: '문화/감성' },
  { key: 'emoji', title: '오늘의 이모지', icon: '✨', data: LUCKY_EMOJI, seedOffset: 17, category: '문화/감성' },
  { key: 'animal', title: '행운의 동물', icon: '🐉', data: LUCKY_ANIMAL, seedOffset: 51, category: '동물/자연' },
  { key: 'weather', title: '오늘의 날씨운', icon: '☀️', data: LUCKY_WEATHER, seedOffset: 7, category: '동물/자연' },
];

const WIDGET_CATEGORIES: WidgetCategory[] = ['기본', '먹거리/음료', '스포츠/레저', '라이프스타일', '문화/감성', '동물/자연'];

const DEFAULT_WIDGETS: WidgetKey[] = ['coordi', 'food', 'place', 'color'];

const TAROT_CATEGORIES = [
  { key: 'daily', emoji: '🪬', label: '오늘의 타로', desc: '하루의 흐름을 한 장에 담다', count: 1, positions: ['오늘의 메시지'], color: '#FF9500' },
  { key: 'love', emoji: '🫧', label: '연애운', desc: '사랑의 흐름을 읽다', count: 3, positions: ['마음', '관계', '방향'], color: '#FF2D55' },
  { key: 'money', emoji: '🪙', label: '재물운', desc: '금전의 기운을 살피다', count: 3, positions: ['현재', '흐름', '조언'], color: '#34C759' },
  { key: 'career', emoji: '🧿', label: '직업운', desc: '진로와 성취의 길을 보다', count: 3, positions: ['상황', '과제', '결과'], color: '#007AFF' },
  { key: 'health', emoji: '🍀', label: '건강운', desc: '몸과 마음의 균형을 읽다', count: 1, positions: ['건강 메시지'], color: '#5856D6' },
  { key: 'yesno', emoji: '🎱', label: 'Yes / No', desc: '명쾌한 답을 구하다', count: 1, positions: ['답'], color: '#8E8E93' },
  { key: 'timeline', emoji: '🔮', label: '타임라인', desc: '시간의 흐름 속 나를 보다', count: 3, positions: ['과거', '현재', '미래'], color: '#AF52DE' },
  { key: 'advice', emoji: '🪷', label: '조언', desc: '지금 내게 필요한 한마디', count: 1, positions: ['조언'], color: '#FF6482' },
];

type HexKey = 'overall' | 'wealth' | 'career' | 'love' | 'health' | 'social';

const HEX_CATEGORIES: { key: HexKey; label: string; color: string }[] = [
  { key: 'overall', label: '종합운', color: '#5856D6' },
  { key: 'wealth', label: '재물운', color: '#FF9500' },
  { key: 'career', label: '직업운', color: '#007AFF' },
  { key: 'love', label: '애정운', color: '#FF2D55' },
  { key: 'health', label: '건강운', color: '#34C759' },
  { key: 'social', label: '대인운', color: '#AF52DE' },
];


const HEX_CARD_PADDING = 16;
const HEX_CHART_SIZE = SCREEN_WIDTH - spacing.md * 2 - HEX_CARD_PADDING * 2;
const HEX_CENTER = HEX_CHART_SIZE / 2;
const HEX_RADIUS = HEX_CHART_SIZE / 2 - 36;

function getHexPt(index: number, radius: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  return { x: HEX_CENTER + radius * Math.cos(angle), y: HEX_CENTER + radius * Math.sin(angle) };
}

function hexPts(radius: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const p = getHexPt(i, radius);
    return `${p.x},${p.y}`;
  }).join(' ');
}

function HexagonChart({ scores }: { scores: Record<string, number> }) {
  const dataPoints = HEX_CATEGORIES.map((cat, i) => {
    const r = (scores[cat.key] / 100) * HEX_RADIUS;
    return getHexPt(i, r);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={hexStyles.wrap}>
      <View style={{ position: 'relative', alignItems: 'center' }}>
        <Svg width={HEX_CHART_SIZE} height={HEX_CHART_SIZE} style={{ marginVertical: spacing.sm }}>
          <Defs>
            <LinearGradient id="hexFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#007AFF" stopOpacity="0.2" />
              <Stop offset="1" stopColor="#5AC8FA" stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <Polygon key={ratio} points={hexPts(HEX_RADIUS * ratio)} fill="none" stroke={Colors.border} strokeWidth={0.8} />
          ))}

          {HEX_CATEGORIES.map((_, i) => {
            const p = getHexPt(i, HEX_RADIUS);
            return <Line key={i} x1={HEX_CENTER} y1={HEX_CENTER} x2={p.x} y2={p.y} stroke={Colors.border} strokeWidth={0.5} />;
          })}

          <Polygon points={dataPolygon} fill="url(#hexFill)" stroke="#007AFF" strokeWidth={2} strokeLinejoin="round" />

          {dataPoints.map((p, i) => (
            <SvgCircle key={i} cx={p.x} cy={p.y} r={4} fill={Colors.white} stroke="#007AFF" strokeWidth={2} />
          ))}
        </Svg>

        {HEX_CATEGORIES.map((cat, i) => {
          const p = getHexPt(i, HEX_RADIUS + 24);
          const score = scores[cat.key];
          return (
            <View key={cat.key} style={[hexStyles.labelWrap, { left: p.x - 28, top: p.y - 18 + spacing.sm }]}>
              <Text style={hexStyles.labelText}>{cat.label}</Text>
              <Text style={hexStyles.labelScore}>{score}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const hexStyles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  labelWrap: { position: 'absolute', width: 56, alignItems: 'center' },
  labelText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  labelScore: { fontSize: 13, fontWeight: '700', color: '#007AFF' },
});

/** Battery score indicator */
function BatteryScore({ score }: { score: number }) {
  const fillPct = Math.max(8, Math.min(100, score));
  const color =
    score > 60 ? Colors.success :
    score >= 20 ? Colors.warning :
    Colors.error;

  return (
    <View style={bat.wrap}>
      <Text style={bat.score}>{score}%</Text>
      <View style={bat.batteryRow}>
        <View style={bat.body}>
          <View style={[bat.fill, { width: `${fillPct}%`, backgroundColor: color }]} />
        </View>
        <View style={bat.tip} />
      </View>
    </View>
  );
}

const bat = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10 },
  score: { fontSize: 56, fontWeight: '700', color: Colors.text },
  batteryRow: { flexDirection: 'row', alignItems: 'center' },
  body: {
    width: 100, height: 36, borderRadius: 8,
    borderWidth: 2, borderColor: Colors.gray500,
    overflow: 'hidden',
    padding: 3,
  },
  fill: {
    height: '100%', borderRadius: 5,
  },
  tip: {
    width: 5, height: 16, borderTopRightRadius: 3, borderBottomRightRadius: 3,
    backgroundColor: Colors.gray500, marginLeft: -0.5,
  },
});


function getWeekDates(): Date[] {
  const today = new Date();
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}


export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { history, loadHistory, loadProfiles, activeProfile, userMbti, loadUserMbti } = useSajuStore();
  const profile = activeProfile();

  const [activeTab, setActiveTab] = useState<HomeTab>('fortune');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [activeWidgets, setActiveWidgets] = useState<WidgetKey[]>(DEFAULT_WIDGETS);
  const [pinnedWidget, setPinnedWidget] = useState<WidgetKey | null>(null);
  const [widgetModalVisible, setWidgetModalVisible] = useState(false);
  const [modalTab, setModalTab] = useState<'my' | 'add'>('my');

  const bannerRef = useRef<ScrollView>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const weekDates = useMemo(() => getWeekDates(), []);

  useEffect(() => {
    loadHistory();
    loadProfiles();
    loadUserMbti();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setSelectedDayIndex(0);
    }, [])
  );

  // Auto-slide banner
  const startAutoSlide = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
        return next;
      });
    }, 3000);
  }, []);

  useEffect(() => {
    if (activeTab === 'fortune') startAutoSlide();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startAutoSlide, activeTab]);

  const handleBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    if (index >= 0 && index < BANNERS.length && index !== currentBanner) {
      setCurrentBanner(index);
    }
  };

  const handleBannerScrollEnd = () => {
    startAutoSlide();
  };

  // Fortune score calculation (profile 기준)
  const fortune = useMemo(() => {
    if (!profile) return null;

    const todayPillar = getTodayPillar();
    const myElement = getStemElement(profile.sajuData.pillars.day.stem);
    const todayElement = todayPillar.element;
    const relationship = getElementRelationship(myElement, todayElement);

    const scoreMap: Record<string, number> = {
      '상생 (生)': 85, '역생 (被生)': 80, '같은 오행': 75,
      '중립': 65, '상극 (剋)': 50, '역극 (被剋)': 45,
    };
    const base = scoreMap[relationship] || 60;
    const dayVar = (new Date().getDate() * 7 + new Date().getMonth() * 13) % 20 - 10;
    const score = Math.min(100, Math.max(0, base + dayVar));
    const message = FORTUNE_MESSAGES[relationship] || '오늘 하루도 좋은 하루 되세요';

    return { score, message };
  }, [profile]);

  // 육각형 운세 점수 (WeeklyFortuneScreen 동일 로직)
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

  const selectedDate = weekDates[selectedDayIndex];

  // 날짜별 운세 점수 계산
  const weekScores = useMemo(() => {
    if (!profile) return null;
    const myElement = getStemElement(profile.sajuData.pillars.day.stem);
    const scoreMap: Record<string, number> = {
      '상생 (生)': 85, '역생 (被生)': 80, '같은 오행': 75,
      '중립': 65, '상극 (剋)': 50, '역극 (被剋)': 45,
    };
    return weekDates.map((date) => {
      const pillar = getDayPillar(date);
      const relationship = getElementRelationship(myElement, pillar.element);
      const base = scoreMap[relationship] || 60;
      const dayVar = (date.getDate() * 7 + date.getMonth() * 13) % 20 - 10;
      return Math.min(100, Math.max(0, base + dayVar));
    });
  }, [profile, weekDates]);

  const seed = useMemo(() => {
    const d = selectedDate;
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }, [selectedDate]);

  const getWidgetItem = useCallback((widget: WidgetConfig) => {
    return widget.data[(seed + widget.seedOffset) % widget.data.length];
  }, [seed]);

  const toggleWidget = useCallback((key: WidgetKey) => {
    setActiveWidgets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
    setPinnedWidget((prev) => (prev === key ? null : prev));
  }, []);

  // Drag-to-reorder state
  const [draggingIdx, setDraggingIdx] = useState(-1);
  const draggingRef = useRef(-1);
  const panY = useRef(new Animated.Value(0)).current;
  const activeWidgetsRef = useRef(activeWidgets);
  activeWidgetsRef.current = activeWidgets;

  const ROW_HEIGHT = 52;

  const makeDragHandlers = useCallback((index: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        draggingRef.current = index;
        setDraggingIdx(index);
        panY.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, { dy }) => {
        const from = draggingRef.current;
        const items = activeWidgetsRef.current;
        if (from >= 0) {
          const steps = Math.round(dy / ROW_HEIGHT);
          const to = Math.max(0, Math.min(items.length - 1, from + steps));
          if (from !== to) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setActiveWidgets(prev => {
              const next = [...prev];
              const [moved] = next.splice(from, 1);
              next.splice(to, 0, moved);
              return next;
            });
          }
        }
        draggingRef.current = -1;
        setDraggingIdx(-1);
        panY.setValue(0);
      },
      onPanResponderTerminate: () => {
        draggingRef.current = -1;
        setDraggingIdx(-1);
        panY.setValue(0);
      },
    }).panHandlers;
  }, [panY]);

  const togglePin = useCallback((key: WidgetKey) => {
    setPinnedWidget((prev) => (prev === key ? null : key));
  }, []);

  // 핀 위젯을 맨 위로 정렬
  const sortedWidgets = useMemo(() => {
    if (!pinnedWidget || !activeWidgets.includes(pinnedWidget)) return activeWidgets;
    return [pinnedWidget, ...activeWidgets.filter((k) => k !== pinnedWidget)];
  }, [activeWidgets, pinnedWidget]);

  const handleFeaturePress = (action: string) => {
    switch (action) {
      case 'SajuInput':
        // 프로필 있으면 결과 직행, 없으면 입력 화면
        if (profile) {
          navigation.navigate('SajuResult', { sajuData: profile.sajuData });
        } else {
          navigation.navigate('SajuInput');
        }
        break;
      case 'Fortune': case 'Compatibility': case 'History': case 'FaceReading': case 'NewYearFortune': case 'Tarot':
        navigation.navigate(action as any);
        break;
      case 'lucky':
        setActiveTab('lucky');
        break;
      case 'Shop': case 'Consult':
        (navigation.getParent() as any)?.navigate(action);
        break;
    }
  };

  const userName = profile?.sajuData.name ?? null;
  const greetingText = useMemo(() => getGreetingText(), []);

  const formatHeaderDate = (date: Date) =>
    date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.logo}>신묘</Text>
          <View style={styles.headerIcons}>
            <IconButton icon="magnify" size={22} iconColor={Colors.textSecondary} onPress={() => {}} style={styles.headerIconBtn} />
            <IconButton icon="bell-outline" size={22} iconColor={Colors.textSecondary} onPress={() => {}} style={styles.headerIconBtn} />
          </View>
        </View>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>
            {greetingText}{userName ? ', ' : ''}
          </Text>
          {userName && (
            <TouchableOpacity onPress={() => (navigation.getParent() as NavigationProp)?.navigate('ProfileList')} activeOpacity={0.6}>
              <Text style={styles.greetingName}>{userName}님 ›</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabBar}>
        <View style={styles.tabButtons}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'fortune' && styles.tabButtonActive]}
            onPress={() => setActiveTab('fortune')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'fortune' && styles.tabTextActive]}>신묘운세</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'mbti' && styles.tabButtonActive]}
            onPress={() => setActiveTab('mbti')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'mbti' && styles.tabTextActive]}>MBTI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tarot' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tarot')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'tarot' && styles.tabTextActive]}>신묘타로</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'lucky' && styles.tabButtonActive]}
            onPress={() => { setActiveTab('lucky'); setSelectedDayIndex(0); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'lucky' && styles.tabTextActive]}>신묘행운</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'fortune' ? (
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* 1) Banner Slider */}
            <View style={styles.bannerContainer}>
              <ScrollView
                ref={bannerRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleBannerScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleBannerScrollEnd}
                snapToInterval={BANNER_WIDTH}
                decelerationRate="fast"
              >
                {BANNERS.map((banner, index) => (
                  <Card
                    key={index}
                    style={[styles.bannerCard, { backgroundColor: banner.bg }]}
                    onPress={() => navigation.navigate(banner.route as any, banner.params as any)}
                  >
                    <Card.Content style={styles.bannerContent}>
                      <Text variant="headlineSmall" style={styles.bannerTitle}>{banner.title}</Text>
                      <Text variant="bodyMedium" style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                    </Card.Content>
                  </Card>
                ))}
              </ScrollView>
              <View style={styles.dotOverlay}>
                {BANNERS.map((_, index) => (
                  <View key={index} style={[styles.dot, currentBanner === index ? styles.dotActive : styles.dotInactive]} />
                ))}
              </View>
            </View>

            {/* 2) Feature Grid */}
            <View style={styles.featureGrid}>
              {FEATURES.map((feat, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.featureItem}
                  onPress={() => handleFeaturePress(feat.action)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.featureIcon}>{feat.icon}</Text>
                  <Text style={styles.featureLabel}>{feat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 3) Fortune Card */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate(fortune ? 'WeeklyFortune' : 'SajuInput')}
            >
              <Card style={styles.fortuneCard}>
                <Card.Content style={styles.fortuneContent}>
                  <Text style={styles.fortuneLabel}>오늘의 운세</Text>
                  {fortune ? (
                    <>
                      <Text style={styles.fortuneTitle}>
                        {userName ?? '회원'}님의 운세 배터리 ⚡
                      </Text>
                      <View style={styles.fortuneScoreWrap}>
                        <BatteryScore score={fortune.score} />
                      </View>
                      <Text style={styles.fortuneMessage}>{fortune.message}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.fortuneTitle}>사주를 등록해보세요</Text>
                      <View style={styles.fortuneScoreWrap}>
                        <View style={styles.fortunePlaceholder}>
                          <Text style={styles.fortunePlaceholderText}>?</Text>
                        </View>
                      </View>
                    </>
                  )}
                </Card.Content>
                {fortune && (
                  <View style={styles.fortuneFooter}>
                    <Text style={styles.fortuneFooterText}>탭하여 주간 운세 보기</Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>

            {/* 4) Banner Ad */}
            <View style={styles.adBanner}>
              <Text style={styles.adEmoji}>🔮</Text>
              <View style={styles.adTextWrap}>
                <Text style={styles.adTitle}>프리미엄 사주 상담</Text>
                <Text style={styles.adDesc}>전문 역술가의 1:1 맞춤 상담</Text>
              </View>
              <View style={styles.adBadge}>
                <Text style={styles.adBadgeText}>AD</Text>
              </View>
            </View>

            {/* 5) Hexagon Fortune Chart */}
            {hexScores && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('FortuneDetail')}
              >
                <Card style={styles.hexCard}>
                  <Card.Content>
                    <Text style={styles.hexLabel}>오늘의 운세</Text>
                    <Text style={styles.hexTitle}>카테고리별 운세 분석</Text>
                    <HexagonChart scores={hexScores} />
                  </Card.Content>
                  <View style={styles.fortuneFooter}>
                    <Text style={styles.fortuneFooterText}>탭하여 자세히 보기</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : activeTab === 'lucky' ? (
        /* ===== 행운보고서 ===== */
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text variant="titleLarge" style={styles.luckyDateTitle}>
              {formatHeaderDate(selectedDate)}
            </Text>

            <View style={styles.daySelector}>
              {weekDates.map((date, index) => {
                const isSelected = index === selectedDayIndex;
                const isToday = index === 0;
                const score = weekScores ? weekScores[index] : null;
                const batteryColor = score !== null
                  ? score > 60 ? Colors.success : score >= 20 ? Colors.warning : Colors.error
                  : Colors.gray400;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayItem, isSelected && styles.dayItemActive]}
                    onPress={() => setSelectedDayIndex(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                      {DAY_NAMES[date.getDay()]}
                    </Text>
                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                      {date.getDate()}
                    </Text>
                    {score !== null ? (
                      <View style={styles.miniBattery}>
                        <View style={[styles.miniBatteryBody, isSelected && { borderColor: 'rgba(255,255,255,0.5)' }]}>
                          <View style={[styles.miniBatteryFill, {
                            width: `${Math.max(15, score)}%`,
                            backgroundColor: batteryColor,
                          }]} />
                        </View>
                        <View style={[styles.miniBatteryTip, {
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.5)' : Colors.gray400,
                        }]} />
                      </View>
                    ) : isToday ? (
                      <View style={styles.todayDot} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {sortedWidgets.map((widgetKey) => {
              const widget = ALL_WIDGETS.find((w) => w.key === widgetKey);
              if (!widget) return null;
              const item = getWidgetItem(widget);
              const isColor = widgetKey === 'color';
              const isPinned = pinnedWidget === widgetKey;
              return (
                <Card key={widgetKey} style={styles.luckyCard}>
                  <Card.Content>
                    <View style={styles.luckyHeader}>
                      {isColor ? (
                        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                      ) : (
                        <Text style={styles.luckyEmoji}>{item.icon || widget.icon}</Text>
                      )}
                      <Text variant="titleMedium" style={styles.luckyTitle}>{widget.title}</Text>
                      {isPinned && <Text style={styles.pinBadge}>PIN</Text>}
                    </View>
                    <Text variant="titleSmall" style={styles.luckyItem}>{item.item}</Text>
                    <Text variant="bodyMedium" style={styles.luckyDesc}>{item.desc}</Text>
                  </Card.Content>
                </Card>
              );
            })}

            <TouchableOpacity style={styles.addWidgetBtn} activeOpacity={0.7} onPress={() => setWidgetModalVisible(true)}>
              <Text style={styles.addWidgetIcon}>+</Text>
            </TouchableOpacity>

            {/* Widget Management Modal */}
            <Modal visible={widgetModalVisible} animationType="slide" transparent>
              <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={() => setWidgetModalVisible(false)}>
                <View style={[modalStyles.sheet, { paddingBottom: insets.bottom + 16 }]} onStartShouldSetResponder={() => true}>
                  <View style={modalStyles.header}>
                    <Text style={modalStyles.title}>위젯 관리</Text>
                    <TouchableOpacity onPress={() => setWidgetModalVisible(false)}>
                      <Text style={modalStyles.done}>완료</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Tab Switcher */}
                  <View style={modalStyles.tabBar}>
                    <TouchableOpacity
                      style={[modalStyles.tab, modalTab === 'my' && modalStyles.tabActive]}
                      onPress={() => setModalTab('my')}
                      activeOpacity={0.7}
                    >
                      <Text style={[modalStyles.tabText, modalTab === 'my' && modalStyles.tabTextActive]}>내 위젯</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[modalStyles.tab, modalTab === 'add' && modalStyles.tabActive]}
                      onPress={() => setModalTab('add')}
                      activeOpacity={0.7}
                    >
                      <Text style={[modalStyles.tabText, modalTab === 'add' && modalStyles.tabTextActive]}>위젯 추가</Text>
                    </TouchableOpacity>
                  </View>

                  {modalTab === 'my' ? (
                    activeWidgets.length === 0 ? (
                      <View style={modalStyles.emptyWrap}>
                        <Text style={modalStyles.emptyText}>추가된 위젯이 없습니다</Text>
                        <Text style={modalStyles.emptyHint}>'위젯 추가' 탭에서 위젯을 추가해보세요</Text>
                      </View>
                    ) : (
                      <ScrollView style={modalStyles.list} showsVerticalScrollIndicator={false} scrollEnabled={draggingIdx < 0}>
                        {activeWidgets.map((widgetKey, index) => {
                          const widget = ALL_WIDGETS.find((w) => w.key === widgetKey);
                          if (!widget) return null;
                          const isPinned = pinnedWidget === widgetKey;
                          const isDragging = draggingIdx === index;
                          const dragHandlers = makeDragHandlers(index);
                          return (
                            <Animated.View
                              key={widgetKey}
                              style={[
                                modalStyles.row,
                                isDragging && modalStyles.rowDragging,
                                isDragging && {
                                  transform: [{ translateY: panY }],
                                  zIndex: 100,
                                  elevation: 8,
                                },
                              ]}
                            >
                              <View {...dragHandlers}>
                                <Text style={modalStyles.dragHandle}>☰</Text>
                              </View>
                              <Text style={modalStyles.rowIcon}>{widget.icon}</Text>
                              <Text style={modalStyles.rowLabel}>{widget.title}</Text>
                              <View style={modalStyles.rowActions}>
                                <TouchableOpacity onPress={() => togglePin(widgetKey)} style={modalStyles.actionBtn}>
                                  <Text style={modalStyles.actionIcon}>
                                    {isPinned ? '📌' : '📍'}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => toggleWidget(widgetKey)} style={modalStyles.actionBtn}>
                                  <Text style={modalStyles.removeIcon}>−</Text>
                                </TouchableOpacity>
                              </View>
                            </Animated.View>
                          );
                        })}
                      </ScrollView>
                    )
                  ) : (
                    <ScrollView style={modalStyles.list} showsVerticalScrollIndicator={false}>
                      {WIDGET_CATEGORIES.map((cat) => {
                        const widgets = ALL_WIDGETS.filter((w) => w.category === cat);
                        return (
                          <View key={cat}>
                            <Text style={modalStyles.sectionTitle}>{cat}</Text>
                            {widgets.map((widget) => {
                              const isActive = activeWidgets.includes(widget.key);
                              return (
                                <TouchableOpacity
                                  key={widget.key}
                                  style={modalStyles.row}
                                  activeOpacity={0.6}
                                  onPress={() => toggleWidget(widget.key)}
                                >
                                  <Text style={modalStyles.rowIcon}>{widget.icon}</Text>
                                  <Text style={modalStyles.rowLabel}>{widget.title}</Text>
                                  <Switch
                                    value={isActive}
                                    onValueChange={() => toggleWidget(widget.key)}
                                    trackColor={{ false: Colors.gray300, true: Colors.primary }}
                                  />
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </ScrollView>
      ) : activeTab === 'tarot' ? (
        /* ===== 타로 ===== */
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* 1) 오늘의 타로 카드 */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('TarotReading', {
                category: 'daily', label: '오늘의 타로', count: 1, positions: ['오늘의 메시지'],
              })}
            >
              <Card style={styles.fortuneCard}>
                <Card.Content style={styles.fortuneContent}>
                  <Text style={styles.fortuneLabel}>오늘의 타로</Text>
                  <Text style={styles.fortuneTitle}>오늘 나에게 필요한 메시지</Text>
                  <View style={styles.fortuneScoreWrap}>
                    <Text style={{ fontSize: 56 }}>🃏</Text>
                  </View>
                  <Text style={styles.fortuneMessage}>카드를 뽑아 확인해보세요</Text>
                </Card.Content>
                <View style={styles.fortuneFooter}>
                  <Text style={styles.fortuneFooterText}>탭하여 원카드 뽑기</Text>
                </View>
              </Card>
            </TouchableOpacity>

            {/* 2) 광고 배너 */}
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

            {/* 3) 전체 카테고리 그리드 */}
            <Text style={styles.tarotTitle}>어떤 이야기를 들어볼까요?</Text>
            <View style={styles.featureGrid}>
              {TAROT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={styles.featureItem}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate('TarotReading', {
                      category: cat.key,
                      label: cat.label,
                      count: cat.count,
                      positions: cat.positions,
                    })
                  }
                >
                  <Text style={styles.featureIcon}>{cat.emoji}</Text>
                  <Text style={styles.featureLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        /* ===== MBTI ===== */
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* 나의 MBTI 카드 */}
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Mbti')}>
              {userMbti && MBTI_BRIEF[userMbti] ? (() => {
                const mb = MBTI_BRIEF[userMbti];
                return (
                  <Card style={styles.fortuneCard}>
                    <Card.Content style={styles.fortuneContent}>
                      <Text style={styles.fortuneLabel}>나의 MBTI</Text>
                      <Text style={styles.fortuneTitle}>
                        {userName ?? '회원'}님은 {mb.title} {mb.emoji}
                      </Text>
                      <View style={styles.fortuneScoreWrap}>
                        <Text style={{ fontSize: 48, letterSpacing: 8, fontWeight: '800', color: Colors.primary }}>{userMbti}</Text>
                      </View>
                      <Text style={styles.fortuneMessage}>{mb.desc}</Text>
                    </Card.Content>
                    <View style={styles.fortuneFooter}>
                      <Text style={styles.fortuneFooterText}>탭하여 상세 분석 보기</Text>
                    </View>
                  </Card>
                );
              })() : (
                <Card style={[styles.fortuneCard, { backgroundColor: Colors.primary }]}>
                  <Card.Content style={styles.fortuneContent}>
                    <Text style={{ fontSize: 48, marginBottom: 8 }}>📝</Text>
                    <Text style={[styles.fortuneLabel, { color: 'rgba(255,255,255,0.7)' }]}>나의 MBTI</Text>
                    <Text style={[styles.fortuneTitle, { color: '#fff', fontSize: 22 }]}>아직 등록되지 않았어요</Text>
                    <Text style={[styles.fortuneMessage, { color: 'rgba(255,255,255,0.8)' }]}>
                      검사를 받거나 직접 입력해보세요
                    </Text>
                  </Card.Content>
                  <View style={[styles.fortuneFooter, { borderTopColor: 'rgba(255,255,255,0.15)' }]}>
                    <Text style={[styles.fortuneFooterText, { color: 'rgba(255,255,255,0.9)' }]}>탭하여 MBTI 등록하기</Text>
                  </View>
                </Card>
              )}
            </TouchableOpacity>

            {/* 사주 추정 MBTI 카드 */}
            {profile && (() => {
              const el = profile.sajuData.elements;
              const sajuType =
                (((el.fire + el.wood) / 8 * 100) >= 50 ? 'E' : 'I') +
                (((el.earth + el.metal) / 8 * 100) >= 50 ? 'S' : 'N') +
                (((el.metal + el.water) / 8 * 100) >= 50 ? 'T' : 'F') +
                (((el.earth + el.metal) / 8 * 100) >= 50 ? 'J' : 'P');
              const sajuBrief = MBTI_BRIEF[sajuType];
              const matchCount = userMbti ? [0,1,2,3].filter(i => sajuType[i] === userMbti[i]).length : null;
              return (
                <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Mbti')}>
                  <Card style={styles.fortuneCard}>
                    <Card.Content style={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.lg }}>
                      <Text style={styles.fortuneLabel}>사주 추정 MBTI</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 32, letterSpacing: 6, fontWeight: '800', color: Colors.text }}>{sajuType}</Text>
                          {sajuBrief && (
                            <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4 }}>
                              {sajuBrief.emoji} {sajuBrief.title} — {sajuBrief.desc}
                            </Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 36 }}>🔮</Text>
                      </View>
                      {matchCount !== null && (
                        <>
                          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>
                              {matchCount === 4 ? '완벽한 조화' : matchCount >= 3 ? '높은 일치도' : matchCount >= 2 ? '흥미로운 조합' : '독특한 개성'}
                            </Text>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: matchCount >= 3 ? Colors.primary : Colors.warning }}>일치 {matchCount}/4</Text>
                          </View>
                          <View style={{ marginTop: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surfaceLight, overflow: 'hidden' }}>
                            <View style={{ width: `${matchCount * 25}%`, height: '100%', borderRadius: 4, backgroundColor: matchCount >= 3 ? Colors.primary : matchCount >= 2 ? Colors.warning : Colors.error }} />
                          </View>
                        </>
                      )}
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              );
            })()}

            {/* 광고 배너 */}
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
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: Colors.surface,
  },
  headerTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  greeting: { fontSize: 14, fontWeight: '400', color: Colors.textSecondary, letterSpacing: 0.2 },
  greetingName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  logo: { fontSize: 32, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  headerIcons: { flexDirection: 'row', marginRight: -8 },
  headerIconBtn: { margin: 0 },
  profileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 30,
  },
  profileBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 13 },
  profileChevron: { fontSize: 16, fontWeight: '300', color: Colors.textSecondary, marginLeft: -2 },

  tabBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
  },
  tabButtons: {
    flexDirection: 'row', backgroundColor: Colors.gray100,
    borderRadius: 10, padding: 3,
  },
  tabButton: {
    flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.text },

  scrollView: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 120 },

  // Banner
  bannerContainer: { marginBottom: spacing.lg },
  bannerCard: {
    width: BANNER_WIDTH, height: BANNER_HEIGHT, borderRadius: 20, justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
    elevation: 3,
  },
  bannerContent: { justifyContent: 'center', height: '100%' },
  bannerTitle: { color: Colors.white, fontWeight: 'bold', lineHeight: 30 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', marginTop: spacing.sm },
  dotOverlay: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: spacing.xs,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: Colors.white },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.4)' },

  // Feature Grid
  featureGrid: {
    flexDirection: 'row', flexWrap: 'wrap', backgroundColor: Colors.surface,
    borderRadius: 16, paddingVertical: 12, marginBottom: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 8,
    elevation: 1,
  },
  featureItem: { width: '25%', alignItems: 'center', paddingVertical: 10 },
  featureIcon: { fontSize: 22, marginBottom: 6 },
  featureLabel: { fontSize: 12, color: Colors.text, fontWeight: '500' },

  // Fortune Card
  fortuneCard: {
    backgroundColor: Colors.surface, borderRadius: 20, marginBottom: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 12,
    elevation: 2,
  },
  fortuneContent: { paddingVertical: spacing.lg },
  fortuneLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  fortuneTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4, letterSpacing: -0.3 },
  fortuneScoreWrap: { alignItems: 'center', paddingVertical: 28 },
  fortuneMessage: { fontSize: 20, fontWeight: '600', color: Colors.text, textAlign: 'center', lineHeight: 30 },
  fortuneFooter: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.borderLight,
    paddingVertical: 10, alignItems: 'center',
  },
  fortuneFooterText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  fortunePlaceholder: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center',
  },
  fortunePlaceholderText: { fontSize: 28, color: Colors.textMuted },

  // Ad Banner
  adBanner: {
    height: 64, backgroundColor: Colors.surface, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 6,
    elevation: 1,
  },
  adEmoji: { fontSize: 28, marginRight: 12 },
  adTextWrap: { flex: 1 },
  adTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  adDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  adBadge: {
    backgroundColor: Colors.gray300, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  adBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },

  // Hexagon Chart
  hexCard: {
    backgroundColor: Colors.surface, borderRadius: 20, marginBottom: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 12,
    elevation: 2,
  },
  hexLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  hexTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: spacing.sm, letterSpacing: -0.3 },
  // Lucky Report
  luckyDateTitle: { fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: spacing.md },
  daySelector: {
    flexDirection: 'row', marginBottom: spacing.lg,
    backgroundColor: Colors.surface, borderRadius: borderRadius.lg, padding: 4,
    justifyContent: 'space-around',
  },
  dayItem: { width: (SCREEN_WIDTH - spacing.md * 2 - 8) / 7, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  dayItemActive: { backgroundColor: Colors.primary },
  dayLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  dayLabelActive: { color: Colors.white },
  dayNumber: { fontSize: 14, fontWeight: 'bold', color: Colors.text, marginTop: 2 },
  dayNumberActive: { color: Colors.white },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, marginTop: 3 },
  miniBattery: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  miniBatteryBody: {
    width: 20, height: 8, borderRadius: 2,
    borderWidth: 1, borderColor: Colors.gray400,
    overflow: 'hidden', padding: 1,
  },
  miniBatteryFill: { height: '100%', borderRadius: 1 },
  miniBatteryTip: { width: 2, height: 4, borderTopRightRadius: 1, borderBottomRightRadius: 1, marginLeft: -0.5 },

  luckyCard: {
    marginBottom: spacing.md, backgroundColor: Colors.surface, borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 8,
    elevation: 1,
  },
  luckyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  luckyEmoji: { fontSize: 24 },
  luckyTitle: { fontWeight: 'bold', color: Colors.text },
  luckyItem: { fontWeight: '600', color: Colors.text, marginBottom: spacing.xs },
  luckyDesc: { color: Colors.textSecondary, lineHeight: 22 },
  colorDot: { width: 24, height: 24, borderRadius: 12 },
  pinBadge: {
    fontSize: 10, fontWeight: '700', color: Colors.primary,
    backgroundColor: Colors.primary + '15', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, overflow: 'hidden', marginLeft: 'auto',
  },
  addWidgetBtn: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md, backgroundColor: Colors.gray200,
    borderRadius: 20, paddingVertical: spacing.lg,
  },
  addWidgetIcon: { fontSize: 28, color: Colors.gray600, fontWeight: '300' },

  // Tarot
  tarotHeroBanner: {
    width: BANNER_WIDTH, height: BANNER_HEIGHT, borderRadius: 20,
    justifyContent: 'center', backgroundColor: '#5856D6', marginBottom: spacing.lg,
    shadowColor: '#5856D6', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
    elevation: 3,
  },
  tarotChipScroll: { marginBottom: spacing.lg },
  tarotChip: {
    backgroundColor: Colors.surface, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9, marginRight: 8,
  },
  tarotChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  tarotTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, letterSpacing: -0.3, marginBottom: spacing.lg, marginTop: spacing.sm },
  tarotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tarotCard: {
    width: (SCREEN_WIDTH - spacing.md * 2 - 12) / 2,
    backgroundColor: Colors.surface, borderRadius: 16, padding: spacing.md,
  },
  tarotEmojiCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  tarotEmoji: { fontSize: 22 },
  tarotCardLabel: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  tarotCardDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 8 },
  tarotCardCount: { fontSize: 11, fontWeight: '600' },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%', paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  done: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  tabBar: {
    flexDirection: 'row', marginHorizontal: spacing.md, marginBottom: spacing.md,
    backgroundColor: Colors.gray100, borderRadius: 10, padding: 3,
  },
  tab: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.text },
  list: { paddingHorizontal: spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  rowDragging: { backgroundColor: Colors.gray100, borderRadius: 12 },
  dragHandle: { fontSize: 18, color: Colors.gray400, marginRight: 8, paddingVertical: 10, paddingHorizontal: 6 },
  rowIcon: { fontSize: 22, width: 36 },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  actionIcon: { fontSize: 16 },
  arrowIcon: { fontSize: 12, color: Colors.textSecondary },
  removeIcon: { fontSize: 22, color: Colors.error, fontWeight: '300' },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.textSecondary,
    marginTop: spacing.md, marginBottom: spacing.xs,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: Colors.textMuted },
});
