import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Text as RNText } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useSajuStore, ProfileEntry } from '../store/useSajuStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

class ProfileErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message ?? String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F2F2F7' }}>
          <RNText style={{ fontSize: 16, fontWeight: '700', color: '#FF3B30', marginBottom: 12 }}>오류 발생</RNText>
          <RNText style={{ fontSize: 13, color: '#8E8E93', textAlign: 'center' }}>{this.state.errorMsg}</RNText>
        </View>
      );
    }
    return this.props.children;
  }
}

const ELEMENT_COLORS: Record<string, string> = {
  '목': Colors.wood,
  '화': Colors.fire,
  '토': Colors.earth,
  '금': Colors.metal,
  '수': Colors.water,
};

const PROFILE_COLORS = [
  { label: '인디고', value: '#5856D6' },
  { label: '블루', value: '#007AFF' },
  { label: '시안', value: '#32ADE6' },
  { label: '그린', value: '#34C759' },
  { label: '옐로', value: '#FF9500' },
  { label: '레드', value: '#FF3B30' },
  { label: '핑크', value: '#FF2D55' },
  { label: '퍼플', value: '#AF52DE' },
];

function getProfileColor(profile: ProfileEntry): string {
  if (profile.color) return profile.color;
  const element = profile.sajuData?.pillars?.day?.element;
  return (element && ELEMENT_COLORS[element]) || Colors.primary;
}

function ProfileListContent() {
  const navigation = useNavigation<NavigationProp>();
  const { profiles, activeProfileId, setActiveProfile, removeProfile, loadProfiles, updateProfileColor } = useSajuStore();
  const [colorPickerTarget, setColorPickerTarget] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [])
  );

  const handleSelect = async (id: string) => {
    await setActiveProfile(id);
  };

  const handleDelete = (id: string, name: string = '이름없음') => {
    Alert.alert(
      '프로필 삭제',
      `"${name}" 프로필을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => removeProfile(id),
        },
      ],
    );
  };

  const handleColorSelect = async (color: string) => {
    if (colorPickerTarget) {
      await updateProfileColor(colorPickerTarget, color);
      setColorPickerTarget(null);
    }
  };

  const formatBirth = (profile: typeof profiles[0]) => {
    const birthInfo = profile?.birthInfo;
    if (!birthInfo) return '';
    const cal = birthInfo.calendarType === 'solar' ? '양력' : '음력';
    return `${cal} ${birthInfo.year}.${String(birthInfo.month).padStart(2, '0')}.${String(birthInfo.day).padStart(2, '0')}`;
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfileId;
            const color = getProfileColor(profile);

            return (
              <TouchableOpacity
                key={profile.id}
                activeOpacity={0.7}
                onPress={() => handleSelect(profile.id)}
              >
                <Card style={[styles.card, isActive && styles.cardActive]}>
                  <Card.Content style={styles.row}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setColorPickerTarget(profile.id)}
                    >
                      <View style={[styles.avatar, { backgroundColor: color + '18' }]}>
                        <Text style={[styles.avatarText, { color }]}>
                          {(profile.sajuData?.name ?? '?').charAt(0)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.info}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name}>{profile.sajuData?.name ?? '이름없음'}</Text>
                        {isActive && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>현재</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.birth}>{formatBirth(profile)}</Text>
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setColorPickerTarget(profile.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="color-palette-outline" size={20} color={color} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('SajuInput', { mode: 'edit', profileId: profile.id })}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(profile.id, profile.sajuData.name)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })}

          {/* 새 프로필 추가 */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SajuInput')}
          >
            <Card style={styles.addCard}>
              <Card.Content style={styles.addRow}>
                <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                <Text style={styles.addText}>새 프로필 추가</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Color Picker Modal */}
      {colorPickerTarget !== null && (
      <Modal visible transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setColorPickerTarget(null)}
        >
          <View style={styles.colorSheet}>
            <Text style={styles.colorTitle}>프로필 색상</Text>
            <View style={styles.colorGrid}>
              {PROFILE_COLORS.map((c) => {
                const currentProfile = profiles.find(p => p.id === colorPickerTarget);
                const currentColor = currentProfile ? getProfileColor(currentProfile) : '';
                const isSelected = currentColor === c.value;
                return (
                  <TouchableOpacity
                    key={c.value}
                    style={styles.colorItem}
                    onPress={() => handleColorSelect(c.value)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.colorCircle, { backgroundColor: c.value }, isSelected && styles.colorCircleSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={18} color={Colors.white} />}
                    </View>
                    <Text style={styles.colorLabel}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.colorCloseBtn} onPress={() => setColorPickerTarget(null)}>
              <Text style={styles.colorCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      )}
    </>
  );
}

export default function ProfileListScreen() {
  return (
    <ProfileErrorBoundary>
      <ProfileListContent />
    </ProfileErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  card: {
    marginBottom: spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    elevation: 0,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardActive: {
    borderColor: Colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: Colors.primary + '18',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  birth: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  addCard: {
    marginBottom: spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    elevation: 0,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  addText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Color Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  colorSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    width: '100%',
  },
  colorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  colorItem: {
    alignItems: 'center',
    width: 60,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  colorLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  colorCloseBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  colorCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
});
