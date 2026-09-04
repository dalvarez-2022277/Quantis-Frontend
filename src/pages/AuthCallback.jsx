import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { authApi } from '../api/api';
import SafeArea from '../components/SafeArea';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setAuthData, isAuthenticated } = useAuthContext();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    // Si ya está autenticado, redirigir directamente al dashboard
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const handleGoogleCallback = async () => {
      try {
        // Obtener parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const success = urlParams.get('success');
        const error = urlParams.get('error');
        const message = urlParams.get('message');

        if (success === 'true' && token) {
          try {
            // Crear un timeout para la verificación del token
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout verificando token')), 10000)
            );
            
            // Verificar token con el backend para obtener datos del usuario
            const verifyPromise = authApi.verifyToken(token);
            const data = await Promise.race([verifyPromise, timeoutPromise]);

            if (data.success) {
              // Guardar datos del usuario en el contexto
              setAuthData({
                user: data.user,
                token: data.token
              });

              // Redirigir al dashboard con replace para evitar volver atrás
              navigate('/dashboard', { replace: true });
            } else {
              throw new Error('Error verificando token');
            }
          } catch (verifyError) {
            // Determinar el tipo de error
            let errorType = 'token_verification_failed';
            let errorMessage = 'Error verificando token de autenticación';
            
            if (verifyError.message === 'Timeout verificando token') {
              errorType = 'timeout_error';
              errorMessage = 'Timeout verificando token. El servidor puede estar sobrecargado.';
            } else if (verifyError.response?.status === 401) {
              errorType = 'invalid_token';
              errorMessage = 'Token inválido o expirado.';
            } else if (verifyError.response?.status >= 500) {
              errorType = 'server_error';
              errorMessage = 'Error del servidor. Intenta nuevamente.';
            }
            
            // Si falla la verificación, redirigir a login con error
            navigate(`/login?error=${errorType}&message=${encodeURIComponent(errorMessage)}`, { replace: true });
            return;
          }
        } else {
          if (error || (!success && !token)) {
            let errorMessage = 'Error de autenticación con Google';
            let errorType = 'oauth_error';

            if (!error && !success && !token) {
              errorMessage = 'Acceso directo no autorizado. Por favor, inicia sesión con Google desde la página de login.';
              errorType = 'oauth_no_response';
            } else if (!error && !success && token) {
              errorMessage = 'Token recibido pero sin confirmación de éxito. Por favor, intenta nuevamente.';
              errorType = 'oauth_no_response';
            } else if (error) {
              switch (error) {
                case 'google_account_conflict':
                  errorMessage = message || 'Esta cuenta de Google ya está asociada a otro usuario';
                  errorType = 'google_account_conflict';
                  break;
                case 'google_id_duplicate':
                  errorMessage = message || 'Esta cuenta de Google ya está registrada';
                  errorType = 'google_id_duplicate';
                  break;
                case 'email_duplicate':
                  errorMessage = message || 'Este email ya está registrado';
                  errorType = 'email_duplicate';
                  break;
                case 'oauth_denied':
                  errorMessage = 'Autenticación cancelada por el usuario';
                  errorType = 'oauth_denied';
                  break;
                case 'jwt_error':
                  errorMessage = message || 'Error generando token de acceso';
                  errorType = 'jwt_error';
                  break;
                case 'oauth_not_configured':
                  errorMessage = 'Google OAuth no está configurado';
                  errorType = 'oauth_not_configured';
                  break;
                default:
                  errorMessage = message || 'Error de autenticación con Google';
                  break;
              }
            }
            
            navigate(`/login?error=${errorType}&message=${encodeURIComponent(errorMessage)}`, { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (error) {
        navigate('/login?error=oauth_error&message=' + encodeURIComponent('Error procesando autenticación'), { replace: true });
      }
    };

    handleGoogleCallback();
  }, [navigate, setAuthData, isAuthenticated]);

  return (
    <SafeArea all className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-q-primary mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Procesando autenticación...</p>
      </div>
    </SafeArea>
  );
};

export default AuthCallback;
