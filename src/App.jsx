import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { seedMembers, db } from './lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCurrentMember } from './hooks/useCurrentMember';
import AppShell from './components/layout/AppShell';
import MemberPicker from './components/layout/MemberPicker';
import Home from './pages/Home';
import Items from './pages/Items';
import AddItem from './pages/AddItem';
import ItemDetailPage from './pages/ItemDetailPage';
import Reconcile from './pages/Reconcile';
import EditItem from './pages/EditItem';
import Settings from './pages/Settings';

export default function App() {
  const { memberId, setMemberId, logout } = useCurrentMember();
  const [ready, setReady] = useState(false);
  const currentMember = useLiveQuery(
    () => (memberId ? db.members.get(memberId) : undefined),
    [memberId]
  );

  useEffect(() => {
    seedMembers().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  if (!memberId) {
    return <MemberPicker onSelect={setMemberId} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell currentMember={currentMember} onLogout={logout} />}>
          <Route index element={<Home memberId={memberId} />} />
          <Route path="items" element={<Items />} />
          <Route path="add" element={<AddItem memberId={memberId} />} />
          <Route path="items/:id" element={<ItemDetailPage memberId={memberId} />} />
          <Route path="items/:id/edit" element={<EditItem memberId={memberId} />} />
          <Route path="reconcile" element={<Reconcile memberId={memberId} />} />
          <Route path="settings" element={<Settings memberId={memberId} />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
