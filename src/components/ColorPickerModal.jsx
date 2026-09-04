import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

// --- Conversiones hex ↔ HSL (mismo comportamiento en iOS, Android y web) ---
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => {
    const h = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

function parseHex(input) {
  const cleaned = input.replace(/^#/, '').replace(/[^0-9a-fA-F]/g, '');
  if (cleaned.length === 6) return '#' + cleaned;
  if (cleaned.length === 3) {
    const r = cleaned[0] + cleaned[0], g = cleaned[1] + cleaned[1], b = cleaned[2] + cleaned[2];
    return '#' + r + g + b;
  }
  return null;
}

const HUE_BAR_HEIGHT = 24;
const SV_BOX_SIZE = 220;

const ColorPickerModal = ({
  isOpen,
  onClose,
  value = '#2563eb',
  onChange,
  title = 'Elegir color'
}) => {
  const [hex, setHex] = useState(value);
  const [hsl, setHsl] = useState(() => hexToHsl(value));
  const [hexInput, setHexInput] = useState(value);
  const svBoxRef = useRef(null);
  const hueBarRef = useRef(null);
  const isDraggingSv = useRef(false);
  const isDraggingHue = useRef(false);
  const prevOpenRef = useRef(false);

  // Inicializar solo al abrir el modal; no sobrescribir hexInput mientras el usuario escribe o borra
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      const h = value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#2563eb';
      setHex(h);
      setHsl(hexToHsl(h));
      setHexInput(h);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, value]);

  const commitHex = useCallback((newHex) => {
    if (!newHex || !/^#[0-9a-fA-F]{6}$/.test(newHex)) return;
    setHex(newHex);
    setHsl(hexToHsl(newHex));
    setHexInput(newHex);
    onChange?.(newHex);
  }, [onChange]);

  const applyColorOnly = useCallback((newHex) => {
    if (!newHex || !/^#[0-9a-fA-F]{6}$/.test(newHex)) return;
    setHex(newHex);
    setHsl(hexToHsl(newHex));
    onChange?.(newHex);
  }, [onChange]);

  const updateFromHsl = useCallback((h, s, l) => {
    const newHex = hslToHex(h, s, l);
    setHex(newHex);
    setHsl({ h, s, l });
    setHexInput(newHex);
    onChange?.(newHex);
  }, [onChange]);

  // Interacción: cuadro Saturación / Luminosidad (pointer events para iOS/Android y desktop)
  const getSvFromEvent = useCallback((e, el) => {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const s = Math.max(0, Math.min(1, x)) * 100;
    const l = Math.max(0, Math.min(1, 1 - y)) * 100;
    return { s, l };
  }, []);

  const handleSvPointerDown = useCallback((e) => {
    e.preventDefault();
    isDraggingSv.current = true;
    const pt = getSvFromEvent(e, svBoxRef.current);
    if (pt) updateFromHsl(hsl.h, pt.s, pt.l);
  }, [hsl.h, getSvFromEvent, updateFromHsl]);

  useEffect(() => {
    if (!isDraggingSv.current) return;
    const move = (e) => {
      const pt = getSvFromEvent(e, svBoxRef.current);
      if (pt) updateFromHsl(hsl.h, pt.s, pt.l);
    };
    const up = () => { isDraggingSv.current = false; };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [hsl.h, getSvFromEvent, updateFromHsl]);

  // Interacción: barra de matiz
  const getHueFromEvent = useCallback((e, el) => {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(360, x * 360));
  }, []);

  const handleHuePointerDown = useCallback((e) => {
    e.preventDefault();
    isDraggingHue.current = true;
    const h = getHueFromEvent(e, hueBarRef.current);
    updateFromHsl(h, hsl.s, hsl.l);
  }, [hsl.s, hsl.l, getHueFromEvent, updateFromHsl]);

  useEffect(() => {
    if (!isDraggingHue.current) return;
    const move = (e) => {
      const h = getHueFromEvent(e, hueBarRef.current);
      updateFromHsl(h, hsl.s, hsl.l);
    };
    const up = () => { isDraggingHue.current = false; };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [hsl.s, hsl.l, getHueFromEvent, updateFromHsl]);

  const handleHexInputChange = (e) => {
    const raw = e.target.value;
    setHexInput(raw);
    const parsed = parseHex(raw);
    if (parsed) applyColorOnly(parsed);
  };

  const handleHexInputBlur = () => {
    const parsed = parseHex(hexInput);
    if (parsed) {
      commitHex(parsed);
    } else {
      setHexInput(hex);
    }
  };

  if (!isOpen) return null;

  const hueColor = hslToHex(hsl.h, 100, 50);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
        }}
      />
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
        }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex items-center pr-12 pt-4 pb-2 flex-shrink-0">
            <h2 className="font-semibold text-gray-900 dark:text-white truncate min-w-0 flex-1 pl-4 text-lg">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-0 right-0 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-tr-2xl rounded-bl-lg transition-colors duration-200 flex items-center justify-center"
              aria-label="Cerrar"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Vista previa del color elegido */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
                style={{ backgroundColor: hex }}
              />
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Código hex</label>
                <input
                  type="text"
                  value={hexInput}
                  onChange={handleHexInputChange}
                  onBlur={handleHexInputBlur}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-q-primary focus:border-q-primary outline-none"
                  placeholder="#000000"
                  aria-label="Código de color hex"
                />
              </div>
            </div>

            {/* Cuadro Saturación / Luminosidad */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tono y brillo</label>
              <div
                ref={svBoxRef}
                role="slider"
                aria-label="Saturación y luminosidad"
                aria-valuetext={`Saturación ${Math.round(hsl.s)}%, Luminosidad ${Math.round(hsl.l)}%`}
                tabIndex={0}
                onPointerDown={handleSvPointerDown}
                className="relative w-full rounded-xl overflow-hidden touch-none select-none cursor-crosshair"
                style={{
                  height: SV_BOX_SIZE,
                  maxHeight: 'min(220px, 50vw)',
                  background: `
                    linear-gradient(to top, #000, transparent),
                    linear-gradient(to right, #fff, ${hueColor})
                  `
                }}
              >
                <div
                  className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    left: `${hsl.s}%`,
                    top: `${100 - hsl.l}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: hex
                  }}
                />
              </div>
            </div>

            {/* Barra de matiz (Hue) */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Matiz</label>
              <div
                ref={hueBarRef}
                role="slider"
                aria-label="Matiz del color"
                aria-valuemin={0}
                aria-valuemax={360}
                aria-valuenow={Math.round(hsl.h)}
                tabIndex={0}
                onPointerDown={handleHuePointerDown}
                className="relative w-full rounded-full overflow-hidden touch-none select-none cursor-pointer"
                style={{
                  height: HUE_BAR_HEIGHT,
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                }}
              >
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-8 rounded border-2 border-white shadow pointer-events-none"
                  style={{
                    left: `${(hsl.h / 360) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: hueColor
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Arrastra en el cuadro y en la barra para ajustar. Mismo selector en todas las plataformas.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ColorPickerModal;
