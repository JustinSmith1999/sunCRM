import React from 'react';
import { Menu, X } from 'lucide-react';
import NotificationBell from '../Notifications/NotificationBell';
import GlobalSearch from '../Search/GlobalSearch';

interface MobileHeaderProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
  currentView: string;
  onNavigateHome: () => void;
}

export function MobileHeader({ showSidebar, onToggleSidebar, onNavigateHome }: MobileHeaderProps) {
  return (
    <div className="md:hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-3 h-12 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 fixed top-0 left-0 right-0 z-40">
      <button
        onClick={onToggleSidebar}
        aria-label={showSidebar ? 'Close menu' : 'Open menu'}
        className="p-1.5 -ml-1 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
      >
        {showSidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      <button onClick={onNavigateHome} className="flex-1 flex items-center justify-center gap-2">
        <img
          src="https://husbupeealwuxyopfwwb.supabase.co/storage/v1/object/public/logos/03018223-ac24-400d-acbc-2c1480a05441.webp"
          alt=""
          className="w-5 h-5 object-contain"
        />
        <span className="font-display text-[15px] font-semibold tracking-tight">sunCRM</span>
      </button>

      <div className="flex items-center gap-1">
        <div className="hidden sm:block"><GlobalSearch /></div>
        <NotificationBell />
      </div>
    </div>
  );
}
