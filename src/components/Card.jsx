import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  onClick,
  ...props 
}) => {
  const baseClasses = "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700";
  const hoverClasses = hover ? "hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200" : "";
  const clickableClasses = onClick ? "cursor-pointer" : "";
  
  const combinedClasses = `${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`;

  if (onClick) {
    return (
      <motion.div
        className={combinedClasses}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};

export default Card;
