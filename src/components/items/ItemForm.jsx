import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/db';
import { compressImage, createThumbnail } from '../../lib/photos';
import PhotoCapture from '../common/PhotoCapture';

export default function ItemForm({ memberId }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [metalType, setMetalType] = useState('gold');
  const [weightGrams, setWeightGrams] = useState('');
  const [purity, setPurity] = useState('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhoto = async (file) => {
    setPhotoFile(file);
    const compressed = await compressImage(file);
    setPhotoBlob(compressed);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    let photo = null, photoThumb = null;
    if (photoFile) {
      photo = await compressImage(photoFile);
      photoThumb = await createThumbnail(photoFile);
    }

    const now = new Date().toISOString();
    const itemId = await db.items.add({
      name: name.trim(),
      metalType,
      weightGrams: weightGrams ? parseFloat(weightGrams) : null,
      purity: purity.trim() || null,
      description: description.trim() || null,
      photo,
      photoThumb,
      registeredBy: memberId,
      registeredAt: now,
      status: 'active',
    });

    await db.logs.add({
      itemId,
      action: 'registered',
      performedBy: memberId,
      details: { name: name.trim(), metalType },
      createdAt: now,
    });

    navigate(`/items/${itemId}`);
  };

  const metalTypes = ['gold', 'silver', 'platinum'];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <PhotoCapture value={photoBlob} onChange={handlePhoto} />

      <div>
        <label className="block font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-3">Item Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Wedding Necklace"
          className="w-full bg-transparent border-b border-outline-variant py-4 text-xl font-headline placeholder:text-on-surface/20 focus:outline-none focus:border-primary transition-colors duration-300"
          required
        />
      </div>

      <div>
        <label className="block font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-4">Metal Type</label>
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-surface-container-low rounded-xl">
          {metalTypes.map((mt) => (
            <button
              key={mt}
              type="button"
              onClick={() => setMetalType(mt)}
              className={`py-3 px-4 rounded-lg font-headline font-bold text-xs uppercase tracking-widest transition-all ${
                metalType === mt
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'hover:bg-surface-container-high text-on-surface/60'
              }`}
            >
              {mt}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <label className="block font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-3">Weight (Grams)</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent border-b border-outline-variant py-4 text-xl font-headline placeholder:text-on-surface/20 focus:outline-none focus:border-primary transition-colors duration-300 pr-10"
            />
            <span className="absolute right-0 bottom-4 text-on-surface-variant font-headline text-sm font-bold">G</span>
          </div>
        </div>
        <div>
          <label className="block font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-3">Purity</label>
          <input
            type="text"
            value={purity}
            onChange={(e) => setPurity(e.target.value)}
            placeholder="24K / 999"
            className="w-full bg-transparent border-b border-outline-variant py-4 text-xl font-headline placeholder:text-on-surface/20 focus:outline-none focus:border-primary transition-colors duration-300"
          />
        </div>
      </div>

      <div>
        <label className="block font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-3">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes on lineage, purchase date, or unique hallmarks..."
          rows={3}
          className="w-full bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/20 text-on-surface placeholder:text-on-surface/20 focus:outline-none focus:border-primary/40 transition-all duration-300 resize-none"
        />
      </div>

      <div className="pt-6">
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full h-16 gold-button-gradient text-on-primary font-headline font-black uppercase tracking-[0.3em] text-sm rounded-xl shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
          {submitting ? 'Registering...' : 'Register Asset'}
        </button>
      </div>
    </form>
  );
}
