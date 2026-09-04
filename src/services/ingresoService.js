import api from './api';
import { normalizeIngresoPayload } from '../lib/normalizeTransactionPayload';

// Servicio de ingresos
export const ingresoService = {
  // Obtener todos los ingresos
  getIngresos: async (params = {}) => {
    try {
      const response = await api.get('/ingresos', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener ingresos' };
    }
  },

  // Obtener ingreso por ID
  getIngresoById: async (id) => {
    try {
      const response = await api.get(`/ingresos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener ingreso' };
    }
  },

  // Crear nuevo ingreso
  createIngreso: async (ingresoData) => {
    try {
      const response = await api.post(
        '/ingresos',
        normalizeIngresoPayload(ingresoData)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear ingreso' };
    }
  },

  // Actualizar ingreso
  updateIngreso: async (id, ingresoData) => {
    try {
      const response = await api.put(
        `/ingresos/${id}`,
        normalizeIngresoPayload(ingresoData)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar ingreso' };
    }
  },

  // Eliminar ingreso
  deleteIngreso: async (id) => {
    try {
      const response = await api.delete(`/ingresos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar ingreso' };
    }
  },

  // Obtener resumen de ingresos
  getResumenIngresos: async (params = {}) => {
    try {
      const response = await api.get('/ingresos/resumen', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener resumen' };
    }
  },

  // Obtener datos rápidos para dashboard
  getDashboardIngresos: async (params = {}) => {
    try {
      const response = await api.get('/ingresos/dashboard', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener datos del dashboard' };
    }
  }
};
