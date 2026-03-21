import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppShell({ currentMember }) {
  const location = useLocation();
  const isDetail = location.pathname.includes('/items/');

  return (
    <div className="min-h-screen pb-32">
      <header className="bg-[#1C1B1B] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex justify-between items-center px-6 py-4 w-full h-16 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-primary-container/30">
            <span className="text-xs font-bold text-primary">{currentMember?.avatar || '?'}</span>
          </div>
          <span className="font-[Manrope] font-semibold tracking-tight text-lg text-on-surface/80">{currentMember?.name || ''}</span>
        </div>
        <div className="text-xl font-bold tracking-[0.1em] text-primary-container uppercase font-headline">Aureum Heritage</div>
        <div className="p-2 hover:bg-surface-container-high transition-colors duration-300 rounded-full cursor-pointer">
          <span className="material-symbols-outlined text-primary-container">account_circle</span>
        </div>
      </header>
      <Outlet />
      <BottomNav />
    </div>
  );
}
