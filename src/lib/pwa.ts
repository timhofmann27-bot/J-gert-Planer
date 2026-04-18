import { useEffect, useState } from 'react';
import { hapticFeedback } from './utils';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    hapticFeedback('medium');
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const updateConnection = () => {
      setIsOnline(navigator.onLine);
      
      const conn = (navigator as any).connection;
      if (conn) {
        setConnectionType(conn.effectiveType || 'unknown');
      }
    };

    updateConnection();

    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);

    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', updateConnection);
      return () => conn.removeEventListener('change', updateConnection);
    }
  }, []);

  return { isOnline, connectionType };
}

export function useBatteryStatus() {
  const [battery, setBattery] = useState<{
    level: number;
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
  } | null>(null);

  useEffect(() => {
    if (!('getBattery' in navigator)) {
      return;
    }

    let batteryInstance: any = null;

    const updateBattery = () => {
      if (!batteryInstance) return;
      
      setBattery({
        level: batteryInstance.level,
        charging: batteryInstance.charging,
        chargingTime: batteryInstance.chargingTime,
        dischargingTime: batteryInstance.dischargingTime,
      });
    };

    (navigator as any).getBattery().then((b: any) => {
      batteryInstance = b;
      updateBattery();
      
      b.addEventListener('levelchange', updateBattery);
      b.addEventListener('chargingchange', updateBattery);
    });

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', updateBattery);
        batteryInstance.removeEventListener('chargingchange', updateBattery);
      }
    };
  }, []);

  return battery;
}

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  let wakeLock: any = null;

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await (navigator as any).wakeLock.request('screen');
        setIsLocked(true);
        
        wakeLock.addEventListener('release', () => {
          setIsLocked(false);
        });
      } catch (err) {
        console.error('[Wake Lock] Error:', err);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLocked) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLocked]);

  return { isLocked, requestWakeLock, releaseWakeLock };
}

export function useShare() {
  const share = async (title: string, text: string, url?: string) => {
    if (navigator.share) {
      hapticFeedback('light');
      await navigator.share({ title, text, url });
      return true;
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${text}\n\n${url || ''}`);
      return false;
    }
  };

  return { share, canShare: 'share' in navigator };
}
