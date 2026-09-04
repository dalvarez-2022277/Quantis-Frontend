import React from 'react';

const QuantisLogo = ({ size = 32, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      className={className}
    >
      {/* Círculo azul de la Q */}
      <circle 
        cx="16" 
        cy="16" 
        r="12" 
        fill="#1e40af" 
        stroke="none"
      />
      {/* Abertura en la parte inferior derecha */}
      <path 
        d="M 16 4 A 12 12 0 0 1 28 16 L 24 16 A 8 8 0 0 0 16 8 Z" 
        fill="white" 
      />
      {/* Rabo verde */}
      <path 
        d="M 20 20 L 26 26 L 28 24 L 22 18 Z" 
        fill="#10b981" 
      />
      <circle 
        cx="26" 
        cy="26" 
        r="2" 
        fill="#10b981" 
      />
    </svg>
  );
};

export default QuantisLogo;
