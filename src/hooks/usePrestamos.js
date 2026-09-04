import { useState, useEffect, useCallback, useRef } from 'react';
import { prestamoService } from '../services/prestamoService';

/**
 * Hook personalizado para gestionar préstamos
 */
export const usePrestamos = (filtros = {}) => {
  const [prestamos, setPrestamos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLoadingRef = useRef(false);
  const filtrosRef = useRef(JSON.stringify(filtros));

  // Serializar filtros para comparación estable
  const filtrosSerializados = JSON.stringify(filtros);

  const loadPrestamos = useCallback(async () => {
    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await prestamoService.getPrestamos(filtros);
      // Asegurar que siempre tenemos un array
      const prestamosData = response?.data?.prestamos || response?.prestamos || [];
      setPrestamos(Array.isArray(prestamosData) ? prestamosData : []);
    } catch (err) {
      // En caso de error, establecer array vacío y no mostrar error para evitar loops
      console.error('Error cargando préstamos:', err);
      setPrestamos([]);
      // Solo mostrar error si es un error crítico (no 404)
      if (err.response?.status && err.response.status !== 404) {
        setError('Error al cargar préstamos. Por favor, intenta de nuevo.');
      }
    } finally {
      // SIEMPRE establecer loading en false
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [filtrosSerializados]);

  const loadResumen = useCallback(async () => {
    try {
      const response = await prestamoService.getResumenPrestamos();
      setResumen(response.data?.resumen || null);
    } catch (err) {
      // Si hay error, establecer resumen null en lugar de causar loop
      if (err.response?.status !== 404) {
        console.error('Error cargando resumen de préstamos:', err);
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
    loadPrestamos();
    loadResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosSerializados]); // Solo dependemos de la serialización

  const createPrestamo = useCallback(async (data) => {
    try {
      setError(null);
      const response = await prestamoService.createPrestamo(data);
      await loadPrestamos();
      await loadResumen();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al crear préstamo';
      setError(errorMsg);
      throw err;
    }
  }, [loadPrestamos, loadResumen]);

  const updatePrestamo = useCallback(async (id, data) => {
    try {
      setError(null);
      const response = await prestamoService.updatePrestamo(id, data);
      await loadPrestamos();
      await loadResumen();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al actualizar préstamo';
      setError(errorMsg);
      throw err;
    }
  }, [loadPrestamos, loadResumen]);

  const deletePrestamo = useCallback(async (id) => {
    try {
      setError(null);
      const response = await prestamoService.deletePrestamo(id);
      await loadPrestamos();
      await loadResumen();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al eliminar préstamo';
      setError(errorMsg);
      throw err;
    }
  }, [loadPrestamos, loadResumen]);

  const pagarPrestamo = useCallback(async (id, pagoData) => {
    try {
      setError(null);
      const response = await prestamoService.pagarPrestamo(id, pagoData);
      await loadPrestamos();
      await loadResumen();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al registrar pago';
      setError(errorMsg);
      throw err;
    }
  }, [loadPrestamos, loadResumen]);

  return {
    prestamos,
    resumen,
    loading,
    error,
    loadPrestamos,
    loadResumen,
    createPrestamo,
    updatePrestamo,
    deletePrestamo,
    pagarPrestamo
  };
};
