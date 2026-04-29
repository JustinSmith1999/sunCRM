import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

/**
 * Install-to-homescreen banner. Shows once when the browser fires
 * `beforeinstallprompt`; remembers dismiss in localStorage so we don't nag.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = (() => {
      try { return localStorage.getItem('suncrm:install-dismissed') === '1'; }
      catch { return false; }
    })();
    if (dismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt as any);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt as any);
  }, []);

  if (!visible || !deferred) return null;

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem('suncrm:install-dismissed', '1'); } catch {}
  };

  const install = async () => {
    try {
      deferred.prompt();
      await deferred.userChoice;
    } finally {
      dismiss();
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-20 md:bottom-4 md:left-auto md:right-4 md:w-80 z-50 bg-white text-ink rounded-xl shadow-pop border border-line p-3 flex items-center gap-3 animate-fade-up">
      <div className="w-10 h-10 rounded-lg bg-sky-pale flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-sky-dark" />
      </div>
      <div className="flex-1 text-sm leading-tight">
        <div className="font-semibold">Install sunCRM</div>
        <div className="text-ink-muted text-xs">Add to your home screen for a faster, full-screen experience.</div>
      </div>
      <button
        onClick={install}
        className="text-xs px-3 py-2 rounded-full bg-sky text-white hover:bg-sky-deep font-semibold transition-colors duration-fast ease-smooth press-scale"
      >
        Install
      </button>
      <button onClick={dismiss} aria-label="Dismiss" className="text-ink-subtle hover:text-ink">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default InstallPrompt;
