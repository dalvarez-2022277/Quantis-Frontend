import { useState, useEffect, useCallback } from 'react';
import { graficosService } from '../services/graficosService';

/**
 * Hook personalizado para datos de gráficos
 */
export const useGraficos = () => {
  const [datosDashboard, setDatosDashboard] = useState(null);
  const [ingresosGastos, setIngresosGastos] = useState(null);
  const [gastosCategoria, setGastosCategoria] = useState(null);
  const [evolucion, setEvolucion] = useState(null);
  const [cuotasProgreso, setCuotasProgreso] = useState(null);
  const [prestamosProgreso, setPrestamosProgreso] = useState(null);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  const setLoadingState = useCallback((key, value) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  const loadDashboard = useCallback(async (params = {}) => {
    // Evitar múltiples llamadas si ya está cargando
    if (loading.dashboard) {
      return;
    }

    try {
      setLoadingState('dashboard', true);
      setError(null);
      const response = await graficosService.getDashboard(params);
      setDatosDashboard(response.data || null);
    } catch (err) {
      // Solo establecer error si no es 404
      if (err.response?.status !== 404) {
        setError(err.message || 'Error al cargar datos del dashboard');
        console.error('Error cargando dashboard:', err);
      } else {
        setDatosDashboard(null);
      }
    } finally {
      setLoadingState('dashboard', false);
    }
  }, [setLoadingState, loading.dashboard]);

  const loadIngresosGastos = useCallback(async (params = {}) => {
    // Evitar múltiples llamadas si ya está cargando
    if (loading.ingresosGastos) {
      return;
    }

    try {
      setLoadingState('ingresosGastos', true);
      setError(null);
      const response = await graficosService.getIngresosGastos(params);
      setIngresosGastos(response.data || null);
    } catch (err) {
      // Solo establecer error si no es 404
      if (err.response?.status !== 404) {
        setError(err.message || 'Error al cargar datos de ingresos-gastos');
        console.error('Error cargando ingresos-gastos:', err);
      } else {
        setIngresosGastos(null);
      }
    } finally {
      setLoadingState('ingresosGastos', false);
    }
  }, [setLoadingState, loading.ingresosGastos]);

  const loadGastosCategoria = useCallback(async (params = {}) => {
    // Evitar múltiples llamadas si ya está cargando
    if (loading.gastosCategoria) {
      return;
    }

    try {
      setLoadingState('gastosCategoria', true);
      setError(null);
      const response = await graficosService.getGastosCategoria(params);
      setGastosCategoria(response.data || null);
    } catch (err) {
      // Solo establecer error si no es 404
      if (err.response?.status !== 404) {
        setError(err.message || 'Error al cargar gastos por categoría');
        console.error('Error cargando gastos por categoría:', err);
      } else {
        setGastosCategoria(null);
      }
    } finally {
      setLoadingState('gastosCategoria', false);
    }
  }, [setLoadingState, loading.gastosCategoria]);

  const loadEvolucion = useCallback(async (params = {}) => {
    // Evitar múltiples llamadas si ya está cargando
    if (loading.evolucion) {
      return;
    }

    try {
      setLoadingState('evolucion', true);
      setError(null);
      const response = await graficosService.getEvolucion(params);
      setEvolucion(response.data || null);
    } catch (err) {
      // Solo establecer error si no es 404
      if (err.response?.status !== 404) {
        setError(err.message || 'Error al cargar evolución');
        console.error('Error cargando evolución:', err);
      } else {
        setEvolucion(null);
      }
    } finally {
      setLoadingState('evolucion', false);
    }
  }, [setLoadingState, loading.evolucion]);

  const loadCuotasProgreso = useCallback(async () => {
    // Evitar múltiples llamadas si ya está cargando
    if (loading.cuotasProgreso) {
      return;
    }

    try {
      setLoadingState('cuotasProgreso', true);
      setError(null);
      const response = await graficosService.getCuotasProgreso();
      setCuotasProgreso(response.data || null);
    } catch (err) {
      // Solo establecer error si no es 404
      if (err.response?.status !== 404) {
        setError(err.message || 'Error al cargar progreso de cuotas');
        console.error('Error cargando progreso de cuotas:', err);
      } else {
        setCuotasProgreso(null);
      }
    } finally {
      setLoadingState('cuotasProgreso', false);
    }
  }, [setLoadingState, loading.cuotasProgreso]);

  const loadPrestamosProgreso = useCallback(async (params = {}) => {
    // Evitar múltiples llamadas si ya está cargando
    if (loading.prestamosProgreso) {
      return;
    }

    try {
      setLoadingState('prestamosProgreso', true);
      setError(null);
      const response = await graficosService.getPrestamosProgreso(params);
      setPrestamosProgreso(response.data || null);
    } catch (err) {
      // Solo establecer error si no es 404
      if (err.response?.status !== 404) {
        setError(err.message || 'Error al cargar progreso de préstamos');
        console.error('Error cargando progreso de préstamos:', err);
      } else {
        setPrestamosProgreso(null);
      }
    } finally {
      setLoadingState('prestamosProgreso', false);
    }
  }, [setLoadingState, loading.prestamosProgreso]);

  return {
    datosDashboard,
    ingresosGastos,
    gastosCategoria,
    evolucion,
    cuotasProgreso,
    prestamosProgreso,
    loading,
    error,
    loadDashboard,
    loadIngresosGastos,
    loadGastosCategoria,
    loadEvolucion,
    loadCuotasProgreso,
    loadPrestamosProgreso
  };
};
