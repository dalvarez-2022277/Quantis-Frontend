import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import InputField from '../components/InputField';
import SafeArea from '../components/SafeArea';
import AuthLogo from '../components/AuthLogo';
import AuthThemeToggle from '../components/AuthThemeToggle';

const ForgotPassword = () => {
  const {
    disableNotifications,
    forgotPasswordForm,
    saveTemporaryData,
    getTemporaryData
  } = useAuthContext();

  const { formData, updateField } = forgotPasswordForm;
  const { email } = formData;

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  React.useEffect(() => {
    const savedMessage = getTemporaryData('forgotPasswordMessage');
    if (savedMessage) setMessage(savedMessage);
  }, [getTemporaryData]);

  React.useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);
    setIsFormValid(isEmailValid);
    setFieldErrors(prev => ({
      email: touchedFields.email && email && !isEmailValid ? 'Email inválido' : ''
    }));
  }, [email, touchedFields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateField(name, value);
    setTouchedFields({ ...touchedFields, [name]: true });
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (e) => {
    setTouchedFields({ ...touchedFields, [e.target.name]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      disableNotifications();
      const data = await authService.forgotPassword(email);
      if (data.success) {
        setMessage(data.message);
        saveTemporaryData('forgotPasswordMessage', data.message);
        updateField('step', 2);
      } else {
        const errorMessage = `Error: ${data.message || 'Error al enviar el email'}`;
        setMessage(errorMessage);
        saveTemporaryData('forgotPasswordMessage', errorMessage);
      }
    } catch (error) {
      const fullErrorMessage = `Error: ${error.message || 'Error de conexión. Intenta de nuevo'}`;
      setMessage(fullErrorMessage);
      saveTemporaryData('forgotPasswordMessage', fullErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeArea all className="min-h-screen-auth overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 theme-transition lg:bg-gradient-to-br lg:from-gray-50 lg:via-gray-50 lg:to-gray-100/50 dark:lg:from-gray-900 dark:lg:via-gray-900 dark:lg:to-gray-800/80 flex flex-col items-center justify-center">
      <AuthThemeToggle />
      <div className="w-full min-h-full max-w-[100vw] py-4 sm:py-6 md:py-8 px-4 sm:px-6 flex flex-col items-center justify-center flex-1 lg:flex-row lg:items-center lg:justify-center lg:gap-12 xl:gap-16 lg:max-w-5xl lg:mx-auto lg:px-8">
        {/* Solo PC: panel igual que login — logo, título, texto y separador */}
        <div className="hidden lg:flex lg:flex-1 lg:max-w-md lg:flex-col lg:justify-center lg:rounded-2xl lg:bg-white/70 dark:lg:bg-gray-800/50 lg:backdrop-blur-sm lg:border lg:border-gray-200/80 dark:lg:border-gray-700/80 lg:shadow-xl lg:p-10 xl:p-12 lg:items-center lg:text-center">
          <div className="flex justify-center mb-6">
            <AuthLogo size={72} className="flex-shrink-0" />
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Recupera el acceso
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-4 text-base xl:text-lg leading-relaxed max-w-sm">
            Indica tu correo y te enviamos un enlace para volver a entrar.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="h-px flex-1 max-w-[60px] bg-gray-300 dark:bg-gray-600" />
            <span>Seguro y fácil de usar</span>
          </div>
        </div>
        <div className="w-full flex flex-col items-center justify-center min-w-0 max-w-[min(100%,420px)] sm:max-w-[400px] lg:max-w-[420px] lg:flex-initial mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:shadow-xl lg:rounded-3xl lg:p-8 overflow-visible theme-transition"
          >
            {/* Logo solo en móvil; en escritorio está en el panel izquierdo */}
            <div className="flex justify-center mb-3 lg:hidden">
              <AuthLogo size={44} className="flex-shrink-0" />
            </div>

            <h1 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-0.5 lg:text-xl">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm text-center mb-3 lg:mb-4">
              Escribe tu correo y te enviamos un enlace para restablecerla
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 overflow-visible">
              <div className="overflow-visible">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">Correo</label>
                <InputField
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="tu@email.com"
                  icon={EnvelopeIcon}
                  error={fieldErrors.email}
                  touched={touchedFields.email}
                  required
                />
              </div>

              {message && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`px-4 py-3 rounded-lg text-sm ${
                    message.startsWith('Error:')
                      ? 'bg-q-expense-muted text-q-expense-muted border border-q-expense-muted'
                      : 'bg-q-income-muted text-q-income-muted border border-q-income-muted'
                  }`}
                >
                  {message}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading || !isFormValid}
                whileTap={isFormValid && !isLoading ? { scale: 0.98 } : {}}
                className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isFormValid && !isLoading
                    ? 'bg-q-primary text-white hover:bg-q-primary active:opacity-90'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  'Enviar enlace'
                )}
              </motion.button>
            </form>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-q-primary font-medium hover:text-q-primary"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </SafeArea>
  );
};

export default ForgotPassword;
