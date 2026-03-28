import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import ItemCard from './ItemCard';

const filters = ['all', 'gold', 'silver', 'platinum', 'stones', 'others'];

export default function ItemList() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const items = useLiveQuery(() => {
    let col = db.items.where('status').notEqual('sold');
    return col.toArray();
  });

  if (!items) return null;

  const filtered = items.filter((item) => {
    if (filter !== 'all' && item.metalType !== filter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface/30 focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all duration-300"
          placeholder="Search the vault..."
        />
      </div>

      <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/10'
                : 'bg-surface-container-high text-on-surface/70 border border-outline-variant/10 hover:bg-surface-container-highest'
            }`}
          >
            {f === 'all' ? 'All Assets' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">inventory_2</span>
          <p className="text-on-surface-variant/40 font-headline font-bold text-lg">No assets found</p>
          <p className="text-on-surface-variant/30 text-sm mt-2">Register your first heritage item</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
