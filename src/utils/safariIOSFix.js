/**
 * Utilidades para corregir problemas específicos de Safari iOS
 * Incluye correcciones para bordes negros temporales durante animaciones
 */

/**
 * Detecta si el usuario está en Safari iOS
 * @returns {boolean} true si está en Safari iOS
 */
export const isSafariIOS = () => {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const chrome = /CriOS|Chrome/.test(ua);
  
  return iOS && webkit && !chrome;
};

/**
 * Aplica estilos de corrección para Safari iOS
 * @param {HTMLElement} element - Elemento al que aplicar los estilos
 */
export const applySafariIOSFix = (element) => {
  if (!isSafariIOS() || !element) return;
  
  // Aplicar estilos específicos para Safari iOS
  element.style.webkitAppearance = 'none';
  element.style.border = 'none';
  element.style.outline = 'none';
  element.style.webkitTapHighlightColor = 'transparent';
};

/**
 * Aplica correcciones a todos los elementos animados
 */
export const fixAnimatedElements = () => {
  if (!isSafariIOS()) return;
  
  // Buscar todos los elementos con clases de animación
  const animatedElements = document.querySelectorAll([
    '.animate-spin',
    '.animate-spin-slow', 
    '.animate-spin-limited',
    '[class*="animate-"]',
    '[data-framer-motion]'
  ].join(','));
  
  animatedElements.forEach(element => {
    applySafariIOSFix(element);
  });
  
  // Buscar elementos con backgrounds que podrían tener bordes negros
  const backgroundElements = document.querySelectorAll([
    '.bg-white',
    '.dark\\:bg-gray-800',
    '[class*="bg-white"]',
    '[class*="bg-gray"]'
  ].join(','));
  
  backgroundElements.forEach(element => {
    applySafariIOSFix(element);
  });
};

/**
 * Inicializa las correcciones para Safari iOS
 * Se debe llamar cuando el DOM esté listo
 */
export const initSafariIOSFix = () => {
  if (!isSafariIOS()) return;
  
  // Aplicar correcciones inmediatamente
  fixAnimatedElements();
  
  // Aplicar correcciones cuando se agreguen nuevos elementos
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          applySafariIOSFix(node);
          
          // Aplicar a elementos hijos también
          const children = node.querySelectorAll('*');
          children.forEach(child => applySafariIOSFix(child));
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Limpiar observer cuando se desmonte
  return () => observer.disconnect();
};

/**
 * Hook para usar en componentes React
 * Aplica correcciones automáticamente
 */
export const useSafariIOSFix = () => {
  const [isIOS, setIsIOS] = React.useState(false);
  
  React.useEffect(() => {
    const ios = isSafariIOS();
    setIsIOS(ios);
    
    if (ios) {
      const cleanup = initSafariIOSFix();
      return cleanup;
    }
  }, []);
  
  return isIOS;
};

export default {
  isSafariIOS,
  applySafariIOSFix,
  fixAnimatedElements,
  initSafariIOSFix,
  useSafariIOSFix
};
