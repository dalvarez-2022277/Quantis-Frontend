import { useState, useEffect } from 'react';
import { authApi } from '../api/api';
import { cleanUserForStorage, clearStorageQuota } from '../utils/storageUtils';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          try {
            const response = await authApi.getProfile();
            
            setUser(response.data.user);
            setToken(storedToken);
            setIsAuthenticated(true);
          } catch (error) {
            // Token inválido, limpiar datos
            logout();
          }
        }
      } catch (error) {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const updateProfile = async (userData) => {
    try {
      const response = await authApi.updateProfile(userData);
      setUser(response.data.user);
      try {
        localStorage.setItem('user', JSON.stringify(cleanUserForStorage(response.data.user)));
      } catch (quotaError) {
        clearStorageQuota();
        localStorage.setItem('user', JSON.stringify(cleanUserForStorage(response.data.user)));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar perfil';
      setError(errorMessage);
      throw error;
    }
  };

  const uploadAvatar = async (file) => {
    try {
      const response = await authApi.uploadAvatar(file);
      
      // Actualizar timestamp ANTES que el usuario
      const newTimestamp = Date.now();
      setImageTimestamp(newTimestamp);
      
      // Forzar actualización del usuario con un pequeño delay
      setTimeout(() => {
        setUser({ ...response.data.user, _forceUpdate: newTimestamp });
      }, 10);
      
      console.log('🔄 useAuth uploadAvatar:', {
        nuevoUsuario: response.data.user.profileImage,
        nuevoTimestamp: newTimestamp,
        usuarioActualizado: true
      });
      
      try {
        localStorage.setItem('user', JSON.stringify(cleanUserForStorage(response.data.user)));
      } catch (quotaError) {
        clearStorageQuota();
        localStorage.setItem('user', JSON.stringify(cleanUserForStorage(response.data.user)));
      }
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al subir imagen';
      setError(errorMessage);
      throw error;
    }
  };

  const deleteAvatar = async () => {
    try {
      const response = await authApi.deleteAvatar();
      
      // Actualizar timestamp ANTES que el usuario
      const newTimestamp = Date.now();
      setImageTimestamp(newTimestamp);
      
      // Forzar actualización del usuario con un pequeño delay
      setTimeout(() => {
        setUser({ ...response.data.user, _forceUpdate: newTimestamp });
      }, 10);
      
      console.log('🔄 useAuth deleteAvatar:', {
        usuarioSinImagen: response.data.user.profileImage,
        nuevoTimestamp: newTimestamp,
        imagenEliminada: true
      });
      
      try {
        localStorage.setItem('user', JSON.stringify(cleanUserForStorage(response.data.user)));
      } catch (quotaError) {
        clearStorageQuota();
        localStorage.setItem('user', JSON.stringify(cleanUserForStorage(response.data.user)));
      }
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar imagen';
      setError(errorMessage);
      throw error;
    }
  };

  const setAuthData = (authData) => {
    setUser(authData.user);
    setToken(authData.token);
    setIsAuthenticated(true);
    setError(null);
    
    // Guardar en localStorage
    localStorage.setItem('token', authData.token);
    try {
      localStorage.setItem('user', JSON.stringify(cleanUserForStorage(authData.user)));
    } catch (quotaError) {
      console.warn('localStorage quota exceeded, clearing storage:', quotaError);
      clearStorageQuota();
      localStorage.setItem('user', JSON.stringify(cleanUserForStorage(authData.user)));
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    imageTimestamp,
    logout,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    setAuthData,
    clearError
  };
};
