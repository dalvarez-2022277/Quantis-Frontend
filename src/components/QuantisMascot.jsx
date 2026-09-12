import React, { useEffect, useRef, useState } from 'react';
import { Blobatar } from '@blobatar/react';
import { useGaze } from '@blobatar/react/gaze';
import { happy, sad, surprised, love, wink, sleepy, smug, thinking, idle } from 'blobatar/expression';
import 'blobatar/motion.css';
import 'blobatar/gaze.css';
import FloatingModal from './FloatingModal';

const MASCOT_NAME_KEY = 'quantis_mascot_name';
// Antes de que el usuario le ponga nombre: el look sale de este seed interno
// (nos gustó cómo queda esta criatura en particular), pero en pantalla se
// muestra como "Quanti". En cuanto el usuario define su propio nombre, ese
// nombre pasa a ser tanto el seed (el look cambia) como lo que se muestra.
const DEFAULT_MASCOT_SEED = 'honax.fr';
const DEFAULT_MASCOT_DISPLAY_NAME = 'Quanti';
const LONG_PRESS_MS = 500;

// blobatar no tiene una pose "comiendo": usamos `surprised` como reacción al
// registrar un gasto (lee como un "¡ey!"), ya provista por la librería.
const MOOD_EXPRESSION = { happy, sad, eating: surprised };

// Poses "de buen humor" entre las que rota sola cuando todo está bien, para
// que se sienta viva en vez de una imagen fija entre clicks. Se excluyen las
// de lectura negativa (mad, scared, sick, unsure) - esas quedan reservadas
// para cuando `mood` realmente lo amerite.
const AMBIENT_POOL = [happy, wink, sleepy, smug, surprised, thinking, love, idle];
const AMBIENT_MIN_MS = 2500;
const AMBIENT_MAX_MS = 6000;

/**
 * Mascota del dashboard: <Blobatar animate="always"> sin fondo, con `useGaze`
 * para que los ojos sigan el cursor. Su estilo (forma, color) se deriva del
 * nombre que le pongas - "Quanti" por defecto. Mantenerla presionada abre un
 * modal para renombrarla y así personalizarla.
 */
const QuantisMascot = ({ mood = 'happy', size = 56, onPet }) => {
  const { ref, lookAt } = useGaze({ travel: 3 });
  const [petting, setPetting] = useState(false);
  const [customName, setCustomName] = useState(() => {
    try {
      return localStorage.getItem(MASCOT_NAME_KEY) || '';
    } catch (_) {
      return '';
    }
  });
  const [showRename, setShowRename] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [ambientExpr, setAmbientExpr] = useState(happy);
  const pettingTimeoutRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const ambientTimerRef = useRef(null);

  useEffect(() => {
    lookAt('pointer');
  }, [lookAt]);

  // Mientras todo está bien (mood 'happy'), rota sola entre poses de buen
  // humor a intervalos aleatorios - no un timer fijo, para que no se sienta
  // mecánica. Se pausa mientras `petting` o cuando el mood real (sad/eating)
  // manda, para no pisar esas señales con una pose al azar.
  useEffect(() => {
    if (mood !== 'happy' || petting) return undefined;
    let cancelled = false;
    const scheduleNext = () => {
      const delay = AMBIENT_MIN_MS + Math.random() * (AMBIENT_MAX_MS - AMBIENT_MIN_MS);
      ambientTimerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        setAmbientExpr(AMBIENT_POOL[Math.floor(Math.random() * AMBIENT_POOL.length)]);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      cancelled = true;
      if (ambientTimerRef.current) window.clearTimeout(ambientTimerRef.current);
    };
  }, [mood, petting]);

  useEffect(() => () => {
    if (pettingTimeoutRef.current) window.clearTimeout(pettingTimeoutRef.current);
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
  }, []);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openRename = () => {
    setNameDraft(customName || DEFAULT_MASCOT_DISPLAY_NAME);
    setShowRename(true);
  };

  const handlePointerDown = () => {
    longPressFiredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      openRename();
    }, LONG_PRESS_MS);
  };

  const handlePointerUpOrLeave = () => {
    clearLongPressTimer();
  };

  const handleClick = () => {
    if (longPressFiredRef.current) {
      // Ya se abrió el modal de renombrar desde el long-press: ignorar el
      // click que el navegador dispara justo después de soltar.
      longPressFiredRef.current = false;
      return;
    }
    setPetting(true);
    if (pettingTimeoutRef.current) window.clearTimeout(pettingTimeoutRef.current);
    pettingTimeoutRef.current = window.setTimeout(() => setPetting(false), 1200);
    onPet?.();
  };

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    setCustomName(trimmed);
    try {
      localStorage.setItem(MASCOT_NAME_KEY, trimmed);
    } catch (_) {}
    setShowRename(false);
  };

  const handleResetName = () => {
    setCustomName('');
    try {
      localStorage.removeItem(MASCOT_NAME_KEY);
    } catch (_) {}
    setShowRename(false);
  };

  const seed = customName || DEFAULT_MASCOT_SEED;
  const displayName = customName || DEFAULT_MASCOT_DISPLAY_NAME;
  const expression = petting
    ? love
    : mood === 'happy'
      ? ambientExpr
      : (MOOD_EXPRESSION[mood] || idle);
  const isSad = mood === 'sad' && !petting;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUpOrLeave}
        onPointerLeave={handlePointerUpOrLeave}
        onPointerCancel={handlePointerUpOrLeave}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={`Mascota ${displayName}${isSad ? ' (saldo bajo)' : ''}`}
        title={isSad ? `${displayName} está preocupado por tu saldo` : `${displayName} · mantén presionado para renombrarla`}
        className="shrink-0 rounded-full bg-transparent border-0 p-0 cursor-pointer touch-manipulation select-none"
        style={{ width: size, height: size, WebkitTouchCallout: 'none' }}
      >
        <Blobatar
          ref={ref}
          name={seed}
          animate="always"
          expression={expression}
          background={false}
          size={size}
        />
      </button>

      <FloatingModal
        isOpen={showRename}
        onClose={() => setShowRename(false)}
        size="sm"
        showCloseButton
        title="Personaliza tu mascota"
        compactHeader
      >
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
              }}
              maxLength={40}
              placeholder={DEFAULT_MASCOT_DISPLAY_NAME}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-q-primary min-h-[48px]"
            />
            <p className="mt-1.5 ml-1 text-xs text-gray-500 dark:text-gray-400">
              Su forma y color cambian según el nombre que le pongas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {customName && (
              <button
                type="button"
                onClick={handleResetName}
                className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
              >
                Quitar nombre
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setShowRename(false)}
              className="px-4 py-2.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveName}
              disabled={!nameDraft.trim()}
              className="px-5 py-2.5 rounded-full bg-q-primary text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar
            </button>
          </div>
        </div>
      </FloatingModal>
    </>
  );
};

export default QuantisMascot;
