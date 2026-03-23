import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useReconciliation } from '../hooks/useReconciliation';
import { useNavigate } from 'react-router-dom';

export default function Home({ memberId }) {
  const navigate = useNavigate();
  const items = useLiveQuery(() => db.items.toArray());
  const logs = useLiveQuery(() => db.logs.orderBy('createdAt').reverse().limit(5).toArray());
  const members = useLiveQuery(() => db.members.toArray());
  const pendingDeletes = useLiveQuery(() => db.deleteRequests.where('status').equals('pending').toArray());
  const { schedule } = useReconciliation();

  if (!items || !logs || !members || !pendingDeletes) return null;

  const activeItems = items.filter((i) => i.status === 'active');
  const missingItems = items.filter((i) => i.status === 'missing');
  const goldWeight = activeItems.filter((i) => i.metalType === 'gold').reduce((s, i) => s + (i.weightGrams || 0), 0);
  const silverWeight = activeItems.filter((i) => i.metalType === 'silver').reduce((s, i) => s + (i.weightGrams || 0), 0);
  const platinumWeight = activeItems.filter((i) => i.metalType === 'platinum').reduce((s, i) => s + (i.weightGrams || 0), 0);

  // Aggregate stones across all active items
  const allStones = activeItems.flatMap((i) => i.stones || []);
  const diamondStones = allStones.filter((s) => s.type === 'diamond');
  const preciousStones = allStones.filter((s) => s.type === 'precious');
  const semiPreciousStones = allStones.filter((s) => s.type === 'semiprecious');
  const artificialStones = allStones.filter((s) => s.type === 'artificial');
  const diamondCarats = diamondStones.reduce((s, st) => s + (st.weightCarat || 0), 0);
  const preciousCarats = preciousStones.reduce((s, st) => s + (st.weightCarat || 0), 0);
  const semiPreciousCarats = semiPreciousStones.reduce((s, st) => s + (st.weightCarat || 0), 0);
  const artificialCarats = artificialStones.reduce((s, st) => s + (st.weightCarat || 0), 0);
  const getMember = (id) => members.find((m) => m.id === id);

  const actionLabels = {
    registered: 'Registered',
    verified: 'Verified',
    photo_updated: 'Photo Updated',
    status_changed: 'Status Changed',
    comment_updated: 'Comment Updated',
    edited: 'Edited',
    delete_requested: 'Delete Requested',
    delete_cancelled: 'Delete Cancelled',
    deleted: 'Deleted',
  };

  return (
    <main className="max-w-md mx-auto px-6 pt-8 space-y-10 pb-8">
      <section>
        <p className="text-on-surface-variant text-sm uppercase tracking-widest mb-1">Vault Access Granted</p>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface">
          Welcome back{memberId ? `, ${getMember(memberId)?.name || ''}` : ''}
        </h1>
      </section>

      <section>
        <div className="bg-surface-container-low rounded-3xl p-6 vault-gradient overflow-hidden relative border-l border-t border-white/5">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-container mb-1">Heritage Collection</p>
              <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">
                {activeItems.length}<span className="text-lg font-medium text-on-surface-variant ml-2">items</span>
              </h2>
            </div>
            <div className="bg-primary-container/10 p-2 rounded-xl">
              <span className="material-symbols-outlined text-primary-container text-3xl">account_balance_wallet</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-container-highest/30 backdrop-blur-sm rounded-xl p-4 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">Gold Reserve</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-headline text-primary">{goldWeight.toFixed(1)}</span>
                <span className="text-xs font-medium text-on-surface-variant">g</span>
              </div>
            </div>
            <div className="bg-surface-container-highest/30 backdrop-blur-sm rounded-xl p-4 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">Silver Reserve</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-headline text-secondary">{silverWeight.toFixed(1)}</span>
                <span className="text-xs font-medium text-on-surface-variant">g</span>
              </div>
            </div>
            <div className="bg-surface-container-highest/30 backdrop-blur-sm rounded-xl p-4 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">Platinum Reserve</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-headline text-tertiary">{platinumWeight.toFixed(1)}</span>
                <span className="text-xs font-medium text-on-surface-variant">g</span>
              </div>
            </div>
          </div>
          {(diamondStones.length > 0 || preciousStones.length > 0 || semiPreciousStones.length > 0 || artificialStones.length > 0) && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-surface-container-highest/30 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-on-surface-variant mb-1">Diamonds</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-headline text-on-surface">{diamondStones.length}</span>
                  <span className="text-[10px] text-on-surface-variant">pcs</span>
                </div>
                {diamondCarats > 0 && <p className="text-[10px] text-on-surface-variant mt-0.5">{diamondCarats.toFixed(2)} ct</p>}
              </div>
              <div className="bg-surface-container-highest/30 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-on-surface-variant mb-1">Precious</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-headline text-on-surface">{preciousStones.length}</span>
                  <span className="text-[10px] text-on-surface-variant">pcs</span>
                </div>
                {preciousCarats > 0 && <p className="text-[10px] text-on-surface-variant mt-0.5">{preciousCarats.toFixed(2)} ct</p>}
              </div>
              <div className="bg-surface-container-highest/30 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-on-surface-variant mb-1">Semi-Precious</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-headline text-on-surface">{semiPreciousStones.length}</span>
                  <span className="text-[10px] text-on-surface-variant">pcs</span>
                </div>
                {semiPreciousCarats > 0 && <p className="text-[10px] text-on-surface-variant mt-0.5">{semiPreciousCarats.toFixed(2)} ct</p>}
              </div>
              <div className="bg-surface-container-highest/30 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-on-surface-variant mb-1">Artificial</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-headline text-on-surface">{artificialStones.length}</span>
                  <span className="text-[10px] text-on-surface-variant">pcs</span>
                </div>
                {artificialCarats > 0 && <p className="text-[10px] text-on-surface-variant mt-0.5">{artificialCarats.toFixed(2)} ct</p>}
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">inventory_2</span>
              <span className="text-xs font-medium text-on-surface-variant">{activeItems.length} Active Items</span>
            </div>
          </div>
        </div>
      </section>

      {missingItems.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-error">warning</span>
            Missing Items ({missingItems.length})
          </h3>
          {missingItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/items/${item.id}`)}
              className="w-full bg-error/5 rounded-xl p-4 flex items-center gap-4 border border-error/20 text-left hover:bg-error/10 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-error">search_off</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-on-surface">{item.name}</p>
                <p className="text-[10px] text-on-surface-variant">
                  {item.weightGrams ? `${item.weightGrams}g` : ''} {item.metalType ? item.metalType.charAt(0).toUpperCase() + item.metalType.slice(1) : ''} -- flagged during reconciliation
                </p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
            </button>
          ))}
        </section>
      )}

      {schedule && (
        <section>
          <button
            onClick={() => navigate('/reconcile')}
            className="w-full bg-surface-container-high rounded-xl p-5 border-l-4 border-primary-container flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-container">event_repeat</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Next Reconciliation Due</p>
                <p className="font-headline font-semibold text-on-surface">
                  {new Date(schedule.nextDueAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
          </button>
        </section>
      )}

      {pendingDeletes.filter(d => d.requestedBy !== memberId).length > 0 && (
        <section className="space-y-4">
          <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-error">delete_sweep</span>
            Pending Deletions
          </h3>
          {pendingDeletes.filter(d => d.requestedBy !== memberId).map((req) => {
            const reqItem = items.find(i => i.id === req.itemId);
            if (!reqItem) return null;
            return (
              <button
                key={req.id}
                onClick={() => navigate(`/items/${req.itemId}`)}
                className="w-full bg-error/5 rounded-xl p-4 flex items-center gap-4 border border-error/20 text-left hover:bg-error/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-error">delete</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">{reqItem.name}</p>
                  <p className="text-[10px] text-on-surface-variant">
                    {getMember(req.requestedBy)?.name || 'Unknown'} requested deletion -- tap to review
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
              </button>
            );
          })}
        </section>
      )}

      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h3 className="font-headline font-bold text-xl text-on-surface">Audit Logs</h3>
          <span className="text-xs font-bold text-primary-container uppercase tracking-widest cursor-pointer">View All</span>
        </div>
        <div className="space-y-4">
          {logs.length === 0 && (
            <p className="text-on-surface-variant/40 text-sm text-center py-8">No activity yet. Register your first item.</p>
          )}
          {logs.map((log) => {
            const member = getMember(log.performedBy);
            return (
              <div key={log.id} className="bg-surface-container-low rounded-xl p-4 flex items-center gap-4 hover:bg-surface-container-high transition-colors">
                <div className="w-12 h-12 rounded-lg bg-surface-bright flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant/40">
                    {log.action === 'verified' ? 'assignment_turned_in' : log.action === 'registered' ? 'add_circle' : 'sync_alt'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">
                    {actionLabels[log.action] || log.action}: {log.details?.name || `Item #${log.itemId}`}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    {member?.name || 'Unknown'} &bull; {new Date(log.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
