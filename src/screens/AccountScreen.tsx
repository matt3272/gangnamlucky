import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useSajuStore } from '../store/useSajuStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ELEMENT_COLORS: Record<string, string> = {
  '목': Colors.wood,
  '화': Colors.fire,
  '토': Colors.earth,
  '금': Colors.metal,
  '수': Colors.water,
};

export default function AccountScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { activeProfile, loadProfiles } = useSajuStore();
  const profile = activeProfile();

  useEffect(() => {
    loadProfiles();
  }, []);

  const menuItems = [
    { icon: 'time-outline' as const, label: '상담 기록', route: 'History' as const },
    { icon: 'notifications-outline' as const, label: '알림 설정', route: null },
    { icon: 'help-circle-outline' as const, label: '고객센터', route: null },
    { icon: 'information-circle-outline' as const, label: '앱 정보', route: null },
  ];

  const formatBirthDate = () => {
    if (!profile) return '';
    const { birthInfo } = profile;
    const calLabel = birthInfo.calendarType === 'solar' ? '양력' : '음력';
    return `${calLabel} ${birthInfo.year}년 ${birthInfo.month}월 ${birthInfo.day}일 ${birthInfo.hour}시`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile */}
        {profile ? (
          <Card style={styles.profileCard}>
            <Card.Content>
              <View style={styles.profileHeader}>
                <View style={[styles.avatar, { backgroundColor: (profile.color || ELEMENT_COLORS[profile.sajuData.pillars.day.element] || Colors.primary) + '18' }]}>
                  <Text style={[styles.avatarText, { color: profile.color || ELEMENT_COLORS[profile.sajuData.pillars.day.element] || Colors.primary }]}>
                    {profile.sajuData.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text variant="titleMedium" style={styles.profileName}>
                    {profile.sajuData.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.profileDesc}>
                    {formatBirthDate()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('ProfileList')}
                  activeOpacity={0.6}
                >
                  <Text style={styles.editButtonText}>변경</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.profileCard}>
            <Card.Content style={styles.emptyProfile}>
              <View style={styles.avatar}>
                <Text style={styles.emptyAvatarText}>?</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text variant="titleMedium" style={styles.profileName}>
                  사주 정보가 없습니다
                </Text>
                <Text variant="bodySmall" style={styles.profileDesc}>
                  사주를 등록하면 맞춤 운세를 볼 수 있어요
                </Text>
              </View>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('SajuInput')}
                activeOpacity={0.6}
              >
                <Text style={styles.registerButtonText}>등록</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        )}

        {/* Menu */}
        <Card style={styles.menuCard}>
          <Card.Content style={styles.menuContent}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                {index > 0 && <Divider style={styles.divider} />}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    if (item.route) navigation.navigate(item.route);
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={Colors.textSecondary}
                  />
                  <Text variant="bodyLarge" style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>

        <Text variant="bodySmall" style={styles.version}>
          신묘 v1.0.0
        </Text>
      </View>
    </ScrollView>
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
  profileCard: {
    marginBottom: spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    elevation: 0,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  emptyAvatarText: {
    fontSize: 28,
    color: Colors.textMuted,
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  profileName: {
    fontWeight: '600',
    color: Colors.text,
  },
  profileDesc: {
    color: Colors.textMuted,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.primaryBg,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  registerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },

  // Menu
  menuCard: {
    marginBottom: spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    elevation: 0,
  },
  menuContent: {
    paddingVertical: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: spacing.md,
  },
  menuLabel: {
    flex: 1,
    color: Colors.text,
  },
  divider: {
    backgroundColor: Colors.borderLight,
  },
  version: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: spacing.md,
  },
});
