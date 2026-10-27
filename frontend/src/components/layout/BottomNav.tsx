import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Users, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const items = [
    { to: '/',          label: 'Home',      icon: LayoutDashboard },
    { to: '/analytics', label: 'Analytics', icon: Target },
    { to: '/insights',  label: 'Insights',  icon: Users },
    { to: '/settings',  label: 'Settings',  icon: Settings },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center safe-bottom"
      style={{
        background: 'rgba(19, 22, 25, 0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid #2a2f38',
        padding: '0.5rem 0.5rem',
      }}
    >
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl text-[11px] font-medium transition-all ${
              isActive ? 'text-[#b78af7]' : 'text-[#a0a4aa] hover:text-[#f4f4f5]'
            }`
          }
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
