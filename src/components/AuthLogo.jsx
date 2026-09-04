import React from 'react';

/**
 * Logo de Quantis para pantallas de auth (login, registro, forgot/reset password).
 * Usa el icono /assets/logos/Quantisicon.png
 */
const AuthLogo = ({ size = 44, className = '' }) => (
  <img
    src="/assets/logos/Quantisicon.png"
    alt="Quantis"
    width={size}
    height={size}
    className={`flex-shrink-0 object-contain ${className}`}
  />
);

export default AuthLogo;
