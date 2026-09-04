import { useState, useCallback, useEffect } from 'react';
import { usePersistedState } from './usePersistedState';

const STORAGE_KEY = 'quantis_notifications';

const canUseNotifications = () =>
  typeof window !== 'undefined' && 'Notification' in window;

const getPermission = () =>
  canUseNotifications() ? Notification.permission : 'denied';

const formatTime = (date = new Date()) =>
  date.toLocaleString('es', {
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: true,
  });

function ensureNotificationsArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (n) => n && typeof n === 'object' && n.id && typeof n.id === 'string'
  );
}

export const useNotifications = () => {
  const [rawNotifications, setRawNotifications] = usePersistedState(STORAGE_KEY, []);
  const notifications = ensureNotificationsArray(rawNotifications);
  const setNotifications = useCallback(
    (updater) => {
      setRawNotifications((prev) => {
        const prevClean = ensureNotificationsArray(prev);
        const next = typeof updater === 'function' ? updater(prevClean) : updater;
        const cleaned = Array.isArray(next) ? ensureNotificationsArray(next) : prevClean;
        return cleaned;
      });
    },
    [setRawNotifications]
  );
  const [notificationPermission, setNotificationPermission] = useState(getPermission);

  useEffect(() => {
    if (!canUseNotifications()) return;
    setNotificationPermission(Notification.permission);
  }, []);

  const showBrowserNotification = useCallback((title, message, id) => {
    if (!canUseNotifications() || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body: message,
        icon: '/assets/logos/Quantisicon.png',
        tag: id ? `quantis-${id}` : `quantis-${Date.now()}`,
        requireInteraction: false,
      });
      n.onclick = () => window.focus();
    } catch (e) {
      console.warn('Browser notification failed:', e);
    }
  }, []);

  // Cada notificación: se agrega al modal de Notificaciones y se envía como push nueva del navegador (si hay permiso)
  const addNotification = useCallback((notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date();
    const newNotification = {
      ...notification,
      id,
      unread: true,
      time: formatTime(now),
      createdAt: now.getTime(),
    };

    setNotifications((prev) => [...prev, newNotification]);

    const title = notification.title || 'Quantis';
    const body = notification.message || notification.body || '';
    if (body || title !== 'Quantis') {
      showBrowserNotification(title, body, id);
    }
    return id;
  }, [showBrowserNotification]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!canUseNotifications()) return 'denied';
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  const showSuccess = useCallback((title, message) => {
    return addNotification({ type: 'success', title, message });
  }, [addNotification]);

  const showError = useCallback((title, message) => {
    return addNotification({ type: 'error', title, message });
  }, [addNotification]);

  const showWarning = useCallback((title, message) => {
    return addNotification({ type: 'warning', title, message });
  }, [addNotification]);

  const showInfo = useCallback((title, message) => {
    return addNotification({ type: 'info', title, message });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    notificationPermission: canUseNotifications() ? notificationPermission : 'denied',
    requestNotificationPermission,
  };
};
