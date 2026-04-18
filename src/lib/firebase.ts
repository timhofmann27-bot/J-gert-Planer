import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let messaging: ReturnType<typeof getMessaging> | null = null;

export function initializeFirebase() {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    console.warn('[Firebase] Not configured. Set VITE_FIREBASE_* in .env');
    return null;
  }

  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Not supported in this browser');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function generateVAPIDKey(): Promise<string | null> {
  if (!messaging) return null;

  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[Firebase] VAPID key not configured');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    console.log('[Firebase] FCM Token:', token);
    return token;
  } catch (error) {
    console.error('[Firebase] Token generation failed:', error);
    return null;
  }
}

export function onMessageListener(
  callback: (payload: MessagePayload) => void
) {
  if (!messaging) return;

  onMessage(messaging, callback);
}

export async function sendTokenToBackend(token: string) {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Failed to subscribe');
    }

    console.log('[Notifications] Token sent to backend');
  } catch (error) {
    console.error('[Notifications] Failed to send token:', error);
  }
}

export async function setupNotifications() {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('[Notifications] Permission denied');
    return;
  }

  initializeFirebase();
  
  const token = await generateVAPIDKey();
  if (token) {
    await sendTokenToBackend(token);
  }

  onMessageListener((payload) => {
    console.log('[Notifications] New message:', payload);
    
    const { title, body } = payload.notification || {};
    if (title && body) {
      new Notification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [200, 100, 200],
      });
    }
  });
}

export async function unsubscribeFromNotifications() {
  if (!messaging) return;

  try {
    await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
    });

    console.log('[Notifications] Unsubscribed');
  } catch (error) {
    console.error('[Notifications] Failed to unsubscribe:', error);
  }
}
