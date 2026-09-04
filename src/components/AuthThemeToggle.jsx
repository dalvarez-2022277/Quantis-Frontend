import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Botón para alternar modo claro/oscuro en pantallas de auth (login, registro, etc.).
 * Animado: transición del icono y del cambio de tema.
 */
const AuthThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Usar modo claro' : 'Usar modo oscuro'}
      className="fixed right-4 z-50 w-12 h-12 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-500 shadow-lg shadow-gray-900/20 dark:shadow-lg dark:shadow-black/40 hover:bg-gray-50 dark:hover:bg-gray-600 touch-manipulation flex items-center justify-center overflow-hidden theme-transition"
      style={{
        bottom: 'max(1rem, env(safe-area-inset-bottom, 0.25rem))',
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <SunIcon className="h-6 w-6 text-amber-400 flex-shrink-0" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <MoonIcon className="h-6 w-6 text-gray-600 dark:text-gray-100 flex-shrink-0" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default AuthThemeToggle;
