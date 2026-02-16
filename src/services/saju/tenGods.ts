/**
 * 십신 (十神 / Ten Gods) 계산 로직
 *
 * 일간(日干)과 다른 천간/지지의 관계로 십신을 결정
 * 지지는 지장간 본기(本氣)를 사용
 */

import { Element, YinYang, Pillar } from '../../types/saju';
import { STEM_YIN_YANG, BRANCH_YIN_YANG } from '../../constants/saju';
import { getStemElement } from './elements';

/** 십신 이름 */
export type TenGod =
  | '비견' | '겁재'
  | '식신' | '상관'
  | '편재' | '정재'
  | '편관' | '정관'
  | '편인' | '정인'
  | '일원';

/**
 * 지장간 본기 (地藏干 本氣)
 * 각 지지의 대표 천간
 */
const BRANCH_MAIN_STEM: Record<string, string> = {
  '자': '계', '축': '기', '인': '갑', '묘': '을',
  '진': '무', '사': '병', '오': '정', '미': '기',
  '신': '경', '유': '신', '술': '무', '해': '임',
};

/**
 * 오행 상생 관계: from이 to를 생(生)
 */
const GENERATES: Record<Element, Element> = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
};

/**
 * 오행 상극 관계: from이 to를 극(剋)
 */
const CONTROLS: Record<Element, Element> = {
  '목': '토', '토': '수', '수': '화', '화': '금', '금': '목',
};

/**
 * 두 천간 사이의 십신 관계 계산
 * @param dayStem 일간 (나)
 * @param targetStem 대상 천간
 * @returns 십신 이름
 */
export function getTenGodForStem(dayStem: string, targetStem: string): TenGod {
  if (dayStem === targetStem) return '비견';

  const myElement = getStemElement(dayStem);
  const targetElement = getStemElement(targetStem);
  const myYinYang = STEM_YIN_YANG[dayStem];
  const targetYinYang = STEM_YIN_YANG[targetStem];
  const sameYinYang = myYinYang === targetYinYang;

  // 같은 오행
  if (myElement === targetElement) {
    return sameYinYang ? '비견' : '겁재';
  }

  // 내가 생하는 오행 (식상)
  if (GENERATES[myElement] === targetElement) {
    return sameYinYang ? '식신' : '상관';
  }

  // 내가 극하는 오행 (재성)
  if (CONTROLS[myElement] === targetElement) {
    return sameYinYang ? '편재' : '정재';
  }

  // 나를 극하는 오행 (관성)
  if (CONTROLS[targetElement] === myElement) {
    return sameYinYang ? '편관' : '정관';
  }

  // 나를 생하는 오행 (인성)
  if (GENERATES[targetElement] === myElement) {
    return sameYinYang ? '편인' : '정인';
  }

  return '비견';
}

/**
 * 지지의 십신 계산 (지장간 본기 사용)
 */
export function getTenGodForBranch(dayStem: string, branch: string): TenGod {
  const mainStem = BRANCH_MAIN_STEM[branch];
  if (!mainStem) return '비견';
  return getTenGodForStem(dayStem, mainStem);
}

/**
 * 사주 전체의 십신 계산
 * 시주, 일주, 월주, 연주 순서
 */
export interface SajuTenGods {
  stems: [TenGod, '일원', TenGod, TenGod];   // 시주, 일주, 월주, 연주 천간
  branches: [TenGod, TenGod, TenGod, TenGod]; // 시주, 일주, 월주, 연주 지지
}

export function calculateTenGods(pillars: {
  year: Pillar; month: Pillar; day: Pillar; hour: Pillar;
}): SajuTenGods {
  const dayStem = pillars.day.stem;

  return {
    stems: [
      getTenGodForStem(dayStem, pillars.hour.stem),
      '일원',
      getTenGodForStem(dayStem, pillars.month.stem),
      getTenGodForStem(dayStem, pillars.year.stem),
    ],
    branches: [
      getTenGodForBranch(dayStem, pillars.hour.branch),
      getTenGodForBranch(dayStem, pillars.day.branch),
      getTenGodForBranch(dayStem, pillars.month.branch),
      getTenGodForBranch(dayStem, pillars.year.branch),
    ],
  };
}

/**
 * 타고난 성향 (일간과 일지의 십신)
 */
export function getInnateTenGod(pillars: {
  day: Pillar;
}): TenGod {
  return getTenGodForBranch(pillars.day.stem, pillars.day.branch);
}
