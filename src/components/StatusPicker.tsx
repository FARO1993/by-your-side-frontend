import { useState } from 'react';
import { setStatus } from '../api/statuses';
import type { Status, StatusMood } from '../api/types';

const moods: { value: StatusMood; label: string; emoji: string }[] = [
  { value: 'WELL', label: 'Estoy bien', emoji: '🟢' },
  { value: 'NEED_DISTRACTION', label: 'Necesito distraerme', emoji: '🟡' },
  { value: 'DIFFICULT_DAY', label: 'Día difícil', emoji: '🟠' },
  { value: 'NEED_TO_TALK', label: 'Necesito hablar', emoji: '🔴' },
  { value: 'HERE_FOR_SOMEONE', label: 'Estoy acá para alguien', emoji: '💜' },
];

export default function StatusPicker({ onSet }: { onSet: (status: Status) => void }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSelect(mood: StatusMood) {
    setSubmitting(true);
    try {
      const status = await setStatus(mood);
      onSet(status);
    } catch {
      // Silencioso a proposito, mismo criterio que el resto de la app.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6 border-l-2 border-mist bg-white p-4">
      <p className="mb-3 text-sm font-medium text-dusk">¿Cómo estás hoy?</p>
      <div className="flex flex-wrap gap-2">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => handleSelect(mood.value)}
            disabled={submitting}
            className="rounded-full border border-mist px-3 py-1.5 text-sm text-ink transition-colors hover:border-horizon disabled:opacity-60"
          >
            {mood.emoji} {mood.label}
          </button>
        ))}
      </div>
    </div>
  );
}