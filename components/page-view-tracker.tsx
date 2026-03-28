'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track once per browser session (tab open to tab close)
    const key = 'wai_pv_tracked';
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    const sessionId = document.cookie
      .split('; ')
      .find((c) => c.startsWith('wai_session='))
      ?.split('=')[1];

    fetch('/api/track/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        sessionId: sessionId || null,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
