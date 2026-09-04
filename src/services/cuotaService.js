import api from './api';

// Servicio de cuotas
export const cuotaService = {
  // Obtener todas las cuotas
  getCuotas: async (params = {}) => {
    try {
      const response = await api.get('/cuotas', { params });
      return response?.data || { cuotas: [] };
    } catch (error) {
      // Si es 404 o cualquier error, devolver array vacío en lugar de lanzar error
      if (error.response?.status === 404 || !error.response) {
        return { cuotas: [] };
      }
      // Para otros errores, también devolver array vacío para evitar loops
      console.error('Error obteniendo cuotas:', error);
      return { cuotas: [] };
    }
  },

  // Obtener cuota por ID
  getCuotaById: async (id) => {
    try {
      const response = await api.get(`/cuotas/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener cuota' };
    }
  },

  // Crear nueva cuota
  createCuota: async (cuotaData) => {
    try {
      const response = await api.post('/cuotas', cuotaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear cuota' };
    }
  },

  // Actualizar cuota
  updateCuota: async (id, cuotaData) => {
    try {
      const response = await api.put(`/cuotas/${id}`, cuotaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar cuota' };
    }
  },

  // Eliminar/cancelar cuota. { permanente: true } borra el plan en la base; los gastos ya creados se conservan (sin vínculo al plan).
  deleteCuota: async (id, options = {}) => {
    try {
      const params = {};
      if (options.permanente) params.permanente = 'true';
      const response = await api.delete(`/cuotas/${id}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar cuota' };
    }
  },

  // Registrar pago de cuota
  pagarCuota: async (id, pagoData) => {
    try {
      const response = await api.post(`/cuotas/${id}/pagar`, pagoData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al registrar pago' };
    }
  },

  // Obtener próximas cuotas a vencer
  getProximasCuotas: async (dias = 30) => {
    try {
      const response = await api.get('/cuotas/proximas', { params: { dias } });
      return response.data || { cuotas: [] };
    } catch (error) {
      // Si es 404, devolver array vacío en lugar de error
      if (error.response?.status === 404) {
        return { cuotas: [] };
      }
      throw error.response?.data || { message: 'Error al obtener próximas cuotas' };
    }
  },

  // Obtener resumen de cuotas
  getResumenCuotas: async () => {
    try {
      const response = await api.get('/cuotas/resumen');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener resumen de cuotas' };
    }
  }
};
