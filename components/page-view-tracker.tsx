'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef('');

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    // Get session ID from cookie if available
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
    }).catch(() => {}); // fire-and-forget
  }, [pathname]);

  return null;
}
