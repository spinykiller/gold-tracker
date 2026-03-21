import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

export function useReconciliation() {
  const activeRecon = useLiveQuery(
    () => db.reconciliations.where('status').equals('active').first()
  );

  const schedule = useLiveQuery(() => db.schedules.toCollection().first());

  const startReconciliation = async (memberId) => {
    const id = await db.reconciliations.add({
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'active',
      startedBy: memberId,
    });
    return id;
  };

  const completeReconciliation = async (reconId) => {
    await db.reconciliations.update(reconId, {
      completedAt: new Date().toISOString(),
      status: 'completed',
    });
    const schedule = await db.schedules.toCollection().first();
    if (schedule) {
      const next = new Date(schedule.nextDueAt);
      const freq = schedule.frequency;
      if (freq === 'weekly') next.setDate(next.getDate() + 7);
      else if (freq === 'monthly') next.setMonth(next.getMonth() + 1);
      else if (freq === 'quarterly') next.setMonth(next.getMonth() + 3);
      else if (freq === 'yearly') next.setFullYear(next.getFullYear() + 1);
      await db.schedules.update(schedule.id, { nextDueAt: next.toISOString() });
    }
  };

  return { activeRecon, schedule, startReconciliation, completeReconciliation };
}
