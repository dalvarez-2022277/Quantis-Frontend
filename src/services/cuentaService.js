import api from './api';

export const cuentaService = {
  getCuentas: async (params = {}) => {
    try {
      const response = await api.get('/cuentas', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener cuentas' };
    }
  },

  /** Cuántos gastos/ingresos se perderían si se elimina esta cuenta (para confirmar antes de borrar) */
  getMovimientosCount: async (id) => {
    try {
      const response = await api.get(`/cuentas/${id}/movimientos-count`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al contar movimientos de la cuenta' };
    }
  },

  /** Saldos por cuenta (ingresos − gastos) por moneda; incluye fila sin cuenta */
  getBalances: async () => {
    try {
      const response = await api.get('/cuentas/balances');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener saldos por cuenta' };
    }
  },

  getCuentaById: async (id) => {
    try {
      const response = await api.get(`/cuentas/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener la cuenta' };
    }
  },

  createCuenta: async (data) => {
    try {
      const response = await api.post('/cuentas', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear la cuenta' };
    }
  },

  updateCuenta: async (id, data) => {
    try {
      const response = await api.put(`/cuentas/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar la cuenta' };
    }
  },

  deleteCuenta: async (id) => {
    try {
      const response = await api.delete(`/cuentas/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al desactivar la cuenta' };
    }
  }
};
