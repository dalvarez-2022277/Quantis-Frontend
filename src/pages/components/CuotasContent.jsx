import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDate as formatDateUtil } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { cuotaService } from '../../services/cuotaService';
import { tarjetaService } from '../../services/tarjetaService';
import { useTiposTransaccion } from '../../hooks/useTiposTransaccion';
import { getIconComponent, ICON_KEYS_FOR_PICKER, normalizeIconKey } from '../../utils/iconRegistry';
import FloatingModal from '../../components/FloatingModal';
import ConfirmModal from '../../components/ConfirmModal';
import SwipeableTransaction from '../../components/SwipeableTransaction';
import {
  CreditCardIcon,
  PlusIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  TruckIcon,
  EllipsisHorizontalCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const TARJETAS_PER_PAGE = 15;

const CuotasContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tiposGasto, isLoading: isLoadingTipos, createTipoGasto, deleteTipoGasto } = useTiposTransaccion();
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  const isDesktopModal = windowWidth >= 1280;
  const [tarjetas, setTarjetas] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarjetaError, setDeleteTarjetaError] = useState(null);
  const [showPlanDetails, setShowPlanDetails] = useState(null);
  const [expandedTarjetaId, setExpandedTarjetaId] = useState(null);
  const [showTarjetaModal, setShowTarjetaModal] = useState(false);
  const [tarjetaFormData, setTarjetaFormData] = useState({
    nombre: '',
    banco: '',
    diaPago: new Date().getDate(),
    fechaCorte: new Date().getDate(),
  });
  const [tarjetaFormError, setTarjetaFormError] = useState(null);
  const [isLoadingTarjetaForm, setIsLoadingTarjetaForm] = useState(false);
  const [editingTarjeta, setEditingTarjeta] = useState(null);
  const [showDeleteTarjetaConfirm, setShowDeleteTarjetaConfirm] = useState(null);
  const [showDeletePlanConfirm, setShowDeletePlanConfirm] = useState(null);
  const [planDeleteLoading, setPlanDeleteLoading] = useState(false);
  const [planDeleteError, setPlanDeleteError] = useState(null);
  const [showPagarConfirm, setShowPagarConfirm] = useState(null);
  const [pagarLoading, setPagarLoading] = useState(false);
  const [pagarError, setPagarError] = useState(null);
  const [showPlanFormModal, setShowPlanFormModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingPlanSnapshot, setEditingPlanSnapshot] = useState(null);
  const [planFormData, setPlanFormData] = useState(null);
  const [planFormError, setPlanFormError] = useState(null);
  const [planFormLoading, setPlanFormLoading] = useState(false);
  const [sessionTiposCategoriaCuota, setSessionTiposCategoriaCuota] = useState([]);
  const [nuevaCategoriaCuota, setNuevaCategoriaCuota] = useState({ label: '', iconKey: 'ShoppingCartIcon' });
  const [tipoCategoriaCuotaToDelete, setTipoCategoriaCuotaToDelete] = useState(null);
  const [categoriaCuotaInlineError, setCategoriaCuotaInlineError] = useState(null);
  const nuevaCategoriaCuotaBlockRef = useRef(null);
  const [tarjetaPage, setTarjetaPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const swipeRefs = useRef({});

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [tarjetasRes, cuotasRes] = await Promise.all([
        tarjetaService.getTarjetas(),
        cuotaService.getCuotas(),
      ]);
      const tarjetasRaw = tarjetasRes?.data?.tarjetas || tarjetasRes?.tarjetas || [];
      const soloCredito = tarjetasRaw.filter((t) => t.tipo === 'credito' && t.esActiva !== false);
      const cuotasRaw = cuotasRes?.data?.cuotas || cuotasRes?.cuotas || [];
      setTarjetas(soloCredito);
      setPlanes(cuotasRaw.filter((c) => c.estado !== 'cancelada'));
    } catch (e) {
      setError('Error al cargar tarjetas y cuotas');
      setTarjetas([]);
      setPlanes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Si venimos desde Gastos/otros con "abrir nueva tarjeta", mostrar modal
  useEffect(() => {
    if (location.state?.openNuevaTarjeta) {
      setShowTarjetaModal(true);
      setTarjetaFormData({ nombre: '', banco: '', diaPago: new Date().getDate(), fechaCorte: new Date().getDate() });
      setTarjetaFormError(null);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openNuevaTarjeta, location.pathname, navigate]);

  // Si venimos desde Gastos tras crear un plan, expandir la tarjeta usada
  useEffect(() => {
    const expandId = location.state?.expandTarjetaId;
    if (expandId) {
      setExpandedTarjetaId(expandId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.expandTarjetaId, location.pathname, navigate]);

  // Desde Calendario: abrir detalle avanzado del plan de cuotas (mismo modal que al pulsar un plan)
  useEffect(() => {
    const planId = location.state?.openPlanId;
    if (!planId || planes.length === 0) return;
    const plan = planes.find((p) => String(p._id || p.id) === String(planId));
    if (!plan) {
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    const tid =
      typeof plan.tarjeta === 'object' && plan.tarjeta != null
        ? plan.tarjeta._id
        : plan.tarjeta;
    if (tid) setExpandedTarjetaId(tid);
    setShowPlanDetails(plan);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state?.openPlanId, planes, location.pathname, navigate]);

  const openTarjetaModal = () => {
    setEditingTarjeta(null);
    setTarjetaFormData({ nombre: '', banco: '', diaPago: new Date().getDate(), fechaCorte: new Date().getDate() });
    setTarjetaFormError(null);
    setShowTarjetaModal(true);
  };

  const diasDelMes = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleTarjetaSubmit = async (e) => {
    e.preventDefault();
    setTarjetaFormError(null);
    setIsLoadingTarjetaForm(true);
    try {
      const diaPago = Math.min(31, Math.max(1, Number(tarjetaFormData.diaPago) || 1));
      const fechaCorte = Math.min(31, Math.max(1, Number(tarjetaFormData.fechaCorte) || 1));
      const dataToSend = {
        nombre: tarjetaFormData.nombre.trim(),
        tipo: 'credito',
        moneda: 'GTQ',
        banco: tarjetaFormData.banco?.trim() || undefined,
        diaPago,
        fechaCorte,
      };
      if (editingTarjeta) {
        await tarjetaService.updateTarjeta(editingTarjeta._id, dataToSend);
      } else {
        await tarjetaService.createTarjeta(dataToSend);
      }
      setShowTarjetaModal(false);
      setEditingTarjeta(null);
      await loadData();
    } catch (err) {
      const data = err?.response?.data;
      const firstMsg = Array.isArray(data?.errors) && data.errors[0]?.msg ? data.errors[0].msg : null;
      setTarjetaFormError(firstMsg || data?.message || err?.message || 'Error al guardar. Intenta de nuevo.');
    } finally {
      setIsLoadingTarjetaForm(false);
    }
  };

  const openEditTarjetaModal = (tarjeta) => {
    setEditingTarjeta(tarjeta);
    setTarjetaFormData({
      nombre: tarjeta?.nombre ?? '',
      banco: tarjeta?.banco ?? '',
      diaPago: tarjeta?.diaPago ?? new Date().getDate(),
      fechaCorte: tarjeta?.fechaCorte ?? new Date().getDate(),
    });
    setTarjetaFormError(null);
    setShowTarjetaModal(true);
  };

  const handleDeleteTarjeta = async (id) => {
    if (!id) return;
    try {
      await tarjetaService.deleteTarjeta(id);
      setShowDeleteTarjetaConfirm(null);
      await loadData();
    } catch (err) {
      console.error('Error eliminando tarjeta:', err);
      const msg = err?.response?.data?.message || err?.message || 'Error al eliminar tarjeta';
      setShowDeleteTarjetaConfirm(null);
      setDeleteTarjetaError(msg);
    }
  };

  const handleDeletePlanPermanente = async () => {
    const plan = showDeletePlanConfirm;
    const planId = plan?._id;
    if (!planId) return;
    setPlanDeleteLoading(true);
    setPlanDeleteError(null);
    try {
      await cuotaService.deleteCuota(planId, { permanente: true });
      setShowDeletePlanConfirm(null);
      setShowPlanDetails(null);
      await loadData();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.message || (typeof err?.message === 'string' ? err.message : null) || 'No se pudo eliminar el plan. Intenta de nuevo.';
      setPlanDeleteError(msg);
    } finally {
      setPlanDeleteLoading(false);
    }
  };

  const handlePagarCuota = async () => {
    const plan = showPagarConfirm;
    const planId = plan?._id;
    if (!planId) return;
    setPagarLoading(true);
    setPagarError(null);
    try {
      const res = await cuotaService.pagarCuota(planId, {});
      const cuotaActualizada = res?.data?.cuota || res?.cuota;
      setShowPagarConfirm(null);
      if (cuotaActualizada) {
        setShowPlanDetails((prev) =>
          prev && prev._id === planId ? cuotaActualizada : prev
        );
      }
      await loadData();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.message || (typeof err?.message === 'string' ? err.message : null) || 'No se pudo registrar el pago. Intenta de nuevo.';
      setPagarError(msg);
    } finally {
      setPagarLoading(false);
    }
  };

  const openEditPlanModal = (plan) => {
    const catRaw = (plan.categoria || '').trim();
    const categoriasPredefinidas = ['alimentacion', 'transporte', 'otros'];
    const categoriaInicial = categoriasPredefinidas.includes(catRaw)
      ? catRaw
      : catRaw || 'otros';
    setEditingPlanId(plan._id);
    setEditingPlanSnapshot(plan);
    setSessionTiposCategoriaCuota([]);
    setNuevaCategoriaCuota({ label: '', iconKey: 'ShoppingCartIcon' });
    setTipoCategoriaCuotaToDelete(null);
    setCategoriaCuotaInlineError(null);
    setPlanFormData({
      nombre: (plan.nombre || '').trim() || 'Compra a cuotas',
      categoria: categoriaInicial,
      categoriaPersonalizada: '',
    });
    setPlanFormError(null);
    setShowPlanFormModal(true);
  };

  const handlePlanFormSubmit = async (e) => {
    e.preventDefault();
    if (!editingPlanId || !planFormData) return;
    setPlanFormError(null);
    setPlanFormLoading(true);
    try {
      const payload = {
        nombre: String(planFormData.nombre || '').trim().substring(0, 100) || 'Compra a cuotas',
      };
      const catResolved =
        planFormData.categoria === 'personalizado'
          ? String(planFormData.categoriaPersonalizada || '').trim()
          : String(planFormData.categoria || '').trim();
      if (catResolved) payload.categoria = catResolved.substring(0, 60);
      await cuotaService.updateCuota(editingPlanId, payload);
      setShowPlanFormModal(false);
      setEditingPlanId(null);
      setEditingPlanSnapshot(null);
      setPlanFormData(null);
      setShowPlanDetails((prev) => (prev && prev._id === editingPlanId ? null : prev));
      await loadData();
    } catch (err) {
      const data = err?.response?.data;
      const errs = Array.isArray(data?.errors) ? data.errors : [];
      const detail = errs.map((e) => e?.msg).filter(Boolean).join(' · ');
      setPlanFormError(detail || data?.message || err?.message || 'No se pudo guardar el plan.');
    } finally {
      setPlanFormLoading(false);
    }
  };

  const handleConfirmDeleteTipoCategoriaCuota = async () => {
    if (!tipoCategoriaCuotaToDelete) return;
    try {
      if (tipoCategoriaCuotaToDelete.type === 'api' && tipoCategoriaCuotaToDelete.id != null) {
        await deleteTipoGasto(tipoCategoriaCuotaToDelete.id);
      } else if (tipoCategoriaCuotaToDelete.type === 'session') {
        setSessionTiposCategoriaCuota((prev) =>
          prev.filter((s) => s.sessionId !== tipoCategoriaCuotaToDelete.sessionId)
        );
      }
      const deletedLabel = tipoCategoriaCuotaToDelete?.label ?? '';
      setPlanFormData((prev) => {
        if (!prev) return prev;
        if (prev.categoria === deletedLabel) {
          return { ...prev, categoria: 'alimentacion', categoriaPersonalizada: '' };
        }
        return prev;
      });
    } catch (e) {
      console.error(e);
    }
    setTipoCategoriaCuotaToDelete(null);
  };

  const handleCancelPlanForm = useCallback(() => {
    if (planFormLoading) return;
    setShowPlanFormModal(false);
    setEditingPlanId(null);
    setEditingPlanSnapshot(null);
    setPlanFormData(null);
    setPlanFormError(null);
    setSessionTiposCategoriaCuota([]);
    setNuevaCategoriaCuota({ label: '', iconKey: 'ShoppingCartIcon' });
    setTipoCategoriaCuotaToDelete(null);
    setCategoriaCuotaInlineError(null);
  }, [planFormLoading]);

  /** Nombre de tarjeta en el snapshot del plan (solo lectura en editar). */
  const planEditTarjetaLabel = useMemo(() => {
    const p = editingPlanSnapshot;
    if (!p) return '—';
    if (typeof p.tarjeta === 'object' && p.tarjeta != null && p.tarjeta.nombre) {
      return p.tarjeta.nombre;
    }
    const tid = typeof p.tarjeta === 'object' ? p.tarjeta?._id : p.tarjeta;
    const t = tarjetas.find((x) => x._id === tid);
    return t?.nombre || 'Tarjeta';
  }, [editingPlanSnapshot, tarjetas]);

  const planFormInvalid = useMemo(() => {
    if (!planFormData) return true;
    const sinCat =
      !planFormData.categoria
      || (planFormData.categoria === 'personalizado' && !planFormData.categoriaPersonalizada?.trim());
    return sinCat;
  }, [planFormData]);

  // Agrupar planes por tarjeta (id); incluir tarjetas que solo aparecen en planes
  const planesPorTarjeta = useMemo(() => {
    const map = {};
    tarjetas.forEach((t) => {
      map[t._id] = { tarjeta: t, planes: [] };
    });
    planes.forEach((plan) => {
      const tid = typeof plan.tarjeta === 'object' ? plan.tarjeta?._id : plan.tarjeta;
      if (!tid) return;
      if (!map[tid]) {
        const tObj = typeof plan.tarjeta === 'object' ? plan.tarjeta : null;
        map[tid] = {
          tarjeta: tarjetas.find((x) => x._id === tid) || tObj || { _id: tid, nombre: 'Tarjeta' },
          planes: [],
        };
      }
      map[tid].planes.push(plan);
    });
    return Object.values(map).sort((a, b) => (b.planes.length - a.planes.length) || ((a.tarjeta?.nombre || '').localeCompare(b.tarjeta?.nombre || '')));
  }, [tarjetas, planes]);

  // Filtrado por búsqueda: nombre/banco de tarjeta o nombre de algún plan
  const planesPorTarjetaFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return planesPorTarjeta;
    return planesPorTarjeta.filter(({ tarjeta, planes: planesList }) => {
      const nombreTarjeta = (tarjeta?.nombre || '').toLowerCase();
      const bancoTarjeta = (tarjeta?.banco || '').toLowerCase();
      if (nombreTarjeta.includes(term) || bancoTarjeta.includes(term)) return true;
      return planesList.some((plan) => (plan?.nombre || '').toLowerCase().includes(term));
    });
  }, [planesPorTarjeta, searchTerm]);

  const totalTarjetas = planesPorTarjetaFiltrados.length;
  const totalTarjetaPages = Math.max(1, Math.ceil(totalTarjetas / TARJETAS_PER_PAGE));
  const tarjetasPaginadas = useMemo(() => {
    if (totalTarjetas <= TARJETAS_PER_PAGE) return planesPorTarjetaFiltrados;
    const start = (tarjetaPage - 1) * TARJETAS_PER_PAGE;
    return planesPorTarjetaFiltrados.slice(start, start + TARJETAS_PER_PAGE);
  }, [planesPorTarjetaFiltrados, tarjetaPage, totalTarjetas]);

  useEffect(() => {
    if (totalTarjetaPages > 0 && tarjetaPage > totalTarjetaPages) {
      setTarjetaPage(totalTarjetaPages);
    }
  }, [totalTarjetaPages, tarjetaPage]);

  useEffect(() => {
    setTarjetaPage(1);
  }, [searchTerm]);

  const progresoPorcentaje = (plan) =>
    plan.cuotasTotal > 0
      ? Math.min(100, Math.round((plan.cuotasPagadas / plan.cuotasTotal) * 100))
      : 0;

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-q-expense-muted border-t-q-expense mb-3"
            style={{ willChange: 'transform' }}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando cuotas...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 scroll-container">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-8">
        {/* Cabecera - misma estética que Ingresos y Gastos */}
        <motion.header
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:text-q-expense hover:border-q-expense/40 hover:bg-q-expense/5 dark:hover:bg-gray-600 dark:hover:border-gray-400 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-md focus:outline-none focus:ring-2 focus:ring-q-expense/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Regresar al inicio"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/transacciones/gastos', { state: { openCuotasPlanForm: true } })}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg bg-white dark:bg-gray-800 border border-q-expense-muted hover:border-q-expense hover:bg-q-expense-muted text-q-expense hover:text-q-expense text-sm font-medium shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-q-expense/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900 active:scale-[0.98]"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Nuevo plan</span>
                  <span className="sm:hidden">Nuevo</span>
                </button>
                <button
                  type="button"
                  onClick={openTarjetaModal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-q-expense hover:bg-q-expense-muted text-q-expense text-sm font-medium shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-q-expense/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900 active:scale-[0.98]"
                >
                  <CreditCardIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Agregar tarjeta</span>
                </button>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-q-expense/20 to-q-expense/5 dark:from-q-expense/30 dark:to-q-expense/15 flex items-center justify-center shadow-sm dark:shadow-inner">
                <CreditCardIcon className="h-6 w-6 sm:h-7 sm:w-7 text-q-expense" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-q-expense mb-1">
                  Transacciones
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                  Cuotas
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-300 leading-snug max-w-md">
                  Tus tarjetas y planes de pago a cuotas. Agrega tarjetas y revisa qué compraste y cuándo termina.
                </p>
              </div>
            </div>
          </div>
        </motion.header>

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

        {tarjetas.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </div>
              <input
                type="text"
                placeholder="Buscar tarjetas o planes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-q-expense focus:bg-white dark:focus:bg-gray-800 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-base min-h-[48px]"
                aria-label="Buscar tarjetas o planes de cuotas"
              />
            </div>
          </motion.div>
        )}

        {tarjetas.length === 0 ? (
          <motion.div
            className="p-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CreditCardIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              No hay tarjetas registradas
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Comienza registrando tu primera tarjeta de crédito
            </p>
          </motion.div>
        ) : planesPorTarjetaFiltrados.length === 0 ? (
          <motion.div
            className="p-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MagnifyingGlassIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              No se encontraron tarjetas ni planes con ese criterio
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Prueba con otro término o limpia la búsqueda
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {tarjetasPaginadas.map(({ tarjeta, planes: planesDeTarjeta }) => {
              const tid = tarjeta?._id || 'sin-tarjeta';
              const expanded = expandedTarjetaId === tid;
              return (
                <motion.div
                  key={tid}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl overflow-visible border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
                >
                  {/* Fila compacta por tarjeta - swipe Editar/Eliminar como Ingresos/Gastos */}
                  <SwipeableTransaction
                    ref={(el) => { swipeRefs.current[tid] = el; }}
                    onEdit={() => { swipeRefs.current[tid]?.toggleSwipe?.(); openEditTarjetaModal(tarjeta); }}
                    onDelete={() => { swipeRefs.current[tid]?.toggleSwipe?.(); setShowDeleteTarjetaConfirm(tarjeta._id); }}
                    editColor="text-q-primary hover:text-q-primary"
                    deleteColor="text-q-expense hover:text-q-expense"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedTarjetaId((prev) => (prev === tid ? null : tid))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedTarjetaId((prev) => (prev === tid ? null : tid));
                        }
                      }}
                      className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-q-expense focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 active:bg-gray-100 dark:active:bg-gray-700/60 transition-colors"
                      aria-expanded={expanded}
                      aria-label={expanded ? 'Ocultar planes de cuotas' : 'Ver planes de cuotas'}
                    >
                      <div className="w-10 h-8 rounded-lg flex-shrink-0 bg-gradient-to-br from-[#334155] to-[#1e293b] border border-white/20" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {tarjeta?.nombre || 'Tarjeta'}
                        </h3>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0 text-xs text-gray-500 dark:text-gray-400">
                          {tarjeta?.banco && <span className="font-medium text-gray-600 dark:text-gray-300 truncate">{tarjeta.banco}</span>}
                          {(tarjeta?.fechaCorte != null || tarjeta?.diaPago != null) && (
                            <span>
                              {tarjeta.fechaCorte != null && `Corte ${tarjeta.fechaCorte}`}
                              {tarjeta.fechaCorte != null && tarjeta.diaPago != null && ' · '}
                              {tarjeta.diaPago != null && `Pago ${tarjeta.diaPago}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center flex-shrink-0 pl-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            swipeRefs.current[tid]?.toggleSwipe?.();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              swipeRefs.current[tid]?.toggleSwipe?.();
                            }
                          }}
                          className="p-1 rounded-md text-gray-400 dark:text-gray-500 hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-q-expense focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 touch-manipulation"
                          aria-label="Opciones de tarjeta"
                        >
                          <ChevronRightIcon className="w-5 h-5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </SwipeableTransaction>

                  {/* Contenido desplegable: lista de planes */}
                  <motion.div
                    initial={false}
                    animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className={expanded ? 'overflow-visible' : 'overflow-hidden'}
                  >
                    <div className="bg-gray-50 dark:bg-gray-800/60 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-2xl">
                      {planesDeTarjeta.length === 0 ? (
                        <div className="px-4 sm:px-6 py-6 text-center">
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                            Sin planes de cuotas en esta tarjeta
                          </p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                          {planesDeTarjeta
                            .sort((a, b) => new Date(b.proximoPago || 0) - new Date(a.proximoPago || 0))
                            .map((plan) => {
                              const porcentaje = progresoPorcentaje(plan);
                              const nombrePlan = (plan.nombre && plan.nombre.trim()) || 'Compra a cuotas';
                              return (
                                <li key={plan._id}>
                                  <SwipeableTransaction
                                    ref={(el) => {
                                      swipeRefs.current[plan._id] = el;
                                    }}
                                    onEdit={() => {
                                      swipeRefs.current[plan._id]?.toggleSwipe?.();
                                      openEditPlanModal(plan);
                                    }}
                                    onDelete={() => {
                                      swipeRefs.current[plan._id]?.toggleSwipe?.();
                                      setPlanDeleteError(null);
                                      setShowDeletePlanConfirm(plan);
                                    }}
                                    className="rounded-none border-0"
                                    editColor="text-q-primary hover:text-q-primary"
                                    deleteColor="text-q-expense hover:text-q-expense"
                                  >
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      onClick={() => setShowPlanDetails(plan)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault();
                                          setShowPlanDetails(plan);
                                        }
                                      }}
                                      className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 text-left hover:bg-gray-100/80 dark:hover:bg-gray-700/40 active:bg-gray-200/80 dark:active:bg-gray-700/60 transition-colors touch-manipulation cursor-pointer"
                                    >
                                      <div className="w-10 h-10 rounded-xl bg-q-expense-muted flex items-center justify-center flex-shrink-0">
                                        <ShoppingCartIcon className="w-5 h-5 text-q-expense" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                          {nombrePlan}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                          {formatCurrency(plan.montoTotal, plan.moneda)} total · {plan.cuotasTotal} cuotas
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-q-expense rounded-full transition-all"
                                              style={{ width: `${porcentaje}%` }}
                                            />
                                          </div>
                                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 tabular-nums">
                                            {plan.cuotasPagadas}/{plan.cuotasTotal}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex-shrink-0 text-right flex items-center gap-2">
                                        <div>
                                          <p className="text-sm font-semibold text-q-expense">
                                            {formatCurrency(plan.montoCuota, plan.moneda)}/mes
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {plan.proximoPago
                                              ? formatDateUtil(plan.proximoPago, 'dd MMM')
                                              : '—'}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            swipeRefs.current[plan._id]?.toggleSwipe?.();
                                          }}
                                          className="flex-shrink-0 p-1 rounded-md text-gray-400 dark:text-gray-500 hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-q-expense min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                                          aria-label="Opciones del plan"
                                        >
                                          <ChevronRightIcon className="w-5 h-5" aria-hidden />
                                        </button>
                                      </div>
                                    </div>
                                  </SwipeableTransaction>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
            {totalTarjetas > TARJETAS_PER_PAGE && (
              <div className="flex gap-2 p-3 bg-white/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-xl mt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 flex-1 min-w-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(() => {
                      const from = (tarjetaPage - 1) * TARJETAS_PER_PAGE + 1;
                      const to = Math.min(tarjetaPage * TARJETAS_PER_PAGE, totalTarjetas);
                      return `${from}-${to} de ${totalTarjetas}`;
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setTarjetaPage((p) => Math.max(1, p - 1))}
                    disabled={tarjetaPage <= 1}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-q-expense-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium min-h-[36px]"
                    aria-label="Página anterior"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 tabular-nums min-w-[4rem] text-center">
                    {tarjetaPage} / {totalTarjetaPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTarjetaPage((p) => Math.min(totalTarjetaPages, p + 1))}
                    disabled={tarjetaPage >= totalTarjetaPages}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-q-expense-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium min-h-[36px]"
                    aria-label="Página siguiente"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal detalles del plan */}
        <FloatingModal
          isOpen={!!showPlanDetails}
          onClose={() => setShowPlanDetails(null)}
          size="md"
          showCloseButton
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Detalles del plan de cuotas"
          compactHeader
        >
          {showPlanDetails && (
            <div className="pt-2 px-4 pb-6 sm:px-6 sm:pt-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl mb-4 bg-q-expense-muted/40 dark:bg-q-expense-muted/20">
                <div className="w-12 h-12 rounded-xl bg-q-expense/15 flex items-center justify-center flex-shrink-0">
                  <ShoppingCartIcon className="w-6 h-6 text-q-expense" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-q-expense">
                    Plan de cuotas
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {showPlanDetails.nombre || 'Compra a cuotas'}
                  </p>
                  <p className="text-lg font-bold text-q-expense">
                    {formatCurrency(showPlanDetails.montoTotal, showPlanDetails.moneda)} total
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden text-sm">
                <div className="px-4">
                  <DetailRow
                    label="Cuota mensual"
                    value={formatCurrency(showPlanDetails.montoCuota, showPlanDetails.moneda)}
                  />
                  <div className="py-2.5 border-b border-gray-100 dark:border-gray-700/60">
                    <div className="flex justify-between items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Progreso</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                        {showPlanDetails.cuotasPagadas} de {showPlanDetails.cuotasTotal} cuotas ({progresoPorcentaje(showPlanDetails)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-q-expense rounded-full transition-all"
                        style={{ width: `${progresoPorcentaje(showPlanDetails)}%` }}
                      />
                    </div>
                  </div>
                  <DetailRow
                    label="Próximo pago"
                    value={
                      showPlanDetails.proximoPago
                        ? formatDateUtil(showPlanDetails.proximoPago, "EEEE d 'de' MMMM, yyyy")
                        : '—'
                    }
                  />
                  <DetailRow
                    label="Última cuota"
                    value={
                      showPlanDetails.fechaVencimiento
                        ? formatDateUtil(showPlanDetails.fechaVencimiento, "d 'de' MMMM, yyyy")
                        : '—'
                    }
                  />
                  {showPlanDetails.fechaInicio && (
                    <DetailRow
                      label="Inicio del plan"
                      value={formatDateUtil(showPlanDetails.fechaInicio, "d 'de' MMMM, yyyy")}
                    />
                  )}
                  {showPlanDetails.tarjeta && (
                    <DetailRow
                      label="Tarjeta"
                      value={
                        typeof showPlanDetails.tarjeta === 'object'
                          ? showPlanDetails.tarjeta.nombre || 'Tarjeta'
                          : 'Tarjeta vinculada'
                      }
                    />
                  )}
                </div>
              </div>

              {showPlanDetails.estado !== 'pagada' && (
                <button
                  type="button"
                  onClick={() => { setPagarError(null); setShowPagarConfirm(showPlanDetails); }}
                  className="mt-4 w-full rounded-xl bg-q-income py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 active:opacity-80"
                >
                  Marcar cuota como pagada
                  {' · '}
                  {formatCurrency(
                    Math.min(showPlanDetails.montoPendiente ?? showPlanDetails.montoCuota, showPlanDetails.montoCuota),
                    showPlanDetails.moneda
                  )}
                </button>
              )}

              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Para editar o eliminar el plan, desliza la fila en la lista o usa la flecha a la derecha, igual que en Gastos.
              </p>
            </div>
          )}
        </FloatingModal>

        <ConfirmModal
          isOpen={!!showPagarConfirm}
          onClose={() => { if (!pagarLoading) { setShowPagarConfirm(null); setPagarError(null); } }}
          onConfirm={handlePagarCuota}
          title="¿Registrar este pago?"
          message={
            showPagarConfirm
              ? `Se registrará el pago de la cuota ${(showPagarConfirm.cuotasPagadas || 0) + 1} de ${showPagarConfirm.cuotasTotal} de «${(showPagarConfirm.nombre && showPagarConfirm.nombre.trim()) || 'este plan'}» por ${formatCurrency(Math.min(showPagarConfirm.montoPendiente ?? showPagarConfirm.montoCuota, showPagarConfirm.montoCuota), showPagarConfirm.moneda)}, y se creará el gasto correspondiente en Gastos.${pagarError ? ` ${pagarError}` : ''}`
              : ''
          }
          confirmText={pagarLoading ? 'Registrando...' : 'Registrar pago'}
          cancelText="Cancelar"
          variant="success"
          confirmDisabled={pagarLoading}
          showIcon={false}
          elevated
        />

        {/* Modal editar plan — mismo layout que “Nuevo gasto” en modo Gasto en cuotas */}
        <FloatingModal
          isOpen={showPlanFormModal && !!planFormData}
          onClose={handleCancelPlanForm}
          size="md"
          showCloseButton={true}
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Editar plan de cuotas"
          compactHeader={true}
        >
          {planFormData && (
            <div className="p-4 sm:p-6">
              <form onSubmit={handlePlanFormSubmit} className="space-y-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Edita el nombre y la categoría del plan.
                </p>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Datos del plan (solo lectura)</p>
                  <dl className="space-y-2.5">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-400 shrink-0">Tarjeta</dt>
                      <dd className="text-gray-900 dark:text-white text-right font-medium min-w-0">{planEditTarjetaLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-400 shrink-0">Monto total</dt>
                      <dd className="text-gray-900 dark:text-white text-right font-medium tabular-nums">
                        {editingPlanSnapshot
                          ? formatCurrency(editingPlanSnapshot.montoTotal ?? 0, editingPlanSnapshot.moneda || 'GTQ')
                          : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-400 shrink-0">Progreso</dt>
                      <dd className="text-gray-900 dark:text-white text-right font-medium">
                        {editingPlanSnapshot?.cuotasPagadas ?? 0} / {editingPlanSnapshot?.cuotasTotal ?? '—'} cuotas pagadas
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-400 shrink-0">1.ª cuota</dt>
                      <dd className="text-gray-900 dark:text-white text-right text-xs sm:text-sm">
                        {editingPlanSnapshot?.fechaInicio
                          ? formatDateUtil(editingPlanSnapshot.fechaInicio, "d 'de' MMMM, yyyy")
                          : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-400 shrink-0">Última cuota</dt>
                      <dd className="text-gray-900 dark:text-white text-right text-xs sm:text-sm">
                        {editingPlanSnapshot?.fechaVencimiento
                          ? formatDateUtil(editingPlanSnapshot.fechaVencimiento, "d 'de' MMMM, yyyy")
                          : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-400 shrink-0">Próximo pago</dt>
                      <dd className="text-gray-900 dark:text-white text-right text-xs sm:text-sm">
                        {editingPlanSnapshot?.proximoPago
                          ? formatDateUtil(editingPlanSnapshot.proximoPago, "d 'de' MMMM, yyyy")
                          : '—'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className={isDesktopModal ? 'grid grid-cols-2 gap-6 items-start' : 'space-y-6'}>
                  <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 ml-1">
                          Categoría de gasto
                        </label>
                        <div className={`${isDesktopModal ? 'grid grid-cols-2 gap-3' : 'flex gap-3 -mx-2 px-2 overflow-x-auto overflow-y-hidden flex-nowrap'}`} style={!isDesktopModal ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}>
                          {[
                            { value: 'alimentacion', label: 'Alimentación', Icon: ShoppingCartIcon },
                            { value: 'transporte', label: 'Transporte', Icon: TruckIcon },
                            { value: 'otros', label: 'Otros', Icon: EllipsisHorizontalCircleIcon },
                          ].map(({ value, label, Icon }) => {
                            const isSelected = planFormData.categoria === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => {
                                  setPlanFormData((prev) => (prev ? { ...prev, categoria: value, categoriaPersonalizada: '' } : prev));
                                }}
                                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-colors touch-manipulation ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'} ${isSelected ? 'bg-q-expense-muted border-q-expense text-q-expense' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                              >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-expense' : 'text-gray-500 dark:text-gray-400'}`} aria-hidden />
                                {label}
                              </button>
                            );
                          })}
                          {(tiposGasto || [])
                            .filter(
                              (t) =>
                                (t.id != null || t._id != null)
                                && !['alimentacion', 'transporte', 'otros'].includes((t.slug || '').toLowerCase())
                            )
                            .map((cat) => {
                              const value = cat.label || cat.slug;
                              const catId = cat.id ?? cat._id;
                              const CatIcon = getIconComponent(normalizeIconKey(cat.iconKey, 'ShoppingCartIcon'));
                              const isSelected = planFormData.categoria === value;
                              return (
                                <div
                                  key={catId ?? value}
                                  className={`flex items-center rounded-full border-2 min-w-0 ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'} ${isSelected ? 'bg-q-expense-muted border-q-expense' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPlanFormData((prev) => (prev ? { ...prev, categoria: value, categoriaPersonalizada: '' } : prev));
                                    }}
                                    className="flex-1 min-w-0 inline-flex items-center gap-2 pl-4 pr-1 py-2.5 text-sm font-medium text-left transition-colors"
                                  >
                                    {CatIcon && (
                                      <CatIcon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-expense' : 'text-gray-500 dark:text-gray-400'}`} />
                                    )}
                                    <span className={`truncate ${isSelected ? 'text-q-expense' : 'text-gray-600 dark:text-gray-300'}`}>{cat.label}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTipoCategoriaCuotaToDelete({ type: 'api', id: catId, label: cat.label });
                                    }}
                                    className="flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-q-expense transition-colors mr-1 flex-shrink-0"
                                    aria-label="Eliminar categoría"
                                  >
                                    <TrashIcon className="w-4 h-4 block" />
                                  </button>
                                </div>
                              );
                            })}
                          {sessionTiposCategoriaCuota.map((t) => {
                            const SIcon = getIconComponent(normalizeIconKey(t.iconKey, 'ShoppingCartIcon'));
                            const isSelected = planFormData.categoria === t.label;
                            return (
                              <div
                                key={t.sessionId}
                                className={`flex items-center rounded-full border-2 min-w-0 ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'} ${isSelected ? 'bg-q-expense-muted border-q-expense' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPlanFormData((prev) => (prev ? { ...prev, categoria: t.label, categoriaPersonalizada: '' } : prev));
                                  }}
                                  className="flex-1 min-w-0 inline-flex items-center gap-2 pl-4 pr-1 py-2.5 text-sm font-medium text-left transition-colors"
                                >
                                  {SIcon && (
                                    <SIcon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-expense' : 'text-gray-500 dark:text-gray-400'}`} />
                                  )}
                                  <span className={`truncate ${isSelected ? 'text-q-expense' : 'text-gray-600 dark:text-gray-300'}`}>{t.label}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTipoCategoriaCuotaToDelete({
                                      type: 'session',
                                      sessionId: t.sessionId,
                                      label: t.label,
                                    });
                                  }}
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
                              setNuevaCategoriaCuota({ label: '', iconKey: 'ShoppingCartIcon' });
                              setPlanFormData((prev) => (prev ? { ...prev, categoria: 'personalizado', categoriaPersonalizada: '' } : prev));
                              setCategoriaCuotaInlineError(null);
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
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                          Nombre de lo que compraste
                        </label>
                        <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 focus-within:border-q-expense/50 transition-colors">
                          <Bars3Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" aria-hidden />
                          <textarea
                            value={planFormData.nombre}
                            onChange={(e) => setPlanFormData((prev) => (prev ? { ...prev, nombre: e.target.value } : prev))}
                            className="flex-1 min-w-0 bg-transparent border-none p-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-0 focus:outline-none resize-none"
                            rows={2}
                            placeholder="Ej. TV, laptop, mueble..."
                            maxLength={100}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {planFormData.categoria === 'personalizado' && (
                    <div
                      ref={nuevaCategoriaCuotaBlockRef}
                      className={`rounded-xl border border-q-expense-muted bg-q-expense-muted/50 dark:bg-q-expense-muted/20 p-4 w-full min-w-0 ${isDesktopModal ? '' : 'mt-3'} ${isDesktopModal ? 'flex flex-col' : 'space-y-4'}`}
                    >
                      <div className="flex items-center justify-between gap-3 w-full flex-shrink-0">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate min-w-0">Nueva categoría</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNuevaCategoriaCuota({ label: '', iconKey: 'ShoppingCartIcon' });
                            setPlanFormData((prev) => (prev ? { ...prev, categoria: 'alimentacion', categoriaPersonalizada: '' } : prev));
                            setCategoriaCuotaInlineError(null);
                          }}
                          className="text-sm font-medium text-q-expense hover:underline flex-shrink-0"
                        >
                          Volver
                        </button>
                      </div>
                      <div
                        className={isDesktopModal ? 'grid gap-4 items-start w-full min-w-0' : 'space-y-4 w-full'}
                        style={isDesktopModal ? { gridTemplateColumns: 'minmax(0, 240px) 1fr' } : undefined}
                      >
                        <div className="min-w-0 space-y-4 w-full">
                          <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                            <input
                              type="text"
                              value={planFormData.categoriaPersonalizada}
                              onChange={(e) => setPlanFormData((prev) => (prev ? { ...prev, categoriaPersonalizada: e.target.value } : prev))}
                              className={`w-full px-4 py-3 text-base border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-q-expense min-h-[44px] ${isDesktopModal ? 'max-w-[220px]' : ''}`}
                              placeholder="Ej. Supermercado"
                              autoComplete="off"
                            />
                          </div>
                          {categoriaCuotaInlineError && (
                            <p className="text-sm text-q-expense">{categoriaCuotaInlineError}</p>
                          )}
                          <div className={`flex flex-row flex-nowrap gap-2 ${isDesktopModal ? 'justify-start' : 'w-full'}`}>
                            <button
                              type="button"
                              disabled={!planFormData.categoriaPersonalizada?.trim()}
                              onClick={() => {
                                const label = planFormData.categoriaPersonalizada.trim();
                                const iconKey = normalizeIconKey(nuevaCategoriaCuota.iconKey, 'ShoppingCartIcon');
                                setSessionTiposCategoriaCuota((prev) => [
                                  ...prev,
                                  { label, iconKey, sessionId: `session-cuota-${Date.now()}-${label}` },
                                ]);
                                setPlanFormData((prev) => (prev ? { ...prev, categoria: label, categoriaPersonalizada: label } : prev));
                                setCategoriaCuotaInlineError(null);
                              }}
                              className={`px-4 py-2.5 text-sm font-medium rounded-xl border border-q-expense text-q-expense-muted bg-transparent hover:bg-q-expense-muted min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${!isDesktopModal ? 'flex-1 min-w-0' : ''}`}
                            >
                              Utilizar una vez
                            </button>
                            <button
                              type="button"
                              disabled={!planFormData.categoriaPersonalizada?.trim() || isLoadingTipos}
                              onClick={async () => {
                                setCategoriaCuotaInlineError(null);
                                try {
                                  const iconKey = normalizeIconKey(nuevaCategoriaCuota.iconKey, 'ShoppingCartIcon');
                                  const created = await createTipoGasto({
                                    label: planFormData.categoriaPersonalizada.trim(),
                                    iconKey,
                                  });
                                  if (created?.label) {
                                    setPlanFormData((prev) => (prev ? { ...prev, categoria: created.label, categoriaPersonalizada: created.label } : prev));
                                    setCategoriaCuotaInlineError(null);
                                  }
                                } catch (err) {
                                  setCategoriaCuotaInlineError(
                                    err?.response?.data?.message || 'No se pudo crear. Revisa el nombre o intenta de nuevo.'
                                  );
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
                          <div
                            className={`grid gap-2 overflow-y-auto overflow-x-hidden py-1 ${isDesktopModal ? 'grid-cols-[repeat(auto-fill,minmax(40px,1fr))] max-h-[160px]' : 'grid-cols-5 sm:grid-cols-6 max-h-[200px]'}`}
                          >
                            {ICON_KEYS_FOR_PICKER.map((iconKey) => {
                              const PIcon = getIconComponent(iconKey);
                              const selected =
                                normalizeIconKey(nuevaCategoriaCuota.iconKey, 'ShoppingCartIcon') === iconKey;
                              return (
                                <button
                                  key={iconKey}
                                  type="button"
                                  onClick={() => setNuevaCategoriaCuota((prev) => ({ ...prev, iconKey }))}
                                  className={`flex items-center justify-center min-h-[40px] min-w-[40px] rounded-xl border transition-colors touch-manipulation ${selected ? 'bg-q-expense-muted border-q-expense text-q-expense' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                  aria-label={iconKey}
                                >
                                  <PIcon className="h-5 w-5" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {planFormError && (
                    <div className="bg-q-expense-muted border border-q-expense-muted text-q-expense px-4 py-3 rounded-xl text-sm">
                      {planFormError}
                    </div>
                  )}

                  <div className={`mt-8 flex gap-3 ${isDesktopModal ? 'flex-row justify-end' : 'flex-col gap-4'}`}>
                    {isDesktopModal && (
                      <button type="button" onClick={handleCancelPlanForm} className="py-2.5 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={planFormLoading || planFormInvalid}
                      className={`font-bold text-white bg-q-expense hover:bg-q-expense rounded-2xl shadow-lg shadow-[0_10px_15px_-3px_rgba(239,68,68,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation ${isDesktopModal ? 'py-2.5 px-5' : 'w-full py-4'}`}
                    >
                      {planFormLoading ? 'Guardando...' : 'Actualizar'}
                    </button>
                    {!isDesktopModal && (
                      <button type="button" onClick={handleCancelPlanForm} className="w-full py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
          )}
        </FloatingModal>

        {/* Modal Nueva/Editar tarjeta (drop modal como Gastos/Ingresos) */}
        <FloatingModal
          isOpen={showTarjetaModal}
          onClose={() => { setShowTarjetaModal(false); setTarjetaFormError(null); setEditingTarjeta(null); }}
          size="md"
          showCloseButton={true}
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title={editingTarjeta ? 'Editar tarjeta' : 'Nueva tarjeta'}
          compactHeader={true}
        >
          <div className="p-4 sm:p-6">
            <form onSubmit={handleTarjetaSubmit} className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Solo tarjetas de crédito para llevar el control de cuotas.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={tarjetaFormData.nombre}
                  onChange={(e) => setTarjetaFormData({ ...tarjetaFormData, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-q-expense focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Ej: Visa principal, Bac..."
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Banco</label>
                <input
                  type="text"
                  value={tarjetaFormData.banco}
                  onChange={(e) => setTarjetaFormData({ ...tarjetaFormData, banco: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-q-expense focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Ej: Bac, Industrial, G&T..."
                  autoComplete="off"
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fechas de la tarjeta</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Día del mes (1-31) en que corta y en que debes pagar</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Día de corte</label>
                    <select
                      value={tarjetaFormData.fechaCorte}
                      onChange={(e) => setTarjetaFormData({ ...tarjetaFormData, fechaCorte: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-q-expense focus:border-transparent dark:bg-gray-700 dark:text-white text-sm min-h-[44px]"
                      required
                    >
                      {diasDelMes.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Día de pago</label>
                    <select
                      value={tarjetaFormData.diaPago}
                      onChange={(e) => setTarjetaFormData({ ...tarjetaFormData, diaPago: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-q-expense focus:border-transparent dark:bg-gray-700 dark:text-white text-sm min-h-[44px]"
                      required
                    >
                      {diasDelMes.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {tarjetaFormError && (
                <div className="bg-q-expense-muted border border-q-expense-muted text-q-expense px-4 py-3 rounded-lg text-sm">
                  {tarjetaFormError}
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 pt-4 sm:pt-6">
                <button
                  type="button"
                  onClick={() => { setShowTarjetaModal(false); setTarjetaFormError(null); }}
                  className="px-6 py-3 sm:py-2.5 text-base sm:text-sm font-medium text-gray-600 dark:text-gray-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 min-h-[44px] touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoadingTarjetaForm || !tarjetaFormData.nombre?.trim()}
                  className="px-8 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-white bg-q-expense hover:bg-q-expense/90 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                >
                  {isLoadingTarjetaForm ? (editingTarjeta ? 'Guardando...' : 'Creando...') : (editingTarjeta ? 'Guardar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </FloatingModal>

        <ConfirmModal
          isOpen={!!showDeletePlanConfirm}
          onClose={() => { setShowDeletePlanConfirm(null); setPlanDeleteError(null); }}
          onConfirm={handleDeletePlanPermanente}
          title="¿Eliminar este plan?"
          message={
            showDeletePlanConfirm
              ? `Se quitará «${(showDeletePlanConfirm.nombre && showDeletePlanConfirm.nombre.trim()) || 'Compra a cuotas'}» de tus planes. Los gastos que ya generaste al pagar cuotas siguen en Gastos; solo desaparece el seguimiento del plan aquí.${planDeleteError ? ` ${planDeleteError}` : ''}`
              : ''
          }
          confirmText={planDeleteLoading ? 'Eliminando...' : 'Eliminar plan'}
          cancelText="Cancelar"
          variant="danger"
          showIcon={false}
          confirmDisabled={planDeleteLoading}
          elevated
        />
        <ConfirmModal
          isOpen={!!tipoCategoriaCuotaToDelete}
          onClose={() => setTipoCategoriaCuotaToDelete(null)}
          onConfirm={handleConfirmDeleteTipoCategoriaCuota}
          title="Eliminar categoría"
          message={
            tipoCategoriaCuotaToDelete
              ? `¿Seguro que deseas eliminar ${tipoCategoriaCuotaToDelete.label}?`
              : ''
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          showIcon={false}
          elevated
        />
        <ConfirmModal
          isOpen={!!showDeleteTarjetaConfirm}
          onClose={() => setShowDeleteTarjetaConfirm(null)}
          onConfirm={() => handleDeleteTarjeta(showDeleteTarjetaConfirm)}
          title="¿Eliminar tarjeta?"
          message={showDeleteTarjetaConfirm ? `Se eliminará la tarjeta ${tarjetas.find((t) => t._id === showDeleteTarjetaConfirm)?.nombre || 'seleccionada'}. No podrás eliminarla si tiene planes de cuotas asociados.` : ''}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          showIcon={false}
          elevated
        />
        <ConfirmModal
          isOpen={!!deleteTarjetaError}
          onClose={() => setDeleteTarjetaError(null)}
          onConfirm={() => setDeleteTarjetaError(null)}
          title="No se puede eliminar"
          message={deleteTarjetaError || ''}
          confirmText="Entendido"
          variant="warning"
          showIcon={false}
          singleButton
        />
      </div>
    </div>
  );
};

function DetailRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between items-center gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white text-right break-words min-w-0">
        {value}
      </span>
    </div>
  );
}

export default CuotasContent;
