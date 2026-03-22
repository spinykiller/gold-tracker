import { useRef, useState, useEffect } from 'react';
import { blobToUrl } from '../../lib/photos';

function Thumbnail({ blob, onRemove }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (blob) {
      const u = blobToUrl(blob);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
  }, [blob]);
  if (!url) return null;
  return (
    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 group/thumb">
      <img src={url} alt="" className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
      >
        <span className="material-symbols-outlined text-white text-sm">close</span>
      </button>
    </div>
  );
}

export default function PhotoCapture({ values = [], onChange }) {
  const galleryRef = useRef();
  const cameraRef = useRef();
  const [showMenu, setShowMenu] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange([...values, file]);
    }
    e.target.value = '';
  };

  const handleRemove = (index) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {values.length === 0 ? (
        <div
          onClick={() => setShowMenu(true)}
          className="relative group aspect-square w-full rounded-xl bg-surface-container-low flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-all duration-500 overflow-hidden cursor-pointer"
        >
          <div className="z-20 flex flex-col items-center text-center px-8">
            <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{fontVariationSettings: "'FILL' 0, 'wght' 200"}}>add_a_photo</span>
            <p className="font-headline font-bold text-lg uppercase tracking-widest text-on-surface mb-1">Add Photos</p>
            <p className="text-xs text-on-surface-variant">Tap to capture or select from gallery</p>
          </div>
          <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-primary/20" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-primary/20" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {values.map((blob, i) => (
            <Thumbnail key={i} blob={blob} onRemove={() => handleRemove(i)} />
          ))}
          <button
            type="button"
            onClick={() => setShowMenu(true)}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-outline-variant/30 hover:border-primary/50 flex flex-col items-center justify-center flex-shrink-0 transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-2xl">add</span>
            <span className="text-[9px] text-on-surface-variant mt-1">Add More</span>
          </button>
        </div>
      )}

      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowMenu(false)}>
          <div className="w-full max-w-md bg-surface-container-high rounded-t-2xl p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <p className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface-variant mb-4">Add Photo</p>
            <button
              type="button"
              onClick={() => { cameraRef.current?.click(); setShowMenu(false); }}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-primary">photo_camera</span>
              <span className="font-semibold text-on-surface">Take Photo</span>
            </button>
            <button
              type="button"
              onClick={() => { galleryRef.current?.click(); setShowMenu(false); }}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-primary">photo_library</span>
              <span className="font-semibold text-on-surface">Choose from Gallery</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMenu(false)}
              className="w-full p-4 rounded-xl text-center text-on-surface-variant font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
