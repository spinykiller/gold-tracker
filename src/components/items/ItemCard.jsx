import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { blobToUrl } from '../../lib/photos';
import Badge from '../common/Badge';

import { useRef } from 'react';

export default function ItemCard({ item }) {
  const [thumbUrl, setThumbUrl] = useState(null);
  const urlRef = useRef(null);
  const firstPhoto = useLiveQuery(
    () => db.itemPhotos.where('itemId').equals(item.id).first(),
    [item.id]
  );

  useEffect(() => {
    // Revoke old URL before creating new one
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }

    const blob = firstPhoto?.thumb || firstPhoto?.photo;
    if (blob) {
      const url = blobToUrl(blob);
      urlRef.current = url;
      setThumbUrl(url);
    } else {
      setThumbUrl(null);
    }

    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [firstPhoto?.id, firstPhoto?.photo, firstPhoto?.thumb]);

  const weightColor = {
    gold: 'text-primary-fixed-dim',
    silver: 'text-secondary',
    platinum: 'text-tertiary',
    stones: 'text-purple-400',
    others: 'text-on-surface',
  };

  const totalCarats = (item.stones || []).reduce((s, st) => s + (st.weightCarat || 0), 0);
  const stoneCount = (item.stones || []).length;

  return (
    <Link
      to={`/items/${item.id}`}
      className="group relative rounded-xl bg-surface-container-low overflow-hidden hover:shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition-all duration-500 block"
    >
      <div className="aspect-square bg-surface-bright overflow-hidden relative">
        {thumbUrl ? (
          <img src={thumbUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl">diamond</span>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge type={item.metalType} />
        </div>
      </div>
      <div className="p-5 flex justify-between items-end">
        <div>
          <h3 className="font-headline font-bold text-on-surface text-lg">{item.name}</h3>
          <p className="text-on-surface/50 text-xs font-medium uppercase tracking-widest mt-1">
            {item.status || 'active'}
          </p>
        </div>
        {item.metalType === 'stones' ? (
          stoneCount > 0 && (
            <span className={`${weightColor[item.metalType] || 'text-purple-400'} font-headline font-bold text-xl`}>
              {stoneCount} {stoneCount === 1 ? 'stone' : 'stones'}
            </span>
          )
        ) : item.weightGrams ? (
          <span className={`${weightColor[item.metalType] || 'text-primary-fixed-dim'} font-headline font-bold text-xl`}>
            {item.weightGrams}g
          </span>
        ) : null}
      </div>
    </Link>
  );
}
