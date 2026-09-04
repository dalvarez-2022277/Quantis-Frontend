import React from 'react';
import { motion } from 'framer-motion';

/**
 * Componente de barra de progreso reutilizable
 * @param {number} progress - Porcentaje de progreso (0-100)
 * @param {string} color - Color de la barra (green, blue, orange, red)
 * @param {string} size - Tamaño (sm, md, lg)
 * @param {boolean} showLabel - Mostrar etiqueta con porcentaje
 * @param {string} label - Etiqueta personalizada
 * @param {string} className - Clases CSS adicionales
 */
const ProgressBar = ({ 
  progress = 0, 
  color = 'green', 
  size = 'md',
  showLabel = true,
  label,
  className = ''
}) => {
  // Asegurar que el progreso esté entre 0 y 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Colores según variante
  const colorClasses = {
    green: 'bg-green-500 dark:bg-green-400',
    blue: 'bg-blue-500 dark:bg-blue-400',
    orange: 'bg-orange-500 dark:bg-orange-400',
    red: 'bg-red-500 dark:bg-red-400',
    purple: 'bg-purple-500 dark:bg-purple-400'
  };

  // Tamaños
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className={`${textSizeClasses[size]} font-medium text-gray-700 dark:text-gray-300`}>
            {label || `${Math.round(clampedProgress)}%`}
          </span>
          {!label && (
            <span className={`${textSizeClasses[size]} text-gray-500 dark:text-gray-400`}>
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${sizeClasses[size]} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <motion.div
          className={`${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
