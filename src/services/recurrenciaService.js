import api from './api';

// Servicio de recurrencias
export const recurrenciaService = {
  // ========== INGRESOS RECURRENTES ==========
  
  // Obtener todos los ingresos recurrentes
  getIngresosRecurrentes: async () => {
    try {
      const response = await api.get('/recurrencias/ingresos');
      return response?.data || { ingresosRecurrentes: [] };
    } catch (error) {
      // Si es 404 o cualquier error, devolver array vacío en lugar de lanzar error
      if (error.response?.status === 404 || !error.response) {
        return { ingresosRecurrentes: [] };
      }
      // Para otros errores, también devolver array vacío para evitar loops
      console.error('Error obteniendo ingresos recurrentes:', error);
      return { ingresosRecurrentes: [] };
    }
  },

  // Obtener ingreso recurrente por ID
  getIngresoRecurrenteById: async (id) => {
    try {
      const response = await api.get(`/recurrencias/ingresos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener ingreso recurrente' };
    }
  },

  // Crear nuevo ingreso recurrente
  createIngresoRecurrente: async (ingresoRecurrenteData) => {
    try {
      const response = await api.post('/recurrencias/ingresos', ingresoRecurrenteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear ingreso recurrente' };
    }
  },

  // Actualizar ingreso recurrente
  updateIngresoRecurrente: async (id, ingresoRecurrenteData) => {
    try {
      const response = await api.put(`/recurrencias/ingresos/${id}`, ingresoRecurrenteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar ingreso recurrente' };
    }
  },

  // Eliminar ingreso recurrente
  deleteIngresoRecurrente: async (id) => {
    try {
      const response = await api.delete(`/recurrencias/ingresos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar ingreso recurrente' };
    }
  },

  // ========== GASTOS RECURRENTES ==========

  // Obtener todos los gastos recurrentes
  getGastosRecurrentes: async () => {
    try {
      const response = await api.get('/recurrencias/gastos');
      return response?.data || { gastosRecurrentes: [] };
    } catch (error) {
      // Si es 404 o cualquier error, devolver array vacío en lugar de lanzar error
      if (error.response?.status === 404 || !error.response) {
        return { gastosRecurrentes: [] };
      }
      // Para otros errores, también devolver array vacío para evitar loops
      console.error('Error obteniendo gastos recurrentes:', error);
      return { gastosRecurrentes: [] };
    }
  },

  // Obtener gasto recurrente por ID
  getGastoRecurrenteById: async (id) => {
    try {
      const response = await api.get(`/recurrencias/gastos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener gasto recurrente' };
    }
  },

  // Crear nuevo gasto recurrente
  createGastoRecurrente: async (gastoRecurrenteData) => {
    try {
      const response = await api.post('/recurrencias/gastos', gastoRecurrenteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear gasto recurrente' };
    }
  },

  // Actualizar gasto recurrente
  updateGastoRecurrente: async (id, gastoRecurrenteData) => {
    try {
      const response = await api.put(`/recurrencias/gastos/${id}`, gastoRecurrenteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar gasto recurrente' };
    }
  },

  // Eliminar gasto recurrente
  deleteGastoRecurrente: async (id) => {
    try {
      const response = await api.delete(`/recurrencias/gastos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar gasto recurrente' };
    }
  },

  // ========== GENERACIÓN MANUAL ==========

  // Generar transacción manualmente
  generarTransaccion: async (tipo, id) => {
    try {
      const response = await api.post(`/recurrencias/generar/${tipo}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al generar transacción' };
    }
  }
};
