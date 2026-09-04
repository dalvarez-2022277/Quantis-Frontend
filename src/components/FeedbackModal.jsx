import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BugAntIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import FloatingModal from './FloatingModal';
import { feedbackApi } from '../api/api';
import { useAuthContext } from '../contexts/AuthContext';

const TITLE_MAX = 200;
const MESSAGE_MAX = 4000;

/** Misma base que IngresosContent (tipo de ingreso); colores de acento por tipo en selección */
const chipIdleClasses =
  'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300';

const TYPE_OPTIONS = [
  {
    value: 'bug',
    shortLabel: 'Algo falla',
    hint: 'Errores, datos incorrectos o pantallas raras.',
    titlePlaceholder: 'Ej. No guarda bien',
    messagePlaceholder: 'Qué hiciste y qué viste (pasos si puedes).',
    Icon: BugAntIcon,
    chipSelected:
      'border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-300',
    chipIconSelected: 'text-rose-600 dark:text-rose-400',
    inputFocus: 'focus:border-rose-400 focus:ring-rose-500/25',
    submit:
      'bg-rose-600 text-white shadow-lg shadow-rose-900/25 hover:bg-rose-700 disabled:bg-rose-400 dark:bg-rose-600 dark:hover:bg-rose-500'
  },
  {
    value: 'suggestion',
    shortLabel: 'Una idea',
    hint: 'Mejoras o funciones que te gustaría ver.',
    titlePlaceholder: 'Ej. Calendario o gastos',
    messagePlaceholder: 'Qué pantalla y qué te gustaría cambiar.',
    Icon: LightBulbIcon,
    chipSelected:
      'border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-950/35 dark:text-amber-200',
    chipIconSelected: 'text-amber-600 dark:text-amber-400',
    inputFocus: 'focus:border-amber-400 focus:ring-amber-500/25',
    submit:
      'bg-amber-500 text-gray-900 shadow-lg shadow-amber-900/20 hover:bg-amber-400 disabled:bg-amber-300 dark:bg-amber-500 dark:text-gray-950 dark:hover:bg-amber-400'
  },
  {
    value: 'other',
    shortLabel: 'Otro',
    hint: 'Cualquier otro comentario sobre la app.',
    titlePlaceholder: 'Ej. Otra cosa',
    messagePlaceholder: 'Cuéntanos en pocas palabras.',
    Icon: ChatBubbleLeftRightIcon,
    chipSelected:
      'border-sky-500 bg-sky-50 text-sky-800 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-200',
    chipIconSelected: 'text-sky-600 dark:text-sky-400',
    inputFocus: 'focus:border-sky-400 focus:ring-sky-500/25',
    submit:
      'bg-sky-600 text-white shadow-lg shadow-sky-900/25 hover:bg-sky-700 disabled:bg-sky-400 dark:bg-sky-600 dark:hover:bg-sky-500'
  }
];

function FeedbackModal({ isOpen, onClose }) {
  const location = useLocation();
  const { showSuccess, showError } = useAuthContext();
  const [type, setType] = useState('bug');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const typeChipRefs = useRef([]);

  const [isDesktopModal, setIsDesktopModal] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1280
  );

  React.useEffect(() => {
    const onResize = () => setIsDesktopModal(window.innerWidth >= 1280);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const activeType = useMemo(
    () => TYPE_OPTIONS.find((o) => o.value === type) || TYPE_OPTIONS[0],
    [type]
  );

  const meta = useMemo(
    () => ({
      path: location.pathname + location.search,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      appVersion: import.meta.env.VITE_APP_VERSION || 'web'
    }),
    [location.pathname, location.search]
  );

  const reset = useCallback(() => {
    setType('bug');
    setTitle('');
    setMessage('');
  }, []);

  const handleClose = useCallback(() => {
    if (!sending) {
      reset();
      onClose();
    }
  }, [onClose, sending, reset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t = title.trim();
    const m = message.trim();
    if (!t || !m) {
      showError?.('Escribe un título y una descripción.');
      return;
    }
    setSending(true);
    try {
      await feedbackApi.submit({
        type,
        title: t,
        message: m,
        meta
      });
      showSuccess?.('¡Gracias! Tu mensaje nos ayuda a mejorar Quantis.');
      reset();
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'No se pudo enviar el feedback.';
      showError?.(msg);
    } finally {
      setSending(false);
    }
  };

  const titleLen = title.length;
  const messageLen = message.length;
  const paddingClass = isDesktopModal
    ? 'px-4 pb-4 pt-1.5'
    : 'px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1.5';

  const inputFocusClasses = activeType.inputFocus;

  return (
    <FloatingModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Feedback"
      size="md"
      compactHeader
      showCloseButton
      showDragHandle={!isDesktopModal}
      closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
      bottomSheet={!isDesktopModal}
    >
      <form onSubmit={handleSubmit} className={paddingClass}>
        <div role="radiogroup" aria-label="Tipo de feedback">
          <p className="mb-3 ml-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            Tipo de feedback
          </p>
          {/* Misma fila que Nuevo Ingreso: grid 2 cols en desktop; scroll horizontal en móvil.
              touch-action: pan-x evita que el scroll vertical del sheet robe el gesto al deslizar entre chips */}
          <div
            className={`${
              isDesktopModal
                ? 'grid grid-cols-2 gap-3'
                : 'flex flex-nowrap gap-3 overflow-x-auto overflow-y-hidden -mx-2 px-2'
            }`}
            style={
              !isDesktopModal
                ? {
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    touchAction: 'pan-x',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehaviorX: 'contain'
                  }
                : undefined
            }
          >
            {TYPE_OPTIONS.map((opt, index) => {
              const selected = type === opt.value;
              const Icon = opt.Icon;
              return (
                <button
                  key={opt.value}
                  ref={(el) => {
                    typeChipRefs.current[index] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  title={opt.hint}
                  onClick={() => setType(opt.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      const next = (index + 1) % TYPE_OPTIONS.length;
                      setType(TYPE_OPTIONS[next].value);
                      queueMicrotask(() => typeChipRefs.current[next]?.focus());
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prev = (index - 1 + TYPE_OPTIONS.length) % TYPE_OPTIONS.length;
                      setType(TYPE_OPTIONS[prev].value);
                      queueMicrotask(() => typeChipRefs.current[prev]?.focus());
                    }
                  }}
                  className={`inline-flex touch-manipulation items-center justify-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                    isDesktopModal ? 'w-full' : 'min-w-[140px] flex-shrink-0'
                  } ${
                    selected
                      ? opt.chipSelected
                      : `${chipIdleClasses} hover:border-gray-300 dark:hover:border-gray-600`
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      selected ? opt.chipIconSelected : 'text-gray-500 dark:text-gray-400'
                    }`}
                    aria-hidden
                  />
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        <label className="mt-4 block">
          <div className="mb-0.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Título</span>
            <span
              className={`text-[11px] tabular-nums ${titleLen > TITLE_MAX ? 'text-red-500' : 'text-gray-400'}`}
            >
              {titleLen}/{TITLE_MAX}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            maxLength={TITLE_MAX}
            placeholder={activeType.titlePlaceholder}
            className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-[13px] leading-snug text-gray-900 outline-none ring-0 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:placeholder:text-gray-500 ${inputFocusClasses}`}
          />
        </label>

        <label className="mt-3 block">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Descripción</span>
            <span
              className={`text-xs tabular-nums ${messageLen > MESSAGE_MAX ? 'text-red-500' : 'text-gray-400'}`}
            >
              {messageLen}/{MESSAGE_MAX}
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
            rows={4}
            placeholder={activeType.messagePlaceholder}
            className={`min-h-[112px] w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-base leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:placeholder:text-gray-500 ${inputFocusClasses}`}
          />
        </label>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={sending}
            className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-[13px] font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={sending || !title.trim() || !message.trim()}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${activeType.submit}`}
          >
            {sending ? (
              'Enviando…'
            ) : (
              <>
                <PaperAirplaneIcon className="h-3.5 w-3.5" />
                Enviar
              </>
            )}
          </button>
        </div>
      </form>
    </FloatingModal>
  );
}

export default FeedbackModal;
