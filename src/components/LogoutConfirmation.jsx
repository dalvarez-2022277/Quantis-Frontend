import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

/**
 * Confirmación estilo iOS nativo para cerrar sesión
 */
const LogoutConfirmation = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Sí, cerrar sesión', cancelText = 'Cancelar' }) => {
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
          className="relative w-full max-w-[320px] bg-white dark:bg-gray-800 rounded-[14px] shadow-2xl overflow-hidden"
        >
          {/* Icono */}
          <div className="flex justify-center pt-6 pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.08, duration: 0.18, type: 'spring', stiffness: 250, damping: 18 }}
              className="w-[60px] h-[60px] rounded-full bg-q-expense-muted flex items-center justify-center"
            >
              <ArrowRightOnRectangleIcon className="w-8 h-8 text-q-expense" />
            </motion.div>
          </div>

          {/* Contenido */}
          <div className="px-6 pb-2">
            {/* Título */}
            <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white text-center leading-tight">
              {title || 'Cerrar sesión'}
            </h3>
            
            {/* Mensaje */}
            {message && (
              <p className="text-[13px] text-gray-600 dark:text-gray-300 text-center mt-2 leading-relaxed">
                {message}
              </p>
            )}
          </div>

          {/* Botones estilo iOS */}
          <div className="flex flex-col mt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onConfirm}
              className="w-full px-4 py-3.5 text-[17px] font-medium text-q-expense hover:bg-q-expense-muted transition-colors active:bg-q-expense-muted"
            >
              {confirmText}
            </button>
            <div className="h-[1px] bg-gray-200 dark:bg-gray-700 mx-4" />
            <button
              onClick={onClose}
              className="w-full px-4 py-3.5 text-[17px] font-medium text-q-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
            >
              {cancelText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LogoutConfirmation;