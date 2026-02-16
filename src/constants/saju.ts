/**
 * 사주팔자 UI 표시용 상수 정의
 * 계산 로직은 manseryeok 패키지가 담당
 */

import { Element } from '../types/saju';

/**
 * 천간의 음양
 */
export const STEM_YIN_YANG: Record<string, 'yin' | 'yang'> = {
  '갑': 'yang',
  '을': 'yin',
  '병': 'yang',
  '정': 'yin',
  '무': 'yang',
  '기': 'yin',
  '경': 'yang',
  '신': 'yin',
  '임': 'yang',
  '계': 'yin'
};

/**
 * 지지의 음양
 */
export const BRANCH_YIN_YANG: Record<string, 'yin' | 'yang'> = {
  '자': 'yang',
  '축': 'yin',
  '인': 'yang',
  '묘': 'yin',
  '진': 'yang',
  '사': 'yin',
  '오': 'yang',
  '미': 'yin',
  '신': 'yang',
  '유': 'yin',
  '술': 'yang',
  '해': 'yin'
};

/**
 * 오행의 상생 관계 (生)
 * 목 → 화 → 토 → 금 → 수 → 목
 */
export const ELEMENT_GENERATES: Record<Element, Element> = {
  '목': '화',
  '화': '토',
  '토': '금',
  '금': '수',
  '수': '목'
};

/**
 * 오행의 상극 관계 (剋)
 * 목 → 토, 토 → 수, 수 → 화, 화 → 금, 금 → 목
 */
export const ELEMENT_CONTROLS: Record<Element, Element> = {
  '목': '토',
  '토': '수',
  '수': '화',
  '화': '금',
  '금': '목'
};

/**
 * 오행별 색상 (다크 테마용)
 */
export const ELEMENT_COLORS: Record<Element, string> = {
  '목': '#34C759',  // iOS systemGreen
  '화': '#FF3B30',  // iOS systemRed
  '토': '#FF9500',  // iOS systemOrange
  '금': '#8E8E93',  // iOS systemGray
  '수': '#007AFF'   // iOS systemBlue
};

/**
 * 오행별 한글 이름
 */
export const ELEMENT_NAMES: Record<Element, string> = {
  '목': '나무',
  '화': '불',
  '토': '흙',
  '금': '쇠',
  '수': '물'
};
