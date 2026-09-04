import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon, InformationCircleIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import SmoothLink from './SmoothLink';
import { useAuthContext } from '../contexts/AuthContext';
import { isSafariIOS, initSafariIOSFix } from '../utils/safariIOSFix';
import InputField from './InputField';
import SafeArea from './SafeArea';
import AuthLogo from './AuthLogo';
import AuthThemeToggle from './AuthThemeToggle';
import AuthInstructionsButton from './AuthInstructionsButton';
import ErrorAlert from './ErrorAlert';
import { getCopyrightLine } from '../config/appMeta';

const AuthSlider = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, error, clearError, isAuthenticated, showError, showSuccess, disableNotifications, enableNotifications } = useAuthContext();
  const { darkMode, toggleDarkMode } = useTheme();
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    if (typeof window !== 'undefined' && isSafariIOS()) {
      const cleanup = initSafariIOSFix();
      return cleanup;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error && isLogin) clearError();
  }, [formData.email, formData.password, formData.confirmPassword, clearError, error, isLogin]);

  React.useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(formData.email);
    const isPasswordValid = formData.password.length >= 6;

    if (isLogin) {
      setIsFormValid(isEmailValid && isPasswordValid);
      setFieldErrors(prev => ({
        email: touchedFields.email && formData.email && !isEmailValid ? 'Email inválido' : '',
        password: touchedFields.password && formData.password && !isPasswordValid ? 'La contraseña debe tener al menos 6 caracteres' : ''
      }));
    } else {
      const isConfirmPasswordValid = formData.confirmPassword === formData.password && formData.password.length >= 6;
      setIsFormValid(isEmailValid && isPasswordValid && isConfirmPasswordValid);
      setFieldErrors((prev) => {
        let emailMsg = '';
        if (!formData.email) {
          emailMsg = '';
        } else if (isEmailValid) {
          // Válido al instante: limpiar “Email inválido” y errores del servidor (ej. email duplicado)
          emailMsg = '';
        } else {
          emailMsg = touchedFields.email
            ? 'Email inválido'
            : prev.email || '';
        }
        return {
          ...prev,
          email: emailMsg,
          password:
            touchedFields.password && formData.password && !isPasswordValid
              ? 'La contraseña debe tener al menos 6 caracteres'
              : '',
          confirmPassword:
            touchedFields.confirmPassword && formData.confirmPassword && !isConfirmPasswordValid
              ? 'Las contraseñas no coinciden'
              : ''
        };
      });
    }
  }, [formData, isLogin, touchedFields]);

  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // No marcar touched aquí: evita validar en cada letra y que el mensaje haga “brincar” el layout.
    // El touched se define en handleBlur (y en errores de registro desde el servidor).
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields({ ...touchedFields, [name]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        enableNotifications();
        try {
          await login({ email: formData.email, password: formData.password });
          navigate('/dashboard');
        } catch (loginError) {
          console.error('Error en login:', loginError);
          let errorMessage = 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.';
          let title = 'Error de inicio de sesión';
          
          if (loginError.response?.data?.message) {
            const serverMessage = loginError.response.data.message;
            if (serverMessage.includes('usuario') || serverMessage.includes('email') || serverMessage.includes('contraseña')) {
              errorMessage = serverMessage;
            } else if (serverMessage.includes('no encontrado')) {
              title = 'Usuario no encontrado';
              errorMessage = 'No existe una cuenta con este correo electrónico.';
            } else if (serverMessage.includes('contraseña')) {
              title = 'Contraseña incorrecta';
              errorMessage = 'La contraseña que ingresaste es incorrecta.';
            }
          }
          
          showErrorAlert(title, errorMessage);
        }
      } else {
        disableNotifications();
        if (formData.password !== formData.confirmPassword) {
          showError('Error de Validación', 'Las contraseñas no coinciden');
          setIsLoading(false);
          return;
        }
        try {
          const { confirmPassword, ...userData } = formData;
          await register(userData);
          showSuccess('¡Bienvenido a Quantis!', 'Tu cuenta está lista. Ya puedes empezar.');
          navigate('/login');
        } catch (registerError) {
          if (registerError.response?.data?.message) {
            const errorMessage = registerError.response.data.message;
            if (errorMessage.includes('email') || errorMessage.includes('existe')) {
              setFieldErrors(prev => ({ ...prev, email: errorMessage }));
              setTouchedFields(prev => ({ ...prev, email: true }));
            }
            // El error se maneja con fieldErrors inline, no se muestra notificación
          }
          throw registerError;
        }
      }
    } catch (err) {
      console.error('Error en handleSubmit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    navigate(newMode ? '/login' : '/register');
    setFormData({ email: '', password: '', confirmPassword: '' });
    setFieldErrors({});
    setTouchedFields({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const showErrorAlert = (title, message) => {
    setErrorAlert({ isOpen: true, title, message });
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const apiUrl = import.meta.env.VITE_API_URL || `${backendUrl}/api`;
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <>
      <SafeArea all className="min-h-screen-auth overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 theme-transition lg:bg-gradient-to-br lg:from-gray-50 lg:via-gray-50 lg:to-gray-100/50 dark:lg:from-gray-900 dark:lg:via-gray-900 dark:lg:to-gray-800/80 flex flex-col items-center justify-center">
      <div className="w-full min-h-full max-w-[100vw] py-4 sm:py-6 md:py-8 px-4 sm:px-6 flex flex-col justify-center lg:flex-row lg:items-center lg:justify-center lg:gap-12 xl:gap-16 lg:max-w-5xl lg:mx-auto lg:px-8 flex-1">
        {/* Solo PC: panel izquierdo tipo “hero” con mensaje */}
        <div className="hidden lg:flex lg:flex-1 lg:max-w-md lg:flex-col lg:justify-center lg:rounded-2xl lg:bg-white/70 dark:lg:bg-gray-800/50 lg:backdrop-blur-sm lg:border lg:border-gray-200/80 dark:lg:border-gray-700/80 lg:shadow-xl lg:p-10 xl:p-12">
          <div className="flex justify-start mb-6">
            <AuthLogo size={72} className="flex-shrink-0" />
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isLogin ? 'Gestiona tus finanzas' : 'Únete a Quantis'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-4 text-base xl:text-lg leading-relaxed max-w-sm">
            {isLogin
              ? 'Lleva el control de ingresos, gastos y metas en un solo lugar.'
              : 'Crea tu cuenta y empieza a organizar tu dinero de forma sencilla.'}
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="h-px flex-1 max-w-[60px] bg-gray-300 dark:bg-gray-600" />
            <span>Seguro y fácil de usar</span>
          </div>
        </div>
        <div className="w-full flex flex-col items-center justify-center min-w-0 max-w-[min(100%,400px)] sm:max-w-[400px] lg:max-w-[420px] lg:flex-initial mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 lg:shadow-xl lg:rounded-3xl lg:border-gray-200/80 dark:lg:border-gray-700/80 p-4 sm:p-5 lg:p-8 pb-5 sm:pb-6 lg:pb-8 overflow-visible theme-transition relative"
          >
            {/* Botón de cambio de tema en la esquina superior derecha */}
            <div className="absolute top-4 right-4">
              <motion.button
                type="button"
                onClick={toggleDarkMode}
                aria-label={darkMode ? 'Usar modo claro' : 'Usar modo oscuro'}
                className="w-11 h-11 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-500 shadow-lg shadow-gray-900/20 dark:shadow-lg dark:shadow-black/40 hover:bg-gray-50 dark:hover:bg-gray-600 touch-manipulation flex items-center justify-center overflow-hidden theme-transition"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {darkMode ? (
                    <motion.span
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex items-center justify-center"
                    >
                      <SunIcon className="h-6 w-6 text-amber-400 flex-shrink-0" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex items-center justify-center"
                    >
                      <MoonIcon className="h-6 w-6 text-gray-600 dark:text-gray-100 flex-shrink-0" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Logo: en móvil centrado, en escritorio también en el card */}
            <div className="flex justify-center mb-4 pt-2">
              <AuthLogo size={44} className="flex-shrink-0 lg:hidden" />
              <AuthLogo size={56} className="flex-shrink-0 max-lg:hidden" />
            </div>

            {/* Pill: Iniciar sesión | Crear cuenta */}
            <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-700 mb-4 mt-2">
              <button
                type="button"
                onClick={() => { if (!isLogin) toggleMode(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isLogin ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => { if (isLogin) toggleMode(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${!isLogin ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Crear cuenta
              </button>
            </div>

            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center mb-1">
              {isLogin ? 'Bienvenido de nuevo' : 'Crear cuenta'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm text-center mb-4">
              {isLogin ? 'Inicia sesión en tu cuenta' : 'Regístrate para empezar'}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2 overflow-visible">
              <div className="overflow-visible">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo</label>
                <InputField
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="tu@email.com"
                  icon={EnvelopeIcon}
                  error={fieldErrors.email}
                  touched={touchedFields.email}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                <InputField
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Mínimo 6 caracteres"
                  icon={LockClosedIcon}
                  error={fieldErrors.password}
                  touched={touchedFields.password}
                  required
                  showPasswordToggle
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  showPassword={showPassword}
                />
              </div>

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {/*
                      overflow-hidden del motion recorta la curva del input; padding superior + lateral
                      evita el “pelo”/línea recta sobre el arco; gap evita costura label↔campo.
                    */}
                    <div className="isolate flex flex-col gap-0.5 px-0.5 pt-1.5 pb-0.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirmar contraseña
                      </label>
                      <InputField
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Repite la contraseña"
                        icon={LockClosedIcon}
                        error={fieldErrors.confirmPassword}
                        touched={touchedFields.confirmPassword}
                        required={!isLogin}
                        isVisible={!isLogin}
                        showPasswordToggle
                        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                        showPassword={showConfirmPassword}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-2"></div>

              <motion.button
                type="submit"
                disabled={isLoading || !isFormValid}
                whileTap={isFormValid && !isLoading ? { scale: 0.98 } : {}}
                className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${isFormValid && !isLoading ? 'bg-q-primary text-white hover:bg-q-primary active:opacity-90' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isLogin ? 'Entrando...' : 'Creando cuenta...'}
                  </span>
                ) : (
                  isLogin ? 'Iniciar sesión' : 'Crear cuenta'
                )}
              </motion.button>

              {/* Enlaces compactos */}
              {isLogin && (
                <div className="mt-2 text-xs">
                  <div className="flex justify-center">
                    <a href="/forgot-password" className="text-q-primary hover:text-q-primary inline-block">
                      ¿Olvidaste la contraseña?
                    </a>
                  </div>
                  <div className="flex justify-start mt-0.5">
                    <SmoothLink
                      to="/agregar-app"
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
                    >
                      <svg 
                        className="w-3 h-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      Agregar a pantalla
                    </SmoothLink>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-5">
              <div className="relative flex items-center justify-center">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                <span className="px-3 text-xs text-gray-500 dark:text-gray-400">o continúa con</span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="mt-3 w-full py-3 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      <p className="w-full max-w-[100vw] text-center text-[11px] text-gray-400 dark:text-gray-500 px-4 py-3 shrink-0">
        {getCopyrightLine()}
      </p>
    </SafeArea>

    {/* Alerta de error estilo iOS */}
    <ErrorAlert
      isOpen={errorAlert.isOpen}
      onClose={() => setErrorAlert({ ...errorAlert, isOpen: false })}
      title={errorAlert.title}
      message={errorAlert.message}
    />
    </>
  );
};

export default AuthSlider;
