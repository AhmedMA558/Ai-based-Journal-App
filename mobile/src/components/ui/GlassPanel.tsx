import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

// RN can't do a real backdrop-blur cheaply/consistently across platforms, so this
// approximates frontend/src/index.css's .glass-panel with a flat translucent fill
// instead of blur - same border/radius/shadow language, no expo-blur dependency
// needed for this phase (see the Prototype Design token table's note on this).
export function GlassPanel({ className, style, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn('bg-panel-bg border border-panel-border rounded-[20px]', className)}
      style={[{ shadowColor: '#000', shadowOpacity: 0.36, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 }, style]}
      {...props}
    />
  );
}
