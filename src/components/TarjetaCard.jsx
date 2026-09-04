import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import ProgressBar from './ProgressBar';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDate } from '../utils/dateUtils';

/**
 * Tarjeta visual como una tarjeta de crédito física: proporción, chip, número, banco, corte/pago.
 */
const TarjetaCard = ({
  tarjeta,
  onToggle,
  hideToggle = false,
  className = ''
}) => {
  const esCredito = tarjeta.tipo === 'credito';

  const porcentajeUso = esCredito && tarjeta.limiteCredito > 0
    ? (tarjeta.saldoActual / tarjeta.limiteCredito) * 100
    : 0;

  const calcularProximoPago = () => {
    if (!esCredito || !tarjeta.diaPago) return null;
    const hoy = new Date();
    const proximoPago = new Date(hoy.getFullYear(), hoy.getMonth(), tarjeta.diaPago);
    if (proximoPago < hoy) proximoPago.setMonth(proximoPago.getMonth() + 1);
    return proximoPago;
  };

  const proximoPago = calcularProximoPago();
  const ultimosDigitos = tarjeta.numeroUltimosDigitos || '••••';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 ${className}`}
    >
      {/* Frente: aspecto de tarjeta física con banda y proporción real */}
      <div
        className="relative rounded-2xl p-5 min-h-[180px] flex flex-col justify-between text-white bg-gradient-to-br from-[#3d4f5f] via-[#243443] to-[#15202a]"
        style={{ aspectRatio: '1.586' }}
      >
        {/* Banda decorativa tipo tarjeta (franja superior) */}
        <div className="absolute top-0 left-0 right-0 h-12 rounded-t-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 pointer-events-none" />
        {/* Brillo tipo plástico */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            {/* Chip */}
            <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-300/90 to-amber-600/90 shadow-md border border-amber-400/30" style={{ clipPath: 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
              {tarjeta.banco || 'Crédito'}
            </span>
          </div>

          <p className="mt-8 font-mono text-base sm:text-lg tracking-[0.25em] text-white/95">
            **** **** **** {ultimosDigitos}
          </p>

          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/90 truncate">
            {tarjeta.nombre}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-medium text-white/75 tracking-wide">
            {tarjeta.fechaCorte != null && <span>Corte día {tarjeta.fechaCorte}</span>}
            {tarjeta.diaPago != null && <span>Pago día {tarjeta.diaPago}</span>}
            {proximoPago && (
              <span className="flex items-center gap-1 text-white/90">
                <CalendarIcon className="h-3.5 w-3.5" />
                Próx. {formatDate(proximoPago, 'dd MMM')}
              </span>
            )}
          </div>
        </div>

        {!hideToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle && onToggle(tarjeta._id); }}
            className="absolute top-3 right-3 z-20 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            title={tarjeta.esActiva ? 'Desactivar' : 'Activar'}
          >
            {tarjeta.esActiva ? (
              <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-white/50" />
            )}
          </button>
        )}
      </div>

      {/* Parte inferior: solo límite/saldo si aplica (sin botones; editar/eliminar por swipe en la lista) */}
      {(esCredito && tarjeta.limiteCredito > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-b-2xl border border-t-0 border-gray-200 dark:border-gray-700 p-4 -mt-1">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Uso</span>
            <span className={`font-semibold ${
              porcentajeUso >= 80 ? 'text-red-600 dark:text-red-400' :
              porcentajeUso >= 60 ? 'text-orange-600 dark:text-orange-400' :
              'text-gray-700 dark:text-gray-300'
            }`}>
              {formatCurrency(tarjeta.saldoActual || 0, tarjeta.moneda)} / {formatCurrency(tarjeta.limiteCredito, tarjeta.moneda)}
            </span>
          </div>
          <ProgressBar progress={porcentajeUso} color={porcentajeUso >= 80 ? 'red' : porcentajeUso >= 60 ? 'orange' : 'blue'} showLabel={false} />
        </div>
      )}
    </motion.div>
  );
};

export default TarjetaCard;
