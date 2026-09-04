import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSafeArea } from '../hooks/useSafeArea';

const DRAG_CLOSE_THRESHOLD = 100;

const FloatingModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  compactHeader = false,
  /** Barra horizontal gris centrada encima del contenido (indicador de arrastre) */
  showDragHandle = false,
  /** 'default' = X sin círculo; 'circle' = X dentro de círculo gris claro */
  closeButtonStyle = 'default',
  /** Si true, modal tipo bottom sheet: entra desde abajo y se puede arrastrar hacia abajo para cerrar */
  bottomSheet = false,
  /** Ref que el padre puede setear (scrollYRef.current = window.scrollY) en el click que abre el modal, para no perder posición */
  scrollYRef
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [sheetClosing, setSheetClosing] = useState(false);
  const savedScrollY = useRef(0);
  const scrollWhenOpenedRef = useRef(0);
  const dragStartY = useRef(0);
  const dragYRef = useRef(0);
  const sheetRef = useRef(null);
  const { insets, isStandalone } = useSafeArea();

  const handleBottomSheetDragStart = useCallback((clientY) => {
    dragStartY.current = clientY;
    dragYRef.current = 0;
    setIsDragging(true);
  }, []);

  const handleBottomSheetDragMove = useCallback((clientY) => {
    const deltaY = clientY - dragStartY.current;
    const newY = Math.max(0, deltaY);
    dragYRef.current = newY;
    setDragY(newY);
  }, []);

  const handleBottomSheetDragEnd = useCallback(() => {
    setIsDragging(false);
    const currentDrag = dragYRef.current;
    const threshold = sheetRef.current
      ? Math.min(DRAG_CLOSE_THRESHOLD, sheetRef.current.offsetHeight * 0.25)
      : DRAG_CLOSE_THRESHOLD;
    if (currentDrag > threshold) {
      setSheetClosing(true);
    }
    setDragY(0);
    dragYRef.current = 0;
  }, []);

  const handleSheetCloseAnimationComplete = useCallback(() => {
    if (sheetClosing) {
      setSheetClosing(false);
      onClose();
    }
  }, [sheetClosing, onClose]);

  // Detectar si es móvil para calcular espacio del header
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1280); // tablets = móvil; solo ≥1280 usa modal centrado
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detectar iOS Safari para aplicar optimizaciones específicas
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);
  }, []);

  // Mantener última posición de scroll conocida (solo cuando el modal está cerrado, para no pisar scrollWhenOpenedRef)
  useEffect(() => {
    const saveScroll = () => { savedScrollY.current = window.scrollY ?? document.documentElement.scrollTop ?? 0; };
    window.addEventListener('scroll', saveScroll, { passive: true });
    saveScroll();
    return () => window.removeEventListener('scroll', saveScroll);
  }, []);

  // Prevenir scroll del body y evitar salto: ejecutar ANTES del paint (useLayoutEffect)
  useLayoutEffect(() => {
    if (isOpen) {
      // Usar posición capturada por el padre en el click, o la última guardada, o la actual
      const scrollY = (scrollYRef?.current ?? null) != null
        ? Number(scrollYRef.current)
        : (window.scrollY ?? document.documentElement.scrollTop ?? savedScrollY.current);
      savedScrollY.current = scrollY;
      scrollWhenOpenedRef.current = scrollY; // Guardar solo aquí; al cerrar usamos esto (el listener no lo pisa)

      if (isIOS) {
        document.body.style.top = `-${scrollY}px`;
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      } else {
        document.body.style.overflow = 'hidden';
      }

      // Restaurar de inmediato (antes de pintar) por si algo ya movió el scroll — sin animación
      window.scrollTo({ left: 0, top: savedScrollY.current, behavior: 'auto' });
      requestAnimationFrame(() => {
        if (window.scrollY !== savedScrollY.current) {
          window.scrollTo({ left: 0, top: savedScrollY.current, behavior: 'auto' });
        }
      });
    } else {
      // Al cerrar: posición que teníamos al abrir (no savedScrollY, puede ser 0 con modal abierto)
      const scrollToRestore = isIOS
        ? (parseInt(document.body.style.top || '0', 10) * -1) || scrollWhenOpenedRef.current
        : scrollWhenOpenedRef.current;

      // Desactivar temporalmente scroll-behavior: smooth del CSS global para evitar animaciones
      const htmlElement = document.documentElement;
      const originalScrollBehavior = htmlElement.style.scrollBehavior;
      htmlElement.style.scrollBehavior = 'auto';

      // Función helper para restaurar scroll sin animación (solo asignación directa, no scrollTo)
      const restoreScrollInstant = () => {
        document.documentElement.scrollTop = scrollToRestore;
        document.body.scrollTop = scrollToRestore;
      };

      // Quitar estilos del body
      if (isIOS) {
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
      } else {
        document.body.style.overflow = 'unset';
      }

      // Restaurar scroll inmediatamente (asignación directa, no scrollTo, para evitar animaciones)
      restoreScrollInstant();

      // Doble requestAnimationFrame para asegurar después del reflow
      requestAnimationFrame(() => {
        restoreScrollInstant();
        requestAnimationFrame(() => {
          restoreScrollInstant();
          // Restaurar scroll-behavior original después de restaurar el scroll
          htmlElement.style.scrollBehavior = originalScrollBehavior || '';
        });
      });
    }

    return () => {
      if (isIOS) {
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
      } else {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, isIOS, scrollYRef]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setSheetClosing(false);
  }, [isOpen]);

  // Mouse global para arrastre en desktop (solo bottom sheet)
  useEffect(() => {
    if (!bottomSheet || !isDragging) return;
    const handleMouseMove = (e) => handleBottomSheetDragMove(e.clientY);
    const handleMouseUp = () => handleBottomSheetDragEnd();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [bottomSheet, isDragging, handleBottomSheetDragMove, handleBottomSheetDragEnd]);

  // En escritorio (xl = 1280+): más ancho para aprovechar pantalla; altura máxima para no alargarse (scroll interno)
  const sizeClasses = {
    sm: 'max-w-md w-full mx-4 xl:max-w-[20rem] xl:w-[20rem]',
    md: 'max-w-lg w-full mx-4 xl:max-w-[40rem] xl:w-[40rem]',
    lg: 'max-w-2xl w-full mx-4 xl:max-w-[44rem] xl:w-[44rem]',
    xl: 'max-w-4xl w-full mx-4 xl:max-w-[52rem] xl:w-[52rem]'
  };
  const formLikeSizes = ['md', 'lg'];
  // Mismo tamaño para Ingreso y Gasto en PC: altura fija entre min y max para armonía
  const formModalDesktopClass = formLikeSizes.includes(size)
    ? 'xl:max-h-[75vh] xl:min-h-[28rem]'
    : '';

  // Configuración de animaciones optimizada para iOS
  const animationConfig = isIOS 
    ? { 
        type: "tween", 
        duration: 0.3,
        ease: "easeOut"
      }
    : { 
        type: "spring", 
        duration: 0.4 
      };

  // Padding vertical simétrico: mismo espacio arriba y abajo para que ambos modales se vean igual
  // Usar el máximo entre top y bottom para mantener simetría perfecta
  const topSafeArea = Math.max(insets.top, 16);
  const bottomSafeArea = isStandalone && isIOS ? Math.max(insets.bottom, 34) : 16;
  // Usar el mismo padding arriba y abajo para simetría perfecta
  const verticalPadding = Math.max(topSafeArea, bottomSafeArea, 16);
  
  // Misma altura máxima para todos los modales (Nuevo Ingreso y Nuevo Gasto se ven igual)
  const modalMaxHeight = `calc(100vh - ${verticalPadding * 2}px)`;

  // Renderizar en document.body para escapar del stacking context del Layout
  // y que en móvil el modal quede SIEMPRE por encima del header
  const modalContent = (
    <AnimatePresence>
      {/* Backdrop: hijo directo para que AnimatePresence ejecute exit */}
      {isOpen && (
        <motion.div
          key="floating-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={animationConfig}
          className={`fixed inset-0 z-[9999] ${
            isIOS ? 'bg-gray-900/80' : 'bg-black/70'
          }`}
          style={{
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)',
            top: 0, left: 0, right: 0, bottom: 0
          }}
          onClick={onClose}
        />
      )}
      {isOpen && bottomSheet && (
        <motion.div
          key="floating-modal-sheet"
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          initial={{ y: '100%' }}
          animate={{
            y: sheetClosing ? '100%' : (isDragging ? dragY : 0),
            transition: isDragging
              ? { duration: 0 }
              : sheetClosing
                ? { duration: 0.25, ease: 'easeIn', onComplete: handleSheetCloseAnimationComplete }
                : { duration: 0.3, ease: 'easeOut' }
          }}
          exit={{ y: '100%', transition: { duration: 0.25, ease: 'easeIn' } }}
              className="fixed bottom-0 left-0 right-0 z-[10000] bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl border border-gray-200 dark:border-gray-700 border-b-0 overflow-hidden flex flex-col pointer-events-auto"
              style={{
                maxHeight: '90vh',
                paddingBottom: isStandalone && isIOS ? Math.max(insets.bottom, 20) : 20,
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                WebkitTransform: 'translateZ(0)',
                transform: 'translateZ(0)'
              }}
            >
              <div
                className="flex flex-col items-center cursor-grab active:cursor-grabbing select-none touch-none flex-shrink-0"
                onMouseDown={(e) => { e.preventDefault(); handleBottomSheetDragStart(e.clientY); }}
                onTouchStart={(e) => handleBottomSheetDragStart(e.touches[0].clientY)}
                onTouchMove={(e) => handleBottomSheetDragMove(e.touches[0].clientY)}
                onTouchEnd={handleBottomSheetDragEnd}
              >
                <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-3 mb-2" aria-hidden />
                <div className="w-full flex items-center justify-between px-4 pb-3">
                  <h2 className={`font-semibold text-gray-900 dark:text-white truncate min-w-0 flex-1 ${compactHeader ? 'text-base' : 'text-lg'}`}>
                    {title}
                  </h2>
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onClose(); }}
                      className="flex-shrink-0 flex items-center justify-center p-2 -m-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              <div
                className="overflow-y-auto flex-1 min-h-0 scrollbar-thin"
                style={{ WebkitOverflowScrolling: 'touch' }}
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </div>
            </motion.div>
      )}
      {isOpen && !bottomSheet && (
            /* Modal centrado (comportamiento original) */
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center outline-none pointer-events-none"
              style={{
                paddingTop: `${verticalPadding}px`,
                paddingBottom: `${verticalPadding}px`,
                paddingLeft: `${Math.max(insets.left, 16)}px`,
                paddingRight: `${Math.max(insets.right, 16)}px`,
              }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={animationConfig}
                className="w-full flex items-center justify-center pointer-events-auto"
                style={{
                  height: '100%',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  WebkitTransform: 'translateZ(0)',
                  transform: 'translateZ(0)'
                }}
              >
                <div
                  className={`${sizeClasses[size]} ${formModalDesktopClass} bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    WebkitTransform: 'translateZ(0)',
                    transform: 'translateZ(0)',
                    maxHeight: modalMaxHeight,
                    maxWidth: `calc(100vw - ${Math.max(insets.left, 16) + Math.max(insets.right, 16)}px)`,
                    ...(isIOS && { boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' })
                  }}
                >
                  {showDragHandle && (
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                      <div className="w-12 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" aria-hidden />
                    </div>
                  )}
                  <div className={`relative flex items-center pr-12 flex-shrink-0 ${showDragHandle ? 'pt-2 pb-2' : 'pt-4 pb-2'}`}>
                    <h2 className={`font-semibold text-gray-900 dark:text-white truncate min-w-0 flex-1 ${compactHeader ? 'pl-4 text-base' : 'pl-4 text-lg'}`}>
                      {title}
                    </h2>
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className={`absolute top-0 right-0 flex items-center justify-center transition-colors duration-200 ${
                          closeButtonStyle === 'circle'
                            ? 'p-2 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
                            : 'p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-tr-2xl rounded-bl-lg'
                        }`}
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </button>
                    )}
                  </div>
                  <div
                    className="overflow-y-auto scrollbar-thin pb-4 flex-1 min-h-0"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    {children}
                  </div>
                </div>
              </motion.div>
            </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default FloatingModal;
