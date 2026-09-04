import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getMonthName } from '../utils/dateUtils';
import MonthYearPickerModal from './MonthYearPickerModal';

/**
 * Barra compacta: flechas, mes/año (nombre completo) abre modal estilizado, y "Hoy".
 */
function MonthYearPillNav({
  month,
  year,
  onMonthYearApply,
  onPrev,
  onNext,
  onToday,
  minYear = 2000,
  maxYear = 2100,
  className = '',
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const monthKey = `${month}-${year}`;

  return (
    <>
      <div
        className={`inline-flex w-max max-w-full shrink-0 items-center gap-0.5 rounded-full border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800 ${className}`}
      >
        <button
          type="button"
          onClick={onPrev}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white hover:text-gray-900 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          aria-label="Mes anterior"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="relative flex min-h-[2rem] min-w-0 max-w-[9rem] shrink-0 flex-col items-center justify-center px-1.5 py-0.5 sm:max-w-[11rem] sm:px-2"
          aria-label={`Elegir mes y año, ${getMonthName(month)} ${year}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={monthKey}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="flex flex-col items-center text-center"
            >
              <span className="max-w-full truncate text-[11px] font-semibold leading-tight text-gray-900 dark:text-white sm:text-xs">
                {getMonthName(month)}
              </span>
              <span className="mt-px text-[10px] font-medium tabular-nums leading-none text-gray-500 dark:text-gray-400">
                {year}
              </span>
            </motion.div>
          </AnimatePresence>
        </button>

        <button
          type="button"
          onClick={onToday}
          className="flex h-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white px-2 text-[11px] font-medium text-q-primary shadow-sm transition-colors hover:bg-q-primary/5 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-q-primary dark:hover:bg-q-primary/10"
        >
          Hoy
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white hover:text-gray-900 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          aria-label="Mes siguiente"
        >
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <MonthYearPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        month={month}
        year={year}
        onApply={onMonthYearApply}
        minYear={minYear}
        maxYear={maxYear}
      />
    </>
  );
}

export default MonthYearPillNav;
