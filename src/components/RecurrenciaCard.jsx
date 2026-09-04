import React from 'react';
import { motion } from 'framer-motion';
import { 
  CurrencyDollarIcon, 
  ArrowPathIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDate, getRelativeTime } from '../utils/dateUtils';

/**
 * Tarjeta para mostrar una recurrencia (ingreso o gasto recurrente)
 */
const RecurrenciaCard = ({
  recurrencia,
  tipo = 'ingreso', // 'ingreso' o 'gasto'
  onEdit,
  onDelete,
  onToggle,
  className = ''
}) => {
  const isIngreso = tipo === 'ingreso';
  const colorClass = isIngreso 
    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' 
    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10';
  
  const iconColorClass = isIngreso
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  const frecuenciaLabels = {
    diario: 'Diario',
    semanal: 'Semanal',
    quincenal: 'Quincenal',
    mensual: 'Mensual',
    trimestral: 'Trimestral',
    anual: 'Anual'
  };

  const calcularProximoPago = () => {
    if (!recurrencia.fechaInicio) return null;
    
    const fechaInicio = new Date(recurrencia.fechaInicio);
    const hoy = new Date();
    
    // Calcular próximo pago según frecuencia
    let proximoPago = new Date(fechaInicio);
    
    if (recurrencia.ultimaGeneracion) {
      proximoPago = new Date(recurrencia.ultimaGeneracion);
    }
    
    switch (recurrencia.frecuencia) {
      case 'diario':
        proximoPago.setDate(proximoPago.getDate() + 1);
        break;
      case 'semanal':
        proximoPago.setDate(proximoPago.getDate() + 7);
        break;
      case 'quincenal':
        proximoPago.setDate(proximoPago.getDate() + 15);
        break;
      case 'mensual':
        proximoPago.setMonth(proximoPago.getMonth() + 1);
        if (recurrencia.diaPago) {
          proximoPago.setDate(recurrencia.diaPago);
        }
        break;
      case 'trimestral':
        proximoPago.setMonth(proximoPago.getMonth() + 3);
        if (recurrencia.diaPago) {
          proximoPago.setDate(recurrencia.diaPago);
        }
        break;
      case 'anual':
        proximoPago.setFullYear(proximoPago.getFullYear() + 1);
        if (recurrencia.diaPago) {
          proximoPago.setDate(recurrencia.diaPago);
        }
        break;
      default:
        return null;
    }
    
    return proximoPago;
  };

  const proximoPago = calcularProximoPago();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border-2 ${colorClass} shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-lg ${isIngreso ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            <CurrencyDollarIcon className={`h-5 w-5 ${iconColorClass}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {recurrencia.nombre}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {frecuenciaLabels[recurrencia.frecuencia] || recurrencia.frecuencia}
            </p>
          </div>
        </div>
        
        {/* Toggle activo/inactivo */}
        <button
          onClick={() => onToggle && onToggle(recurrencia._id)}
          className="ml-2 flex-shrink-0"
          title={recurrencia.esActivo ? 'Desactivar' : 'Activar'}
        >
          {recurrencia.esActivo ? (
            <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400" />
          ) : (
            <XCircleIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          )}
        </button>
      </div>

      <div className="space-y-3">
        {/* Monto */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monto:</span>
          <span className={`text-xl font-bold ${iconColorClass}`}>
            {formatCurrency(recurrencia.monto, recurrencia.moneda)}
          </span>
        </div>

        {/* Próximo pago */}
        {proximoPago && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <CalendarIcon className="h-4 w-4" />
            <span>Próximo: {formatDate(proximoPago)}</span>
            <span className="text-gray-400 dark:text-gray-500">
              ({getRelativeTime(proximoPago)})
            </span>
          </div>
        )}

        {/* Descripción */}
        {recurrencia.descripcion && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {recurrencia.descripcion}
          </p>
        )}

        {/* Acciones */}
        <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onEdit && onEdit(recurrencia)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
            <span>Editar</span>
          </button>
          <button
            onClick={() => onDelete && onDelete(recurrencia._id)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default RecurrenciaCard;
