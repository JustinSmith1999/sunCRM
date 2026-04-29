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
    <div
      className="md:hidden bg-white/95 backdrop-blur text-ink px-3 flex items-center justify-between border-b border-line fixed top-0 left-0 right-0 z-40"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)', paddingBottom: '0.625rem' }}
    >
      <button
        onClick={onToggleSidebar}
        aria-label={showSidebar ? 'Close menu' : 'Open menu'}
        className="p-2 -ml-1 text-ink hover:bg-sand-pale rounded-lg transition-colors duration-fast ease-smooth press-scale"
      >
        {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <button onClick={onNavigateHome} className="flex-1 flex items-center justify-center gap-2">
        <img
          src="https://husbupeealwuxyopfwwb.supabase.co/storage/v1/object/public/logos/03018223-ac24-400d-acbc-2c1480a05441.webp"
          alt=""
          className="w-6 h-6 object-contain"
        />
        <span className="font-display text-lg font-bold leading-none">sunCRM</span>
      </button>

      <div className="flex items-center gap-1">
        <div className="hidden sm:block">
          <GlobalSearch />
        </div>
        <NotificationBell />
      </div>
    </div>
  );
}
