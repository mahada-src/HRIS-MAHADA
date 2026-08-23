import React from 'react';
import { Menu, Search, Bell, User } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-slate-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-slate-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-slate-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1 items-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Cari data..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="pointer-events-none absolute left-3 top-2 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="relative text-slate-400 hover:text-slate-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 block h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>

          <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>
    </header>
  );
}
