import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { cn } from '@/lib/utils';

// RN equivalent of .skeleton-pulse's shimmer keyframe - an opacity pulse loop
// via the core Animated API (no new animation library needed for this).
export function SkeletonBlock({ className }: { className?: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={{ opacity }} className={cn('bg-white/[0.06] rounded-[20px]', className)} />;
}
