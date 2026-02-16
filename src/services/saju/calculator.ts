/**
 * 사주팔자 계산 메인 로직
 *
 * 연주/일주/시주: @fullstackfamily/manseryeok (입춘 기준 연주 변경, 정확한 60갑자 일주)
 * 월주: 자체 절기 계산 (천문학 VSOP87 간이 공식)
 *
 * 기존 manseryeok(v1.0.1) 패키지는 입춘 기준 연주 미반영, 절기 기준 월주 미반영으로 교체.
 */

import { BirthInfo, SajuData, Pillar, Element } from '../../types/saju';
import { STEM_YIN_YANG } from '../../constants/saju';
import { generateId } from '../../utils/dateUtils';
import {
  calculateSajuSimple,
  lunarToSolar as fmLunarToSolar,
  solarToLunar as fmSolarToLunar,
} from '@fullstackfamily/manseryeok';
import { getStemElement, getBranchElement, analyzeElements } from './elements';
import { getSajuMonthInfo, getMonthPillar } from './solarTerms';

/**
 * 파싱된 천간/지지를 Pillar 타입으로 변환
 */
function toPillar(stem: string, branch: string): Pillar {
  return {
    stem,
    branch,
    element: getStemElement(stem),
    yinYang: STEM_YIN_YANG[stem] || 'yang',
  };
}

/**
 * 사주팔자 계산 메인 함수
 */
export function calculateSaju(birthInfo: BirthInfo): SajuData {
  const isLunar = birthInfo.calendarType === 'lunar';

  // 양력 날짜 확정
  let solarYear = birthInfo.year;
  let solarMonth = birthInfo.month;
  let solarDay = birthInfo.day;

  if (isLunar) {
    const converted = fmLunarToSolar(
      birthInfo.year,
      birthInfo.month,
      birthInfo.day,
      birthInfo.isLeapMonth || false,
    );
    solarYear = converted.solar.year;
    solarMonth = converted.solar.month;
    solarDay = converted.solar.day;
  }

  // @fullstackfamily/manseryeok 으로 연주/일주/시주 계산
  const fmResult = calculateSajuSimple(
    solarYear,
    solarMonth,
    solarDay,
    birthInfo.hour,
  );

  // 연주: @fullstackfamily가 입춘 기준으로 정확히 계산
  const yearStem = fmResult.yearPillar[0];
  const yearBranch = fmResult.yearPillar[1];
  const yearPillar = toPillar(yearStem, yearBranch);

  // 월주: 자체 절기 기반 계산
  const sajuMonthInfo = getSajuMonthInfo(solarYear, solarMonth, solarDay);
  const monthPillarCalc = getMonthPillar(yearStem, sajuMonthInfo.monthIndex);
  const monthPillar = toPillar(monthPillarCalc.stem, monthPillarCalc.branch);

  // 일주: @fullstackfamily의 60갑자 계산
  const dayStem = fmResult.dayPillar[0];
  const dayBranch = fmResult.dayPillar[1];
  const dayPillar = toPillar(dayStem, dayBranch);

  // 시주: @fullstackfamily 계산 (시간 미입력 시 기본값)
  let hourPillar: Pillar;
  if (fmResult.hourPillar) {
    const hourStem = fmResult.hourPillar[0];
    const hourBranch = fmResult.hourPillar[1];
    hourPillar = toPillar(hourStem, hourBranch);
  } else {
    // 시간 모름일 경우 기본값
    hourPillar = toPillar('갑', '자');
  }

  // 오행 분석
  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];
  const elements = analyzeElements(pillars);

  // 양력 날짜
  const solarDate = new Date(
    solarYear, solarMonth - 1, solarDay,
    birthInfo.hour, birthInfo.minute,
  );

  // 음력 날짜
  let lunarDateObj: Date;
  if (isLunar) {
    lunarDateObj = new Date(
      birthInfo.year, birthInfo.month - 1, birthInfo.day,
      birthInfo.hour, birthInfo.minute,
    );
  } else {
    const lunarResult = fmSolarToLunar(solarYear, solarMonth, solarDay);
    lunarDateObj = new Date(
      lunarResult.lunar.year, lunarResult.lunar.month - 1, lunarResult.lunar.day,
      birthInfo.hour, birthInfo.minute,
    );
  }

  const sajuData: SajuData = {
    id: generateId(),
    name: birthInfo.name,
    gender: birthInfo.gender,
    birthDate: {
      solar: solarDate,
      lunar: lunarDateObj,
    },
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
    elements,
    createdAt: new Date(),
  };

  return sajuData;
}

/**
 * 특정 날짜의 일주 계산
 */
export function getDayPillar(date: Date): { stem: string; branch: string; element: Element } {
  const result = calculateSajuSimple(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
  );

  const dayStem = result.dayPillar[0];
  const dayBranch = result.dayPillar[1];

  return {
    stem: dayStem,
    branch: dayBranch,
    element: getStemElement(dayStem),
  };
}

/**
 * 오늘의 일주 계산
 */
export function getTodayPillar(): { stem: string; branch: string; element: Element } {
  return getDayPillar(new Date());
}

/**
 * 사주 정보를 문자열로 포맷팅
 */
export function formatSaju(sajuData: SajuData): string {
  const { year, month, day, hour } = sajuData.pillars;

  return `
사주팔자:
시주  일주  월주  연주
━━━  ━━━  ━━━  ━━━
${hour.stem}    ${day.stem}    ${month.stem}    ${year.stem}
${hour.branch}    ${day.branch}    ${month.branch}    ${year.branch}

오행 분석:
목: ${sajuData.elements.wood}
화: ${sajuData.elements.fire}
토: ${sajuData.elements.earth}
금: ${sajuData.elements.metal}
수: ${sajuData.elements.water}

강한 오행: ${sajuData.elements.dominant}
약한 오행: ${sajuData.elements.weak}
  `.trim();
}

/**
 * 일간(日干) 기반 기본 성격 분석
 */
export function getBasicPersonality(dayStem: string): string {
  const personalities: Record<string, string> = {
    '갑': '큰 나무처럼 곧고 정직하며, 리더십이 강합니다. 독립적이고 진취적인 성격입니다.',
    '을': '작은 나무처럼 유연하고 섬세하며, 적응력이 뛰어납니다. 조화를 중시합니다.',
    '병': '태양처럼 밝고 활동적이며, 열정적입니다. 사교적이고 낙천적인 성격입니다.',
    '정': '불꽃처럼 예민하고 감성적이며, 창의적입니다. 예술적 재능이 있습니다.',
    '무': '산처럼 믿음직하고 안정적이며, 포용력이 큽니다. 신중하고 책임감이 강합니다.',
    '기': '대지처럼 온화하고 실용적이며, 꾸준합니다. 인내심이 강하고 세심합니다.',
    '경': '쇠처럼 단단하고 결단력이 있으며, 정의감이 강합니다. 강직하고 원칙적입니다.',
    '신': '보석처럼 세련되고 감각적이며, 명예를 중시합니다. 품위 있고 우아합니다.',
    '임': '바다처럼 넓고 깊으며, 포용력이 큽니다. 지혜롭고 융통성이 있습니다.',
    '계': '빗물처럼 순수하고 섬세하며, 직관력이 뛰어납니다. 감수성이 풍부합니다.',
  };

  return personalities[dayStem] || '특별한 성격을 가진 사람입니다.';
}

/**
 * 간단한 사주 해석
 */
export function getSimpleInterpretation(sajuData: SajuData): string {
  const dayStem = sajuData.pillars.day.stem;
  const personality = getBasicPersonality(dayStem);

  const { dominant, weak } = sajuData.elements;

  let interpretation = `${personality}\n\n`;
  interpretation += `오행 분석 결과, ${dominant} 기운이 강하고 ${weak} 기운이 약합니다.\n`;

  const dominantAdvice: Record<string, string> = {
    '목': '목 기운이 강하므로 창의력과 성장 의지가 강합니다. 금(金) 기운으로 조절하면 좋습니다.',
    '화': '화 기운이 강하므로 열정과 활력이 넘칩니다. 수(水) 기운으로 균형을 맞추면 좋습니다.',
    '토': '토 기운이 강하므로 안정적이고 신중합니다. 목(木) 기운으로 활력을 더하면 좋습니다.',
    '금': '금 기운이 강하므로 원칙적이고 결단력이 있습니다. 화(火) 기운으로 온화함을 더하면 좋습니다.',
    '수': '수 기운이 강하므로 지혜롭고 융통성이 있습니다. 토(土) 기운으로 안정감을 더하면 좋습니다.',
  };

  interpretation += `\n${dominantAdvice[dominant]}`;

  return interpretation;
}
