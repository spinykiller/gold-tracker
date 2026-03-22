import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { blobToUrl } from '../../lib/photos';
import Badge from '../common/Badge';
import Timeline from '../common/Timeline';

function PhotoGallery({ photos }) {
  const [active, setActive] = useState(0);
  const [urls, setUrls] = useState([]);
  const touchRef = useRef({ startX: 0, startY: 0 });

  useEffect(() => {
    const newUrls = photos.map((p) => blobToUrl(p.photo));
    setUrls(newUrls);
    return () => newUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const goNext = useCallback(() => setActive((a) => (a + 1) % photos.length), [photos.length]);
  const goPrev = useCallback(() => setActive((a) => (a - 1 + photos.length) % photos.length), [photos.length]);

  const handleTouchStart = (e) => {
    touchRef.current.startX = e.touches[0].clientX;
    touchRef.current.startY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    // Only swipe if horizontal movement > 50px and greater than vertical
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  if (!photos.length || !urls.length) {
    return (
      <div className="w-full aspect-square md:aspect-[16/9] bg-surface-bright flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface-variant/20 text-8xl">diamond</span>
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-square md:aspect-[16/9]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img src={urls[active]} alt="" className="w-full h-full object-cover" />
      {photos.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-white text-xl">chevron_left</span>
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-white text-xl">chevron_right</span>
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all ${i === active ? 'bg-white w-6' : 'bg-white/50 w-2'}`}
              />
            ))}
          </div>
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-xs font-bold">{active + 1} / {photos.length}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function ItemDetail({ memberId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const itemId = Number(id);
  const item = useLiveQuery(() => db.items.get(itemId), [itemId]);
  const photos = useLiveQuery(() => db.itemPhotos.where('itemId').equals(itemId).sortBy('order'), [itemId]);
  const members = useLiveQuery(() => db.members.toArray());
  const pendingDelete = useLiveQuery(
    () => db.deleteRequests.where({ itemId, status: 'pending' }).first(),
    [itemId]
  );

  if (!item || !members || !photos) return null;

  const registeredBy = members.find((m) => m.id === item.registeredBy);
  const getMember = (id) => members.find((m) => m.id === id);

  const handleStatusChange = async (newStatus) => {
    const oldStatus = item.status;
    await db.items.update(itemId, { status: newStatus });
    await db.logs.add({
      itemId,
      action: 'status_changed',
      performedBy: memberId,
      details: { oldStatus, newStatus },
      createdAt: new Date().toISOString(),
    });
  };

  const handleRequestDelete = async () => {
    if (!window.confirm(`Request deletion of "${item.name}"? Another family member must approve.`)) return;
    const now = new Date().toISOString();
    await db.deleteRequests.add({
      itemId,
      requestedBy: memberId,
      status: 'pending',
      requestedAt: now,
      approvals: [],
    });
    await db.logs.add({
      itemId,
      action: 'delete_requested',
      performedBy: memberId,
      details: { name: item.name },
      createdAt: now,
    });
  };

  const handleApproveDelete = async () => {
    if (!pendingDelete) return;
    const now = new Date().toISOString();
    // Add this member's approval
    const approvals = [...(pendingDelete.approvals || []), memberId];
    await db.deleteRequests.update(pendingDelete.id, { approvals });

    // 1 approval from a different member is enough
    if (approvals.length >= 1) {
      await db.deleteRequests.update(pendingDelete.id, { status: 'approved' });
      await db.items.delete(itemId);
      await db.itemPhotos.where('itemId').equals(itemId).delete();
      await db.logs.add({
        itemId,
        action: 'deleted',
        performedBy: memberId,
        details: { name: item.name, approvedBy: memberId },
        createdAt: now,
      });
      navigate('/items');
    }
  };

  const handleCancelDelete = async () => {
    if (!pendingDelete) return;
    await db.deleteRequests.update(pendingDelete.id, { status: 'cancelled' });
    await db.logs.add({
      itemId,
      action: 'delete_cancelled',
      performedBy: memberId,
      details: { name: item.name },
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <main className="max-w-4xl mx-auto pb-32">
      <section>
        <PhotoGallery photos={photos} />
      </section>

      <section className="px-6 pt-6 pb-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="bg-primary-container/20 text-primary-fixed-dim px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase border border-primary-container/30">
            {item.status}
          </span>
        </div>
        <h1 className="text-4xl font-headline font-extrabold text-on-background tracking-tighter mb-2">{item.name}</h1>
        <p className="text-primary-fixed-dim text-lg font-headline font-semibold">
          {item.weightGrams ? `${item.weightGrams}g` : ''} {item.purity ? `\u2022 ${item.purity}` : ''} {item.metalType ? `${item.metalType.charAt(0).toUpperCase() + item.metalType.slice(1)}` : ''}
        </p>
      </section>

      <div className="px-6 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 space-y-8">
          <div className="bg-surface-container-low rounded-xl p-8 shadow-2xl">
            <h2 className="text-primary-container font-headline font-bold uppercase tracking-widest text-xs mb-6">Asset Specification</h2>
            <div className="space-y-6">
              {item.description && (
                <div>
                  <p className="text-on-surface-variant text-sm mb-2 font-medium">Description</p>
                  <p className="text-on-surface text-lg leading-relaxed">{item.description}</p>
                </div>
              )}
              {item.stones && item.stones.length > 0 && (
                <div className="pt-6 border-t border-outline-variant/10 space-y-4">
                  <p className="text-on-surface-variant text-sm font-medium">Stones ({item.stones.length})</p>
                  {item.stones.map((stone, i) => (
                    <div key={i} className="bg-surface-container-lowest rounded-lg p-4 border border-outline-variant/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-on-surface font-semibold">{stone.name || stone.type}</span>
                        <span className="text-[10px] uppercase tracking-wider text-primary-container font-bold bg-primary-container/10 px-2 py-0.5 rounded-full">
                          {stone.type === 'semiprecious' ? 'Semi-Precious' : stone.type === 'artificial' ? 'Artificial' : stone.type?.charAt(0).toUpperCase() + stone.type?.slice(1)}
                        </span>
                      </div>
                      <div className="flex gap-6 text-sm">
                        {stone.weightCarat != null && (
                          <span className="text-on-surface-variant">{stone.weightCarat} ct</span>
                        )}
                        {stone.price != null && (
                          <span className="text-on-surface-variant">₹{stone.price.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {item.metalPrice != null && (
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-outline-variant/10">
                  <div>
                    <p className="text-on-surface-variant text-sm mb-1 font-medium">Metal Price</p>
                    <p className="text-on-surface font-semibold">₹{item.metalPrice.toLocaleString('en-IN')}</p>
                  </div>
                  {item.stones && item.stones.length > 0 && (
                    <div>
                      <p className="text-on-surface-variant text-sm mb-1 font-medium">Total Stone Price</p>
                      <p className="text-on-surface font-semibold">₹{item.stones.reduce((s, st) => s + (st.price || 0), 0).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-outline-variant/10">
                <div>
                  <p className="text-on-surface-variant text-sm mb-1 font-medium">Registered by</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-container/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {registeredBy?.avatar || '?'}
                    </div>
                    <span className="text-on-surface font-semibold">{registeredBy?.name || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-on-surface-variant text-sm mb-1 font-medium">Registered at</p>
                  <p className="text-on-surface font-semibold">
                    {new Date(item.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-8 shadow-2xl">
            <h2 className="text-primary-container font-headline font-bold uppercase tracking-widest text-xs mb-8">Verification History</h2>
            <Timeline itemId={itemId} />
          </div>
        </div>

        <div className="md:col-span-5 space-y-6">
          <div className="bg-surface-container-high rounded-xl p-6 border border-outline-variant/10 shadow-xl md:sticky md:top-24">
            <h3 className="text-on-surface font-headline font-bold text-lg mb-6">Manage Asset</h3>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => navigate(`/items/${itemId}/edit`)}
                className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-lg flex items-center justify-center gap-3 hover:brightness-110 transition-all active:scale-95 shadow-[0_10px_30px_rgba(242,202,80,0.2)]"
              >
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>edit</span>
                Edit Details
              </button>
              <button
                onClick={() => navigate(`/reconcile`)}
                className="w-full bg-surface-container-highest text-on-surface font-headline font-semibold py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-surface-bright transition-all active:scale-95 border border-outline-variant/30"
              >
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>verified_user</span>
                Verify Now
              </button>
              {item.status === 'active' && (
                <button
                  onClick={() => handleStatusChange('missing')}
                  className="w-full bg-surface-container-highest text-on-surface font-headline font-semibold py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-surface-bright transition-all active:scale-95 border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined">flag</span>
                  Flag as Missing
                </button>
              )}
              {item.status === 'missing' && (
                <button
                  onClick={() => handleStatusChange('active')}
                  className="w-full bg-surface-container-highest text-on-surface font-headline font-semibold py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-surface-bright transition-all active:scale-95 border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined">check</span>
                  Mark as Found
                </button>
              )}
              {!pendingDelete ? (
                <button
                  onClick={handleRequestDelete}
                  className="w-full bg-error/10 text-error font-headline font-semibold py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-error/20 transition-all active:scale-95 border border-error/20"
                >
                  <span className="material-symbols-outlined">delete</span>
                  Request Deletion
                </button>
              ) : (
                <div className="bg-error/5 rounded-xl p-5 border border-error/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-error text-lg">pending</span>
                    <p className="text-error font-headline font-bold text-sm">Deletion Pending Approval</p>
                  </div>
                  <p className="text-on-surface-variant text-xs">
                    Requested by <span className="font-bold text-on-surface">{getMember(pendingDelete.requestedBy)?.name || 'Unknown'}</span>
                  </p>
                  {pendingDelete.requestedBy === memberId ? (
                    <button
                      onClick={handleCancelDelete}
                      className="w-full bg-surface-container-highest text-on-surface font-headline font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-bright transition-all active:scale-95 border border-outline-variant/30 text-sm"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Cancel Request
                    </button>
                  ) : (
                    <button
                      onClick={handleApproveDelete}
                      className="w-full bg-error text-on-error font-headline font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 text-sm"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Approve Deletion
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
