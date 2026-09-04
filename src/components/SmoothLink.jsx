import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * Link mejorado con transiciones suaves para navegación fluida
 */
const SmoothLink = ({ children, className = '', to, ...props }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 25,
        duration: 0.1
      }}
    >
      <Link 
        to={to} 
        className={`transition-all duration-150 ${className}`}
        {...props}
      >
        {children}
      </Link>
    </motion.div>
  );
};

export default SmoothLink;