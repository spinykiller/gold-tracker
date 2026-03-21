import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';

const avatarColors = ['#D4AF37', '#C6C6C6', '#E9C349', '#B3B3B1'];

export default function MemberPicker({ onSelect }) {
  const members = useLiveQuery(() => db.members.toArray());

  if (!members) return null;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center px-6 h-20 w-full max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-container">lock</span>
            <span className="text-primary-container font-headline font-black tracking-widest text-lg uppercase">The Vault</span>
          </div>
          <span className="material-symbols-outlined text-primary-container">account_balance_wallet</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-20" style={{background: 'radial-gradient(circle at center, #2a2a2a 0%, #131313 100%)'}}>
        <div className="text-center mb-16 max-w-md">
          <h1 className="font-headline font-extrabold text-4xl tracking-tight text-on-surface mb-4">Vault Access</h1>
          <p className="font-body text-on-surface-variant/80 text-lg tracking-wide">Select your profile to unlock the family heritage collection.</p>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full max-w-md">
          {members.map((member, i) => (
            <button
              key={member.id}
              onClick={() => onSelect(member.id)}
              className="group relative flex flex-col items-center p-8 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all duration-500 ease-out transform hover:-translate-y-2"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full border border-primary-container/20 group-hover:border-primary-container/60 transition-colors duration-500" />
                <div className="w-24 h-24 rounded-full flex items-center justify-center p-2" style={{background: `${avatarColors[i % 4]}15`}}>
                  <span className="text-3xl font-headline font-bold text-on-surface-variant group-hover:text-primary transition-colors">{member.avatar || member.name[0]}</span>
                </div>
              </div>
              <span className="font-headline font-bold text-lg tracking-wide text-on-surface group-hover:text-primary transition-colors">{member.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-sm">fingerprint</span>
            <span className="text-xs uppercase tracking-[0.3em] font-medium">Secured by Aureum Protocol</span>
          </div>
        </div>
      </main>
    </div>
  );
}
