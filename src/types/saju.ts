/**
 * 사주팔자 관련 TypeScript 타입 정의
 */

// 오행 타입
export type Element = '목' | '화' | '토' | '금' | '수';

// 음양 타입
export type YinYang = 'yin' | 'yang';

// 성별 타입
export type Gender = 'male' | 'female';

// 달력 타입 (양력/음력)
export type CalendarType = 'solar' | 'lunar';

/**
 * 사주의 기둥 (주) 정보
 * 천간(天干)과 지지(地支)로 구성
 */
export interface Pillar {
  stem: string;       // 천간 (갑, 을, 병, 정, 무, 기, 경, 신, 임, 계)
  branch: string;     // 지지 (자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해)
  element: Element;   // 오행
  yinYang: YinYang;   // 음양
}

/**
 * 생년월일시 입력 정보
 */
export interface BirthInfo {
  name: string;
  gender: Gender;
  calendarType: CalendarType;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  isLeapMonth?: boolean;  // 음력 윤달 여부
}

/**
 * 오행 분석 결과
 */
export interface ElementAnalysis {
  wood: number;       // 목의 개수
  fire: number;       // 화의 개수
  earth: number;      // 토의 개수
  metal: number;      // 금의 개수
  water: number;      // 수의 개수
  dominant: Element;  // 가장 강한 오행
  weak: Element;      // 가장 약한 오행
}

/**
 * 완전한 사주팔자 데이터
 */
export interface SajuData {
  id: string;
  name: string;
  gender: Gender;
  birthDate: {
    solar: Date;      // 양력 생년월일
    lunar: Date;      // 음력 생년월일
  };
  pillars: {
    year: Pillar;     // 연주 (年柱)
    month: Pillar;    // 월주 (月柱)
    day: Pillar;      // 일주 (日柱)
    hour: Pillar;     // 시주 (時柱)
  };
  elements: ElementAnalysis;  // 오행 분석
  createdAt: Date;            // 생성 시간
}

/**
 * 음력 날짜 정보
 */
export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
}
