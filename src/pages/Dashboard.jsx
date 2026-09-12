import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext';
import { ingresoService } from '../services/ingresoService';
import { gastoService } from '../services/gastoService';
import { cuentaService } from '../services/cuentaService';
import { cuotaService } from '../services/cuotaService';
import { tarjetaService } from '../services/tarjetaService';
import { prestamoService } from '../services/prestamoService';
import { recurrenciaService } from '../services/recurrenciaService';
import Modal from '../components/Modal';
import FloatingModal from '../components/FloatingModal';
import ConfirmModal from '../components/ConfirmModal';
import ChartContainer from '../components/ChartContainer';
import QuantisMascot from '../components/QuantisMascot';
import { getPieChartOption, getBarChartOption, getChartColors } from '../utils/chartConfig';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeArea } from '../hooks/useSafeArea';
import { formatDate as formatDateUtil, getRelativeTime } from '../utils/dateUtils';
import { formatCurrency } from '../utils/currencyUtils';
import {
  getPrimeraCuotaFecha,
  proximoPagoTrasCuotasPagadas,
  fechaUltimaCuotaDesdePrimera,
  estimarCuotasPagadasPorCalendario,
  fechaCompraEsAnteriorAHoy,
  compraYPlazoCuotasCoherentes,
} from '../utils/cuotaFechaUtils';
import { useTiposTransaccion } from '../hooks/useTiposTransaccion';
import { useCuentas } from '../hooks/useCuentas';
import { getIconComponent, ICON_KEYS_FOR_PICKER, normalizeIconKey } from '../utils/iconRegistry';
import {
  PlusIcon,
  MinusIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  EyeIcon,
  SparklesIcon,
  WalletIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  EllipsisVerticalIcon,
  EyeSlashIcon,
  ChartBarIcon,
  ChartPieIcon,
  CircleStackIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  BanknotesIcon,
  Bars3Icon,
  CalendarIcon,
  ShoppingCartIcon,
  TruckIcon,
  EllipsisHorizontalCircleIcon,
  EllipsisHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const DASHBOARD_BALANCE_CUENTA_KEY = 'quantis_dashboard_balance_cuenta';
const DASHBOARD_BALANCE_ORDER_KEY = 'quantis_dashboard_balance_order';
const DASHBOARD_BALANCE_HIDDEN_KEY = 'quantis_dashboard_balance_hidden';

const SortableAccountItem = ({ id, nombre, isFirst, isLast, onMove, hidden, onToggleHidden, disableToggle }) => {
  const controls = useDragControls();
  return (
    <Reorder.Item
      key={id}
      value={id}
      dragListener={false}
      dragControls={controls}
      className={`flex items-center gap-2 p-3 rounded-xl border select-none ${hidden ? 'bg-gray-50/60 dark:bg-gray-800/30 border-gray-200/40 dark:border-gray-700/40' : 'bg-gray-50 dark:bg-gray-700/40 border-gray-200/60 dark:border-gray-600/60'}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col shrink-0">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMove(-1); }}
          disabled={isFirst}
          className={`inline-flex items-center justify-center p-0.5 min-h-0 min-w-0 rounded transition-colors bg-transparent ${isFirst ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:bg-gray-200 dark:active:bg-gray-600'}`}
          aria-label="Mover arriba"
        >
          <ChevronUpIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMove(1); }}
          disabled={isLast}
          className={`inline-flex items-center justify-center p-0.5 min-h-0 min-w-0 rounded transition-colors bg-transparent ${isLast ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:bg-gray-200 dark:active:bg-gray-600'}`}
          aria-label="Mover abajo"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium truncate ${hidden ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`} title={nombre}>
          {nombre}
        </div>
      </div>
      {onToggleHidden && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (!disableToggle) onToggleHidden(); }}
          disabled={disableToggle}
          className={`inline-flex items-center justify-center shrink-0 p-1.5 rounded-lg transition-colors bg-transparent ${disableToggle ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:bg-gray-200 dark:active:bg-gray-600'}`}
          aria-label={hidden ? `Mostrar ${nombre} en el carrusel` : `Ocultar ${nombre} del carrusel`}
          title={disableToggle ? 'Debe quedar al menos una tarjeta visible' : hidden ? 'Mostrar en el carrusel' : 'Ocultar del carrusel'}
        >
          {hidden ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      )}
      <div
        className="flex items-center shrink-0 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={(e) => { e.stopPropagation(); controls.start(e); }}
      >
        <Bars3Icon className="h-5 w-5" aria-hidden />
      </div>
    </Reorder.Item>
  );
};

// Valor sentinela en el select de cuenta: navega a /finanzas/cuentas y abre el modal nuevo.
const SELECT_CREAR_CUENTA = '__quantis_crear_cuenta__';

const Dashboard = () => {
  const { user } = useAuthContext();
  const { darkMode, colorPreset } = useTheme();
  const { isStandalone, isIOS } = useSafeArea();
  const navigate = useNavigate();
  const location = useLocation();
  const [transacciones, setTransacciones] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [cuotasProximas, setCuotasProximas] = useState([]);
  const [cuotasParaPagar, setCuotasParaPagar] = useState([]); // Cuotas activas/vencidas para selector "Pagar cuota"
  const [tarjetasCredito, setTarjetasCredito] = useState([]); // Tarjetas de crédito con corte y pago configurados (para gasto en cuotas)
  const [prestamosActivos, setPrestamosActivos] = useState([]);
  const [resumenChartType, setResumenChartType] = useState(() => {
    try {
      const t = localStorage.getItem('quantis_resumen_chart_type') || 'donut';
      return ['bar', 'pie', 'donut', 'hidden'].includes(t) ? t : 'donut';
    } catch {
      return 'donut';
    }
  });
  const [resumenMenuOpen, setResumenMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  const resumenMenuRef = useRef(null);
  const resumenChartRef = useRef(null);
  const balanceMenuRef = useRef(null);
  const balanceTrackRef = useRef(null);
  const balanceTouchRef = useRef({ startX: 0, startY: 0, swiping: false, dx: 0 });
  const balanceMouseRef = useRef({ dragging: false, startX: 0, dx: 0 });
  const [balanceDragDx, setBalanceDragDx] = useState(0);
  const [balanceTrackW, setBalanceTrackW] = useState(0);
  const balanceDxRafRef = useRef({ raf: 0, pendingDx: 0 });
  const isLoadingRef = useRef(false);
  const { tiposIngreso, tiposGasto, isLoading: isLoadingTipos, createTipoIngreso, createTipoGasto, deleteTipoIngreso, deleteTipoGasto, conteoPorCategoriaGasto, conteoPorTipoIngreso, reloadConteos } = useTiposTransaccion();
  const { cuentas: cuentasActivas, loading: cuentasLoading, cuentaById, refetch: refetchCuentas } = useCuentas({ esActiva: 'true' });
  const [balancesPorCuenta, setBalancesPorCuenta] = useState([]);
  const [isEatingMascot, setIsEatingMascot] = useState(false);
  const eatingMascotTimeoutRef = useRef(null);
  const [balanceScope, setBalanceScope] = useState(() => {
    try {
      const v = localStorage.getItem(DASHBOARD_BALANCE_CUENTA_KEY);
      if (v === 'todas') return v;
      if (v && String(v).length >= 16) return v;
    } catch (_) {}
    return 'todas';
  });
  const [balanceMenuOpen, setBalanceMenuOpen] = useState(false);
  const [draftBalanceOrder, setDraftBalanceOrder] = useState(null); // orden temporal mientras el modal está abierto
  const [balanceOrder, setBalanceOrder] = useState(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_BALANCE_ORDER_KEY);
      const arr = raw ? JSON.parse(raw) : null;
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch (_) {
      return [];
    }
  });
  const [hiddenBalanceIds, setHiddenBalanceIds] = useState(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_BALANCE_HIDDEN_KEY);
      const arr = raw ? JSON.parse(raw) : null;
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch (_) {
      return [];
    }
  });
  const [isCreatingIngresoTipo, setIsCreatingIngresoTipo] = useState(false);
  const [nuevoIngresoTipo, setNuevoIngresoTipo] = useState({ label: '', iconKey: 'WalletIcon' });
  const [sessionTiposIngreso, setSessionTiposIngreso] = useState([]);
  const [isCreatingCategoriaGasto, setIsCreatingCategoriaGasto] = useState(false);
  const [nuevaCategoriaGasto, setNuevaCategoriaGasto] = useState({ label: '', iconKey: 'ShoppingCartIcon' });
  const [sessionTiposGasto, setSessionTiposGasto] = useState([]);
  const [showTransactionDetails, setShowTransactionDetails] = useState(null);
  const [showPlanDetails, setShowPlanDetails] = useState(null); // cuota (plan de cuotas) para modal de detalles
  /** Préstamo abierto desde Calendario (state.openPrestamoId) */
  const [prestamoDetalleDesdeCalendario, setPrestamoDetalleDesdeCalendario] = useState(null);
  const detailsModalScrollRef = useRef(null);
  const planDetailsScrollRef = useRef(null);
  const fechaIngresoInputRef = useRef(null);
  const fechaGastoInputRef = useRef(null);
  const longPressIngresoTipoRef = useRef({ timer: null, fired: false });
  const longPressGastoCategoriaRef = useRef({ timer: null, fired: false });
  const nuevaCategoriaBlockRef = useRef(null);
  const prevCategoriaGastoRef = useRef(null);
  const nuevoTipoIngresoBlockRef = useRef(null);
  const prevTipoIngresoRef = useRef(null);
  const [tipoIngresoToDelete, setTipoIngresoToDelete] = useState(null); // { type: 'api', id, label } | { type: 'session', sessionId, label } | null
  const [tipoGastoToDelete, setTipoGastoToDelete] = useState(null);     // { type: 'api', id, label } | { type: 'session', sessionId, label } | null

  // Formatear fecha como dd/mm/aa (ej. 11/12/25)
  const formatFechaShort = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!d || !m || !y) return dateStr;
    const yy = y.length >= 2 ? y.slice(-2) : y;
    return `${d}/${m}/${yy}`;
  };

  const handleConfirmDeleteTipoIngreso = async () => {
    if (!tipoIngresoToDelete) return;
    const label = tipoIngresoToDelete.label;
    setFormError(null);
    try {
      if (tipoIngresoToDelete.type === 'api') {
        if (tipoIngresoToDelete.id == null) {
          setFormError('Los tipos por defecto no se pueden eliminar.');
          setTipoIngresoToDelete(null);
          return;
        }
        await deleteTipoIngreso(tipoIngresoToDelete.id);
      } else {
        setSessionTiposIngreso(prev => prev.filter(s => s.sessionId !== tipoIngresoToDelete.sessionId));
      }
      if (formData.tipo === label) setFormData(prev => ({ ...prev, tipo: '', tipoPersonalizado: '' }));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'No se pudo eliminar el tipo. Puede que esté en uso.';
      setFormError(msg);
    } finally {
      setTipoIngresoToDelete(null);
    }
  };

  const handleConfirmDeleteTipoGasto = async () => {
    if (!tipoGastoToDelete) return;
    const label = tipoGastoToDelete.label;
    setFormError(null);
    try {
      if (tipoGastoToDelete.type === 'api') {
        if (tipoGastoToDelete.id == null) {
          setFormError('Las categorías por defecto no se pueden eliminar.');
          setTipoGastoToDelete(null);
          return;
        }
        await deleteTipoGasto(tipoGastoToDelete.id);
      } else {
        setSessionTiposGasto(prev => prev.filter(s => s.sessionId !== tipoGastoToDelete.sessionId));
      }
      if (formData.categoria === label) setFormData(prev => ({ ...prev, categoria: '', categoriaPersonalizada: '' }));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'No se pudo eliminar la categoría. Puede que esté en uso.';
      setFormError(msg);
    } finally {
      setTipoGastoToDelete(null);
    }
  };

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const persistBalanceOrder = useCallback((order) => {
    setBalanceOrder(order);
    try {
      localStorage.setItem(DASHBOARD_BALANCE_ORDER_KEY, JSON.stringify(order));
    } catch (_) {}
  }, []);

  const persistHiddenBalanceIds = useCallback((ids) => {
    setHiddenBalanceIds(ids);
    try {
      localStorage.setItem(DASHBOARD_BALANCE_HIDDEN_KEY, JSON.stringify(ids));
    } catch (_) {}
  }, []);

  const availableBalanceSlideIds = useMemo(() => {
    // La cuenta ahora es obligatoria para registrar movimientos, así que ya
    // no hay slide virtual "Efectivo": solo "todas" y las cuentas reales
    // que existan. Orden por defecto: las cuentas primero, en el orden en que
    // se fueron agregando, y "Total" (todas) al final.
    const otras = cuentasActivas.map((c) => String(c._id));
    return [...otras, 'todas'];
  }, [cuentasActivas]);

  // Lista completa ordenada (incluye cuentas ocultas): es la que se muestra en
  // el modal "Orden de cuentas" para poder reordenar/mostrar de nuevo lo oculto.
  const orderedSlideIdsAll = useMemo(() => {
    const base = balanceOrder.filter((id) => availableBalanceSlideIds.includes(String(id)));
    const missing = availableBalanceSlideIds.filter((id) => !base.includes(String(id)));
    return [...base, ...missing];
  }, [availableBalanceSlideIds, balanceOrder]);

  // Lista que realmente ve el carrusel: la completa, sin las que estén
  // ocultas ("Total" incluido: también se puede ocultar).
  const balanceSlideIds = useMemo(() => {
    const visible = orderedSlideIdsAll.filter((id) => !hiddenBalanceIds.includes(String(id)));
    // Nunca dejar el carrusel vacío: si por algún motivo todo quedó oculto,
    // mostrar igual el primero de la lista completa.
    return visible.length > 0 ? visible : orderedSlideIdsAll.slice(0, 1);
  }, [orderedSlideIdsAll, hiddenBalanceIds]);

  const resetBalanceOrder = useCallback(() => {
    persistBalanceOrder(availableBalanceSlideIds);
  }, [availableBalanceSlideIds, persistBalanceOrder]);

  // Si el slide activo ya no existe (cuenta eliminada) o quedó oculto, saltar
  // al primero que siga visible en el carrusel.
  useEffect(() => {
    if (cuentasLoading) return;
    if (balanceSlideIds.includes(balanceScope)) return;
    const fallback = balanceSlideIds[0] || 'todas';
    setBalanceScope(fallback);
    try {
      localStorage.setItem(DASHBOARD_BALANCE_CUENTA_KEY, fallback);
    } catch (_) {}
  }, [cuentasLoading, balanceScope, balanceSlideIds]);

  const balanceSlideLabel = useCallback((id) => {
    if (id === 'todas') return 'Total';
    return cuentasActivas.find((x) => String(x._id) === String(id))?.nombre || 'Cuenta';
  }, [cuentasActivas]);

  const isNarrow = windowWidth < 640;
  /** PC (≥1280): modal centrado; tablets (<1280) usan modo cel (bottom sheet) */
  const isDesktopModal = windowWidth >= 1280;

  // Mientras el modal de orden está abierto, usar una copia editable (sin afectar el carrusel en tiempo real).
  // Se parte de la lista COMPLETA (incluye ocultas) para poder mostrarlas de nuevo desde ahí.
  useEffect(() => {
    if (balanceMenuOpen) {
      setDraftBalanceOrder(orderedSlideIdsAll);
    } else {
      setDraftBalanceOrder(null);
    }
  }, [balanceMenuOpen, orderedSlideIdsAll]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (resumenMenuRef.current && !resumenMenuRef.current.contains(e.target)) {
        setResumenMenuOpen(false);
      }
    };
    // Nota: NO cerramos el modal de "Orden de cuentas" aquí.
    // Ese modal se cierra por su propio backdrop y necesita ejecutar su onClose para guardar el orden.
    if (resumenMenuOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
      return () => document.removeEventListener('pointerdown', handleClickOutside);
    }
  }, [resumenMenuOpen]);

  const setResumenChartTypeAndSave = (type) => {
    setResumenChartType(type);
    setResumenMenuOpen(false);
    try {
      localStorage.setItem('quantis_resumen_chart_type', type);
      if (type !== 'hidden') {
        localStorage.setItem('quantis_resumen_chart_last_type', type);
      }
    } catch (_) {}
  };

  const showResumenChart = () => {
    try {
      const last = localStorage.getItem('quantis_resumen_chart_last_type') || 'donut';
      setResumenChartTypeAndSave(['bar', 'pie', 'donut'].includes(last) ? last : 'donut');
    } catch {
      setResumenChartTypeAndSave('donut');
    }
  };

  // Función para obtener la fecha actual en formato local
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para obtener el día de una fecha string sin problemas de UTC
  const getDayFromDateString = (dateString) => {
    if (!dateString) return '';
    const day = dateString.split('-')[2];
    return day ? parseInt(day, 10) : '';
  };

  // Función para obtener el nombre del tipo de ingreso
  const getTipoIngresoName = (tipo) => {
    const tipos = {
      'quincena': 'Quincena',
      'fin_mes': 'Fin de Mes',
      'comision': 'Comisión',
      'bonificacion': 'Bonificación',
      'inversion': 'Inversión'
    };
    
    // Si está en la lista predefinida, devolver el nombre
    if (tipos[tipo]) {
      return tipos[tipo];
    }
    
    // Si no está en la lista, es un tipo personalizado, devolver tal como está
    return tipo;
  };

  // Función para obtener el nombre de la categoría de gasto (3 por defecto + personalizadas)
  const getCategoriaGastoName = (categoria) => {
    const categorias = { alimentacion: 'Alimentación', transporte: 'Transporte', otros: 'Otros' };
    return categorias[categoria] || categoria;
  };

  // Estados del formulario
  const [formData, setFormData] = useState({
    tipo: '',
    tipoPersonalizado: '',
    categoria: '',
    categoriaPersonalizada: '',
    monto: '',
    moneda: 'GTQ',
    fecha: getCurrentDate(),
    descripcion: '',
    esRecurrente: false,
    esCuota: false,
    cuotaId: '',
    esGastoEnCuotas: false,
    cuotasTotal: 3,
    cuotasPagadas: 0,
    frecuenciaPagoCuota: 'mensual',
    metodoPago: 'efectivo',
    tarjetaId: '',
    cuentaId: ''
  });

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  const formatLocalYmd = useCallback((d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const getResumenParams = useCallback((scope) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    const base = { fechaInicio: formatLocalYmd(start), fechaFin: formatLocalYmd(end) };
    if (!scope || scope === 'todas') return base;
    return { ...base, cuentaId: scope };
  }, [formatLocalYmd]);

  const loadResumenForScope = useCallback(async (scope) => {
    const params = getResumenParams(scope);
    const [resumenIngresosResponse, resumenGastosResponse] = await Promise.all([
      ingresoService.getResumenIngresos(params),
      gastoService.getResumenGastos(params)
    ]);
    const resumenCombinado = {
      ingresos: resumenIngresosResponse?.data ?? resumenIngresosResponse,
      gastos: resumenGastosResponse?.data ?? resumenGastosResponse
    };
    setResumen(resumenCombinado);
  }, [getResumenParams]);

  // Al abrir el modal de ingreso, normalizar tipo solo si no existe en chips (fijos, API o sesión)
  useEffect(() => {
    if (!showIngresoModal) return;
    const validSlugs = ['quincena', 'fin_mes', 'comision', 'inversion', 'personalizado'];
    const customLabels = [
      ...(tiposIngreso || []).map(t => t.label).filter(Boolean),
      ...sessionTiposIngreso.map(t => t.label)
    ];
    const isValid = validSlugs.includes(formData.tipo) || customLabels.includes(formData.tipo);
    if (formData.tipo && !isValid) {
      setFormData(prev => ({ ...prev, tipo: '', tipoPersonalizado: '' }));
    }
  }, [showIngresoModal, formData.tipo, tiposIngreso, sessionTiposIngreso]);

  // En modo celular, al abrir "Nueva categoría" hacer scroll suave hasta el bloque para que se vea
  useEffect(() => {
    if (formData.categoria === 'personalizado' && prevCategoriaGastoRef.current !== 'personalizado') {
      prevCategoriaGastoRef.current = 'personalizado';
      if (windowWidth < 1280) {
        const t = setTimeout(() => {
          nuevaCategoriaBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
        return () => clearTimeout(t);
      }
    } else {
      prevCategoriaGastoRef.current = formData.categoria;
    }
  }, [formData.categoria, windowWidth]);

  // En modo celular, al abrir "Crear tipo personalizado" (ingreso) hacer scroll suave hasta el bloque
  useEffect(() => {
    if (formData.tipo === 'personalizado' && prevTipoIngresoRef.current !== 'personalizado') {
      prevTipoIngresoRef.current = 'personalizado';
      if (windowWidth < 1280) {
        const t = setTimeout(() => {
          nuevoTipoIngresoBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
        return () => clearTimeout(t);
      }
    } else {
      prevTipoIngresoRef.current = formData.tipo;
    }
  }, [formData.tipo, windowWidth]);

  const loadDashboardData = async () => {
    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      // Mostrar las últimas N transacciones en orden cronológico (no "N ingresos + N gastos")
      const RECENT_TOTAL = 10;
      const FETCH_PER_TYPE = 30; // traer más de cada tipo para poder elegir las últimas por fecha

      const [ingresosSettled, gastosSettled, cuotasSettled] = await Promise.allSettled([
        ingresoService.getIngresos({ limit: FETCH_PER_TYPE }),
        gastoService.getGastos({ limit: FETCH_PER_TYPE }),
        cuotaService.getCuotas().catch(() => ({ data: { cuotas: [] } }))
      ]);
      const ingresosRes = ingresosSettled?.status === 'fulfilled' ? ingresosSettled.value : null;
      const gastosRes = gastosSettled?.status === 'fulfilled' ? gastosSettled.value : null;
      const cuotasRes = cuotasSettled?.status === 'fulfilled' ? cuotasSettled.value : null;

      // Extraer el array cubriendo variaciones de la API: res.data.ingresos, res.ingresos, res.data como array
      const getArray = (res, key) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.data && Array.isArray(res.data[key])) return res.data[key];
        if (res[key] && Array.isArray(res[key])) return res[key];
        if (Array.isArray(res.data)) return res.data;
        return [];
      };

      const ingresosRaw = getArray(ingresosRes, 'ingresos');
      const gastosRaw = getArray(gastosRes, 'gastos');
      const todasCuotas = getArray(cuotasRes, 'cuotas');
      if (import.meta.env.DEV && ingresosSettled?.status === 'rejected' && gastosRaw.length > 0) {
        console.warn('[Dashboard] GET ingresos falló; solo se muestran gastos.', ingresosSettled.reason?.response?.status);
      }
      const ingresos = ingresosRaw.map(ingreso => ({ ...ingreso, tipoTransaccion: 'ingreso' }));
      const gastos = gastosRaw.map(gasto => ({ ...gasto, tipoTransaccion: 'gasto' }));
      const planesCuotas = todasCuotas.map(c => ({ ...c, tipoTransaccion: 'planCuotas' }));
      // Ordenar por createdAt para mostrar últimos 10 (ingresos, gastos y planes de cuotas)
      const getCreated = (t) => (t.createdAt ? new Date(t.createdAt).getTime() : 0);
      const getFecha = (t) => (t.fecha ? new Date(t.fecha).getTime() : 0);
      const todasLasTransacciones = [...ingresos, ...gastos, ...planesCuotas]
        .sort((a, b) => {
          const ca = getCreated(a);
          const cb = getCreated(b);
          if (cb !== ca) return cb - ca; // más recientemente creado primero
          return getFecha(b) - getFecha(a); // desempate por fecha
        })
        .slice(0, RECENT_TOTAL);
      setTransacciones(todasLasTransacciones);

      const [
        cuotasResponse,
        tarjetasResponse,
        prestamosResponse,
        balancesResponse
      ] = await Promise.all([
        cuotaService.getProximasCuotas(7).catch(() => ({ data: { cuotas: [] } })),
        tarjetaService.getTarjetas().catch(() => ({ data: { tarjetas: [] } })),
        prestamoService.getPrestamos({ estado: 'activo' }).catch(() => ({ data: { prestamos: [] } })),
        cuentaService.getBalances().catch(() => ({ data: { balances: [] } }))
      ]);
      // Un gasto/ingreso puede haber creado una cuenta "Efectivo" nueva en
      // el momento (resuelto automático del backend): refrescar la lista de
      // cuentas para que el balance la reconozca de inmediato, sin esperar
      // a recargar la página.
      refetchCuentas();
      const balRaw =
        balancesResponse?.data?.balances ??
        balancesResponse?.balances ??
        [];
      setBalancesPorCuenta(Array.isArray(balRaw) ? balRaw : []);
      await loadResumenForScope(balanceScope);

      setCuotasProximas(cuotasResponse?.data?.cuotas || cuotasResponse?.cuotas || []);
      const paraPagar = todasCuotas.filter(c => c.estado !== 'pagada' && c.estado !== 'cancelada');
      setCuotasParaPagar(paraPagar);
      const tarjetasRaw = tarjetasResponse?.data?.tarjetas || tarjetasResponse?.tarjetas || [];
      const creditoConCortePago = tarjetasRaw.filter(
        t => t.tipo === 'credito' && t.esActiva !== false && t.diaPago != null && t.fechaCorte != null
      );
      setTarjetasCredito(creditoConCortePago);
      setPrestamosActivos(prestamosResponse?.data?.prestamos || prestamosResponse?.prestamos || []);

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      setError('Error al cargar los datos');
      // No vaciar transacciones: ya se setearon antes si ingresos/gastos respondieron
      setCuotasProximas([]);
      setCuotasParaPagar([]);
      setPrestamosActivos([]);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    // Cuando cambia el balance/cuenta seleccionada, refrescar solo el resumen del mes actual
    loadResumenForScope(balanceScope).catch((e) => {
      if (import.meta.env.DEV) console.warn('[Dashboard] No se pudo refrescar resumen del mes', e);
    });
  }, [balanceScope, loadResumenForScope]);

  useEffect(() => {
    const id = location.state?.openPrestamoId;
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await prestamoService.getPrestamoById(id);
        const p = data?.data?.prestamo ?? data?.prestamo ?? data;
        if (!cancelled && p && (p._id || p.id)) {
          setPrestamoDetalleDesdeCalendario(p);
        }
      } catch (_) {
        if (!cancelled) setPrestamoDetalleDesdeCalendario(null);
      } finally {
        if (!cancelled) {
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [location.state?.openPrestamoId, location.pathname, navigate]);

  const totalIngresos = useMemo(() => {
    if (!resumen?.ingresos?.totalesGenerales) return 0;
    return resumen.ingresos.totalesGenerales.reduce((a, i) => a + (i.total || 0), 0);
  }, [resumen]);
  const totalGastos = useMemo(() => {
    if (!resumen?.gastos?.totalesGenerales) return 0;
    return resumen.gastos.totalesGenerales.reduce((a, g) => a + (g.total || 0), 0);
  }, [resumen]);

  const resumenIngresosGastosOption = useMemo(() => {
    if (resumenChartType === 'hidden') return null;
    const chartColors = getChartColors();
    const categories = ['Ingresos', 'Gastos'];
    const values = [totalIngresos, totalGastos];
    const colors = [chartColors.income, chartColors.expense];
    const pieData = [
      { value: totalIngresos, name: 'Ingresos', itemStyle: { color: chartColors.income } },
      { value: totalGastos, name: 'Gastos', itemStyle: { color: chartColors.expense } }
    ].filter(d => d.value > 0);
    // Sin ingresos ni gastos este mes: un solo segmento gris que cubre el 100%
    // del anillo es visualmente indistinguible de un spinner cargando para
    // siempre. En pie/dona mostramos el estado vacío real de ChartContainer
    // (no hay nada que graficar); en barras, barras en cero sí comunican bien.
    const data = pieData;

    if (resumenChartType !== 'bar' && data.length === 0) {
      return null;
    }

    if (resumenChartType === 'bar') {
      const grid = isNarrow
        ? { left: '18%', right: '5%', top: '2%', bottom: '10%', containLabel: true }
        : { left: '10%', right: '6%', top: '2%', bottom: '6%', containLabel: true };
      return {
        ...getBarChartOption(darkMode),
        grid,
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: { fontSize: isNarrow ? 11 : 12, interval: 0 },
          axisTick: { show: true }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: isNarrow ? 10 : 12,
            margin: isNarrow ? 1 : 4
          },
          splitLine: { show: true }
        },
        series: [{
          type: 'bar',
          data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i] } })),
          barMaxWidth: isNarrow ? 60 : 55
        }]
      };
    }
    const isPie = resumenChartType === 'pie';
    const legendNarrow = {
      orient: 'horizontal',
      left: 'center',
      bottom: '10%',
      top: undefined,
      itemWidth: 14,
      itemHeight: 10,
      itemGap: 8,
      textStyle: { 
        fontSize: 11,
        fontWeight: 400,
        color: darkMode ? '#e5e7eb' : undefined
      }
    };
    const legendWide = { 
      orient: 'horizontal', 
      left: 'center', 
      top: '6%', 
      itemGap: 10,
      textStyle: {
        fontWeight: 400,
        color: darkMode ? '#e5e7eb' : undefined
      }
    };
    if (isPie) {
      return {
        ...getPieChartOption(darkMode),
        legend: isNarrow ? legendNarrow : legendWide,
        series: [{
          name: 'Resumen',
          type: 'pie',
          radius: isNarrow ? '45%' : '60%',
          center: isNarrow ? ['50%', '50%'] : ['50%', '50%'],
          data,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.3)' } },
          label: { 
            fontSize: isNarrow ? 11 : 13,
            fontWeight: 400,
            color: darkMode ? '#e5e7eb' : undefined
          },
          labelLine: {
            show: true,
            length: isNarrow ? 15 : 20,
            length2: isNarrow ? 10 : 15,
            lineStyle: {
              color: darkMode ? '#9ca3af' : undefined,
              width: 1
            }
          }
        }]
      };
    }
    return {
      ...getPieChartOption(darkMode),
      legend: isNarrow ? legendNarrow : { 
        top: '6%', 
        left: 'center', 
        itemGap: 10,
        textStyle: {
          fontWeight: darkMode ? 'normal' : 'normal',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }
      },
      series: [{
        name: 'Resumen',
        type: 'pie',
        radius: isNarrow ? ['32%', '58%'] : ['45%', '70%'],
        center: isNarrow ? ['50%', '50%'] : ['50%', '50%'],
        avoidLabelOverlap: false,
        padAngle: 5,
        data,
        itemStyle: { borderRadius: 10, borderWidth: 0, borderColor: 'transparent' },
        label: {
          show: false,
          position: 'center',
          fontSize: isNarrow ? 11 : 12,
          textBorderWidth: 0,
          textShadowBlur: 0
        },
        emphasis: {
          label: {
            show: true,
            fontSize: isNarrow ? 12 : 16,
            fontWeight: 'normal',
            formatter: '{b}\n{c}',
            color: darkMode ? '#f9fafb' : undefined,
            textBorderWidth: 0,
            textBorderColor: 'transparent',
            textShadowBlur: 0
          },
          scale: true,
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)' }
        },
        labelLine: { show: false }
      }]
    };
  }, [darkMode, colorPreset, totalIngresos, totalGastos, resumenChartType, isNarrow]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-GT', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Balance = ingresos - gastos reales. Las compras a cuotas no suman el total del plan;
  // solo se registran como gasto al pagar cada cuota (poco a poco).
  const calculateTotalBalance = useCallback(() => {
    if (!resumen?.ingresos?.totalesGenerales || !resumen?.gastos?.totalesGenerales) {
      return { GTQ: 0, USD: 0 };
    }

    const balances = { GTQ: 0, USD: 0 };

    resumen.ingresos.totalesGenerales.forEach((item) => {
      if (item._id === 'GTQ') {
        balances.GTQ += item.total;
      } else if (item._id === 'USD') {
        balances.USD += item.total;
      }
    });

    resumen.gastos.totalesGenerales.forEach((item) => {
      if (item._id === 'GTQ') {
        balances.GTQ -= item.total;
      } else if (item._id === 'USD') {
        balances.USD -= item.total;
      }
    });

    return balances;
  }, [resumen]);

  // Saldo real de todas las cuentas (saldoInicial + ingresos - gastos, todo el
  // historial) para decidir el humor de la mascota - a diferencia de
  // calculateTotalBalance() arriba, que es el neto del mes/alcance elegido.
  const cuentasBalanceTotal = useMemo(() => {
    const agg = { GTQ: 0, USD: 0 };
    balancesPorCuenta.forEach((r) => {
      if (r.moneda === 'GTQ') agg.GTQ += Number(r.balance || 0);
      else if (r.moneda === 'USD') agg.USD += Number(r.balance || 0);
    });
    return agg;
  }, [balancesPorCuenta]);

  const triggerMascotEating = useCallback(() => {
    setIsEatingMascot(true);
    if (eatingMascotTimeoutRef.current) window.clearTimeout(eatingMascotTimeoutRef.current);
    eatingMascotTimeoutRef.current = window.setTimeout(() => setIsEatingMascot(false), 1600);
  }, []);

  useEffect(() => () => {
    if (eatingMascotTimeoutRef.current) window.clearTimeout(eatingMascotTimeoutRef.current);
  }, []);

  const mascotMood = isEatingMascot
    ? 'eating'
    : (cuentasBalanceTotal.GTQ < 0 || cuentasBalanceTotal.USD < 0)
      ? 'sad'
      : 'happy';

  const balanceForScope = useCallback(
    (scope) => {
      if (scope === 'todas') {
        return calculateTotalBalance();
      }
      const rows = balancesPorCuenta.filter((b) => b.cuentaId === scope);
      const agg = { GTQ: 0, USD: 0 };
      rows.forEach((r) => {
        if (r.moneda === 'GTQ') agg.GTQ += Number(r.balance || 0);
        else if (r.moneda === 'USD') agg.USD += Number(r.balance || 0);
      });
      return agg;
    },
    [balancesPorCuenta, calculateTotalBalance]
  );

  // Saldo de una cuenta específica (por id), para mostrar/validar en los
  // formularios rápidos de gasto/ingreso del dashboard.
  const saldoDeCuenta = useCallback(
    (cuentaId) => {
      if (!cuentaId) return 0;
      const row = balancesPorCuenta.find((b) => b.cuentaId === cuentaId);
      return Number(row?.balance || 0);
    },
    [balancesPorCuenta]
  );

  const handleBalanceScopeChange = useCallback((v) => {
    setBalanceScope(v);
    setBalanceDragDx(0);
    try {
      localStorage.setItem(DASHBOARD_BALANCE_CUENTA_KEY, v);
    } catch (_) {}
  }, []);

  const toggleHiddenBalanceId = useCallback(
    (id) => {
      const key = String(id);
      const isHidden = hiddenBalanceIds.includes(key);
      if (!isHidden) {
        const visibleCount = orderedSlideIdsAll.length - hiddenBalanceIds.length;
        // No dejar el carrusel sin ningún slide visible: la última tarjeta
        // visible (sea "Total" o una cuenta) no se puede ocultar.
        if (visibleCount <= 1) return;
      }
      const next = isHidden
        ? hiddenBalanceIds.filter((x) => x !== key)
        : [...hiddenBalanceIds, key];
      persistHiddenBalanceIds(next);
      // Si acabamos de ocultar el slide que se estaba viendo, saltar al
      // primer slide que quede visible en vez de asumir que "Total" sigue ahí.
      if (!isHidden && balanceScope === id) {
        const fallback = orderedSlideIdsAll.find((x) => x !== key && !next.includes(String(x)));
        handleBalanceScopeChange(fallback || 'todas');
      }
    },
    [hiddenBalanceIds, persistHiddenBalanceIds, balanceScope, handleBalanceScopeChange, orderedSlideIdsAll]
  );

  const balanceActiveIdx = useMemo(
    () => Math.max(0, balanceSlideIds.indexOf(balanceScope)),
    [balanceSlideIds, balanceScope]
  );

  const measureBalanceTrack = useCallback(() => {
    const el = balanceTrackRef.current;
    if (!el) return;
    const w = el.clientWidth || 0;
    if (w > 0) setBalanceTrackW(w);
  }, []);

  useEffect(() => {
    // Medición inicial (y un re-intento por si al primer paint es 0)
    measureBalanceTrack();
    const t = window.setTimeout(measureBalanceTrack, 50);
    window.addEventListener('resize', measureBalanceTrack);

    const el = balanceTrackRef.current;
    let ro;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measureBalanceTrack());
      ro.observe(el);
    }

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', measureBalanceTrack);
      if (ro) ro.disconnect();
    };
  }, [measureBalanceTrack]);

  const setDxSmooth = useCallback((dx) => {
    balanceDxRafRef.current.pendingDx = dx;
    if (balanceDxRafRef.current.raf) return;
    balanceDxRafRef.current.raf = window.requestAnimationFrame(() => {
      balanceDxRafRef.current.raf = 0;
      setBalanceDragDx(balanceDxRafRef.current.pendingDx);
    });
  }, []);

  const commitBalanceSwipe = useCallback(
    (dx) => {
      const el = balanceTrackRef.current;
      const threshold = el ? el.clientWidth * 0.2 : 60;
      let newIdx = balanceActiveIdx;
      if (dx > threshold && balanceActiveIdx > 0) newIdx = balanceActiveIdx - 1;
      else if (dx < -threshold && balanceActiveIdx < balanceSlideIds.length - 1) newIdx = balanceActiveIdx + 1;
      setDxSmooth(0);
      if (newIdx !== balanceActiveIdx) {
        handleBalanceScopeChange(balanceSlideIds[newIdx]);
      }
    },
    [balanceActiveIdx, balanceSlideIds, handleBalanceScopeChange]
  );

  // Limita cuánto se puede arrastrar el carrusel: en los extremos (no hay
  // cuenta anterior/siguiente) aplica resistencia fuerte para que no se
  // "asome" nada donde no hay otra tarjeta, y en cualquier caso nunca deja
  // arrastrar más de un ancho de tarjeta completo (evita revelar de golpe la
  // tarjeta subsiguiente en un gesto largo o rápido).
  const clampBalanceDx = useCallback(
    (dx) => {
      let clamped = dx;
      const atFirst = balanceActiveIdx === 0;
      const atLast = balanceActiveIdx === balanceSlideIds.length - 1;
      if (atFirst && clamped > 0) clamped /= 3;
      if (atLast && clamped < 0) clamped /= 3;
      const w = balanceTrackRef.current?.clientWidth || balanceTrackW || 0;
      if (w > 0) clamped = Math.max(-w, Math.min(w, clamped));
      return clamped;
    },
    [balanceActiveIdx, balanceSlideIds.length, balanceTrackW]
  );

  const onBalanceTouchStart = useCallback((e) => {
    const t = e.touches[0];
    balanceTouchRef.current = { startX: t.clientX, startY: t.clientY, swiping: false, dx: 0 };
  }, []);

  const onBalanceTouchMove = useCallback((e) => {
    const t = e.touches[0];
    const ref = balanceTouchRef.current;
    const dx = t.clientX - ref.startX;
    const dy = t.clientY - ref.startY;
    if (!ref.swiping && Math.abs(dy) > Math.abs(dx)) return;
    ref.swiping = true;
    const clamped = clampBalanceDx(dx);
    ref.dx = clamped;
    setDxSmooth(clamped);
  }, [setDxSmooth, clampBalanceDx]);

  const onBalanceTouchEnd = useCallback(() => {
    const ref = balanceTouchRef.current;
    if (!ref.swiping) { setDxSmooth(0); return; }
    commitBalanceSwipe(ref.dx);
    ref.swiping = false;
  }, [commitBalanceSwipe]);

  const onBalanceMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    balanceMouseRef.current = { dragging: true, startX: e.clientX, dx: 0 };
  }, []);

  const onBalanceMouseMove = useCallback((e) => {
    const ref = balanceMouseRef.current;
    if (!ref.dragging) return;
    const clamped = clampBalanceDx(e.clientX - ref.startX);
    ref.dx = clamped;
    setDxSmooth(clamped);
  }, [setDxSmooth, clampBalanceDx]);

  const onBalanceMouseUpOrLeave = useCallback(() => {
    const ref = balanceMouseRef.current;
    if (!ref.dragging) return;
    ref.dragging = false;
    commitBalanceSwipe(ref.dx);
  }, [commitBalanceSwipe]);

  // Saludo dinámico según la hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Buenos días';
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Función para manejar el cambio del monto
  const handleMontoChange = (e) => {
    let value = e.target.value;
    
    // Remover símbolos de moneda y espacios
    value = value.replace(/[Q$\s]/g, '');
    
    // Permitir solo números y un punto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData({...formData, monto: value});
    }
  };

  // Función para formatear el monto al perder el foco
  const handleMontoBlur = () => {
    if (formData.monto && formData.monto !== '') {
      const numAmount = parseFloat(formData.monto);
      if (!isNaN(numAmount)) {
        // Si no tiene decimales, agregar .00
        const formattedAmount = numAmount.toFixed(2);
        setFormData({...formData, monto: formattedAmount});
      }
    }
  };

  // Preselecciona según en qué cuenta del carrusel de Balance estás
  // parado: si es una cuenta real (no "Efectivo") y coincide la moneda del
  // formulario, esa. Fuera de ese caso (viendo "Todas las cuentas", el
  // slide "Efectivo", o la moneda no coincide), solo se preselecciona si
  // hay una única cuenta REAL activa en esa moneda — si no (0 o 2+), se
  // deja en blanco para que la persona elija/cree una cuenta a propósito.
  // "Efectivo" nunca se autoselecciona en ninguna moneda.
  const esEfectivo = (c) => (c?.nombre || '').trim().toLowerCase() === 'efectivo';

  const pickDefaultCuenta = useCallback(
    (moneda) => {
      // Si estás parado en una cuenta específica del carrusel de Balance
      // (no "Todas las cuentas") y su moneda coincide con la del
      // formulario, esa es la cuenta a usar — es una elección explícita.
      if (balanceScope !== 'todas') {
        const actual = cuentasActivas.find((c) => c._id === balanceScope);
        if (actual && actual.moneda === moneda) {
          return actual._id;
        }
      }
      // "Todas las cuentas" (o la moneda no coincide con la del scope
      // actual): solo se preselecciona si hay una única cuenta REAL en esa
      // moneda; si no, se deja en blanco para elegir a propósito.
      const reales = cuentasActivas.filter((c) => c.moneda === moneda && !esEfectivo(c));
      return reales.length === 1 ? reales[0]._id : '';
    },
    [cuentasActivas, balanceScope]
  );

  const handleIngresoSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoadingForm(true);
      setFormError(null);

      if (!formData.cuentaId) {
        setFormError(`Selecciona (o crea) una cuenta en ${formData.moneda} para continuar.`);
        return;
      }

      // Preparar los datos para envío
      const dataToSend = {
        ...formData,
        // Si es personalizado, usar el texto personalizado como tipo principal
        tipo: formData.tipo === 'personalizado' ? formData.tipoPersonalizado : formData.tipo
      };
      
      // Remover tipoPersonalizado de los datos enviados
      delete dataToSend.tipoPersonalizado;
      if (!dataToSend.cuentaId) delete dataToSend.cuentaId;

      // Crear el ingreso
      await ingresoService.createIngreso(dataToSend);
      
      // Si es recurrente, crear también un ingreso recurrente
      if (formData.esRecurrente) {
        try {
          const fechaIngreso = new Date(formData.fecha);
          const diaMes = fechaIngreso.getDate();
          
          await recurrenciaService.createIngresoRecurrente({
            nombre: `${dataToSend.tipo} - ${dataToSend.descripcion || 'Ingreso recurrente'}`.substring(0, 100),
            monto: parseFloat(dataToSend.monto),
            moneda: dataToSend.moneda,
            frecuencia: 'mensual',
            diaPago: diaMes,
            fechaInicio: fechaIngreso.toISOString(),
            descripcion: dataToSend.descripcion || '',
            categoria: dataToSend.tipo,
            esActivo: true,
            ...(dataToSend.cuentaId ? { cuentaId: dataToSend.cuentaId } : {})
          });
        } catch (recurrenciaError) {
          console.error('Error creando ingreso recurrente:', recurrenciaError);
          // No fallar si no se puede crear la recurrencia, solo loguear
        }
      }
      
      setShowIngresoModal(false);
      resetForm();
      loadDashboardData();
      reloadConteos();
    } catch (error) {
      console.error('Error creando ingreso:', error);
      setFormError(error?.response?.data?.message || error?.message || 'Error al crear el ingreso');
    } finally {
      setIsLoadingForm(false);
    }
  };

  const resetForm = () => {
    // Si estás viendo una cuenta específica en el carrusel de Balance (no
    // "Todas las cuentas"), el formulario arranca en la moneda de esa
    // cuenta para que pickDefaultCuenta la preseleccione directamente.
    const scopeAccount = balanceScope !== 'todas'
      ? cuentasActivas.find((c) => c._id === balanceScope)
      : null;
    const monedaInicial = scopeAccount ? scopeAccount.moneda : 'GTQ';
    setFormData({
      tipo: '',
      tipoPersonalizado: '',
      categoria: '',
      categoriaPersonalizada: '',
      monto: '',
      moneda: monedaInicial,
      fecha: getCurrentDate(),
      descripcion: '',
      esRecurrente: false,
      esCuota: false,
      cuotaId: '',
      esGastoEnCuotas: false,
      cuotasTotal: 3,
      cuotasPagadas: 0,
      frecuenciaPagoCuota: 'mensual',
      metodoPago: 'efectivo',
      tarjetaId: '',
      cuentaId: pickDefaultCuenta(monedaInicial)
    });
    setFormError(null);
  };

  const cuentasParaMoneda = useMemo(
    () => cuentasActivas.filter((c) => c.moneda === formData.moneda),
    [cuentasActivas, formData.moneda]
  );

  // Tarjeta seleccionada para gasto en cuotas (debe tener diaPago y fechaCorte)
  const tarjetaCuotas = tarjetasCredito.find(t => t._id === formData.tarjetaId);

  const compraPasada = useMemo(
    () => fechaCompraEsAnteriorAHoy(formData.fecha),
    [formData.fecha]
  );

  const validacionPlazoCuotas = useMemo(() => {
    if (!formData.esGastoEnCuotas || !tarjetaCuotas) return { ok: true };
    const fechaStr = String(formData.fecha || '').trim();
    if (!fechaStr) return { ok: true };
    const cuotasT = Math.max(1, Math.floor(Number(formData.cuotasTotal) || 3));
    return compraYPlazoCuotasCoherentes(fechaStr, tarjetaCuotas.diaPago, cuotasT, 'mensual');
  }, [formData.esGastoEnCuotas, formData.fecha, formData.cuotasTotal, tarjetaCuotas]);

  const previewPlanCuotas = useMemo(() => {
    if (!formData.esGastoEnCuotas || !tarjetaCuotas || !validacionPlazoCuotas.ok) return null;
    const cuotasT = Math.max(1, Math.floor(Number(formData.cuotasTotal) || 3));
    const pagRaw = formData.cuotasPagadas === '' ? 0 : Number(formData.cuotasPagadas);
    const pag = Math.max(0, Math.min(cuotasT - 1, Math.floor(Number.isNaN(pagRaw) ? 0 : pagRaw)));
    const primera = getPrimeraCuotaFecha(formData.fecha, tarjetaCuotas.diaPago);
    if (!primera) return null;
    const fi = new Date(primera);
    fi.setHours(0, 0, 0, 0);
    const ultima = fechaUltimaCuotaDesdePrimera(fi, cuotasT, 'mensual');
    const proximo = proximoPagoTrasCuotasPagadas(fi, pag, 'mensual');
    return {
      primera: fi,
      ultima,
      proximo,
      siguienteNum: pag + 1,
      cuotasT,
      pag,
    };
  }, [
    formData.esGastoEnCuotas,
    formData.cuotasTotal,
    formData.cuotasPagadas,
    formData.fecha,
    tarjetaCuotas,
    validacionPlazoCuotas.ok,
  ]);

  /** Solo si la fecha de compra es anterior a hoy: estima cuotas vencidas (automático). */
  useEffect(() => {
    if (!formData.esGastoEnCuotas) return;
    const t = tarjetasCredito.find((x) => x._id === formData.tarjetaId);
    if (!t || !formData.fecha) return;
    const cuotasT = Math.max(1, Math.floor(Number(formData.cuotasTotal) || 3));
    const coh = compraYPlazoCuotasCoherentes(formData.fecha, t.diaPago, cuotasT, 'mensual');
    if (!coh.ok) {
      setFormData((prev) => (prev.cuotasPagadas === 0 ? prev : { ...prev, cuotasPagadas: 0 }));
      return;
    }
    if (!fechaCompraEsAnteriorAHoy(formData.fecha)) {
      setFormData((prev) => {
        if (prev.cuotasPagadas === 0) return prev;
        return { ...prev, cuotasPagadas: 0 };
      });
      return;
    }
    const primera = getPrimeraCuotaFecha(formData.fecha, t.diaPago);
    if (!primera) return;
    const est = estimarCuotasPagadasPorCalendario(primera, new Date(), cuotasT, 'mensual');
    setFormData((prev) => {
      if (prev.cuotasPagadas === est) return prev;
      return { ...prev, cuotasPagadas: est };
    });
  }, [
    formData.esGastoEnCuotas,
    formData.fecha,
    formData.tarjetaId,
    formData.cuotasTotal,
    tarjetasCredito,
  ]);

  // Validación: deshabilitar Crear en modal Ingreso si faltan datos
  const ingresoInvalido = useMemo(() => {
    const montoNum = parseFloat(String(formData.monto).replace(/,/g, '')) || 0;
    const sinMonto = !formData.monto || montoNum <= 0;
    const sinTipo = !formData.tipo || (formData.tipo === 'personalizado' && !formData.tipoPersonalizado?.trim());
    const sinFecha = !formData.fecha;
    const sinCuenta = !formData.cuentaId?.trim();
    return sinMonto || sinTipo || sinFecha || sinCuenta;
  }, [formData.monto, formData.tipo, formData.tipoPersonalizado, formData.fecha, formData.cuentaId]);

  // Validación: deshabilitar Crear en modal Gasto si faltan datos
  const gastoInvalido = useMemo(() => {
    const montoNum = parseFloat(String(formData.monto).replace(/,/g, '')) || 0;
    if (formData.esGastoEnCuotas) {
      if (tarjetasCredito.length === 0) return true;
      const sinCategoriaCuota = !formData.categoria || (formData.categoria === 'personalizado' && !formData.categoriaPersonalizada?.trim());
      const sinFechaCompra = !String(formData.fecha || '').trim();
      return (
        !formData.tarjetaId?.trim()
        || !formData.monto
        || montoNum <= 0
        || sinFechaCompra
        || sinCategoriaCuota
        || !validacionPlazoCuotas.ok
      );
    }
    const sinCategoria = !formData.categoria || (formData.categoria === 'personalizado' && !formData.categoriaPersonalizada?.trim());
    const sinCuentaOTarjeta =
      formData.metodoPago === 'tarjeta_credito'
        ? !formData.tarjetaId?.trim()
        : !formData.cuentaId?.trim();
    return !formData.monto || montoNum <= 0 || sinCategoria || !formData.fecha || sinCuentaOTarjeta;
  }, [
    formData.esGastoEnCuotas,
    formData.tarjetaId,
    formData.cuentaId,
    formData.metodoPago,
    formData.monto,
    formData.categoria,
    formData.categoriaPersonalizada,
    formData.fecha,
    formData.cuotasTotal,
    validacionPlazoCuotas.ok,
    tarjetasCredito.length,
  ]);

  // Chips de tipo de ingreso / categoría de gasto, ordenados por cuántos
  // registros tiene cada uno (el más usado primero). Empates conservan el
  // orden original gracias al sort estable.
  const ingresoTipoChips = useMemo(() => {
    const builtIns = [
      { kind: 'builtin', value: 'quincena', label: 'Quincena', Icon: WalletIcon },
      { kind: 'builtin', value: 'fin_mes', label: 'Fin de Mes', Icon: CurrencyDollarIcon },
      { kind: 'builtin', value: 'comision', label: 'Comisión', Icon: ChartBarIcon },
      { kind: 'builtin', value: 'inversion', label: 'Inversión', Icon: BanknotesIcon }
    ];
    const custom = (tiposIngreso || [])
      .filter(t => (t.id != null || t._id != null) && !['quincena', 'comision', 'inversion', 'fin_mes'].includes((t.slug || '').toLowerCase()))
      .map(t => ({
        kind: 'custom',
        value: t.label || t.slug,
        label: t.label,
        tipoId: t.id ?? t._id,
        Icon: getIconComponent(normalizeIconKey(t.iconKey, 'WalletIcon'))
      }));
    const session = (sessionTiposIngreso || []).map(t => ({
      kind: 'session',
      value: t.label,
      label: t.label,
      sessionId: t.sessionId,
      Icon: getIconComponent(normalizeIconKey(t.iconKey, 'WalletIcon'))
    }));
    return [...builtIns, ...custom, ...session]
      .map((item, idx) => ({ ...item, _count: conteoPorTipoIngreso[item.value] || 0, _idx: idx }))
      .sort((a, b) => b._count - a._count || a._idx - b._idx);
  }, [tiposIngreso, sessionTiposIngreso, conteoPorTipoIngreso]);

  const gastoCategoriaChips = useMemo(() => {
    const builtIns = [
      { kind: 'builtin', value: 'alimentacion', label: 'Alimentación', Icon: ShoppingCartIcon },
      { kind: 'builtin', value: 'transporte', label: 'Transporte', Icon: TruckIcon },
      { kind: 'builtin', value: 'otros', label: 'Otros', Icon: EllipsisHorizontalCircleIcon }
    ];
    const custom = (tiposGasto || [])
      .filter(t => (t.id != null || t._id != null) && !['alimentacion', 'transporte', 'otros'].includes((t.slug || '').toLowerCase()))
      .map(t => ({
        kind: 'custom',
        value: t.label || t.slug,
        label: t.label,
        catId: t.id ?? t._id,
        Icon: getIconComponent(normalizeIconKey(t.iconKey, 'ShoppingCartIcon'))
      }));
    const session = (sessionTiposGasto || []).map(t => ({
      kind: 'session',
      value: t.label,
      label: t.label,
      sessionId: t.sessionId,
      Icon: getIconComponent(normalizeIconKey(t.iconKey, 'ShoppingCartIcon'))
    }));
    return [...builtIns, ...custom, ...session]
      .map((item, idx) => ({ ...item, _count: conteoPorCategoriaGasto[item.value] || 0, _idx: idx }))
      .sort((a, b) => b._count - a._count || a._idx - b._idx);
  }, [tiposGasto, sessionTiposGasto, conteoPorCategoriaGasto]);

  const handleCancelIngreso = () => {
    setShowIngresoModal(false);
    resetForm();
  };

  const handleGastoSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoadingForm(true);
      setFormError(null);

      if (formData.esGastoEnCuotas) {
        // Crear plan de cuotas (gasto en cuotas) — requiere tarjeta con corte y pago
        const tarjeta = tarjetasCredito.find(t => t._id === formData.tarjetaId);
        if (!tarjeta || !formData.tarjetaId) {
          setFormError('Selecciona una tarjeta de crédito con día de corte y día de pago configurados.');
          return;
        }
        const montoTotal = parseFloat(String(formData.monto).replace(/,/g, '')) || 0;
        const cuotasTotal = Math.max(1, Math.floor(Number(formData.cuotasTotal) || 3));
        const coh = compraYPlazoCuotasCoherentes(formData.fecha, tarjeta.diaPago, cuotasTotal, 'mensual');
        if (!coh.ok) {
          setFormError(
            coh.motivo === 'plan_ya_terminado'
              ? 'Con esa fecha de compra y ese número de cuotas el plan ya habría terminado. Aumenta las cuotas o indica una fecha de compra más reciente.'
              : 'No se pudo calcular la 1.ª cuota. Revisa la tarjeta y la fecha de compra.'
          );
          return;
        }
        const rawPag =
          formData.cuotasPagadas === '' ? 0 : Number(formData.cuotasPagadas);
        const cuotasPagadas = Math.max(
          0,
          Math.min(cuotasTotal - 1, Math.floor(Number.isNaN(rawPag) ? 0 : rawPag))
        );
        const montoCuota = Math.round((montoTotal / cuotasTotal) * 100) / 100;
        const frecuenciaPago = 'mensual';
        const primeraCuota = getPrimeraCuotaFecha(formData.fecha, tarjeta.diaPago);
        if (!primeraCuota) {
          setFormError('No se pudo calcular la fecha del primer pago. Revisa la tarjeta y la fecha de compra.');
          return;
        }
        const fechaInicio = new Date(primeraCuota);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaVencimiento = fechaUltimaCuotaDesdePrimera(fechaInicio, cuotasTotal, frecuenciaPago);
        fechaVencimiento.setHours(12, 0, 0, 0);
        const proximoPagoDate = proximoPagoTrasCuotasPagadas(fechaInicio, cuotasPagadas, frecuenciaPago);
        proximoPagoDate.setHours(12, 0, 0, 0);
        const nombre = (formData.descripcion || 'Compra a cuotas').trim().substring(0, 100);
        const categoriaCuota = formData.categoria === 'personalizado' ? formData.categoriaPersonalizada : formData.categoria;
        await cuotaService.createCuota({
          nombre,
          montoTotal,
          montoCuota,
          cuotasTotal,
          cuotasPagadas,
          moneda: formData.moneda,
          frecuenciaPago,
          fechaInicio: fechaInicio.toISOString(),
          fechaVencimiento: fechaVencimiento.toISOString(),
          proximoPago: proximoPagoDate.toISOString(),
          tarjeta: formData.tarjetaId,
          categoria: categoriaCuota || undefined,
          descripcion: formData.descripcion ? formData.descripcion.substring(0, 300) : undefined
        });
        setShowGastoModal(false);
        resetForm();
        loadDashboardData();
        return;
      }

      if (formData.metodoPago === 'tarjeta_credito' && !formData.tarjetaId) {
        setFormError('Selecciona la tarjeta con la que pagaste.');
        return;
      }

      if (
        formData.metodoPago !== 'tarjeta_credito' &&
        !formData.cuentaId
      ) {
        setFormError(`Selecciona (o crea) una cuenta en ${formData.moneda} para continuar.`);
        return;
      }

      if (formData.metodoPago !== 'tarjeta_credito' && formData.cuentaId) {
        const montoNum = parseFloat(String(formData.monto).replace(/,/g, '')) || 0;
        const disponible = saldoDeCuenta(formData.cuentaId);
        if (montoNum > disponible) {
          setFormError(
            `No tienes suficiente saldo en esta cuenta. Disponible: ${formatCurrency(disponible, formData.moneda)}.`
          );
          return;
        }
      }

      // Gasto normal
      const dataToSend = {
        ...formData,
        categoria: formData.categoria === 'personalizado' ? formData.categoriaPersonalizada : formData.categoria
      };
      delete dataToSend.categoriaPersonalizada;
      delete dataToSend.tipo;
      delete dataToSend.tipoPersonalizado;
      delete dataToSend.esCuota;
      delete dataToSend.cuotaId;
      delete dataToSend.esGastoEnCuotas;
      delete dataToSend.cuotasTotal;
      delete dataToSend.cuotasPagadas;
      delete dataToSend.frecuenciaPagoCuota;
      if (!(dataToSend.metodoPago === 'tarjeta_credito' && dataToSend.tarjetaId)) {
        delete dataToSend.tarjetaId;
      }
      if (!dataToSend.cuentaId) delete dataToSend.cuentaId;

      await gastoService.createGasto(dataToSend);

      setShowGastoModal(false);
      resetForm();
      loadDashboardData();
      reloadConteos();
      triggerMascotEating();
    } catch (error) {
      console.error('Error creando gasto / pagando cuota:', error);
      setFormError(error?.message || (formData.esGastoEnCuotas ? 'Error al crear el plan de cuotas' : 'Error al crear el gasto'));
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleGastoSuccess = () => {
    loadDashboardData(); // Recargar datos después de agregar gasto
  };

  // Al clicar una transacción reciente: abrir modal de detalles (no navegar)
  const handleViewTransaction = (transaccion) => {
    detailsModalScrollRef.current = window.scrollY ?? document.documentElement?.scrollTop ?? 0;
    setShowTransactionDetails(transaccion);
  };

  // Determinar si es ingreso o gasto (las cuotas se muestran como egreso)
  const isIngreso = (transaccion) => {
    return transaccion.tipoTransaccion === 'ingreso';
  };

  const isPlanCuotas = (item) => item?.tipoTransaccion === 'planCuotas';

  // Detectar si un gasto es pago de cuota (descripción generada por el backend al pagar cuota)
  const isGastoPagoCuota = (gasto) => {
    const d = (gasto?.descripcion || '').trim();
    return d.startsWith('Pago de cuota ') || d.startsWith('Pago completo (');
  };

  // Título: priorizar nombre/descripción; si no hay, tipo o categoría
  const getTransaccionLabel = (transaccion) => {
    if (transaccion.tipoTransaccion === 'ingreso') {
      const d = (transaccion.descripcion || '').trim();
      return d || getTipoIngresoName(transaccion.tipo);
    }
    if (transaccion.tipoTransaccion === 'gasto' && isGastoPagoCuota(transaccion)) {
      const d = (transaccion.descripcion || '').trim();
      const parts = d.split(' - ').map(p => p.trim()).filter(Boolean);
      const nombre = parts.length >= 2 ? parts[1] : 'Plan de cuotas';
      return `Pago de cuota - ${nombre}`;
    }
    const d = (transaccion.descripcion || '').trim();
    return d || getCategoriaGastoName(transaccion.categoria);
  };

  // Sublínea: categoría o tipo cuando el título es nombre/descripción; o descripción cuando el título es categoría/tipo
  const getTransaccionSubline = (transaccion) => {
    if (transaccion.tipoTransaccion === 'ingreso') {
      const d = (transaccion.descripcion || '').trim();
      return d ? getTipoIngresoName(transaccion.tipo) : null;
    }
    if (transaccion.tipoTransaccion === 'gasto' && isGastoPagoCuota(transaccion)) {
      return transaccion.categoria ? getCategoriaGastoName(transaccion.categoria) : null;
    }
    const d = (transaccion.descripcion || '').trim();
    return d ? getCategoriaGastoName(transaccion.categoria) : null;
  };
  const showSublineAsDescription = (transaccion) => transaccion.tipoTransaccion !== 'gasto' || !isGastoPagoCuota(transaccion);

  // Icono personalizado según tipo/categoría (tiposIngreso/tiposGasto); fallback a flecha
  const getTransaccionIconKey = (transaccion) => {
    const list = transaccion.tipoTransaccion === 'ingreso'
      ? [...(tiposIngreso || []), ...sessionTiposIngreso]
      : [...(tiposGasto || []), ...sessionTiposGasto];
    const slugOrLabel = transaccion.tipoTransaccion === 'ingreso' ? transaccion.tipo : transaccion.categoria;
    const found = list.find(t => (t.slug || t.label) === slugOrLabel || t.label === slugOrLabel);
    return found?.iconKey || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 pointer-events-none select-none" aria-busy="true">
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ contain: 'layout paint' }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-q-income-muted border-t-q-income mb-4" style={{ willChange: 'transform' }}></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando tu dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Solo en modo app web iOS: un poco más de espacio arriba para que la tarjeta "Buenas noches" se vea bien
  const isStandaloneIOS = isStandalone && isIOS;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 scroll-container">
      <div
        className="max-w-6xl mx-auto px-4 py-6"
        style={isStandaloneIOS ? { paddingTop: '2.5rem' } : undefined}
      >
        {error && (
          <motion.div 
            className="mb-8 bg-q-expense-muted border border-q-expense-muted text-q-expense px-6 py-4 rounded-xl shadow-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-q-expense rounded-full mr-3"></div>
              {error}
            </div>
          </motion.div>
        )}

        {/* Header Simple */}
        <motion.div 
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'Usuario'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Aquí tienes un resumen de tus finanzas
                </p>
              </div>
              <QuantisMascot mood={mascotMood} size={windowWidth >= 640 ? 96 : 80} />
            </div>
            
            <div className="mt-3 sm:mt-3.5 pt-3 sm:pt-3.5 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0">Balance</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 pt-0">
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 bg-q-income rounded-full" />
                      <span>Actualizado</span>
                    </div>
                    {/* menú reubicado: ahora va abajo a la derecha (dentro del carrusel) */}
                    {balanceSlideIds.length > 1 && (
                      <div className="hidden sm:flex items-center -space-x-1 text-gray-400">
                        <button
                          type="button"
                          onClick={() => {
                            const idx = balanceSlideIds.indexOf(balanceScope);
                            const next = Math.max(0, (idx < 0 ? 0 : idx) - 1);
                            handleBalanceScopeChange(balanceSlideIds[next]);
                          }}
                          className="inline-flex items-center justify-center bg-transparent p-0 min-h-0 min-w-0 h-7 w-7 hover:text-gray-200 focus:outline-none focus-visible:outline-none rounded"
                          aria-label="Anterior"
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const idx = balanceSlideIds.indexOf(balanceScope);
                            const next = Math.min(balanceSlideIds.length - 1, (idx < 0 ? 0 : idx) + 1);
                            handleBalanceScopeChange(balanceSlideIds[next]);
                          }}
                          className="inline-flex items-center justify-center bg-transparent p-0 min-h-0 min-w-0 h-7 w-7 hover:text-gray-200 focus:outline-none focus-visible:outline-none rounded"
                          aria-label="Siguiente"
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  ref={balanceTrackRef}
                  className="relative w-full min-w-0 overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y"
                  onTouchStart={onBalanceTouchStart}
                  onTouchMove={onBalanceTouchMove}
                  onTouchEnd={onBalanceTouchEnd}
                  onMouseDown={onBalanceMouseDown}
                  onMouseMove={onBalanceMouseMove}
                  onMouseUp={onBalanceMouseUpOrLeave}
                  onMouseLeave={onBalanceMouseUpOrLeave}
                  aria-label="Balance por cuenta"
                >
                  <div
                    className="flex"
                    style={{
                      // Siempre en % (nunca activeIdx * trackW en px): el ancho de
                      // cada slide es 100% del contenedor, así que trasladar por
                      // porcentaje es exacto. Multiplicar por balanceTrackW (un
                      // entero de clientWidth) arrastra un error de redondeo que
                      // se acumula con el índice y termina asomando la tarjeta
                      // vecina en reposo, más notorio mientras más lejos del
                      // primer slide estés.
                      transform: `translateX(calc(-${balanceActiveIdx * 100}% + ${balanceDragDx}px))`,
                      transition: balanceDragDx !== 0 ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                      willChange: 'transform'
                    }}
                  >
                    {balanceSlideIds.map((id) => {
                      const b = balanceForScope(id);
                      const cuentaDeEsteSlide =
                        id !== 'todas' && id !== 'efectivo'
                          ? cuentasActivas.find((x) => x._id === id)
                          : null;
                      const tieneEfectivoUSD =
                        id === 'efectivo' &&
                        cuentasActivas.some(
                          (c) => c.moneda === 'USD' && (c.nombre || '').trim().toLowerCase() === 'efectivo'
                        );
                      const label =
                        id === 'todas'
                          ? 'Todas las cuentas'
                          : id === 'efectivo'
                            ? 'Efectivo'
                            : cuentaDeEsteSlide?.nombre || 'Cuenta';
                      return (
                        <div
                          key={id}
                          className="min-w-full shrink-0 flex-[0_0_100%] box-border"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 truncate">
                              {label}
                            </p>
                          </div>
                          <div className="space-y-1">
                            {cuentaDeEsteSlide ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-xl sm:text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                                  {formatCurrency(b[cuentaDeEsteSlide.moneda] || 0, cuentaDeEsteSlide.moneda)}
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                                    {formatCurrency(b.GTQ, 'GTQ')}
                                  </span>
                                </div>
                                {(id === 'todas' ? b.USD !== 0 : tieneEfectivoUSD) && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xl sm:text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                                      {formatCurrency(b.USD, 'USD')}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center pt-1.5">
                  {balanceSlideIds.length > 1 ? (
                    <div
                      className="flex flex-1 justify-center items-center gap-1"
                      role="tablist"
                      aria-label="Ir a una vista de balance"
                    >
                      {balanceSlideIds.map((id) => {
                        const active = balanceScope === id;
                        const shortLabel =
                          id === 'todas'
                            ? 'Total'
                            : id === 'efectivo'
                              ? 'Efectivo'
                              : cuentasActivas.find((c) => c._id === id)?.nombre || 'Cuenta';
                        return (
                          <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            title={shortLabel}
                            onClick={() => handleBalanceScopeChange(id)}
                            className="inline-flex items-center justify-center p-1 min-h-0 min-w-0 border-0 bg-transparent cursor-pointer touch-manipulation"
                          >
                            <span
                              className={`block rounded-full transition-all duration-200 ${
                                active
                                  ? 'h-1 w-2.5 bg-q-primary'
                                  : 'h-1 w-1 bg-gray-400/90 dark:bg-gray-500 hover:bg-gray-500 dark:hover:bg-gray-400'
                              }`}
                              aria-hidden
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <div ref={balanceMenuRef} className="shrink-0 -mr-1">
                    <button
                      type="button"
                      onClick={() => setBalanceMenuOpen((o) => !o)}
                      className="inline-flex items-center justify-center p-1 min-h-0 min-w-0 bg-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      aria-label="Opciones de balance"
                    >
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Acciones Rápidas */}
        <motion.div 
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h2>
          <div className="flex gap-3 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={() => { resetForm(); setShowIngresoModal(true); }}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-3 bg-white dark:bg-gray-800 border border-q-income-muted hover:border-q-income hover:bg-q-income-muted text-q-income hover:text-q-income text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 group flex-1"
            >
              <PlusIcon className="h-5 w-5 sm:h-4 sm:w-4 group-hover:rotate-90 transition-transform duration-300" />
              <span className="hidden sm:inline">Agregar Ingreso</span>
              <span className="sm:hidden text-xs">Ingreso</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
                onClick={() => { resetForm(); setShowGastoModal(true); }}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-3 bg-white dark:bg-gray-800 border border-q-expense-muted hover:border-q-expense hover:bg-q-expense-muted text-q-expense hover:text-q-expense text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 group flex-1"
            >
              <MinusIcon className="h-5 w-5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Agregar Gasto</span>
              <span className="sm:hidden text-xs">Gasto</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Widget Préstamos Activos (los planes de cuotas se ven en Transacciones Recientes) */}
        {prestamosActivos.length > 0 && (
          <motion.div 
            className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {/* Widget Préstamos Activos */}
            {prestamosActivos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Préstamos Activos</h3>
                </div>
                <div className="space-y-3">
                  {prestamosActivos.slice(0, 3).map((prestamo) => {
                    const montoPendiente = prestamo.montoTotal - prestamo.montoPagado;
                    return (
                      <div key={prestamo._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            <span className="block line-clamp-2 break-words" title={prestamo.nombre}>{prestamo.nombre}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {prestamo.tipo === 'recibido' ? 'Recibido' : 'Otorgado'}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 ml-2">
                          {formatCurrency(montoPendiente, prestamo.moneda)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Resumen de ingresos y gastos: menú 3 puntos (Barras/Circular/Dona/Ocultar) */}
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Resumen del mes</h2>
          {resumenChartType === 'hidden' ? (
            <div className="flex items-center justify-center py-2">
              <span className="text-xs text-gray-400 dark:text-gray-500">Resumen oculto</span>
              <button
                type="button"
                onClick={showResumenChart}
                className="ml-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline transition-colors"
              >
                Mostrar
              </button>
            </div>
          ) : (
            <div className="relative">
              <ChartContainer
                ref={resumenChartRef}
                option={resumenIngresosGastosOption}
                title=""
                loading={false}
                emptyMessage="Aún no hay movimientos este mes"
                height={isNarrow ? '280px' : '300px'}
                compact
                headerAction={
                  <div ref={resumenMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setResumenMenuOpen((o) => !o)}
                      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      aria-label="Opciones del gráfico"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>
                    {resumenMenuOpen && (
                      <div
                        className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 shadow-lg"
                        role="menu"
                      >
                        {[
                          { id: 'bar', label: 'Barras', Icon: ChartBarIcon },
                          { id: 'pie', label: 'Circular', Icon: ChartPieIcon },
                          { id: 'donut', label: 'Dona', Icon: CircleStackIcon }
                        ].map(({ id, label, Icon }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setResumenChartTypeAndSave(id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${resumenChartType === id ? 'bg-q-primary-muted text-q-primary' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            role="menuitem"
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            {label}
                          </button>
                        ))}
                        <div className="my-1 border-t border-gray-200 dark:border-gray-600" />
                        <button
                          type="button"
                          onClick={() => {
                            resumenChartRef.current?.downloadAsImage?.({
                              type: 'jpeg',
                              name: 'resumen-ingresos-gastos',
                              backgroundColor: darkMode ? '#1f2937' : '#ffffff'
                            });
                            setResumenMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          role="menuitem"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 flex-shrink-0" />
                          Descargar imagen
                        </button>
                        <div className="my-1 border-t border-gray-200 dark:border-gray-600" />
                        <button
                          type="button"
                          onClick={() => setResumenChartTypeAndSave('hidden')}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          role="menuitem"
                        >
                          <EyeSlashIcon className="h-4 w-4 flex-shrink-0" />
                          Ocultar
                        </button>
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          )}
        </motion.div>

         {/* Transacciones Recientes */}
         <motion.div 
           className="mb-8"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 1.0, duration: 0.5 }}
         >
           <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Transacciones Recientes</h2>
           
           <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/80 overflow-hidden">
             {transacciones.length > 0 ? (
               <>
               <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
                 {transacciones.map((transaccion, index) => {
                   if (isPlanCuotas(transaccion)) {
                     const plan = transaccion;
                     const fechaPlan = plan.proximoPago ? formatDateUtil(plan.proximoPago, 'dd MMM') : (plan.createdAt ? formatDate(plan.createdAt) : '');
                     const tituloPlan = (plan.nombre && plan.nombre.trim()) ? plan.nombre.trim() : 'Compra a cuotas';
                     const sublineaPlan = [fechaPlan, 'Plan de cuotas', `${plan.cuotasTotal} cuotas`].filter(Boolean).join(' · ');
                     const planIconKey = getTransaccionIconKey({ tipoTransaccion: 'gasto', categoria: plan.categoria });
                     const PlanIconComponent = planIconKey ? getIconComponent(normalizeIconKey(planIconKey, 'ShoppingCartIcon')) : null;
                     return (
                       <li key={plan._id ? `planCuotas-${plan._id}` : `plan-${index}`}>
                         <button
                           type="button"
                           onClick={() => setShowPlanDetails(plan)}
                           aria-label={`Plan de cuotas: ${tituloPlan}`}
                           className="w-full flex items-center gap-3 py-3.5 px-4 text-left hover:bg-gray-100/80 dark:hover:bg-gray-700/40 active:bg-gray-200/80 dark:active:bg-gray-700/60 transition-colors touch-manipulation"
                         >
                           <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-q-expense-muted text-q-expense">
                             {PlanIconComponent ? <PlanIconComponent className="w-5 h-5" aria-hidden /> : <ShoppingCartIcon className="w-5 h-5" aria-hidden />}
                           </span>
                           <div className="flex-1 min-w-0">
                             <p className="font-medium text-gray-900 dark:text-white truncate">
                               {tituloPlan}
                             </p>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                               {sublineaPlan}
                             </p>
                           </div>
                         </button>
                       </li>
                     );
                   }
                   const isIng = isIngreso(transaccion);
                   const iconKey = getTransaccionIconKey(transaccion);
                   const IconComponent = iconKey ? getIconComponent(normalizeIconKey(iconKey, isIng ? 'WalletIcon' : 'ShoppingCartIcon')) : null;
                   return (
                     <li key={transaccion._id ? `${transaccion.tipoTransaccion}-${transaccion._id}` : `tx-${index}`}>
                       <button
                         type="button"
                         onClick={() => handleViewTransaction(transaccion)}
                         aria-label={`${isIng ? 'Ingreso' : 'Gasto'}, ${formatCurrency(transaccion.monto, transaccion.moneda)}`}
                         className="w-full flex items-center gap-3 py-3.5 px-4 text-left hover:bg-gray-100/80 dark:hover:bg-gray-700/40 active:bg-gray-200/80 dark:active:bg-gray-700/60 transition-colors touch-manipulation"
                       >
                         <span className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isIng ? 'bg-q-income-muted text-q-income' : 'bg-q-expense-muted text-q-expense'}`}>
                           {IconComponent ? (
                             <IconComponent className="w-5 h-5" aria-hidden />
                           ) : isIng ? (
                             <ArrowTrendingUpIcon className="w-5 h-5" aria-hidden />
                           ) : (
                             <ArrowTrendingDownIcon className="w-5 h-5" aria-hidden />
                           )}
                         </span>
                         <div className="flex-1 min-w-0">
                           <p className="font-medium text-gray-900 dark:text-white truncate">
                             {getTransaccionLabel(transaccion)}
                           </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 min-w-0">
                            <span className="whitespace-nowrap leading-none">
                              {String(formatDateUtil(transaccion.fecha, 'dd MMM') || '').replace(' ', '\u00A0')}
                            </span>
                             {getTransaccionSubline(transaccion) && (
                               <>
                                 <span aria-hidden>·</span>
                                 <span className="truncate">{getTransaccionSubline(transaccion)}</span>
                               </>
                             )}
                             {transaccion.cuenta && (
                               <>
                                 <span aria-hidden>·</span>
                                <span className="truncate">
                                  {cuentaById(transaccion.cuenta)?.nombre || 'Cuenta'}
                                </span>
                               </>
                             )}
                             {transaccion.esRecurrente && (
                               <>
                                 <span aria-hidden>·</span>
                                 <span className={isIng ? 'text-q-income' : 'text-q-expense'}>Recurrente</span>
                               </>
                             )}
                           </p>
                         </div>
                         <div className="flex-shrink-0 text-right">
                           <span className={`block font-semibold tabular-nums ${isIng ? 'text-q-income' : 'text-q-expense'}`}>
                             {isIng ? '+' : '−'}{formatCurrency(transaccion.monto, transaccion.moneda)}
                           </span>
                           <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{transaccion.moneda}</span>
                         </div>
                       </button>
                     </li>
                   );
                 })}
               </ul>
               <div className="flex gap-2 p-3 bg-white/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700/80">
                 <button
                   type="button"
                   onClick={() => navigate('/transacciones/ingresos')}
                   className="flex-1 py-2.5 text-sm font-medium text-q-income bg-white dark:bg-gray-800 border border-q-income-muted hover:border-q-income hover:bg-q-income-muted rounded-xl transition-colors"
                 >
                   Ver ingresos
                 </button>
                 <button
                   type="button"
                   onClick={() => navigate('/transacciones/gastos')}
                   className="flex-1 py-2.5 text-sm font-medium text-q-expense bg-white dark:bg-gray-800 border border-q-expense-muted hover:border-q-expense hover:bg-q-expense-muted rounded-xl transition-colors"
                 >
                   Ver gastos
                 </button>
               </div>
               </>
             ) : (
               <motion.div 
                 className="p-8 text-center"
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 1.1, duration: 0.5 }}
               >
                 <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                   <CurrencyDollarIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                   No hay transacciones registradas
                 </h3>
                 <p className="text-gray-500 dark:text-gray-400 mb-4">
                   Comienza registrando tu primera transacción
                 </p>
               </motion.div>
             )}
           </div>
         </motion.div>

        {/* Modal de detalles de transacción: mismo tamaño que Nuevo Ingreso/Gasto en PC */}
        <FloatingModal
          isOpen={!!showTransactionDetails}
          onClose={() => setShowTransactionDetails(null)}
          size="md"
          showCloseButton={true}
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Detalles de la transacción"
          compactHeader={true}
          scrollYRef={detailsModalScrollRef}
        >
          {showTransactionDetails && (() => {
            const t = showTransactionDetails;
            const isIng = isIngreso(t);
            const iconKey = getTransaccionIconKey(t);
            const IconComponent = iconKey ? getIconComponent(normalizeIconKey(iconKey, isIng ? 'WalletIcon' : 'ShoppingCartIcon')) : null;
            const descRaw = t.descripcion || '';
            const cuotaMatch = descRaw.match(/Pago de cuota\s+(\d+)\/(\d+)/i) || descRaw.match(/Cuota\s+(\d+)\/(\d+)/i);
            const pagoCompletoMatch = descRaw.match(/Pago completo\s*\((\d+)\s*cuotas\)/i);
            const cuotaActual = cuotaMatch ? parseInt(cuotaMatch[1], 10) : (pagoCompletoMatch ? parseInt(pagoCompletoMatch[1], 10) : null);
            const cuotaTotal = cuotaMatch ? parseInt(cuotaMatch[2], 10) : (pagoCompletoMatch ? parseInt(pagoCompletoMatch[1], 10) : null);
            const esPagoCompleto = !!pagoCompletoMatch && !cuotaMatch;
            const descripcionUtil = (t.descripcion || '').trim();
            const mostrarDescripcion = descripcionUtil && (
              (isIng && descripcionUtil !== getTransaccionLabel(t)) ||
              (!isIng && !isGastoPagoCuota(t) && descripcionUtil !== getTransaccionLabel(t))
            );
            const DetailRow = ({ label, value, className = '' }) => (
              value != null && value !== '' ? (
                <div className={`flex justify-between items-center gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0 ${className}`}>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
                  <span className="text-sm text-gray-900 dark:text-white text-right break-words min-w-0">{value}</span>
                </div>
              ) : null
            );
            return (
              <div className={isDesktopModal ? 'pt-3 px-6 pb-6 sm:pt-4 sm:px-8 sm:pb-8 max-w-2xl mx-auto' : 'pt-2 px-4 pb-6 sm:px-6'}>
                {/* Cabecera + concepto en bloque compacto */}
                <div className={`flex items-center gap-4 p-4 rounded-2xl mb-4 ${isIng ? 'bg-q-income-muted/60 dark:bg-q-income-muted/30' : 'bg-q-expense-muted/60 dark:bg-q-expense-muted/30'}`}>
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${isIng ? 'bg-q-income/15 text-q-income' : 'bg-q-expense/15 text-q-expense'}`}>
                    {IconComponent ? <IconComponent className="w-6 h-6" /> : (isIng ? <ArrowTrendingUpIcon className="w-6 h-6" /> : <ArrowTrendingDownIcon className="w-6 h-6" />)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isIng ? 'text-q-income' : 'text-q-expense'}`}>
                      {isIng ? 'Ingreso' : 'Gasto'}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{getTransaccionLabel(t)}</p>
                    <p className={`text-xl font-bold ${isIng ? 'text-q-income' : 'text-q-expense'}`}>
                      {isIng ? '+' : '−'}{formatCurrency(t.monto, t.moneda)}
                    </p>
                  </div>
                </div>

                {/* Detalles en una sola columna, ancho contenido para que no quede disperso */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden text-sm">
                  <div className="px-4">
                    {!isIng && isGastoPagoCuota(t) && (() => {
                      const d = (t.descripcion || '').trim();
                      const parts = d.split(' - ').map(p => p.trim()).filter(Boolean);
                      const planName = parts.length >= 2 ? parts[1] : 'Plan de cuotas';
                      const cuotaM = d.match(/Pago de cuota\s+(\d+)\/(\d+)/i);
                      const completoM = d.match(/Pago completo\s*\((\d+)\s*cuotas\)/i);
                      const conceptoVal = cuotaM
                        ? `Pago de cuota ${cuotaM[1]} de ${cuotaM[2]} de ${planName}`
                        : completoM
                          ? `Pago completo (${completoM[1]} cuotas) de ${planName}`
                          : `Pago de cuota de ${planName}`;
                      return <DetailRow key="concepto" label="Concepto" value={conceptoVal} />;
                    })()}
                    {getTransaccionSubline(t) && (
                      <DetailRow label={isIng ? 'Tipo de ingreso' : 'Categoría'} value={getTransaccionSubline(t)} />
                    )}
                    <DetailRow label="Fecha" value={t.fecha ? formatDateUtil(t.fecha, "EEEE d 'de' MMMM, yyyy") : null} />
                    {t.createdAt && (
                      <DetailRow label="Registrado" value={getRelativeTime(t.createdAt)} />
                    )}
                    <DetailRow label="Moneda" value={t.moneda || 'GTQ'} />
                    {t.cuenta && (
                      <DetailRow
                        label="Cuenta"
                        value={cuentaById(t.cuenta)?.nombre || t.cuenta}
                      />
                    )}
                  </div>
                  {cuotaActual != null && cuotaTotal != null && (
                    <div className="flex justify-between items-center gap-4 py-2.5 px-4 border-t border-gray-100 dark:border-gray-700/60 bg-gray-100/50 dark:bg-gray-700/20">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Progreso</span>
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {esPagoCompleto ? `Pago completo (${cuotaTotal} cuotas)` : `Cuota ${cuotaActual} de ${cuotaTotal} (${Math.round((cuotaActual / cuotaTotal) * 100)}%)`}
                      </span>
                    </div>
                  )}
                </div>
                {mostrarDescripcion && (
                  <div className="mt-4 p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Notas</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{t.descripcion}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </FloatingModal>

        {/* Orden de slides del Balance (Total/Sin cuenta/Cuentas): móvil/tablet = bottom sheet; PC = modal centrado */}
        <FloatingModal
          isOpen={balanceMenuOpen}
          onClose={() => {
            // Aplicar automáticamente al cerrar (sin afectar el carrusel mientras está abierto)
            const next = draftBalanceOrder ?? null;
            if (Array.isArray(next)) {
              const current = orderedSlideIdsAll;
              const changed =
                next.length !== current.length || next.some((v, i) => String(v) !== String(current[i]));
              if (changed) persistBalanceOrder(next);
            }
            setBalanceMenuOpen(false);
          }}
          size="sm"
          showCloseButton={true}
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Orden de cuentas"
          compactHeader={true}
        >
          <div className={isDesktopModal ? 'pt-3 px-6 pb-6' : 'pt-2 px-4 pb-6'}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Reordena aquí, y usa el ícono de ojo para ocultar o mostrar una cuenta en el carrusel. Se guarda automáticamente al cerrar.
            </p>
            <Reorder.Group
              axis="y"
              values={draftBalanceOrder ?? orderedSlideIdsAll}
              onReorder={(next) => setDraftBalanceOrder(next)}
              className="space-y-2"
            >
              {(draftBalanceOrder ?? orderedSlideIdsAll).map((id, idx) => {
                const nombre = balanceSlideLabel(id);
                const isFirst = idx === 0;
                const isLast = idx === (draftBalanceOrder ?? orderedSlideIdsAll).length - 1;
                const isHidden = hiddenBalanceIds.includes(String(id));
                const isLastVisible = !isHidden && orderedSlideIdsAll.length - hiddenBalanceIds.length <= 1;
                const moveItem = (dir) => {
                  const base = draftBalanceOrder ?? orderedSlideIdsAll;
                  const next = [...base];
                  const target = idx + dir;
                  if (target < 0 || target >= next.length) return;
                  [next[idx], next[target]] = [next[target], next[idx]];
                  setDraftBalanceOrder(next);
                };
                return (
                  <SortableAccountItem
                    key={id}
                    id={id}
                    nombre={nombre}
                    isFirst={isFirst}
                    isLast={isLast}
                    onMove={moveItem}
                    hidden={isHidden}
                    onToggleHidden={() => toggleHiddenBalanceId(id)}
                    disableToggle={isLastVisible}
                  />
                );
              })}
            </Reorder.Group>
            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDraftBalanceOrder(availableBalanceSlideIds)}
                className="text-xs text-gray-600 dark:text-gray-300 hover:underline"
              >
                Restablecer orden
              </button>
            </div>
          </div>
        </FloatingModal>

        {/* Modal Detalles del plan de cuotas (al hacer clic en un plan en Próximas cuotas) */}
        <FloatingModal
          isOpen={!!showPlanDetails}
          onClose={() => setShowPlanDetails(null)}
          size="md"
          showCloseButton={true}
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Detalles del plan de cuotas"
          compactHeader={true}
          scrollYRef={planDetailsScrollRef}
        >
          {showPlanDetails && (() => {
            const planIconKey = getTransaccionIconKey({ tipoTransaccion: 'gasto', categoria: showPlanDetails.categoria });
            const PlanIconComponent = planIconKey ? getIconComponent(normalizeIconKey(planIconKey, 'ShoppingCartIcon')) : null;
            return (
            <div className={isDesktopModal ? 'pt-3 px-6 pb-6 sm:pt-4 sm:px-8 sm:pb-8 max-w-2xl mx-auto' : 'pt-2 px-4 pb-6 sm:px-6'}>
              <div className="flex items-center gap-4 p-4 rounded-2xl mb-4 bg-q-expense-muted/40 dark:bg-q-expense-muted/20">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 bg-q-expense/15 text-q-expense">
                  {PlanIconComponent ? <PlanIconComponent className="w-6 h-6" /> : <ShoppingCartIcon className="w-6 h-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-q-expense">Plan de cuotas</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{showPlanDetails.nombre}</p>
                  <p className="text-lg font-bold text-q-expense">
                    {formatCurrency(showPlanDetails.montoTotal, showPlanDetails.moneda)} total
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden text-sm">
                <div className="px-4">
                  <div className="flex justify-between items-center gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700/60">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Cuota mensual</span>
                    <span className="text-sm text-gray-900 dark:text-white font-medium">{formatCurrency(showPlanDetails.montoCuota, showPlanDetails.moneda)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700/60">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Próximo pago</span>
                    <span className="text-sm text-gray-900 dark:text-white">{showPlanDetails.proximoPago ? formatDateUtil(showPlanDetails.proximoPago, "EEEE d 'de' MMMM, yyyy") : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700/60">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Última cuota</span>
                    <span className="text-sm text-gray-900 dark:text-white">{showPlanDetails.fechaVencimiento ? formatDateUtil(showPlanDetails.fechaVencimiento, "d 'de' MMMM, yyyy") : '—'}</span>
                  </div>
                  {showPlanDetails.tarjeta && (showPlanDetails.tarjeta.nombre || showPlanDetails.tarjeta._id) && (
                    <div className="flex justify-between items-center gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tarjeta</span>
                      <span className="text-sm text-gray-900 dark:text-white">{typeof showPlanDetails.tarjeta === 'object' ? showPlanDetails.tarjeta.nombre : 'Tarjeta vinculada'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })()}
        </FloatingModal>

        {/* Préstamo: detalle al venir desde Calendario */}
        <FloatingModal
          isOpen={!!prestamoDetalleDesdeCalendario}
          onClose={() => setPrestamoDetalleDesdeCalendario(null)}
          size="md"
          showCloseButton
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Detalle del préstamo"
          compactHeader
        >
          {prestamoDetalleDesdeCalendario && (() => {
            const pr = prestamoDetalleDesdeCalendario;
            const pendiente = Math.max(0, (pr.montoTotal || 0) - (pr.montoPagado || 0));
            return (
              <div className={isDesktopModal ? 'pt-3 px-6 pb-6 sm:pt-4 sm:px-8 sm:pb-8 max-w-2xl mx-auto' : 'pt-2 px-4 pb-6 sm:px-6'}>
                <div className="flex items-center gap-4 p-4 rounded-2xl mb-4 bg-amber-500/10 dark:bg-amber-500/15">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 bg-amber-500/20 text-amber-700 dark:text-amber-400">
                    <BanknotesIcon className="w-6 h-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">Préstamo</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{pr.nombre || 'Préstamo'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pr.tipo === 'recibido' ? 'Recibido' : pr.tipo === 'otorgado' ? 'Otorgado' : pr.tipo || '—'}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden text-sm">
                  <div className="px-4 divide-y divide-gray-100 dark:divide-gray-700/60">
                    <div className="flex justify-between items-center gap-4 py-2.5">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendiente</span>
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400 tabular-nums">{formatCurrency(pendiente, pr.moneda)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 py-2.5">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</span>
                      <span className="text-sm text-gray-900 dark:text-white tabular-nums">{formatCurrency(pr.montoTotal, pr.moneda)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 py-2.5">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pagado</span>
                      <span className="text-sm text-gray-900 dark:text-white tabular-nums">{formatCurrency(pr.montoPagado || 0, pr.moneda)}</span>
                    </div>
                    {pr.fechaVencimiento && (
                      <div className="flex justify-between items-center gap-4 py-2.5">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Vencimiento</span>
                        <span className="text-sm text-gray-900 dark:text-white">{formatDateUtil(pr.fechaVencimiento, "d 'de' MMMM, yyyy")}</span>
                      </div>
                    )}
                    {pr.estado && (
                      <div className="flex justify-between items-center gap-4 py-2.5">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</span>
                        <span className="text-sm text-gray-900 dark:text-white capitalize">{pr.estado}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </FloatingModal>

        {/* Modal de Ingreso: móvil = bottom sheet; PC/tablet = modal centrado */}
        <FloatingModal
          isOpen={showIngresoModal}
          onClose={handleCancelIngreso}
          size="md"
          showCloseButton={true}
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Nuevo Ingreso"
          compactHeader={true}
        >
          <div className="p-4 sm:p-6">
            <form onSubmit={handleIngresoSubmit} className="space-y-6">
              {/* En PC: dos columnas (tipo | monto+fecha+descripción); mismo layout que Nuevo Gasto */}
              <div className={isDesktopModal ? 'grid grid-cols-2 gap-6 items-start' : 'space-y-6'}>
                <div className="space-y-6">
              {/* TIPO DE INGRESO - Chips: fijos (Quincena, Comisión, Inversión) + personalizados (API y sesión) con icono + Nuevo */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 ml-1">
                  Tipo de ingreso
                </label>
                <div className={`${isDesktopModal ? 'grid grid-cols-2 gap-3' : 'flex gap-3 -mx-2 px-2 overflow-x-auto overflow-y-hidden'} ${!isDesktopModal ? 'flex-nowrap' : ''}`} style={!isDesktopModal ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}>
                  {ingresoTipoChips.map((item) => {
                    const isSelected = formData.tipo === item.value;
                    const Icon = item.Icon;
                    if (item.kind === 'builtin') {
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, tipo: item.value, tipoPersonalizado: '' })}
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-colors touch-manipulation
                            ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'}
                            ${isSelected
                              ? 'bg-q-income-muted border-q-income text-q-income'
                              : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-income' : 'text-gray-500 dark:text-gray-400'}`} />
                          {item.label}
                        </button>
                      );
                    }
                    const openConfirmDelete =
                      item.kind === 'custom'
                        ? () => setTipoIngresoToDelete({ type: 'api', id: item.tipoId, label: item.label })
                        : () => setTipoIngresoToDelete({ type: 'session', sessionId: item.sessionId, label: item.label });
                    return (
                      <div key={item.kind === 'custom' ? (item.tipoId ?? item.value) : item.sessionId} className={`flex items-center rounded-full border-2 min-w-0 ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'} ${isSelected ? 'bg-q-income-muted border-q-income' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, tipo: item.value, tipoPersonalizado: '' })}
                          className="flex-1 min-w-0 inline-flex items-center gap-2 pl-4 pr-1 py-2.5 text-sm font-medium text-left transition-colors"
                        >
                          {Icon && <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-income' : 'text-gray-500 dark:text-gray-400'}`} />}
                          <span className={`truncate ${isSelected ? 'text-q-income' : 'text-gray-600 dark:text-gray-300'}`}>{item.label}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openConfirmDelete(); }}
                          className="flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-q-expense transition-colors mr-1 flex-shrink-0"
                          aria-label="Eliminar tipo"
                        >
                          <TrashIcon className="w-4 h-4 block" />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, tipo: 'personalizado', tipoPersonalizado: formData.tipoPersonalizado || '' });
                      setNuevoIngresoTipo(prev => ({ ...prev, iconKey: prev.iconKey || 'WalletIcon' }));
                      setFormError(null);
                    }}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 font-medium touch-manipulation ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'}`}
                  >
                    <PlusIcon className="w-5 h-5 flex-shrink-0" />
                    Nuevo
                  </button>
                </div>
              </div>

                </div>
                <div className="space-y-6">
              {/* 1) Monto primero */}
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 ml-1">
                    Monto
                  </label>
                  <div className="flex items-baseline gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newMoneda = formData.moneda === 'GTQ' ? 'USD' : 'GTQ';
                        setFormData({
                          ...formData,
                          moneda: newMoneda,
                          cuentaId: pickDefaultCuenta(newMoneda)
                        });
                      }}
                      className="text-3xl font-bold text-q-income flex-shrink-0"
                      title={formData.moneda === 'GTQ' ? 'Cambiar a USD' : 'Cambiar a GTQ'}
                    >
                      {formData.moneda === 'GTQ' ? 'Q' : '$'}
                    </button>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      value={formData.monto}
                      onChange={handleMontoChange}
                      onBlur={handleMontoBlur}
                      className="flex-1 min-w-0 bg-transparent border-none p-0 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:ring-0 focus:outline-none touch-manipulation"
                      placeholder="0.00"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                    Cuenta
                  </label>
                  <select
                    value={formData.cuentaId}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === SELECT_CREAR_CUENTA) {
                        navigate(
                          `/finanzas/cuentas?nueva=1&moneda=${encodeURIComponent(formData.moneda)}`
                        );
                        return;
                      }
                      setFormData({ ...formData, cuentaId: v });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-q-income min-h-[48px]"
                  >
                    {cuentasParaMoneda.filter((c) => !esEfectivo(c)).length === 0 && (
                      <option value="">Selecciona una cuenta…</option>
                    )}
                    {cuentasParaMoneda.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.nombre}
                      </option>
                    ))}
                    {cuentasParaMoneda.length === 0 && (
                      <option value={SELECT_CREAR_CUENTA}>+ Crear cuenta nueva…</option>
                    )}
                  </select>
                  {cuentasParaMoneda.filter((c) => !esEfectivo(c)).length === 0 && (
                    <p className="mt-1.5 ml-1 text-xs text-q-income">
                      No tienes ninguna cuenta. Crea una antes de continuar.
                    </p>
                  )}
                  {formData.cuentaId && (() => {
                    const montoNum = parseFloat(String(formData.monto).replace(/,/g, '')) || 0;
                    const actual = saldoDeCuenta(formData.cuentaId);
                    return (
                      <p className="mt-1.5 ml-1 text-xs text-gray-500 dark:text-gray-400">
                        Saldo actual:{' '}
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {formatCurrency(actual, formData.moneda)}
                        </span>
                        {montoNum > 0 && (
                          <>
                            {' · '}Después de este ingreso:{' '}
                            <span className="font-semibold text-q-income">
                              {formatCurrency(actual + montoNum, formData.moneda)}
                            </span>
                          </>
                        )}
                      </p>
                    );
                  })()}
                  <p className="mt-1.5 ml-1">
                    <Link
                      to={
                        cuentasParaMoneda.length === 0
                          ? `/finanzas/cuentas?nueva=1&moneda=${encodeURIComponent(formData.moneda)}`
                          : '/finanzas/cuentas'
                      }
                      className="text-xs text-q-income hover:underline"
                    >
                      {cuentasParaMoneda.length === 0 ? 'Crear cuenta nueva' : 'Gestionar cuentas'}
                    </Link>
                  </p>
                </div>

                {/* FECHA y RECURRENTE - Dos columnas iguales en altura y estilo (simétricos) */}
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                    Fecha
                  </label>
                  <div
                    className="relative flex items-center gap-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 h-[48px] cursor-pointer"
                    onClick={() => {
                      fechaIngresoInputRef.current?.showPicker?.();
                      fechaIngresoInputRef.current?.focus();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fechaIngresoInputRef.current?.showPicker?.(); fechaIngresoInputRef.current?.focus(); } }}
                    aria-label="Seleccionar fecha"
                  >
                    <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 pointer-events-none" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 pointer-events-none">
                      {formatFechaShort(formData.fecha)}
                    </span>
                    <input
                      ref={fechaIngresoInputRef}
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      required
                      aria-hidden
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                    Recurrente
                  </label>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 h-[48px]">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mensual</span>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={formData.esRecurrente}
                        onChange={() => setFormData({ ...formData, esRecurrente: !formData.esRecurrente })}
                        className="sr-only peer"
                      />
                      <div className="relative w-9 h-5 flex-shrink-0 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-q-income after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                </div>
                </div>

              {/* Descripción (opcional) - misma estructura que Gasto */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                  Descripción (opcional)
                </label>
                <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 focus-within:border-q-income/50 transition-colors">
                  <Bars3Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="flex-1 min-w-0 bg-transparent border-none p-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-0 focus:outline-none resize-none"
                    rows={2}
                    placeholder="¿De qué se trata este ingreso?"
                    autoComplete="off"
                  />
                </div>
              </div>

                </div>
              </div>

              {/* Crear tipo personalizado: mismo layout que Nueva categoría (Gasto) - PC col-span-2; móvil mt-3 */}
              {formData.tipo === 'personalizado' && (
                <div ref={nuevoTipoIngresoBlockRef} className={`rounded-xl border border-q-income-muted bg-q-income-muted/50 dark:bg-q-income-muted/20 p-4 w-full min-w-0 ${isDesktopModal ? 'col-span-2' : 'mt-3'} ${isDesktopModal ? 'flex flex-col' : 'space-y-4'}`}>
                  <div className="flex items-center justify-between gap-3 w-full flex-shrink-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate min-w-0">Crear tipo personalizado</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingIngresoTipo(false);
                        setNuevoIngresoTipo({ label: '', iconKey: 'WalletIcon' });
                        setFormData({ ...formData, tipo: '', tipoPersonalizado: '' });
                        setFormError(null);
                      }}
                      className="text-sm font-medium text-q-income hover:underline flex-shrink-0"
                    >
                      Volver
                    </button>
                  </div>
                  <div className={isDesktopModal ? 'grid gap-4 items-start w-full min-w-0' : 'space-y-4 w-full'} style={isDesktopModal ? { gridTemplateColumns: 'minmax(0, 240px) 1fr' } : undefined}>
                    <div className="min-w-0 space-y-4 w-full">
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={formData.tipoPersonalizado}
                          onChange={(e) => setFormData({ ...formData, tipoPersonalizado: e.target.value })}
                          className={`w-full px-4 py-3 text-base border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-q-income min-h-[44px] ${isDesktopModal ? 'max-w-[220px]' : ''}`}
                          placeholder="Ej. Freelance, Bonificación..."
                          autoComplete="off"
                        />
                      </div>
                      {formError && <p className="text-sm text-q-expense">{formError}</p>}
                      <div className={`flex flex-row flex-nowrap gap-2 ${isDesktopModal ? 'justify-start' : 'w-full'}`}>
                        <button
                          type="button"
                          disabled={!formData.tipoPersonalizado?.trim()}
                          onClick={() => {
                            const label = formData.tipoPersonalizado.trim();
                            const iconKey = normalizeIconKey(nuevoIngresoTipo.iconKey, 'WalletIcon');
                            setSessionTiposIngreso(prev => [...prev, { label, iconKey, sessionId: `session-${Date.now()}-${label}` }]);
                            setFormData({ ...formData, tipo: label, tipoPersonalizado: label });
                            setIsCreatingIngresoTipo(false);
                            setFormError(null);
                          }}
                          className={`px-5 py-2.5 text-sm font-medium rounded-xl border border-q-income text-q-income-muted bg-transparent hover:bg-q-income-muted min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${!isDesktopModal ? 'flex-1 min-w-0' : ''}`}
                        >
                          Utilizar una vez
                        </button>
                        <button
                          type="button"
                          disabled={!formData.tipoPersonalizado?.trim() || isLoadingTipos}
                          onClick={async () => {
                            setFormError(null);
                            try {
                              const iconKey = normalizeIconKey(nuevoIngresoTipo.iconKey, 'WalletIcon');
                              const created = await createTipoIngreso({ label: formData.tipoPersonalizado.trim(), iconKey });
                              if (created?.label) {
                                setFormData({ ...formData, tipo: created.label, tipoPersonalizado: created.label });
                                setIsCreatingIngresoTipo(false);
                                setFormError(null);
                              }
                            } catch (err) {
                              setFormError(err?.response?.data?.message || 'No se pudo crear. Revisa el nombre o intenta de nuevo.');
                            }
                          }}
                          className={`px-5 py-2.5 text-sm font-medium rounded-xl bg-q-income text-white hover:bg-q-income min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${!isDesktopModal ? 'flex-1 min-w-0' : ''}`}
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icono</label>
                      <div className={`grid gap-2 overflow-y-auto overflow-x-hidden py-1 ${isDesktopModal ? 'grid-cols-[repeat(auto-fill,minmax(40px,1fr))] max-h-[160px]' : 'grid-cols-5 sm:grid-cols-6 max-h-[200px]'}`}>
                        {ICON_KEYS_FOR_PICKER.map(iconKey => {
                          const Icon = getIconComponent(iconKey);
                          const selected = normalizeIconKey(nuevoIngresoTipo.iconKey, 'WalletIcon') === iconKey;
                          return (
                            <button
                              key={iconKey}
                              type="button"
                              onClick={() => setNuevoIngresoTipo(prev => ({ ...prev, iconKey }))}
                              className={`flex items-center justify-center min-h-[40px] min-w-[40px] rounded-xl border transition-colors touch-manipulation
                                ${selected ? 'bg-q-income-muted border-q-income text-q-income' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                              aria-label={iconKey}
                            >
                              <Icon className="h-5 w-5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formError && (
                <div className="bg-q-expense-muted border border-q-expense-muted text-q-expense px-4 py-3 rounded-xl text-sm">
                  {formError}
                </div>
              )}

              {/* Botones: móvil apilados; PC en fila abajo a la derecha (Cancelar, Crear Ingreso) */}
              <div className={`mt-8 flex gap-3 ${isDesktopModal ? 'flex-row justify-end' : 'flex-col gap-4'}`}>
                {isDesktopModal && (
                  <button
                    type="button"
                    onClick={handleCancelIngreso}
                    className="py-2.5 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoadingForm || ingresoInvalido}
                  className={`font-bold text-white bg-q-income hover:bg-q-income rounded-2xl shadow-lg shadow-[0_10px_15px_-3px_rgba(52,209,129,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation ${isDesktopModal ? 'py-2.5 px-5' : 'w-full py-4'}`}
                >
                  {isLoadingForm ? 'Creando...' : 'Crear Ingreso'}
                </button>
                {!isDesktopModal && (
                  <button
                    type="button"
                    onClick={handleCancelIngreso}
                    className="w-full py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </FloatingModal>

        <ConfirmModal
          isOpen={!!tipoIngresoToDelete}
          onClose={() => setTipoIngresoToDelete(null)}
          onConfirm={handleConfirmDeleteTipoIngreso}
          title={tipoIngresoToDelete ? `Eliminar ${tipoIngresoToDelete.label}` : 'Eliminar'}
          message={tipoIngresoToDelete ? `¿Seguro que deseas eliminar ${tipoIngresoToDelete.label}?` : ''}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          elevated
        />
        <ConfirmModal
          isOpen={!!tipoGastoToDelete}
          onClose={() => setTipoGastoToDelete(null)}
          onConfirm={handleConfirmDeleteTipoGasto}
          title="Eliminar categoría"
          message={tipoGastoToDelete ? `¿Seguro que deseas eliminar ${tipoGastoToDelete.label}?` : ''}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          elevated
        />

        {/* Modal de Gasto: móvil = bottom sheet; PC/tablet = modal centrado */}
        <FloatingModal
          isOpen={showGastoModal}
          onClose={() => { setShowGastoModal(false); resetForm(); }}
          size="md"
          showCloseButton={true}
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Nuevo Gasto"
          compactHeader={true}
        >
          <div className="p-4 sm:p-6">
            <form onSubmit={handleGastoSubmit} className="space-y-6">
              {/* En PC: dos columnas (tipo+cuotas+categoría | monto+fecha+descripción); mismo gap que Ingreso */}
              <div className={isDesktopModal ? 'grid grid-cols-2 gap-6 items-start' : 'space-y-6'}>
                <div className="space-y-6">
              {/* Tipo de gasto */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 ml-1">
                  Tipo de gasto
                </label>
                <div className={`flex gap-3 -mx-2 px-2 ${isDesktopModal ? 'flex-wrap' : 'overflow-x-auto overflow-y-hidden'}`} style={!isDesktopModal ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      esCuota: false,
                      esGastoEnCuotas: false,
                      cuotaId: '',
                      tarjetaId: '',
                      monto: formData.esGastoEnCuotas ? '' : formData.monto
                    })}
                    className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-colors touch-manipulation
                      ${!formData.esCuota && !formData.esGastoEnCuotas
                        ? 'bg-q-expense-muted border-q-expense text-q-expense'
                        : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <MinusIcon className="w-5 h-5 flex-shrink-0" />
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      esCuota: false,
                      esGastoEnCuotas: true,
                      cuotaId: '',
                      tarjetaId: formData.tarjetaId || '',
                      monto: formData.esGastoEnCuotas ? formData.monto : '',
                    })}
                    className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-colors touch-manipulation
                      ${formData.esGastoEnCuotas
                        ? 'bg-q-expense-muted border-q-expense text-q-expense'
                        : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                  >
                    <CalendarDaysIcon className="w-5 h-5 flex-shrink-0" />
                    Gasto en cuotas
                  </button>
                </div>
              </div>

              {/* Si es gasto en cuotas: tarjeta + número de cuotas (compacto). Las cuotas se cobran solas, no recurrente manual. */}
              {formData.esGastoEnCuotas && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3">
                  {tarjetasCredito.length === 0 ? (
                    <div className="rounded-xl bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-4 text-sm">
                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Necesitas una tarjeta con corte y pago</p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">Para compras a cuotas configura una tarjeta de crédito con día de corte y día de pago.</p>
                      <button
                        type="button"
                        onClick={() => { setShowGastoModal(false); resetForm(); navigate('/finanzas/cuotas', { state: { openNuevaTarjeta: true } }); }}
                        className="w-full py-2.5 px-4 rounded-xl bg-q-expense text-white font-medium text-sm"
                      >
                        Ir a tarjetas
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={isDesktopModal ? 'grid grid-cols-2 gap-4 items-end' : 'space-y-3'}>
                        <div className="min-w-0">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 whitespace-nowrap">Tarjeta</label>
                          <select
                            value={formData.tarjetaId ?? ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, tarjetaId: e.target.value }))}
                            className="w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-q-expense text-sm min-h-[48px]"
                            required
                          >
                            <option value="">Selecciona la tarjeta</option>
                            {tarjetasCredito.map((t) => (
                              <option key={t._id} value={String(t._id)}>
                                {t.nombre} — {t.banco || 'Sin banco'} · Corte {t.fechaCorte ?? '—'} · Pago {t.diaPago ?? '—'}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="min-w-0">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 whitespace-nowrap">Cuotas</label>
                          <select
                            value={formData.cuotasTotal}
                            onChange={(e) => {
                              const next = Number(e.target.value);
                              setFormData((prev) => {
                                const maxPag = Math.max(0, next - 1);
                                const prevPag = prev.cuotasPagadas === '' ? 0 : Number(prev.cuotasPagadas) || 0;
                                const pag = Math.min(maxPag, Math.max(0, prevPag));
                                return { ...prev, cuotasTotal: next, cuotasPagadas: pag };
                              });
                            }}
                            className="w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-q-expense text-sm min-h-[48px]"
                          >
                            {[3, 6, 10, 12, 18, 24, 48].map((n) => (
                              <option key={n} value={n}>{n} cuotas</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                        La <strong className="font-medium text-gray-700 dark:text-gray-300">1.ª cuota</strong> y la <strong className="font-medium text-gray-700 dark:text-gray-300">última</strong> se calculan solas con la fecha de compra y el día de pago de la tarjeta.
                      </p>
                      {formData.esGastoEnCuotas && tarjetaCuotas && String(formData.fecha || '').trim() && !validacionPlazoCuotas.ok && (
                        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-800 dark:text-red-200">
                          {validacionPlazoCuotas.motivo === 'plan_ya_terminado'
                            ? 'Con esa fecha de compra y ese número de cuotas, la última cuota caería antes de hoy: el plan ya habría terminado. Aumenta el número de cuotas o indica una fecha de compra más reciente.'
                            : 'No se pudo validar fechas y cuotas. Revisa la tarjeta y la fecha de compra.'}
                        </div>
                      )}
                      {compraPasada && validacionPlazoCuotas.ok ? (
                        <div className="min-w-0 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/60 dark:bg-gray-800/40 p-3">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cuotas ya vencidas (estimado)</label>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">{formData.cuotasPagadas}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                            Solo aplica si la <strong className="font-medium text-gray-700 dark:text-gray-300">fecha de compra es anterior a hoy</strong>: estimamos cuántos vencimientos mensuales ya pasaron antes de hoy.
                          </p>
                        </div>
                      ) : null}
                      {/* Resumen: monto mensual según monto total y número de cuotas */}
                      {formData.monto && parseFloat(String(formData.monto).replace(/,/g, '')) > 0 && formData.cuotasTotal >= 1 && (
                        <div className="rounded-lg bg-q-expense-muted/50 dark:bg-q-expense-muted/20 border border-q-expense/20 p-3 text-sm">
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="text-gray-600 dark:text-gray-400">Mensualmente:</span>{' '}
                            <strong className="text-q-expense">
                              {formatCurrency(
                                Math.round((parseFloat(String(formData.monto).replace(/,/g, '')) / Math.max(1, formData.cuotasTotal)) * 100) / 100,
                                formData.moneda
                              )}
                            </strong>
                          </p>
                        </div>
                      )}
                      {previewPlanCuotas && (
                        <div className="rounded-lg bg-white/50 dark:bg-gray-800/50 p-2.5 text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                          <p>
                            1.ª cuota:{' '}
                            <strong className="text-gray-900 dark:text-gray-200">{formatDateUtil(previewPlanCuotas.primera, 'dd MMM yyyy')}</strong>
                          </p>
                          <p>
                            Última:{' '}
                            <strong className="text-gray-900 dark:text-gray-200">{formatDateUtil(previewPlanCuotas.ultima, 'dd MMM yyyy')}</strong>
                          </p>
                          <p>
                            Próximo pago:{' '}
                            <strong className="text-gray-900 dark:text-gray-200">{formatDateUtil(previewPlanCuotas.proximo, 'dd MMM yyyy')}</strong>
                          </p>
                          <p className="text-[11px] pt-0.5 border-t border-gray-200/80 dark:border-gray-600/80 mt-1">
                            Siguiente pago automático: cuota <strong className="text-gray-800 dark:text-gray-200">{previewPlanCuotas.siguienteNum}</strong> de <strong>{previewPlanCuotas.cuotasT}</strong>
                            {previewPlanCuotas.pag > 0 ? ` (${previewPlanCuotas.pag} ya contabilizadas como pagadas)` : ''}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Categoría de gasto - En PC grid 2 columnas; en móvil fila con scroll horizontal */}
              {!formData.esCuota && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 ml-1">
                  Categoría de gasto
                </label>
                <div className={`${isDesktopModal ? 'grid grid-cols-2 gap-3' : 'flex gap-3 -mx-2 px-2 overflow-x-auto overflow-y-hidden'} ${!isDesktopModal ? 'flex-nowrap' : ''}`} style={!isDesktopModal ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}>
                  {gastoCategoriaChips.map((item) => {
                    const isSelected = formData.categoria === item.value;
                    const Icon = item.Icon;
                    if (item.kind === 'builtin') {
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, categoria: item.value, categoriaPersonalizada: '' })}
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-colors touch-manipulation
                            ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'}
                            ${isSelected
                              ? 'bg-q-expense-muted border-q-expense text-q-expense'
                              : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-expense' : 'text-gray-500 dark:text-gray-400'}`} />
                          {item.label}
                        </button>
                      );
                    }
                    const openConfirmDelete =
                      item.kind === 'custom'
                        ? () => setTipoGastoToDelete({ type: 'api', id: item.catId, label: item.label })
                        : () => setTipoGastoToDelete({ type: 'session', sessionId: item.sessionId, label: item.label });
                    return (
                      <div key={item.kind === 'custom' ? (item.catId ?? item.value) : item.sessionId} className={`flex items-center rounded-full border-2 min-w-0 ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'} ${isSelected ? 'bg-q-expense-muted border-q-expense' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, categoria: item.value, categoriaPersonalizada: '' })}
                          className="flex-1 min-w-0 inline-flex items-center gap-2 pl-4 pr-1 py-2.5 text-sm font-medium text-left transition-colors"
                        >
                          {Icon && <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-expense' : 'text-gray-500 dark:text-gray-400'}`} />}
                          <span className={`truncate ${isSelected ? 'text-q-expense' : 'text-gray-600 dark:text-gray-300'}`}>{item.label}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openConfirmDelete(); }}
                          className="flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-q-expense transition-colors mr-1 flex-shrink-0"
                          aria-label="Eliminar categoría"
                        >
                          <TrashIcon className="w-4 h-4 block" />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCategoriaGasto(true);
                      setNuevaCategoriaGasto({ label: '', iconKey: 'ShoppingCartIcon' });
                      setFormData({ ...formData, categoria: 'personalizado', categoriaPersonalizada: '' });
                      setFormError(null);
                    }}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 font-medium touch-manipulation ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'}`}
                  >
                    <PlusIcon className="w-5 h-5 flex-shrink-0" />
                    Nuevo
                  </button>
                </div>
                {isLoadingTipos && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando categorías...</p>
                )}
              </div>
              )}

                </div>
                <div className="space-y-6">
              {/* Orden: 1) Monto total  2) Fecha de compra + Recurrente (al par)  3) Descripción abajo */}
              {/* 1) Monto total primero */}
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 ml-1">
                  {formData.esGastoEnCuotas ? 'Monto total' : 'Monto'}
                </label>
                <div className="flex items-baseline gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newMoneda = formData.moneda === 'GTQ' ? 'USD' : 'GTQ';
                      setFormData({
                        ...formData,
                        moneda: newMoneda,
                        cuentaId: pickDefaultCuenta(newMoneda)
                      });
                    }}
                    className="text-3xl font-bold text-q-expense flex-shrink-0"
                    title={formData.moneda === 'GTQ' ? 'Cambiar a USD' : 'Cambiar a GTQ'}
                  >
                    {formData.moneda === 'GTQ' ? 'Q' : '$'}
                  </button>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={formData.monto}
                    onChange={handleMontoChange}
                    onBlur={handleMontoBlur}
                    className="flex-1 min-w-0 bg-transparent border-none p-0 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:ring-0 focus:outline-none touch-manipulation"
                    placeholder="0.00"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              {!formData.esGastoEnCuotas && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                    Método de pago
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, metodoPago: 'efectivo', tarjetaId: '' }))}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-colors touch-manipulation
                        ${formData.metodoPago !== 'tarjeta_credito'
                          ? 'bg-q-expense-muted border-q-expense text-q-expense'
                          : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                      Débito
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, metodoPago: 'tarjeta_credito', cuentaId: '' }))}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-colors touch-manipulation
                        ${formData.metodoPago === 'tarjeta_credito'
                          ? 'bg-q-expense-muted border-q-expense text-q-expense'
                          : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                      Crédito
                    </button>
                  </div>
                  <p className="mt-1.5 ml-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.metodoPago === 'tarjeta_credito'
                      ? 'Se suma a lo que debes en la tarjeta; no sale de ninguna cuenta.'
                      : 'Efectivo, débito o transferencia: sale de una cuenta.'}
                  </p>
                  {formData.metodoPago === 'tarjeta_credito' && (
                    <div className="mt-3">
                      {tarjetasCredito.length > 0 ? (
                        <>
                          <select
                            value={formData.tarjetaId}
                            onChange={(e) => setFormData(prev => ({ ...prev, tarjetaId: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-q-expense min-h-[48px]"
                          >
                            <option value="">Selecciona la tarjeta…</option>
                            {tarjetasCredito.map((t) => (
                              <option key={t._id} value={t._id}>
                                {t.nombre}{t.banco ? ` · ${t.banco}` : ''}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1.5 ml-1 text-xs text-gray-500 dark:text-gray-400">
                            Se suma a lo que debes en esta tarjeta (no es una cuota).
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No tienes tarjetas de crédito con día de corte configurado.{' '}
                          <Link to="/finanzas/cuotas" state={{ openNuevaTarjeta: true }} className="text-q-expense hover:underline">Configura una</Link>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!formData.esGastoEnCuotas && formData.metodoPago !== 'tarjeta_credito' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                    Cuenta
                  </label>
                  <select
                    value={formData.cuentaId}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === SELECT_CREAR_CUENTA) {
                        navigate(
                          `/finanzas/cuentas?nueva=1&moneda=${encodeURIComponent(formData.moneda)}`
                        );
                        return;
                      }
                      setFormData({ ...formData, cuentaId: v });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-q-expense min-h-[48px]"
                  >
                    {cuentasParaMoneda.filter((c) => !esEfectivo(c)).length === 0 && (
                      <option value="">Selecciona una cuenta…</option>
                    )}
                    {cuentasParaMoneda.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.nombre}
                      </option>
                    ))}
                    {cuentasParaMoneda.length === 0 && (
                      <option value={SELECT_CREAR_CUENTA}>+ Crear cuenta nueva…</option>
                    )}
                  </select>
                  {cuentasParaMoneda.filter((c) => !esEfectivo(c)).length === 0 && (
                    <p className="mt-1.5 ml-1 text-xs text-q-expense">
                      No tienes ninguna cuenta. Crea una antes de continuar.
                    </p>
                  )}
                  {formData.cuentaId && (() => {
                    const montoNum = parseFloat(String(formData.monto).replace(/,/g, '')) || 0;
                    const disponible = saldoDeCuenta(formData.cuentaId);
                    const restante = disponible - montoNum;
                    return (
                      <p className="mt-1.5 ml-1 text-xs text-gray-500 dark:text-gray-400">
                        Saldo disponible:{' '}
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {formatCurrency(disponible, formData.moneda)}
                        </span>
                        {montoNum > 0 && (
                          <>
                            {' · '}Después de este gasto:{' '}
                            <span className={`font-semibold ${restante < 0 ? 'text-q-expense' : 'text-gray-700 dark:text-gray-200'}`}>
                              {formatCurrency(restante, formData.moneda)}
                            </span>
                          </>
                        )}
                      </p>
                    );
                  })()}
                  <p className="mt-1.5 ml-1">
                    <Link
                      to={
                        cuentasParaMoneda.length === 0
                          ? `/finanzas/cuentas?nueva=1&moneda=${encodeURIComponent(formData.moneda)}`
                          : '/finanzas/cuentas'
                      }
                      className="text-xs text-q-expense hover:underline"
                    >
                      {cuentasParaMoneda.length === 0 ? 'Crear cuenta nueva' : 'Gestionar cuentas'}
                    </Link>
                  </p>
                </div>
              )}

              {/* 2) Fecha de compra y Recurrente uno al lado del otro */}
              <div className={(!formData.esCuota && !formData.esGastoEnCuotas) ? 'grid grid-cols-2 gap-4' : ''}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                    {formData.esGastoEnCuotas ? 'Fecha de compra' : 'Fecha'}
                  </label>
                  <div
                    className="relative flex items-center gap-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 h-[48px] cursor-pointer"
                    onClick={() => {
                      fechaGastoInputRef.current?.showPicker?.();
                      fechaGastoInputRef.current?.focus();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fechaGastoInputRef.current?.showPicker?.(); fechaGastoInputRef.current?.focus(); } }}
                    aria-label="Seleccionar fecha"
                  >
                    <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 pointer-events-none" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 pointer-events-none">
                      {formatFechaShort(formData.fecha)}
                    </span>
                    <input
                      ref={fechaGastoInputRef}
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      required
                      aria-hidden
                    />
                  </div>
                </div>
                {!formData.esCuota && !formData.esGastoEnCuotas && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                      Recurrente
                    </label>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 h-[48px]">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mensual</span>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={formData.esRecurrente}
                          onChange={() => setFormData({ ...formData, esRecurrente: !formData.esRecurrente })}
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 flex-shrink-0 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-q-expense after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-4" />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción / Nombre (una sola vez; en columna derecha en PC) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                  {formData.esGastoEnCuotas ? 'Nombre de lo que compraste' : 'Descripción (opcional)'}
                </label>
                <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 focus-within:border-q-expense/50 transition-colors">
                  <Bars3Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="flex-1 min-w-0 bg-transparent border-none p-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-0 focus:outline-none resize-none"
                    rows={2}
                    placeholder={formData.esGastoEnCuotas ? 'Ej. TV, laptop, mueble...' : 'Descripción del gasto...'}
                    autoComplete="off"
                  />
                </div>
              </div>

                </div>
              </div>

              {/* Nueva categoría: en PC usa todo el ancho del modal (col-span-2); en móvil scroll suave al abrir */}
              {formData.categoria === 'personalizado' && (
                <div ref={nuevaCategoriaBlockRef} className={`rounded-xl border border-q-expense-muted bg-q-expense-muted/50 dark:bg-q-expense-muted/20 p-4 w-full min-w-0 ${isDesktopModal ? 'col-span-2' : 'mt-3'} ${isDesktopModal ? 'flex flex-col' : 'space-y-4'}`}>
                  <div className="flex items-center justify-between gap-3 w-full flex-shrink-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate min-w-0">Nueva categoría</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategoriaGasto(false);
                        setNuevaCategoriaGasto({ label: '', iconKey: 'ShoppingCartIcon' });
                        setFormData({ ...formData, categoria: '', categoriaPersonalizada: '' });
                        setFormError(null);
                      }}
                      className="text-sm font-medium text-q-expense hover:underline flex-shrink-0"
                    >
                      Volver
                    </button>
                  </div>
                  <div className={isDesktopModal ? 'grid gap-4 items-start w-full min-w-0' : 'space-y-4 w-full'} style={isDesktopModal ? { gridTemplateColumns: 'minmax(0, 240px) 1fr' } : undefined}>
                    <div className="min-w-0 space-y-4 w-full">
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={formData.categoriaPersonalizada}
                          onChange={(e) => setFormData({ ...formData, categoriaPersonalizada: e.target.value })}
                          className={`w-full px-4 py-3 text-base border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-q-expense min-h-[44px] ${isDesktopModal ? 'max-w-[220px]' : ''}`}
                          placeholder="Ej. Supermercado"
                          autoComplete="off"
                        />
                      </div>
                      {formError && <p className="text-sm text-q-expense">{formError}</p>}
                      <div className={`flex flex-row flex-nowrap gap-2 ${isDesktopModal ? 'justify-start' : 'w-full'}`}>
                        <button
                          type="button"
                          disabled={!formData.categoriaPersonalizada?.trim()}
                          onClick={() => {
                            const label = formData.categoriaPersonalizada.trim();
                            const iconKey = normalizeIconKey(nuevaCategoriaGasto.iconKey, 'ShoppingCartIcon');
                            setSessionTiposGasto(prev => [...prev, { label, iconKey, sessionId: `session-gasto-${Date.now()}-${label}` }]);
                            setFormData({ ...formData, categoria: label, categoriaPersonalizada: label });
                            setIsCreatingCategoriaGasto(false);
                            setFormError(null);
                          }}
                          className={`px-4 py-2.5 text-sm font-medium rounded-xl border border-q-expense text-q-expense-muted bg-transparent hover:bg-q-expense-muted min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${!isDesktopModal ? 'flex-1 min-w-0' : ''}`}
                        >
                          Utilizar una vez
                        </button>
                        <button
                          type="button"
                          disabled={!formData.categoriaPersonalizada?.trim() || isLoadingTipos}
                          onClick={async () => {
                            setFormError(null);
                            try {
                              const iconKey = normalizeIconKey(nuevaCategoriaGasto.iconKey, 'ShoppingCartIcon');
                              const created = await createTipoGasto({ label: formData.categoriaPersonalizada.trim(), iconKey });
                              if (created?.label) {
                                setFormData({ ...formData, categoria: created.label, categoriaPersonalizada: created.label });
                                setIsCreatingCategoriaGasto(false);
                                setFormError(null);
                              }
                            } catch (err) {
                              setFormError(err?.response?.data?.message || 'No se pudo crear. Revisa el nombre o intenta de nuevo.');
                            }
                          }}
                          className={`px-5 py-2.5 text-sm font-medium rounded-xl bg-q-expense text-white hover:bg-q-expense min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${!isDesktopModal ? 'flex-1 min-w-0' : ''}`}
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icono</label>
                      <div className={`grid gap-2 overflow-y-auto overflow-x-hidden py-1 ${isDesktopModal ? 'grid-cols-[repeat(auto-fill,minmax(40px,1fr))] max-h-[160px]' : 'grid-cols-5 sm:grid-cols-6 max-h-[200px]'}`}>
                        {ICON_KEYS_FOR_PICKER.map(iconKey => {
                          const Icon = getIconComponent(iconKey);
                          const selected = normalizeIconKey(nuevaCategoriaGasto.iconKey, 'ShoppingCartIcon') === iconKey;
                          return (
                            <button
                              key={iconKey}
                              type="button"
                              onClick={() => setNuevaCategoriaGasto(prev => ({ ...prev, iconKey }))}
                              className={`flex items-center justify-center min-h-[40px] min-w-[40px] rounded-xl border transition-colors touch-manipulation
                                ${selected ? 'bg-q-expense-muted border-q-expense text-q-expense' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                              aria-label={iconKey}
                            >
                              <Icon className="h-5 w-5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formError && (
                <div className="bg-q-expense-muted border border-q-expense-muted text-q-expense px-4 py-3 rounded-xl text-sm">
                  {formError}
                </div>
              )}

              {/* Botones: móvil apilados; PC en fila a la derecha (Cancelar, Crear Gasto) */}
              <div className={`mt-8 flex gap-3 ${isDesktopModal ? 'flex-row justify-end' : 'flex-col gap-4'}`}>
                {isDesktopModal && (
                  <button
                    type="button"
                    onClick={() => { setShowGastoModal(false); resetForm(); }}
                    className="py-2.5 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoadingForm || gastoInvalido}
                  className={`font-bold text-white bg-q-expense hover:bg-q-expense rounded-2xl shadow-lg shadow-[0_10px_15px_-3px_rgba(239,68,68,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation ${isDesktopModal ? 'py-2.5 px-5' : 'w-full py-4'}`}
                >
                  {isLoadingForm
                    ? (formData.esGastoEnCuotas ? 'Creando plan...' : 'Creando...')
                    : (formData.esGastoEnCuotas ? 'Crear plan de cuotas' : 'Crear Gasto')}
                </button>
                {!isDesktopModal && (
                  <button
                    type="button"
                    onClick={() => { setShowGastoModal(false); resetForm(); }}
                    className="w-full py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </FloatingModal>
      </div>
    </div>
  );
};

export default Dashboard;
