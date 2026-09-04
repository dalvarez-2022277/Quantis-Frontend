import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

/**
 * Alerta estilo iOS nativo para errores de login
 */
const ErrorAlert = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal estilo iOS */}
        <motion.div
          initial={{ scale: 0.78, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.78, opacity: 0 }}
          transition={{ 
            duration: 0.22,
            ease: [0.32, 0.72, 0, 1]
          }}
          className="relative w-full max-w-[280px] bg-white dark:bg-gray-800 rounded-[14px] shadow-2xl overflow-hidden"
        >
          {/* Contenido */}
          <div className="flex flex-col items-center px-4 pt-5 pb-2">
            {/* Icono */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.08, duration: 0.18, type: 'spring', stiffness: 250, damping: 18 }}
              className="w-[50px] h-[50px] rounded-full flex items-center justify-center mb-2 bg-q-expense"
            >
              <ExclamationTriangleIcon className="w-7 h-7 text-white" />
            </motion.div>
            
            {/* Título */}
            <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white text-center leading-tight px-2">
              {title || 'Error'}
            </h3>
            
            {/* Mensaje */}
            {message && (
              <p className="text-[13px] text-gray-600 dark:text-gray-300 text-center mt-2 leading-relaxed px-4 font-normal">
                {message}
              </p>
            )}
          </div>

          {/* Botones estilo iOS */}
          <div className="flex flex-col mt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-3.5 text-[17px] text-q-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 font-medium"
            >
              Aceptar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ErrorAlert;