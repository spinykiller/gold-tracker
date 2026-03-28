import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { compressImage } from '../../lib/photos';
import MemberAvatar from '../common/MemberAvatar';
import { hashPin, verifyPin, isBiometricAvailable, registerBiometric } from '../../lib/auth';

export default function MemberManager({ currentMemberId }) {
  const members = useLiveQuery(() => db.members.toArray());
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [pinModal, setPinModal] = useState(null); // { memberId, mode: 'set'|'change'|'remove' }
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [hasBiometric, setHasBiometric] = useState(false);
  const photoRefs = useRef({});

  useEffect(() => {
    isBiometricAvailable().then(setHasBiometric);
  }, []);

  if (!members) return null;

  const currentMember = members.find(m => m.id === currentMemberId);
  const isAdmin = currentMember?.isAdmin === true;

  const addMember = async () => {
    if (!newName.trim()) return;
    await db.members.add({ name: newName.trim(), avatar: newName.trim()[0].toUpperCase() });
    setNewName('');
  };

  const saveMember = async (id) => {
    if (!editName.trim()) return;
    await db.members.update(id, { name: editName.trim(), avatar: editName.trim()[0].toUpperCase() });
    setEditing(null);
  };

  const toggleAdmin = async (id) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    await db.members.update(id, { isAdmin: !member.isAdmin });
  };

  const deleteMember = async (id) => {
    const itemCount = await db.items.where('registeredBy').equals(id).count();
    const msg = itemCount > 0
      ? `This member has ${itemCount} item(s) registered. Delete anyway?`
      : 'Delete this member?';
    if (!window.confirm(msg)) return;
    await db.members.delete(id);
  };

  const handleProfilePhoto = async (id, file) => {
    if (!file) return;
    const compressed = await compressImage(file, 200, 0.8);
    await db.members.update(id, { profilePhoto: compressed });
  };

  const openPinModal = (memberId, mode) => {
    setPinModal({ memberId, mode });
    setPinInput('');
    setPinConfirm('');
    setCurrentPin('');
    setPinError('');
  };

  const handlePinSubmit = async () => {
    const member = members.find(m => m.id === pinModal.memberId);
    if (!member) return;

    if (pinModal.mode === 'set') {
      if (pinInput.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
      if (pinInput !== pinConfirm) { setPinError('PINs do not match'); return; }
      const hash = await hashPin(pinInput);
      await db.members.update(member.id, { pinHash: hash });
      setPinModal(null);
    } else if (pinModal.mode === 'change') {
      if (!await verifyPin(currentPin, member.pinHash)) { setPinError('Current PIN is incorrect'); return; }
      if (pinInput.length < 4) { setPinError('New PIN must be at least 4 digits'); return; }
      if (pinInput !== pinConfirm) { setPinError('PINs do not match'); return; }
      const hash = await hashPin(pinInput);
      await db.members.update(member.id, { pinHash: hash });
      setPinModal(null);
    } else if (pinModal.mode === 'remove') {
      if (!await verifyPin(currentPin, member.pinHash)) { setPinError('Incorrect PIN'); return; }
      await db.members.update(member.id, { pinHash: null });
      setPinModal(null);
    }
  };

  const handleBiometricSetup = async (member) => {
    try {
      const { credentialId, publicKey } = await registerBiometric(member.id, member.name);
      await db.members.update(member.id, {
        webauthnCredentialId: credentialId,
        webauthnPublicKey: publicKey,
      });
    } catch (err) {
      alert('Biometric setup failed. Please try again.');
    }
  };

  const handleBiometricRemove = async (member) => {
    if (!window.confirm('Remove biometric login?')) return;
    await db.members.update(member.id, {
      webauthnCredentialId: null,
      webauthnPublicKey: null,
    });
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-8">
      <div className="flex justify-between items-center mb-10">
        <h3 className="font-headline text-2xl font-bold">Family Members</h3>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="bg-surface-container-high border-none rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:ring-1 focus:ring-primary/30 w-24"
              onKeyDown={(e) => e.key === 'Enter' && addMember()}
            />
            <button
              onClick={addMember}
              className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
            >
              Add
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {members.map((m) => (
          <div key={m.id} className="bg-surface-container-lowest rounded-xl border border-transparent hover:border-primary/20 transition-all overflow-hidden">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="relative cursor-pointer" onClick={() => photoRefs.current[m.id]?.click()}>
                  <MemberAvatar member={m} size={48} />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary text-[12px]">photo_camera</span>
                  </div>
                  <input
                    ref={el => photoRefs.current[m.id] = el}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleProfilePhoto(m.id, e.target.files?.[0])}
                  />
                </div>
                {editing === m.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => saveMember(m.id)}
                    onKeyDown={(e) => e.key === 'Enter' && saveMember(m.id)}
                    className="bg-transparent border-b border-primary py-1 text-on-surface font-bold focus:outline-none"
                  />
                ) : (
                  <div>
                    <p className="font-bold text-on-surface">{m.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {m.isAdmin && <span className="text-[10px] text-primary uppercase tracking-wider font-bold">Admin</span>}
                      {m.pinHash && <span className="text-[10px] text-primary-container uppercase tracking-wider font-bold">PIN</span>}
                      {m.webauthnCredentialId && <span className="text-[10px] text-primary-container uppercase tracking-wider font-bold">Biometric</span>}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditing(m.id); setEditName(m.name); }}
                  className="text-on-surface-variant/40 hover:text-primary"
                >
                  <span className="material-symbols-outlined">edit_note</span>
                </button>
                {isAdmin && m.id !== currentMemberId && (
                  <>
                    <button
                      onClick={() => toggleAdmin(m.id)}
                      title={m.isAdmin ? 'Remove admin' : 'Make admin'}
                      className={`text-on-surface-variant/40 ${m.isAdmin ? 'hover:text-error' : 'hover:text-primary'}`}
                    >
                      <span className="material-symbols-outlined">{m.isAdmin ? 'admin_panel_settings' : 'shield_person'}</span>
                    </button>
                    <button
                      onClick={() => deleteMember(m.id)}
                      className="text-on-surface-variant/40 hover:text-error"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {m.id === currentMemberId && (
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              {!m.pinHash ? (
                <button
                  onClick={() => openPinModal(m.id, 'set')}
                  className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Set PIN
                </button>
              ) : (
                <>
                  <button
                    onClick={() => openPinModal(m.id, 'change')}
                    className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-lg hover:bg-surface-container-highest transition-colors"
                  >
                    Change PIN
                  </button>
                  <button
                    onClick={() => openPinModal(m.id, 'remove')}
                    className="text-xs font-bold text-error bg-error/10 px-3 py-1.5 rounded-lg hover:bg-error/20 transition-colors"
                  >
                    Remove PIN
                  </button>
                </>
              )}
              {hasBiometric && (
                !m.webauthnCredentialId ? (
                  <button
                    onClick={() => handleBiometricSetup(m)}
                    className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">fingerprint</span>
                    Setup Biometric
                  </button>
                ) : (
                  <button
                    onClick={() => handleBiometricRemove(m)}
                    className="text-xs font-bold text-error bg-error/10 px-3 py-1.5 rounded-lg hover:bg-error/20 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">fingerprint</span>
                    Remove Biometric
                  </button>
                )
              )}
            </div>
            )}
          </div>
        ))}
      </div>

      {pinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPinModal(null)}>
          <div className="bg-surface-container-high rounded-2xl p-8 w-full max-w-sm mx-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h4 className="font-headline font-bold text-lg text-on-surface">
              {pinModal.mode === 'set' ? 'Set PIN' : pinModal.mode === 'change' ? 'Change PIN' : 'Remove PIN'}
            </h4>

            {(pinModal.mode === 'change' || pinModal.mode === 'remove') && (
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentPin}
                onChange={(e) => { setCurrentPin(e.target.value); setPinError(''); }}
                placeholder="Current PIN"
                autoFocus
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 px-4 text-center text-lg font-headline tracking-[0.3em] text-on-surface placeholder:text-on-surface/20 placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-primary"
              />
            )}

            {pinModal.mode !== 'remove' && (
              <>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                  placeholder={pinModal.mode === 'change' ? 'New PIN' : 'Enter PIN (min 4 digits)'}
                  autoFocus={pinModal.mode === 'set'}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 px-4 text-center text-lg font-headline tracking-[0.3em] text-on-surface placeholder:text-on-surface/20 placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-primary"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pinConfirm}
                  onChange={(e) => { setPinConfirm(e.target.value); setPinError(''); }}
                  placeholder="Confirm PIN"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 px-4 text-center text-lg font-headline tracking-[0.3em] text-on-surface placeholder:text-on-surface/20 placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-primary"
                />
              </>
            )}

            {pinError && <p className="text-error text-sm font-semibold text-center">{pinError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPinModal(null)}
                className="flex-1 py-3 rounded-xl bg-surface-container-low text-on-surface font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                className="flex-1 py-3 rounded-xl gold-button-gradient text-on-primary font-bold active:scale-95 transition-transform"
              >
                {pinModal.mode === 'remove' ? 'Remove' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
