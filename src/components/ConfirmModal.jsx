import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

/**
 * Modal de confirmación con diseño limpio tipo iOS:
 * tarjeta centrada, título, mensaje, icono opcional y botones apilados (Cancelar / Confirmar).
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message = '¿Estás seguro de que deseas continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  showIcon = false,
  elevated = false,
  singleButton = false,
  confirmDisabled = false,
}) => {
  if (!isOpen) return null;
  /* Por encima de FloatingModal (z-[10000]) para que confirmar eliminar no quede tapado */
  const zClass = elevated ? 'z-[10050]' : 'z-[9998]';
  const zContentClass = elevated ? 'z-[10050]' : 'z-[9999]';

  const confirmStyles = {
    danger: 'text-q-expense font-medium active:bg-q-expense-muted',
    warning: 'text-amber-600 dark:text-amber-400 font-medium active:bg-amber-50 dark:active:bg-amber-900/20',
    info: 'text-q-primary font-medium active:bg-q-primary-muted',
    success: 'text-q-income font-medium active:bg-q-income-muted',
  };
  const confirmClass = confirmStyles[variant] || confirmStyles.danger;

  const iconStyles = {
    danger: 'bg-q-expense-muted text-q-expense',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    info: 'bg-q-primary-muted text-q-primary',
    success: 'bg-q-income-muted text-q-income',
  };
  const iconClass = iconStyles[variant] || iconStyles.danger;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {/* Cada hijo directo necesita key única (evita "same key ``") */}
      <motion.div
        key="confirm-modal-backdrop"
        className={`fixed inset-0 ${zClass} bg-black/45 backdrop-blur-sm`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleBackdropClick}
      />
      <motion.div
        key="confirm-modal-panel"
        initial={{ scale: 0.78, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.78, opacity: 0 }}
        transition={{
          duration: 0.22,
          ease: [0.32, 0.72, 0, 1]
        }}
        className={`fixed inset-0 ${zContentClass} flex items-center justify-center p-4 pointer-events-none`}
      >
        <div
          className="w-full max-w-[320px] pointer-events-auto bg-white dark:bg-gray-800 rounded-[14px] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icono opcional */}
          {showIcon && (
            <div className="flex justify-center pt-6 pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.08, duration: 0.18, type: 'spring', stiffness: 250, damping: 18 }}
                className="w-[50px] h-[50px] rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'transparent' }}
              >
                <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center ${iconClass}`}>
                  <ArrowRightOnRectangleIcon className="w-7 h-7" />
                </div>
              </motion.div>
            </div>
          )}

          {/* Contenido - mismo espaciado que LogoutConfirmation (título centrado, mensaje con ?) */}
          <div className="px-6 pt-6 pb-2">
            <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white text-center leading-tight">
              {title}
            </h3>
            {message ? (
              <p className="text-[13px] text-gray-600 dark:text-gray-300 text-center mt-2 leading-relaxed">
                {message}
              </p>
            ) : null}
          </div>

          {/* Botones estilo iOS */}
          <div className="flex flex-col mt-4 border-t border-gray-200 dark:border-gray-700">
            {singleButton ? (
              <button
                type="button"
                onClick={onClose}
                className={`w-full px-4 py-3.5 text-[17px] ${confirmClass} transition-colors active:bg-gray-100 dark:active:bg-gray-700`}
              >
                {confirmText}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={confirmDisabled}
                  className={`w-full px-4 py-3.5 text-[17px] ${confirmClass} transition-colors active:bg-gray-100 dark:active:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none`}
                >
                  {confirmText}
                </button>
                <div className="h-[1px] bg-gray-200 dark:bg-gray-700 mx-4" />
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-3.5 text-[17px] text-q-primary font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
                >
                  {cancelText}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmModal;
