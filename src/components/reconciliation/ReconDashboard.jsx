import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { useReconciliation } from '../../hooks/useReconciliation';
import VerifyItem from './VerifyItem';

export default function ReconDashboard({ memberId }) {
  const { activeRecon, schedule, startReconciliation, completeReconciliation } = useReconciliation();
  const items = useLiveQuery(() => db.items.where('status').equals('active').toArray());
  const verifications = useLiveQuery(
    () => activeRecon ? db.verifications.where('reconciliationId').equals(activeRecon.id).toArray() : [],
    [activeRecon?.id]
  );

  if (!items) return null;

  const totalItems = items.length;
  const verifiedCount = verifications?.length || 0;
  const progress = totalItems > 0 ? (verifiedCount / totalItems) * 100 : 0;
  const isComplete = verifiedCount >= totalItems && totalItems > 0;

  const unverifiedItems = activeRecon
    ? items.filter((item) => !verifications?.find((v) => v.itemId === item.id))
    : [];

  const currentItem = unverifiedItems[0] || null;

  return (
    <div className="space-y-8">
      {!activeRecon ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container text-4xl">assignment_turned_in</span>
          </div>
          <h2 className="font-headline font-bold text-2xl text-on-surface mb-2">No Active Reconciliation</h2>
          <p className="text-on-surface-variant text-sm mb-8">Start a new session to verify all items in the vault.</p>
          {totalItems > 0 ? (
            <button
              onClick={() => startReconciliation(memberId)}
              className="gold-button-gradient text-on-primary font-headline font-bold py-4 px-8 rounded-xl shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-500"
            >
              Start Reconciliation ({totalItems} items)
            </button>
          ) : (
            <p className="text-on-surface-variant/40 text-sm">Add items first before reconciling.</p>
          )}
          {schedule && (
            <div className="mt-8 bg-surface-container-high rounded-xl p-5 border-l-4 border-primary-container inline-flex items-center gap-4">
              <span className="material-symbols-outlined text-primary-container">event_repeat</span>
              <div className="text-left">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Next Due</p>
                <p className="font-headline font-semibold text-on-surface">
                  {new Date(schedule.nextDueAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-end mb-4">
              <div className="space-y-1">
                <p className="text-on-surface-variant text-xs uppercase tracking-widest">Reconciliation Phase</p>
                <h2 className="font-headline font-extrabold text-3xl text-on-surface">
                  Item {Math.min(verifiedCount + 1, totalItems)} of {totalItems}
                </h2>
              </div>
              <div className="text-primary-fixed-dim font-headline font-bold text-lg">{progress.toFixed(1)}%</div>
            </div>
            <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
              <div className="h-full bg-primary-container rounded-full transition-all duration-500" style={{width: `${progress}%`}} />
            </div>
          </div>

          {isComplete ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
              </div>
              <h3 className="font-headline font-bold text-2xl text-on-surface mb-2">All Items Verified</h3>
              <button
                onClick={() => completeReconciliation(activeRecon.id)}
                className="mt-6 gold-button-gradient text-on-primary font-headline font-bold py-4 px-8 rounded-xl shadow-[0_10px_30px_rgba(212,175,55,0.3)] active:scale-95 transition-all"
              >
                Complete Reconciliation
              </button>
            </div>
          ) : currentItem ? (
            <VerifyItem item={currentItem} reconId={activeRecon.id} memberId={memberId} />
          ) : null}
        </div>
      )}
    </div>
  );
}
