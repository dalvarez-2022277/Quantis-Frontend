import React from 'react';
import { useSafeArea } from '../hooks/useSafeArea';

/**
 * Componente SafeArea estilo Flutter
 * Envuelve contenido y aplica padding según safe areas del dispositivo
 * 
 * Props (similar a Flutter SafeArea):
 * - top: boolean - Aplicar padding superior (default: false)
 * - bottom: boolean - Aplicar padding inferior (default: false)
 * - left: boolean - Aplicar padding izquierdo (default: false)
 * - right: boolean - Aplicar padding derecho (default: false)
 * - all: boolean - Aplicar padding en todos los lados (default: false)
 * - min: object - Valores mínimos de padding {top, bottom, left, right}
 * - children: ReactNode - Contenido a envolver
 * - className: string - Clases CSS adicionales
 * - style: object - Estilos inline adicionales
 */
const SafeArea = ({
  top = false,
  bottom = false,
  left = false,
  right = false,
  all = false,
  min = {},
  children,
  className = '',
  style = {}
}) => {
  const { insets, isStandalone, isIOS } = useSafeArea();

  // Si all es true, aplicar en todos los lados
  const applyTop = all || top;
  const applyBottom = all || bottom;
  const applyLeft = all || left;
  const applyRight = all || right;

  // Calcular padding con valores mínimos
  const paddingTop = applyTop ? Math.max(insets.top, min.top || 0) : 0;
  // Aplicar padding-bottom en modo standalone (iOS o Android PWA) cuando hay inset inferior
  const paddingBottom = applyBottom && isStandalone && insets.bottom > 0 
    ? Math.max(insets.bottom, min.bottom || 0) 
    : 0;
  const paddingLeft = applyLeft ? Math.max(insets.left, min.left || 0) : 0;
  const paddingRight = applyRight ? Math.max(insets.right, min.right || 0) : 0;

  const safeAreaStyle = {
    paddingTop: paddingTop > 0 ? `${paddingTop}px` : undefined,
    paddingBottom: paddingBottom > 0 ? `${paddingBottom}px` : undefined,
    paddingLeft: paddingLeft > 0 ? `${paddingLeft}px` : undefined,
    paddingRight: paddingRight > 0 ? `${paddingRight}px` : undefined,
    ...style
  };

  return (
    <div className={className} style={safeAreaStyle}>
      {children}
    </div>
  );
};

export default SafeArea;
