import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';

export default function MemberManager() {
  const members = useLiveQuery(() => db.members.toArray());
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');

  if (!members) return null;

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

  return (
    <div className="bg-surface-container-low rounded-xl p-8">
      <div className="flex justify-between items-center mb-10">
        <h3 className="font-headline text-2xl font-bold">Family Members</h3>
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
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-xl border border-transparent hover:border-primary/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-bright flex items-center justify-center border-2 border-outline-variant/30">
                <span className="text-lg font-bold text-on-surface-variant">{m.avatar || m.name[0]}</span>
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
                <p className="font-bold text-on-surface">{m.name}</p>
              )}
            </div>
            <button
              onClick={() => { setEditing(m.id); setEditName(m.name); }}
              className="text-on-surface-variant/40 hover:text-primary"
            >
              <span className="material-symbols-outlined">edit_note</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
