import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AnimatedInput = ({ 
  label, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
  error = false,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      <motion.label 
        className="block text-sm font-medium text-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {label}
      </motion.label>
      
      <motion.div 
        className="relative"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <motion.input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 rounded-xl border-2 transition-all duration-300
            ${Icon ? 'pl-10' : 'pl-4'}
            ${RightIcon ? 'pr-10' : 'pr-4'}
            ${error 
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
              : isFocused 
                ? 'border-blue-500 bg-blue-50 focus:border-blue-500 focus:ring-blue-500' 
                : 'border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            text-gray-900 placeholder-gray-500
          `}
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          {...props}
        />
        
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
          >
            <RightIcon className="h-5 w-5 text-gray-400" />
          </button>
        )}
        
        {/* Efecto de brillo en el borde */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isFocused ? 1 : 0,
            scale: isFocused ? 1.05 : 1
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent)',
            border: '2px solid transparent',
            backgroundClip: 'padding-box'
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default AnimatedInput;
