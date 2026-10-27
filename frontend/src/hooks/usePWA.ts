import { useState, useEffect } from 'react';
import { syncService } from '../services/syncService';
import { reminderService } from '../services/reminderService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWA() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    // Check standalone display mode
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);

      // Listen for install prompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      });

      // Notification permission status
      setNotificationPermission(reminderService.getPermissionStatus());

      // Sync & Online listener
      const unsubscribeSync = syncService.onStatusChange((online, syncing) => {
        setIsOnline(online);
        setIsSyncing(syncing);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        unsubscribeSync();
      };
    }
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const requestNotifications = async () => {
    const granted = await reminderService.requestPermission();
    setNotificationPermission(reminderService.getPermissionStatus());
    return granted;
  };

  const triggerManualSync = async () => {
    return await syncService.syncNow();
  };

  return {
    isOnline,
    isSyncing,
    isInstalled,
    canInstall: Boolean(deferredPrompt),
    promptInstall,
    notificationPermission,
    requestNotifications,
    triggerManualSync
  };
}
