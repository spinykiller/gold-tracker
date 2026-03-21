import { useRef, useState, useEffect } from 'react';
import { blobToUrl } from '../../lib/photos';

export default function PhotoCapture({ value, onChange }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (value) {
      const url = blobToUrl(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [value]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  };

  return (
    <div
      onClick={() => fileRef.current?.click()}
      className="relative group aspect-square w-full rounded-xl bg-surface-container-low flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-all duration-500 overflow-hidden cursor-pointer"
    >
      {preview ? (
        <img src={preview} alt="Asset" className="w-full h-full object-cover" />
      ) : (
        <div className="z-20 flex flex-col items-center text-center px-8">
          <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{fontVariationSettings: "'FILL' 0, 'wght' 200"}}>add_a_photo</span>
          <p className="font-headline font-bold text-lg uppercase tracking-widest text-on-surface mb-1">Capture Asset</p>
          <p className="text-xs text-on-surface-variant">Place ornament on a neutral background</p>
        </div>
      )}
      <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-primary/20" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-primary/20" />
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </div>
  );
}
