import React, { useCallback, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  BuildingLibraryIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  BuildingLibraryIcon as BuildingLibraryIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid';
import { useSafeArea } from '../hooks/useSafeArea';


// 2 + Inicio al centro + 2: simétrico
const leftItems = [
  { name: 'Calendario', href: '/calendario', icon: CalendarDaysIcon, iconActive: CalendarDaysIconSolid, exact: true },
  { name: 'Transacciones', href: '/transacciones/ingresos', pathPrefix: '/transacciones', icon: CurrencyDollarIcon, iconActive: CurrencyDollarIconSolid }
];

const centerItem = { name: 'Inicio', href: '/dashboard', pathPrefix: '/dashboard', icon: HomeIcon, iconActive: HomeIconSolid, exact: true };

const rightItems = [
  { name: 'Finanzas', href: '/finanzas/cuotas', pathPrefix: '/finanzas', icon: BuildingLibraryIcon, iconActive: BuildingLibraryIconSolid },
  { name: 'Ajustes', href: '/ajustes', pathPrefix: '/ajustes', icon: Cog6ToothIcon, iconActive: Cog6ToothIconSolid, exact: true }
];

/** Resalte según subruta: ingresos/gastos y cuotas/cuentas usan colores de tema */
const highlightTextClass = (itemName, pathname) => {
  if (itemName === 'Transacciones') {
    if (pathname.includes('/transacciones/gastos')) return 'text-q-expense';
    if (pathname.includes('/transacciones/ingresos')) return 'text-q-income';
  }
  if (itemName === 'Finanzas') {
    if (pathname.includes('/finanzas/cuotas')) return 'text-q-expense';
    if (pathname.includes('/finanzas/cuentas')) return 'text-q-primary';
  }
  return 'text-q-primary';
};

const NavButton = ({ item, active, showReloadIcon, onClick, highlightClass }) => {
  const Icon = showReloadIcon ? ArrowPathIcon : (active ? item.iconActive : item.icon);
  const isHighlighted = active || showReloadIcon;
  const activeTone = highlightClass || 'text-q-primary';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1
        transition-colors duration-200 touch-manipulation
        ${isHighlighted ? activeTone : 'text-gray-500 dark:text-gray-400'}
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      aria-current={active ? 'page' : undefined}
      aria-label={showReloadIcon ? `Recargar ${item.name}` : item.name}
    >
      <Icon className="h-6 w-6 flex-shrink-0" aria-hidden />
      <span className={`text-[10px] sm:text-xs font-medium truncate max-w-full ${isHighlighted ? 'font-semibold' : ''}`}>
        {showReloadIcon ? 'Recargar' : item.name}
      </span>
    </button>
  );
};

// Estado del "recargar": guardamos href del ítem y su pathPrefix para saber si seguimos en la misma sección
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { insets } = useSafeArea();
  const [pendingReload, setPendingReload] = useState(null); // { href, pathPrefix } | null

  const isActive = useCallback((item) => {
    const path = location.pathname;
    if (item.exact) return path === item.href;
    if (item.pathPrefix) return path.startsWith(item.pathPrefix);
    return path === item.href || path.startsWith(item.href + '/');
  }, [location.pathname]);

  // Solo quitar "recargar" cuando salimos de la sección (p. ej. de /transacciones/gastos a /dashboard)
  // Si tenemos pathPrefix, estamos "en la sección" en cualquier subruta (/transacciones/ingresos, /transacciones/gastos, etc.)
  useEffect(() => {
    if (!pendingReload) return;
    const path = location.pathname;
    const stillInSection = pendingReload.pathPrefix
      ? path.startsWith(pendingReload.pathPrefix)
      : (path === pendingReload.href || path.startsWith(pendingReload.href + '/'));
    if (!stillInSection) setPendingReload(null);
  }, [location.pathname, pendingReload]);

  const handleNavClick = useCallback((item, active) => {
    if (active) {
      if (pendingReload && pendingReload.href === item.href) {
        setPendingReload(null);
        window.location.reload(); // recarga manteniendo la ruta actual (ej. /transacciones/gastos)
        return;
      }
      setPendingReload({ href: item.href, pathPrefix: item.pathPrefix || null });
      return;
    }
    setPendingReload(null);
    navigate(item.href);
  }, [navigate, pendingReload]);

  const renderItem = (item) => {
    const active = isActive(item);
    const showReloadIcon = active && pendingReload && pendingReload.href === item.href;
    const highlightClass =
      active && (item.name === 'Transacciones' || item.name === 'Finanzas')
        ? highlightTextClass(item.name, location.pathname)
        : 'text-q-primary';
    return (
      <NavButton
        key={item.name}
        item={item}
        active={active}
        showReloadIcon={showReloadIcon}
        onClick={() => handleNavClick(item, active)}
        highlightClass={highlightClass}
      />
    );
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{
        paddingBottom: `max(0.5rem, ${insets.bottom}px)`,
      }}
      aria-label="Navegación principal"
    >
      <div className="grid grid-cols-5 items-end h-16 pt-2 gap-0">
        {/* Izquierda: 2 */}
        <div className="col-span-2 flex justify-around items-stretch min-w-0">
          {leftItems.map((item) => renderItem(item))}
        </div>
        {/* Centro: Inicio elevado */}
        <div className="col-span-1 flex justify-center items-end pb-1 min-w-0">
          {(() => {
            const centerActive = isActive(centerItem);
            const centerShowReload = pendingReload && pendingReload.href === centerItem.href;
            const centerHighlighted = centerActive || centerShowReload;
            return (
              <button
                type="button"
                onClick={() => handleNavClick(centerItem, centerActive)}
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  -mt-8 shadow-[0_4px_14px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]
                  border-[3px] border-white dark:border-gray-800
                  touch-manipulation transition-colors duration-200 transition-transform active:scale-95
                  ${centerHighlighted
                    ? 'bg-q-primary text-white'
                    : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                  }
                `}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-current={centerActive ? 'page' : undefined}
                aria-label={centerShowReload ? 'Recargar Inicio' : 'Inicio'}
              >
                {centerShowReload ? (
                  <ArrowPathIcon className="h-8 w-8 flex-shrink-0" aria-hidden />
                ) : (
                  <HomeIconSolid className="h-8 w-8 flex-shrink-0" aria-hidden />
                )}
              </button>
            );
          })()}
        </div>
        {/* Derecha: 2 (Finanzas, Ajustes) */}
        <div className="col-span-2 flex justify-around items-stretch min-w-0">
          {rightItems.map((item) => renderItem(item))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
