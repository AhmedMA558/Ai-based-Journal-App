import { cn } from '@/lib/utils';
import { MOODS, MOOD_META, type Mood } from '@/lib/moods';

interface MoodWheelProps {
  selectedMood: Mood | null;
  onSelectMood: (mood: Mood, emoji: string) => void;
}

export default function MoodWheel({ selectedMood, onSelectMood }: MoodWheelProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[0.8rem] text-[var(--text-secondary)] font-semibold">
        Select Active Mood Aura
      </label>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-[0.6rem]">
        {MOODS.map((key) => {
          const m = MOOD_META[key];
          const isSelected = selectedMood === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onSelectMood(m.key, m.emoji)}
              className={cn(
                'flex flex-col items-center justify-center gap-[0.35rem]',
                'py-[0.65rem] px-[0.5rem] rounded-[14px] cursor-pointer',
                'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
                isSelected ? 'scale-[1.03]' : 'scale-100'
              )}
              style={{
                background: isSelected ? m.bg : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? `2px solid ${m.text}` : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isSelected ? `0 0 16px ${m.bg}` : 'none',
              }}
            >
              <span className="text-[1.4rem]">{m.emoji}</span>
              <span
                className={cn('text-[0.75rem]', isSelected ? 'font-bold' : 'font-medium')}
                style={{ color: isSelected ? m.text : 'var(--text-secondary)' }}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
