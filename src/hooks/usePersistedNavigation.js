import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePersistence } from '../contexts/PersistenceContext';

/**
 * Hook personalizado para navegación con persistencia de estado
 */
export const usePersistedNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveStateBeforeNavigation, getTemporaryData, clearTemporaryData } = usePersistence();

  // Navegar guardando el estado actual
  const navigateWithState = useCallback((to, state = null) => {
    // Guardar estado de la ruta actual antes de navegar
    if (state) {
      saveStateBeforeNavigation(location.pathname, state);
    }
    
    navigate(to);
  }, [navigate, location.pathname, saveStateBeforeNavigation]);

  // Navegar hacia atrás restaurando estado
  const navigateBack = useCallback((fallbackRoute = '/dashboard') => {
    const state = getTemporaryData(`route_${location.pathname}`);
    if (state) {
      // Restaurar estado si existe
      return state;
    }
    
    // Si no hay estado guardado, navegar a la ruta de fallback
    navigate(fallbackRoute);
    return null;
  }, [navigate, location.pathname, getTemporaryData]);

  // Limpiar estado de la ruta actual
  const clearCurrentRouteState = useCallback(() => {
    clearTemporaryData(`route_${location.pathname}`);
  }, [location.pathname, clearTemporaryData]);

  // Navegar con reemplazo (no guarda en historial)
  const navigateReplace = useCallback((to, state = null) => {
    if (state) {
      saveStateBeforeNavigation(location.pathname, state);
    }
    navigate(to, { replace: true });
  }, [navigate, location.pathname, saveStateBeforeNavigation]);

  return {
    navigate: navigateWithState,
    navigateBack,
    navigateReplace,
    clearCurrentRouteState,
    currentPath: location.pathname
  };
};
