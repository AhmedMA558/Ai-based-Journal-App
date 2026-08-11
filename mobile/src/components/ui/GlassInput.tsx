import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';

// RN port of .glass-input.
export function GlassInput({ className, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#64748b"
      className={cn(
        'bg-white/[0.03] border border-panel-border text-text-primary rounded-2xl px-[18px] py-[13px] text-[15px]',
        className
      )}
      {...props}
    />
  );
}
