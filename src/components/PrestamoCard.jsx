import React from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ProgressBar from './ProgressBar';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDate, daysUntil, isPast } from '../utils/dateUtils';

/**
 * Tarjeta para mostrar un préstamo
 */
const PrestamoCard = ({
  prestamo,
  onEdit,
  onDelete,
  onPagar,
  className = ''
}) => {
  const montoPendiente = prestamo.montoTotal - prestamo.montoPagado;
  const progreso = prestamo.montoTotal > 0 
    ? (prestamo.montoPagado / prestamo.montoTotal) * 100 
    : 0;

  const diasRestantes = daysUntil(prestamo.fechaVencimiento);
  const estaVencido = prestamo.estado === 'vencido' || (isPast(prestamo.fechaVencimiento) && prestamo.estado === 'activo');
  const estaPagado = prestamo.estado === 'pagado';

  const esRecibido = prestamo.tipo === 'recibido';

  // Determinar color según estado y tipo
  let colorClass = 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10';
  let iconColorClass = 'text-orange-600 dark:text-orange-400';
  let progressColor = 'orange';

  if (estaVencido) {
    colorClass = 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10';
    iconColorClass = 'text-red-600 dark:text-red-400';
    progressColor = 'red';
  } else if (estaPagado) {
    colorClass = 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10';
    iconColorClass = 'text-green-600 dark:text-green-400';
    progressColor = 'green';
  }

  const tipoLabels = {
    recibido: 'Recibido',
    otorgado: 'Otorgado'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border-2 ${colorClass} shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-lg ${
            estaVencido ? 'bg-red-100 dark:bg-red-900' :
            estaPagado ? 'bg-green-100 dark:bg-green-900' :
            'bg-orange-100 dark:bg-orange-900'
          }`}>
            {esRecibido ? (
              <ArrowDownCircleIcon className={`h-5 w-5 ${iconColorClass}`} />
            ) : (
              <ArrowUpCircleIcon className={`h-5 w-5 ${iconColorClass}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {prestamo.nombre}
              </h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                esRecibido 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
              }`}>
                {tipoLabels[prestamo.tipo] || prestamo.tipo}
              </span>
            </div>
            {prestamo.tasaInteres > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tasa de interés: {prestamo.tasaInteres}%
              </p>
            )}
          </div>
        </div>
        
        {/* Badge de estado */}
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          estaVencido ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
          estaPagado ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
          prestamo.estado === 'cancelado' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
          'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
        }`}>
          {prestamo.estado === 'vencido' ? 'Vencido' :
           prestamo.estado === 'pagado' ? 'Pagado' :
           prestamo.estado === 'cancelado' ? 'Cancelado' :
           'Activo'}
        </span>
      </div>

      <div className="space-y-3">
        {/* Montos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total:</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(prestamo.montoTotal, prestamo.moneda)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pagado:</span>
            <span className="text-base font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(prestamo.montoPagado, prestamo.moneda)}
            </span>
          </div>
          {!estaPagado && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendiente:</span>
              <span className={`text-base font-semibold ${
                estaVencido ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                {formatCurrency(montoPendiente, prestamo.moneda)}
              </span>
            </div>
          )}
        </div>

        {/* Progreso */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Progreso de pago
            </span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {Math.round(progreso)}%
            </span>
          </div>
          <ProgressBar 
            progress={progreso} 
            color={progressColor}
            showLabel={false}
          />
        </div>

        {/* Fecha de vencimiento */}
        {!estaPagado && (
          <div className={`flex items-center space-x-2 text-sm ${
            estaVencido ? 'text-red-600 dark:text-red-400' :
            diasRestantes !== null && diasRestantes <= 7 ? 'text-orange-600 dark:text-orange-400' :
            'text-gray-600 dark:text-gray-400'
          }`}>
            <CalendarIcon className="h-4 w-4" />
            <span>
              Vence: {formatDate(prestamo.fechaVencimiento)}
              {diasRestantes !== null && (
                <span className="ml-1">
                  ({diasRestantes > 0 ? `en ${diasRestantes} días` : 'vencido'})
                </span>
              )}
            </span>
          </div>
        )}

        {/* Contacto */}
        {prestamo.contacto?.nombre && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Contacto:</span> {prestamo.contacto.nombre}
          </div>
        )}

        {/* Descripción */}
        {prestamo.descripcion && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {prestamo.descripcion}
          </p>
        )}

        {/* Acciones */}
        <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {!estaPagado && (
            <button
              onClick={() => onPagar && onPagar(prestamo)}
              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-lg transition-colors"
            >
              <CurrencyDollarIcon className="h-4 w-4" />
              <span>Registrar Pago</span>
            </button>
          )}
          <button
            onClick={() => onEdit && onEdit(prestamo)}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete && onDelete(prestamo._id)}
            className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PrestamoCard;
