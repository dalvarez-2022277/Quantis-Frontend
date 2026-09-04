import api from './api';

// Servicio de gráficos
export const graficosService = {
  // Comparación ingresos vs gastos por período
  getIngresosGastos: async (params = {}) => {
    try {
      const response = await api.get('/graficos/ingresos-gastos', { params });
      return response.data || { ingresos: [], gastos: [] };
    } catch (error) {
      // Si es 404, devolver datos vacíos en lugar de error
      if (error.response?.status === 404) {
        return { ingresos: [], gastos: [] };
      }
      throw error.response?.data || { message: 'Error al obtener datos de ingresos-gastos' };
    }
  },

  // Gastos por categoría (pie chart)
  getGastosCategoria: async (params = {}) => {
    try {
      const response = await api.get('/graficos/gastos-categoria', { params });
      return response.data || { categorias: [] };
    } catch (error) {
      // Si es 404, devolver array vacío en lugar de error
      if (error.response?.status === 404) {
        return { categorias: [] };
      }
      throw error.response?.data || { message: 'Error al obtener gastos por categoría' };
    }
  },

  // Evolución temporal de ingresos/gastos (line chart)
  getEvolucion: async (params = {}) => {
    try {
      const response = await api.get('/graficos/evolucion', { params });
      return response.data || { ingresos: [], gastos: [] };
    } catch (error) {
      // Si es 404, devolver datos vacíos en lugar de error
      if (error.response?.status === 404) {
        return { ingresos: [], gastos: [] };
      }
      throw error.response?.data || { message: 'Error al obtener evolución' };
    }
  },

  // Progreso de cuotas (bar chart)
  getCuotasProgreso: async () => {
    try {
      const response = await api.get('/graficos/cuotas-progreso');
      return response.data || { cuotas: [] };
    } catch (error) {
      // Si es 404, devolver array vacío en lugar de error
      if (error.response?.status === 404) {
        return { cuotas: [] };
      }
      throw error.response?.data || { message: 'Error al obtener progreso de cuotas' };
    }
  },

  // Progreso de préstamos
  getPrestamosProgreso: async (params = {}) => {
    try {
      const response = await api.get('/graficos/prestamos-progreso', { params });
      return response.data || { prestamos: [] };
    } catch (error) {
      // Si es 404, devolver array vacío en lugar de error
      if (error.response?.status === 404) {
        return { prestamos: [] };
      }
      throw error.response?.data || { message: 'Error al obtener progreso de préstamos' };
    }
  },

  // Datos consolidados para dashboard
  getDashboard: async (params = {}) => {
    try {
      const response = await api.get('/graficos/dashboard', { params });
      return response.data || {};
    } catch (error) {
      // Si es 404, devolver objeto vacío en lugar de error
      if (error.response?.status === 404) {
        return {};
      }
      throw error.response?.data || { message: 'Error al obtener datos del dashboard' };
    }
  }
};
