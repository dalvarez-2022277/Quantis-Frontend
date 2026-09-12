import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CreditCardIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { calendarioService } from '../../services/calendarioService';
import { getMonthName, addMonthsToDate, subMonthsFromDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import FloatingModal from '../../components/FloatingModal';
import MonthYearPillNav from '../../components/MonthYearPillNav';

const CATEGORIA_GASTO_LABELS = { alimentacion: 'Alimentación', transporte: 'Transporte', otros: 'Otros' };
const categoriaGastoLabel = (categoria) => CATEGORIA_GASTO_LABELS[categoria] || categoria;

// Colores: cuota ≠ morado; morado solo pago tarjeta; ingreso verde; gasto rojo
const TIPOS_CONFIG = {
  ingreso: { label: 'Ingreso', dot: 'bg-q-income', bg: 'bg-q-income-muted', text: 'text-q-income', icon: ArrowTrendingUpIcon },
  gasto: { label: 'Gasto', dot: 'bg-q-expense', bg: 'bg-q-expense-muted', text: 'text-q-expense', icon: ArrowTrendingDownIcon },
  cuota: { label: 'Cuota', dot: 'bg-q-primary', bg: 'bg-q-primary-muted', text: 'text-q-primary', icon: CalendarDaysIcon },
  prestamo: { label: 'Préstamo', dot: 'bg-amber-500', bg: 'bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400', icon: BanknotesIcon },
  tarjeta_pago: { label: 'Pago tarjeta', dot: 'bg-violet-500', bg: 'bg-violet-500/15', text: 'text-violet-700 dark:text-violet-300', icon: CreditCardIcon },
  ingreso_recurrente: { label: 'Ingreso rec.', dot: 'bg-q-income', bg: 'bg-q-income-muted', text: 'text-q-income', icon: ArrowTrendingUpIcon },
  gasto_recurrente: { label: 'Gasto rec.', dot: 'bg-q-expense', bg: 'bg-q-expense-muted', text: 'text-q-expense', icon: ArrowTrendingDownIcon },
};

const getTipoConfig = (tipo) => TIPOS_CONFIG[tipo] || { label: tipo, dot: 'bg-gray-400', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', icon: CalendarDaysIcon };

/** Fecha local YYYY-MM-DD (no UTC) — evita que "hoy" salte al día siguiente/anterior vs toISOString(). */
function fechaLocalYMD(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const TIPOS_GASTO = ['gasto', 'gasto_recurrente'];
const TIPOS_INGRESO = ['ingreso', 'ingreso_recurrente'];
const TIPOS_PAGOS = ['cuota', 'tarjeta_pago', 'prestamo'];

function flattenEventosMes(eventosPorDia) {
  const list = [];
  Object.entries(eventosPorDia || {}).forEach(([fechaKey, arr]) => {
    if (!Array.isArray(arr)) return;
    const parts = fechaKey.split('-');
    const dia = parts.length === 3 ? parseInt(parts[2], 10) : null;
    arr.forEach((ev) => {
      list.push({ ...ev, _fechaKey: fechaKey, _dia: dia });
    });
  });
  list.sort((a, b) => {
    const c = (a._fechaKey || '').localeCompare(b._fechaKey || '');
    if (c !== 0) return c;
    return String(a.tipo || '').localeCompare(String(b.tipo || ''));
  });
  return list;
}

function montoContableEvento(e) {
  if (e.tipo === 'tarjeta_pago') {
    // Con ciclo calculado (backend nos da cicloFin): cuotas del día + gastos
    // sueltos hechos con la tarjeta durante ese ciclo de facturación. Antes
    // solo se contaban las cuotas y las compras sueltas a crédito quedaban
    // afuera del total a pagar.
    if (e.cicloFin != null) {
      return (Number(e.totalCuotasEnFecha) || 0) + (Number(e.montoSueltosEnCiclo) || 0);
    }
    if ((e.cuotasEnFecha || []).length > 0 && e.totalCuotasEnFecha != null) {
      return Number(e.totalCuotasEnFecha) || 0;
    }
  }
  return Number(e.monto) || 0;
}

function sumarMontosPorMoneda(list) {
  const out = { GTQ: 0, USD: 0 };
  list.forEach((e) => {
    const m = montoContableEvento(e);
    if (m <= 0) return;
    const mon = e.moneda;
    if (mon && out[mon] !== undefined) out[mon] += m;
  });
  return out;
}

/** Indica si el evento puede enlazar al detalle avanzado en su pantalla (transacciones, cuotas, dashboard). */
function puedeIrADetalleCalendario(evento) {
  if (!evento?.tipo) return false;
  switch (evento.tipo) {
    case 'gasto':
      return !!evento.gastoId;
    case 'ingreso':
      return !!evento.ingresoId;
    case 'cuota':
      return !!evento.cuotaId;
    case 'tarjeta_pago':
      return !!evento.tarjetaId;
    case 'prestamo':
      return !!evento.prestamoId;
    case 'ingreso_recurrente':
      return !!evento.ingresoRecurrenteId;
    case 'gasto_recurrente':
      return !!evento.gastoRecurrenteId;
    default:
      return false;
  }
}

const CalendarioContent = () => {
  const navigate = useNavigate();
  const [fechaActual, setFechaActual] = useState(new Date());
  const [eventos, setEventos] = useState({});
  const [modalEventos, setModalEventos] = useState([]);
  const [modalTitulo, setModalTitulo] = useState('');
  /** 'dia': mismo día; 'mes': lista filtrada por categoría con Día N en cada fila */
  const [modalModo, setModalModo] = useState('dia');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDesktopModal, setIsDesktopModal] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1280 : false));
  const mes = fechaActual.getMonth() + 1;
  const año = fechaActual.getFullYear();

  useEffect(() => {
    const onResize = () => setIsDesktopModal(window.innerWidth >= 1280);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    loadEventos();
  }, [mes, año]);

  const loadEventos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarioService.getEventosMes(mes, año);
      const data = response?.data ?? response;
      setEventos(data?.eventosPorDia || {});
    } catch (err) {
      const msg = err?.message || (typeof err === 'object' && err?.message) || 'Error al cargar eventos';
      setError(msg);
      setEventos({});
      console.error('Error cargando eventos:', err);
    } finally {
      setLoading(false);
    }
  };

  const eventosMesPlano = useMemo(() => flattenEventosMes(eventos), [eventos]);

  const resumenMes = useMemo(() => {
    const gastos = eventosMesPlano.filter((e) => TIPOS_GASTO.includes(e.tipo));
    const ingresos = eventosMesPlano.filter((e) => TIPOS_INGRESO.includes(e.tipo));
    const pagos = eventosMesPlano.filter((e) => TIPOS_PAGOS.includes(e.tipo));
    return {
      gastos,
      ingresos,
      pagos,
      totalesGastos: sumarMontosPorMoneda(gastos),
      totalesIngresos: sumarMontosPorMoneda(ingresos),
      totalesPagos: sumarMontosPorMoneda(pagos),
    };
  }, [eventosMesPlano]);

  const formatoTotalesLinea = (totales) => {
    const parts = [];
    if (totales.GTQ > 0) parts.push(formatCurrency(totales.GTQ, 'GTQ'));
    if (totales.USD > 0) parts.push(formatCurrency(totales.USD, 'USD'));
    return parts.length ? parts.join(' · ') : 'Sin movimientos';
  };

  const handleDiaClick = (dia) => {
    const fechaKey = `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const raw = eventos[fechaKey] || [];
    setModalEventos(raw.map((e) => ({ ...e, _fechaKey: fechaKey, _dia: dia })));
    setModalTitulo(`${dia} de ${getMonthName(mes)} ${año}`);
    setModalModo('dia');
    setShowModal(true);
  };

  const abrirResumenMes = (categoria) => {
    if (categoria === 'gastos') {
      setModalEventos(resumenMes.gastos);
      setModalTitulo(`Gastos — ${getMonthName(mes)} ${año}`);
    } else if (categoria === 'ingresos') {
      setModalEventos(resumenMes.ingresos);
      setModalTitulo(`Ingresos — ${getMonthName(mes)} ${año}`);
    } else {
      setModalEventos(resumenMes.pagos);
      setModalTitulo(`Próximos pagos — ${getMonthName(mes)} ${año}`);
    }
    setModalModo('mes');
    setShowModal(true);
  };

  const mensajeModalVacio = () => {
    if (modalModo === 'dia') return 'No hay eventos para este día';
    if (modalTitulo.startsWith('Gastos')) return 'No hay gastos registrados este mes';
    if (modalTitulo.startsWith('Ingresos')) return 'No hay ingresos registrados este mes';
    return 'No hay pagos programados este mes';
  };

  const irADetalleEvento = (evento) => {
    if (!puedeIrADetalleCalendario(evento)) return;
    setShowModal(false);
    const t = evento.tipo;
    if (t === 'gasto' && evento.gastoId) {
      navigate('/transacciones/gastos', { state: { openGastoId: evento.gastoId } });
      return;
    }
    if (t === 'ingreso' && evento.ingresoId) {
      navigate('/transacciones/ingresos', { state: { openIngresoId: evento.ingresoId } });
      return;
    }
    if (t === 'cuota' && evento.cuotaId) {
      navigate('/finanzas/cuotas', { state: { openPlanId: evento.cuotaId } });
      return;
    }
    if (t === 'tarjeta_pago' && evento.tarjetaId) {
      navigate('/finanzas/cuotas', { state: { expandTarjetaId: evento.tarjetaId } });
      return;
    }
    if (t === 'prestamo' && evento.prestamoId) {
      navigate('/dashboard', { state: { openPrestamoId: evento.prestamoId } });
      return;
    }
    if (t === 'ingreso_recurrente' && evento.ingresoRecurrenteId) {
      navigate('/transacciones/ingresos', { state: { openIngresoRecurrenteId: evento.ingresoRecurrenteId } });
      return;
    }
    if (t === 'gasto_recurrente' && evento.gastoRecurrenteId) {
      navigate('/transacciones/gastos', { state: { openGastoRecurrenteId: evento.gastoRecurrenteId } });
    }
  };

  const irAPlanCuotaId = (cuotaId) => {
    if (!cuotaId) return;
    setShowModal(false);
    navigate('/finanzas/cuotas', { state: { openPlanId: cuotaId } });
  };

  const aplicarMesYAño = (m, y) => {
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return;
    setFechaActual(new Date(y, m - 1, 1));
  };

  const irAHoy = () => {
    const hoy = new Date();
    setFechaActual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  };

  const cambiarMes = (direccion) => {
    setFechaActual(direccion === 'siguiente' ? addMonthsToDate(fechaActual, 1) : subMonthsFromDate(fechaActual, 1));
  };

  const generarDiasDelMes = () => {
    const primerDia = new Date(año, mes - 1, 1);
    const ultimoDia = new Date(año, mes, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();
    const dias = [];
    for (let i = 0; i < diaInicioSemana; i++) dias.push(null);
    for (let dia = 1; dia <= diasEnMes; dia++) dias.push(dia);
    return dias;
  };

  const dias = generarDiasDelMes();
  const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hoyKeyLocal = fechaLocalYMD(new Date());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 min-w-0">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-3 sm:py-4 pb-[max(1rem,env(safe-area-inset-bottom))] min-w-0">
        <motion.header
          className="mb-3 sm:mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* Fila superior: back + icono + título */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-q-primary/30"
                aria-label="Regresar al inicio"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
              </button>

              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600/50 flex items-center justify-center">
                <CalendarDaysIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 leading-none mb-px">
                  Calendario
                </p>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white tracking-tight leading-tight truncate">
                  Calendario
                </h1>
              </div>
            </div>
          </div>

          <div className="flex w-full justify-center">
            <MonthYearPillNav
              month={mes}
              year={año}
              onMonthYearApply={aplicarMesYAño}
              onPrev={() => cambiarMes('anterior')}
              onNext={() => cambiarMes('siguiente')}
              onToday={irAHoy}
            />
          </div>

        </motion.header>

        {error && (
          <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-2.5 text-sm flex items-center gap-2">
            <span className="flex-1">No se pudieron cargar los eventos. El calendario se muestra vacío.</span>
          </div>
        )}

        {/* Tarjeta del calendario: altura según la rejilla (sin min-height que dejaba hueco vacío) */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm w-full max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto">
          {/* Línea decorativa superior */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent opacity-50" aria-hidden="true" />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/90 dark:bg-gray-800/90 z-10 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-q-primary border-t-transparent" />
            </div>
          )}

          <div className="p-3 sm:p-5 md:p-6 min-w-0">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 mb-1.5 md:mb-2" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
              {nombresDias.map((nombre) => (
                <div
                  key={nombre}
                  className="text-center text-[11px] sm:text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 min-w-0 truncate"
                >
                  {nombre}
                </div>
              ))}
            </div>

            {/* Grilla de días: min-height táctil en móvil; aspect-square desde md */}
            <div
              className="grid grid-cols-7 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 w-full min-w-0"
              style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
            >
              {/*
                Sin AnimatePresence aquí: mode="wait" solo admite un hijo animado a la vez;
                la grilla tiene decenas de celdas y dispara el warning de framer-motion.
              */}
              {dias.map((dia, index) => {
                  if (dia === null) {
                    return (
                      <div
                        key={`empty-${año}-${mes}-${index}`}
                        className="min-w-0 w-full min-h-[2.75rem] sm:min-h-[3rem] md:aspect-square md:min-h-0"
                      />
                    );
                  }
                  const fechaKey = `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                  const eventosDelDiaArr = eventos[fechaKey] || [];
                  const esHoy = hoyKeyLocal === fechaKey;
                  const tiposUnicos = [...new Set(eventosDelDiaArr.map((e) => e.tipo))].slice(0, 3);

                  return (
                    <motion.button
                      key={fechaKey}
                      type="button"
                      onClick={() => handleDiaClick(dia)}
                      initial={false}
                      className={`
                        relative min-w-0 w-full min-h-[2.75rem] sm:min-h-[3rem] md:aspect-square md:min-h-0 rounded-lg sm:rounded-xl md:rounded-2xl flex flex-col items-center justify-center overflow-hidden py-1
                        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-q-primary/50 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                        ${esHoy
                          ? 'bg-q-primary text-white shadow-md ring-2 ring-q-primary/30'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                        }
                      `}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className={`text-sm sm:text-sm md:text-base font-semibold tabular-nums leading-none truncate max-w-full ${esHoy ? 'text-white' : ''}`}>
                        {dia}
                      </span>
                      {eventosDelDiaArr.length > 0 && (
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 flex-shrink-0 flex-wrap px-0.5">
                          {tiposUnicos.map((tipo) => (
                            <span
                              key={tipo}
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${getTipoConfig(tipo).dot} ${esHoy ? 'opacity-90' : ''}`}
                              title={getTipoConfig(tipo).label}
                            />
                          ))}
                          {eventosDelDiaArr.length > 3 && (
                            <span className={`text-[10px] sm:text-[11px] font-semibold ml-0.5 shrink-0 ${esHoy ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                              +{eventosDelDiaArr.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Resumen del mes: totales y acceso al mismo modal de detalle filtrado */}
        <div className="mt-4 sm:mt-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm w-full max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 shrink-0" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Resumen del mes</span>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => abrirResumenMes('gastos')}
              className="w-full flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-700/40 px-3 py-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/70 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-q-primary/30"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-q-expense-muted text-q-expense">
                <ArrowTrendingDownIcon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Gastos</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatoTotalesLinea(resumenMes.totalesGastos)}
                  {resumenMes.gastos.length > 0 && (
                    <span className="text-gray-400 dark:text-gray-500"> · {resumenMes.gastos.length} mov.</span>
                  )}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => abrirResumenMes('ingresos')}
              className="w-full flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-700/40 px-3 py-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/70 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-q-primary/30"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-q-income-muted text-q-income">
                <ArrowTrendingUpIcon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Ingresos</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatoTotalesLinea(resumenMes.totalesIngresos)}
                  {resumenMes.ingresos.length > 0 && (
                    <span className="text-gray-400 dark:text-gray-500"> · {resumenMes.ingresos.length} mov.</span>
                  )}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => abrirResumenMes('pagos')}
              className="w-full flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-700/40 px-3 py-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/70 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-q-primary/30"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-q-primary-muted text-q-primary">
                <CreditCardIcon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Próximos pagos</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatoTotalesLinea(resumenMes.totalesPagos)}
                  {resumenMes.pagos.length > 0 && (
                    <span className="text-gray-400 dark:text-gray-500"> · {resumenMes.pagos.length} mov.</span>
                  )}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modal detalle del día: estilo lista tipo Dashboard (drop/bottom sheet) */}
      <FloatingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        size="md"
        showCloseButton
        showDragHandle={!isDesktopModal}
        closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
        bottomSheet={!isDesktopModal}
        compactHeader
        title={modalTitulo || 'Eventos'}
      >
        <div className={isDesktopModal ? 'pt-3 px-6 pb-6' : 'pt-2 px-4 pb-6'}>
          {modalEventos.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10 text-sm">
              {mensajeModalVacio()}
            </p>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/80 overflow-hidden">
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
                {modalEventos.map((evento, index) => {
                  const rowKey = `${evento._fechaKey || 'x'}-${index}-${evento.tipo}-${evento.nombre || ''}`;
                  const c = getTipoConfig(evento.tipo);
                  const IconComponent = c.icon;
                  const esPagoTarjeta = evento.tipo === 'tarjeta_pago';
                  const esCuota = evento.tipo === 'cuota';
                  const esIngreso = evento.tipo === 'ingreso' || evento.tipo === 'ingreso_recurrente';
                  const puedeNav = puedeIrADetalleCalendario(evento);
                  const tituloCuota = (esCuota && evento.numeroCuota != null && evento.cuotasTotal != null)
                    ? `Pago de cuota ${evento.numeroCuota} de ${evento.cuotasTotal} - ${evento.nombre || 'Plan'}`
                    : (esCuota ? (evento.nombre || 'Cuota') : null);
                  const tituloPagoTarjeta = evento.nombre || 'Pago de tarjeta';
                  const titulo = tituloCuota ?? (esPagoTarjeta ? tituloPagoTarjeta : (evento.nombre || evento.descripcion || evento.categoria || evento.tipo));
                  const cuotasEnFecha = evento.cuotasEnFecha || [];
                  const totalCuotasEnFecha = evento.totalCuotasEnFecha != null ? evento.totalCuotasEnFecha : 0;
                  const subline = esPagoTarjeta
                    ? null
                    : esCuota
                      ? (evento.monto != null ? `${formatCurrency(evento.monto, evento.moneda)} ${evento.moneda || ''}`.trim() : c.label)
                      : [c.label, evento.descripcion && evento.nombre ? evento.descripcion : null].filter(Boolean).join(' · ');
                  const fechaPasada = evento.fechaPasada === true;
                  const cuotaPagada = esCuota && evento.pagada === true;
                  const estiloCompletado = esCuota ? cuotaPagada : fechaPasada;
                  const cuotaVencidaPendiente = esCuota && fechaPasada && !cuotaPagada;
                  const mostrarMontoEnFila = !esPagoTarjeta || (esPagoTarjeta && cuotasEnFecha.length === 0 && Number(evento.monto) > 0);

                  if (esPagoTarjeta) {
                    const todasPagadas = evento.todasCuotasPagadas === true;
                    const mostrarComoPagado = todasPagadas || fechaPasada;
                    // El Total solo se marca "(Pagado)" cuando hay una señal real de pago
                    // (todas las cuotas marcadas yaPagada) y no hay compras sueltas en el
                    // ciclo - esas no tienen forma de saber si ya se pagaron o no, así que
                    // nunca se dan por pagadas solo porque la fecha de pago ya pasó.
                    const totalMostradoComoPagado = todasPagadas && (evento.cantidadSueltosEnCiclo || 0) === 0;
                    return (
                      <li key={rowKey} className={mostrarComoPagado ? 'opacity-75' : ''}>
                        <div
                          role={puedeNav ? 'button' : undefined}
                          tabIndex={puedeNav ? 0 : undefined}
                          onClick={puedeNav ? () => irADetalleEvento(evento) : undefined}
                          onKeyDown={puedeNav ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); irADetalleEvento(evento); } } : undefined}
                          className={`w-full flex items-center gap-3 py-3.5 px-4 text-left ${puedeNav ? 'cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/30 active:bg-gray-200/50 dark:active:bg-gray-700/50 transition-colors' : ''}`}
                        >
                          <span className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${c.bg} ${c.text} ${mostrarComoPagado ? 'opacity-80' : ''}`}>
                            <IconComponent className="w-5 h-5" aria-hidden />
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            {modalModo === 'mes' && evento._dia != null && (
                              <span className="w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-gray-50">
                                Día {evento._dia}
                              </span>
                            )}
                            <p className={`text-base font-semibold ${mostrarComoPagado ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                              {titulo}
                              {todasPagadas && <span className="ml-2 text-xs font-normal uppercase tracking-wider text-gray-500 dark:text-gray-400">— Pagado</span>}
                            </p>
                          </div>
                        </div>
                        {(cuotasEnFecha.length > 0 || Number(evento.montoSueltosEnCiclo) > 0) ? (
                          <div className={`mx-4 mb-3 rounded-xl border overflow-hidden ${mostrarComoPagado ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600' : 'bg-gray-100 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600'}`}>
                            <div className="px-4 py-3 space-y-3">
                              {cuotasEnFecha.map((cuota, idx) => {
                                const lineaPagada = cuota.yaPagada === true;
                                const puedePlan = !!cuota.cuotaId;
                                return (
                                  <div key={idx}>
                                    {puedePlan ? (
                                      <button
                                        type="button"
                                        onClick={() => irAPlanCuotaId(cuota.cuotaId)}
                                        className="w-full flex items-center justify-between gap-4 min-h-[2.75rem] text-left rounded-lg px-1 -mx-1 hover:bg-white/50 dark:hover:bg-gray-800/40 transition-colors"
                                      >
                                        <p className={`text-base flex-1 min-w-0 break-words ${lineaPagada || mostrarComoPagado ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                          Pago de cuota {cuota.numeroCuota} de {cuota.cuotasTotal} — {cuota.nombre || 'Plan'}
                                          {lineaPagada && <span className="ml-2 text-xs font-medium text-green-600 dark:text-green-400 not-italic">Pagado</span>}
                                        </p>
                                        <span className={`text-base font-bold tabular-nums shrink-0 ${lineaPagada || mostrarComoPagado ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                          {(lineaPagada || mostrarComoPagado) ? '−' : ''}{formatCurrency(cuota.montoCuota, cuota.moneda)}
                                        </span>
                                      </button>
                                    ) : (
                                      <div className="flex items-center justify-between gap-4 min-h-[2rem]">
                                        <p className={`text-base flex-1 min-w-0 break-words ${lineaPagada || mostrarComoPagado ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                          Pago de cuota {cuota.numeroCuota} de {cuota.cuotasTotal} — {cuota.nombre || 'Plan'}
                                          {lineaPagada && <span className="ml-2 text-xs font-medium text-green-600 dark:text-green-400 not-italic">Pagado</span>}
                                        </p>
                                        <span className={`flex-shrink-0 text-base font-bold tabular-nums ${lineaPagada || mostrarComoPagado ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                          {(lineaPagada || mostrarComoPagado) ? '−' : ''}{formatCurrency(cuota.montoCuota, cuota.moneda)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {(evento.sueltosEnCiclo || []).map((suelto, idx) => (
                                <button
                                  type="button"
                                  key={suelto.gastoId || idx}
                                  onClick={() => navigate('/transacciones/gastos', { state: { openGastoId: suelto.gastoId } })}
                                  className="w-full flex items-center justify-between gap-4 min-h-[2.75rem] text-left rounded-lg px-1 -mx-1 hover:bg-white/50 dark:hover:bg-gray-800/40 transition-colors"
                                >
                                  {/* Sin tachar/"Pagado": una compra suelta no tiene señal real de que
                                      ya se pagó (a diferencia de una cuota con yaPagada) - la fecha de
                                      pago de la tarjeta puede haber pasado sin que se haya registrado el pago. */}
                                  <p className="text-base flex-1 min-w-0 break-words text-gray-800 dark:text-gray-100">
                                    {suelto.descripcion || categoriaGastoLabel(suelto.categoria) || 'Compra'}
                                  </p>
                                  <span className="text-base font-bold tabular-nums shrink-0 text-gray-900 dark:text-white">
                                    {formatCurrency(suelto.monto, suelto.moneda)}
                                  </span>
                                </button>
                              ))}
                              <div className="flex items-center justify-between gap-4 pt-3 mt-1 border-t-2 border-gray-200 dark:border-gray-600">
                                <p className={`text-base font-bold ${totalMostradoComoPagado ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                  Total {totalMostradoComoPagado ? '(Pagado)' : ''}
                                </p>
                                <span className={`text-base font-bold tabular-nums ${totalMostradoComoPagado ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                  {totalMostradoComoPagado ? '−' : ''}{formatCurrency(totalCuotasEnFecha + (Number(evento.montoSueltosEnCiclo) || 0), evento.moneda)} {evento.moneda || ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  }

                  return (
                    <li key={rowKey}>
                      <div
                        role={puedeNav ? 'button' : undefined}
                        tabIndex={puedeNav ? 0 : undefined}
                        onClick={puedeNav ? () => irADetalleEvento(evento) : undefined}
                        onKeyDown={puedeNav ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); irADetalleEvento(evento); } } : undefined}
                        className={`w-full flex items-center gap-3 py-3.5 px-4 text-left transition-colors touch-manipulation ${puedeNav ? 'hover:bg-gray-100/80 dark:hover:bg-gray-700/40 active:bg-gray-200/80 dark:active:bg-gray-700/60 cursor-pointer' : ''} ${estiloCompletado ? 'opacity-60' : ''} ${cuotaVencidaPendiente ? 'border-l-4 border-amber-500/90 pl-3' : ''}`}
                      >
                        <span className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${c.bg} ${c.text} ${estiloCompletado ? 'opacity-80' : ''}`}>
                          <IconComponent className="w-5 h-5" aria-hidden />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          {modalModo === 'mes' && evento._dia != null && (
                            <span className="w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-gray-50">
                              Día {evento._dia}
                            </span>
                          )}
                          <p className={`font-medium truncate ${estiloCompletado ? 'line-through text-gray-500 dark:text-gray-400' : cuotaVencidaPendiente ? 'text-amber-800 dark:text-amber-200' : 'text-gray-900 dark:text-white'}`}>
                            {titulo}
                            {cuotaPagada && (
                              <span className="ml-2 text-xs font-normal uppercase tracking-wider text-green-600 dark:text-green-400">Pagado</span>
                            )}
                            {cuotaVencidaPendiente && (
                              <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-300">Pendiente</span>
                            )}
                          </p>
                          {subline != null && (
                            <p className={`text-xs mt-0.5 flex items-center gap-1.5 truncate ${estiloCompletado ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                              {subline}
                            </p>
                          )}
                        </div>
                        {evento.monto != null && Number(evento.monto) > 0 && mostrarMontoEnFila && (
                          <div className={`flex-shrink-0 text-right ${estiloCompletado ? 'opacity-80' : ''}`}>
                            <span className={`block font-semibold tabular-nums ${estiloCompletado ? 'line-through text-gray-500 dark:text-gray-400' : ''} ${!estiloCompletado && (esIngreso ? 'text-q-income' : 'text-q-expense')}`}>
                              {esIngreso ? '+' : '−'}{formatCurrency(evento.monto, evento.moneda)}
                            </span>
                            {evento.moneda && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{evento.moneda}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </FloatingModal>
    </div>
  );
};

export default CalendarioContent;
