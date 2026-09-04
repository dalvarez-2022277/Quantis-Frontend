import React from 'react';
import { motion } from 'framer-motion';

const ToggleSwitch = ({ 
  isOn, 
  onToggle, 
  color = 'green',
  size = 'md',
  disabled = false,
  label = '',
  description = ''
}) => {
  const colors = {
    green: {
      on: 'bg-green-500',
      off: 'bg-gray-300 dark:bg-gray-600',
      thumb: 'bg-white'
    },
    red: {
      on: 'bg-red-500',
      off: 'bg-gray-300 dark:bg-gray-600',
      thumb: 'bg-white'
    },
    blue: {
      on: 'bg-blue-500',
      off: 'bg-gray-300 dark:bg-gray-600',
      thumb: 'bg-white'
    }
  };

  const sizes = {
    sm: {
      container: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'translate-x-4'
    },
    md: {
      container: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5'
    },
    lg: {
      container: 'h-7 w-13',
      thumb: 'h-6 w-6',
      translate: 'translate-x-6'
    }
  };

  const currentColor = colors[color];
  const currentSize = sizes[size];

  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div className="flex-1 mr-4">
          {label && (
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {label}
            </h3>
          )}
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      
      <motion.button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex ${currentSize.container} items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          isOn ? currentColor.on : currentColor.off
        }`}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <motion.span
          className={`inline-block ${currentSize.thumb} rounded-lg ${currentColor.thumb} shadow-lg transition-all duration-300 ease-in-out`}
          animate={{
            x: isOn ? 0 : 0
          }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            duration: 0.3
          }}
          style={{
            transform: isOn ? currentSize.translate : 'translateX(1px)'
          }}
        />
      </motion.button>
    </div>
  );
};

export default ToggleSwitch;
