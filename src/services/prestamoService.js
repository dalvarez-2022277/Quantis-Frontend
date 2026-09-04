import api from './api';

// Servicio de préstamos
export const prestamoService = {
  // Obtener todos los préstamos
  getPrestamos: async (params = {}) => {
    try {
      const response = await api.get('/prestamos', { params });
      return response?.data || { prestamos: [] };
    } catch (error) {
      // Si es 404 o cualquier error, devolver array vacío en lugar de lanzar error
      if (error.response?.status === 404 || !error.response) {
        return { prestamos: [] };
      }
      // Para otros errores, también devolver array vacío para evitar loops
      console.error('Error obteniendo préstamos:', error);
      return { prestamos: [] };
    }
  },

  // Obtener préstamo por ID
  getPrestamoById: async (id) => {
    try {
      const response = await api.get(`/prestamos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener préstamo' };
    }
  },

  // Crear nuevo préstamo
  createPrestamo: async (prestamoData) => {
    try {
      const response = await api.post('/prestamos', prestamoData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear préstamo' };
    }
  },

  // Actualizar préstamo
  updatePrestamo: async (id, prestamoData) => {
    try {
      const response = await api.put(`/prestamos/${id}`, prestamoData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar préstamo' };
    }
  },

  // Eliminar préstamo
  deletePrestamo: async (id) => {
    try {
      const response = await api.delete(`/prestamos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar préstamo' };
    }
  },

  // Registrar pago de préstamo
  pagarPrestamo: async (id, pagoData) => {
    try {
      const response = await api.post(`/prestamos/${id}/pagar`, pagoData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al registrar pago' };
    }
  },

  // Obtener resumen de préstamos
  getResumenPrestamos: async () => {
    try {
      const response = await api.get('/prestamos/resumen');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener resumen de préstamos' };
    }
  }
};
