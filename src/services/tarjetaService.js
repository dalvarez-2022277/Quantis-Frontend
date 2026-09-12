import api from './api';

// Servicio de tarjetas
export const tarjetaService = {
  // Obtener todas las tarjetas
  getTarjetas: async (params = {}) => {
    try {
      const response = await api.get('/tarjetas', { params });
      return response?.data || { tarjetas: [] };
    } catch (error) {
      // Si es 404 o cualquier error, devolver array vacío
      if (error.response?.status === 404 || !error.response) {
        return { tarjetas: [] };
      }
      console.error('Error obteniendo tarjetas:', error);
      return { tarjetas: [] };
    }
  },

  // Obtener tarjeta por ID
  getTarjetaById: async (id) => {
    try {
      const response = await api.get(`/tarjetas/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener tarjeta' };
    }
  },

  // Crear nueva tarjeta
  createTarjeta: async (tarjetaData) => {
    try {
      const response = await api.post('/tarjetas', tarjetaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear tarjeta' };
    }
  },

  // Actualizar tarjeta
  updateTarjeta: async (id, tarjetaData) => {
    try {
      const response = await api.put(`/tarjetas/${id}`, tarjetaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar tarjeta' };
    }
  },

  // Eliminar tarjeta
  deleteTarjeta: async (id) => {
    try {
      const response = await api.delete(`/tarjetas/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar tarjeta' };
    }
  },

  // Resumen de deuda + ciclos de corte de una tarjeta
  getResumenTarjeta: async (id, params = {}) => {
    try {
      const response = await api.get(`/tarjetas/${id}/resumen`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener resumen de la tarjeta' };
    }
  },

  // Obtener resumen de tarjetas
  getResumenTarjetas: async () => {
    try {
      const response = await api.get('/tarjetas/resumen');
      return response.data;
    } catch (error) {
      // Si es 404, devolver resumen vacío
      if (error.response?.status === 404) {
        return { resumen: null };
      }
      throw error.response?.data || { message: 'Error al obtener resumen de tarjetas' };
    }
  }
};
