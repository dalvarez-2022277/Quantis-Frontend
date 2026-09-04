import React, { useState, useEffect, useMemo } from 'react';
import FloatingModal from './FloatingModal';
import { getMonthName } from '../utils/dateUtils';

/**
 * Modal para elegir mes y año (nombres de mes completos en español).
 * Estilo alineado con FloatingModal / Quantis (q-primary, dark mode).
 */
function MonthYearPickerModal({
  isOpen,
  onClose,
  month,
  year,
  onApply,
  minYear = 2000,
  maxYear = 2100,
}) {
  const [draftMonth, setDraftMonth] = useState(month);
  const [draftYear, setDraftYear] = useState(year);
  const [isDesktopModal, setIsDesktopModal] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1280
  );

  useEffect(() => {
    const onResize = () => setIsDesktopModal(window.innerWidth >= 1280);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDraftMonth(month);
      setDraftYear(year);
    }
  }, [isOpen, month, year]);

  const meses = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ num: i + 1, nombre: getMonthName(i + 1) })),
    []
  );
  const años = useMemo(() => {
    const out = [];
    for (let y = maxYear; y >= minYear; y--) out.push(y);
    return out;
  }, [minYear, maxYear]);

  const handleApply = () => {
    onApply(draftMonth, draftYear);
    onClose();
  };

  return (
    <FloatingModal
      isOpen={isOpen}
      onClose={onClose}
      title="Elegir mes y año"
      size="sm"
      compactHeader
      showCloseButton
      showDragHandle={!isDesktopModal}
      closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
      bottomSheet={!isDesktopModal}
    >
      <div className={isDesktopModal ? 'px-5 pb-6 pt-1' : 'px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1'}>
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Selección
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                Mes
              </span>
              <select
                value={draftMonth}
                onChange={(e) => setDraftMonth(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-q-primary/40 focus:ring-2 focus:ring-q-primary/20 dark:border-gray-700 dark:bg-gray-900/40 dark:text-white"
              >
                {meses.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                Año
              </span>
              <select
                value={draftYear}
                onChange={(e) => setDraftYear(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-q-primary/40 focus:ring-2 focus:ring-q-primary/20 dark:border-gray-700 dark:bg-gray-900/40 dark:text-white"
              >
                {años.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-q-primary/5 px-3 py-2 text-sm text-gray-700 dark:bg-q-primary/10 dark:text-gray-200">
            <span className="font-semibold text-gray-900 dark:text-white">
              {getMonthName(draftMonth)} {draftYear}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Vista previa</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-xl bg-q-primary py-3 text-sm font-semibold text-white shadow-md shadow-q-primary/30 transition-colors hover:opacity-95 active:scale-[0.99]"
          >
            Aplicar
          </button>
        </div>
      </div>
    </FloatingModal>
  );
}

export default MonthYearPickerModal;
