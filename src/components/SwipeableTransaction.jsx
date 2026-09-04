import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';

const SwipeableTransaction = React.forwardRef(({ 
  children, 
  onEdit, 
  onDelete, 
  onView, 
  onDuplicate,
  className = '',
  editColor = 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
  deleteColor = 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
  /** Texto del segundo botón (p. ej. «Eliminar» o «Reactivar») */
  secondActionLabel = 'Eliminar',
  /** Icono del segundo botón (por defecto papelera) */
  SecondActionIcon = TrashIcon,
}, ref) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const SWIPE_THRESHOLD = 50; // Threshold más pequeño
  const MAX_SWIPE = 100; // Distancia más compacta

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.touches[0].clientX - startX;
    const newX = Math.max(-MAX_SWIPE, Math.min(0, deltaX));
    setCurrentX(newX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (Math.abs(currentX) > SWIPE_THRESHOLD) {
      setIsSwiped(true);
    } else {
      setCurrentX(0);
      setIsSwiped(false);
    }
  };

  const handleMouseDown = (e) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const newX = Math.max(-MAX_SWIPE, Math.min(0, deltaX));
    setCurrentX(newX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (Math.abs(currentX) > SWIPE_THRESHOLD) {
      setIsSwiped(true);
    } else {
      setCurrentX(0);
      setIsSwiped(false);
    }
  };

  const resetSwipe = () => {
    setCurrentX(0);
    setIsSwiped(false);
  };

  const toggleSwipe = () => {
    setIsSwiped(!isSwiped);
    setCurrentX(isSwiped ? 0 : -80);
  };

  // Exponer la función toggle para uso externo
  React.useImperativeHandle(ref, () => ({
    toggleSwipe
  }));

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, currentX]);

  const menuItems = [
    { icon: PencilIcon, label: 'Editar', action: onEdit, color: editColor },
    { icon: SecondActionIcon, label: secondActionLabel, action: onDelete, color: deleteColor }
  ];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Contenido principal */}
      <motion.div
        ref={containerRef}
        className="relative z-10 bg-white dark:bg-gray-800 group"
        style={{ 
          x: currentX,
          // Corrección específica para Safari iOS
          WebkitAppearance: 'none',
          border: 'none',
          outline: 'none'
        }}
        onTouchStart={handleTouchStart}
        onMouseDown={handleMouseDown}
        animate={{ x: isSwiped ? -80 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>

      {/* Menú de acciones mejorado */}
      <AnimatePresence>
        {isSwiped && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-0 top-0 h-full flex items-center space-x-1 pr-2 z-20"
          >
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.button
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (item.action) {
                      item.action();
                    }
                    resetSwipe();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  className={`p-2 ${item.color} transition-all duration-200 transform hover:scale-110 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center`}
                  title={item.label}
                >
                  <IconComponent className="h-5 w-5" />
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay para cerrar el swipe - Solo en el área de la tarjeta */}
      <AnimatePresence>
        {isSwiped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-5"
            onClick={resetSwipe}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

SwipeableTransaction.displayName = 'SwipeableTransaction';

export default SwipeableTransaction;
