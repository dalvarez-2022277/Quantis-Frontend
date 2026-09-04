import api from './api';

// Servicio de calendario
export const calendarioService = {
  // Eventos del mes (pagos, vencimientos, ingresos)
  getEventosMes: async (mes, año, params = {}) => {
    try {
      const response = await api.get(`/calendario/${mes}/${año}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener eventos del mes' };
    }
  },

  // Próximos eventos (próximos 30 días)
  getProximosEventos: async (params = {}) => {
    try {
      const response = await api.get('/calendario/proximos', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener próximos eventos' };
    }
  },

  // Vencimientos próximos
  getVencimientos: async (params = {}) => {
    try {
      const response = await api.get('/calendario/vencimientos', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener vencimientos' };
    }
  }
};
