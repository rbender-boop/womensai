'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Skip admin pages
    if (pathname.startsWith('/admin')) return;
    // Avoid double-fire on same path (React strict mode)
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

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
