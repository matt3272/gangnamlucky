/**
 * API 관련 TypeScript 타입 정의
 */

import { SajuData } from './saju';
import { CompatibilityResult } from './fortune';

/**
 * API 응답 기본 타입
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * AI 분석 요청 타입
 */
export interface AIAnalysisRequest {
  sajuData: SajuData;
  analysisType: 'general' | 'personality' | 'career' | 'wealth' | 'health' | 'love';
}

/**
 * AI 분석 응답 타입
 */
export interface AIAnalysisResponse {
  analysis: string;
  generatedAt: Date;
}

/**
 * AI 운세 조언 요청
 */
export interface AIFortuneRequest {
  sajuData: SajuData;
  date: Date;
  fortuneType: 'daily' | 'monthly' | 'yearly';
}

/**
 * AI 궁합 분석 요청
 */
export interface AICompatibilityRequest {
  person1: SajuData;
  person2: SajuData;
}

/**
 * AI 궁합 분석 응답
 */
export interface AICompatibilityResponse {
  compatibility: CompatibilityResult;
  analysis: string;
  generatedAt: Date;
}

/**
 * API 에러 타입
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
