import { useState } from 'react';
import ScheduleForm from '../components/settings/ScheduleForm';
import ExportImport from '../components/settings/ExportImport';
import MemberManager from '../components/settings/MemberManager';
import { useAppName } from '../hooks/useAppName';
import { setAppName, DEFAULT_APP_NAME } from '../lib/db';

export default function Settings({ memberId, onLogout }) {
  const appName = useAppName();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSaveName = async () => {
    await setAppName(newName.trim() || DEFAULT_APP_NAME);
    setEditingName(false);
    setNewName('');
  };
  return (
    <main className="max-w-screen-xl mx-auto px-6 pt-12 pb-32 space-y-20">
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Vault Control</h2>
          <p className="text-on-surface-variant/70 text-lg">Manage your legacy infrastructure and secure your assets.</p>
        </div>

        {/* App Name Editor */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-headline font-bold text-on-surface text-sm uppercase tracking-widest">App Name</p>
              <p className="text-on-surface-variant text-sm mt-1">Customize the name displayed in the header</p>
            </div>
            {!editingName && (
              <button
                onClick={() => { setEditingName(true); setNewName(appName); }}
                className="px-4 py-2 bg-primary/10 text-primary font-headline font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-primary/20 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
          {editingName ? (
            <div className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={DEFAULT_APP_NAME}
                className="flex-1 bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface font-headline focus:outline-none focus:border-primary transition-colors"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="px-6 py-3 bg-primary text-on-primary font-headline font-bold text-xs uppercase tracking-wider rounded-lg hover:brightness-110 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => { setEditingName(false); setNewName(''); }}
                className="px-4 py-3 bg-surface-container-highest text-on-surface font-headline font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-surface-bright transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-on-surface font-headline font-bold text-lg">{appName}</p>
          )}
        </div>

        <div className="bg-error-container/10 border-l-4 border-primary p-6 rounded-xl flex gap-4 items-start">
          <span className="material-symbols-outlined text-primary">warning</span>
          <div className="space-y-1">
            <p className="font-headline font-bold text-primary tracking-wide text-sm uppercase">Security Protocol</p>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {appName} utilizes local-only storage for maximum privacy. Your data never leaves this device.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <ScheduleForm memberId={memberId} />
        </div>
        <div className="md:col-span-7">
          <MemberManager currentMemberId={memberId} />
        </div>
      </section>

      <ExportImport />

      <section className="flex justify-center">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-error/10 text-error font-bold text-sm uppercase tracking-widest hover:bg-error/20 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Switch Profile
        </button>
      </section>
    </main>
  );
}
