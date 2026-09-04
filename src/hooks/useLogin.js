import { useState } from 'react';
import { authApi } from '../api/api';
import { cleanUserForStorage, clearStorageQuota } from '../utils/storageUtils';

export const useLogin = (showSuccess, showError, setAuthData) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(true);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(credentials);

      // Guardar datos en localStorage
      localStorage.setItem('token', response.data.token);
      try {
        localStorage.setItem('user', JSON.stringify(cleanUserForStorage(response.data.user)));
      } catch (quotaError) {
        console.warn('localStorage quota exceeded, clearing storage:', quotaError);
        clearStorageQuota();
        localStorage.setItem('user', JSON.stringify(cleanUserForStorage(response.data.user)));
      }

      // Actualizar estado de autenticación
      if (setAuthData) {
        setAuthData({
          user: response.data.user,
          token: response.data.token
        });
      }

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Error al iniciar sesión';

      setError(errorMessage);

      // NO mostrar notificaciones en el hook para login
      // Los errores se manejan en el componente con modal iOS

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    setIsRegisterMode(true);

    try {
      const response = await authApi.register(userData);

      // Guardar datos en localStorage
      localStorage.setItem('token', response.data.token);
      try {
        localStorage.setItem('user', JSON.stringify(cleanUserForStorage(response.data.user)));
      } catch (quotaError) {
        console.warn('localStorage quota exceeded, clearing storage:', quotaError);
        clearStorageQuota();
        localStorage.setItem('user', JSON.stringify(cleanUserForStorage(response.data.user)));
      }

      // Actualizar estado de autenticación
      if (setAuthData) {
        setAuthData({
          user: response.data.user,
          token: response.data.token
        });
      }

      // NO mostrar notificaciones en el hook para registro
      // Las notificaciones se manejan en el componente

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al registrar usuario';
      setError(errorMessage);

      // NO mostrar notificaciones en el hook para registro
      // Las notificaciones se manejan en el componente

      throw error;
    } finally {
      setIsLoading(false);
      setIsRegisterMode(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const disableNotifications = () => setShowNotifications(false);
  const enableNotifications = () => setShowNotifications(true);

  return {
    isLoading,
    error,
    login,
    register,
    clearError,
    disableNotifications,
    enableNotifications
  };
};
