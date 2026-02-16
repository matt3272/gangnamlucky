/**
 * 오행(五行) 분석 로직
 */

import { Element, Pillar, ElementAnalysis } from '../../types/saju';

/**
 * 천간 → 오행 매핑
 */
const STEM_ELEMENT_MAP: Record<string, Element> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
};

/**
 * 지지 → 오행 매핑 (본기)
 */
const BRANCH_ELEMENT_MAP: Record<string, Element> = {
  '인': '목', '묘': '목',
  '사': '화', '오': '화',
  '진': '토', '술': '토', '축': '토', '미': '토',
  '신': '금', '유': '금',
  '자': '수', '해': '수',
};

/**
 * 지장간(支藏干) 매핑
 * 각 지지에 숨어있는 천간 목록 (본기, 중기, 여기 순)
 */
const HIDDEN_STEMS_MAP: Record<string, string[]> = {
  '자': ['계'],
  '축': ['기', '계', '신'],
  '인': ['갑', '병', '무'],
  '묘': ['을'],
  '진': ['무', '을', '계'],
  '사': ['병', '경', '무'],
  '오': ['정', '기'],
  '미': ['기', '정', '을'],
  '신': ['경', '임', '무'],
  '유': ['신'],
  '술': ['무', '신', '정'],
  '해': ['임', '갑'],
};

/**
 * 천간의 오행 구하기
 */
export function getStemElement(stem: string): Element {
  return STEM_ELEMENT_MAP[stem] || '목';
}

/**
 * 지지의 오행 구하기
 */
export function getBranchElement(branch: string): Element {
  return BRANCH_ELEMENT_MAP[branch] || '토';
}

/**
 * 사주팔자의 오행 분석
 * 8글자 (4개 천간 + 4개 지지)의 오행 분포 계산
 */
export function analyzeElements(pillars: Pillar[]): ElementAnalysis {
  const elementCount: Record<Element, number> = {
    '목': 0,
    '화': 0,
    '토': 0,
    '금': 0,
    '수': 0,
  };

  pillars.forEach((pillar) => {
    // 천간 오행
    const stemElement = getStemElement(pillar.stem);
    elementCount[stemElement] += 1;

    // 지지 오행 (본기)
    const branchElement = getBranchElement(pillar.branch);
    elementCount[branchElement] += 1;
  });

  let dominant: Element = '목';
  let weak: Element = '목';
  let maxCount = -1;
  let minCount = 999;

  (Object.keys(elementCount) as Element[]).forEach((element) => {
    const count = elementCount[element];

    if (count > maxCount) {
      maxCount = count;
      dominant = element;
    }

    if (count < minCount) {
      minCount = count;
      weak = element;
    }
  });

  return {
    wood: elementCount['목'],
    fire: elementCount['화'],
    earth: elementCount['토'],
    metal: elementCount['금'],
    water: elementCount['수'],
    dominant,
    weak,
  };
}

/**
 * 오행 균형도 계산 (0-100)
 */
export function calculateElementBalance(elements: ElementAnalysis): number {
  const counts = [
    elements.wood,
    elements.fire,
    elements.earth,
    elements.metal,
    elements.water,
  ];

  const total = counts.reduce((sum, count) => sum + count, 0);
  const average = total / 5;

  const variance =
    counts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / 5;
  const stdDev = Math.sqrt(variance);

  const maxStdDev = 3.2;
  const balance = Math.max(0, 100 - (stdDev / maxStdDev) * 100);

  return Math.round(balance);
}

/**
 * 오행 상생(生) 관계 체크
 */
export function isGenerating(from: Element, to: Element): boolean {
  const generatingMap: Record<Element, Element> = {
    '목': '화',
    '화': '토',
    '토': '금',
    '금': '수',
    '수': '목',
  };

  return generatingMap[from] === to;
}

/**
 * 오행 상극(剋) 관계 체크
 */
export function isControlling(from: Element, to: Element): boolean {
  const controllingMap: Record<Element, Element> = {
    '목': '토',
    '토': '수',
    '수': '화',
    '화': '금',
    '금': '목',
  };

  return controllingMap[from] === to;
}

/**
 * 두 오행의 관계 설명
 */
export function getElementRelationship(
  element1: Element,
  element2: Element
): string {
  if (element1 === element2) {
    return '같은 오행';
  } else if (isGenerating(element1, element2)) {
    return '상생 (生)';
  } else if (isControlling(element1, element2)) {
    return '상극 (剋)';
  } else if (isGenerating(element2, element1)) {
    return '역생 (被生)';
  } else if (isControlling(element2, element1)) {
    return '역극 (被剋)';
  } else {
    return '중립';
  }
}
