'use client';

import { useEffect } from 'react';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
let refreshPromise: Promise<void> | null = null;

function refreshSessionOnce() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include', cache: 'no-store' })
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export function SessionKeepAlive() {
  useEffect(() => {
    const refreshSession = async () => {
      if (document.visibilityState === 'hidden') return;
      await refreshSessionOnce();
    };

    void refreshSession();
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
