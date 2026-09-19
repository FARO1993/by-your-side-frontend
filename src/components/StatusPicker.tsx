import { useState } from 'react';
import { setStatus } from '../api/statuses';
import type { Status, StatusMood } from '../api/types';
import { WellIcon, DistractionIcon, DifficultDayIcon, NeedToTalkIcon, HereForSomeoneIcon } from './Icons';

const moods: { value: StatusMood; label: string; Icon: typeof WellIcon; color: string }[] = [
  { value: 'WELL', label: 'Estoy bien', Icon: WellIcon, color: 'text-calm' },
  { value: 'NEED_DISTRACTION', label: 'Necesito distraerme', Icon: DistractionIcon, color: 'text-amber-500' },
  { value: 'DIFFICULT_DAY', label: 'Día difícil', Icon: DifficultDayIcon, color: 'text-horizon' },
  { value: 'NEED_TO_TALK', label: 'Necesito hablar', Icon: NeedToTalkIcon, color: 'text-red-500' },
  { value: 'HERE_FOR_SOMEONE', label: 'Estoy acá para alguien', Icon: HereForSomeoneIcon, color: 'text-dusk' },
];

export default function StatusPicker({ onSet }: { onSet: (status: Status) => void }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSelect(mood: StatusMood) {
    setSubmitting(true);
    try {
      const status = await setStatus(mood);
      onSet(status);
    } catch {
      // Silencioso a proposito.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6 border-l-2 border-mist bg-white p-4">
      <p className="mb-3 text-sm font-medium text-dusk">¿Cómo estás hoy?</p>
      <div className="flex flex-wrap gap-2">
        {moods.map(({ value, label, Icon, color }) => (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-full border border-mist px-3 py-1.5 text-sm text-ink transition-all duration-150 hover:border-horizon active:scale-95 disabled:opacity-60"
          >
            <Icon className={`h-4 w-4 ${color}`} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}