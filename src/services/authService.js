import api from './api';
import CryptoJS from 'crypto-js';
import { cleanUserForStorage, clearStorageQuota } from '../utils/storageUtils';

// Función para hacer hash de contraseñas
const hashPassword = (password) => {
  const salt = import.meta.env.VITE_PASSWORD_SALT || 'haspasswordsfx';
  return CryptoJS.SHA256(password + salt).toString();
};

// Servicio de autenticación
export const authService = {
  // Registrar nuevo usuario
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al registrar usuario' };
    }
  },

  // Iniciar sesión
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al iniciar sesión' };
    }
  },

  // Obtener perfil del usuario
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener perfil' };
    }
  },

  // Actualizar perfil
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar perfil' };
    }
  },

  // Cambiar contraseña
  changePassword: async (passwordData) => {
    try {
      const hashedPasswordData = {
        currentPassword: hashPassword(passwordData.currentPassword),
        newPassword: hashPassword(passwordData.newPassword)
      };
      const response = await api.put('/auth/change-password', hashedPasswordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al cambiar contraseña' };
    }
  },

  // Subir imagen de perfil
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al subir imagen' };
    }
  },

  // Eliminar imagen de perfil
  deleteAvatar: async () => {
    try {
      const response = await api.delete('/auth/delete-avatar');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar imagen' };
    }
  },

  // Cerrar sesión (local)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obtener token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Obtener usuario del localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Guardar datos de autenticación
  saveAuthData: (token, user) => {
    localStorage.setItem('token', token);
    try {
      localStorage.setItem('user', JSON.stringify(cleanUserForStorage(user)));
    } catch (quotaError) {
      console.warn('localStorage quota exceeded, clearing storage:', quotaError);
      clearStorageQuota();
      localStorage.setItem('user', JSON.stringify(cleanUserForStorage(user)));
    }
  },

  // Solicitar restablecimiento de contraseña
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al enviar email de restablecimiento' };
    }
  },

  // Verificar token de restablecimiento
  verifyResetToken: async (token) => {
    try {
      const response = await api.get(`/verify-reset-token/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Token inválido o expirado' };
    }
  },

  // Restablecer contraseña
  resetPassword: async (token, password) => {
    try {
      const hashedPassword = hashPassword(password);
      const response = await api.post('/reset-password', { token, password: hashedPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al restablecer contraseña' };
    }
  }
};
