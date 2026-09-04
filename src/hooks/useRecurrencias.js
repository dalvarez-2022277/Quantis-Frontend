import { useState, useEffect, useCallback, useRef } from 'react';
import { recurrenciaService } from '../services/recurrenciaService';

/**
 * Hook personalizado para gestionar recurrencias
 */
export const useRecurrencias = (tipo = 'ingreso') => {
  const [recurrencias, setRecurrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLoadingRef = useRef(false);
  const tipoRef = useRef(tipo);

  const loadRecurrencias = useCallback(async () => {
    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = tipo === 'ingreso'
        ? await recurrenciaService.getIngresosRecurrentes()
        : await recurrenciaService.getGastosRecurrentes();
      
      // Asegurar que siempre tenemos un array, incluso si response.data es undefined
      const datos = response?.data || response || {};
      const recurrenciasData = datos.ingresosRecurrentes || datos.gastosRecurrentes || [];
      setRecurrencias(Array.isArray(recurrenciasData) ? recurrenciasData : []);
    } catch (err) {
      // En caso de error, establecer array vacío y no mostrar error para evitar loops
      console.error('Error cargando recurrencias:', err);
      setRecurrencias([]);
      // Solo mostrar error si es un error crítico (no 404)
      if (err.response?.status && err.response.status !== 404) {
        setError('Error al cargar recurrencias. Por favor, intenta de nuevo.');
      }
    } finally {
      // SIEMPRE establecer loading en false
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [tipo]);

  useEffect(() => {
    // Cargar siempre al montar o cuando cambia el tipo
    if (tipoRef.current !== tipo) {
      tipoRef.current = tipo;
    }
    loadRecurrencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]); // Solo dependemos del tipo

  const createRecurrencia = useCallback(async (data) => {
    try {
      setError(null);
      const response = tipo === 'ingreso'
        ? await recurrenciaService.createIngresoRecurrente(data)
        : await recurrenciaService.createGastoRecurrente(data);
      
      await loadRecurrencias();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al crear recurrencia';
      setError(errorMsg);
      throw err;
    }
  }, [tipo, loadRecurrencias]);

  const updateRecurrencia = useCallback(async (id, data) => {
    try {
      setError(null);
      const response = tipo === 'ingreso'
        ? await recurrenciaService.updateIngresoRecurrente(id, data)
        : await recurrenciaService.updateGastoRecurrente(id, data);
      
      await loadRecurrencias();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al actualizar recurrencia';
      setError(errorMsg);
      throw err;
    }
  }, [tipo, loadRecurrencias]);

  const deleteRecurrencia = useCallback(async (id) => {
    try {
      setError(null);
      const response = tipo === 'ingreso'
        ? await recurrenciaService.deleteIngresoRecurrente(id)
        : await recurrenciaService.deleteGastoRecurrente(id);
      
      await loadRecurrencias();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al eliminar recurrencia';
      setError(errorMsg);
      throw err;
    }
  }, [tipo, loadRecurrencias]);

  const toggleActivo = useCallback(async (id, esActivo) => {
    try {
      setError(null);
      await updateRecurrencia(id, { esActivo: !esActivo });
    } catch (err) {
      const errorMsg = err.message || 'Error al cambiar estado';
      setError(errorMsg);
      throw err;
    }
  }, [updateRecurrencia]);

  const generarTransaccion = useCallback(async (id) => {
    try {
      setError(null);
      const response = await recurrenciaService.generarTransaccion(tipo, id);
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Error al generar transacción';
      setError(errorMsg);
      throw err;
    }
  }, [tipo]);

  return {
    recurrencias,
    loading,
    error,
    loadRecurrencias,
    createRecurrencia,
    updateRecurrencia,
    deleteRecurrencia,
    toggleActivo,
    generarTransaccion
  };
};
