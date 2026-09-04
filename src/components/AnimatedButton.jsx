import React from 'react';
import { motion } from 'framer-motion';
import { getAnimationConfig, isMobile } from '../utils/animations';

const AnimatedButton = ({ 
  children, 
  type = "button", 
  disabled = false, 
  loading = false,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  ...props 
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300",
    danger: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl font-medium transition-all duration-300
        ${variants[variant]}
        ${sizes[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={!disabled && !loading && !isMobile() ? { 
        scale: 1.05,
        y: -2
      } : {}}
      whileTap={!disabled && !loading ? { 
        scale: 0.98 
      } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={getAnimationConfig()}
      {...props}
    >
      {/* Efecto de brillo que se mueve */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
        animate={{
          x: loading ? [0, 200, 0] : 0,
          opacity: loading ? [0, 0.3, 0] : 0
        }}
        transition={{
          duration: 1.5,
          repeat: loading ? Infinity : 0,
          ease: "easeInOut"
        }}
        style={{
          transform: 'skewX(-20deg)',
          width: '200%'
        }}
      />
      
      {/* Contenido del botón */}
      <div className="relative flex items-center justify-center space-x-2">
        {loading && (
          <motion.div
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
        <span>{children}</span>
      </div>
      
      {/* Efecto de ondas al hacer clic */}
      <motion.div
        className="absolute inset-0 bg-white rounded-xl"
        initial={{ scale: 0, opacity: 0.5 }}
        whileTap={{ 
          scale: 1.5, 
          opacity: 0 
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
};

export default AnimatedButton;
