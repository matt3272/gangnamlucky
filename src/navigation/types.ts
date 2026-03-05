/**
 * React Navigation 타입 정의
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { SajuData } from '../types/saju';

/**
 * Stack Navigator 파라미터 타입
 */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  SajuInput: { mode?: 'new' | 'edit'; profileId?: string } | undefined;
  SajuResult: {
    sajuData: SajuData;
  };
  AIAnalysis: {
    sajuData: SajuData;
  };
  Fortune: undefined;
  WeeklyFortune: undefined;
  FortuneAnalysis: {
    sajuData: SajuData;
    fortune: { overall: number; wealth: number; career: number; love: number; health: number; social: number };
  };
  CompatibilityResult: {
    saju1: SajuData;
    saju2: SajuData;
    color1?: string;
    color2?: string;
  };
  FortuneDetail: undefined;
  FaceReading: undefined;
  NewYearFortune: undefined;
  Tarot: undefined;
  TarotReading: {
    category: string;
    label: string;
    count: number;
    positions: string[];
  };
  Compatibility: undefined;
  Mbti: undefined;
  History: undefined;
  ProfileList: undefined;
};

/**
 * Bottom Tab Navigator 파라미터 타입
 */
export type TabParamList = {
  Home: undefined;
  Consult: undefined;
  Shop: undefined;
  Account: undefined;
};

/**
 * 네비게이션 Prop 타입 선언
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
