import React from 'react';
import {
  Bot,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { useThemeStore } from '../../stores/useThemeStore';

interface NavbarProps {
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 pt-3.5 pb-2.5 flex items-center justify-between sticky top-0 z-40 font-sans transition-colors duration-150">
      {/* Left: Brand + Search Bar */}
      <div className="flex items-center gap-3.5 flex-1 max-w-2xl">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-[var(--bg-input)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-main)] shadow-sm">
            <Bot size={16} />
          </div>
          <span className="font-bold text-xs tracking-tight text-[var(--text-main)] uppercase hidden sm:block">
            VoiceAgent <span className="text-[var(--text-muted)] font-normal">Studio</span>
          </span>
        </div>

        <div className="h-4 w-px bg-[var(--border-subtle)] hidden sm:block shrink-0" />

        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search calls, tools, numbers..."
            className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition"
          />
        </div>
      </div>

      {/* Right Side: DARK & WHITE THEME SWITCHER */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-panel)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-main)] text-xs font-medium transition shadow-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={13} className="text-amber-400" />
              <span className="text-[11px] font-mono hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon size={13} className="text-zinc-600" />
              <span className="text-[11px] font-mono hidden sm:inline">Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
