'use client';

import { useEffect } from 'react';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function SessionKeepAlive() {
  useEffect(() => {
    let refreshing = false;

    const refreshSession = async () => {
      if (refreshing || document.visibilityState === 'hidden') return;
      refreshing = true;
      try {
        await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include', cache: 'no-store' });
      } finally {
        refreshing = false;
      }
    };

    const intervalId = window.setInterval(() => void refreshSession(), REFRESH_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshSession();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, []);

  return null;
}
