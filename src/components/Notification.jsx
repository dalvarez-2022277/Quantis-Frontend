import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Alert estilo iOS: modal centrado, fondo oscurecido,
 * tarjeta con título, mensaje y botón OK.
 */
const Notification = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          iconColor: 'text-q-income',
        };
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-q-expense',
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-amber-500 dark:text-amber-400',
        };
      case 'info':
        return {
          icon: InformationCircleIcon,
          iconColor: 'text-q-primary',
        };
      default:
        return {
          icon: InformationCircleIcon,
          iconColor: 'text-gray-500 dark:text-gray-400',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Fondo oscurecido (backdrop) */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/50"
        onClick={handleBackdropClick}
        aria-hidden
      />
      {/* Tarjeta centrada al estilo iOS */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="relative w-full max-w-[270px] sm:max-w-[300px] rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-xl theme-transition"
      >
        {/* Contenido */}
        <div className="pt-5 pb-2 px-5 text-center">
          <div className="flex justify-center mb-3">
            <Icon className={`w-10 h-10 ${config.iconColor}`} />
          </div>
          <p className="text-[17px] font-semibold text-gray-900 dark:text-white">
            {title}
          </p>
          {message && (
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5 leading-snug">
              {message}
            </p>
          )}
        </div>
        {/* Botón OK al estilo iOS */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => onClose(id)}
            className="w-full py-3 text-[17px] font-semibold text-q-primary active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors"
          >
            OK
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Notification;
