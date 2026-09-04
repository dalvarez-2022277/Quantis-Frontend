import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

const NotificationItem = ({ 
  notification, 
  onRemove, 
  onMarkAsRead, 
  getNotificationIcon 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState(null);
  const dragConstraints = useRef(null);

  const handleDrag = (event, info) => {
    const threshold = 30;
    const offset = info.offset.x;

    // Solo permitir arrastrar hacia la izquierda (valores negativos)
    if (offset < 0 && Math.abs(offset) > threshold) {
      setDragDirection('left');
    } else {
      setDragDirection(null);
    }
  };

  const handleDragEnd = (event, info) => {
    const threshold = 60;
    const offset = info.offset.x;

    // Solo eliminar si se arrastra hacia la izquierda
    if (offset < 0 && Math.abs(offset) > threshold) {
      onRemove(notification.id);
    }
    
    setIsDragging(false);
    setDragDirection(null);
  };

  const isMobile = window.innerWidth < 1024;

  return (
    <motion.div
      ref={dragConstraints}
      className={`py-4 px-4 sm:p-4 min-h-[72px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 group relative overflow-hidden ${
        notification.unread ? 'bg-q-primary-muted' : ''
      } ${isDragging ? 'z-10' : ''}`}
      drag={isMobile ? "x" : false}
      dragConstraints={isMobile ? { left: -200, right: 0 } : {}}
      dragElastic={0.1}
      onDragStart={() => setIsDragging(true)}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Indicador de swipe en móvil */}
      {isMobile && (
        <motion.div
          className="absolute inset-0 bg-q-expense flex items-center justify-center rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: dragDirection === 'left' ? 0.9 : 0,
            x: dragDirection === 'left' ? 0 : -100
          }}
          transition={{ duration: 0.2 }}
        >
          <TrashIcon className="h-6 w-6 text-white" />
        </motion.div>
      )}

      <div className="flex items-start space-x-3 relative z-10">
        <span className="flex-shrink-0 flex items-center justify-center">
          {(() => {
            const { Icon, colorClass } = getNotificationIcon(notification.type);
            return <Icon className={`h-5 w-5 ${colorClass || ''}`} aria-hidden />;
          })()}
        </span>
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onMarkAsRead(notification.id)}
        >
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {notification.title}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {notification.time}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {notification.unread && (
            <div className="w-2 h-2 bg-q-primary rounded-full flex-shrink-0" aria-hidden />
          )}
          {/* Botón eliminar: siempre visible para eliminar manualmente (móvil y desktop) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(notification.id);
            }}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-q-expense active:text-q-expense rounded-lg hover:bg-q-expense-muted min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-colors"
            title="Eliminar notificación"
            aria-label="Eliminar notificación"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

    </motion.div>
  );
};

export default NotificationItem;
