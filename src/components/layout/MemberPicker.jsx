import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import MemberAvatar from '../common/MemberAvatar';
import { verifyPin, isBiometricAvailable, authenticateBiometric } from '../../lib/auth';

const avatarColors = ['#D4AF37', '#C6C6C6', '#E9C349', '#B3B3B1'];

export default function MemberPicker({ onSelect }) {
  const members = useLiveQuery(() => db.members.toArray());
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [hasBiometric, setHasBiometric] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setHasBiometric);
  }, []);

  if (!members) return null;

  const handleSelect = async (member) => {
    const needsAuth = member.pinHash || member.webauthnCredentialId;
    if (!needsAuth) {
      onSelect(member.id);
      return;
    }

    setSelected(member);
    setPin('');
    setError('');

    // Try biometric first if available
    if (member.webauthnCredentialId && hasBiometric) {
      try {
        const ok = await authenticateBiometric(member.webauthnCredentialId);
        if (ok) {
          onSelect(member.id);
          return;
        }
      } catch {}
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim() || !selected) return;
    const ok = await verifyPin(pin, selected.pinHash);
    if (ok) {
      onSelect(selected.id);
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  const handleBiometricRetry = async () => {
    if (!selected?.webauthnCredentialId) return;
    try {
      const ok = await authenticateBiometric(selected.webauthnCredentialId);
      if (ok) onSelect(selected.id);
      else setError('Biometric authentication failed');
    } catch {
      setError('Biometric not available');
    }
  };

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
        {!selected ? (
          <>
            <div className="text-center mb-16 max-w-md">
              <h1 className="font-headline font-extrabold text-4xl tracking-tight text-on-surface mb-4">Vault Access</h1>
              <p className="font-body text-on-surface-variant/80 text-lg tracking-wide">Select your profile to unlock the family heritage collection.</p>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
              {members.map((member, i) => (
                <button
                  key={member.id}
                  onClick={() => handleSelect(member)}
                  className="group relative flex flex-col items-center p-8 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all duration-500 ease-out transform hover:-translate-y-2"
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full border border-primary-container/20 group-hover:border-primary-container/60 transition-colors duration-500" />
                    <div className="w-24 h-24 rounded-full flex items-center justify-center p-2" style={{background: `${avatarColors[i % 4]}15`}}>
                      {member.profilePhoto ? (
                        <MemberAvatar member={member} size={88} className="border-0" />
                      ) : (
                        <span className="text-3xl font-headline font-bold text-on-surface-variant group-hover:text-primary transition-colors">{member.avatar || member.name[0]}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-headline font-bold text-lg tracking-wide text-on-surface group-hover:text-primary transition-colors">{member.name}</span>
                  {(member.pinHash || member.webauthnCredentialId) && (
                    <span className="material-symbols-outlined text-primary-container/40 text-sm mt-2">lock</span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full max-w-sm text-center">
            <button
              onClick={() => { setSelected(null); setPin(''); setError(''); }}
              className="mb-8 text-on-surface-variant/60 flex items-center gap-1 mx-auto"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="text-xs uppercase tracking-widest font-bold">Back</span>
            </button>

            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-4">
                <MemberAvatar member={selected} size={96} />
              </div>
              <h2 className="font-headline font-bold text-2xl text-on-surface">{selected.name}</h2>
            </div>

            {selected.pinHash && (
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(''); }}
                    placeholder="Enter PIN"
                    autoFocus
                    className="w-full text-center bg-surface-container-low border border-outline-variant/30 rounded-xl py-4 text-2xl font-headline tracking-[0.5em] text-on-surface placeholder:text-on-surface/20 placeholder:tracking-widest placeholder:text-lg focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                {error && <p className="text-error text-sm font-semibold">{error}</p>}
                <button
                  type="submit"
                  disabled={!pin.trim()}
                  className="w-full h-14 gold-button-gradient text-on-primary font-headline font-bold uppercase tracking-widest text-sm rounded-xl disabled:opacity-50 active:scale-95 transition-all"
                >
                  Unlock
                </button>
              </form>
            )}

            {selected.webauthnCredentialId && hasBiometric && (
              <button
                onClick={handleBiometricRetry}
                className="mt-4 w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-primary">fingerprint</span>
                <span className="font-headline font-semibold text-on-surface">Use Face ID / Fingerprint</span>
              </button>
            )}
          </div>
        )}

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
