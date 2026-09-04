import api from './api';
import { normalizeGastoPayload } from '../lib/normalizeTransactionPayload';

// Servicio de gastos
export const gastoService = {
  // Obtener todos los gastos
  getGastos: async (params = {}) => {
    try {
      const response = await api.get('/gastos', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener gastos' };
    }
  },

  // Obtener gasto por ID
  getGastoById: async (id) => {
    try {
      const response = await api.get(`/gastos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener gasto' };
    }
  },

  // Crear nuevo gasto
  createGasto: async (gastoData) => {
    try {
      const response = await api.post(
        '/gastos',
        normalizeGastoPayload(gastoData)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear gasto' };
    }
  },

  // Actualizar gasto
  updateGasto: async (id, gastoData) => {
    try {
      const response = await api.put(
        `/gastos/${id}`,
        normalizeGastoPayload(gastoData)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar gasto' };
    }
  },

  // Eliminar gasto
  deleteGasto: async (id) => {
    try {
      const response = await api.delete(`/gastos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar gasto' };
    }
  },

  // Obtener resumen de gastos
  getResumenGastos: async (params = {}) => {
    try {
      const response = await api.get('/gastos/resumen', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener resumen' };
    }
  },

  // Obtener datos rápidos para dashboard
  getDashboardGastos: async (params = {}) => {
    try {
      const response = await api.get('/gastos/dashboard', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener datos del dashboard' };
    }
  }
};
