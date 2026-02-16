import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Card, Text, IconButton, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';
import { ELEMENT_COLORS } from '../constants/saju';
import { SajuData } from '../types/saju';
import { useSajuStore } from '../store/useSajuStore';
import { formatDate } from '../utils/dateUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { history, loadHistory, removeFromHistory, clearHistory } = useSajuStore();

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      '삭제 확인',
      `${name}의 사주 기록을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => removeFromHistory(id),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      '전체 삭제',
      '모든 사주 기록을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 삭제',
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: SajuData }) => {
    const { year, month, day, hour } = item.pillars;
    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('SajuResult', { sajuData: item })}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text variant="titleMedium" style={styles.name}>{item.name}</Text>
            <Text variant="bodySmall" style={styles.date}>
              {formatDate(item.birthDate.solar)} ({item.gender === 'male' ? '남' : '여'})
            </Text>
            <View style={styles.pillarsRow}>
              {[year, month, day, hour].map((pillar, i) => (
                <Text
                  key={i}
                  style={[styles.pillarBadge, { backgroundColor: ELEMENT_COLORS[pillar.element] + '30', color: ELEMENT_COLORS[pillar.element] }]}
                >
                  {pillar.stem}{pillar.branch}
                </Text>
              ))}
            </View>
          </View>
          <IconButton
            icon="delete-outline"
            size={20}
            iconColor={Colors.textMuted}
            onPress={() => handleDelete(item.id, item.name)}
          />
        </Card.Content>
      </Card>
    );
  };

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>記</Text>
        <Text variant="titleMedium" style={styles.emptyTitle}>
          조회 기록이 없습니다
        </Text>
        <Text variant="bodyMedium" style={styles.emptyDesc}>
          사주를 조회하면 여기에 기록이 저장됩니다
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('SajuInput')}
          style={styles.emptyButton}
          buttonColor={Colors.primary}
          textColor={Colors.white}
        >
          사주 보기
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="bodyMedium" style={styles.countText}>
          총 {history.length}건
        </Text>
        <Button
          mode="text"
          compact
          onPress={handleClearAll}
          textColor={Colors.error}
        >
          전체 삭제
        </Button>
      </View>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  countText: {
    color: Colors.textSecondary,
  },
  list: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  card: {
    marginBottom: spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    elevation: 0,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  date: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pillarsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  pillarBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
    fontWeight: '500',
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: Colors.background,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: Colors.text,
  },
  emptyDesc: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {},
});
