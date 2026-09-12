import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cuentaService } from '../services/cuentaService';
import SwipeableTransaction from '../components/SwipeableTransaction';
import FloatingModal from '../components/FloatingModal';
import ConfirmModal from '../components/ConfirmModal';
import { getRelativeTime } from '../utils/dateUtils';
import { formatCurrency } from '../utils/currencyUtils';
import {
  ArrowLeftIcon,
  PlusIcon,
  BuildingLibraryIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

function parseCuentasResponse(res) {
  const data = res?.data?.data ?? res?.data ?? res;
  return Array.isArray(data?.cuentas) ? data.cuentas : [];
}

const CuentasPage = ({ embedded = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const isDesktopModal = windowWidth >= 1280;

  const [cuentas, setCuentas] = useState([]);
  const [balancesByCuenta, setBalancesByCuenta] = useState({});
  const [bootstrapping, setBootstrapping] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasAnyAccount, setHasAnyAccount] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    moneda: 'GTQ',
    saldoInicial: ''
  });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteMovimientosCount, setDeleteMovimientosCount] = useState(null); // { gastos, ingresos } | null mientras carga
  const [deleting, setDeleting] = useState(false);

  const swipeRefs = useRef({});
  const firstFetchRef = useRef(true);

  const loadCuentas = useCallback(async () => {
    setPageError(null);
    if (firstFetchRef.current) setBootstrapping(true);
    try {
      const [res, balancesRes] = await Promise.all([
        cuentaService.getCuentas({ esActiva: 'true' }),
        cuentaService.getBalances().catch(() => ({ data: { balances: [] } }))
      ]);
      const list = parseCuentasResponse(res);
      setCuentas(list);
      setHasAnyAccount(list.length > 0);
      const balances = balancesRes?.data?.balances || balancesRes?.balances || [];
      const byCuenta = {};
      balances.forEach((b) => {
        if (b.cuentaId) byCuenta[b.cuentaId] = b.balance;
      });
      setBalancesByCuenta(byCuenta);
    } catch (e) {
      setPageError(e?.message || 'No se pudieron cargar las cuentas');
      setCuentas([]);
      setHasAnyAccount(false);
    } finally {
      if (firstFetchRef.current) {
        firstFetchRef.current = false;
        setBootstrapping(false);
      }
    }
  }, []);

  useEffect(() => {
    loadCuentas();
  }, [loadCuentas]);

  // Query ?nueva=1 (y opcional &moneda=GTQ|USD): abre el modal al llegar desde ingresos/gastos.
  // No usar solo location.state: se pierde con remontajes (p. ej. Strict Mode) y el modal no abre.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('nueva') !== '1') return;

    const monedaQ = params.get('moneda');
    setEditing(null);
    setFormData({
      nombre: '',
      moneda: monedaQ === 'USD' || monedaQ === 'GTQ' ? monedaQ : 'GTQ'
    });
    setFormError(null);
    setShowForm(true);

    const path = location.pathname;
    const t = window.setTimeout(() => {
      navigate({ pathname: path, search: '' }, { replace: true });
    }, 0);
    return () => window.clearTimeout(t);
  }, [location.search, location.pathname, navigate]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const filteredCuentas = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return cuentas;
    return cuentas.filter(
      (c) =>
        (c.nombre || '').toLowerCase().includes(q) ||
        (c.moneda || '').toLowerCase().includes(q)
    );
  }, [cuentas, searchTerm]);

  const sortedCuentas = useMemo(() => {
    return [...filteredCuentas].sort((a, b) =>
      (a.nombre || '').localeCompare(b.nombre || '', undefined, {
        sensitivity: 'base'
      })
    );
  }, [filteredCuentas]);

  const openNew = () => {
    setEditing(null);
    setFormData({ nombre: '', moneda: 'GTQ', saldoInicial: '' });
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (c) => {
    setEditing(c);
    setFormData({
      nombre: c.nombre || '',
      moneda: c.moneda || 'GTQ',
      saldoInicial: c.saldoInicial ? String(c.saldoInicial) : ''
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleView = (c) => {
    setShowDetails(c);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const nombre = formData.nombre?.trim();
    if (!nombre) {
      setFormError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const saldoInicial = formData.saldoInicial === '' ? 0 : Number(formData.saldoInicial);
      if (editing) {
        await cuentaService.updateCuenta(editing._id, {
          nombre,
          moneda: formData.moneda,
          saldoInicial
        });
      } else {
        await cuentaService.createCuenta({
          nombre,
          moneda: formData.moneda,
          saldoInicial
        });
      }

      handleCancel();
      await loadCuentas();
    } catch (err) {
      const msg =
        (typeof err?.message === 'string' && err.message) ||
        (Array.isArray(err?.errors) && err.errors[0]?.msg) ||
        'No se pudo guardar la cuenta';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await cuentaService.deleteCuenta(id);
      setShowDeleteConfirm(null);
      setShowDetails(null);
      setDeleteMovimientosCount(null);
      await loadCuentas();
    } catch (e) {
      setPageError(e?.message || 'Error al eliminar la cuenta');
      setShowDeleteConfirm(null);
      setDeleteMovimientosCount(null);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (cuenta) => {
    setShowDeleteConfirm(cuenta);
    setDeleteMovimientosCount(null); // null = cargando
    cuentaService
      .getMovimientosCount(cuenta._id)
      .then((res) => {
        const data = res?.data?.data ?? res?.data ?? res;
        setDeleteMovimientosCount({ gastos: data?.gastos || 0, ingresos: data?.ingresos || 0 });
      })
      .catch(() => setDeleteMovimientosCount({ gastos: 0, ingresos: 0, error: true }));
  };

  if (bootstrapping) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 pointer-events-none select-none"
        aria-busy="true"
      >
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ contain: 'layout paint' }}
        >
          <div
            className="animate-spin rounded-full h-16 w-16 border-4 border-q-primary-muted border-t-q-primary mb-4"
            style={{ willChange: 'transform' }}
          />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Cargando cuentas...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? 'min-h-0 bg-gray-50 dark:bg-gray-900'
          : 'min-h-screen bg-gray-50 dark:bg-gray-900 scroll-container'
      }
    >
      <div className={`max-w-6xl mx-auto px-4 ${embedded ? 'py-4 pb-6' : 'py-6 pb-8'}`}>
        <motion.header
          className={embedded ? 'mb-4 sm:mb-5' : 'mb-6 sm:mb-8'}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:text-q-primary hover:border-q-primary/40 hover:bg-q-primary/5 dark:hover:bg-gray-600 dark:hover:border-gray-400 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-md focus:outline-none focus:ring-2 focus:ring-q-primary/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Regresar al inicio"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={openNew}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg bg-white dark:bg-gray-800 border border-q-primary-muted hover:border-q-primary hover:bg-q-primary-muted text-q-primary text-sm font-medium shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-q-primary/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900 active:scale-[0.98]"
              >
                <PlusIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Nueva cuenta</span>
                <span className="sm:hidden">Nueva</span>
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-q-primary/20 to-q-primary/5 flex items-center justify-center shadow-sm">
                <BuildingLibraryIcon className="h-6 w-6 sm:h-7 sm:w-7 text-q-primary" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-q-primary/90 dark:text-gray-300 mb-1">
                  {embedded ? 'Planificación' : 'Transacciones'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                  Cuentas
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-300 leading-snug max-w-md">
                  Registra y revisa las cuentas que usás en tus movimientos.
                </p>
              </div>
            </div>
          </div>
        </motion.header>

        {pageError && (
          <motion.div
            className="mb-8 bg-q-expense-muted border border-q-expense-muted text-q-expense px-6 py-4 rounded-xl shadow-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-q-expense rounded-full mr-3" />
              {pageError}
            </div>
          </motion.div>
        )}

        {/* Modal Nuevo / Editar — mismo patrón que Ingresos */}
        <FloatingModal
          isOpen={showForm}
          onClose={handleCancel}
          size="md"
          showCloseButton
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title={editing ? 'Editar Cuenta' : 'Nueva Cuenta'}
          compactHeader
        >
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base min-h-[48px] focus:ring-2 focus:ring-q-primary"
                    placeholder="Ej. Efectivo, Banco, Ahorro"
                    maxLength={100}
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                    Moneda
                  </label>
                  <select
                    value={formData.moneda}
                    onChange={(e) =>
                      setFormData({ ...formData, moneda: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[48px] focus:ring-2 focus:ring-q-primary"
                  >
                    <option value="GTQ">GTQ</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                    Saldo inicial (opcional)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={formData.saldoInicial}
                    onChange={(e) =>
                      setFormData({ ...formData, saldoInicial: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base min-h-[48px] focus:ring-2 focus:ring-q-primary"
                    placeholder="0.00"
                  />
                  <p className="mt-1.5 ml-1 text-xs text-gray-400 dark:text-gray-500">
                    Cuánto ya tenías en esta cuenta antes de empezar a registrar movimientos en Quantis.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="bg-q-expense-muted border border-q-expense-muted text-q-expense px-4 py-3 rounded-xl text-sm">
                  {formError}
                </div>
              )}

              <div
                className={`mt-8 flex gap-3 ${isDesktopModal ? 'flex-row justify-end' : 'flex-col gap-4'}`}
              >
                {isDesktopModal && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="py-2.5 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className={`font-bold text-white bg-q-primary hover:bg-q-primary rounded-2xl shadow-lg shadow-[0_10px_15px_-3px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.35)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation ${
                    isDesktopModal ? 'py-2.5 px-5' : 'w-full py-4'
                  }`}
                >
                  {saving
                    ? 'Guardando...'
                    : editing
                      ? 'Actualizar'
                      : 'Crear Cuenta'}
                </button>
                {!isDesktopModal && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </FloatingModal>

        {hasAnyAccount && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </div>
              <input
                type="text"
                placeholder="Buscar cuentas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-q-primary focus:bg-white dark:focus:bg-gray-800 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-base min-h-[48px]"
              />
            </div>
          </motion.div>
        )}

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Cuentas
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/80 overflow-hidden">
            {sortedCuentas.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
                {sortedCuentas.map((c) => {
                  if (!swipeRefs.current[c._id]) {
                    swipeRefs.current[c._id] = React.createRef();
                  }
                  const subline = `Moneda ${c.moneda || 'GTQ'}`;
                  const balance = balancesByCuenta[c._id] ?? 0;
                  return (
                    <li key={c._id}>
                      <SwipeableTransaction
                        ref={swipeRefs.current[c._id]}
                        onEdit={() => handleEdit(c)}
                        onDelete={() => confirmDelete(c)}
                        onView={() => handleView(c)}
                        className="rounded-none border-0"
                        editColor="text-q-primary hover:text-q-primary"
                        deleteColor="text-q-expense hover:text-q-expense"
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handleView(c)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleView(c);
                            }
                          }}
                          className="w-full flex items-center gap-3 py-3.5 pl-4 pr-0 text-left hover:bg-gray-100/80 dark:hover:bg-gray-700/40 active:bg-gray-200/80 dark:active:bg-gray-700/60 transition-colors touch-manipulation cursor-pointer"
                        >
                          <span className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-q-primary-muted text-q-primary">
                            <BuildingLibraryIcon
                              className="w-5 h-5"
                              aria-hidden
                            />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                {c.nombre}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {subline}
                            </p>
                          </div>
                          <div className="flex-shrink-0 ml-auto flex items-center gap-2 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`font-semibold tabular-nums ${balance < 0 ? 'text-q-expense' : 'text-q-primary'}`}>
                                {formatCurrency(balance, c.moneda)}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">
                                {c.moneda}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                swipeRefs.current[c._id]?.current?.toggleSwipe();
                              }}
                              className="flex-shrink-0 p-0.5 rounded-md hover:opacity-70 text-gray-400 dark:text-gray-500 dark:hover:text-gray-400 transition-opacity"
                              aria-label="Opciones"
                            >
                              <ChevronRightIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </SwipeableTransaction>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <motion.div
                className="p-8 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BuildingLibraryIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  No hay cuentas registradas
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm
                    ? 'No se encontraron cuentas con ese criterio'
                    : 'Comienza registrando tu primera cuenta'}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Detalles — mismo esquema que Ingresos */}
        <FloatingModal
          isOpen={!!showDetails}
          onClose={() => setShowDetails(null)}
          size="md"
          showCloseButton
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Detalles de la cuenta"
          compactHeader
        >
          {showDetails &&
            (() => {
              const c = showDetails;
              const balance = balancesByCuenta[c._id] ?? 0;
              const DetailRow = ({ label: rowLabel, value, className = '' }) =>
                value != null && value !== '' ? (
                  <div
                    className={`flex justify-between items-center gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0 ${className}`}
                  >
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">
                      {rowLabel}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white text-right break-words min-w-0">
                      {value}
                    </span>
                  </div>
                ) : null;
              return (
                <div
                  className={
                    isDesktopModal
                      ? 'pt-3 px-6 pb-6 sm:pt-4 sm:px-8 sm:pb-8 max-w-2xl mx-auto'
                      : 'pt-2 px-4 pb-6 sm:px-6'
                  }
                >
                  <div className="flex items-center gap-4 p-4 rounded-2xl mb-4 bg-q-primary-muted/60 dark:bg-q-primary-muted/25">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 bg-q-primary/15 text-q-primary">
                      <BuildingLibraryIcon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-q-primary">
                        Cuenta
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {c.nombre}
                      </p>
                      <p className={`text-xl font-bold ${balance < 0 ? 'text-q-expense' : 'text-q-primary'}`}>
                        {formatCurrency(balance, c.moneda)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden text-sm">
                    <div className="px-4">
                      <DetailRow label="Moneda" value={c.moneda || 'GTQ'} />
                      <DetailRow
                        label="Saldo inicial"
                        value={formatCurrency(c.saldoInicial || 0, c.moneda)}
                      />
                      {c.createdAt && (
                        <DetailRow
                          label="Registrado"
                          value={getRelativeTime(c.createdAt)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
        </FloatingModal>

        <ConfirmModal
          isOpen={!!showDeleteConfirm}
          onClose={() => { if (!deleting) { setShowDeleteConfirm(null); setDeleteMovimientosCount(null); } }}
          onConfirm={() =>
            showDeleteConfirm && handleDelete(showDeleteConfirm._id)
          }
          title="¿Eliminar cuenta?"
          message={
            showDeleteConfirm
              ? (() => {
                  const base = `Se eliminará: ${showDeleteConfirm.nombre} — ${showDeleteConfirm.moneda}.`;
                  if (!deleteMovimientosCount) return `${base} Revisando movimientos asociados…`;
                  if (deleteMovimientosCount.error) {
                    return `${base} No se pudo comprobar cuántos gastos e ingresos tiene asignados — para no borrar movimientos por error, cierra e intenta de nuevo.`;
                  }
                  const { gastos, ingresos } = deleteMovimientosCount;
                  const total = gastos + ingresos;
                  const detalle =
                    total > 0
                      ? ` Junto con la cuenta se borrarán ${total} movimiento${total !== 1 ? 's' : ''} (${gastos} gasto${gastos !== 1 ? 's' : ''}, ${ingresos} ingreso${ingresos !== 1 ? 's' : ''}) que tienen esta cuenta asignada.`
                      : ' No tiene gastos ni ingresos asociados.';
                  return `${base}${detalle} Esta acción no se puede deshacer.`;
                })()
              : ''
          }
          confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
          cancelText="Cancelar"
          variant="danger"
          showIcon={false}
          confirmDisabled={!deleteMovimientosCount || deleteMovimientosCount.error || deleting}
        />
      </div>
    </div>
  );
};

export default CuentasPage;
