/**
 * Fechas de planes de cuotas (alineado con Quantis-Backend/utils/fechaUtils.js)
 */

/**
 * Primera cuota según fecha de compra y día de pago de la tarjeta (mes siguiente al de la compra).
 */
export function getPrimeraCuotaFecha(fechaCompraStr, diaPago) {
  if (!fechaCompraStr || !diaPago) return null;
  // `new Date("YYYY-MM-DD")` parsea como medianoche UTC; en zonas detrás de UTC
  // (p. ej. America/Guatemala) eso corre la fecha un día hacia atrás al leer
  // año/mes/día. Se parsea al mediodía para evitar cruzar la medianoche local.
  const f = new Date(`${fechaCompraStr}T12:00:00`);
  f.setHours(0, 0, 0, 0);
  f.setMonth(f.getMonth() + 1);
  const lastDay = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate();
  f.setDate(Math.min(diaPago, lastDay));
  return f;
}

/** True si la fecha de compra (YYYY-MM-DD) es estrictamente anterior a hoy (día local). */
export function fechaCompraEsAnteriorAHoy(fechaCompraStr, hoy = new Date()) {
  if (!fechaCompraStr) return false;
  const d = new Date(`${fechaCompraStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date(hoy);
  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < t;
}

/**
 * Alinea una fecha al día de pago configurado en la tarjeta (mismo mes/año).
 * Así la 1.ª cuota queda siempre el día de pago (p. ej. el 9), no el día que eligió el usuario por error.
 */
export function snapFechaAlDiaPagoTarjeta(fecha, diaPago) {
  if (fecha == null || diaPago == null) return fecha != null ? new Date(fecha) : null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = d.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const day = Math.min(Math.max(1, Number(diaPago)), lastDay);
  return new Date(y, m, day);
}

/**
 * Estima cuántas cuotas del plan ya "vencieron" antes de hoy (inicio del día local):
 * cuenta fechas de pago mensuales desde la 1.ª cuota; no cuenta el vencimiento de hoy ni futuros.
 * Máximo: cuotasTotal - 1.
 */
export function estimarCuotasPagadasPorCalendario(fechaPrimera, hoy = new Date(), cuotasTotal, frecuencia = 'mensual') {
  const total = Math.max(1, Math.floor(Number(cuotasTotal) || 1));
  const max = Math.max(0, total - 1);
  if (max <= 0) return 0;
  const todayStart = new Date(hoy);
  todayStart.setHours(0, 0, 0, 0);
  let due = new Date(fechaPrimera);
  due.setHours(0, 0, 0, 0);
  if (Number.isNaN(due.getTime())) return 0;
  let count = 0;
  while (count < max) {
    if (due >= todayStart) break;
    count++;
    due = calcularProximaFecha(due, frecuencia);
  }
  return count;
}

/**
 * Primer día de mes `diaPago` (o el último del mes si no existe) en o después de fechaRef.
 */
export function proximoDiaPagoDesde(fechaRefStr, diaPago) {
  if (!fechaRefStr || diaPago == null) return null;
  const d = new Date(`${fechaRefStr}T12:00:00`);
  d.setHours(0, 0, 0, 0);
  let y = d.getFullYear();
  let m = d.getMonth();
  const dayStart = d.getDate();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const target = Math.min(diaPago, lastDay);
  if (target >= dayStart) {
    return new Date(y, m, target);
  }
  const m2 = m + 1;
  const y2 = y + Math.floor(m2 / 12);
  const mNorm = ((m2 % 12) + 12) % 12;
  const last2 = new Date(y2, mNorm + 1, 0).getDate();
  return new Date(y2, mNorm, Math.min(diaPago, last2));
}

/**
 * Igual que backend: siguiente fecha según frecuencia (2 args como pagarCuota).
 */
export function calcularProximaFecha(fechaBase, frecuencia, diaPago = null, diaSemana = null) {
  const fecha = new Date(fechaBase);
  fecha.setHours(0, 0, 0, 0);

  switch (frecuencia) {
    case 'diario':
      fecha.setDate(fecha.getDate() + 1);
      break;
    case 'semanal':
      if (diaSemana !== null) {
        const diasHastaProximo = (diaSemana - fecha.getDay() + 7) % 7;
        fecha.setDate(fecha.getDate() + (diasHastaProximo === 0 ? 7 : diasHastaProximo));
      } else {
        fecha.setDate(fecha.getDate() + 7);
      }
      break;
    case 'quincenal':
      fecha.setDate(fecha.getDate() + 15);
      break;
    case 'mensual':
      if (diaPago !== null) {
        fecha.setMonth(fecha.getMonth() + 1);
        fecha.setDate(diaPago);
        if (fecha.getDate() !== diaPago) {
          fecha.setDate(0);
        }
      } else {
        fecha.setMonth(fecha.getMonth() + 1);
      }
      break;
    case 'trimestral':
      if (diaPago !== null) {
        fecha.setMonth(fecha.getMonth() + 3);
        fecha.setDate(diaPago);
        if (fecha.getDate() !== diaPago) {
          fecha.setDate(0);
        }
      } else {
        fecha.setMonth(fecha.getMonth() + 3);
      }
      break;
    case 'anual':
      if (diaPago !== null) {
        fecha.setFullYear(fecha.getFullYear() + 1);
        fecha.setDate(diaPago);
        if (fecha.getDate() !== diaPago) {
          fecha.setDate(0);
        }
      } else {
        fecha.setFullYear(fecha.getFullYear() + 1);
      }
      break;
    default:
      fecha.setMonth(fecha.getMonth() + 1);
  }

  return fecha;
}

/**
 * Fecha del próximo pago tras N cuotas ya abonadas (misma semántica que pagarCuota + calcularProximaFecha).
 * N=0 → la 1.ª cuota aún no pagada coincide con fechaPrimera.
 */
export function proximoPagoTrasCuotasPagadas(fechaPrimera, cuotasPagadas, frecuencia = 'mensual') {
  const n = Math.max(0, Math.floor(Number(cuotasPagadas) || 0));
  let cursor = new Date(fechaPrimera);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    cursor = calcularProximaFecha(cursor, frecuencia);
  }
  return cursor;
}

/**
 * Fecha de la última cuota del plan (1.ª + avances hasta completar cuotasTotal).
 */
export function fechaUltimaCuotaDesdePrimera(fechaPrimera, cuotasTotal, frecuencia = 'mensual') {
  const total = Math.max(1, Math.floor(Number(cuotasTotal) || 1));
  if (total <= 1) {
    const d = new Date(fechaPrimera);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  let cursor = new Date(fechaPrimera);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < total - 1; i++) {
    cursor = calcularProximaFecha(cursor, frecuencia);
  }
  return cursor;
}

/**
 * Comprueba que la última cuota del plan (1.ª desde compra + tarjeta, luego N−1 avances mensuales)
 * no sea anterior al inicio del día de hoy. Evita datos imposibles (ej. compra hace años con 3 cuotas).
 */
export function compraYPlazoCuotasCoherentes(
  fechaCompraStr,
  diaPago,
  cuotasTotal,
  frecuencia = 'mensual',
  hoy = new Date()
) {
  const primera = getPrimeraCuotaFecha(fechaCompraStr, diaPago);
  if (!primera) return { ok: false, motivo: 'sin_primera' };
  const fi = new Date(primera);
  fi.setHours(0, 0, 0, 0);
  const ultima = fechaUltimaCuotaDesdePrimera(fi, cuotasTotal, frecuencia);
  ultima.setHours(0, 0, 0, 0);
  const inicioHoy = new Date(hoy);
  inicioHoy.setHours(0, 0, 0, 0);
  if (ultima < inicioHoy) return { ok: false, motivo: 'plan_ya_terminado', ultima };
  return { ok: true, ultima };
}

/** Última fecha de la serie: `restantes` pagos desde proximoPago (inclusive). */
export function fechaUltimaCuotaDesdeProximo(proximoStr, frecuencia, restantes) {
  if (!proximoStr || restantes <= 0) return null;
  let cursor = new Date(`${proximoStr}T12:00:00`);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < restantes - 1; i++) {
    cursor = calcularProximaFecha(cursor, frecuencia);
  }
  return cursor;
}
