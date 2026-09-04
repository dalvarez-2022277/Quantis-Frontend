import React from 'react';
import { motion } from 'framer-motion';

/**
 * Carga global alineada con el resto de pantallas (Cuentas, Dashboard, etc.):
 * anillo único con tema q-primary y texto.
 *
 * @param {string} message - Texto bajo el spinner
 * @param {boolean} compact - Sin min-h-screen: para huecos embebidos (ej. gráfico)
 * @param {string} className - Clases extra en el contenedor exterior
 */
const LoadingSpinner = ({ message = 'Cargando...', compact = false, className = '' }) => {
  const outerClass = compact
    ? `flex flex-col items-center justify-center py-8 ${className}`.trim()
    : `min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 pointer-events-none select-none ${className}`.trim();

  return (
    <div className={outerClass} aria-busy="true">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ contain: 'layout paint' }}
      >
        <div
          className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-q-primary-muted border-t-q-primary"
          style={{ willChange: 'transform' }}
        />
        <p className="px-4 text-center font-medium text-gray-600 dark:text-gray-400">{message}</p>
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;
