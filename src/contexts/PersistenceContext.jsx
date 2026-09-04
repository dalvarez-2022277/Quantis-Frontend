import React, { createContext, useContext, useMemo } from 'react';
import { usePersistedState, usePersistedForm, usePersistedList } from '../hooks/usePersistedState';

const PersistenceContext = createContext();

export const usePersistence = () => {
  const context = useContext(PersistenceContext);
  if (!context) {
    throw new Error('usePersistence debe ser usado dentro de PersistenceProvider');
  }
  return context;
};

export const PersistenceProvider = ({ children }) => {
  // Estado de navegación y UI
  const [lastVisitedRoute, setLastVisitedRoute] = usePersistedState('lastVisitedRoute', '/dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistedState('sidebarCollapsed', false);
  const [theme, setTheme] = usePersistedState('theme', 'light');
  
  // Estado de formularios comunes
  const forgotPasswordForm = usePersistedForm('forgotPasswordForm', {
    email: '',
    step: 1 // 1: email, 2: verification, 3: new password
  });
  
  const resetPasswordForm = usePersistedForm('resetPasswordForm', {
    password: '',
    confirmPassword: '',
    token: ''
  });
  
  // Estado de datos temporales
  const [temporaryData, setTemporaryData] = usePersistedState('temporaryData', {});
  
  // Listas temporales (ej: datos cargados antes de recargar)
  const dashboardData = usePersistedList('dashboardData', []);
  const profileData = usePersistedList('profileData', []);
  
  // Estado de notificaciones persistido
  const [notifications, setNotifications] = usePersistedState('notifications', []);
  
  // Funciones de utilidad
  const saveTemporaryData = (key, data) => {
    setTemporaryData(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now()
      }
    }));
  };
  
  const getTemporaryData = (key, maxAge = 5 * 60 * 1000) => { // 5 minutos por defecto
    const item = temporaryData[key];
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > maxAge;
    if (isExpired) {
      // Limpiar datos expirados
      setTemporaryData(prev => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
      return null;
    }
    
    return item.data;
  };
  
  const clearTemporaryData = (key) => {
    if (key) {
      setTemporaryData(prev => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
    } else {
      setTemporaryData({});
    }
  };
  
  // Función para limpiar todos los datos temporales al hacer logout
  const clearAllTemporaryData = () => {
    forgotPasswordForm.resetForm();
    resetPasswordForm.resetForm();
    dashboardData.clearAll();
    profileData.clearAll();
    setTemporaryData({});
    setNotifications([]);
  };
  
  // Función para guardar estado antes de navegar
  const saveStateBeforeNavigation = (route, data) => {
    setLastVisitedRoute(route);
    if (data) {
      saveTemporaryData(`route_${route}`, data);
    }
  };
  
  const value = useMemo(() => ({
    // Estado de navegación
    lastVisitedRoute,
    setLastVisitedRoute,
    sidebarCollapsed,
    setSidebarCollapsed,
    theme,
    setTheme,
    
    // Formularios
    forgotPasswordForm,
    resetPasswordForm,
    
    // Datos temporales
    temporaryData,
    saveTemporaryData,
    getTemporaryData,
    clearTemporaryData,
    
    // Listas
    dashboardData,
    profileData,
    
    // Notificaciones
    notifications,
    setNotifications,
    
    // Funciones de utilidad
    clearAllTemporaryData,
    saveStateBeforeNavigation
  }), [
    lastVisitedRoute,
    setLastVisitedRoute,
    sidebarCollapsed,
    setSidebarCollapsed,
    theme,
    setTheme,
    forgotPasswordForm,
    resetPasswordForm,
    temporaryData,
    dashboardData,
    profileData,
    notifications,
    setNotifications
  ]);

  return (
    <PersistenceContext.Provider value={value}>
      {children}
    </PersistenceContext.Provider>
  );
};
