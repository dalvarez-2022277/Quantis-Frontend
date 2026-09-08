import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthContext } from '../../contexts/AuthContext';
import { gastoService } from '../../services/gastoService';
import { cuotaService } from '../../services/cuotaService';
import { tarjetaService } from '../../services/tarjetaService';
import { recurrenciaService } from '../../services/recurrenciaService';
import SwipeableTransaction from '../../components/SwipeableTransaction';
import FloatingModal from '../../components/FloatingModal';
import ConfirmModal from '../../components/ConfirmModal';
import { formatDate as formatDateUtil, getRelativeTime } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import {
  getPrimeraCuotaFecha,
  proximoPagoTrasCuotasPagadas,
  fechaUltimaCuotaDesdePrimera,
  estimarCuotasPagadasPorCalendario,
  fechaCompraEsAnteriorAHoy,
  compraYPlazoCuotasCoherentes,
} from '../../utils/cuotaFechaUtils';
import { useTiposTransaccion } from '../../hooks/useTiposTransaccion';
import { useCuentas } from '../../hooks/useCuentas';
import { getIconComponent, ICON_KEYS_FOR_PICKER, normalizeIconKey } from '../../utils/iconRegistry';
import {
  PlusIcon,
  MinusIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowPathIcon,
  Bars3Icon,
  ShoppingCartIcon,
  TruckIcon,
  EllipsisHorizontalCircleIcon
} from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Valor sentinela en el select de cuenta: navega a /finanzas/cuentas y abre el modal nuevo.
const SELECT_CREAR_CUENTA = '__quantis_crear_cuenta__';

const GastosContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { tiposGasto, isLoading: isLoadingTipos, createTipoGasto, deleteTipoGasto } = useTiposTransaccion();
  const { cuentas: cuentasActivas, cuentaById } = useCuentas({ esActiva: 'true' });
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  const isDesktopModal = windowWidth >= 1280;
  const [sessionTiposGasto, setSessionTiposGasto] = useState([]);
  const [nuevaCategoriaGasto, setNuevaCategoriaGasto] = useState({ label: '', iconKey: 'ShoppingCartIcon' });
  const [isCreatingCategoriaGasto, setIsCreatingCategoriaGasto] = useState(false);
  const [tipoGastoToDelete, setTipoGastoToDelete] = useState(null);
  const [tarjetasCredito, setTarjetasCredito] = useState([]); // Tarjetas con corte y pago (para gasto en cuotas)
  const nuevaCategoriaBlockRef = useRef(null);
  const [gastos, setGastos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGasto, setEditingGasto] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [detalleGastoRecurrente, setDetalleGastoRecurrente] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const ITEMS_PER_PAGE_OPTIONS = [15, 30, 50];
  const modalScrollRef = useRef(null);
  const fechaFormInputRef = useRef(null);
  /** Si el modal se abrió desde Finanzas → Cuotas ("Nuevo plan"), al cancelar/cerrar volver a /finanzas/cuotas */
  const returnToCuotasAfterCloseRef = useRef(false);

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

  // Función para obtener el nombre de la categoría de gasto (3 por defecto + personalizadas)
  const getCategoriaGastoName = (categoria) => {
    const categorias = { alimentacion: 'Alimentación', transporte: 'Transporte', otros: 'Otros' };
    return categorias[categoria] || categoria;
  };

  // Estados del formulario (igual que Dashboard: Gasto | Gasto en cuotas)
  const [formData, setFormData] = useState({
    categoria: 'alimentacion',
    categoriaPersonalizada: '',
    monto: '',
    moneda: 'GTQ',
    fecha: getCurrentDate(),
    descripcion: '',
    esRecurrente: false,
    esCuota: false,
    esGastoEnCuotas: false,
    cuotasTotal: 3,
    cuotasPagadas: 0,
    tarjetaId: '',
    cuentaId: ''
  });
  
  // Crear refs para cada gasto
  const swipeRefs = useRef({});

  useEffect(() => {
    loadGastos(currentPage);
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Cargar tarjetas de crédito (corte y pago) para gasto en cuotas
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await tarjetaService.getTarjetas().catch(() => ({ data: { tarjetas: [] } }));
        const raw = res?.data?.tarjetas || res?.tarjetas || [];
        const conCortePago = raw.filter(t => t.tipo === 'credito' && t.esActiva !== false && t.diaPago != null && t.fechaCorte != null);
        if (!cancelled) setTarjetasCredito(conCortePago);
      } catch (_) {
        if (!cancelled) setTarjetasCredito([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Desde Cuotas "Nuevo plan": state.openCuotasPlanForm o ?cuotas=1 — abrir "Gasto en cuotas" y marcar regreso a /finanzas/cuotas al cerrar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromState = location.state?.openCuotasPlanForm === true;
    const fromQuery = params.get('cuotas') === '1';
    if (!fromState && !fromQuery) return;
    returnToCuotasAfterCloseRef.current = true;
    setFormData(prev => ({
      ...prev,
      esCuota: false,
      esGastoEnCuotas: true,
      cuotasTotal: 3,
      cuotasPagadas: 0,
      tarjetaId: prev.tarjetaId || ''
    }));
    setShowForm(true);
    setEditingGasto(null);
    setFormError(null);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.search, location.state?.openCuotasPlanForm, location.pathname, navigate]);

  // Desde calendario: mismo modal de detalle que al pulsar un gasto en la lista (no formulario de edición)
  useEffect(() => {
    const openGastoId = location.state?.openGastoId;
    if (!openGastoId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await gastoService.getGastoById(openGastoId);
        const gasto = data?.data?.gasto ?? data?.gasto ?? data;
        if (!cancelled && (gasto?._id || gasto?.id)) {
          setShowDetails(gasto);
          setFormError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Error al cargar el gasto');
      } finally {
        if (!cancelled) navigate(location.pathname, { replace: true, state: {} });
      }
    })();
    return () => { cancelled = true; };
  }, [location.state?.openGastoId, location.pathname, navigate]);

  useEffect(() => {
    const rid = location.state?.openGastoRecurrenteId;
    if (!rid) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await recurrenciaService.getGastoRecurrenteById(rid);
        const r = data?.data?.gastoRecurrente ?? data?.gastoRecurrente ?? data;
        if (!cancelled && r && (r._id || r.id)) {
          setDetalleGastoRecurrente(r);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'No se pudo cargar el gasto recurrente');
      } finally {
        if (!cancelled) navigate(location.pathname, { replace: true, state: {} });
      }
    })();
    return () => { cancelled = true; };
  }, [location.state?.openGastoRecurrenteId, location.pathname, navigate]);

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

  const pickDefaultCuenta = useCallback(
    (moneda) => {
      if (!user?.cuentaDefault) return '';
      const match = cuentasActivas.find(
        (c) => c._id === user.cuentaDefault && c.moneda === moneda
      );
      return match ? match._id : '';
    },
    [user?.cuentaDefault, cuentasActivas]
  );

  const loadGastos = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = { page, limit: itemsPerPage };
      const response = await gastoService.getGastos(params);
      const data = response?.data?.data ?? response?.data ?? response;
      setGastos(data?.gastos ?? []);
      setPagination(data?.pagination ?? null);
    } catch (error) {
      console.error('Error cargando gastos:', error);
      setError('Error al cargar los gastos');
    } finally {
      setIsLoading(false);
    }
  };

  const [formError, setFormError] = useState(null);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      setIsLoadingForm(true);

      // Gasto en cuotas: crear plan (igual que Dashboard)
      if (formData.esGastoEnCuotas && !editingGasto) {
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
        fechaVencimiento.setHours(23, 59, 59, 999);
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
        returnToCuotasAfterCloseRef.current = false;
        setShowForm(false);
        setEditingGasto(null);
        resetForm();
        loadGastos(currentPage);
        navigate('/finanzas/cuotas', { state: { expandTarjetaId: formData.tarjetaId } });
        return;
      }

      const dataToSend = {
        ...formData,
        categoria: formData.categoria === 'personalizado' ? formData.categoriaPersonalizada : formData.categoria
      };
      delete dataToSend.categoriaPersonalizada;
      delete dataToSend.esCuota;
      delete dataToSend.esGastoEnCuotas;
      delete dataToSend.cuotasTotal;
      delete dataToSend.cuotasPagadas;
      delete dataToSend.tarjetaId;
      if (!dataToSend.cuentaId) delete dataToSend.cuentaId;

      if (editingGasto) {
        await gastoService.updateGasto(editingGasto._id, dataToSend);
      } else {
        await gastoService.createGasto(dataToSend);
        if (formData.esRecurrente) {
          try {
            const fechaGasto = new Date(formData.fecha);
            const diaMes = fechaGasto.getDate();
            const categoriasEnum = ['alimentacion', 'transporte', 'vivienda', 'salud', 'entretenimiento', 'educacion', 'ropa', 'servicios', 'otros'];
            const categoriaRec = categoriasEnum.includes(dataToSend.categoria) ? dataToSend.categoria : 'otros';
            await recurrenciaService.createGastoRecurrente({
              nombre: `${getCategoriaGastoName(dataToSend.categoria)} - ${dataToSend.descripcion || 'Gasto recurrente'}`.substring(0, 100),
              monto: parseFloat(dataToSend.monto),
              moneda: dataToSend.moneda,
              frecuencia: 'mensual',
              diaPago: diaMes,
              fechaInicio: fechaGasto.toISOString(),
              descripcion: dataToSend.descripcion || '',
              categoria: categoriaRec,
              esActivo: true,
              ...(dataToSend.cuentaId ? { cuentaId: dataToSend.cuentaId } : {})
            });
          } catch (recurrenciaError) {
            console.error('Error creando gasto recurrente:', recurrenciaError);
          }
        }
      }
      
      setShowForm(false);
      setEditingGasto(null);
      resetForm();
      loadGastos(currentPage);
    } catch (err) {
      console.error('Error guardando gasto:', err);
      setFormError(err?.response?.data?.message || 'Error al guardar el gasto');
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleEdit = (gasto) => {
    modalScrollRef.current = window.scrollY ?? document.documentElement?.scrollTop ?? 0;
    setEditingGasto(gasto);
    const categoriasPredefinidas = ['alimentacion', 'transporte', 'otros'];
    const esPersonalizado = !categoriasPredefinidas.includes(gasto.categoria);
    setFormData({
      categoria: esPersonalizado ? (gasto.categoria || 'personalizado') : gasto.categoria,
      categoriaPersonalizada: esPersonalizado ? (gasto.categoria || '') : '',
      monto: gasto.monto.toString(),
      moneda: gasto.moneda,
      fecha: gasto.fecha ? gasto.fecha.split('T')[0] : getCurrentDate(),
      descripcion: gasto.descripcion || '',
      esRecurrente: gasto.esRecurrente || false,
      esCuota: false,
      esGastoEnCuotas: false,
      cuotasTotal: 3,
      cuotasPagadas: 0,
      tarjetaId: '',
      cuentaId: gasto.cuenta || ''
    });
    setShowForm(true);
  };

  const handleConfirmDeleteTipoGasto = async () => {
    if (!tipoGastoToDelete) return;
    try {
      if (tipoGastoToDelete.type === 'api' && tipoGastoToDelete.id != null) {
        await deleteTipoGasto(tipoGastoToDelete.id);
      } else if (tipoGastoToDelete.type === 'session') {
        setSessionTiposGasto(prev => prev.filter(s => s.sessionId !== tipoGastoToDelete.sessionId));
      }
      if (formData.categoria === (tipoGastoToDelete?.label ?? '')) {
        setFormData(prev => ({ ...prev, categoria: 'alimentacion', categoriaPersonalizada: '' }));
      }
    } catch (e) {
      console.error(e);
    }
    setTipoGastoToDelete(null);
  };

  const handleView = (gasto) => {
    modalScrollRef.current = window.scrollY ?? document.documentElement?.scrollTop ?? 0;
    setShowDetails(gasto);
  };

  const handleDuplicate = (gasto) => {
    modalScrollRef.current = window.scrollY ?? document.documentElement?.scrollTop ?? 0;
    const categoriasPredefinidas = ['alimentacion', 'transporte', 'otros'];
    const esPersonalizado = !categoriasPredefinidas.includes(gasto.categoria);
    setFormData({
      categoria: esPersonalizado ? 'personalizado' : gasto.categoria,
      categoriaPersonalizada: esPersonalizado ? gasto.categoria : '',
      monto: gasto.monto.toString(),
      moneda: gasto.moneda,
      fecha: getCurrentDate(),
      descripcion: `${gasto.descripcion || ''} (Copia)`,
      esRecurrente: false,
      esCuota: false,
      esGastoEnCuotas: false,
      cuotasTotal: 3,
      cuotasPagadas: 0,
      tarjetaId: '',
      cuentaId: gasto.cuenta || ''
    });
    setEditingGasto(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await gastoService.deleteGasto(id);
      setShowDeleteConfirm(null);
      loadGastos(currentPage);
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      setError('Error al eliminar el gasto');
    }
  };

  const confirmDelete = (gasto) => {
    modalScrollRef.current = window.scrollY ?? document.documentElement?.scrollTop ?? 0;
    setShowDeleteConfirm(gasto);
  };

  const resetForm = () => {
    setFormData({
      categoria: 'alimentacion',
      categoriaPersonalizada: '',
      monto: '',
      moneda: 'GTQ',
      fecha: getCurrentDate(),
      descripcion: '',
      esRecurrente: false,
      esCuota: false,
      esGastoEnCuotas: false,
      cuotasTotal: 3,
      cuotasPagadas: 0,
      tarjetaId: '',
      cuentaId: pickDefaultCuenta('GTQ')
    });
  };

  const cuentasParaMoneda = cuentasActivas.filter((c) => c.moneda === formData.moneda);

  // Tarjeta seleccionada para gasto en cuotas (igual que Dashboard)
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

  // Validación: deshabilitar Crear en modal Gasto (igual que Dashboard)
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
    return !formData.monto || montoNum <= 0 || sinCategoria || !formData.fecha;
  }, [
    formData.esGastoEnCuotas,
    formData.tarjetaId,
    formData.monto,
    formData.categoria,
    formData.categoriaPersonalizada,
    formData.fecha,
    formData.cuotasTotal,
    validacionPlazoCuotas.ok,
    tarjetasCredito.length,
  ]);

  const handleCancel = () => {
    setShowForm(false);
    setEditingGasto(null);
    setShowDetails(null);
    resetForm();
    if (returnToCuotasAfterCloseRef.current) {
      returnToCuotasAfterCloseRef.current = false;
      navigate('/finanzas/cuotas', { replace: true });
    }
  };

  const formatDate = (date) => {
    // Si la fecha viene en formato ISO (2025-10-15T00:00:00.000Z)
    if (typeof date === 'string' && date.includes('T')) {
      // Extraer solo la parte de la fecha (YYYY-MM-DD)
      const datePart = date.split('T')[0];
      const [year, month, day] = datePart.split('-');
      const localDate = new Date(year, month - 1, day); // month - 1 porque Date usa 0-indexado
      return localDate.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Si la fecha viene como string en formato YYYY-MM-DD
    if (typeof date === 'string' && date.includes('-') && !date.includes('T')) {
      const [year, month, day] = date.split('-');
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Para otros formatos, usar la fecha tal como viene
    return new Date(date).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Función para formatear el monto con símbolo de moneda
  const formatCurrencyInput = (amount, currency) => {
    if (!amount || amount === '') return '';
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '';
    
    // Formatear con 2 decimales
    const formattedAmount = numAmount.toFixed(2);
    
    // Agregar símbolo según la moneda
    if (currency === 'GTQ') {
      return `Q ${formattedAmount}`;
    } else if (currency === 'USD') {
      return `$ ${formattedAmount}`;
    }
    
    return formattedAmount;
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

  // Filtrar gastos solo por búsqueda: descripción, categoría y monto
  const searchNormalized = searchTerm.trim().toLowerCase();
  const filteredGastos = gastos.filter(gasto => {
    if (!searchNormalized) return true;
    const categoriaDisplay = getCategoriaGastoName(gasto.categoria);
    return (gasto.descripcion?.toLowerCase().includes(searchNormalized)) ||
           ((gasto.categoria || '').toLowerCase().includes(searchNormalized)) ||
           ((categoriaDisplay || '').toLowerCase().includes(searchNormalized)) ||
           (gasto.monto != null && String(gasto.monto).toLowerCase().includes(searchNormalized));
  });

  // Orden cronológico: más antiguo arriba; misma fecha → por número de cuota (1 antes que 2)
  const getCuotaNum = (g) => {
    const d = (g?.descripcion || '').trim();
    const m = d.match(/Pago de cuota\s+(\d+)\/(\d+)/i);
    return m ? parseInt(m[1], 10) : 0;
  };
  const sortedGastos = [...filteredGastos].sort((a, b) => {
    const da = new Date(a.fecha || 0).getTime();
    const db = new Date(b.fecha || 0).getTime();
    if (da !== db) return db - da; // más reciente arriba
    const na = getCuotaNum(a);
    const nb = getCuotaNum(b);
    if (na !== nb) return nb - na; // cuota mayor (más reciente) arriba
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-q-expense-muted border-t-q-expense mb-4" style={{ willChange: 'transform' }}></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando gastos...</p>
        </motion.div>
      </div>
    );
  }

  // Mismo formato que Dashboard: dd/mm/aa (ej. 11/12/25)
  const formatFechaShort = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!d || !m || !y) return dateStr;
    const yy = y.length >= 2 ? y.slice(-2) : y;
    return `${d}/${m}/${yy}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 scroll-container">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-8">
        {/* Cabecera - misma estética que Ingresos */}
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
              <button
                type="button"
                onClick={() => { resetForm(); setEditingGasto(null); setShowForm(true); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg bg-white dark:bg-gray-800 border border-q-expense-muted hover:border-q-expense hover:bg-q-expense-muted text-q-expense hover:text-q-expense text-sm font-medium shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-q-expense/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900 active:scale-[0.98]"
              >
                <PlusIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Nuevo gasto</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-q-expense/20 to-q-expense/5 dark:from-q-expense/30 dark:to-q-expense/15 flex items-center justify-center shadow-sm dark:shadow-inner">
                <CurrencyDollarIcon className="h-6 w-6 sm:h-7 sm:w-7 text-q-expense" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-q-expense mb-1">
                  Transacciones
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                  Gastos
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-300 leading-snug max-w-md">
                  Registra y revisa todo lo que sale de tu bolsillo.
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

        {/* Modal de formulario - misma estética que Ingresos */}
        <FloatingModal
          isOpen={showForm}
          onClose={handleCancel}
          size="md"
          showCloseButton={true}
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title={editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
          compactHeader={true}
        >
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* En PC: dos columnas (tipo+cuotas+categoría | monto+fecha+descripción); igual que Dashboard */}
              <div className={isDesktopModal ? 'grid grid-cols-2 gap-6 items-start' : 'space-y-6'}>
                <div className="space-y-6">
                  {/* Tipo de gasto - igual que Dashboard */}
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

                  {/* Si es gasto en cuotas: tarjeta + número de cuotas - igual que Dashboard */}
                  {formData.esGastoEnCuotas && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3">
                      {tarjetasCredito.length === 0 ? (
                        <div className="rounded-xl bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-4 text-sm">
                          <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Necesitas una tarjeta con corte y pago</p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">Para compras a cuotas configura una tarjeta de crédito con día de corte y día de pago.</p>
                          <button
                            type="button"
                            onClick={() => { setShowForm(false); resetForm(); navigate('/finanzas/cuotas', { state: { openNuevaTarjeta: true } }); }}
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

                  {/* Categoría de gasto - igual que Dashboard */}
                  {!formData.esCuota && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 ml-1">
                      Categoría de gasto
                    </label>
                    <div className={`${isDesktopModal ? 'grid grid-cols-2 gap-3' : 'flex gap-3 -mx-2 px-2 overflow-x-auto overflow-y-hidden'} ${!isDesktopModal ? 'flex-nowrap' : ''}`} style={!isDesktopModal ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}>
                      {[
                        { value: 'alimentacion', label: 'Alimentación', Icon: ShoppingCartIcon },
                        { value: 'transporte', label: 'Transporte', Icon: TruckIcon },
                        { value: 'otros', label: 'Otros', Icon: EllipsisHorizontalCircleIcon }
                      ].map(({ value, label, Icon }) => {
                        const isSelected = formData.categoria === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setFormData({ ...formData, categoria: value, categoriaPersonalizada: '' })}
                            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-colors touch-manipulation
                              ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'}
                              ${isSelected ? 'bg-q-expense-muted border-q-expense text-q-expense' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}
                            `}
                          >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-expense' : 'text-gray-500 dark:text-gray-400'}`} />
                            {label}
                          </button>
                        );
                      })}
                      {(tiposGasto || []).filter(t => (t.id != null || t._id != null) && !['alimentacion', 'transporte', 'otros'].includes((t.slug || '').toLowerCase())).map(cat => {
                        const value = cat.label || cat.slug;
                        const catId = cat.id ?? cat._id;
                        const Icon = getIconComponent(normalizeIconKey(cat.iconKey, 'ShoppingCartIcon'));
                        const isSelected = formData.categoria === value;
                        return (
                          <div key={catId ?? value} className={`flex items-center rounded-full border-2 min-w-0 ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'} ${isSelected ? 'bg-q-expense-muted border-q-expense' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
                            <button type="button" onClick={() => setFormData({ ...formData, categoria: value, categoriaPersonalizada: '' })} className="flex-1 min-w-0 inline-flex items-center gap-2 pl-4 pr-1 py-2.5 text-sm font-medium text-left transition-colors">
                              {Icon && <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-expense' : 'text-gray-500 dark:text-gray-400'}`} />}
                              <span className={`truncate ${isSelected ? 'text-q-expense' : 'text-gray-600 dark:text-gray-300'}`}>{cat.label}</span>
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setTipoGastoToDelete({ type: 'api', id: catId, label: cat.label }); }} className="flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-q-expense transition-colors mr-1 flex-shrink-0" aria-label="Eliminar categoría">
                              <TrashIcon className="w-4 h-4 block" />
                            </button>
                          </div>
                        );
                      })}
                      {sessionTiposGasto.map(t => {
                        const Icon = getIconComponent(normalizeIconKey(t.iconKey, 'ShoppingCartIcon'));
                        const isSelected = formData.categoria === t.label;
                        return (
                          <div key={t.sessionId} className={`flex items-center rounded-full border-2 min-w-0 ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'} ${isSelected ? 'bg-q-expense-muted border-q-expense' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
                            <button type="button" onClick={() => setFormData({ ...formData, categoria: t.label, categoriaPersonalizada: '' })} className="flex-1 min-w-0 inline-flex items-center gap-2 pl-4 pr-1 py-2.5 text-sm font-medium text-left transition-colors">
                              {Icon && <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-q-expense' : 'text-gray-500 dark:text-gray-400'}`} />}
                              <span className={`truncate ${isSelected ? 'text-q-expense' : 'text-gray-600 dark:text-gray-300'}`}>{t.label}</span>
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setTipoGastoToDelete({ type: 'session', sessionId: t.sessionId, label: t.label }); }} className="flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-q-expense transition-colors mr-1 flex-shrink-0" aria-label="Eliminar categoría">
                              <TrashIcon className="w-4 h-4 block" />
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => { setIsCreatingCategoriaGasto(true); setNuevaCategoriaGasto({ label: '', iconKey: 'ShoppingCartIcon' }); setFormData({ ...formData, categoria: 'personalizado', categoriaPersonalizada: '' }); setFormError(null); }}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 font-medium touch-manipulation ${isDesktopModal ? 'w-full' : 'flex-shrink-0 min-w-[140px]'}`}
                      >
                        <PlusIcon className="w-5 h-5 flex-shrink-0" />
                        Nuevo
                      </button>
                    </div>
                    {isLoadingTipos && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando categorías...</p>}
                  </div>
                  )}
                </div>

                {/* Columna derecha: Monto, Fecha, Recurrente, Descripción - igual que Dashboard */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 ml-1">
                      {formData.esGastoEnCuotas ? 'Monto total' : 'Monto'}
                    </label>
                    <div className="flex items-baseline gap-2">
                      <button type="button" onClick={() => {
                        const newMoneda = formData.moneda === 'GTQ' ? 'USD' : 'GTQ';
                        setFormData({
                          ...formData,
                          moneda: newMoneda,
                          cuentaId: pickDefaultCuenta(newMoneda)
                        });
                      }} className="text-3xl font-bold text-q-expense flex-shrink-0" title={formData.moneda === 'GTQ' ? 'Cambiar a USD' : 'Cambiar a GTQ'}>
                        {formData.moneda === 'GTQ' ? 'Q' : '$'}
                      </button>
                      <input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={formData.monto} onChange={handleMontoChange} onBlur={handleMontoBlur} className="flex-1 min-w-0 bg-transparent border-none p-0 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:ring-0 focus:outline-none touch-manipulation" placeholder="0.00" required autoComplete="off" />
                    </div>
                  </div>
                  {!formData.esGastoEnCuotas && (
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-q-expense min-h-[48px]"
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
                          className="text-xs text-q-expense hover:underline"
                        >
                          {cuentasParaMoneda.length === 0 ? 'Crear cuenta nueva' : 'Gestionar cuentas'}
                        </Link>
                      </p>
                    </div>
                  )}
                  {/* Fecha y Recurrente: grid 2 cols solo cuando no es gasto en cuotas - igual que Dashboard */}
                  <div className={(!formData.esCuota && !formData.esGastoEnCuotas) ? 'grid grid-cols-2 gap-4' : ''}>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                        {formData.esGastoEnCuotas ? 'Fecha de compra' : 'Fecha'}
                      </label>
                      <div
                        className="relative flex items-center gap-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 h-[48px] cursor-pointer"
                        onClick={() => { fechaFormInputRef.current?.showPicker?.(); fechaFormInputRef.current?.focus(); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fechaFormInputRef.current?.showPicker?.(); fechaFormInputRef.current?.focus(); } }}
                        aria-label="Seleccionar fecha"
                      >
                        <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 pointer-events-none" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 pointer-events-none">{formatFechaShort(formData.fecha)}</span>
                        <input ref={fechaFormInputRef} type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required aria-hidden />
                      </div>
                    </div>
                    {!formData.esCuota && !formData.esGastoEnCuotas && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Recurrente</label>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 h-[48px]">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mensual</span>
                          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input type="checkbox" checked={formData.esRecurrente} onChange={() => setFormData({ ...formData, esRecurrente: !formData.esRecurrente })} className="sr-only peer" />
                            <div className="relative w-9 h-5 flex-shrink-0 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-q-expense after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-4" />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">
                      {formData.esGastoEnCuotas ? 'Nombre de lo que compraste' : 'Descripción (opcional)'}
                    </label>
                    <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 focus-within:border-q-expense/50 transition-colors">
                      <Bars3Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                      <textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none p-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-0 focus:outline-none resize-none" rows={2} placeholder={formData.esGastoEnCuotas ? 'Ej. TV, laptop, mueble...' : 'Descripción del gasto...'} autoComplete="off" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nueva categoría: igual que Dashboard */}
              {formData.categoria === 'personalizado' && (
                <div ref={nuevaCategoriaBlockRef} className={`rounded-xl border border-q-expense-muted bg-q-expense-muted/50 dark:bg-q-expense-muted/20 p-4 w-full min-w-0 ${isDesktopModal ? 'col-span-2' : 'mt-3'} ${isDesktopModal ? 'flex flex-col' : 'space-y-4'}`}>
                  <div className="flex items-center justify-between gap-3 w-full flex-shrink-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate min-w-0">Nueva categoría</span>
                    <button type="button" onClick={() => { setIsCreatingCategoriaGasto(false); setNuevaCategoriaGasto({ label: '', iconKey: 'ShoppingCartIcon' }); setFormData({ ...formData, categoria: 'alimentacion', categoriaPersonalizada: '' }); setFormError(null); }} className="text-sm font-medium text-q-expense hover:underline flex-shrink-0">Volver</button>
                  </div>
                  <div className={isDesktopModal ? 'grid gap-4 items-start w-full min-w-0' : 'space-y-4 w-full'} style={isDesktopModal ? { gridTemplateColumns: 'minmax(0, 240px) 1fr' } : undefined}>
                    <div className="min-w-0 space-y-4 w-full">
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                        <input type="text" value={formData.categoriaPersonalizada} onChange={(e) => setFormData({ ...formData, categoriaPersonalizada: e.target.value })} className={`w-full px-4 py-3 text-base border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-q-expense min-h-[44px] ${isDesktopModal ? 'max-w-[220px]' : ''}`} placeholder="Ej. Supermercado" autoComplete="off" />
                      </div>
                      {formError && <p className="text-sm text-q-expense">{formError}</p>}
                      <div className={`flex flex-row flex-nowrap gap-2 ${isDesktopModal ? 'justify-start' : 'w-full'}`}>
                        <button type="button" disabled={!formData.categoriaPersonalizada?.trim()} onClick={() => { const label = formData.categoriaPersonalizada.trim(); const iconKey = normalizeIconKey(nuevaCategoriaGasto.iconKey, 'ShoppingCartIcon'); setSessionTiposGasto(prev => [...prev, { label, iconKey, sessionId: `session-gasto-${Date.now()}-${label}` }]); setFormData({ ...formData, categoria: label, categoriaPersonalizada: label }); setIsCreatingCategoriaGasto(false); setFormError(null); }} className={`px-4 py-2.5 text-sm font-medium rounded-xl border border-q-expense text-q-expense-muted bg-transparent hover:bg-q-expense-muted min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${!isDesktopModal ? 'flex-1 min-w-0' : ''}`}>Utilizar una vez</button>
                        <button type="button" disabled={!formData.categoriaPersonalizada?.trim() || isLoadingTipos} onClick={async () => { setFormError(null); try { const iconKey = normalizeIconKey(nuevaCategoriaGasto.iconKey, 'ShoppingCartIcon'); const created = await createTipoGasto({ label: formData.categoriaPersonalizada.trim(), iconKey }); if (created?.label) { setFormData({ ...formData, categoria: created.label, categoriaPersonalizada: created.label }); setIsCreatingCategoriaGasto(false); setFormError(null); } } catch (err) { setFormError(err?.response?.data?.message || 'No se pudo crear. Revisa el nombre o intenta de nuevo.'); } }} className={`px-5 py-2.5 text-sm font-medium rounded-xl bg-q-expense text-white hover:bg-q-expense min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${!isDesktopModal ? 'flex-1 min-w-0' : ''}`}>Guardar</button>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icono</label>
                      <div className={`grid gap-2 overflow-y-auto overflow-x-hidden py-1 ${isDesktopModal ? 'grid-cols-[repeat(auto-fill,minmax(40px,1fr))] max-h-[160px]' : 'grid-cols-5 sm:grid-cols-6 max-h-[200px]'}`}>
                        {ICON_KEYS_FOR_PICKER.map(iconKey => {
                          const Icon = getIconComponent(iconKey);
                          const selected = normalizeIconKey(nuevaCategoriaGasto.iconKey, 'ShoppingCartIcon') === iconKey;
                          return (
                            <button key={iconKey} type="button" onClick={() => setNuevaCategoriaGasto(prev => ({ ...prev, iconKey }))} className={`flex items-center justify-center min-h-[40px] min-w-[40px] rounded-xl border transition-colors touch-manipulation ${selected ? 'bg-q-expense-muted border-q-expense text-q-expense' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`} aria-label={iconKey}>
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
                <div className="bg-q-expense-muted border border-q-expense-muted text-q-expense px-4 py-3 rounded-xl text-sm">{formError}</div>
              )}

              <div className={`mt-8 flex gap-3 ${isDesktopModal ? 'flex-row justify-end' : 'flex-col gap-4'}`}>
                {isDesktopModal && (
                  <button type="button" onClick={handleCancel} className="py-2.5 px-4 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Cancelar</button>
                )}
                <button type="submit" disabled={isLoadingForm || gastoInvalido} className={`font-bold text-white bg-q-expense hover:bg-q-expense rounded-2xl shadow-lg shadow-[0_10px_15px_-3px_rgba(239,68,68,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation ${isDesktopModal ? 'py-2.5 px-5' : 'w-full py-4'}`}>
                  {isLoadingForm
                    ? (formData.esGastoEnCuotas ? 'Creando plan...' : (editingGasto ? 'Guardando...' : 'Creando...'))
                    : (editingGasto ? 'Actualizar' : (formData.esGastoEnCuotas ? 'Crear plan de cuotas' : 'Crear Gasto'))}
                </button>
                {!isDesktopModal && (
                  <button type="button" onClick={handleCancel} className="w-full py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation">Cancelar</button>
                )}
              </div>
            </form>
          </div>
        </FloatingModal>

        <ConfirmModal isOpen={!!tipoGastoToDelete} onClose={() => setTipoGastoToDelete(null)} onConfirm={handleConfirmDeleteTipoGasto} title="Eliminar categoría" message={tipoGastoToDelete ? `¿Seguro que deseas eliminar ${tipoGastoToDelete.label}?` : ''} confirmText="Eliminar" cancelText="Cancelar" variant="danger" elevated />

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
                placeholder="Buscar gastos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-q-expense focus:bg-white dark:focus:bg-gray-800 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-base min-h-[48px]"
              />
            </div>
          </div>

        </motion.div>

        {/* Lista de gastos - misma estética que Ingresos */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Gastos</h2>
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/80 overflow-hidden">
            {sortedGastos.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
                {sortedGastos.map((gasto) => {
                  if (!swipeRefs.current[gasto._id]) swipeRefs.current[gasto._id] = React.createRef();
                  const label = (gasto.descripcion || '').trim() || getCategoriaGastoName(gasto.categoria);
                  const cuentaNombreG = gasto.cuenta
                    ? cuentaById(gasto.cuenta)?.nombre || null
                    : null;
                  const subline = [
                    formatDate(gasto.fecha),
                    (gasto.descripcion || '').trim() ? getCategoriaGastoName(gasto.categoria) : null,
                    gasto.esRecurrente ? 'Recurrente' : null,
                    cuentaNombreG
                  ].filter(Boolean).join(' · ');
                  return (
                    <li key={gasto._id}>
                      <SwipeableTransaction
                        ref={swipeRefs.current[gasto._id]}
                        onEdit={() => handleEdit(gasto)}
                        onDelete={() => confirmDelete(gasto)}
                        onView={() => handleView(gasto)}
                        onDuplicate={() => handleDuplicate(gasto)}
                        className="rounded-none border-0"
                        editColor="text-q-primary hover:text-q-primary"
                        deleteColor="text-q-expense hover:text-q-expense"
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handleView(gasto)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleView(gasto); } }}
                          className="w-full flex items-center gap-3 py-3.5 pl-4 pr-0 text-left hover:bg-gray-100/80 dark:hover:bg-gray-700/40 active:bg-gray-200/80 dark:active:bg-gray-700/60 transition-colors touch-manipulation cursor-pointer"
                        >
                          <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-q-expense-muted text-q-expense">
                            <CurrencyDollarIcon className="w-5 h-5" aria-hidden />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                              {label}
                              {gasto.esRecurrente && (
                                <span className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-q-expense/10 text-q-expense" title="Recurrente (mismo día cada mes)">
                                  <ArrowPathIcon className="w-3.5 h-3.5" aria-hidden />
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subline}</p>
                          </div>
                          <div className="flex-shrink-0 ml-auto flex items-center gap-2 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-semibold tabular-nums text-q-expense">-{formatCurrency(gasto.monto, gasto.moneda)}</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{gasto.moneda}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); swipeRefs.current[gasto._id]?.current?.toggleSwipe(); }}
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
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No hay gastos registrados</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm
                    ? 'No se encontraron gastos con ese criterio'
                    : 'Comienza registrando tu primer gasto'}
                </p>
              </motion.div>
            )}
            {sortedGastos.length > 0 && pagination && pagination.totalItems > 15 && (
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
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-q-expense-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium min-h-[36px]"
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
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-q-expense-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium min-h-[36px]"
                    aria-label="Página siguiente"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Modal de detalles - misma estética que Ingresos */}
        <FloatingModal
          isOpen={!!showDetails}
          onClose={() => setShowDetails(null)}
          size="md"
          showCloseButton={true}
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Detalles del gasto"
          compactHeader={true}
        >
          {showDetails && (() => {
            const g = showDetails;
            const descripcionUtil = (g.descripcion || '').trim();
            const esPagoCuota = descripcionUtil.startsWith('Pago de cuota ') || descripcionUtil.startsWith('Pago completo (');
            const planNamePagoCuota = esPagoCuota && descripcionUtil.includes(' - ')
              ? descripcionUtil.split(' - ').map(p => p.trim()).filter(Boolean)[1] || 'Plan de cuotas'
              : null;
            const cuotaMatch = descripcionUtil.match(/Pago de cuota\s+(\d+)\/(\d+)/i);
            const pagoCompletoMatch = descripcionUtil.match(/Pago completo\s*\((\d+)\s*cuotas\)/i);
            const textoConceptoCuota = planNamePagoCuota && (cuotaMatch
              ? `Pago de cuota ${cuotaMatch[1]} de ${cuotaMatch[2]} de ${planNamePagoCuota}`
              : pagoCompletoMatch
                ? `Pago completo (${pagoCompletoMatch[1]} cuotas) de ${planNamePagoCuota}`
                : `Pago de cuota de ${planNamePagoCuota}`);
            const label = esPagoCuota && planNamePagoCuota
              ? `Pago de cuota - ${planNamePagoCuota}`
              : (descripcionUtil || getCategoriaGastoName(g.categoria));
            const mostrarDescripcion = descripcionUtil && !esPagoCuota && descripcionUtil !== label;
            const DetailRow = ({ label: rowLabel, value, className = '' }) =>
              value != null && value !== '' ? (
                <div className={`flex justify-between items-center gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0 ${className}`}>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">{rowLabel}</span>
                  <span className="text-sm text-gray-900 dark:text-white text-right break-words min-w-0">{value}</span>
                </div>
              ) : null;
            return (
              <div className={isDesktopModal ? 'pt-3 px-6 pb-6 sm:pt-4 sm:px-8 sm:pb-8 max-w-2xl mx-auto' : 'pt-2 px-4 pb-6 sm:px-6'}>
                <div className="flex items-center gap-4 p-4 rounded-2xl mb-4 bg-q-expense-muted/60 dark:bg-q-expense-muted/30">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 bg-q-expense/15 text-q-expense">
                    <CurrencyDollarIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-q-expense">Gasto</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{label}</p>
                    <p className="text-xl font-bold text-q-expense">-{formatCurrency(g.monto, g.moneda)}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden text-sm">
                  <div className="px-4">
                    {esPagoCuota && textoConceptoCuota && (
                      <DetailRow label="Concepto" value={textoConceptoCuota} />
                    )}
                    <DetailRow label="Categoría" value={getCategoriaGastoName(g.categoria)} />
                    <DetailRow label="Fecha" value={g.fecha ? formatDateUtil(g.fecha, "EEEE d 'de' MMMM, yyyy") : null} />
                    {g.esRecurrente && <DetailRow label="Recurrencia" value="Se repite cada mes (mismo día)" />}
                    {g.createdAt && <DetailRow label="Registrado" value={getRelativeTime(g.createdAt)} />}
                    <DetailRow label="Moneda" value={g.moneda || 'GTQ'} />
                    {g.cuenta && (
                      <DetailRow
                        label="Cuenta"
                        value={cuentaById(g.cuenta)?.nombre || g.cuenta}
                      />
                    )}
                  </div>
                </div>
                {mostrarDescripcion && (
                  <div className="mt-4 p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Notas</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{g.descripcion}</p>
                  </div>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowDetails(null); handleEdit(g); }}
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDetails(null); confirmDelete(g); }}
                    className="flex-1 rounded-xl bg-q-expense-muted py-3 text-sm font-semibold text-q-expense hover:opacity-80 transition-opacity"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })()}
        </FloatingModal>

        <FloatingModal
          isOpen={!!detalleGastoRecurrente}
          onClose={() => setDetalleGastoRecurrente(null)}
          size="md"
          showCloseButton
          showDragHandle={!isDesktopModal}
          closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
          bottomSheet={!isDesktopModal}
          title="Gasto recurrente"
          compactHeader
        >
          {detalleGastoRecurrente && (() => {
            const r = detalleGastoRecurrente;
            return (
              <div className={isDesktopModal ? 'pt-3 px-6 pb-6 sm:pt-4 sm:px-8 sm:pb-8 max-w-2xl mx-auto' : 'pt-2 px-4 pb-6 sm:px-6'}>
                <div className="flex items-center gap-4 p-4 rounded-2xl mb-4 bg-q-expense-muted/60 dark:bg-q-expense-muted/30">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 bg-q-expense/15 text-q-expense">
                    <ArrowPathIcon className="w-6 h-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-q-expense">Recurrente</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{r.nombre || 'Gasto recurrente'}</p>
                    <p className="text-xl font-bold text-q-expense">−{formatCurrency(r.monto, r.moneda)}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden text-sm px-4 py-2 space-y-2">
                  {r.categoria && <div className="flex justify-between gap-4 py-1"><span className="text-gray-500 dark:text-gray-400">Categoría</span><span className="text-gray-900 dark:text-white text-right">{getCategoriaGastoName(r.categoria)}</span></div>}
                  <div className="flex justify-between gap-4 py-1"><span className="text-gray-500 dark:text-gray-400">Frecuencia</span><span className="text-gray-900 dark:text-white text-right">{r.frecuencia || '—'}</span></div>
                  {r.diaPago != null && <div className="flex justify-between gap-4 py-1"><span className="text-gray-500 dark:text-gray-400">Día</span><span className="text-gray-900 dark:text-white">{r.diaPago}</span></div>}
                  {r.fechaInicio && <div className="flex justify-between gap-4 py-1"><span className="text-gray-500 dark:text-gray-400">Inicio</span><span className="text-gray-900 dark:text-white">{formatDateUtil(r.fechaInicio, 'd MMM yyyy')}</span></div>}
                  <div className="flex justify-between gap-4 py-1"><span className="text-gray-500 dark:text-gray-400">Activo</span><span className="text-gray-900 dark:text-white">{r.esActivo !== false ? 'Sí' : 'No'}</span></div>
                </div>
              </div>
            );
          })()}
        </FloatingModal>

        <ConfirmModal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm._id)}
          title="¿Eliminar gasto?"
          message={showDeleteConfirm
            ? `Se eliminará: ${getCategoriaGastoName(showDeleteConfirm.categoria)} — -${formatCurrency(showDeleteConfirm.monto, showDeleteConfirm.moneda)}. Esta acción no se puede deshacer.`
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

export default GastosContent;
