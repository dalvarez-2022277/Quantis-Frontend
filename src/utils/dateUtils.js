import { format, formatDistanceToNow, differenceInDays, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Utilidades para manejo de fechas
 */

/**
 * Convierte a Date interpretando la parte de calendario (YYYY-MM-DD) como
 * medianoche LOCAL, no UTC. El backend guarda fechas de calendario (gasto,
 * ingreso, cuota, etc.) como medianoche UTC; parsearlas con `parseISO`/`new
 * Date(str)` y luego formatear en una zona horaria detrás de UTC (p. ej.
 * America/Guatemala, UTC-6) las corre un día hacia atrás. Esta función evita
 * ese desfase leyendo año/mes/día directamente del string.
 * @param {Date|string} date
 * @returns {Date}
 */
export const parseDateOnly = (date) => {
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }
  return parseISO(date);
};

/**
 * Formatear fecha para mostrar
 * @param {Date|string} date - Fecha a formatear
 * @param {string} formatStr - Formato deseado (default: 'dd/MM/yyyy')
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  try {
    const dateObj = parseDateOnly(date);
    return format(dateObj, formatStr, { locale: es });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '';
  }
};

/**
 * Formatear fecha para mostrar con hora
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada con hora
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Formatear fecha en formato corto (ej: "15 Ene")
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada corta
 */
export const formatDateShort = (date) => {
  return formatDate(date, 'dd MMM');
};

/**
 * Formatear fecha en formato largo (ej: "15 de Enero de 2025")
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada larga
 */
export const formatDateLong = (date) => {
  return formatDate(date, "dd 'de' MMMM 'de' yyyy");
};

/**
 * Calcular días hasta una fecha
 * @param {Date|string} date - Fecha objetivo
 * @returns {number} Días hasta la fecha (negativo si ya pasó)
 */
export const daysUntil = (date) => {
  if (!date) return null;
  try {
    const dateObj = parseDateOnly(date);
    return differenceInDays(dateObj, new Date());
  } catch (error) {
    console.error('Error calculando días hasta fecha:', error);
    return null;
  }
};

/**
 * Obtener tiempo relativo (ej: "hace 2 días", "en 3 días")
 * @param {Date|string} date - Fecha
 * @returns {string} Tiempo relativo
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  try {
    const dateObj = parseDateOnly(date);
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
  } catch (error) {
    console.error('Error obteniendo tiempo relativo:', error);
    return '';
  }
};

/**
 * Obtener primer día del mes
 * @param {Date|string} date - Fecha
 * @returns {Date} Primer día del mes
 */
export const getStartOfMonth = (date) => {
  const dateObj = parseDateOnly(date);
  return startOfMonth(dateObj);
};

/**
 * Obtener último día del mes
 * @param {Date|string} date - Fecha
 * @returns {Date} Último día del mes
 */
export const getEndOfMonth = (date) => {
  const dateObj = parseDateOnly(date);
  return endOfMonth(dateObj);
};

/**
 * Agregar meses a una fecha
 * @param {Date|string} date - Fecha base
 * @param {number} months - Número de meses a agregar
 * @returns {Date} Nueva fecha
 */
export const addMonthsToDate = (date, months) => {
  const dateObj = parseDateOnly(date);
  return addMonths(dateObj, months);
};

/**
 * Restar meses a una fecha
 * @param {Date|string} date - Fecha base
 * @param {number} months - Número de meses a restar
 * @returns {Date} Nueva fecha
 */
export const subMonthsFromDate = (date, months) => {
  const dateObj = parseDateOnly(date);
  return subMonths(dateObj, months);
};

/**
 * Obtener nombre del mes en español
 * @param {number} month - Número del mes (1-12)
 * @returns {string} Nombre del mes
 */
export const getMonthName = (month) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1] || '';
};

/** Abreviatura corta del mes (UI compacta: pill, filtros). */
export const getMonthNameShort = (month) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return months[month - 1] || '';
};

/**
 * Obtener nombre del día de la semana en español
 * @param {number} day - Número del día (0-6, donde 0 es domingo)
 * @returns {string} Nombre del día
 */
export const getDayName = (day) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[day] || '';
};

/**
 * Verificar si una fecha es hoy
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean} True si es hoy
 */
export const isToday = (date) => {
  if (!date) return false;
  const dateObj = parseDateOnly(date);
  const today = new Date();
  return format(dateObj, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
};

/**
 * Verificar si una fecha está en el pasado
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean} True si está en el pasado
 */
export const isPast = (date) => {
  if (!date) return false;
  const dateObj = parseDateOnly(date);
  return dateObj < new Date();
};

/**
 * Verificar si una fecha está en el futuro
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean} True si está en el futuro
 */
export const isFuture = (date) => {
  if (!date) return false;
  const dateObj = parseDateOnly(date);
  return dateObj > new Date();
};

/**
 * Obtener rango de fechas del mes actual
 * @returns {Object} { inicio, fin }
 */
export const getCurrentMonthRange = () => {
  const today = new Date();
  return {
    inicio: getStartOfMonth(today),
    fin: getEndOfMonth(today)
  };
};

/**
 * Formatear fecha para input type="date"
 * @param {Date|string} date - Fecha
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  try {
    const dateObj = parseDateOnly(date);
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formateando fecha para input:', error);
    return '';
  }
};
