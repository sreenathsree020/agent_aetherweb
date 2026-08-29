import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitFork,
  PhoneCall,
  BarChart3,
  Radio,
  BookOpen,
  Settings as SettingsIcon
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const mainLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/builder', label: 'Workflow Canvas', icon: GitFork, badge: 'n8n' },
    { to: '/calls', label: 'Call History', icon: PhoneCall },
    { to: '/analytics', label: 'Analytics & P95', icon: BarChart3 },
    { to: '/monitor', label: 'Live Monitor', icon: Radio, badge: 'Live' },
    { to: '/knowledge', label: 'Knowledge RAG', icon: BookOpen },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-56 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 flex flex-col justify-between shrink-0 overflow-y-auto transition-colors duration-150 font-sans">
      <div className="space-y-4">
        <div className="px-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Platform Menu
        </div>

        <div className="space-y-0.5">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-strong)] font-semibold shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={14} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
