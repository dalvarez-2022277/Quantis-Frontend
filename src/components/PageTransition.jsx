import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children, className = "" }) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 8,
        scale: 0.98
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1
      }}
      exit={{ 
        opacity: 0, 
        y: -8,
        scale: 0.98
      }}
      transition={{
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
