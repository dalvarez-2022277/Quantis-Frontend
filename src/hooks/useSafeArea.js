import { useState, useEffect, useRef } from 'react';

/**
 * Hook estilo Flutter SafeArea
 * Detecta safe areas del dispositivo y maneja fallbacks para modo standalone iOS
 * Similar a MediaQuery.paddingOf(context) en Flutter
 */
export const useSafeArea = () => {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Usar refs para acceder a los valores actuales dentro de las funciones
  const standaloneRef = useRef(false);
  const iosRef = useRef(false);

  useEffect(() => {
    // Detectar modo standalone
    const checkStandalone = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        standaloneRef.current = true;
        setIsStandalone(true);
        return true;
      } else {
        standaloneRef.current = false;
        setIsStandalone(false);
        return false;
      }
    };

    // Detectar iOS
    const checkIOS = () => {
      const userAgent = navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      iosRef.current = isIOSDevice;
      setIsIOS(isIOSDevice);
      return isIOSDevice;
    };

    checkStandalone();
    checkIOS();

    // Escuchar cambios en modo standalone
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkStandalone();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleChange);
    }

    // Función para obtener safe area insets
    const getSafeAreaInsets = () => {
      // Crear un elemento temporal para leer valores de env()
      const testEl = document.createElement('div');
      testEl.style.position = 'fixed';
      testEl.style.top = '0';
      testEl.style.left = '0';
      testEl.style.width = '1px';
      testEl.style.height = '1px';
      testEl.style.paddingTop = 'env(safe-area-inset-top, 0px)';
      testEl.style.paddingRight = 'env(safe-area-inset-right, 0px)';
      testEl.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
      testEl.style.paddingLeft = 'env(safe-area-inset-left, 0px)';
      testEl.style.visibility = 'hidden';
      document.body.appendChild(testEl);

      const computedStyle = window.getComputedStyle(testEl);
      
      const top = parseFloat(computedStyle.paddingTop) || 0;
      const right = parseFloat(computedStyle.paddingRight) || 0;
      const bottom = parseFloat(computedStyle.paddingBottom) || 0;
      const left = parseFloat(computedStyle.paddingLeft) || 0;

      document.body.removeChild(testEl);

      // En modo standalone iOS (PWA "agregada a inicio"), env(safe-area-inset-*) suele ser 0 en portrait.
      // Usar fallbacks reales para la barra de estado / Dynamic Island.
      if (standaloneRef.current && iosRef.current && window.innerWidth <= 768) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        // iPhone con notch/Dynamic Island: barra de estado ~47–59px; sin notch ~20px
        const isNotchDevice = (w >= 375 && h >= 812) || (w >= 414 && h >= 896);
        const topFallback = top > 0 ? top : (isNotchDevice ? 47 : 20);
        const bottomFallback = bottom > 0 ? bottom : (isNotchDevice ? 34 : 0); // home indicator
        return {
          top: topFallback,
          right: right > 0 ? right : (isNotchDevice ? 0 : 0),
          bottom: bottomFallback,
          left: left > 0 ? left : (isNotchDevice ? 0 : 0)
        };
      }

      // En modo navegador normal, NO aplicar espacio inferior.
      // En modo standalone (iOS o Android PWA), aplicar bottom para respetar gesture nav / home indicator
      return { 
        top, 
        right, 
        bottom: standaloneRef.current ? bottom : 0,
        left 
      };
    };

    // Obtener insets iniciales
    const updateInsets = () => {
      // Usar requestAnimationFrame para asegurar que el DOM esté listo
      requestAnimationFrame(() => {
        const newInsets = getSafeAreaInsets();
        setInsets(newInsets);
      });
    };

    // Actualizar insets inicialmente
    updateInsets();

    // Actualizar en resize y orientation change
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateInsets, 100);
    });

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []); // Sin dependencias - solo se ejecuta una vez al montar

  return {
    insets,
    isStandalone,
    isIOS,
    // Helpers para acceso rápido
    top: insets.top,
    right: insets.right,
    bottom: insets.bottom,
    left: insets.left
  };
};
