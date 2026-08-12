import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#818cf8', '#c084fc', '#4ade80', '#fde047', '#fb7185', '#38bdf8'];
const PARTICLE_COUNT = 28;
const { width, height } = Dimensions.get('window');

interface ConfettiBurstProps {
  onEnd?: () => void;
}

// Dependency-free confetti burst (Animated View "particles" flung outward
// with gravity, then faded) - avoids pulling in a whole confetti package
// (react-native-confetti-cannon et al.) for one celebratory moment, same
// reasoning AnalyticsScreen used to skip a charting library.
export function ConfettiBurst({ onEnd }: ConfettiBurstProps) {
  const progress = useRef(new Animated.Value(0)).current;

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5;
        const distance = 90 + Math.random() * 140;
        return {
          color: COLORS[i % COLORS.length],
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance * 0.6 - 40,
          rotate: Math.round(Math.random() * 360),
          size: 6 + Math.random() * 6,
        };
      }),
    []
  );

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) onEnd?.();
    });
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => {
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] });
        const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy + 220] });
        const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rotate}deg`] });
        const opacity = progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: width / 2,
              top: height / 3,
              width: p.size,
              height: p.size * 1.6,
              backgroundColor: p.color,
              borderRadius: 2,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
