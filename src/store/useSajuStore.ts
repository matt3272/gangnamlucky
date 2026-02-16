/**
 * Zustand 스토어 - 사주 앱 전역 상태 관리
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SajuData, BirthInfo } from '../types/saju';
import { calculateSaju } from '../services/saju/calculator';

const STORAGE_KEY = '@saju_history';
const PROFILES_KEY = '@saju_profiles';
const ACTIVE_PROFILE_KEY = '@saju_active_profile';

export interface ProfileEntry {
  id: string;
  sajuData: SajuData;
  birthInfo: BirthInfo;
  color?: string;
}

interface SajuStore {
  // 프로필 목록
  profiles: ProfileEntry[];
  activeProfileId: string | null;

  // 현재 사주 데이터
  currentSaju: SajuData | null;

  // 사주 기록
  history: SajuData[];

  // 로딩 상태
  isLoading: boolean;

  // 편의 getter
  activeProfile: () => ProfileEntry | null;

  // 사주 계산
  calculate: (birthInfo: BirthInfo) => SajuData;

  // 프로필 추가
  addProfile: (sajuData: SajuData, birthInfo: BirthInfo) => Promise<string>;

  // 프로필 수정
  updateProfile: (profileId: string, sajuData: SajuData, birthInfo: BirthInfo) => Promise<void>;

  // 프로필 색상 변경
  updateProfileColor: (profileId: string, color: string) => Promise<void>;

  // 프로필 삭제
  removeProfile: (profileId: string) => Promise<void>;

  // 활성 프로필 변경
  setActiveProfile: (profileId: string) => Promise<void>;

  // 프로필 불러오기
  loadProfiles: () => Promise<void>;

  // 기록 저장
  saveToHistory: (sajuData: SajuData) => Promise<void>;

  // 기록 불러오기
  loadHistory: () => Promise<void>;

  // 기록 삭제
  removeFromHistory: (id: string) => Promise<void>;

  // 기록 전체 삭제
  clearHistory: () => Promise<void>;

  // 현재 사주 설정
  setCurrentSaju: (saju: SajuData | null) => void;
}

function restoreSajuDates(raw: any): SajuData {
  return {
    ...raw,
    birthDate: {
      solar: new Date(raw.birthDate.solar),
      lunar: new Date(raw.birthDate.lunar),
    },
    createdAt: new Date(raw.createdAt),
  };
}

async function persistProfiles(profiles: ProfileEntry[], activeId: string | null) {
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  if (activeId) {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, activeId);
  }
}

export const useSajuStore = create<SajuStore>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  currentSaju: null,
  history: [],
  isLoading: false,

  activeProfile: () => {
    const { profiles, activeProfileId } = get();
    return profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null;
  },

  calculate: (birthInfo: BirthInfo) => {
    const sajuData = calculateSaju(birthInfo);
    set({ currentSaju: sajuData });
    return sajuData;
  },

  addProfile: async (sajuData: SajuData, birthInfo: BirthInfo) => {
    const entry: ProfileEntry = { id: sajuData.id, sajuData, birthInfo };
    const { profiles } = get();
    const updated = [...profiles, entry];
    set({ profiles: updated, activeProfileId: entry.id });
    await persistProfiles(updated, entry.id);
    return entry.id;
  },

  updateProfile: async (profileId: string, sajuData: SajuData, birthInfo: BirthInfo) => {
    const { profiles } = get();
    const updated = profiles.map((p) =>
      p.id === profileId ? { ...p, sajuData: { ...sajuData, id: profileId }, birthInfo } : p,
    );
    set({ profiles: updated });
    await persistProfiles(updated, get().activeProfileId);
  },

  updateProfileColor: async (profileId: string, color: string) => {
    const { profiles } = get();
    const updated = profiles.map((p) =>
      p.id === profileId ? { ...p, color } : p,
    );
    set({ profiles: updated });
    await persistProfiles(updated, get().activeProfileId);
  },

  removeProfile: async (profileId: string) => {
    const { profiles, activeProfileId } = get();
    const updated = profiles.filter((p) => p.id !== profileId);
    const newActiveId =
      activeProfileId === profileId
        ? (updated[0]?.id ?? null)
        : activeProfileId;
    set({ profiles: updated, activeProfileId: newActiveId });
    await persistProfiles(updated, newActiveId);
    if (!newActiveId) {
      await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  },

  setActiveProfile: async (profileId: string) => {
    set({ activeProfileId: profileId });
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  },

  loadProfiles: async () => {
    try {
      const [profilesJson, activeId] = await Promise.all([
        AsyncStorage.getItem(PROFILES_KEY),
        AsyncStorage.getItem(ACTIVE_PROFILE_KEY),
      ]);

      if (profilesJson) {
        const parsed: any[] = JSON.parse(profilesJson);
        const restored: ProfileEntry[] = parsed.map((entry) => ({
          ...entry,
          sajuData: restoreSajuDates(entry.sajuData),
        }));
        set({
          profiles: restored,
          activeProfileId: activeId ?? restored[0]?.id ?? null,
        });
      } else {
        // 마이그레이션: 기존 단일 프로필 → 멀티 프로필
        const oldJson = await AsyncStorage.getItem('@saju_profile');
        if (oldJson) {
          const parsed = JSON.parse(oldJson);
          const sajuData = restoreSajuDates(parsed.sajuData);
          const entry: ProfileEntry = {
            id: sajuData.id,
            sajuData,
            birthInfo: parsed.birthInfo,
          };
          set({ profiles: [entry], activeProfileId: entry.id });
          await persistProfiles([entry], entry.id);
          await AsyncStorage.removeItem('@saju_profile');
        }
      }
    } catch (e) {
      console.error('Failed to load profiles:', e);
    }
  },

  saveToHistory: async (sajuData: SajuData) => {
    try {
      const { history } = get();
      const updated = [sajuData, ...history];
      set({ history: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  },

  loadHistory: async () => {
    try {
      set({ isLoading: true });
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json);
        const restored = parsed.map((item: any) => restoreSajuDates(item));
        set({ history: restored });
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  removeFromHistory: async (id: string) => {
    try {
      const { history } = get();
      const updated = history.filter((item) => item.id !== id);
      set({ history: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to remove from history:', e);
    }
  },

  clearHistory: async () => {
    try {
      set({ history: [] });
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  },

  setCurrentSaju: (saju) => set({ currentSaju: saju }),
}));
