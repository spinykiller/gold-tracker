import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/db';
import { compressImage, createThumbnail, blobToUrl } from '../../lib/photos';
import PhotoCapture from '../common/PhotoCapture';

const stoneTypeLabels = { diamond: 'Diamond', precious: 'Precious', semiprecious: 'Semi-Precious', artificial: 'Artificial' };

function emptyStone() {
  return { type: 'diamond', name: '', weightCarat: '', price: '' };
}

export default function ItemForm({ memberId, editItem, editPhotos }) {
  const navigate = useNavigate();
  const isEdit = !!editItem;

  const [name, setName] = useState('');
  const [hasMetal, setHasMetal] = useState(false);
  const [metalType, setMetalType] = useState('gold');
  const [weightGrams, setWeightGrams] = useState('');
  const [purity, setPurity] = useState('');
  const [description, setDescription] = useState('');
  const [metalPrice, setMetalPrice] = useState('');
  const [stones, setStones] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoBlobs, setPhotoBlobs] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (!editItem) return;
    setName(editItem.name || '');
    const hasMetalValue = editItem.metalType && editItem.metalType !== 'stones' && editItem.metalType !== 'others';
    setHasMetal(hasMetalValue || editItem.metalType === 'others');
    setMetalType(editItem.metalType || 'gold');
    setWeightGrams(editItem.weightGrams != null ? String(editItem.weightGrams) : '');
    setPurity(editItem.purity || '');
    setDescription(editItem.description || '');
    setMetalPrice(editItem.metalPrice != null ? String(editItem.metalPrice) : '');
    setStones(
      (editItem.stones || []).map(s => ({
        type: s.type || 'diamond',
        name: s.name || '',
        weightCarat: s.weightCarat != null ? String(s.weightCarat) : '',
        price: s.price != null ? String(s.price) : '',
      }))
    );
  }, [editItem]);

  // Load existing photos as blobs for edit mode
  useEffect(() => {
    if (!editPhotos || editPhotos.length === 0) return;
    const blobs = editPhotos.map(p => p.photo);
    setPhotoBlobs(blobs);
    setPhotoFiles(blobs);
  }, [editPhotos]);

  const handlePhotosChange = async (files) => {
    setPhotoFiles(files);
    const blobs = await Promise.all(files.map(f => f instanceof Blob && !f.type ? Promise.resolve(f) : compressImage(f)));
    setPhotoBlobs(blobs);
  };

  const addStone = () => setStones([...stones, emptyStone()]);

  const updateStone = (index, field, value) => {
    const updated = stones.map((s, i) => {
      if (i !== index) return s;
      if (field === 'type') return { ...s, type: value, name: '' };
      return { ...s, [field]: value };
    });
    setStones(updated);
  };

  const removeStone = (index) => setStones(stones.filter((_, i) => i !== index));

  const addMetal = () => {
    setHasMetal(true);
    setMetalType('gold');
  };

  const removeMetal = () => {
    setHasMetal(false);
    setMetalType('gold');
    setWeightGrams('');
    setPurity('');
    setMetalPrice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    const now = new Date().toISOString();
    const stonesData = stones.map(s => ({
      type: s.type,
      name: s.name || null,
      weightCarat: s.weightCarat ? parseFloat(s.weightCarat) : null,
      price: s.price ? parseFloat(s.price) : null,
    }));

    const itemData = {
      name: name.trim(),
      metalType: hasMetal ? metalType : (stones.length > 0 ? 'stones' : 'others'),
      weightGrams: hasMetal && weightGrams ? parseFloat(weightGrams) : null,
      purity: hasMetal ? (purity.trim() || null) : null,
      description: description.trim() || null,
      metalPrice: hasMetal && metalPrice ? parseFloat(metalPrice) : null,
      stones: stonesData,
    };

    if (isEdit) {
      // Update existing item
      await db.items.update(editItem.id, itemData);

      // Replace photos: delete old, add new
      await db.itemPhotos.where('itemId').equals(editItem.id).delete();
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const photo = file instanceof Blob && file.size && !file.type?.startsWith('image/') ? file : await compressImage(file);
        const thumb = await createThumbnail(file);
        await db.itemPhotos.add({ itemId: editItem.id, photo, thumb, order: i, createdAt: now });
      }

      await db.logs.add({
        itemId: editItem.id,
        action: 'edited',
        performedBy: memberId,
        details: { name: name.trim() },
        createdAt: now,
      });

      navigate(`/items/${editItem.id}`);
    } else {
      // Create new item
      const itemId = await db.items.add({
        ...itemData,
        registeredBy: memberId,
        registeredAt: now,
        status: 'active',
      });

      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const photo = await compressImage(file);
        const thumb = await createThumbnail(file);
        await db.itemPhotos.add({ itemId, photo, thumb, order: i, createdAt: now });
      }

      await db.logs.add({
        itemId,
        action: 'registered',
        performedBy: memberId,
        details: { name: name.trim(), metalType },
        createdAt: now,
      });

      navigate(`/items/${itemId}`);
    }
  };

  const metalTypes = ['gold', 'silver', 'platinum', 'others'];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <PhotoCapture values={photoBlobs} onChange={handlePhotosChange} />

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

      {/* Metal Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Metal</label>
          {!hasMetal && (
            <button
              type="button"
              onClick={addMetal}
              className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Metal
            </button>
          )}
        </div>

        {!hasMetal && (
          <p className="text-on-surface-variant/40 text-sm text-center py-4 bg-surface-container-low rounded-xl">No metal added. Tap "Add Metal" if this item has metal.</p>
        )}

        {hasMetal && (
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 relative">
            <button
              type="button"
              onClick={removeMetal}
              className="absolute top-3 right-3 w-7 h-7 bg-error/10 rounded-full flex items-center justify-center hover:bg-error/20 transition-colors"
            >
              <span className="material-symbols-outlined text-error text-sm">close</span>
            </button>

            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Metal Details</p>

            <div className="flex flex-wrap gap-2 p-1 bg-surface-container-lowest rounded-lg mb-4">
              {['gold', 'silver', 'platinum', 'others'].map((mt) => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => setMetalType(mt)}
                  className={`flex-1 min-w-[70px] py-2 px-2 rounded-md font-headline font-bold text-[10px] uppercase tracking-wider transition-all ${
                    metalType === mt
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'hover:bg-surface-container-high text-on-surface/60'
                  }`}
                >
                  {mt}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">Weight (Grams)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent border-b border-outline-variant py-2 text-sm font-headline placeholder:text-on-surface/20 focus:outline-none focus:border-primary transition-colors pr-8"
                  />
                  <span className="absolute right-0 bottom-2 text-on-surface-variant font-headline text-xs font-bold">G</span>
                </div>
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">Purity</label>
                <input
                  type="text"
                  value={purity}
                  onChange={(e) => setPurity(e.target.value)}
                  placeholder="24K / 999"
                  className="w-full bg-transparent border-b border-outline-variant py-2 text-sm font-headline placeholder:text-on-surface/20 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">Metal Price (₹)</label>
              <div className="relative">
                <span className="absolute left-0 bottom-2 text-on-surface-variant font-headline text-xs font-bold">₹</span>
                <input
                  type="number"
                  step="1"
                  value={metalPrice}
                  onChange={(e) => setMetalPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent border-b border-outline-variant py-2 text-sm font-headline placeholder:text-on-surface/20 focus:outline-none focus:border-primary transition-colors pl-5"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stones Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Stones</label>
          <button
            type="button"
            onClick={addStone}
            className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Stone
          </button>
        </div>

        {stones.length === 0 && (
          <p className="text-on-surface-variant/40 text-sm text-center py-4 bg-surface-container-low rounded-xl">No stones added. Tap "Add Stone" if this item has stones.</p>
        )}

        <div className="space-y-4">
          {stones.map((stone, i) => (
            <div key={i} className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 relative">
              <button
                type="button"
                onClick={() => removeStone(i)}
                className="absolute top-3 right-3 w-7 h-7 bg-error/10 rounded-full flex items-center justify-center hover:bg-error/20 transition-colors"
              >
                <span className="material-symbols-outlined text-error text-sm">close</span>
              </button>

              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Stone {i + 1}</p>

              <div className="grid grid-cols-4 gap-1.5 p-1 bg-surface-container-lowest rounded-lg mb-4">
                {['diamond', 'precious', 'semiprecious', 'artificial'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateStone(i, 'type', st)}
                    className={`py-2 px-2 rounded-md font-headline font-bold text-[10px] uppercase tracking-wider transition-all ${
                      stone.type === st
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'hover:bg-surface-container-high text-on-surface/60'
                    }`}
                  >
                    {stoneTypeLabels[st]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">Name</label>
                  <input
                    type="text"
                    value={stone.name}
                    onChange={(e) => updateStone(i, 'name', e.target.value)}
                    placeholder="e.g., Ruby"
                    className="w-full bg-transparent border-b border-outline-variant py-2 text-sm font-headline placeholder:text-on-surface/20 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">Weight (ct)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stone.weightCarat}
                    onChange={(e) => updateStone(i, 'weightCarat', e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent border-b border-outline-variant py-2 text-sm font-headline placeholder:text-on-surface/20 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={stone.price}
                    onChange={(e) => updateStone(i, 'price', e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent border-b border-outline-variant py-2 text-sm font-headline placeholder:text-on-surface/20 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
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
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>{isEdit ? 'save' : 'verified'}</span>
          {submitting ? (isEdit ? 'Saving...' : 'Registering...') : (isEdit ? 'Save Changes' : 'Register Asset')}
        </button>
      </div>
    </form>
  );
}
