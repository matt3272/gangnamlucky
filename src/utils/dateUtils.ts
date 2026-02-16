/**
 * 날짜 관련 유틸리티 함수
 */

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Date 객체를 문자열로 포맷팅
 */
export function formatDate(date: Date, formatStr: string = 'yyyy년 MM월 dd일'): string {
  return format(date, formatStr, { locale: ko });
}

/**
 * Date 객체를 시간 포함 문자열로 포맷팅
 */
export function formatDateTime(date: Date): string {
  return format(date, 'yyyy년 MM월 dd일 HH시 mm분', { locale: ko });
}

/**
 * 날짜 유효성 검사
 */
export function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * 시간 유효성 검사
 */
export function isValidTime(hour: number, minute: number): boolean {
  return hour >= 0 && hour < 24 && minute >= 0 && minute < 60;
}

/**
 * 윤년 여부 확인
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * 특정 월의 일수 계산
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 고유 ID 생성 (사주 데이터용)
 */
export function generateId(): string {
  return `saju_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 나이 계산 (만 나이)
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * 간지 표기 변환 (한자)
 */
export function toGanjiHanja(stem: string, branch: string): string {
  const stemHanja: Record<string, string> = {
    '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
    '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
  };

  const branchHanja: Record<string, string> = {
    '자': '子', '축': '丑', '인': '寅', '묘': '卯',
    '진': '辰', '사': '巳', '오': '午', '미': '未',
    '신': '申', '유': '酉', '술': '戌', '해': '亥',
  };

  return `${stemHanja[stem] || stem}${branchHanja[branch] || branch}`;
}
