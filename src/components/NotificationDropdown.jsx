import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  XMarkIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import NotificationItem from './NotificationItem';
import { useAuthContext } from '../contexts/AuthContext';
import { useSafeArea } from '../hooks/useSafeArea';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { top: safeTop, right: safeRight, bottom: safeBottom, left: safeLeft } = useSafeArea();
  const {
    notifications,
    removeNotification,
    markAsRead,
    notificationPermission,
    requestNotificationPermission,
  } = useAuthContext();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  // Al abrir el modal, si no hay permiso del navegador, pedirlo
  useEffect(() => {
    if (!isOpen || notificationPermission !== 'default') return;
    const t = setTimeout(() => requestNotificationPermission(), 400);
    return () => clearTimeout(t);
  }, [isOpen, notificationPermission, requestNotificationPermission]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return { Icon: CheckCircleIcon, colorClass: 'text-emerald-500 dark:text-emerald-400' };
      case 'warning':
        return { Icon: ExclamationTriangleIcon, colorClass: 'text-amber-500 dark:text-amber-400' };
      case 'info':
        return { Icon: InformationCircleIcon, colorClass: 'text-q-primary' };
      case 'error':
        return { Icon: ExclamationTriangleIcon, colorClass: 'text-q-expense' };
      default:
        return { Icon: BellIcon, colorClass: 'text-gray-500 dark:text-gray-400' };
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleRequestPermission = async () => {
    await requestNotificationPermission();
  };

  const panelContent = (
    <>
      {/* Header: título centrado, X alineada a la derecha */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[52px]">
        <div className="w-10 min-w-[40px] flex-shrink-0" aria-hidden />
        <h3 className="flex-1 text-center text-base font-semibold text-gray-900 dark:text-white">
          Notificaciones
        </h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex-shrink-0 p-2 -mr-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation"
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Pedir permisos del navegador: solo si aún no se ha preguntado (no mostrar si está denegado) */}
      {notificationPermission === 'default' && (
        <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-q-primary-muted">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-q-primary-muted flex items-center justify-center">
              <BellAlertIcon className="h-5 w-5 text-q-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Notificaciones del navegador
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Actívalas para recibir avisos aunque no tengas la app abierta.
              </p>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="mt-3 w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-white bg-q-primary hover:bg-q-primary rounded-xl transition-colors min-h-[44px] touch-manipulation"
              >
                Permitir notificaciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <AnimatePresence initial={false}>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRemove={removeNotification}
                  onMarkAsRead={markAsRead}
                  getNotificationIcon={getNotificationIcon}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
            <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <BellIcon className="h-8 w-8 sm:h-7 sm:w-7 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
              No hay notificaciones
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[280px] mx-auto">
              Te notificaremos cuando tengas actualizaciones.
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation cursor-pointer"
        onTouchStart={(e) => {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label="Notificaciones"
        aria-expanded={isOpen}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-q-expense text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Móvil: modal a pantalla completa, tapa todo y funciona como vista de notificaciones */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[200] lg:hidden flex flex-col bg-white dark:bg-gray-800 theme-transition"
              style={{
                paddingTop: safeTop,
                paddingLeft: safeLeft,
                paddingRight: safeRight,
                paddingBottom: safeBottom,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                className="flex flex-col flex-1 min-h-0 overflow-hidden"
              >
                {panelContent}
              </motion.div>
            </motion.div>

            {/* Desktop: dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="hidden lg:flex lg:flex-col lg:absolute lg:right-0 lg:mt-2 lg:w-96 lg:max-h-[85vh] lg:min-h-0 lg:bg-white dark:lg:bg-gray-800 lg:rounded-2xl lg:shadow-xl lg:border lg:border-gray-200 dark:lg:border-gray-700 lg:z-50 lg:overflow-hidden theme-transition"
            >
              {panelContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
