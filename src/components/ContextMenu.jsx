import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

const ContextMenu = ({ 
  onEdit, 
  onDelete, 
  onView, 
  onDuplicate,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  const menuItems = [
    { icon: EyeIcon, label: 'Ver', action: onView, color: 'text-q-primary hover:text-q-primary' },
    { icon: PencilIcon, label: 'Editar', action: onEdit, color: 'text-q-income hover:text-q-income' },
    { icon: DocumentDuplicateIcon, label: 'Duplicar', action: onDuplicate, color: 'text-purple-600 hover:text-purple-800' },
    { icon: TrashIcon, label: 'Eliminar', action: onDelete, color: 'text-q-expense hover:text-q-expense' }
  ].filter(item => item.action); // Solo mostrar items que tienen acción

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation cursor-pointer"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
          >
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2 min-h-[44px] text-sm touch-manipulation cursor-pointer ${item.color} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContextMenu;




