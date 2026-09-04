import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '' 
}) => {
  const sizes = {
    sm: 'max-w-md w-full mx-4',
    md: 'max-w-lg w-full mx-4',
    lg: 'max-w-2xl w-full mx-4',
    xl: 'max-w-4xl w-full mx-4'
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop - Por encima de TODO */}
      <motion.div
        className="fixed inset-0 z-[9999] bg-black bg-opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
          paddingBottom: '0px', // No dejar espacio inferior en modo navegador normal
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
        }}
      >
        {/* Modal */}
        <div className="flex items-center justify-center w-full min-h-full py-4">
          <motion.div
            className={`relative ${sizes[size]} ${className}`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between pt-5 pb-4 px-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="px-6 pb-6 pt-4">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Modal;
