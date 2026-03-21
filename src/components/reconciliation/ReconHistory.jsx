import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';

export default function ReconHistory() {
  const recons = useLiveQuery(() => db.reconciliations.reverse().toArray());

  if (!recons) return null;

  const completed = recons.filter((r) => r.status === 'completed');

  if (completed.length === 0) {
    return <p className="text-on-surface-variant/40 text-sm text-center py-4">No past reconciliations.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-headline font-bold text-lg text-on-surface">Past Sessions</h3>
      {completed.map((r) => (
        <div key={r.id} className="bg-surface-container-low rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-on-surface">Reconciliation Complete</p>
            <p className="text-[10px] text-on-surface-variant">
              {new Date(r.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
