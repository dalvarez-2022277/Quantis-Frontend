import React from 'react';
import { motion } from 'framer-motion';

const ActionButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  icon: Icon,
  onClick,
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseClasses = "flex items-center justify-center font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 focus:ring-gray-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500"
  };
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base"
  };
  
  const disabledClasses = disabled 
    ? "opacity-50 cursor-not-allowed" 
    : "";
  
  const combinedClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`;

  return (
    <motion.button
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      {...props}
    >
      {Icon && (
        <Icon className={`h-4 w-4 ${children ? 'mr-2' : ''}`} />
      )}
      {children}
    </motion.button>
  );
};

export default ActionButton;
