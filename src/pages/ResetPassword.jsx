import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { LockClosedIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuthContext } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import InputField from '../components/InputField';
import SafeArea from '../components/SafeArea';
import AuthLogo from '../components/AuthLogo';
import AuthThemeToggle from '../components/AuthThemeToggle';

const AuthCard = ({ children, className = '' }) => (
  <SafeArea all className="min-h-screen-auth overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 theme-transition lg:bg-gradient-to-br lg:from-gray-50 lg:via-gray-50 lg:to-gray-100/50 dark:lg:from-gray-900 dark:lg:via-gray-900 dark:lg:to-gray-800/80 flex flex-col items-center justify-center">
    <AuthThemeToggle />
    <div className="w-full min-h-full max-w-[100vw] py-4 sm:py-6 md:py-8 px-4 sm:px-6 flex flex-col items-center justify-center flex-1">
      <div className={`w-full min-w-0 max-w-[min(100%,420px)] sm:max-w-[400px] lg:max-w-[440px] mx-auto ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:shadow-xl lg:rounded-3xl lg:p-8 overflow-visible theme-transition"
        >
          {children}
        </motion.div>
      </div>
    </div>
  </SafeArea>
);

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [user, setUser] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { disableNotifications, isAuthenticated } = useAuthContext();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      // Solo redirigir al login si no hay token Y no está autenticado
      if (!isAuthenticated) {
      navigate('/login');
      }
      return;
    }

    // Verificar token independientemente del estado de autenticación
    verifyToken();
  }, [token, navigate, isAuthenticated]);

  // Validar formulario en tiempo real
  React.useEffect(() => {
    const isPasswordValid = password.length >= 6;
    const isConfirmPasswordValid = confirmPassword === password && password.length >= 6;

    setIsFormValid(isPasswordValid && isConfirmPasswordValid);
    setFieldErrors(prev => ({
      password: touchedFields.password && password && !isPasswordValid ? 'La contraseña debe tener al menos 6 caracteres' : '',
      confirmPassword: touchedFields.confirmPassword && confirmPassword && !isConfirmPasswordValid ? 'Las contraseñas no coinciden' : ''
    }));
  }, [password, confirmPassword, touchedFields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'password') {
      setPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }

    // Marcar campo como tocado
    setTouchedFields({
      ...touchedFields,
      [name]: true
    });

    // Limpiar errores cuando el usuario empiece a escribir
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields({
      ...touchedFields,
      [name]: true
    });
  };

  const verifyToken = async () => {
    try {
      setIsVerifyingToken(true);
      setTokenError(null);
      
      const data = await authService.verifyResetToken(token);

      if (data.success) {
        setIsValidToken(true);
        setUser(data.user);
      } else {
        // Manejar diferentes tipos de errores de token
        const errorMessage = data.message || 'Token inválido o expirado';
        setTokenError(errorMessage);
        setIsValidToken(false);
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      const errorMessage = error.message || 'Error de conexión';
      setTokenError(errorMessage);
      setIsValidToken(false);
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!isFormValid) {
      // Marcar todos los campos como tocados para mostrar errores
      setTouchedFields({
        password: true,
        confirmPassword: true
      });
      return;
    }

    setIsLoading(true);

    try {
      // Deshabilitar notificaciones push para este flujo
      disableNotifications();
      
      const data = await authService.resetPassword(token, password);

      if (data.success) {
        setMessage('Contraseña actualizada exitosamente');
        setIsRedirecting(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(`Error: ${data.message || 'Error al actualizar la contraseña'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage(`Error: ${error.message || 'Error de conexión. Intenta de nuevo'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && isAuthenticated) {
    return (
      <AuthCard>
        <div className="flex justify-center mb-3">
          <AuthLogo size={44} className="flex-shrink-0" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-0.5">Sesión activa</h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm text-center mb-4">
          Ya estás conectado. Puedes cambiar tu contraseña desde ajustes.
        </p>
        <div className="space-y-2">
          <Link
            to="/dashboard"
            className="block w-full py-3 rounded-2xl bg-q-primary text-white font-semibold text-center text-sm hover:bg-q-primary"
          >
            Ir al Dashboard
          </Link>
          <Link
            to="/ajustes"
            className="block w-full py-2.5 text-center text-sm text-q-primary font-medium hover:text-q-primary"
          >
            Cambiar contraseña
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (isRedirecting) {
    return (
      <AuthCard>
        <div className="flex justify-center mb-3">
          <AuthLogo size={44} className="flex-shrink-0" />
        </div>
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-0.5">Contraseña actualizada</h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
          Redirigiendo al inicio de sesión...
        </p>
      </AuthCard>
    );
  }

  if (isVerifyingToken || !isValidToken) {
    return (
      <AuthCard>
        <div className="flex justify-center mb-3">
          <AuthLogo size={44} className="flex-shrink-0" />
        </div>
        {isVerifyingToken ? (
          <>
            <div className="w-10 h-10 border-2 border-q-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-0.5">Verificando enlace</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
              Validando tu enlace de restablecimiento...
            </p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-0.5">Enlace no válido</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm text-center mb-4">
              {tokenError || 'Este enlace no es válido o ha expirado.'}
            </p>
            <div className="space-y-2">
              <Link
                to="/forgot-password"
                className="block w-full py-3 rounded-2xl bg-q-primary text-white font-semibold text-center text-sm hover:bg-q-primary"
              >
                Solicitar nuevo enlace
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full text-sm text-q-primary font-medium hover:text-q-primary"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="flex justify-center mb-3">
        <AuthLogo size={44} className="flex-shrink-0" />
      </div>
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-0.5">Nueva contraseña</h1>
      <p className="text-gray-600 dark:text-gray-300 text-sm text-center mb-3">
        {user ? `Hola ${user.name}, ` : ''}Elige una contraseña segura
      </p>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">Nueva contraseña</label>
          <InputField
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">Confirmar contraseña</label>
          <InputField
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Repite la contraseña"
            icon={LockClosedIcon}
            error={fieldErrors.confirmPassword}
            touched={touchedFields.confirmPassword}
            required
            showPasswordToggle
            onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            showPassword={showConfirmPassword}
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
              Actualizando...
            </span>
          ) : (
            'Actualizar contraseña'
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
    </AuthCard>
  );
};

export default ResetPassword;
