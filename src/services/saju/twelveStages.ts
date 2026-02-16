/**
 * 십이운성 (十二運星 / Twelve Life Stages) 계산 로직
 *
 * 일간(日干)이 각 지지에서 갖는 생왕사절(生旺死絶)의 단계
 * 양간은 순행(順行), 음간은 역행(逆行)
 */

import { Pillar } from '../../types/saju';

/** 12운성 이름 */
export type TwelveStage =
  | '장생' | '목욕' | '관대' | '건록' | '제왕' | '쇠'
  | '병' | '사' | '묘' | '절' | '태' | '양';

/** 12운성 순서 */
const STAGES: TwelveStage[] = [
  '장생', '목욕', '관대', '건록', '제왕', '쇠',
  '병', '사', '묘', '절', '태', '양',
];

/** 12지지 순서 */
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

/**
 * 각 천간의 장생(長生) 위치 (지지 인덱스)
 * 양간: 순행, 음간: 역행
 */
const CHANGSEONG_INDEX: Record<string, number> = {
  // 양간
  '갑': 11, // 해
  '병': 2,  // 인
  '무': 2,  // 인
  '경': 5,  // 사
  '임': 8,  // 신
  // 음간
  '을': 6,  // 오
  '정': 9,  // 유
  '기': 9,  // 유
  '신': 0,  // 자
  '계': 3,  // 묘
};

/** 양간 여부 */
const YANG_STEMS = new Set(['갑', '병', '무', '경', '임']);

/**
 * 일간과 지지의 12운성 계산
 */
export function getTwelveStage(dayStem: string, branch: string): TwelveStage {
  const branchIndex = BRANCHES.indexOf(branch);
  if (branchIndex === -1) return '절';

  const changseongIdx = CHANGSEONG_INDEX[dayStem];
  if (changseongIdx === undefined) return '절';

  const isYang = YANG_STEMS.has(dayStem);

  let stageIndex: number;
  if (isYang) {
    // 순행: 장생 지지에서 앞으로 이동
    stageIndex = (branchIndex - changseongIdx + 12) % 12;
  } else {
    // 역행: 장생 지지에서 뒤로 이동
    stageIndex = (changseongIdx - branchIndex + 12) % 12;
  }

  return STAGES[stageIndex];
}

/**
 * 사주 전체의 12운성 계산
 * 시주, 일주, 월주, 연주 순서
 */
export function calculateTwelveStages(pillars: {
  year: Pillar; month: Pillar; day: Pillar; hour: Pillar;
}): [TwelveStage, TwelveStage, TwelveStage, TwelveStage] {
  const dayStem = pillars.day.stem;
  return [
    getTwelveStage(dayStem, pillars.hour.branch),
    getTwelveStage(dayStem, pillars.day.branch),
    getTwelveStage(dayStem, pillars.month.branch),
    getTwelveStage(dayStem, pillars.year.branch),
  ];
}
