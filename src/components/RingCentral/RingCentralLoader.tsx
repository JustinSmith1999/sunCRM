import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Lazy-loads the RingCentral embeddable adapter (and consequently the
 * floating call-control widget). Mounted inside the authenticated app shell,
 * so it never runs on the login screen or for anonymous visitors.
 *
 * The adapter is added to the DOM exactly once per session — even if the
 * tree re-mounts. Sign-out doesn't remove the script (RingCentral keeps
 * its own auth/session state); the widget hides itself when no RC token
 * is present.
 *
 * Why a component instead of an effect in App.tsx? It keeps the concern
 * isolated, and it's easy to disable site-wide by removing one render.
 */
const ADAPTER_URL =
  'https://apps.ringcentral.com/integration/ringcentral-embeddable/2.x/adapter.js';

let adapterLoadStarted = false;

export function RingCentralLoader() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (adapterLoadStarted) return;
    if (typeof document === 'undefined') return;
    // Idempotency guard in case the adapter was already injected by a
    // prior version of the page.
    if (document.querySelector('script[src*="ringcentral-embeddable"]')) {
      adapterLoadStarted = true;
      return;
    }
    adapterLoadStarted = true;
    const s = document.createElement('script');
    s.src   = ADAPTER_URL;
    s.async = true;
    s.defer = true;
    document.body.appendChild(s);
  }, [user]);

  return null;
}

export default RingCentralLoader;
