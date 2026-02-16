/**
 * 절기(節氣) 계산 모듈
 *
 * VSOP87 간이 공식을 사용하여 태양의 황경(ecliptic longitude)을 계산하고,
 * 이를 통해 24절기 날짜를 산출합니다.
 *
 * 사주 월주(月柱)는 절기를 기준으로 월이 바뀌므로,
 * 정확한 절기 계산이 필수입니다.
 */

// 천간 (10 Heavenly Stems)
const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;

// 지지 (12 Earthly Branches)
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;

// 월주 지지 순서 (인월부터 시작)
// 인(0) → 묘(1) → 진(2) → 사(3) → 오(4) → 미(5) → 신(6) → 유(7) → 술(8) → 해(9) → 자(10) → 축(11)
const MONTH_BRANCHES = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'] as const;

// 절기 이름과 태양 황경 (사주 월 경계를 결정하는 12절기만)
// index 0 = 인월 시작(입춘), index 1 = 묘월 시작(경칩), ...
const JEOLGI = [
  { name: '입춘', longitude: 315 },  // 인월 시작
  { name: '경칩', longitude: 345 },  // 묘월 시작
  { name: '청명', longitude: 15 },   // 진월 시작
  { name: '입하', longitude: 45 },   // 사월 시작
  { name: '망종', longitude: 75 },   // 오월 시작
  { name: '소서', longitude: 105 },  // 미월 시작
  { name: '입추', longitude: 135 },  // 신월 시작
  { name: '백로', longitude: 165 },  // 유월 시작
  { name: '한로', longitude: 195 },  // 술월 시작
  { name: '입동', longitude: 225 },  // 해월 시작
  { name: '대설', longitude: 255 },  // 자월 시작
  { name: '소한', longitude: 285 },  // 축월 시작
] as const;

/**
 * 그레고리력 → 율리우스일(Julian Day Number) 변환
 */
function gregorianToJD(year: number, month: number, day: number, hour: number = 12): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hour / 24.0 + B - 1524.5;
}

/**
 * 율리우스일 → 그레고리력 변환
 */
function jdToGregorian(jd: number): { year: number; month: number; day: number; hour: number } {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let A: number;
  if (z < 2299161) {
    A = z;
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    A = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  const hour = Math.round(f * 24);

  return { year, month, day, hour };
}

/**
 * 태양의 황경(ecliptic longitude) 계산 (VSOP87 간이)
 * @param jd 율리우스일
 * @returns 태양 황경 (0-360도)
 */
function solarLongitude(jd: number): number {
  // J2000.0 기준 율리우스 세기
  const T = (jd - 2451545.0) / 36525.0;

  // 태양 평균 황경 (Mean longitude)
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;

  // 태양 평균 근점이각 (Mean anomaly)
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mrad = M * Math.PI / 180;

  // 중심차 (Equation of center)
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);

  // 태양 진황경 (True longitude)
  let sunLon = L0 + C;

  // 장동 보정 (Nutation correction, 간이)
  const omega = 125.04 - 1934.136 * T;
  const omegaRad = omega * Math.PI / 180;
  sunLon = sunLon - 0.00569 - 0.00478 * Math.sin(omegaRad);

  // 0~360도 정규화
  sunLon = sunLon % 360;
  if (sunLon < 0) sunLon += 360;

  return sunLon;
}

/**
 * 특정 태양 황경에 도달하는 율리우스일 찾기 (Newton-Raphson 근사)
 * @param year 년도
 * @param targetLon 목표 황경 (도)
 * @returns 해당 율리우스일
 */
function findSolarTermJD(year: number, targetLon: number): number {
  // 각 절기의 대략적인 월을 사용하여 초기 추정
  // 태양 황경 → 대략적인 월 매핑
  const approxMonthMap: Record<number, [number, number]> = {
    315: [2, 4],   // 입춘 ≈ 2/4
    345: [3, 6],   // 경칩 ≈ 3/6
    15: [4, 5],    // 청명 ≈ 4/5
    45: [5, 6],    // 입하 ≈ 5/6
    75: [6, 6],    // 망종 ≈ 6/6
    105: [7, 7],   // 소서 ≈ 7/7
    135: [8, 7],   // 입추 ≈ 8/7
    165: [9, 8],   // 백로 ≈ 9/8
    195: [10, 8],  // 한로 ≈ 10/8
    225: [11, 7],  // 입동 ≈ 11/7
    255: [12, 7],  // 대설 ≈ 12/7
    285: [1, 6],   // 소한 ≈ 1/6 (다음해)
  };

  const daysPerDegree = 365.2422 / 360;
  let jd: number;

  const approx = approxMonthMap[targetLon];
  if (approx) {
    const [m, d] = approx;
    // 소한(285°)은 다음해 1월
    const y = (targetLon === 285) ? year + 1 : year;
    jd = gregorianToJD(y, m, d, 12);
  } else {
    // 매핑에 없는 경우 춘분 기준 추정
    const springEquinoxJD = gregorianToJD(year, 3, 20, 12);
    let lonDiff = targetLon;
    if (lonDiff > 180) lonDiff -= 360;
    jd = springEquinoxJD + lonDiff * daysPerDegree;
  }

  // Newton-Raphson 반복
  for (let i = 0; i < 50; i++) {
    const currentLon = solarLongitude(jd);
    let diff = targetLon - currentLon;

    // 360도 경계 처리
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (Math.abs(diff) < 0.0001) break; // 충분히 수렴

    // 태양은 하루에 약 0.9856도 이동
    jd += diff * daysPerDegree;
  }

  return jd;
}

export interface SolarTermDate {
  name: string;
  monthIndex: number; // 0=인월, 1=묘월, ...
  year: number;
  month: number;
  day: number;
}

/**
 * 특정 연도의 12절기(사주 월 경계) 날짜 계산
 */
export function getYearJeolgiDates(year: number): SolarTermDate[] {
  const result: SolarTermDate[] = [];

  for (let i = 0; i < JEOLGI.length; i++) {
    const { name, longitude } = JEOLGI[i];

    // 소한(285°)은 다음해 1월에 해당하지만, 사주에서는 전년도 축월
    // 입춘(315°)은 2월, 경칩(345°)은 3월 ...
    // 소한과 입춘은 이전 연도의 것이 현재 연도에 영향
    let searchYear = year;
    if (longitude >= 285 && longitude <= 315) {
      // 소한(285°)은 해당 연도 1월, 입춘(315°)은 2월
      // searchYear는 year 그대로
    }

    const jd = findSolarTermJD(searchYear, longitude);
    const date = jdToGregorian(jd);

    result.push({
      name,
      monthIndex: i,
      year: date.year,
      month: date.month,
      day: date.day,
    });
  }

  return result;
}

/**
 * 양력 날짜가 어떤 사주 월에 해당하는지 판단
 * @returns monthIndex (0=인월, 1=묘월, ..., 11=축월) 및 해당 사주 연도
 */
export function getSajuMonthInfo(solarYear: number, solarMonth: number, solarDay: number): {
  monthIndex: number;
  sajuYear: number;
} {
  // 현재 연도와 이전 연도의 절기 모두 필요
  const currentYearTerms = getYearJeolgiDates(solarYear);
  const prevYearTerms = getYearJeolgiDates(solarYear - 1);

  // 모든 절기를 날짜순으로 정렬하여 판단
  // 이전 연도의 대설(자월), 소한(축월) + 현재 연도 전체
  interface TermEntry {
    monthIndex: number;
    year: number;
    month: number;
    day: number;
    sajuYear: number; // 사주에서의 연도 (입춘 기준)
  }

  const allTerms: TermEntry[] = [];

  // 이전 연도 대설(10=자월)과 소한(11=축월)
  for (let i = 10; i <= 11; i++) {
    const term = prevYearTerms[i];
    allTerms.push({
      ...term,
      sajuYear: solarYear - 1, // 입춘 전이므로 전년도
    });
  }

  // 현재 연도의 모든 절기
  for (let i = 0; i < currentYearTerms.length; i++) {
    const term = currentYearTerms[i];
    allTerms.push({
      ...term,
      sajuYear: solarYear, // 입춘 이후이므로 현재 연도
    });
  }

  // 날짜 기준 정렬
  allTerms.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });

  // 입력 날짜가 어떤 절기 구간에 속하는지 판단
  const inputDate = solarYear * 10000 + solarMonth * 100 + solarDay;

  let result = { monthIndex: 11, sajuYear: solarYear - 1 }; // 기본값: 축월

  for (let i = 0; i < allTerms.length; i++) {
    const termDate = allTerms[i].year * 10000 + allTerms[i].month * 100 + allTerms[i].day;
    if (inputDate >= termDate) {
      result = {
        monthIndex: allTerms[i].monthIndex,
        sajuYear: allTerms[i].sajuYear,
      };
    } else {
      break;
    }
  }

  return result;
}

/**
 * 월주 천간 계산
 *
 * 연간(年干)에 따른 인월(寅月) 시작 천간:
 * 甲/己년: 丙寅 (갑/기 → 병)
 * 乙/庚년: 戊寅 (을/경 → 무)
 * 丙/辛년: 庚寅 (병/신 → 경)
 * 丁/壬년: 壬寅 (정/임 → 임)
 * 戊/癸년: 甲寅 (무/계 → 갑)
 */
export function getMonthPillar(yearStem: string, monthIndex: number): { stem: string; branch: string } {
  const stemIndex = STEMS.indexOf(yearStem as any);
  if (stemIndex === -1) {
    return { stem: '갑', branch: '인' };
  }

  // 연간 기준 인월 천간 시작 인덱스
  const stemBaseMap: Record<number, number> = {
    0: 2, // 甲 → 丙 (갑→병)
    1: 4, // 乙 → 戊 (을→무)
    2: 6, // 丙 → 庚 (병→경)
    3: 8, // 丁 → 壬 (정→임)
    4: 0, // 戊 → 甲 (무→갑)
    5: 2, // 己 → 丙 (기→병)
    6: 4, // 庚 → 戊 (경→무)
    7: 6, // 辛 → 庚 (신→경)
    8: 8, // 壬 → 壬 (임→임)
    9: 0, // 癸 → 甲 (계→갑)
  };

  const stemBase = stemBaseMap[stemIndex];
  const monthStemIndex = (stemBase + monthIndex) % 10;
  const monthBranch = MONTH_BRANCHES[monthIndex];

  return {
    stem: STEMS[monthStemIndex],
    branch: monthBranch,
  };
}

/**
 * 입춘 전인지 확인
 */
export function isBeforeLichun(year: number, month: number, day: number): boolean {
  const terms = getYearJeolgiDates(year);
  const lichun = terms[0]; // 입춘

  const inputDate = year * 10000 + month * 100 + day;
  const lichunDate = lichun.year * 10000 + lichun.month * 100 + lichun.day;

  return inputDate < lichunDate;
}
