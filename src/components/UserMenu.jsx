import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { getAvatarUrl } from '../api/api';

const UserMenu = React.memo(({ user, onLogout, imageTimestamp, onFeedbackClick, showAdminFeedback }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Debug: Log cuando cambie el usuario o timestamp
  useEffect(() => {
    // Log removido para producción
  }, [user?.profileImage, imageTimestamp]);

  // Cerrar menú al hacer click/touch fuera (pointerdown para mejor detección en iOS)
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

  const handleProfileClick = useCallback(() => {
    navigate('/profile');
    setIsOpen(false);
  }, [navigate]);

  const handleSettingsClick = useCallback(() => {
    navigate('/ajustes');
    setIsOpen(false);
  }, [navigate]);

  const handleFeedbackClick = useCallback(() => {
    onFeedbackClick?.();
    setIsOpen(false);
  }, [onFeedbackClick]);

  const handleAdminFeedbackClick = useCallback(() => {
    navigate('/admin/feedback');
    setIsOpen(false);
  }, [navigate]);

  const handleAboutClick = useCallback(() => {
    navigate('/acerca');
    setIsOpen(false);
  }, [navigate]);

  const handleLogoutClick = useCallback(() => {
    onLogout();
    setIsOpen(false);
  }, [onLogout]);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón del usuario */}
      <button
        type="button"
        onClick={toggleMenu}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 min-h-[44px] min-w-[44px] touch-manipulation cursor-pointer justify-center"
        onTouchStart={(e) => {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onTouchCancel={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="h-8 w-8 rounded-full bg-q-primary flex items-center justify-center overflow-hidden flex-shrink-0">
          {user?.profileImage ? (
            <img
              key={`${user.profileImage}-${imageTimestamp}`}
              src={getAvatarUrl(user.profileImage, imageTimestamp)}
              alt="Foto de perfil"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <ChevronDownIcon className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú desplegable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            {/* Header del menú */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>

            {/* Items del menú */}
            <div className="py-2">
              {/* Mi Perfil */}
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <UserIcon className="h-4 w-4 mr-3" />
                Mi Perfil
              </button>

              {/* Configuración */}
              <button
                onClick={handleSettingsClick}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Cog6ToothIcon className="h-4 w-4 mr-3" />
                Configuración
              </button>

              {onFeedbackClick && (
                <button
                  type="button"
                  onClick={handleFeedbackClick}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-3" />
                  Feedback
                </button>
              )}

              {showAdminFeedback && (
                <button
                  type="button"
                  onClick={handleAdminFeedbackClick}
                  className="w-full flex items-center px-4 py-2 text-sm text-q-primary dark:text-q-primary hover:bg-q-primary/5 dark:hover:bg-q-primary/10 transition-colors duration-200"
                >
                  <ShieldCheckIcon className="h-4 w-4 mr-3" />
                  Feedback
                </button>
              )}

              <button
                type="button"
                onClick={handleAboutClick}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <InformationCircleIcon className="h-4 w-4 mr-3" />
                Acerca de
              </button>

              {/* Cerrar Sesión */}
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center px-4 py-2 text-sm text-q-expense hover:bg-q-expense-muted transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

UserMenu.displayName = 'UserMenu';

export default UserMenu;
