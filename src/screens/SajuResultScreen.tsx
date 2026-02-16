import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing, borderRadius } from '../constants/theme';
import { Colors } from '../constants/colors';
import { ELEMENT_COLORS } from '../constants/saju';
import { Element, SajuData } from '../types/saju';
import { calculateTenGods, getInnateTenGod } from '../services/saju/tenGods';
import { calculateTwelveStages } from '../services/saju/twelveStages';
import { getDayAnimal } from '../services/saju/animals';
import { getStemElement, getBranchElement } from '../services/saju/elements';
import { useSajuStore, ProfileEntry } from '../store/useSajuStore';

type ResultRouteProp = RouteProp<RootStackParamList, 'SajuResult'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SajuResult'>;

/** 천간 한자 */
const STEM_HANJA: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
};

/** 지지 한자 */
const BRANCH_HANJA: Record<string, string> = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯',
  '진': '辰', '사': '巳', '오': '午', '미': '未',
  '신': '申', '유': '酉', '술': '戌', '해': '亥',
};

/** 오행별 배경색 (박스용, 연한 톤) */
const ELEMENT_BG: Record<Element, string> = {
  '목': '#DCFCE7',
  '화': '#FEE2E2',
  '토': '#FEF3C7',
  '금': '#F3F4F6',
  '수': '#DBEAFE',
};

/** 오행별 진한 텍스트 색 */
const ELEMENT_TEXT_COLOR: Record<Element, string> = {
  '목': '#15803D',
  '화': '#DC2626',
  '토': '#B45309',
  '금': '#4B5563',
  '수': '#1D4ED8',
};

export default function SajuResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResultRouteProp>();
  const { profiles, loadProfiles, setActiveProfile, removeProfile } = useSajuStore();

  const [sajuData, setSajuData] = useState<SajuData>(route.params.sajuData);
  const [modalVisible, setModalVisible] = useState(false);

  // 프로필 변경 후 돌아왔을 때 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      loadProfiles();
      // 현재 표시 중인 프로필이 업데이트됐는지 확인
      const updated = profiles.find((p) => p.id === sajuData.id);
      if (updated) {
        setSajuData(updated.sajuData);
      }
    }, [profiles.length]),
  );

  const { year, month, day, hour } = sajuData.pillars;
  const tenGods = calculateTenGods(sajuData.pillars);
  const twelveStages = calculateTwelveStages(sajuData.pillars);
  const dayAnimal = getDayAnimal(day.stem, day.branch);
  const innateTenGod = getInnateTenGod(sajuData.pillars);
  const dominantElement = sajuData.elements.dominant;

  const pillarsArr = [
    { label: '시주', pillar: hour },
    { label: '일주', pillar: day },
    { label: '월주', pillar: month },
    { label: '연주', pillar: year },
  ];

  const birthDateStr = `${sajuData.birthDate.solar.getFullYear()}.${String(sajuData.birthDate.solar.getMonth() + 1).padStart(2, '0')}.${String(sajuData.birthDate.solar.getDate()).padStart(2, '0')}`;

  // 현재 프로필이 첫 번째(본인)인지
  const isOwner = profiles.length > 0 && profiles[0]?.id === sajuData.id;

  const handleSelectProfile = (entry: ProfileEntry) => {
    setSajuData(entry.sajuData);
    setActiveProfile(entry.id);
    setModalVisible(false);
  };

  const handleEditProfile = (profileId: string) => {
    setModalVisible(false);
    navigation.navigate('SajuInput', { mode: 'edit', profileId });
  };

  const handleAddProfile = () => {
    setModalVisible(false);
    navigation.navigate('SajuInput', { mode: 'new' });
  };

  const handleDeleteProfile = (entry: ProfileEntry) => {
    Alert.alert(
      '프로필 삭제',
      `${entry.sajuData.name}님의 프로필을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await removeProfile(entry.id);
            // 삭제한 프로필이 현재 보고 있는 프로필이면 첫 번째 프로필로 전환
            if (entry.id === sajuData.id) {
              const remaining = profiles.filter((p) => p.id !== entry.id);
              if (remaining.length > 0) {
                setSajuData(remaining[0].sajuData);
              } else {
                navigation.goBack();
              }
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            <View style={styles.profileLeft}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>{sajuData.name}</Text>
                {isOwner && (
                  <View style={styles.profileBadge}>
                    <Text style={styles.profileBadgeText}>본인</Text>
                  </View>
                )}
              </View>
              <Text style={styles.profileDetail}>
                {birthDateStr} (양력) · {sajuData.gender === 'male' ? '남성' : '여성'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.changeBtnText}>변경</Text>
            </TouchableOpacity>
          </View>

          {/* 3개 요약 카드 */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconCircle, { backgroundColor: ELEMENT_BG[dominantElement] }]}>
                <Text style={[styles.summaryIconText, { color: ELEMENT_TEXT_COLOR[dominantElement] }]}>
                  {dominantElement}
                </Text>
              </View>
              <Text style={styles.summaryValue}>{dominantElement}</Text>
              <Text style={styles.summaryLabel}>오행</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconCircle, { backgroundColor: ELEMENT_BG[day.element] }]}>
                <Text style={styles.summaryAnimalIcon}>🐾</Text>
              </View>
              <Text style={styles.summaryValue}>{dayAnimal}</Text>
              <Text style={styles.summaryLabel}>일주 동물</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconCircle, { backgroundColor: Colors.primaryBg }]}>
                <Text style={[styles.summaryIconText, { color: Colors.primary }]}>性</Text>
              </View>
              <Text style={styles.summaryValue}>{innateTenGod}</Text>
              <Text style={styles.summaryLabel}>타고난 성향</Text>
            </View>
          </View>

          {/* 사주 기둥 */}
          <View style={styles.pillarsCard}>
            <Text style={styles.sectionTitle}>사주팔자</Text>

            {/* 기둥 라벨 */}
            <View style={styles.pillarLabels}>
              {pillarsArr.map(({ label }) => (
                <View key={label} style={styles.pillarLabelCell}>
                  <Text style={styles.pillarLabelText}>{label}</Text>
                </View>
              ))}
            </View>

            {/* 십신 (천간) */}
            <View style={styles.tenGodRow}>
              {tenGods.stems.map((god, i) => (
                <View key={`stem-god-${i}`} style={styles.tenGodCell}>
                  <Text style={styles.tenGodText}>{god}</Text>
                </View>
              ))}
            </View>

            {/* 천간 한자 박스 */}
            <View style={styles.hanjaRow}>
              {pillarsArr.map(({ label, pillar }) => {
                const element = getStemElement(pillar.stem);
                return (
                  <View key={`stem-${label}`} style={styles.hanjaCell}>
                    <View style={[styles.hanjaBox, { backgroundColor: ELEMENT_BG[element] }]}>
                      <Text style={[styles.hanjaChar, { color: ELEMENT_TEXT_COLOR[element] }]}>
                        {STEM_HANJA[pillar.stem]}
                      </Text>
                      <Text style={[styles.yinyangMark, { color: ELEMENT_TEXT_COLOR[element] }]}>
                        {pillar.yinYang === 'yang' ? '+' : '-'}
                      </Text>
                    </View>
                    <Text style={[styles.elementTag, { color: ELEMENT_TEXT_COLOR[element] }]}>
                      {element}({pillar.stem})
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* 지지 한자 박스 */}
            <View style={styles.hanjaRow}>
              {pillarsArr.map(({ label, pillar }) => {
                const element = getBranchElement(pillar.branch);
                const branchYinYang = ['자', '인', '진', '오', '신', '술'].includes(pillar.branch) ? 'yang' : 'yin';
                return (
                  <View key={`branch-${label}`} style={styles.hanjaCell}>
                    <View style={[styles.hanjaBox, { backgroundColor: ELEMENT_BG[element] }]}>
                      <Text style={[styles.hanjaChar, { color: ELEMENT_TEXT_COLOR[element] }]}>
                        {BRANCH_HANJA[pillar.branch]}
                      </Text>
                      <Text style={[styles.yinyangMark, { color: ELEMENT_TEXT_COLOR[element] }]}>
                        {branchYinYang === 'yang' ? '+' : '-'}
                      </Text>
                    </View>
                    <Text style={[styles.elementTag, { color: ELEMENT_TEXT_COLOR[element] }]}>
                      {element}({pillar.branch})
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* 십신 (지지) */}
            <View style={styles.tenGodRow}>
              {tenGods.branches.map((god, i) => (
                <View key={`branch-god-${i}`} style={styles.tenGodCell}>
                  <Text style={styles.tenGodText}>{god}</Text>
                </View>
              ))}
            </View>

            {/* 12운성 */}
            <View style={styles.twelveStageRow}>
              {twelveStages.map((stage, i) => (
                <View key={`stage-${i}`} style={styles.twelveStageCell}>
                  <Text style={styles.twelveStageText}>{stage}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 오행 분포 */}
          <View style={styles.elementsCard}>
            <Text style={styles.sectionTitle}>오행 분포</Text>
            {(() => {
              const items = [
                { key: '목' as Element, hanja: '木', count: sajuData.elements.wood },
                { key: '화' as Element, hanja: '火', count: sajuData.elements.fire },
                { key: '토' as Element, hanja: '土', count: sajuData.elements.earth },
                { key: '금' as Element, hanja: '金', count: sajuData.elements.metal },
                { key: '수' as Element, hanja: '水', count: sajuData.elements.water },
              ];
              const total = items.reduce((s, i) => s + i.count, 0) || 1;
              const maxCount = Math.max(...items.map(i => i.count), 1);
              const visible = items.filter(i => i.count > 0);

              return (
                <>
                  {/* 세그먼트 바 (iPhone 저장공간 스타일) */}
                  <View style={styles.segmentedBar}>
                    {visible.map((item) => (
                      <View
                        key={item.key}
                        style={[
                          styles.segment,
                          { flex: item.count, backgroundColor: ELEMENT_COLORS[item.key] },
                        ]}
                      />
                    ))}
                  </View>

                  {/* 개별 오행 행 */}
                  <View style={styles.elementRows}>
                    {items.map((item) => (
                      <View key={item.key} style={styles.elementRow}>
                        <View style={[styles.elementDot, { backgroundColor: ELEMENT_COLORS[item.key] }]} />
                        <Text style={styles.elementLabel}>
                          {item.key}({item.hanja})
                        </Text>
                        <View style={styles.elementBarBg}>
                          <View
                            style={[
                              styles.elementBarFill,
                              {
                                width: item.count > 0 ? `${(item.count / maxCount) * 100}%` : '0%',
                                backgroundColor: ELEMENT_COLORS[item.key],
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.elementPct}>
                          {Math.round((item.count / total) * 100)}%
                        </Text>
                        {item.count === 0 && (
                          <View style={[styles.statusTag, { backgroundColor: Colors.error + '15' }]}>
                            <Text style={[styles.statusTagText, { color: Colors.error }]}>부재</Text>
                          </View>
                        )}
                        {item.count === 1 && (
                          <View style={[styles.statusTag, { backgroundColor: Colors.warning + '15' }]}>
                            <Text style={[styles.statusTagText, { color: Colors.warning }]}>부족</Text>
                          </View>
                        )}
                        {item.count === 2 && (
                          <View style={[styles.statusTag, { backgroundColor: Colors.success + '15' }]}>
                            <Text style={[styles.statusTagText, { color: Colors.success }]}>균형</Text>
                          </View>
                        )}
                        {item.count >= 3 && (
                          <View style={[styles.statusTag, { backgroundColor: Colors.info + '15' }]}>
                            <Text style={[styles.statusTagText, { color: Colors.info }]}>과다</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* 강/약 요약 */}
                  <View style={styles.elementSummary}>
                    <View style={styles.summaryChip}>
                      <Text style={styles.summaryChipLabel}>강한 오행</Text>
                      <View style={[styles.summaryChipDot, { backgroundColor: ELEMENT_COLORS[sajuData.elements.dominant] }]} />
                      <Text style={styles.summaryChipValue}>{sajuData.elements.dominant}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryChip}>
                      <Text style={styles.summaryChipLabel}>약한 오행</Text>
                      <View style={[styles.summaryChipDot, { backgroundColor: ELEMENT_COLORS[sajuData.elements.weak] }]} />
                      <Text style={styles.summaryChipValue}>{sajuData.elements.weak}</Text>
                    </View>
                  </View>
                </>
              );
            })()}
          </View>

          {/* 액션 버튼 */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AIAnalysis', { sajuData })}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>운세 풀이 보기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 프로필 목록 모달 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalWrap}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>프로필 선택</Text>
            <IconButton
              icon="close"
              size={22}
              iconColor={Colors.textSecondary}
              onPress={() => setModalVisible(false)}
            />
          </View>

          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {profiles.map((entry, index) => {
              const isActive = entry.id === sajuData.id;
              const bd = entry.sajuData.birthDate.solar;
              const dateStr = `${bd.getFullYear()}.${String(bd.getMonth() + 1).padStart(2, '0')}.${String(bd.getDate()).padStart(2, '0')}`;
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.profileItem, isActive && styles.profileItemActive]}
                  onPress={() => handleSelectProfile(entry)}
                  activeOpacity={0.7}
                >
                  <View style={styles.profileItemLeft}>
                    <View style={styles.profileItemNameRow}>
                      <Text style={[styles.profileItemName, isActive && styles.profileItemNameActive]}>
                        {entry.sajuData.name}
                      </Text>
                      {index === 0 && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.ownerBadgeText}>본인</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.profileItemDate}>
                      {dateStr} · {entry.sajuData.gender === 'male' ? '남' : '여'}
                    </Text>
                  </View>
                  <View style={styles.profileItemActions}>
                    <TouchableOpacity
                      onPress={() => handleEditProfile(entry.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.editIconBtn}
                    >
                      <IconButton
                        icon="pencil"
                        size={18}
                        iconColor={Colors.textSecondary}
                        style={styles.iconBtnCompact}
                      />
                    </TouchableOpacity>
                    {index !== 0 && (
                      <TouchableOpacity
                        onPress={() => handleDeleteProfile(entry)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.editIconBtn}
                      >
                        <IconButton
                          icon="trash-can-outline"
                          size={18}
                          iconColor={Colors.error}
                          style={styles.iconBtnCompact}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 프로필 추가 버튼 */}
          <TouchableOpacity
            style={styles.addProfileBtn}
            onPress={handleAddProfile}
            activeOpacity={0.7}
          >
            <IconButton icon="plus" size={20} iconColor={Colors.primary} style={styles.iconBtnCompact} />
            <Text style={styles.addProfileText}>새 프로필 추가</Text>
          </TouchableOpacity>
        </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // 프로필 섹션
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  profileLeft: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  profileBadge: {
    backgroundColor: Colors.primaryBg,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  profileBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  profileDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  changeBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: borderRadius.round,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  changeBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // 요약 카드 3개
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
  },
  summaryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryIconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryAnimalIcon: {
    fontSize: 20,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // 사주 기둥 카드
  pillarsCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: spacing.md,
  },
  pillarLabels: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  pillarLabelCell: {
    flex: 1,
    alignItems: 'center',
  },
  pillarLabelText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // 십신 행
  tenGodRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  tenGodCell: {
    flex: 1,
    alignItems: 'center',
  },
  tenGodText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // 한자 박스
  hanjaRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  hanjaCell: {
    flex: 1,
    alignItems: 'center',
  },
  hanjaBox: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hanjaChar: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  yinyangMark: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  elementTag: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },

  // 12운성
  twelveStageRow: {
    flexDirection: 'row',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  twelveStageCell: {
    flex: 1,
    alignItems: 'center',
  },
  twelveStageText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // 오행 분포
  elementsCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
    gap: 1.5,
  },
  segment: {
    height: '100%',
  },
  elementRows: {
    gap: 14,
    marginBottom: spacing.md,
  },
  elementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  elementDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  elementLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    width: 50,
  },
  elementBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray100,
    overflow: 'hidden',
  },
  elementBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  elementPct: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 32,
    textAlign: 'right',
  },
  statusTag: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    width: 34,
    alignItems: 'center',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  elementSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
    gap: spacing.md,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryChipLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryChipValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
  },

  // 액션 버튼
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },

  // 모달
  modalWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    alignSelf: 'center',
    marginTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalList: {
    paddingHorizontal: spacing.md,
  },

  // 프로필 아이템
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: 4,
  },
  profileItemActive: {
    backgroundColor: Colors.primaryBg,
  },
  profileItemLeft: {
    flex: 1,
  },
  profileItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  profileItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  profileItemNameActive: {
    color: Colors.primary,
  },
  ownerBadge: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  ownerBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  profileItemDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  profileItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIconBtn: {
    marginLeft: 0,
  },
  iconBtnCompact: {
    margin: 0,
  },

  // 프로필 추가 버튼
  addProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
  },
  addProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
