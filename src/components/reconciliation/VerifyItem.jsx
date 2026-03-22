import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { blobToUrl } from '../../lib/photos';
import Badge from '../common/Badge';

export default function VerifyItem({ item, reconId, memberId }) {
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const firstPhoto = useLiveQuery(
    () => db.itemPhotos.where('itemId').equals(item.id).first(),
    [item.id]
  );

  useEffect(() => {
    const blob = firstPhoto?.thumb || firstPhoto?.photo;
    if (blob) {
      const url = blobToUrl(blob);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPhotoUrl(null);
  }, [firstPhoto]);

  const verify = async (isVerified) => {
    const now = new Date().toISOString();
    await db.verifications.add({
      reconciliationId: reconId,
      itemId: item.id,
      verifiedBy: memberId,
      verifiedAt: now,
      isVerified,
      comment: comment.trim() || null,
    });
    await db.logs.add({
      itemId: item.id,
      action: 'verified',
      performedBy: memberId,
      details: { isVerified, comment: comment.trim() || null, reconciliationId: reconId },
      createdAt: now,
    });
    if (!isVerified) {
      await db.items.update(item.id, { status: 'missing' });
      await db.logs.add({
        itemId: item.id,
        action: 'status_changed',
        performedBy: memberId,
        details: { oldStatus: item.status, newStatus: 'missing' },
        createdAt: now,
      });
    }
    setComment('');
  };

  return (
    <div className="bg-surface-container-low rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="aspect-square w-full rounded-xl bg-surface-bright mb-6 overflow-hidden relative border border-outline-variant/10">
        {photoUrl ? (
          <img src={photoUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-8xl">diamond</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-headline font-bold text-2xl text-on-surface">{item.name}</h3>
            <p className="text-on-surface-variant text-sm font-medium">
              {item.weightGrams ? `${item.weightGrams}g` : ''} {item.purity || ''} {item.metalType}
            </p>
          </div>
          <Badge type={item.metalType} />
        </div>

        <div className="pt-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">Optional Observation</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-surface-container-high border-none rounded-xl text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary-container/50 transition-all p-4 text-sm focus:outline-none"
              placeholder="Add a comment before verifying..."
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <button
          onClick={() => verify(false)}
          className="flex flex-col items-center justify-center gap-3 bg-surface-container-high hover:bg-surface-container-highest transition-all duration-300 py-6 rounded-2xl border border-outline-variant/5"
        >
          <div className="w-12 h-12 rounded-full bg-error-container/20 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-3xl">report</span>
          </div>
          <span className="font-headline font-bold text-sm tracking-tight text-on-surface">Flag / Problem</span>
        </button>
        <button
          onClick={() => verify(true)}
          className="flex flex-col items-center justify-center gap-3 py-6 rounded-2xl active:scale-95 duration-500 ease-out shadow-[0_10px_30px_-10px_rgba(212,175,55,0.4)]"
          style={{background: 'linear-gradient(135deg, #f2ca50 0%, #d4af37 100%)'}}
        >
          <div className="w-12 h-12 rounded-full bg-[#3c2f00]/10 flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
          </div>
          <span className="font-headline font-bold text-sm tracking-tight text-on-primary">Verified</span>
        </button>
      </div>
    </div>
  );
}
