import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const InputField = ({
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  icon: Icon,
  error,
  touched,
  required = false,
  isVisible = true,
  showPasswordToggle = false,
  onTogglePassword,
  showPassword = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const getInputState = () => {
    if (error && touched) return 'error';
    if (touched && value && !error) return 'success';
    if (isFocused) return 'focused';
    return 'default';
  };

  const inputState = getInputState();

  // Estilo con bordes completamente redondeados (rounded-full)
  const getInputStyles = () => {
    const paddingRight = showPasswordToggle ? 'pr-14' : 'pr-3';
    const baseStyles = `w-full px-4 py-3 ${paddingRight} rounded-full transition-all duration-200 focus:outline-none min-h-[52px] text-[16px] leading-normal bg-gray-50 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-q-primary focus:ring-offset-0 dark:focus:ring-offset-0 focus:border-transparent box-border`;

    switch (inputState) {
      case 'error':
        return `${baseStyles} border-q-expense focus:ring-q-expense`;
      case 'success':
        return `${baseStyles} border-q-income focus:ring-q-income`;
      case 'focused':
        return `${baseStyles} border-q-primary`;
      default:
        return `${baseStyles} border-gray-300 dark:border-gray-600`;
    }
  };

  const getIconStyles = () => {
    switch (inputState) {
      case 'error':
        return 'text-q-expense';
      case 'success':
        return 'text-q-income';
      case 'focused':
        return 'text-q-primary';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  if (!isVisible) {
    return (
      <motion.div
        initial={{ opacity: 1, height: 'auto' }}
        animate={{ opacity: 0, height: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      />
    );
  }

  return (
    <div className="space-y-1 overflow-visible">
      <div className="relative overflow-visible">
        {/* Icono principal */}
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none ${getIconStyles()}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            onBlur(e);
            setIsFocused(false);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 350);
            }
          }}
          className={getInputStyles()}
          placeholder={placeholder}
          required={required}
          style={{
            paddingLeft: '3rem', // Espacio para icono; text-[16px] evita zoom en iOS
            borderRadius: '9999px' // Forzar redondeado tipo pill (por si Tailwind no genera rounded-full)
          }}
        />

        {/* Botón de mostrar/ocultar contraseña */}
        {showPasswordToggle && (
          <button
            type="button"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors touch-manipulation z-10"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Mensaje de error - Sin espacio reservado */}
      <AnimatePresence>
        {error && touched && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-q-expense text-xs sm:text-sm flex items-center pt-1 px-4"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InputField;
