import { useEffect, useRef } from 'react';
import { cuotaService } from '../services/cuotaService';
import { prestamoService } from '../services/prestamoService';
import { formatCurrency } from '../utils/currencyUtils';

const DIAS_AVISO = 3;

/**
 * Revisa cuotas y préstamos próximos a vencer (o ya vencidos) y los agrega
 * al centro de notificaciones. El centro de notificaciones ya existía en la
 * UI pero nunca recibía avisos reales de vencimientos — esta es la fuente
 * de datos que le faltaba.
 *
 * Deduplicado por `id + fecha de vencimiento actual`: mientras la cuota no
 * se pague (y por tanto su próximo vencimiento no avance), no se repite el
 * aviso en cada visita; en cuanto se paga y avanza a la siguiente fecha, se
 * genera un aviso nuevo para esa fecha.
 */
export function useDueReminders(isAuthenticated, notifications, existingNotifications) {
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || checkedRef.current) return;
    checkedRef.current = true;

    const yaAvisado = (id) =>
      (existingNotifications || []).some((n) => n.id === `due-${id}`);

    const run = async () => {
      try {
        const [cuotasRes, prestamosRes] = await Promise.all([
          cuotaService.getProximasCuotas(DIAS_AVISO).catch(() => ({ cuotas: [] })),
          prestamoService.getPrestamos({ estado: 'activo' }).catch(() => ({ prestamos: [] }))
        ]);

        const cuotas = cuotasRes?.data?.cuotas || cuotasRes?.cuotas || [];
        cuotas.forEach((c) => {
          const dedupeId = `cuota-${c._id}-${c.proximoPago}`;
          if (yaAvisado(dedupeId)) return;
          const vencida = c.proximoPago && new Date(c.proximoPago) < new Date(new Date().setHours(0, 0, 0, 0));
          notifications.addNotification({
            id: `due-${dedupeId}`,
            type: vencida ? 'error' : 'warning',
            title: vencida ? 'Cuota vencida' : 'Cuota por vencer',
            message: `${c.nombre || 'Plan de cuotas'} · ${formatCurrency(c.montoCuota, c.moneda)}`
          });
        });

        const prestamos = prestamosRes?.data?.prestamos || prestamosRes?.prestamos || [];
        prestamos.forEach((p) => {
          if (p.diasRestantes == null || p.diasRestantes > DIAS_AVISO) return;
          const dedupeId = `prestamo-${p._id}-${p.fechaVencimiento}`;
          if (yaAvisado(dedupeId)) return;
          const vencido = p.diasRestantes < 0;
          notifications.addNotification({
            id: `due-${dedupeId}`,
            type: vencido ? 'error' : 'warning',
            title: vencido ? 'Préstamo vencido' : 'Préstamo por vencer',
            message: `${p.nombre || 'Préstamo'} · ${formatCurrency(p.montoTotal - p.montoPagado, p.moneda)} pendiente`
          });
        });
      } catch {
        // Silencioso: no bloquear la app por un aviso que no se pudo calcular.
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}
