import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Botón flotante para abrir la página de instrucciones "Agregar a la pantalla de inicio".
 * Mismo estilo que AuthThemeToggle, colocado a la izquierda.
 */
const AuthInstructionsButton = () => {
  return (
    <motion.div
      className="fixed left-4 z-50 theme-transition"
      style={{
        bottom: 'max(1rem, env(safe-area-inset-bottom, 0.25rem))',
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Link
        to="/agregar-app"
        aria-label="Cómo agregar a la pantalla de inicio"
        className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-500 shadow-lg shadow-gray-900/20 dark:shadow-lg dark:shadow-black/40 hover:bg-gray-50 dark:hover:bg-gray-600 touch-manipulation flex items-center justify-center overflow-hidden theme-transition"
      >
        <InformationCircleIcon className="h-6 w-6 text-gray-700 dark:text-q-primary flex-shrink-0" />
      </Link>
    </motion.div>
  );
};

export default AuthInstructionsButton;
