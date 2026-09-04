// Utilidades para optimizar animaciones en móviles
export const isMobile = () => {
  return window.innerWidth < 768;
};

export const isReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const getOptimizedTransition = (baseTransition) => {
  if (isReducedMotion()) {
    return { duration: 0.1 };
  }
  
  if (isMobile()) {
    return {
      ...baseTransition,
      duration: Math.min(baseTransition.duration * 0.8, 0.5) // Reducir duración en móviles
    };
  }
  
  return baseTransition;
};

export const getMobileOptimizedVariants = (variants) => {
  if (isMobile()) {
    const mobileVariants = {};
    Object.keys(variants).forEach(key => {
      mobileVariants[key] = {
        ...variants[key],
        transition: getOptimizedTransition(variants[key].transition || { duration: 0.3 })
      };
    });
    return mobileVariants;
  }
  return variants;
};

// Configuración de animaciones optimizadas para diferentes dispositivos
export const animationConfig = {
  // Animaciones más suaves para móviles
  mobile: {
    duration: 0.3,
    ease: "easeOut"
  },
  // Animaciones completas para desktop
  desktop: {
    duration: 0.5,
    ease: "easeInOut"
  }
};

export const getAnimationConfig = () => {
  return isMobile() ? animationConfig.mobile : animationConfig.desktop;
};
