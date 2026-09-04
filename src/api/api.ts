import CryptoJS from 'crypto-js';
import api, { apiUrl, backendUrl } from './httpClient.js';

export const getAvatarUrl = (avatarPath: string, timestamp?: number): string => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;

  let url = '';
  if (avatarPath.startsWith('/api/')) {
    url = `${backendUrl}${avatarPath}`;
  } else {
    url = `${backendUrl}/${avatarPath}`;
  }

  if (timestamp) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}t=${timestamp}`;
  }

  return url;
};

export const getUploadAvatarUrl = (): string => {
  return `${apiUrl}/auth/upload-avatar`;
};

const hashPassword = (password: string): string => {
  const salt = import.meta.env.VITE_PASSWORD_SALT || 'haspasswordsfx';
  return CryptoJS.SHA256(password + salt).toString();
};

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const hashedCredentials = {
      email: credentials.email,
      password: hashPassword(credentials.password)
    };
    const response = await api.post('/auth/login', hashedCredentials);
    return response.data;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    currency?: string;
  }) => {
    const hashedUserData = {
      ...userData,
      password: hashPassword(userData.password)
    };
    const response = await api.post('/auth/register', hashedUserData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (userData: {
    name?: string;
    currency?: string;
    /** ID de cuenta activa; cadena vacía o null quita la predeterminada */
    cuentaDefaultId?: string | null;
  }) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteAvatar: async () => {
    const response = await api.delete('/auth/delete-avatar');
    return response.data;
  },

  verifyToken: async (token: string) => {
    const response = await api.post('/auth/verify-token', { token });
    return response.data;
  }
};

export const feedbackApi = {
  submit: async (payload: {
    type: string;
    title: string;
    message: string;
    meta?: Record<string, unknown>;
  }) => {
    const response = await api.post('/feedback', payload);
    return response.data;
  },

  adminList: async (params?: {
    status?: string;
    type?: string;
    q?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/admin/feedback', { params });
    return response.data;
  },

  adminPatch: async (
    id: string,
    body: { status?: string; adminNote?: string; markOpened?: boolean }
  ) => {
    const response = await api.patch(`/admin/feedback/${id}`, body);
    return response.data;
  }
};

export default api;
