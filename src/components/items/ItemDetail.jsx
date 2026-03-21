import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { blobToUrl } from '../../lib/photos';
import Badge from '../common/Badge';
import Timeline from '../common/Timeline';

export default function ItemDetail({ memberId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const itemId = Number(id);
  const item = useLiveQuery(() => db.items.get(itemId), [itemId]);
  const members = useLiveQuery(() => db.members.toArray());
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    if (item?.photo) {
      const url = blobToUrl(item.photo);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [item?.photo]);

  if (!item || !members) return null;

  const registeredBy = members.find((m) => m.id === item.registeredBy);

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

  return (
    <main className="max-w-4xl mx-auto pb-32">
      <section className="relative w-full aspect-[16/9] overflow-hidden">
        {photoUrl ? (
          <img src={photoUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface-bright flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-8xl">diamond</span>
          </div>
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-8" style={{background: 'linear-gradient(180deg, rgba(19,19,19,0) 0%, rgba(19,19,19,0.9) 80%, rgba(19,19,19,1) 100%)'}}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-primary-container/20 text-primary-fixed-dim px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase border border-primary-container/30 backdrop-blur-sm">
              {item.status}
            </span>
          </div>
          <h1 className="text-4xl font-headline font-extrabold text-on-background tracking-tighter mb-2">{item.name}</h1>
          <p className="text-primary-fixed-dim text-lg font-headline font-semibold">
            {item.weightGrams ? `${item.weightGrams}g` : ''} {item.purity ? `\u2022 ${item.purity}` : ''} {item.metalType ? `${item.metalType.charAt(0).toUpperCase() + item.metalType.slice(1)}` : ''}
          </p>
        </div>
      </section>

      <div className="px-6 -mt-6 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8">
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
                onClick={() => navigate(`/reconcile`)}
                className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-lg flex items-center justify-center gap-3 hover:brightness-110 transition-all active:scale-95 shadow-[0_10px_30px_rgba(242,202,80,0.2)]"
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
