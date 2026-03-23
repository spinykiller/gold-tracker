import ScheduleForm from '../components/settings/ScheduleForm';
import ExportImport from '../components/settings/ExportImport';
import MemberManager from '../components/settings/MemberManager';

export default function Settings({ memberId, onLogout }) {
  return (
    <main className="max-w-screen-xl mx-auto px-6 pt-12 pb-32 space-y-20">
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Vault Control</h2>
          <p className="text-on-surface-variant/70 text-lg">Manage your legacy infrastructure and secure your assets.</p>
        </div>
        <div className="bg-error-container/10 border-l-4 border-primary p-6 rounded-xl flex gap-4 items-start">
          <span className="material-symbols-outlined text-primary">warning</span>
          <div className="space-y-1">
            <p className="font-headline font-bold text-primary tracking-wide text-sm uppercase">Security Protocol</p>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Aureum Heritage utilizes local-only storage for maximum privacy. Your data never leaves this device.
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
