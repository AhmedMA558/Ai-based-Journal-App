import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { journalService } from '@/services/journalService';
import { cn } from '@/lib/utils';

interface JournalEntry {
  createdAt?: string;
  mood?: string;
  [key: string]: unknown;
}

interface CalendarViewProps {
  onSelectJournal: (journal: JournalEntry) => void;
}

const MOOD_EMOJI: Record<string, string> = {
  HAPPY: '😊',
  EXCITED: '🤩',
  RELAXED: '😌',
  STRESSED: '😰',
  SAD: '🥺',
  GRATEFUL: '🙏',
};

function getMoodEmoji(mood?: string): string {
  return MOOD_EMOJI[(mood || '').toUpperCase()] || '😐';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarView({ onSelectJournal }: CalendarViewProps) {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await journalService.getAllJournals();
      const list = res?.data || res || [];
      setJournals(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Calendar error:', err);
    }
  };

  // Days in month calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map journal entry by date string (YYYY-MM-DD)
  const journalMap: Record<string, JournalEntry> = {};
  journals.forEach((j) => {
    if (j.createdAt) {
      const d = new Date(j.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      journalMap[key] = j;
    }
  });

  return (
    <div className="p-8 max-w-[1000px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[2rem] font-extrabold">Mood Calendar & Timeline</h1>
          <p className="text-[#94a3b8] text-[0.9rem]">Visual emotional tracking mapped across calendar days</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="btn-secondary p-2">
            <ChevronLeft size={18} />
          </button>
          <span className="text-[1.1rem] font-bold text-[#f8fafc] min-w-[140px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} className="btn-secondary p-2">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel p-7">
        <div className="grid grid-cols-7 gap-3 text-center font-semibold text-[#94a3b8] mb-4 text-[0.85rem]">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={idx} className="h-20 opacity-20" />;
            }

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const journalForDay = journalMap[dateKey];

            return (
              <div
                key={idx}
                onClick={() => journalForDay && onSelectJournal(journalForDay)}
                className={cn(
                  'h-20 rounded-xl p-2 flex flex-col justify-between transition-all duration-200',
                  journalForDay
                    ? 'bg-[rgba(99,102,241,0.18)] border border-[rgba(99,102,241,0.4)] cursor-pointer'
                    : 'bg-white/[0.03] border border-white/5 cursor-default'
                )}
              >
                <span className={cn('text-[0.8rem] font-semibold', journalForDay ? 'text-[#f8fafc]' : 'text-[#64748b]')}>
                  {day}
                </span>
                {journalForDay && (
                  <div className="text-[1.4rem] text-center">{getMoodEmoji(journalForDay.mood)}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
