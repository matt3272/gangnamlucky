/**
 * 운세 관련 TypeScript 타입 정의
 */

import { Element } from './saju';

/**
 * 운세 데이터
 */
export interface FortuneData {
  overall: number;      // 종합운 (0-100)
  wealth: number;       // 재물운 (0-100)
  career: number;       // 직업운 (0-100)
  love: number;         // 애정운 (0-100)
  health: number;       // 건강운 (0-100)
  advice: string;       // 조언
  luckyColors: string[]; // 행운의 색
  luckyNumbers: number[]; // 행운의 숫자
  luckyDirection: string; // 행운의 방향
}

/**
 * 일일 운세
 */
export interface DailyFortune extends FortuneData {
  date: Date;
  dayPillar: string;    // 해당 날짜의 일주
}

/**
 * 월간 운세
 */
export interface MonthlyFortune extends FortuneData {
  year: number;
  month: number;
  monthPillar: string;  // 해당 월의 월주
}

/**
 * 연간 운세
 */
export interface YearlyFortune extends FortuneData {
  year: number;
  yearPillar: string;   // 해당 년의 연주
}

/**
 * 대운 (大運) - 10년 주기
 */
export interface MajorFortune {
  startAge: number;     // 시작 나이
  endAge: number;       // 종료 나이
  stem: string;         // 천간
  branch: string;       // 지지
  element: Element;     // 오행
  description: string;  // 대운 설명
  characteristics: string[]; // 특징
}

/**
 * 십이운성 (十二運星)
 * 생명의 순환 주기를 12단계로 나눈 것
 */
export type TwelveStage =
  | '장생'  // 長生 - 태어남
  | '목욕'  // 沐浴 - 목욕
  | '관대'  // 冠帶 - 성장
  | '건록'  // 建祿 - 전성기
  | '제왕'  // 帝旺 - 절정
  | '쇠'    // 衰   - 쇠퇴 시작
  | '병'    // 病   - 병듦
  | '사'    // 死   - 사망
  | '묘'    // 墓   - 무덤
  | '절'    // 絕   - 절멸
  | '태'    // 胎   - 태아
  | '양';   // 養   - 양육

/**
 * 십이운성 정보
 */
export interface TwelveStageInfo {
  stage: TwelveStage;
  strength: number;     // 강도 (0-100)
  description: string;  // 설명
}

/**
 * 궁합 결과
 */
export interface CompatibilityResult {
  overallScore: number;       // 종합 궁합 점수 (0-100)
  personalityScore: number;   // 성격 궁합
  loveScore: number;          // 연애 궁합
  marriageScore: number;      // 결혼 궁합
  businessScore: number;      // 사업 파트너십 궁합

  strengths: string[];        // 강점
  weaknesses: string[];       // 약점
  advice: string[];           // 조언

  elementHarmony: {           // 오행 조화도
    harmonious: Element[];    // 조화로운 오행
    conflicting: Element[];   // 충돌하는 오행
  };
}
