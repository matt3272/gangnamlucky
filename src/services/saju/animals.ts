/**
 * 일주 동물 (日柱 動物) 매핑
 *
 * 지지 → 띠 동물, 천간의 오행 → 색상 접두사
 * 예: 기(토/황금) + 묘(토끼) → "황금 토끼"
 */

import { Element } from '../../types/saju';
import { getStemElement } from './elements';

/** 지지별 동물 */
const BRANCH_ANIMAL: Record<string, string> = {
  '자': '쥐', '축': '소', '인': '호랑이', '묘': '토끼',
  '진': '용', '사': '뱀', '오': '말', '미': '양',
  '신': '원숭이', '유': '닭', '술': '개', '해': '돼지',
};

/** 오행별 색상 접두사 */
const ELEMENT_COLOR_PREFIX: Record<Element, string> = {
  '목': '푸른',
  '화': '붉은',
  '토': '황금',
  '금': '하얀',
  '수': '검은',
};

/**
 * 일주 동물 이름 반환
 * @param dayStem 일간 천간
 * @param dayBranch 일지 지지
 * @returns "황금 토끼" 같은 형태
 */
export function getDayAnimal(dayStem: string, dayBranch: string): string {
  const element = getStemElement(dayStem);
  const colorPrefix = ELEMENT_COLOR_PREFIX[element] || '';
  const animal = BRANCH_ANIMAL[dayBranch] || '동물';
  return `${colorPrefix} ${animal}`;
}

/**
 * 지지의 동물 이름만 반환
 */
export function getBranchAnimal(branch: string): string {
  return BRANCH_ANIMAL[branch] || '동물';
}
