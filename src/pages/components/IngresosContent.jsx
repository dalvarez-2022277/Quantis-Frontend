import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthContext } from '../../contexts/AuthContext';
import { ingresoService } from '../../services/ingresoService';
import { recurrenciaService } from '../../services/recurrenciaService';
import SwipeableTransaction from '../../components/SwipeableTransaction';
import FloatingModal from '../../components/FloatingModal';
import ConfirmModal from '../../components/ConfirmModal';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate as formatDateUtil, getRelativeTime } from '../../utils/dateUtils';
import { getIconComponent, ICON_KEYS_FOR_PICKER, normalizeIconKey } from '../../utils/iconRegistry';
import { useTiposTransaccion } from '../../hooks/useTiposTransaccion';
import { useCuentas } from '../../hooks/useCuentas';
import { 
  PlusIcon, 
  TrashIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  WalletIcon,
  ChartBarIcon,
  BanknotesIcon,
  Bars3Icon,
  ArrowTrendingUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Valor sentinela en el select de cuenta: navega a /finanzas/cuentas y abre el modal nuevo.
const SELECT_CREAR_CUENTA = '__quantis_crear_cuenta__';

const IngresosContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { tiposIngreso, createTipoIngreso, deleteTipoIngreso, isLoading: isLoadingTipos } = useTiposTransaccion();
  const { cuentas: cuentasActivas, cuentaById } = useCuentas({ esActiva: 'true' });
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  const isDesktopModal = windowWidth >= 1280;
  const [ingresos, setIngresos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingIngreso, setEditingIngreso] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [detalleIngresoRecurrente, setDetalleIngresoRecurrente] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const ITEMS_PER_PAGE_OPTIONS = [15, 30, 50];
  const [sessionTiposIngreso, setSessionTiposIngreso] = useState([]);
  const [tipoIngresoToDelete, setTipoIngresoToDelete] = useState(null);
  const [nuevoIngresoTipo, setNuevoIngresoTipo] = useState({ label: '', iconKey: 'WalletIcon' });
  const [formError, setFormError] = useState(null);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const nuevoTipoIngresoBlockRef = useRef(null);

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

  // Estados del formulario
  const [formData, setFormData] = useState({
    tipo: 'quincena',
    tipoPersonalizado: '',
    monto: '',
    moneda: 'GTQ',
    fecha: getCurrentDate(),
    descripcion: '',
    esRecurrente: false,
    cuentaId: ''
  });
  
  // Refs
  const swipeRefs = useRef({});
  const fechaFormInputRef = useRef(null);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Desde calendario: mismo modal de detalle que al pulsar un ingreso en la lista (no formulario de edición)
  useEffect(() => {
    const openIngresoId = location.state?.openIngresoId;
    if (!openIngresoId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await ingresoService.getIngresoById(openIngresoId);
        const ingreso = data?.data?.ingreso ?? data?.ingreso ?? data;
        if (!cancelled && (ingreso?._id || ingreso?.id)) {
          setShowDetails(ingreso);
          setFormError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Error al cargar el ingreso');
      } finally {
        if (!cancelled) navigate(location.pathname, { replace: true, state: {} });
      }
    })();
    return () => { cancelled = true; };
  }, [location.state?.openIngresoId, location.pathname, navigate]);

  useEffect(() => {
    const rid = location.state?.openIngresoRecurrenteId;
    if (!rid) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await recurrenciaService.getIngresoRecurrenteById(rid);
        const r = data?.data?.ingresoRecurrente ?? data?.ingresoRecurrente ?? data;
        if (!cancelled && r && (r._id || r.id)) {
          setDetalleIngresoRecurrente(r);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'No se pudo cargar el ingreso recurrente');
      } finally {
        if (!cancelled) navigate(location.pathname, { replace: true, state: {} });
      }
    })();
    return () => { cancelled = true; };
  }, [location.state?.openIngresoRecurrenteId, location.pathname, navigate]);

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
      if (formData.tipo === label) setFormData(prev => ({ ...prev, tipo: 'quincena', tipoPersonalizado: '' }));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'No se pudo eliminar el tipo.';
      setFormError(msg);
    } finally {
      setTipoIngresoToDelete(null);
    }
  };

  // Formatear fecha como dd/mm/aa (ej. 11/12/25)
  const formatFechaShort = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!d || !m || !y) return dateStr;
    const yy = y.length >= 2 ? y.slice(-2) : y;
    return `${d}/${m}/${yy}`;
  };

  useEffect(() => {
    loadIngresos(currentPage);
  }, [currentPage, itemsPerPage]);

  // Efecto para formatear el monto cuando cambie la moneda
  useEffect(() => {
    if (formData.monto && formData.monto !== '') {
      const numAmount = parseFloat(formData.monto);
      if (!isNaN(numAmount)) {
        const formattedAmount = numAmount.toFixed(2);
        setFormData(prev => ({...prev, monto: formattedAmount}));
      }
    }
  }, [formData.moneda]);

  const cuentasParaMoneda = cuentasActivas.filter((c) => c.moneda === formData.moneda);

  const pickDefaultCuenta = React.useCallback(
    (moneda) => {
      if (!user?.cuentaDefault) return '';
      const match = cuentasActivas.find(
        (c) => c._id === user.cuentaDefault && c.moneda === moneda
      );
      return match ? match._id : '';
    },
    [user?.cuentaDefault, cuentasActivas]
  );

  const loadIngresos = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = { page, limit: itemsPerPage };
      const response = await ingresoService.getIngresos(params);
      const data = response?.data?.data ?? response?.data ?? response;
      setIngresos(data?.ingresos ?? []);
      setPagination(data?.pagination ?? null);
    } catch (error) {
      console.error('Error cargando ingresos:', error);
      setError('Error al cargar los ingresos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      setIsLoadingForm(true);
      const dataToSend = {
        ...formData,
        tipo: formData.tipo === 'personalizado' ? formData.tipoPersonalizado : formData.tipo
      };
      delete dataToSend.tipoPersonalizado;
      if (!dataToSend.cuentaId) delete dataToSend.cuentaId;
      if (editingIngreso) {
        await ingresoService.updateIngreso(editingIngreso._id, dataToSend);
      } else {
        await ingresoService.createIngreso(dataToSend);
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
          }
        }
      }
      setShowForm(false);
      setEditingIngreso(null);
      resetForm();
      loadIngresos();
    } catch (err) {
      console.error('Error guardando ingreso:', err);
      setFormError(err?.response?.data?.message || 'Error al guardar el ingreso');
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleEdit = (ingreso) => {
    setEditingIngreso(ingreso);
    const tiposChips = ['quincena', 'fin_mes', 'comision', 'bonificacion', 'inversion'];
    const esPersonalizado = !tiposChips.includes(ingreso.tipo);
    setFormData({
      tipo: esPersonalizado ? 'personalizado' : ingreso.tipo,
      tipoPersonalizado: esPersonalizado ? ingreso.tipo : '',
      monto: ingreso.monto.toString(),
      moneda: ingreso.moneda,
      fecha: ingreso.fecha ? ingreso.fecha.split('T')[0] : getCurrentDate(),
      descripcion: ingreso.descripcion || '',
      esRecurrente: ingreso.esRecurrente || false,
      cuentaId: ingreso.cuenta || ''
    });
    setShowForm(true);
  };

  const handleView = (ingreso) => {
    setShowDetails(ingreso);
  };

  const handleDuplicate = (ingreso) => {
    const tiposChips = ['quincena', 'fin_mes', 'comision', 'bonificacion', 'inversion'];
    const esPersonalizado = !tiposChips.includes(ingreso.tipo);
    setFormData({
      tipo: esPersonalizado ? 'personalizado' : ingreso.tipo,
      tipoPersonalizado: esPersonalizado ? ingreso.tipo : '',
      monto: ingreso.monto.toString(),
      moneda: ingreso.moneda,
      fecha: getCurrentDate(),
      descripcion: `${ingreso.descripcion || ''} (Copia)`.trim(),
      esRecurrente: false,
      cuentaId: ingreso.cuenta || ''
    });
    setEditingIngreso(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await ingresoService.deleteIngreso(id);
      setShowDeleteConfirm(null);
      loadIngresos();
    } catch (error) {
      console.error('Error eliminando ingreso:', error);
      setError('Error al eliminar el ingreso');
    }
  };

  const confirmDelete = (ingreso) => {
    setShowDeleteConfirm(ingreso);
  };

  const resetForm = () => {
    setFormData({
      tipo: 'quincena',
      tipoPersonalizado: '',
      monto: '',
      moneda: 'GTQ',
      fecha: getCurrentDate(),
      descripcion: '',
      esRecurrente: false,
      cuentaId: pickDefaultCuenta('GTQ')
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIngreso(null);
    setShowDetails(null);
    setFormError(null);
    resetForm();
  };

  const ingresoInvalido = !formData.monto || parseFloat(String(formData.monto).replace(/,/g, '')) <= 0 ||
    !formData.tipo || (formData.tipo === 'personalizado' && !formData.tipoPersonalizado?.trim()) ||
    !formData.fecha;

  const formatDate = (date) => {
    if (!date) return '';
    const dateStr = typeof date === 'string' ? date.split('T')[0] : date;
    return formatDateUtil(dateStr, 'dd MMM yyyy') || formatDateUtil(dateStr, 'dd/MM/yyyy');
  };

  const getIngresoIconKey = (ingreso) => {
    const list = tiposIngreso || [];
    const found = list.find(t => (t.slug || t.label) === ingreso.tipo || t.label === ingreso.tipo);
    return found?.iconKey || null;
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

  // Filtrar ingresos: búsqueda normalizada (trim + lowercase) en descripción, tipo y monto
  const searchNormalized = searchTerm.trim().toLowerCase();
  const filteredIngresos = ingresos.filter(ingreso => {
    if (!searchNormalized) return true;
    const tipoDisplay = getTipoIngresoName(ingreso.tipo);
    const matchDesc = ingreso.descripcion?.toLowerCase().includes(searchNormalized);
    const matchTipo = (ingreso.tipo || '').toLowerCase().includes(searchNormalized) || (tipoDisplay || '').toLowerCase().includes(searchNormalized);
    const matchMonto = ingreso.monto != null && String(ingreso.monto).toLowerCase().includes(searchNormalized);
    return matchDesc || matchTipo || matchMonto;
  });

  // Orden cronológico: más antiguo arriba (primero lo que ocurrió primero)
  const sortedIngresos = [...filteredIngresos].sort((a, b) => {
    const da = new Date(a.fecha || 0).getTime();
    const db = new Date(b.fecha || 0).getTime();
    if (da !== db) return db - da; // más reciente arriba
    return (b.createdAt || b._id || '').localeCompare(a.createdAt || a._id || '');
  });

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
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando ingresos...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 scroll-container">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-8">
        {/* Cabecera con estética nueva */}
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
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:text-q-income hover:border-q-income/40 hover:bg-q-income/5 dark:hover:bg-gray-600 dark:hover:border-gray-400 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-md focus:outline-none focus:ring-2 focus:ring-q-income/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Regresar al inicio"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setEditingIngreso(null); setShowForm(true); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg bg-white dark:bg-gray-800 border border-q-income-muted hover:border-q-income hover:bg-q-income-muted text-q-income hover:text-q-income text-sm font-medium shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-q-income/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900 active:scale-[0.98]"
              >
                <PlusIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Nuevo ingreso</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-q-income/20 to-q-income/5 dark:from-q-income/30 dark:to-q-income/15 flex items-center justify-center shadow-sm dark:shadow-inner">
                <WalletIcon className="h-6 w-6 sm:h-7 sm:w-7 text-q-income" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-q-income mb-1">
                  Transacciones
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                  Ingresos
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-300 leading-snug max-w-md">
                  Registra y revisa todo lo que entra a tu bolsillo.
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

        {/* Modal Nuevo/Editar Ingreso - igual que Dashboard */}
        <FloatingModal
          isOpen={showForm}
          onClose={handleCancel}
          size="md"
          showCloseButton={true}
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title={editingIngreso ? 'Editar Ingreso' : 'Nuevo Ingreso'}
          compactHeader={true}
        >
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className={isDesktopModal ? 'grid grid-cols-2 gap-6 items-start' : 'space-y-6'}>
              <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 ml-1">
                  Tipo de ingreso
                </label>
                <div className={`${isDesktopModal ? 'grid grid-cols-2 gap-3' : 'flex overflow-x-auto gap-3 -mx-2 px-2 overflow-y-hidden flex-nowrap'}`} style={!isDesktopModal ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}>
                  {[
                    { value: 'quincena', label: 'Quincena', Icon: WalletIcon },
                    { value: 'fin_mes', label: 'Fin de Mes', Icon: CurrencyDollarIcon },
                    { value: 'comision', label: 'Comisión', Icon: ChartBarIcon },
                    { value: 'inversion', label: 'Inversión', Icon: BanknotesIcon }
                  ].map(({ value, label, Icon }) => {
                    const isSelected = formData.tipo === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, tipo: value, tipoPersonalizado: '' })}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-colors touch-manipulation ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'} ${isSelected ? 'bg-q-income-muted border-q-income text-q-income' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-income' : 'text-gray-500 dark:text-gray-400'}`} />
                        {label}
                      </button>
                    );
                  })}
                  {(tiposIngreso || []).filter(t => (t.id != null || t._id != null) && !['quincena', 'comision', 'inversion', 'fin_mes'].includes((t.slug || '').toLowerCase())).map(tipo => {
                    const value = tipo.label || tipo.slug;
                    const tipoId = tipo.id ?? tipo._id;
                    const Icon = getIconComponent(normalizeIconKey(tipo.iconKey, 'WalletIcon'));
                    const isSelected = formData.tipo === value;
                    return (
                      <div key={tipoId ?? value} className={`flex items-center rounded-full border-2 min-w-0 ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'} ${isSelected ? 'bg-q-income-muted border-q-income' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
                        <button type="button" onClick={() => setFormData({ ...formData, tipo: value, tipoPersonalizado: '' })} className="flex-1 min-w-0 inline-flex items-center gap-2 pl-4 pr-1 py-2.5 text-sm font-medium text-left transition-colors">
                          {Icon && <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-income' : 'text-gray-500 dark:text-gray-400'}`} />}
                          <span className={`truncate ${isSelected ? 'text-q-income' : 'text-gray-600 dark:text-gray-300'}`}>{tipo.label}</span>
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTipoIngresoToDelete({ type: 'api', id: tipoId, label: tipo.label }); }} className="flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-q-expense transition-colors mr-1 flex-shrink-0" aria-label="Eliminar tipo">
                          <TrashIcon className="w-4 h-4 block" />
                        </button>
                      </div>
                    );
                  })}
                  {sessionTiposIngreso.map(tipo => {
                    const value = tipo.label;
                    const Icon = getIconComponent(normalizeIconKey(tipo.iconKey, 'WalletIcon'));
                    const isSelected = formData.tipo === value;
                    return (
                      <div key={tipo.sessionId} className={`flex items-center rounded-full border-2 min-w-0 ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'} ${isSelected ? 'bg-q-income-muted border-q-income' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
                        <button type="button" onClick={() => setFormData({ ...formData, tipo: value, tipoPersonalizado: '' })} className="flex-1 min-w-0 inline-flex items-center gap-2 pl-4 pr-1 py-2.5 text-sm font-medium text-left transition-colors">
                          {Icon && <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-income' : 'text-gray-500 dark:text-gray-400'}`} />}
                          <span className={`truncate ${isSelected ? 'text-q-income' : 'text-gray-600 dark:text-gray-300'}`}>{tipo.label}</span>
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTipoIngresoToDelete({ type: 'session', sessionId: tipo.sessionId, label: tipo.label }); }} className="flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-q-expense transition-colors mr-1 flex-shrink-0" aria-label="Eliminar tipo">
                          <TrashIcon className="w-4 h-4 block" />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => { setFormData({ ...formData, tipo: 'personalizado', tipoPersonalizado: formData.tipoPersonalizado || '' }); setNuevoIngresoTipo(prev => ({ ...prev, iconKey: prev.iconKey || 'WalletIcon' })); setFormError(null); }}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 font-medium touch-manipulation ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'}`}
                  >
                    <PlusIcon className="w-5 h-5 flex-shrink-0" />
                    Nuevo
                  </button>
                </div>
                {formData.tipo === 'personalizado' && (
                  <div ref={nuevoTipoIngresoBlockRef} className="rounded-xl border border-q-income-muted bg-q-income-muted/50 dark:bg-q-income-muted/20 p-4 w-full min-w-0 mt-3">
                    <div className="flex items-center justify-between gap-3 w-full flex-shrink-0 mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate min-w-0">Crear tipo personalizado</span>
                      <button type="button" onClick={() => { setNuevoIngresoTipo({ label: '', iconKey: 'WalletIcon' }); setFormData({ ...formData, tipo: 'quincena', tipoPersonalizado: '' }); setFormError(null); }} className="text-sm font-medium text-q-income hover:underline flex-shrink-0">Volver</button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                        <input type="text" value={formData.tipoPersonalizado} onChange={(e) => setFormData({ ...formData, tipoPersonalizado: e.target.value })} className="w-full px-4 py-3 text-base border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-q-income min-h-[44px]" placeholder="Ej. Freelance, Bonificación..." autoComplete="off" />
                      </div>
                      {formError && <p className="text-sm text-q-expense">{formError}</p>}
                      <div className="flex flex-row flex-nowrap gap-2">
                        <button type="button" disabled={!formData.tipoPersonalizado?.trim()} onClick={() => { const label = formData.tipoPersonalizado.trim(); const iconKey = normalizeIconKey(nuevoIngresoTipo.iconKey, 'WalletIcon'); setSessionTiposIngreso(prev => [...prev, { label, iconKey, sessionId: `session-${Date.now()}-${label}` }]); setFormData({ ...formData, tipo: label, tipoPersonalizado: label }); setFormError(null); }} className="flex-1 px-5 py-2.5 text-sm font-medium rounded-xl border border-q-income text-q-income-muted bg-transparent hover:bg-q-income-muted min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">Utilizar una vez</button>
                        <button type="button" disabled={!formData.tipoPersonalizado?.trim() || isLoadingTipos} onClick={async () => { setFormError(null); try { const iconKey = normalizeIconKey(nuevoIngresoTipo.iconKey, 'WalletIcon'); const created = await createTipoIngreso({ label: formData.tipoPersonalizado.trim(), iconKey }); if (created?.label) { setFormData({ ...formData, tipo: created.label, tipoPersonalizado: created.label }); setFormError(null); } } catch (err) { setFormError(err?.response?.data?.message || 'No se pudo crear. Revisa el nombre o intenta de nuevo.'); } }} className="flex-1 px-5 py-2.5 text-sm font-medium rounded-xl bg-q-income text-white hover:bg-q-income min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">Guardar</button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icono</label>
                      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto py-1">
                        {ICON_KEYS_FOR_PICKER.map(iconKey => {
                          const Icon = getIconComponent(iconKey);
                          const selected = normalizeIconKey(nuevoIngresoTipo.iconKey, 'WalletIcon') === iconKey;
                          return (
                            <button key={iconKey} type="button" onClick={() => setNuevoIngresoTipo(prev => ({ ...prev, iconKey }))} className={`flex items-center justify-center min-h-[40px] min-w-[40px] rounded-xl border transition-colors touch-manipulation ${selected ? 'bg-q-income-muted border-q-income text-q-income' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`} aria-label={iconKey}>
                              <Icon className="h-5 w-5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </div>
                <div className="space-y-6">
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
                    className="flex-1 min-w-0 bg-transparent border-none p-0 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:ring-0 focus:outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                  Cuenta (opcional)
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
                  <option value="">Sin cuenta</option>
                  {cuentasParaMoneda.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nombre}
                    </option>
                  ))}
                  {cuentasParaMoneda.length === 0 && (
                    <option value={SELECT_CREAR_CUENTA}>+ Crear cuenta nueva…</option>
                  )}
                </select>
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

              {/* FECHA y RECURRENTE - Dos columnas iguales en altura (simétricos); Fecha abre calendario al clic */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                    Fecha
                  </label>
                  <div
                    className="relative flex items-center gap-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 h-[48px] cursor-pointer"
                    onClick={() => {
                      fechaFormInputRef.current?.showPicker?.();
                      fechaFormInputRef.current?.focus();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fechaFormInputRef.current?.showPicker?.(); fechaFormInputRef.current?.focus(); } }}
                    aria-label="Seleccionar fecha"
                  >
                    <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 pointer-events-none" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 pointer-events-none">
                      {formatFechaShort(formData.fecha)}
                    </span>
                    <input
                      ref={fechaFormInputRef}
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
                  />
                </div>
              </div>
                </div>
              </div>

              {formError && (
                <div className="bg-q-expense-muted border border-q-expense-muted text-q-expense px-4 py-3 rounded-xl text-sm">{formError}</div>
              )}

              <div className={`mt-8 flex gap-3 ${isDesktopModal ? 'flex-row justify-end' : 'flex-col gap-4'}`}>
                {isDesktopModal && (
                  <button type="button" onClick={handleCancel} className="py-2.5 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Cancelar</button>
                )}
                <button type="submit" disabled={isLoadingForm || ingresoInvalido} className={`font-bold text-white bg-q-income hover:bg-q-income rounded-2xl shadow-lg shadow-[0_10px_15px_-3px_rgba(52,209,129,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation ${isDesktopModal ? 'py-2.5 px-5' : 'w-full py-4'}`}>
                  {isLoadingForm ? 'Guardando...' : (editingIngreso ? 'Actualizar' : 'Crear Ingreso')}
                </button>
                {!isDesktopModal && (
                  <button type="button" onClick={handleCancel} className="w-full py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation">Cancelar</button>
                )}
              </div>
            </form>
          </div>
        </FloatingModal>

        <ConfirmModal isOpen={!!tipoIngresoToDelete} onClose={() => setTipoIngresoToDelete(null)} onConfirm={handleConfirmDeleteTipoIngreso} title={tipoIngresoToDelete ? `Eliminar ${tipoIngresoToDelete.label}` : 'Eliminar'} message={tipoIngresoToDelete ? `¿Seguro que deseas eliminar ${tipoIngresoToDelete.label}?` : ''} confirmText="Eliminar" cancelText="Cancelar" variant="danger" elevated />

        {/* Barra de búsqueda estilo iOS */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative">
            {/* Barra de búsqueda principal */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </div>
              <input
                type="text"
                placeholder="Buscar ingresos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-q-income focus:bg-white dark:focus:bg-gray-800 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-base min-h-[48px]"
              />
            </div>
          </div>

        </motion.div>

        {/* Lista de ingresos - estética alineada con Dashboard */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ingresos</h2>
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/80 overflow-hidden">
            {sortedIngresos.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
                {sortedIngresos.map((ingreso, index) => {
                  if (!swipeRefs.current[ingreso._id]) swipeRefs.current[ingreso._id] = React.createRef();
                  const iconKey = getIngresoIconKey(ingreso);
                  const IconComponent = iconKey ? getIconComponent(normalizeIconKey(iconKey, 'WalletIcon')) : null;
                  const label = (ingreso.descripcion || '').trim() || getTipoIngresoName(ingreso.tipo);
                  const cuentaNombre = ingreso.cuenta
                    ? cuentaById(ingreso.cuenta)?.nombre || null
                    : null;
                  const subline = [
                    formatDate(ingreso.fecha),
                    (ingreso.descripcion || '').trim() ? getTipoIngresoName(ingreso.tipo) : null,
                    ingreso.esRecurrente ? 'Recurrente' : null,
                    cuentaNombre
                  ].filter(Boolean).join(' · ');
                  return (
                    <li key={ingreso._id}>
                      <SwipeableTransaction
                        ref={swipeRefs.current[ingreso._id]}
                        onEdit={() => handleEdit(ingreso)}
                        onDelete={() => confirmDelete(ingreso)}
                        onView={() => handleView(ingreso)}
                        onDuplicate={() => handleDuplicate(ingreso)}
                        className="rounded-none border-0"
                        editColor="text-q-income hover:text-q-income"
                        deleteColor="text-q-expense hover:text-q-expense"
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handleView(ingreso)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleView(ingreso); } }}
                          className="w-full flex items-center gap-3 py-3.5 pl-4 pr-0 text-left hover:bg-gray-100/80 dark:hover:bg-gray-700/40 active:bg-gray-200/80 dark:active:bg-gray-700/60 transition-colors touch-manipulation cursor-pointer"
                        >
                          <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-q-income-muted text-q-income">
                            {IconComponent ? <IconComponent className="w-5 h-5" aria-hidden /> : <ArrowTrendingUpIcon className="w-5 h-5" aria-hidden />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                              {label}
                              {ingreso.esRecurrente && (
                                <span className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-q-income/10 text-q-income" title="Recurrente (mismo día cada mes)">
                                  <ArrowPathIcon className="w-3.5 h-3.5" aria-hidden />
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subline}</p>
                          </div>
                          <div className="flex-shrink-0 ml-auto flex items-center gap-2 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-semibold tabular-nums text-q-income">+{formatCurrency(ingreso.monto, ingreso.moneda)}</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{ingreso.moneda}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); swipeRefs.current[ingreso._id]?.current?.toggleSwipe(); }}
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
                  <CurrencyDollarIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No hay ingresos registrados</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm
                    ? 'No se encontraron ingresos con ese criterio'
                    : 'Comienza registrando tu primer ingreso'}
                </p>
              </motion.div>
            )}
            {sortedIngresos.length > 0 && pagination && pagination.totalItems > 15 && (
              <div className="flex gap-2 p-3 bg-white/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700/80">
                <div className="flex flex-wrap items-center justify-between gap-2 flex-1 min-w-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(() => {
                      const from = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
                      const to = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);
                      return `${from}-${to} de ${pagination.totalItems}`;
                    })()}
                  </span>

                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={pagination.currentPage <= 1}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-q-income-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium min-h-[36px]"
                    aria-label="Página anterior"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 tabular-nums min-w-[4rem] text-center">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-q-income-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium min-h-[36px]"
                    aria-label="Página siguiente"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Modal de detalles - igual que Dashboard (Detalles de la transacción) */}
        <FloatingModal
          isOpen={!!showDetails}
          onClose={() => setShowDetails(null)}
          size="md"
          showCloseButton={true}
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Detalles del ingreso"
          compactHeader={true}
        >
          {showDetails && (() => {
            const i = showDetails;
            const iconKey = getIngresoIconKey(i);
            const IconComponent = iconKey ? getIconComponent(normalizeIconKey(iconKey, 'WalletIcon')) : null;
            const label = (i.descripcion || '').trim() || getTipoIngresoName(i.tipo);
            const descripcionUtil = (i.descripcion || '').trim();
            const mostrarDescripcion = descripcionUtil && descripcionUtil !== label;
            const DetailRow = ({ label: rowLabel, value, className = '' }) =>
              value != null && value !== '' ? (
                <div className={`flex justify-between items-center gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0 ${className}`}>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">{rowLabel}</span>
                  <span className="text-sm text-gray-900 dark:text-white text-right break-words min-w-0">{value}</span>
                </div>
              ) : null;
            return (
              <div className={isDesktopModal ? 'pt-3 px-6 pb-6 sm:pt-4 sm:px-8 sm:pb-8 max-w-2xl mx-auto' : 'pt-2 px-4 pb-6 sm:px-6'}>
                <div className="flex items-center gap-4 p-4 rounded-2xl mb-4 bg-q-income-muted/60 dark:bg-q-income-muted/30">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 bg-q-income/15 text-q-income">
                    {IconComponent ? <IconComponent className="w-6 h-6" /> : <ArrowTrendingUpIcon className="w-6 h-6" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-q-income">Ingreso</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{label}</p>
                    <p className="text-xl font-bold text-q-income">+{formatCurrency(i.monto, i.moneda)}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden text-sm">
                  <div className="px-4">
                    <DetailRow label="Tipo de ingreso" value={getTipoIngresoName(i.tipo)} />
                    <DetailRow label="Fecha" value={i.fecha ? formatDateUtil(i.fecha, "EEEE d 'de' MMMM, yyyy") : null} />
                    {i.esRecurrente && <DetailRow label="Recurrencia" value="Se repite cada mes (mismo día)" />}
                    {i.createdAt && <DetailRow label="Registrado" value={getRelativeTime(i.createdAt)} />}
                    <DetailRow label="Moneda" value={i.moneda || 'GTQ'} />
                    {i.cuenta && (
                      <DetailRow
                        label="Cuenta"
                        value={cuentaById(i.cuenta)?.nombre || i.cuenta}
                      />
                    )}
                  </div>
                </div>
                {mostrarDescripcion && (
                  <div className="mt-4 p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Notas</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{i.descripcion}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </FloatingModal>

        <FloatingModal
          isOpen={!!detalleIngresoRecurrente}
          onClose={() => setDetalleIngresoRecurrente(null)}
          size="md"
          showCloseButton
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Ingreso recurrente"
          compactHeader
        >
          {detalleIngresoRecurrente && (() => {
            const r = detalleIngresoRecurrente;
            return (
              <div className={isDesktopModal ? 'pt-3 px-6 pb-6 sm:pt-4 sm:px-8 sm:pb-8 max-w-2xl mx-auto' : 'pt-2 px-4 pb-6 sm:px-6'}>
                <div className="flex items-center gap-4 p-4 rounded-2xl mb-4 bg-q-income-muted/60 dark:bg-q-income-muted/30">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 bg-q-income/15 text-q-income">
                    <ArrowPathIcon className="w-6 h-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-q-income">Recurrente</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{r.nombre || 'Ingreso recurrente'}</p>
                    <p className="text-xl font-bold text-q-income">+{formatCurrency(r.monto, r.moneda)}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden text-sm px-4 py-2 space-y-2">
                  <div className="flex justify-between gap-4 py-1"><span className="text-gray-500 dark:text-gray-400">Frecuencia</span><span className="text-gray-900 dark:text-white text-right">{r.frecuencia || '—'}</span></div>
                  {r.diaPago != null && <div className="flex justify-between gap-4 py-1"><span className="text-gray-500 dark:text-gray-400">Día de pago</span><span className="text-gray-900 dark:text-white">{r.diaPago}</span></div>}
                  {r.fechaInicio && <div className="flex justify-between gap-4 py-1"><span className="text-gray-500 dark:text-gray-400">Inicio</span><span className="text-gray-900 dark:text-white">{formatDateUtil(r.fechaInicio, "d MMM yyyy")}</span></div>}
                  <div className="flex justify-between gap-4 py-1"><span className="text-gray-500 dark:text-gray-400">Activo</span><span className="text-gray-900 dark:text-white">{r.esActivo !== false ? 'Sí' : 'No'}</span></div>
                </div>
              </div>
            );
          })()}
        </FloatingModal>

        {/* Confirmación de eliminación */}
        <ConfirmModal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm._id)}
          title="¿Eliminar ingreso?"
          message={showDeleteConfirm
            ? `Se eliminará: ${getTipoIngresoName(showDeleteConfirm.tipo)} — +${formatCurrency(showDeleteConfirm.monto, showDeleteConfirm.moneda)}. Esta acción no se puede deshacer.`
            : ''}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          showIcon={false}
        />
      </div>
    </div>
  );
};

export default IngresosContent;
