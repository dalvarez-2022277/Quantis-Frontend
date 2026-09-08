import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLogin } from '../hooks/useLogin';
import { useNotifications } from '../hooks/useNotifications';
import { useDueReminders } from '../hooks/useDueReminders';
import { usePersistence } from './PersistenceContext';

// El contexto ahora solo actúa como un wrapper para los hooks

// Crear contexto
const AuthContext = createContext();

// Hook para usar el contexto
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe ser usado dentro de AuthProvider');
  }
  return context;
};

// Provider
export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  const notifications = useNotifications();
  const persistence = usePersistence();
  const login = useLogin(notifications.showSuccess, notifications.showError, auth.setAuthData);
  useDueReminders(auth.isAuthenticated, notifications, notifications.notifications);

  // Estado para configuraciones
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (error) {
        return {
          currency: 'GTQ',
          notifications: true
        };
      }
    }
    return {
      currency: 'GTQ',
      notifications: true
    };
  });

  // Ya no necesitamos este useEffect porque la inicialización se hace en useState

  // Guardar configuraciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  // Función para actualizar configuraciones
  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });
  };

  // Función de logout mejorada que limpia datos temporales
  const logoutWithCleanup = () => {
    auth.logout();
    persistence.clearAllTemporaryData();
    notifications.clearAllNotifications?.();
  };

  // Usar useMemo para estabilizar el valor del contexto y evitar recreaciones innecesarias
  // IMPORTANTE: las notificaciones del hook van DESPUÉS de ...persistence porque
  // PersistenceContext también expone "notifications" (lista persistida vacía) y la sobrescribiría
  const value = useMemo(() => ({
    // Datos del usuario
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    
    // Métodos de autenticación
    login: login.login,
    register: login.register,
    logout: logoutWithCleanup,
    updateProfile: auth.updateProfile,
    uploadAvatar: auth.uploadAvatar,
    deleteAvatar: auth.deleteAvatar,
    setAuthData: auth.setAuthData,
    clearError: auth.clearError,
    enableNotifications: login.enableNotifications,
    disableNotifications: login.disableNotifications,
    
    // Persistencia (no incluir "notifications" para el modal; usamos las del hook abajo)
    ...persistence,
    
    // Notificaciones (lista + push navegador) — después de persistence para que no se sobrescriban
    // Solo añadir/enviar si settings.notifications es true (default true; false = no enviar aunque tengamos permiso)
    notifications: notifications.notifications,
    showSuccess: (...args) => settings.notifications !== false && notifications.showSuccess(...args),
    showError: (...args) => settings.notifications !== false && notifications.showError(...args),
    showWarning: (...args) => settings.notifications !== false && notifications.showWarning(...args),
    showInfo: (...args) => settings.notifications !== false && notifications.showInfo(...args),
    removeNotification: notifications.removeNotification,
    markAsRead: notifications.markAsRead,
    notificationPermission: notifications.notificationPermission,
    requestNotificationPermission: notifications.requestNotificationPermission,
    
    // Imágenes
    imageTimestamp: auth.imageTimestamp,
    
    // Configuraciones
    settings,
    updateSettings
  }), [
    auth.user, auth.token, auth.isAuthenticated, auth.isLoading, auth.error, auth.imageTimestamp,
    login.login, login.register, login.enableNotifications, login.disableNotifications,
    auth.updateProfile, auth.uploadAvatar, auth.deleteAvatar,
    notifications.notifications, notifications.showSuccess, notifications.showError,
    notifications.showWarning, notifications.showInfo, notifications.removeNotification,
    notifications.markAsRead, notifications.notificationPermission, notifications.requestNotificationPermission,
    persistence, settings, updateSettings, logoutWithCleanup
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
