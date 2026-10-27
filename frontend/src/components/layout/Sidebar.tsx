import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  ExternalLink,
  Zap,
  Settings,
} from 'lucide-react';

import { authService, User as AuthUser } from '../../services/authService';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

interface SidebarProps {
  user?: AuthUser | null;
  onOpenAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onOpenAuth }) => {
  const navItems = [
    { to: '/',          label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analytics', label: 'Analytics',  icon: Target },
    { to: '/insights',  label: 'Insights',   icon: Users },
    { to: '/settings',  label: 'Settings',   icon: Settings },
  ];

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 h-full"
      style={{
        width: 220,
        background: '#131619',
        borderRight: '1px solid #2a2f38',
        padding: '1.25rem 0.75rem',
        gap: 0,
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-7">
        <div
          className="flex items-center justify-center rounded-lg text-white flex-shrink-0"
          style={{
            width: 30,
            height: 30,
            background: 'linear-gradient(135deg,#9b6df4,#b78af7)',
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          H
        </div>
        <span
          style={{
            fontWeight: 800,
            fontSize: '0.9375rem',
            color: '#f4f4f5',
            letterSpacing: '-0.01em',
          }}
        >
          HabitFlow
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `hf-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={15} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Account */}
      <div style={{ borderTop: '1px solid #2a2f38', paddingTop: '0.875rem', marginTop: '0.5rem' }}>
        {user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.625rem',
              background: '#1a1d22',
              borderRadius: '0.5rem',
              border: '1px solid #2a2f38',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9b6df4, #b78af7)',
                  color: '#0f1115',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#f4f4f5', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.display_name}
                </p>
                <p style={{ margin: 0, fontSize: '0.625rem', color: '#a0a4aa', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => authService.logout()}
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: '#a0a4aa',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="hf-nav-item w-full"
            style={{
              background: 'rgba(183,138,247,0.1)',
              border: '1px solid rgba(183,138,247,0.3)',
              color: '#b78af7',
              fontWeight: 700,
            }}
          >
            <LogIn size={14} />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </aside>
  );
};
