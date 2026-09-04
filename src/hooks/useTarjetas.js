import { useState, useEffect, useCallback, useRef } from 'react';
import { tarjetaService } from '../services/tarjetaService';

/**
 * Hook personalizado para gestionar tarjetas
 */
export const useTarjetas = (filtros = {}) => {
  const [tarjetas, setTarjetas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLoadingRef = useRef(false);
  const filtrosRef = useRef(JSON.stringify(filtros));

  // Serializar filtros para comparación estable
  const filtrosSerializados = JSON.stringify(filtros);

  const loadTarjetas = useCallback(async () => {
    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await tarjetaService.getTarjetas(filtros);
      // Asegurar que siempre tenemos un array
      const tarjetasData = response?.tarjetas || response?.data?.tarjetas || [];
      setTarjetas(Array.isArray(tarjetasData) ? tarjetasData : []);
    } catch (err) {
      // En caso de error, establecer array vacío y no mostrar error para evitar loops
      console.error('Error cargando tarjetas:', err);
      setTarjetas([]);
      // Solo mostrar error si es un error crítico (no 404)
      if (err.response?.status && err.response.status !== 404) {
        setError('Error al cargar tarjetas. Por favor, intenta de nuevo.');
      }
    } finally {
      // SIEMPRE establecer loading en false
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [filtrosSerializados]);

  const loadResumen = useCallback(async () => {
    try {
      const response = await tarjetaService.getResumenTarjetas();
      setResumen(response?.data?.resumen || response?.resumen || null);
    } catch (err) {
      // Si hay error, establecer resumen null en lugar de causar loop
      if (err.response?.status !== 404) {
        console.error('Error cargando resumen de tarjetas:', err);
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
    loadTarjetas();
    loadResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosSerializados]); // Solo dependemos de la serialización

  const createTarjeta = useCallback(async (data) => {
    try {
      setError(null);
      const response = await tarjetaService.createTarjeta(data);
      await loadTarjetas();
      await loadResumen();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al crear tarjeta';
      setError(errorMsg);
      throw err;
    }
  }, [loadTarjetas, loadResumen]);

  const updateTarjeta = useCallback(async (id, data) => {
    try {
      setError(null);
      const response = await tarjetaService.updateTarjeta(id, data);
      await loadTarjetas();
      await loadResumen();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al actualizar tarjeta';
      setError(errorMsg);
      throw err;
    }
  }, [loadTarjetas, loadResumen]);

  const deleteTarjeta = useCallback(async (id) => {
    try {
      setError(null);
      const response = await tarjetaService.deleteTarjeta(id);
      await loadTarjetas();
      await loadResumen();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al eliminar tarjeta';
      setError(errorMsg);
      throw err;
    }
  }, [loadTarjetas, loadResumen]);

  return {
    tarjetas,
    resumen,
    loading,
    error,
    loadTarjetas,
    loadResumen,
    createTarjeta,
    updateTarjeta,
    deleteTarjeta
  };
};
