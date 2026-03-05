import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const ringRotation = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. 로고 등장
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1, tension: 50, friction: 7, useNativeDriver: true,
      }),
    ]).start();

    // 2. 링 회전
    Animated.timing(ringOpacity, {
      toValue: 1, duration: 400, delay: 200, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true,
      }),
    ).start();

    // 3. 부제 등장
    Animated.timing(subtitleOpacity, {
      toValue: 1, duration: 500, delay: 500, useNativeDriver: true,
    }).start();

    // 4. 페이드아웃 후 완료
    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0, duration: 400, useNativeDriver: true,
      }).start(() => onFinish());
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const spin = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      {/* 배경 장식 링 */}
      <Animated.View style={[styles.ring, { opacity: ringOpacity, transform: [{ rotate: spin }] }]}>
        <View style={styles.ringInner} />
      </Animated.View>

      {/* 로고 */}
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Text style={styles.symbol}>☯</Text>
        <Text style={styles.logo}>신묘</Text>
      </Animated.View>

      {/* 부제 */}
      <Animated.View style={[styles.subtitleWrap, { opacity: subtitleOpacity }]}>
        <Text style={styles.subtitle}>사주 · 운세 · 궁합</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  ring: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1.5, borderColor: Colors.gray300,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  ringInner: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 1, borderColor: Colors.gray200,
    borderStyle: 'dashed',
  },
  symbol: {
    fontSize: 48, textAlign: 'center', marginBottom: 8,
  },
  logo: {
    fontSize: 44, fontWeight: '700', color: Colors.text,
    textAlign: 'center', letterSpacing: 4,
  },
  subtitleWrap: {
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14, fontWeight: '300', color: Colors.textSecondary,
    letterSpacing: 2,
  },
});
