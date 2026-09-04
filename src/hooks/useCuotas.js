import { useState, useEffect, useCallback, useRef } from 'react';
import { cuotaService } from '../services/cuotaService';

/**
 * Hook personalizado para gestionar cuotas
 */
export const useCuotas = (filtros = {}) => {
  const [cuotas, setCuotas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLoadingRef = useRef(false);
  const filtrosRef = useRef(JSON.stringify(filtros));

  // Serializar filtros para comparación estable
  const filtrosSerializados = JSON.stringify(filtros);

  const loadCuotas = useCallback(async () => {
    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await cuotaService.getCuotas(filtros);
      // Asegurar que siempre tenemos un array
      const cuotasData = response?.data?.cuotas || response?.cuotas || [];
      setCuotas(Array.isArray(cuotasData) ? cuotasData : []);
    } catch (err) {
      // En caso de error, establecer array vacío y no mostrar error para evitar loops
      console.error('Error cargando cuotas:', err);
      setCuotas([]);
      // Solo mostrar error si es un error crítico (no 404)
      if (err.response?.status && err.response.status !== 404) {
        setError('Error al cargar cuotas. Por favor, intenta de nuevo.');
      }
    } finally {
      // SIEMPRE establecer loading en false
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [filtrosSerializados]);

  const loadResumen = useCallback(async () => {
    try {
      const response = await cuotaService.getResumenCuotas();
      setResumen(response.data?.resumen || null);
    } catch (err) {
      // Si hay error, establecer resumen null en lugar de causar loop
      if (err.response?.status !== 404) {
        console.error('Error cargando resumen de cuotas:', err);
      }
      setResumen(null);
    }
  }, []);

  useEffect(() => {
    // Actualizar referencia de filtros
    if (filtrosRef.current !== filtrosSerializados) {
      filtrosRef.current = filtrosSerializados;
    }
    // Cargar siempre al montar o cuando cambian los filtros
    loadCuotas();
    loadResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosSerializados]); // Solo dependemos de la serialización

  const createCuota = useCallback(async (data) => {
    try {
      setError(null);
      const response = await cuotaService.createCuota(data);
      await loadCuotas();
      await loadResumen();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al crear cuota';
      setError(errorMsg);
      throw err;
    }
  }, [loadCuotas, loadResumen]);

  const updateCuota = useCallback(async (id, data) => {
    try {
      setError(null);
      const response = await cuotaService.updateCuota(id, data);
      await loadCuotas();
      await loadResumen();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al actualizar cuota';
      setError(errorMsg);
      throw err;
    }
  }, [loadCuotas, loadResumen]);

  const deleteCuota = useCallback(async (id, options) => {
    try {
      setError(null);
      const response = await cuotaService.deleteCuota(id, options);
      await loadCuotas();
      await loadResumen();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al eliminar cuota';
      setError(errorMsg);
      throw err;
    }
  }, [loadCuotas, loadResumen]);

  const pagarCuota = useCallback(async (id, pagoData) => {
    try {
      setError(null);
      const response = await cuotaService.pagarCuota(id, pagoData);
      await loadCuotas();
      await loadResumen();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al registrar pago';
      setError(errorMsg);
      throw err;
    }
  }, [loadCuotas, loadResumen]);

  const getProximasCuotas = useCallback(async (dias = 30) => {
    try {
      setError(null);
      const response = await cuotaService.getProximasCuotas(dias);
      return response.data.cuotas || [];
    } catch (err) {
      const errorMsg = err.message || 'Error al obtener próximas cuotas';
      setError(errorMsg);
      throw err;
    }
  }, []);

  return {
    cuotas,
    resumen,
    loading,
    error,
    loadCuotas,
    loadResumen,
    createCuota,
    updateCuota,
    deleteCuota,
    pagarCuota,
    getProximasCuotas
  };
};
