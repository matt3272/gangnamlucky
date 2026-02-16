import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  Card,
  Chip,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing, borderRadius } from '../constants/theme';
import { Colors } from '../constants/colors';
import { Gender, CalendarType } from '../types/saju';
import { useSajuStore } from '../store/useSajuStore';
import { isValidDate } from '../utils/dateUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SajuInput'>;
type SajuInputRoute = RouteProp<RootStackParamList, 'SajuInput'>;

function findBirthInfoByProfileId(profileId: string | undefined) {
  if (!profileId) return null;
  const { profiles } = useSajuStore.getState();
  const entry = profiles.find((p) => p.id === profileId);
  return entry?.birthInfo ?? null;
}

const TIME_SLOTS = [
  { label: '자시', desc: '23~01시', hour: 0 },
  { label: '축시', desc: '01~03시', hour: 2 },
  { label: '인시', desc: '03~05시', hour: 4 },
  { label: '묘시', desc: '05~07시', hour: 6 },
  { label: '진시', desc: '07~09시', hour: 8 },
  { label: '사시', desc: '09~11시', hour: 10 },
  { label: '오시', desc: '11~13시', hour: 12 },
  { label: '미시', desc: '13~15시', hour: 14 },
  { label: '신시', desc: '15~17시', hour: 16 },
  { label: '유시', desc: '17~19시', hour: 18 },
  { label: '술시', desc: '19~21시', hour: 20 },
  { label: '해시', desc: '21~23시', hour: 22 },
];

export default function SajuInputScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SajuInputRoute>();
  const { calculate, saveToHistory, addProfile, updateProfile } = useSajuStore();

  const isEditMode = route.params?.mode === 'edit';
  const profileId = route.params?.profileId;
  const prefill = isEditMode ? findBirthInfoByProfileId(profileId) : null;

  const [name, setName] = useState(prefill?.name ?? '');
  const [gender, setGender] = useState<Gender>(prefill?.gender ?? 'male');
  const [calendarType, setCalendarType] = useState<CalendarType>(prefill?.calendarType ?? 'solar');
  const [birthDate, setBirthDate] = useState(
    prefill ? `${prefill.year}.${String(prefill.month).padStart(2, '0')}.${String(prefill.day).padStart(2, '0')}` : '',
  );
  const [selectedTime, setSelectedTime] = useState<number | null>(prefill?.hour ?? null);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [isLeapMonth, setIsLeapMonth] = useState(prefill?.isLeapMonth ?? false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  /** 숫자만 남기고 YYYY.MM.DD 형태로 자동 포맷 */
  const handleDateChange = (text: string) => {
    // 숫자만 추출
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    if (digits.length <= 4) {
      formatted = digits;
    } else if (digits.length <= 6) {
      formatted = `${digits.slice(0, 4)}.${digits.slice(4)}`;
    } else {
      formatted = `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
    }
    setBirthDate(formatted);
  };

  /** birthDate 문자열에서 년/월/일 파싱 */
  const parseBirthDate = (): { y: number; m: number; d: number } | null => {
    const parts = birthDate.split('.');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const d = parseInt(parts[2]);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return { y, m, d };
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = '이름을 입력하세요';
    }

    const parsed = parseBirthDate();
    if (!parsed) {
      newErrors.birthDate = 'YYYY.MM.DD 형식으로 입력하세요';
    } else {
      const { y, m, d } = parsed;
      if (y < 1900 || y > 2100) {
        newErrors.birthDate = '연도는 1900~2100 범위로 입력하세요';
      } else if (m < 1 || m > 12) {
        newErrors.birthDate = '월은 1~12 범위로 입력하세요';
      } else if (d < 1 || d > 31 || !isValidDate(y, m, d)) {
        newErrors.birthDate = '유효하지 않은 날짜입니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async () => {
    if (!validate()) return;

    try {
      const { y, m, d } = parseBirthDate()!;
      const birthInfo = {
        name: name.trim(),
        gender,
        calendarType,
        year: y,
        month: m,
        day: d,
        hour: timeUnknown ? 12 : (selectedTime ?? 12),
        minute: 0,
        isLeapMonth,
      };

      const sajuData = calculate(birthInfo);

      if (isEditMode && profileId) {
        await updateProfile(profileId, sajuData, birthInfo);
        sajuData.id = profileId;
      } else {
        await addProfile(sajuData, birthInfo);
      }
      await saveToHistory(sajuData);
      navigation.navigate('SajuResult', { sajuData });
    } catch (e) {
      Alert.alert('오류', '사주 계산 중 오류가 발생했습니다. 입력값을 확인해주세요.');
    }
  };

  const handleTimeSelect = (hour: number) => {
    setTimeUnknown(false);
    setSelectedTime(hour);
  };

  const handleTimeUnknown = () => {
    setTimeUnknown(true);
    setSelectedTime(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Section 1: Name & Gender */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>기본 정보</Text>

              <TextInput
                label="이름"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                error={!!errors.name}
                left={<TextInput.Icon icon="account" color={Colors.textMuted} />}
                textColor={Colors.text}
                outlineColor={Colors.border}
                activeOutlineColor={Colors.primary}
                theme={{ colors: { onSurfaceVariant: Colors.textSecondary } }}
              />
              {errors.name && <HelperText type="error">{errors.name}</HelperText>}

              <Text style={styles.fieldLabel}>성별</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'male' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender('male')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.genderEmoji}>👨</Text>
                  <Text
                    style={[
                      styles.genderLabel,
                      gender === 'male' && styles.genderLabelActive,
                    ]}
                  >
                    남성
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'female' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender('female')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.genderEmoji}>👩</Text>
                  <Text
                    style={[
                      styles.genderLabel,
                      gender === 'female' && styles.genderLabelActive,
                    ]}
                  >
                    여성
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

          {/* Section 2: Birth Date */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>생년월일</Text>

              <View style={styles.calendarRow}>
                <Chip
                  selected={calendarType === 'solar'}
                  onPress={() => setCalendarType('solar')}
                  style={[
                    styles.calendarChip,
                    calendarType === 'solar' && styles.calendarChipActive,
                  ]}
                  textStyle={calendarType === 'solar' ? styles.calendarChipTextActive : styles.calendarChipText}
                  showSelectedCheck={false}
                >
                  양력
                </Chip>
                <Chip
                  selected={calendarType === 'lunar'}
                  onPress={() => setCalendarType('lunar')}
                  style={[
                    styles.calendarChip,
                    calendarType === 'lunar' && styles.calendarChipActive,
                  ]}
                  textStyle={calendarType === 'lunar' ? styles.calendarChipTextActive : styles.calendarChipText}
                  showSelectedCheck={false}
                >
                  음력
                </Chip>
                {calendarType === 'lunar' && (
                  <Chip
                    selected={isLeapMonth}
                    onPress={() => setIsLeapMonth(!isLeapMonth)}
                    style={[
                      styles.calendarChip,
                      isLeapMonth && styles.leapChipActive,
                    ]}
                    textStyle={isLeapMonth ? styles.calendarChipTextActive : styles.calendarChipText}
                    showSelectedCheck={false}
                  >
                    윤달
                  </Chip>
                )}
              </View>

              <TextInput
                label="생년월일"
                value={birthDate}
                onChangeText={handleDateChange}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.birthDate}
                placeholder="2004.10.27"
                maxLength={10}
                textColor={Colors.text}
                outlineColor={Colors.border}
                activeOutlineColor={Colors.primary}
                theme={{ colors: { onSurfaceVariant: Colors.textSecondary } }}
                style={styles.dateInput}
                left={<TextInput.Icon icon="calendar" color={Colors.textMuted} />}
              />
              {errors.birthDate && <HelperText type="error">{errors.birthDate}</HelperText>}
            </Card.Content>
          </Card>

          {/* Section 3: Birth Time */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.timeTitleRow}>
                <Text variant="titleMedium" style={styles.sectionTitle}>태어난 시간</Text>
                <Chip
                  selected={timeUnknown}
                  onPress={handleTimeUnknown}
                  style={[
                    styles.unknownChip,
                    timeUnknown && styles.unknownChipActive,
                  ]}
                  textStyle={timeUnknown ? styles.unknownChipTextActive : styles.unknownChipText}
                  showSelectedCheck={false}
                  icon={timeUnknown ? 'check-circle' : 'help-circle-outline'}
                >
                  모름
                </Chip>
              </View>

              {timeUnknown ? (
                <View style={styles.unknownInfo}>
                  <Text variant="bodyMedium" style={styles.unknownInfoText}>
                    태어난 시간을 모를 경우 오시(午時, 11~13시)를{'\n'}기준으로 분석합니다.
                  </Text>
                </View>
              ) : (
                <View style={styles.timeGrid}>
                  {TIME_SLOTS.map((slot) => (
                    <TouchableOpacity
                      key={slot.hour}
                      style={[
                        styles.timeSlot,
                        selectedTime === slot.hour && styles.timeSlotActive,
                      ]}
                      onPress={() => handleTimeSelect(slot.hour)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.timeSlotLabel,
                          selectedTime === slot.hour && styles.timeSlotLabelActive,
                        ]}
                      >
                        {slot.label}
                      </Text>
                      <Text
                        style={[
                          styles.timeSlotDesc,
                          selectedTime === slot.hour && styles.timeSlotDescActive,
                        ]}
                      >
                        {slot.desc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCalculate}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonLabel}>사주 분석하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    color: Colors.text,
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.xs,
    backgroundColor: Colors.surface,
  },
  fieldLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },

  // Gender
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  genderButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  genderEmoji: {
    fontSize: 20,
  },
  genderLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  genderLabelActive: {
    color: Colors.primary,
  },

  // Calendar type
  calendarRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  calendarChip: {
    backgroundColor: Colors.surfaceLight,
  },
  calendarChipActive: {
    backgroundColor: Colors.primaryBg,
  },
  calendarChipText: {
    color: Colors.textSecondary,
  },
  calendarChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  leapChipActive: {
    backgroundColor: Colors.warning + '20',
  },

  // Date input
  dateInput: {
    backgroundColor: Colors.surface,
  },

  // Time section
  timeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  unknownChip: {
    backgroundColor: Colors.surfaceLight,
  },
  unknownChipActive: {
    backgroundColor: Colors.primaryBg,
  },
  unknownChipText: {
    color: Colors.textSecondary,
  },
  unknownChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  unknownInfo: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  unknownInfoText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Time grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeSlot: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  timeSlotActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  timeSlotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  timeSlotLabelActive: {
    color: Colors.white,
  },
  timeSlotDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  timeSlotDescActive: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Submit
  submitButton: {
    marginTop: spacing.sm,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  submitButtonLabel: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
