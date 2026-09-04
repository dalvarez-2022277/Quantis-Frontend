import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * Encabezado de sección: Regresar (izq) | Título + subtítulo | Acción principal (der).
 * Si equalButtonWidth es true: Regresar más corto, Nuevo un poco más largo para marcar la diferencia.
 */
const SectionHeader = ({
  title,
  subtitle,
  onBack,
  rightContent,
  equalButtonWidth = true,
  className = ''
}) => {
  const backWidthClass = equalButtonWidth ? 'w-[5.75rem] min-w-[5.75rem] shrink-0' : 'shrink-0';   // Regresar más compacto
  const actionWidthClass = equalButtonWidth ? 'w-[7rem] min-w-[7rem] shrink-0' : 'shrink-0';       // Nuevo un poco más largo
  const rightWrapperClass = equalButtonWidth
    ? `${actionWidthClass} flex justify-end [&>button]:w-full [&>button]:justify-center`
    : 'shrink-0';

  return (
    <motion.header
      className={`mb-6 ${className}`}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm dark:shadow-none overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent opacity-60" aria-hidden="true" />
        <div className="relative px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center justify-between gap-3 sm:contents">
              <div className={equalButtonWidth ? `${backWidthClass} flex` : ''}>
                <button
                  type="button"
                  onClick={onBack}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/70 hover:bg-gray-200 dark:hover:bg-gray-600/80 hover:text-gray-900 dark:hover:text-white border border-gray-200/50 dark:border-gray-600/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400/50 dark:focus:ring-gray-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${equalButtonWidth ? 'w-full' : 'shrink-0'}`}
                  aria-label="Regresar al inicio"
                >
                  <ArrowLeftIcon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                  <span className="hidden sm:inline">Regresar</span>
                </button>
              </div>
              <div className={`sm:hidden ${rightWrapperClass}`}>{rightContent}</div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-snug line-clamp-2 sm:line-clamp-none">
                  {subtitle}
                </p>
              )}
            </div>
            <div className={`hidden sm:flex items-center ${rightWrapperClass}`}>{rightContent}</div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default SectionHeader;
