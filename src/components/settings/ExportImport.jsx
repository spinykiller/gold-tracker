import { useRef, useState } from 'react';
import { exportData, importData } from '../../lib/exportImport';

export default function ExportImport() {
  const fileRef = useRef();
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    await exportData();
    setMessage('Backup exported successfully.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('This will replace all current data. Continue?')) return;
    setImporting(true);
    try {
      await importData(file);
      setMessage('Data imported successfully.');
    } catch (err) {
      setMessage('Import failed: ' + err.message);
    }
    setImporting(false);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <section className="bg-surface-container-high rounded-2xl p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="relative z-10">
        <h3 className="font-headline text-3xl font-black text-on-surface mb-4">Backup & Sync</h3>
        <p className="text-on-surface-variant/80 text-lg leading-relaxed mb-8">
          Export your vault data as a portable JSON file. Share via WhatsApp or AirDrop with family.
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-3 bg-primary text-on-primary px-8 py-5 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">download</span>
            Export JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center justify-center gap-3 bg-surface-container-highest text-on-surface px-8 py-5 rounded-xl font-bold text-lg border border-outline-variant/30 hover:bg-surface-bright transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">upload</span>
            {importing ? 'Importing...' : 'Import JSON'}
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
        {message && <p className="mt-4 text-sm text-primary">{message}</p>}
      </div>
    </section>
  );
}
