import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: 'dashboard', label: 'Home' },
  { to: '/items', icon: 'diamond', label: 'Items' },
  { to: '/reconcile', icon: 'assignment_turned_in', label: 'Reconcile' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="bg-[#1C1B1B]/80 backdrop-blur-md fixed bottom-0 w-full z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.4)] flex justify-around items-center px-4 pb-6 pt-3">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-2 transition-all duration-700 ease-out ${
              isActive
                ? 'bg-[#D4AF37]/20 text-[#D4AF37] rounded-2xl scale-110'
                : 'text-[#E5E2E1]/40 hover:text-[#D4AF37]/80'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
              <span className="font-[Inter] text-[10px] font-medium tracking-wide uppercase mt-1">{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
