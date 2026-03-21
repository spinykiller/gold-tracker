import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';

const frequencies = ['weekly', 'monthly', 'quarterly', 'yearly'];

export default function ScheduleForm({ memberId }) {
  const schedule = useLiveQuery(() => db.schedules.toCollection().first());
  const [freq, setFreq] = useState('monthly');

  const handleSave = async () => {
    const next = new Date();
    if (freq === 'weekly') next.setDate(next.getDate() + 7);
    else if (freq === 'monthly') next.setMonth(next.getMonth() + 1);
    else if (freq === 'quarterly') next.setMonth(next.getMonth() + 3);
    else if (freq === 'yearly') next.setFullYear(next.getFullYear() + 1);

    if (schedule) {
      await db.schedules.update(schedule.id, { frequency: freq, nextDueAt: next.toISOString() });
    } else {
      await db.schedules.add({ frequency: freq, nextDueAt: next.toISOString(), createdBy: memberId });
    }
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-8">
      <div className="flex justify-between items-start mb-12">
        <span className="material-symbols-outlined text-primary-container text-4xl">event_repeat</span>
        <div className="bg-surface-container-high px-3 py-1 rounded-full">
          <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">System Task</span>
        </div>
      </div>
      <h3 className="font-headline text-2xl font-bold mb-2">Reconciliation Schedule</h3>
      <p className="text-on-surface-variant text-sm mb-8">Set how often items should be verified.</p>

      <div className="space-y-4">
        {frequencies.map((f) => (
          <button
            key={f}
            onClick={() => { setFreq(f); }}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${
              (schedule?.frequency || freq) === f
                ? 'bg-primary/10 border border-primary/20'
                : 'bg-surface-container-highest/30 border border-outline-variant/15 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <span className="font-medium capitalize">{f} Audit</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        ))}
        <button
          onClick={handleSave}
          className="w-full mt-4 bg-primary text-on-primary font-headline font-bold py-3 rounded-lg active:scale-95 transition-all"
        >
          Save Schedule
        </button>
        {schedule && (
          <p className="text-[10px] text-primary/60 uppercase tracking-widest font-bold mt-2">
            Next trigger: {new Date(schedule.nextDueAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  );
}
