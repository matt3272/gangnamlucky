import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { useSajuStore, ProfileEntry } from '../store/useSajuStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { height: SCREEN_H } = Dimensions.get('window');

function getProfileColor(p: ProfileEntry): string {
  return p.color || Colors.primary;
}

export default function CompatibilityScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { profiles } = useSajuStore();

  const [person1, setPerson1] = useState<ProfileEntry | null>(null);
  const [person2, setPerson2] = useState<ProfileEntry | null>(null);
  const [selectingSlot, setSelectingSlot] = useState<1 | 2 | null>(null);

  const openSelector = (slot: 1 | 2) => {
    if (profiles.length === 0) {
      navigation.navigate('SajuInput');
      return;
    }
    setSelectingSlot(slot);
  };

  const selectProfile = (profile: ProfileEntry) => {
    if (selectingSlot === 1) {
      setPerson1(profile);
      if (person2?.id === profile.id) setPerson2(null);
    } else {
      setPerson2(profile);
      if (person1?.id === profile.id) setPerson1(null);
    }
    setSelectingSlot(null);
  };

  const handleCalculate = () => {
    if (!person1 || !person2) return;
    navigation.navigate('CompatibilityResult', {
      saju1: person1.sajuData,
      saju2: person2.sajuData,
      color1: getProfileColor(person1),
      color2: getProfileColor(person2),
    });
  };

  const bothSelected = !!person1 && !!person2;

  return (
    <>
      <View style={styles.container}>
        {/* Top area */}
        <View style={styles.topArea}>
          <Text style={styles.heading}>두 사람의 사주로{'\n'}궁합을 확인해보세요</Text>
        </View>

        {/* Slots */}
        <View style={styles.slotsArea}>
          <TouchableOpacity style={[styles.slot, person1 && styles.slotFilled]} onPress={() => openSelector(1)} activeOpacity={0.7}>
            {person1 ? (
              <>
                <View style={[styles.avatar, { backgroundColor: getProfileColor(person1) }]}>
                  <Text style={styles.avatarText}>{person1.sajuData.name.charAt(0)}</Text>
                </View>
                <Text style={styles.slotName}>{person1.sajuData.name}</Text>
                <Text style={styles.slotSub}>
                  {person1.sajuData.gender === 'male' ? '남' : '여'} · {person1.sajuData.pillars.day.stem}{person1.sajuData.pillars.day.branch}일주
                </Text>
              </>
            ) : (
              <>
                <View style={styles.emptyCircle}>
                  <Text style={styles.plusIcon}>+</Text>
                </View>
                <Text style={styles.slotPlaceholder}>첫 번째 사람</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.heartWrap, bothSelected && styles.heartWrapActive]}>
            <Text style={styles.heartIcon}>☯</Text>
          </View>

          <TouchableOpacity style={[styles.slot, person2 && styles.slotFilled]} onPress={() => openSelector(2)} activeOpacity={0.7}>
            {person2 ? (
              <>
                <View style={[styles.avatar, { backgroundColor: getProfileColor(person2) }]}>
                  <Text style={styles.avatarText}>{person2.sajuData.name.charAt(0)}</Text>
                </View>
                <Text style={styles.slotName}>{person2.sajuData.name}</Text>
                <Text style={styles.slotSub}>
                  {person2.sajuData.gender === 'male' ? '남' : '여'} · {person2.sajuData.pillars.day.stem}{person2.sajuData.pillars.day.branch}일주
                </Text>
              </>
            ) : (
              <>
                <View style={styles.emptyCircle}>
                  <Text style={styles.plusIcon}>+</Text>
                </View>
                <Text style={styles.slotPlaceholder}>두 번째 사람</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom */}
        <View style={[styles.bottomArea, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            mode="contained"
            onPress={handleCalculate}
            disabled={!bothSelected}
            style={styles.calcBtn}
            contentStyle={styles.calcBtnContent}
            buttonColor={Colors.primary}
            textColor={Colors.white}
            labelStyle={styles.calcBtnLabel}
          >
            궁합 보기
          </Button>
        </View>
      </View>

      {/* Profile Selector Modal */}
      <Modal visible={selectingSlot !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>프로필 선택</Text>
            <FlatList
              data={profiles}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => {
                const otherId = selectingSlot === 1 ? person2?.id : person1?.id;
                const isOther = item.id === otherId;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isOther && styles.modalItemDisabled]}
                    onPress={() => !isOther && selectProfile(item)}
                    activeOpacity={isOther ? 1 : 0.7}
                  >
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>{item.sajuData.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.modalInfo}>
                      <Text style={[styles.modalName, isOther && { color: Colors.textMuted }]}>{item.sajuData.name}</Text>
                      <Text style={styles.modalDetail}>
                        {item.sajuData.gender === 'male' ? '남' : '여'} · {item.sajuData.pillars.day.stem}{item.sajuData.pillars.day.branch}일주
                      </Text>
                    </View>
                    {isOther && <Text style={styles.modalBadge}>상대방</Text>}
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                <TouchableOpacity style={styles.modalAddBtn} onPress={() => { setSelectingSlot(null); navigation.navigate('SajuInput'); }}>
                  <Text style={styles.modalAddText}>+ 새 프로필 등록</Text>
                </TouchableOpacity>
              }
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectingSlot(null)}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Top
  topArea: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  heading: { fontSize: 24, fontWeight: '700', color: Colors.text, lineHeight: 34 },

  // Slots
  slotsArea: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, gap: 12 },
  slot: {
    flex: 1, aspectRatio: 0.85, backgroundColor: Colors.surface, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
  },
  slotFilled: { borderStyle: 'solid', borderColor: 'transparent' },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: Colors.white },
  slotName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  slotSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  emptyCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  plusIcon: { fontSize: 32, fontWeight: '300', color: Colors.textMuted },
  slotPlaceholder: { fontSize: 14, color: Colors.textMuted },
  heartWrap: {
    position: 'absolute', zIndex: 1,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gray200, alignItems: 'center', justifyContent: 'center',
    opacity: 0.5,
  },
  heartWrapActive: {
    backgroundColor: 'rgba(88,86,214,0.15)', opacity: 1,
  },
  heartIcon: { fontSize: 28 },

  // Bottom
  bottomArea: { paddingHorizontal: spacing.md },
  calcBtn: { borderRadius: 14 },
  calcBtnContent: { paddingVertical: 6 },
  calcBtnLabel: { fontSize: 16, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: spacing.md, paddingBottom: 40, maxHeight: '70%',
  },
  modalHandle: {
    width: 36, height: 5, borderRadius: 3, backgroundColor: Colors.gray300,
    alignSelf: 'center', marginTop: 10, marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: spacing.md },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  modalItemDisabled: { opacity: 0.4 },
  modalAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  modalAvatarText: { fontSize: 17, fontWeight: '700', color: Colors.white },
  modalInfo: { flex: 1, marginLeft: 14 },
  modalName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  modalDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  modalBadge: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  modalAddBtn: { paddingVertical: 18, alignItems: 'center' },
  modalAddText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  modalCloseBtn: { paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.surfaceLight, borderRadius: 12, marginTop: spacing.sm },
  modalCloseText: { fontSize: 16, fontWeight: '600', color: Colors.text },
});
