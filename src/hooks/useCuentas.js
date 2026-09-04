import { useState, useEffect, useCallback } from 'react';
import { cuentaService } from '../services/cuentaService';

export function useCuentas({ moneda, esActiva } = {}) {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCuentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (moneda) params.moneda = moneda;
      if (esActiva !== undefined) params.esActiva = esActiva;
      const res = await cuentaService.getCuentas(params);
      const data = res?.data?.data ?? res?.data ?? res;
      const list = data?.cuentas ?? [];
      setCuentas(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || 'Error al cargar cuentas');
      setCuentas([]);
    } finally {
      setLoading(false);
    }
  }, [moneda, esActiva]);

  useEffect(() => {
    fetchCuentas();
  }, [fetchCuentas]);

  const cuentaById = useCallback(
    (id) => {
      if (!id) return null;
      return cuentas.find((c) => c._id === id) || null;
    },
    [cuentas]
  );

  return { cuentas, loading, error, refetch: fetchCuentas, cuentaById };
}
