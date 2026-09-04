import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';
import NotificationDropdown from './NotificationDropdown';
import UserMenu from './UserMenu';
import FeedbackModal from './FeedbackModal';
import QuantisLogo from './QuantisLogo';
import { isSuperAdmin } from '../utils/authPermissions';
import { useSafeArea } from '../hooks/useSafeArea';
import {
  HomeIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  BuildingLibraryIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { APP_NAME, getCopyrightLine } from '../config/appMeta';
import HeaderTwoRows, { getSectionNavItems } from './HeaderTwoRows';
import BottomNav from './BottomNav';

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { user, logout, imageTimestamp, notificationPermission, requestNotificationPermission } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { insets, isStandalone, isIOS } = useSafeArea();

  // Pedir permiso de notificaciones al entrar a la app (solo si aún no se ha preguntado)
  useEffect(() => {
    if (notificationPermission === 'default') {
      requestNotificationPermission();
    }
  }, [notificationPermission, requestNotificationPermission]);

  const navigation = useMemo(() => [
    { name: 'Inicio', href: '/dashboard', icon: HomeIcon, exact: true },
    { name: 'Transacciones', href: '/transacciones/ingresos', pathPrefix: '/transacciones', icon: CurrencyDollarIcon, exact: false },
    { name: 'Calendario', href: '/calendario', icon: CalendarDaysIcon, exact: true },
    { name: 'Finanzas', href: '/finanzas/cuotas', pathPrefix: '/finanzas', icon: BuildingLibraryIcon, exact: false }
  ], []);

  const handleLogout = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const confirmLogout = useCallback(() => {
    logout();
    navigate('/login');
    setShowLogoutModal(false);
  }, [logout, navigate]);

  const isCurrentPath = useCallback((item) => {
    const path = location.pathname;
    if (item.exact) return path === item.href;
    if (item.pathPrefix) return path.startsWith(item.pathPrefix);
    return path === item.href || path.startsWith(item.href + '/');
  }, [location.pathname]);

  return (
    <div className="flex bg-gray-50 dark:bg-gray-900 h-screen min-h-screen overflow-hidden">
      {/* Sidebar desktop - Retráctil (móvil usa BottomNav) */}
      <motion.div 
        className="hidden lg:flex lg:flex-shrink-0 border-r border-gray-200 dark:border-gray-700 z-30"
        animate={{ width: sidebarCollapsed ? 64 : 288 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ overflow: 'hidden' }}
      >
        <div className="flex flex-col w-full h-full min-h-0">
          <div className="flex flex-col h-full min-h-0 flex-1 bg-white dark:bg-gray-800 overflow-hidden">
            {/* Header desktop */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-600 h-16">
              <motion.div
                className="flex items-center h-8"
                animate={{ 
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  width: sidebarCollapsed ? "100%" : "auto"
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="h-8 w-8 flex items-center justify-center hover:opacity-80 transition-opacity duration-200 group"
                  title={sidebarCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {sidebarCollapsed ? (
                    <img 
                      src="/assets/logos/Quantisicon.png" 
                      alt="Quantis Logo" 
                      className="h-8 w-8"
                    />
                  ) : (
                    <XMarkIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                </motion.button>
                <motion.span 
                  className="ml-2 text-xl font-bold text-gray-900 dark:text-white"
                  animate={{ 
                    opacity: sidebarCollapsed ? 0 : 1,
                    width: sidebarCollapsed ? 0 : "auto",
                    marginLeft: sidebarCollapsed ? 0 : 8
                  }}
                  transition={{ duration: 0.3 }}
                >
                  Quantis
                </motion.span>
              </motion.div>
            </div>

            {/* Navegación desktop */}
            <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto overflow-x-hidden min-h-0" style={{ overscrollBehavior: 'contain' }}>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isCurrentPath(item);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-q-primary text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    } group flex items-center px-3 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 min-h-[48px] cursor-pointer touch-manipulation ${
                      sidebarCollapsed ? 'justify-center' : ''
                    }`}
                    title={sidebarCollapsed ? item.name : ''}
                    onTouchEnd={(e) => {
                      if (e.changedTouches?.length) {
                        e.preventDefault();
                        navigate(item.href);
                      }
                    }}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'} ${sidebarCollapsed ? '' : 'mr-3'}`} />
                    {!sidebarCollapsed && <span className="flex-1">{item.name}</span>}
                  </Link>
                );
              })}
            </nav>

            <footer className="shrink-0 border-t border-gray-200 dark:border-gray-700 px-2 py-3 bg-white dark:bg-gray-800">
              {sidebarCollapsed ? (
                <Link
                  to="/acerca"
                  className="flex justify-center p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-q-primary dark:hover:text-q-primary transition-colors"
                  title={`Acerca de ${APP_NAME}`}
                  aria-label={`Acerca de ${APP_NAME}`}
                >
                  <InformationCircleIcon className="h-5 w-5" />
                </Link>
              ) : (
                <div className="px-2 space-y-2">
                  <p className="text-[10px] leading-snug text-gray-400 dark:text-gray-500">
                    {getCopyrightLine()}
                  </p>
                  <Link
                    to="/acerca"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-q-primary hover:underline"
                  >
                    <InformationCircleIcon className="h-3.5 w-3.5" />
                    Acerca de
                  </Link>
                </div>
              )}
            </footer>

          </div>
        </div>
      </motion.div>

      {/* Contenido principal */}
      <div className="flex flex-col w-0 flex-1 min-h-0">
        {/* Header móvil - Fondo hasta el borde; safe area solo como espacio arriba del contenido */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
          {/* Espacio para notch/status bar en PWA iOS */}
          {insets.top > 0 && <div style={{ height: insets.top }} aria-hidden="true" />}
          <div className="flex items-center justify-between px-3 pl-3 pr-4 py-3 h-14 min-h-[56px]">
            <div className="flex items-center gap-2 min-w-0">
              <img src="/assets/logos/Quantisicon.png" alt="Quantis" className="h-8 w-8 flex-shrink-0" />
              <span className="font-bold text-gray-900 dark:text-white truncate">Quantis</span>
            </div>
            <div className="flex items-center justify-end gap-1 sm:gap-3 min-w-0">
              <NotificationDropdown />
              <UserMenu
                user={user}
                onLogout={handleLogout}
                imageTimestamp={imageTimestamp}
                onFeedbackClick={() => setShowFeedbackModal(true)}
                showAdminFeedback={isSuperAdmin(user)}
              />
            </div>
          </div>
        </div>

        {/* Header desktop (row 1) */}
        <div className={`hidden lg:block fixed top-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm ${sidebarCollapsed ? 'left-16' : 'left-72'}`}>
          <div className="flex items-center justify-between px-6 py-4 h-16">
            <div></div>
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              <UserMenu
                user={user}
                onLogout={handleLogout}
                imageTimestamp={imageTimestamp}
                onFeedbackClick={() => setShowFeedbackModal(true)}
                showAdminFeedback={isSuperAdmin(user)}
              />
            </div>
          </div>
        </div>
        {/* Barra de tabs secundaria (Ingresos/Gastos o Cuotas/Cuentas en Finanzas) — visible en navegador y en PWA iOS */}
        <HeaderTwoRows
          sidebarCollapsed={sidebarCollapsed}
          topOffset={isStandalone && isIOS ? insets.top + 56 : undefined}
        />

        {/* Contenido (id para scroll-to-top al cambiar de ruta) */}
        <div id="main-content-scroll" className="flex-1 relative focus:outline-none overflow-y-auto min-h-0">
          <main
            className="min-h-full w-full px-4 sm:px-6 lg:px-8 box-border main-with-bottom-nav"
            style={{
              paddingTop: (() => {
                const hasSectionNav = getSectionNavItems(location.pathname).length > 0;
                const sectionNavHeight = hasSectionNav ? 48 : 0;
                if (isStandalone && isIOS) {
                  return `${insets.top + 56 + sectionNavHeight}px`;
                }
                return hasSectionNav
                  ? 'calc(var(--header-height) + var(--section-nav-height))'
                  : 'var(--header-height)';
              })(),
            }}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Barra inferior móvil / PWA iOS (menu abajo) */}
      <BottomNav />

      {/* Modal de confirmación de logout */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Cerrar sesión"
        message="¿Seguro que deseas cerrar sesión?"
        confirmText="Sí, cerrar sesión"
        cancelText="Cancelar"
        variant="danger"
        showIcon={true}
      />

      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </div>
  );
};

export default Layout;
