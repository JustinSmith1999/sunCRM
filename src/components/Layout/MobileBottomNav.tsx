import React from 'react';
import { Home, Users, Briefcase, ListChecks, MoreHorizontal } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenMore: () => void;
}

const tabs = [
  { id: 'home',  label: 'Home',  icon: Home },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'deals', label: 'Deals', icon: Briefcase },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
];

/**
 * Mobile bottom tab bar — only renders on small screens. Sits above the iOS
 * home indicator via env(safe-area-inset-bottom). Tap targets are 56px tall
 * (above the 44px Apple HIG / 48dp Material minimum).
 */
export function MobileBottomNav({ currentView, onNavigate, onOpenMore }: MobileBottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-line text-ink-muted"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = currentView === id;
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => onNavigate(id)}
                className={`w-full h-14 flex flex-col items-center justify-center gap-0.5 text-[11px] transition-colors duration-fast ease-smooth press-scale ${
                  active ? 'text-sky' : 'text-ink-subtle hover:text-ink'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className="leading-none">{label}</span>
              </button>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            onClick={onOpenMore}
            className="w-full h-14 flex flex-col items-center justify-center gap-0.5 text-[11px] text-ink-subtle hover:text-ink transition-colors duration-fast ease-smooth press-scale"
            aria-label="More navigation"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="leading-none">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default MobileBottomNav;
