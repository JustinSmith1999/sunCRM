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

export function MobileHeader({ showSidebar, onToggleSidebar, currentView, onNavigateHome }: MobileHeaderProps) {
  return (
    <div className="md:hidden bg-slate-900 text-white px-3 py-2.5 flex items-center justify-between border-b border-slate-700 fixed top-0 left-0 right-0 z-40">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
      >
        {showSidebar ? (
          <X className="w-4 h-4" />
        ) : (
          <Menu className="w-4 h-4" />
        )}
      </button>

      <button
        onClick={onNavigateHome}
        className="flex-1 text-center"
      >
        <h1 className="text-lg font-semibold">sunCRM</h1>
      </button>

      <div className="flex items-center gap-2">
        <div className="hidden sm:block">
          <GlobalSearch />
        </div>
        <NotificationBell />
        <div className="w-9 h-9 flex items-center justify-center">
          <img
            src="https://husbupeealwuxyopfwwb.supabase.co/storage/v1/object/public/logos/03018223-ac24-400d-acbc-2c1480a05441.webp"
            alt="Logo"
            className="w-6 h-6 object-contain"
          />
        </div>
      </div>
    </div>
  );
}