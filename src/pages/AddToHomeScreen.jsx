import React from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SmoothLink from '../components/SmoothLink';
import {
  DevicePhoneMobileIcon,
  ShareIcon,
  PlusCircleIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import SafeArea from '../components/SafeArea';
import AuthLogo from '../components/AuthLogo';
import AuthThemeToggle from '../components/AuthThemeToggle';

const Step = ({ number, title, children, icon: Icon }) => (
  <div className="flex gap-4 items-start">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-q-primary-muted flex items-center justify-center text-q-primary font-bold text-sm">
      {number}
    </div>
    <div className="flex-1 min-w-0">
      {Icon && (
        <div className="mb-1.5 text-gray-500 dark:text-gray-400">
          <Icon className="w-5 h-5 inline-block align-middle mr-1" />
        </div>
      )}
      <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
      <div className="text-gray-600 dark:text-gray-300 text-sm mt-0.5">{children}</div>
    </div>
  </div>
);

const INSTRUCTIONS_SEEN_KEY = 'quantis_instructions_seen';

const AddToHomeScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const firstTime = location.state?.firstTime === true || searchParams.get('first') === '1';

  const handleContinue = () => {
    try {
      localStorage.setItem(INSTRUCTIONS_SEEN_KEY, 'true');
    } catch { /* ignore */ }
    navigate('/login', { replace: true });
  };

  return (
    <SafeArea all className="min-h-screen overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <AuthThemeToggle />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -15 }}
        transition={{ 
          duration: 0.4, 
          ease: [0.23, 1, 0.32, 1],
          staggerChildren: 0.08
        }}
        className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-8 pb-24"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          {!firstTime && (
            <SmoothLink
              to="/login"
              className="self-start flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-q-primary mb-4"
            >
              <span className="rotate-90">‹</span> Volver al inicio de sesión
            </SmoothLink>
          )}
          <AuthLogo size={56} className="mb-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Agregar Quantis como aplicación
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base max-w-md">
            Sigue estos pasos para instalar Quantis en la pantalla de inicio de tu móvil y usarla como una app.
          </p>
        </div>

        {/* General */}
        <motion.section 
          className="mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.05, 
            duration: 0.35,
            ease: [0.23, 1, 0.32, 1]
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <DevicePhoneMobileIcon className="w-6 h-6 text-q-primary" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">En general</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            Quantis es una aplicación web progresiva (PWA). Puedes añadirla a la pantalla de inicio desde el navegador para abrirla como una app, con icono y sin barra de direcciones.
          </p>
        </motion.section>

        {/* iOS (Safari) */}
        <motion.section 
          className="mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.15, 
            duration: 0.35,
            ease: [0.23, 1, 0.32, 1]
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-gray-800 dark:text-gray-100 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">iPhone / iPad (Safari)</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
            <Step number={1} title="Abre Quantis en Safari" icon={null}>
              Asegúrate de estar en Safari (no en Chrome ni otros navegadores). Ve a la página de Quantis e inicia sesión si quieres.
            </Step>
            <Step number={2} title="Toca el botón Compartir" icon={ShareIcon}>
              En la barra inferior de Safari, toca el icono de <strong>Compartir</strong> (cuadrado con una flecha hacia arriba).
            </Step>
            <Step number={3} title={'"Añadir a la pantalla de inicio"'} icon={PlusCircleIcon}>
              En el menú que se abre, baja y toca <strong>"Añadir a la pantalla de inicio"</strong> (Add to Home Screen).
            </Step>
            <Step number={4} title="Confirmar" icon={Squares2X2Icon}>
              Puedes cambiar el nombre si quieres. Toca <strong>"Añadir"</strong> en la esquina superior derecha. El icono de Quantis aparecerá en tu pantalla de inicio.
            </Step>
          </div>
        </motion.section>

        {/* Android (Chrome) */}
        <motion.section 
          className="mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.25, 
            duration: 0.35,
            ease: [0.23, 1, 0.32, 1]
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-6 h-6 text-gray-800 dark:text-gray-100 flex-shrink-0"
              viewBox="0 0 48 48"
              fill="currentColor"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7.7,16.2A2.7,2.7,0,0,0,5,18.9V30.3a2.8,2.8,0,0,0,1.2,2.3,2.6,2.6,0,0,0,1.5.4,2.7,2.7,0,0,0,2.2-1.1l.2-.3.3-.7v-12A2.7,2.7,0,0,0,7.7,16.2Z"/>
              <path d="M29.6,6l1.9-3.4c0-.1.1-.1.1-.2a.8.8,0,0,0-.2-.4h-.5l-2,3.5a4.9,4.9,0,0,0-1.7-.6,13.6,13.6,0,0,0-3.6-.5H21.8a12.9,12.9,0,0,0-3.5,1L16.4,2.2A.5.5,0,0,0,16,2h-.2a.4.4,0,0,0-.1.3v.2L17.6,6h0a11.8,11.8,0,0,0-4.4,3.9l-.5.8-.6,1.4a8.9,8.9,0,0,0-.7,3.6H35.8A11.1,11.1,0,0,0,29.6,6ZM18.1,11.4A1.1,1.1,0,0,1,17,10.3a1.1,1.1,0,0,1,1.1-1,1.1,1.1,0,0,1,1,1A1.1,1.1,0,0,1,18.1,11.4Zm11.1,0a1,1,0,0,1-1-1.1,1,1,0,0,1,2,0A1,1,0,0,1,29.2,11.4Z"/>
              <path d="M11.5,16.8V34.4a2.9,2.9,0,0,0,2.9,2.9h2v6A2.6,2.6,0,0,0,18,45.8h1.1l1-.2a2.7,2.7,0,0,0,1.7-2.5v-6h3.7v6a2.7,2.7,0,1,0,5.4,0v-6h2a3.5,3.5,0,0,0,1.7-.6,2.9,2.9,0,0,0,1.2-2.3V16.8Z"/>
              <path d="M42.2,18.9a2.6,2.6,0,0,0-2.1-2.6h-.6a2.7,2.7,0,0,0-2.7,2.7V30.3a2.7,2.7,0,1,0,5.4,0Z"/>
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Android (Chrome)</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
            <Step number={1} title="Abre Quantis en Chrome" icon={null}>
              Abre Chrome en tu Android y entra a la página de Quantis. Inicia sesión si lo necesitas.
            </Step>
            <Step number={2} title="Menú de Chrome" icon={ChevronDownIcon}>
              Toca el icono de <strong>menú</strong> (tres puntos verticales) en la esquina superior derecha.
            </Step>
            <Step number={3} title={'"Instalar aplicación" o "Añadir a la pantalla de inicio"'} icon={ArrowDownTrayIcon}>
              En el menú, toca <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla de inicio"</strong>. En algunos dispositivos puede decir "Crear acceso directo".
            </Step>
            <Step number={4} title="Confirmar" icon={Squares2X2Icon}>
              En el cuadro de confirmación, toca <strong>"Instalar"</strong> o <strong>"Añadir"</strong>. El icono de Quantis se instalará en tu pantalla de inicio o en el cajón de aplicaciones.
            </Step>
          </div>
        </motion.section>

        {/* Tips */}
        <motion.section 
          className="mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.35, 
            duration: 0.35,
            ease: [0.23, 1, 0.32, 1]
          }}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Consejos</h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
            <li className="flex gap-2">
              <span className="text-q-primary">•</span>
              Usa siempre el mismo navegador (Safari en iOS, Chrome en Android) para abrir Quantis antes de añadirla.
            </li>
            <li className="flex gap-2">
              <span className="text-q-primary">•</span>
              Una vez instalada, ábrela desde el icono como cualquier app; no hace falta escribir la dirección.
            </li>
            <li className="flex gap-2">
              <span className="text-q-primary">•</span>
              Si no ves la opción en Chrome (Android), actualiza Chrome o comprueba que estás en la URL correcta de Quantis.
            </li>
          </ul>
        </motion.section>

        {/* CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.45, 
            duration: 0.35,
            ease: [0.23, 1, 0.32, 1]
          }}
        >
          {firstTime ? (
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center justify-center w-full max-w-xs mx-auto px-6 py-3.5 rounded-2xl bg-q-primary text-white font-semibold text-base hover:bg-q-primary active:opacity-90 transition-colors"
            >
              Continuar al inicio de sesión
            </button>
          ) : (
            <SmoothLink
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-q-primary text-white font-medium text-sm hover:bg-q-primary active:opacity-90 transition-colors"
            >
              Volver al inicio de sesión
            </SmoothLink>
          )}
        </motion.div>
      </motion.div>
    </SafeArea>
  );
};

export default AddToHomeScreen;