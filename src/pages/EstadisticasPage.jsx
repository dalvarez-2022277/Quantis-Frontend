import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import ChartContainer from '../components/ChartContainer';
import { useTheme } from '../contexts/ThemeContext';
import { useCuentas } from '../hooks/useCuentas';
import { graficosService } from '../services/graficosService';
import { formatCurrency } from '../utils/currencyUtils';
import {
  getBarChartOption,
  getAreaChartOption,
  getChartColors,
  getGastosCategoriaColors
} from '../utils/chartConfig';

const CATEGORIA_LABELS = { alimentacion: 'Alimentación', transporte: 'Transporte', otros: 'Otros' };
const categoriaLabel = (c) => CATEGORIA_LABELS[c] || c;
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const PERIODOS = [
  { id: 'mes', label: 'Este mes' },
  { id: 'mesAnterior', label: 'Mes anterior' },
  { id: '3m', label: '3 meses' },
  { id: '6m', label: '6 meses' },
  { id: 'ano', label: 'Este año' },
  { id: 'todo', label: 'Todo' },
  { id: 'personalizado', label: 'Personalizado' }
];

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
};
const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Rango del período seleccionado + el período anterior equivalente (para comparar), y cuántos meses pedirle a la evolución mensual. */
function computePeriodRanges(periodo, custom) {
  const hoy = new Date();
  switch (periodo) {
    case 'personalizado': {
      if (!custom?.inicio || !custom?.fin) {
        return { actual: {}, anterior: null, meses: 6 };
      }
      const ini = new Date(`${custom.inicio}T00:00:00`);
      const fin = new Date(`${custom.fin}T00:00:00`);
      const dias = Math.max(1, Math.round((fin - ini) / 86400000) + 1);
      const finAnt = new Date(ini);
      finAnt.setDate(finAnt.getDate() - 1);
      const iniAnt = new Date(finAnt);
      iniAnt.setDate(iniAnt.getDate() - (dias - 1));
      const mesesSpan = Math.max(2, Math.ceil(dias / 30) + 1);
      return {
        actual: { fechaInicio: custom.inicio, fechaFin: custom.fin },
        anterior: { fechaInicio: toISODate(iniAnt), fechaFin: toISODate(finAnt) },
        meses: Math.min(24, mesesSpan)
      };
    }
    case 'mes': {
      const mesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      return {
        actual: { fechaInicio: toISODate(startOfMonth(hoy)), fechaFin: toISODate(hoy) },
        anterior: { fechaInicio: toISODate(startOfMonth(mesAnt)), fechaFin: toISODate(endOfMonth(mesAnt)) },
        meses: 6
      };
    }
    case 'mesAnterior': {
      const mesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const mesAnt2 = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
      return {
        actual: { fechaInicio: toISODate(startOfMonth(mesAnt)), fechaFin: toISODate(endOfMonth(mesAnt)) },
        anterior: { fechaInicio: toISODate(startOfMonth(mesAnt2)), fechaFin: toISODate(endOfMonth(mesAnt2)) },
        meses: 6
      };
    }
    case '3m': {
      const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
      const iniAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
      const finAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 0);
      finAnt.setHours(23, 59, 59, 999);
      return {
        actual: { fechaInicio: toISODate(ini), fechaFin: toISODate(hoy) },
        anterior: { fechaInicio: toISODate(iniAnt), fechaFin: toISODate(finAnt) },
        meses: 6
      };
    }
    case '6m': {
      const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
      const iniAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
      const finAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 0);
      finAnt.setHours(23, 59, 59, 999);
      return {
        actual: { fechaInicio: toISODate(ini), fechaFin: toISODate(hoy) },
        anterior: { fechaInicio: toISODate(iniAnt), fechaFin: toISODate(finAnt) },
        meses: 12
      };
    }
    case 'ano': {
      const ini = new Date(hoy.getFullYear(), 0, 1);
      const iniAnt = new Date(hoy.getFullYear() - 1, 0, 1);
      const finAnt = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
      finAnt.setHours(23, 59, 59, 999);
      return {
        actual: { fechaInicio: toISODate(ini), fechaFin: toISODate(hoy) },
        anterior: { fechaInicio: toISODate(iniAnt), fechaFin: toISODate(finAnt) },
        meses: 12
      };
    }
    case 'todo':
    default:
      return { actual: {}, anterior: null, meses: 24 };
  }
}

/** Variación % entre dos totales; null si no hay base para comparar. */
function variacion(actual, anterior) {
  if (anterior == null) return null;
  if (anterior === 0) return actual === 0 ? 0 : null;
  return ((actual - anterior) / anterior) * 100;
}

const KpiCard = ({ label, valor, moneda, pct, invertido, Icon, colorClass }) => {
  const pctValida = pct != null && Number.isFinite(pct);
  const subiendo = pctValida && pct > 0.5;
  const bajando = pctValida && pct < -0.5;
  const esBueno = invertido ? bajando : subiendo;
  const esMalo = invertido ? subiendo : bajando;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">{label}</p>
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums truncate">
        {formatCurrency(valor, moneda)}
      </p>
      {pctValida && (
        <p className={`mt-1 text-xs font-medium flex items-center gap-1 ${esBueno ? 'text-q-income' : esMalo ? 'text-q-expense' : 'text-gray-400 dark:text-gray-500'}`}>
          {subiendo ? <ArrowUpIcon className="w-3 h-3" /> : bajando ? <ArrowDownIcon className="w-3 h-3" /> : null}
          {Math.abs(pct).toFixed(0)}% vs período anterior
        </p>
      )}
    </div>
  );
};

/**
 * Estadísticas: filtros de período, cuenta y moneda; KPIs comparados contra
 * el período anterior; gastos por categoría como ranking (barras
 * horizontales, más claro que una dona para "en qué gasto más"); evolución
 * mensual de ingresos/gastos. Reutiliza graficosService/ChartContainer/
 * chartConfig ya existentes en el proyecto.
 */
const EstadisticasPage = () => {
  const { darkMode } = useTheme();
  const { cuentas } = useCuentas({ esActiva: 'true' });
  const [periodo, setPeriodo] = useState('mes');
  const [customInicio, setCustomInicio] = useState('');
  const [customFin, setCustomFin] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [moneda, setMoneda] = useState('GTQ');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actual, setActual] = useState({ ingresos: 0, gastos: 0 });
  const [anterior, setAnterior] = useState({ ingresos: 0, gastos: 0 });
  const [categorias, setCategorias] = useState([]);
  const [evolucion, setEvolucion] = useState({ ingresos: [], gastos: [] });
  const [metodosPago, setMetodosPago] = useState([]);
  const [cuotasActivas, setCuotasActivas] = useState([]);
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  const isNarrow = windowWidth < 640;

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Una cuenta específica ya tiene su propia moneda fija: el toggle Q/$ solo
  // aplica a "todas las cuentas" (donde sí puede haber ambas monedas).
  const cuentaSeleccionada = cuentaId ? cuentas.find((c) => c._id === cuentaId) : null;
  const monedaEfectiva = cuentaSeleccionada ? cuentaSeleccionada.moneda : moneda;

  const rangos = useMemo(
    () => computePeriodRanges(periodo, { inicio: customInicio, fin: customFin }),
    [periodo, customInicio, customFin]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const filtroBase = { moneda: monedaEfectiva, ...(cuentaId ? { cuentaId } : {}) };
        const sum = (rows) => (rows || []).reduce((acc, r) => acc + (Number(r.total) || 0), 0);

        const [igActual, igAnterior, gc, ev, mp, cp] = await Promise.all([
          graficosService.getIngresosGastos({ ...filtroBase, ...rangos.actual }),
          rangos.anterior
            ? graficosService.getIngresosGastos({ ...filtroBase, ...rangos.anterior })
            : Promise.resolve(null),
          graficosService.getGastosCategoria({ ...filtroBase, ...rangos.actual }),
          graficosService.getEvolucion({ ...filtroBase, meses: rangos.meses }),
          graficosService.getGastosMetodoPago({ ...filtroBase, ...rangos.actual }),
          graficosService.getCuotasProgreso()
        ]);
        if (cancelled) return;

        const igActualData = igActual?.data ?? igActual ?? {};
        setActual({ ingresos: sum(igActualData.ingresos), gastos: sum(igActualData.gastos) });

        if (igAnterior) {
          const igAnteriorData = igAnterior?.data ?? igAnterior ?? {};
          setAnterior({ ingresos: sum(igAnteriorData.ingresos), gastos: sum(igAnteriorData.gastos) });
        } else {
          setAnterior(null);
        }

        const gcData = gc?.data ?? gc ?? {};
        setCategorias(gcData.categorias || []);

        const evData = ev?.data ?? ev ?? {};
        setEvolucion({ ingresos: evData.ingresos || [], gastos: evData.gastos || [] });

        const mpData = mp?.data ?? mp ?? {};
        setMetodosPago(mpData.metodos || []);

        const cpData = cp?.data ?? cp ?? {};
        setCuotasActivas((cpData.cuotas || []).filter((c) => c.moneda === monedaEfectiva));
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Error al cargar estadísticas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [periodo, cuentaId, monedaEfectiva, rangos]);

  const balanceActual = actual.ingresos - actual.gastos;
  const balanceAnterior = anterior ? anterior.ingresos - anterior.gastos : null;

  const gastoEfectivo = metodosPago.find((m) => m._id === 'efectivo')?.total || 0;
  const gastoCredito = metodosPago.find((m) => m._id === 'tarjeta_credito')?.total || 0;
  const totalMetodos = gastoEfectivo + gastoCredito;

  const gastosCategoriaOption = useMemo(() => {
    if (!categorias.length) return null;
    const ordenadas = [...categorias].reverse(); // ECharts dibuja el primero abajo: se invierte para que el mayor quede arriba
    const palette = getGastosCategoriaColors(darkMode, categorias.length).reverse();
    return {
      ...getBarChartOption(darkMode),
      grid: { left: isNarrow ? '30%' : '22%', right: '12%', top: '4%', bottom: '4%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0];
          return `${p.name}<br/>${formatCurrency(p.value, monedaEfectiva)}`;
        }
      },
      xAxis: { type: 'value', axisLabel: { fontSize: isNarrow ? 10 : 11, formatter: (v) => formatCurrency(v, monedaEfectiva) } },
      yAxis: {
        type: 'category',
        data: ordenadas.map((c) => categoriaLabel(c._id)),
        axisLabel: { fontSize: isNarrow ? 11 : 12, width: isNarrow ? 90 : 130, overflow: 'truncate' }
      },
      series: [
        {
          type: 'bar',
          data: ordenadas.map((c, i) => ({ value: c.total, itemStyle: { color: palette[i] } })),
          barMaxWidth: 22,
          label: {
            show: true,
            position: 'right',
            formatter: (p) => formatCurrency(p.value, monedaEfectiva),
            fontSize: isNarrow ? 10 : 11,
            color: darkMode ? '#e5e7eb' : '#374151'
          }
        }
      ]
    };
  }, [categorias, darkMode, isNarrow, monedaEfectiva]);

  const evolucionOption = useMemo(() => {
    if (!evolucion.ingresos.length && !evolucion.gastos.length) return null;
    const chartColors = getChartColors();
    const keyOf = (r) => `${r._id.año}-${String(r._id.mes).padStart(2, '0')}`;
    const keySet = new Map();
    evolucion.ingresos.forEach((r) => keySet.set(keyOf(r), r._id));
    evolucion.gastos.forEach((r) => keySet.set(keyOf(r), r._id));
    const keys = Array.from(keySet.keys()).sort();
    const labels = keys.map((k) => {
      const { año, mes } = keySet.get(k);
      return `${MESES_CORTOS[mes - 1]} '${String(año).slice(-2)}`;
    });
    const mapBy = (rows) => {
      const m = new Map(rows.map((r) => [keyOf(r), r.total]));
      return keys.map((k) => m.get(k) || 0);
    };
    return {
      ...getAreaChartOption(darkMode),
      xAxis: { type: 'category', data: labels, axisLabel: { fontSize: isNarrow ? 10 : 12 } },
      yAxis: { type: 'value', axisLabel: { fontSize: isNarrow ? 10 : 12 } },
      legend: { data: ['Ingresos', 'Gastos'], top: 0, textStyle: { color: darkMode ? '#e5e7eb' : undefined } },
      series: [
        {
          name: 'Ingresos',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.15 },
          data: mapBy(evolucion.ingresos),
          itemStyle: { color: chartColors.income },
          lineStyle: { color: chartColors.income }
        },
        {
          name: 'Gastos',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.15 },
          data: mapBy(evolucion.gastos),
          itemStyle: { color: chartColors.expense },
          lineStyle: { color: chartColors.expense }
        }
      ]
    };
  }, [evolucion, darkMode, isNarrow]);

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Estadísticas</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cómo se mueve tu dinero</p>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scroll-container">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodo(p.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors touch-manipulation ${
                  periodo === p.id
                    ? 'bg-q-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {periodo === 'personalizado' && (
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex-1 min-w-[140px]">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Desde</span>
                <input
                  type="date"
                  value={customInicio}
                  max={customFin || undefined}
                  onChange={(e) => setCustomInicio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-h-[40px]"
                />
              </label>
              <label className="flex-1 min-w-[140px]">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Hasta</span>
                <input
                  type="date"
                  value={customFin}
                  min={customInicio || undefined}
                  onChange={(e) => setCustomFin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-h-[40px]"
                />
              </label>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={cuentaId}
              onChange={(e) => setCuentaId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-h-[40px] flex-1 min-w-[160px]"
            >
              <option value="">Todas las cuentas</option>
              {cuentas.map((c) => (
                <option key={c._id} value={c._id}>{c.nombre} ({c.moneda})</option>
              ))}
            </select>
            {!cuentaSeleccionada && (
              <div className="inline-flex rounded-full border border-gray-200 dark:border-gray-700 p-0.5 shrink-0">
                {['GTQ', 'USD'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMoneda(m)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      moneda === m ? 'bg-q-primary text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {m === 'GTQ' ? 'Q' : '$'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-q-expense-muted border border-q-expense-muted text-q-expense px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KpiCard
            label="Ingresos"
            valor={actual.ingresos}
            moneda={monedaEfectiva}
            pct={variacion(actual.ingresos, anterior?.ingresos)}
            invertido={false}
            Icon={ArrowTrendingUpIcon}
            colorClass="bg-q-income-muted text-q-income"
          />
          <KpiCard
            label="Gastos"
            valor={actual.gastos}
            moneda={monedaEfectiva}
            pct={variacion(actual.gastos, anterior?.gastos)}
            invertido
            Icon={ArrowTrendingDownIcon}
            colorClass="bg-q-expense-muted text-q-expense"
          />
          <KpiCard
            label="Balance"
            valor={balanceActual}
            moneda={monedaEfectiva}
            pct={variacion(balanceActual, balanceAnterior)}
            invertido={false}
            Icon={ScaleIcon}
            colorClass="bg-q-primary-muted text-q-primary"
          />
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <ChartContainer
            title="En qué gastas más"
            option={gastosCategoriaOption}
            loading={loading}
            height={`${Math.max(180, categorias.length * 42 + 40)}px`}
            compact
            emptyMessage="No hay gastos en este período"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <ChartContainer
            title="Evolución mensual"
            option={evolucionOption}
            loading={loading}
            height="280px"
            compact
            emptyMessage="Necesitas más historial para ver la evolución"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tarjetas y cuotas</h3>

          {totalMetodos > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                Cómo pagaste tus gastos este período
              </p>
              <div className="h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-700">
                <div className="bg-q-primary" style={{ width: `${(gastoEfectivo / totalMetodos) * 100}%` }} />
                <div className="bg-violet-500" style={{ width: `${(gastoCredito / totalMetodos) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-q-primary shrink-0" />
                  Efectivo/débito: <strong className="text-gray-900 dark:text-white">{formatCurrency(gastoEfectivo, monedaEfectiva)}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
                  Tarjeta de crédito: <strong className="text-gray-900 dark:text-white">{formatCurrency(gastoCredito, monedaEfectiva)}</strong>
                </span>
              </div>
            </div>
          )}

          {cuotasActivas.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                Cuotas activas
              </p>
              <div className="space-y-3">
                {cuotasActivas.map((c, idx) => (
                  <div key={idx}>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{c.nombre}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                        {c.cuotasPagadas}/{c.cuotasTotal} · {formatCurrency(c.montoPagado, c.moneda)} de {formatCurrency(c.montoTotal, c.moneda)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${Math.min(100, c.progreso)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            totalMetodos === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No tienes cuotas activas ni gastos con tarjeta en este período.</p>
            )
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EstadisticasPage;
