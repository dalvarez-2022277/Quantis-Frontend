import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { gastoService } from '../services/gastoService';
import { ingresoService } from '../services/ingresoService';
import { DEFAULT_INGRESO_TYPES, DEFAULT_GASTO_CATEGORIES } from '../utils/iconRegistry';

// Suma la cantidad de registros de un resumen (nestResumenGastos/Ingresos:
// [{_id, totales: [{moneda, total, cantidad}]}]) en un mapa {_id: cantidadTotal},
// sumando entre monedas ya que el orden de uso no distingue GTQ de USD.
function contarPorId(resumenRows) {
  const mapa = {};
  (resumenRows || []).forEach((row) => {
    const id = row._id;
    if (id == null) return;
    const cantidad = (row.totales || []).reduce((acc, t) => acc + (t.cantidad || 0), 0);
    mapa[id] = (mapa[id] || 0) + cantidad;
  });
  return mapa;
}

// Hook para manejar tipos dinámicos de ingreso/gasto desde /api/tipos
export const useTiposTransaccion = () => {
  const [tiposIngreso, setTiposIngreso] = useState([]);
  const [tiposGasto, setTiposGasto] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Cuántos gastos/ingresos existen por categoría/tipo (todo el historial, sin
  // filtro de fecha): sirve para ordenar los chips por uso, el más usado primero.
  const [conteoPorCategoriaGasto, setConteoPorCategoriaGasto] = useState({});
  const [conteoPorTipoIngreso, setConteoPorTipoIngreso] = useState({});

  const loadConteos = useCallback(async () => {
    try {
      const [resGastos, resIngresos] = await Promise.all([
        gastoService.getResumenGastos().catch(() => null),
        ingresoService.getResumenIngresos().catch(() => null)
      ]);
      const filasGastos = resGastos?.data?.resumen ?? resGastos?.resumen ?? [];
      const filasIngresos = resIngresos?.data?.resumen ?? resIngresos?.resumen ?? [];
      setConteoPorCategoriaGasto(contarPorId(filasGastos));
      setConteoPorTipoIngreso(contarPorId(filasIngresos));
    } catch (_) {
      // silencioso: el conteo solo afecta el orden de los chips, no es crítico
    }
  }, []);

  const loadTipos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [ingresoRes, gastoRes] = await Promise.all([
        api.get('/tipos', { params: { tipo: 'ingreso' } }).catch(() => null),
        api.get('/tipos', { params: { tipo: 'gasto' } }).catch(() => null)
      ]);

      if (ingresoRes?.data?.data?.tipos?.length) {
        setTiposIngreso(ingresoRes.data.data.tipos);
      } else {
        // Fallback a tipos por defecto si falla la API
        setTiposIngreso(
          DEFAULT_INGRESO_TYPES.map(t => ({
            ...t,
            isDefault: true
          }))
        );
      }

      if (gastoRes?.data?.data?.tipos?.length) {
        setTiposGasto(gastoRes.data.data.tipos);
      } else {
        setTiposGasto(
          DEFAULT_GASTO_CATEGORIES.map(t => ({
            ...t,
            isDefault: true
          }))
        );
      }
    } catch (err) {
      console.error('Error cargando tipos de transacción:', err);
      setError(err?.response?.data?.message || 'Error al cargar tipos');

      // Fallback en caso de error general
      setTiposIngreso(
        DEFAULT_INGRESO_TYPES.map(t => ({
          ...t,
          isDefault: true
        }))
      );
      setTiposGasto(
        DEFAULT_GASTO_CATEGORIES.map(t => ({
          ...t,
          isDefault: true
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTipos();
    loadConteos();
  }, [loadTipos, loadConteos]);

  const createTipo = useCallback(async ({ tipo, label, iconKey, color }) => {
    try {
      setError(null);
      const response = await api.post('/tipos', {
        tipo,
        label,
        iconKey: iconKey || null,
        color: color || null
      });

      const nuevo = response.data?.data;

      if (!nuevo) {
        return null;
      }

      if (tipo === 'ingreso') {
        setTiposIngreso(prev => [...prev, nuevo]);
      } else if (tipo === 'gasto') {
        setTiposGasto(prev => [...prev, nuevo]);
      }

      return nuevo;
    } catch (err) {
      console.error('Error creando tipo de transacción:', err);
      const message = err?.response?.data?.message || 'Error al crear tipo';
      setError(message);
      throw err;
    }
  }, []);

  const createTipoIngreso = useCallback(
    async ({ label, iconKey, color }) => {
      return createTipo({ tipo: 'ingreso', label, iconKey, color });
    },
    [createTipo]
  );

  const createTipoGasto = useCallback(
    async ({ label, iconKey, color }) => {
      return createTipo({ tipo: 'gasto', label, iconKey, color });
    },
    [createTipo]
  );

  const deleteTipoIngreso = useCallback(async (id) => {
    try {
      setError(null);
      await api.delete(`/tipos/${id}`);
      setTiposIngreso(prev => prev.filter(t => t.id !== id && t._id !== id));
    } catch (err) {
      console.error('Error eliminando tipo de ingreso:', err);
      setError(err?.response?.data?.message || 'Error al eliminar');
      throw err;
    }
  }, []);

  const deleteTipoGasto = useCallback(async (id) => {
    try {
      setError(null);
      await api.delete(`/tipos/${id}`);
      setTiposGasto(prev => prev.filter(t => t.id !== id && t._id !== id));
    } catch (err) {
      console.error('Error eliminando tipo de gasto:', err);
      setError(err?.response?.data?.message || 'Error al eliminar');
      throw err;
    }
  }, []);

  return {
    tiposIngreso,
    tiposGasto,
    isLoading,
    error,
    reload: loadTipos,
    conteoPorCategoriaGasto,
    conteoPorTipoIngreso,
    reloadConteos: loadConteos,
    createTipoIngreso,
    createTipoGasto,
    deleteTipoIngreso,
    deleteTipoGasto
  };
};

