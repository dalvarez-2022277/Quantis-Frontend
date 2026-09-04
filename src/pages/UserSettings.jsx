import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SwatchIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { useAuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ColorPickerModal from '../components/ColorPickerModal';

const UserSettings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAuthContext();
  const { darkMode, toggleDarkMode, colorPreset, setColorPreset, customColors, setCustomColors, colorPresets } = useTheme();
  const [formData, setFormData] = useState({
    notifications: true,
    darkMode: darkMode
  });

  // Cargar datos de configuraciones al montar el componente
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      notifications: settings.notifications !== undefined ? settings.notifications : true,
      darkMode: darkMode
    }));
  }, [settings, darkMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Aplicar cambios inmediatamente
    if (name === 'darkMode') {
      toggleDarkMode();
    } else if (name === 'notifications') {
      updateSettings({ notifications: newValue });
    }
  };

  const handleColorPreset = (key) => {
    setColorPreset(key);
    if (key !== 'custom') {
      setCustomPaletteExpanded(false);
    }
  };

  const handlePersonalizadoCardClick = () => {
    if (colorPreset === 'custom') {
      setCustomPaletteExpanded((v) => !v);
    } else {
      handleColorPreset('custom');
      setCustomPaletteExpanded(false);
    }
  };

  const handleCustomColor = (key, hex) => {
    setCustomColors({ [key]: hex });
    setColorPreset('custom');
  };

  const [editingColorKey, setEditingColorKey] = useState(null);
  /** Sección completa de colores (presets + personalizado) */
  const [appColorsSectionOpen, setAppColorsSectionOpen] = useState(false);
  /** Con tema personalizado: panel de colores plegado por defecto; se despliega para editar */
  const [customPaletteExpanded, setCustomPaletteExpanded] = useState(false);

  useEffect(() => {
    if (colorPreset !== 'custom') {
      setCustomPaletteExpanded(false);
    }
  }, [colorPreset]);

  useEffect(() => {
    if (!appColorsSectionOpen) {
      setCustomPaletteExpanded(false);
    }
  }, [appColorsSectionOpen]);

  const customPrimary = customColors.primary || '#2563eb';
  const customIncome = customColors.income || '#16a34a';
  const customExpense = customColors.expense || '#dc2626';

  const editingColorValue = editingColorKey === 'primary' ? customPrimary
    : editingColorKey === 'income' ? customIncome
    : editingColorKey === 'expense' ? customExpense
    : null;

  const editingColorLabel = editingColorKey === 'primary' ? 'Menú y acento'
    : editingColorKey === 'income' ? 'Ingresos'
    : editingColorKey === 'expense' ? 'Gastos'
    : '';

  const currentThemeLabel =
    colorPreset === 'custom'
      ? 'Personalizado'
      : colorPresets[colorPreset]?.name ?? 'Por defecto';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 scroll-container">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-8 sm:px-6 lg:px-8">
        <motion.header
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:text-q-primary hover:border-q-primary/40 hover:bg-q-primary/5 dark:hover:bg-gray-600 dark:hover:border-gray-400 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-md focus:outline-none focus:ring-2 focus:ring-q-primary/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Regresar al inicio"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-q-primary/20 to-q-primary/5 dark:from-q-primary/30 dark:to-q-primary/15 flex items-center justify-center shadow-sm dark:shadow-inner">
                <Cog6ToothIcon className="h-6 w-6 sm:h-7 sm:w-7 text-q-primary" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-q-primary mb-1">
                  Preferencias
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                  Ajustes
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-300 leading-snug max-w-md">
                  Tema, colores, notificaciones y cómo se ve la app en tu dispositivo.
                </p>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configuraciones Generales</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Personaliza tu experiencia en la aplicación</p>
            </div>

            <div className="p-6 space-y-6">


              {/* Notificaciones */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <BellIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notificaciones</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Recibir notificaciones de la aplicación</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={formData.notifications}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer transition-colors peer-checked:bg-q-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:border after:transition-all after:bg-white after:border-gray-300 after:shadow-sm peer-checked:after:translate-x-full peer-checked:after:border-gray-100 dark:after:bg-gray-500 dark:after:border-gray-600 dark:peer-checked:after:bg-gray-800 dark:peer-checked:after:border-gray-700"></div>
                </label>
              </div>

              {/* Modo oscuro */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  {formData.darkMode ? (
                    <MoonIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  ) : (
                    <SunIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Modo Oscuro</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Se aplica automáticamente</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="darkMode"
                    checked={formData.darkMode}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer transition-colors peer-checked:bg-q-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:border after:transition-all after:bg-white after:border-gray-300 after:shadow-sm peer-checked:after:translate-x-full peer-checked:after:border-gray-100 dark:after:bg-gray-500 dark:after:border-gray-600 dark:peer-checked:after:bg-gray-800 dark:peer-checked:after:border-gray-700"></div>
                </label>
              </div>

              {/* Colores de la aplicación (desplegable) */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setAppColorsSectionOpen((v) => !v)}
                  aria-expanded={appColorsSectionOpen}
                  aria-controls="app-colors-section-panel"
                  id="app-colors-section-trigger"
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <SwatchIcon className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden />
                    <div className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        Colores de la aplicación
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                        Tema actual: <span className="font-medium text-gray-700 dark:text-gray-300">{currentThemeLabel}</span>
                      </span>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
                      appColorsSectionOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  />
                </button>

                <AnimatePresence initial={false}>
                  {appColorsSectionOpen && (
                    <motion.div
                      id="app-colors-section-panel"
                      role="region"
                      aria-labelledby="app-colors-section-trigger"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Afectan modo claro y oscuro: general (menú, tabs), ingresos y gastos
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                          {Object.entries(colorPresets).map(([key, preset]) => (
                            <motion.button
                              key={key}
                              type="button"
                              onClick={() => handleColorPreset(key)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                                colorPreset === key
                                  ? 'border-q-primary bg-q-primary/10 dark:bg-q-primary/20 shadow-md'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700/50'
                              }`}
                            >
                              <div className="flex w-full rounded-xl overflow-hidden shadow-inner h-10 border border-gray-200/50 dark:border-gray-600/50">
                                <span className="flex-1" style={{ backgroundColor: preset.primary }} />
                                <span className="flex-1" style={{ backgroundColor: preset.income }} />
                                <span className="flex-1" style={{ backgroundColor: preset.expense }} />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{preset.name}</span>
                              {colorPreset === key && (
                                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-q-primary flex items-center justify-center">
                                  <CheckIconSolid className="w-3 h-3 text-white" />
                                </span>
                              )}
                            </motion.button>
                          ))}
                          <motion.button
                            type="button"
                            onClick={handlePersonalizadoCardClick}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            aria-expanded={colorPreset === 'custom' ? customPaletteExpanded : undefined}
                            className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 min-h-[100px] ${
                              colorPreset === 'custom'
                                ? 'border-q-primary bg-q-primary/10 dark:bg-q-primary/20 shadow-md'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700/50'
                            }`}
                          >
                            {colorPreset === 'custom' ? (
                              <>
                                <div className="flex w-full rounded-xl overflow-hidden shadow-inner h-10 border border-gray-200/50 dark:border-gray-600/50">
                                  <span className="flex-1" style={{ backgroundColor: customPrimary }} />
                                  <span className="flex-1" style={{ backgroundColor: customIncome }} />
                                  <span className="flex-1" style={{ backgroundColor: customExpense }} />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Personalizado</span>
                                <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                                  <ChevronDownIcon
                                    className={`h-4 w-4 transition-transform duration-200 ${
                                      customPaletteExpanded ? 'rotate-180' : ''
                                    }`}
                                    aria-hidden
                                  />
                                  {customPaletteExpanded ? 'Ocultar colores' : 'Editar colores'}
                                </span>
                              </>
                            ) : (
                              <>
                                <PencilSquareIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Personalizado</span>
                              </>
                            )}
                            {colorPreset === 'custom' && (
                              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-q-primary flex items-center justify-center">
                                <CheckIconSolid className="w-3 h-3 text-white" />
                              </span>
                            )}
                          </motion.button>
                        </div>

                        <AnimatePresence>
                          {colorPreset === 'custom' && customPaletteExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 border border-gray-200 dark:border-gray-600">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                  Toca cada círculo para elegir el color
                                </p>
                                <div className="grid grid-cols-3 gap-3 sm:gap-6">
                                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setEditingColorKey('primary')}
                                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white dark:border-gray-600 shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-q-primary flex-shrink-0"
                                      style={{ backgroundColor: customPrimary }}
                                      aria-label="Cambiar color general"
                                    />
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Menú y acento</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate w-full text-center">{customPrimary}</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setEditingColorKey('income')}
                                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white dark:border-gray-600 shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex-shrink-0"
                                      style={{ backgroundColor: customIncome }}
                                      aria-label="Cambiar color ingresos"
                                    />
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Ingresos</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate w-full text-center">{customIncome}</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setEditingColorKey('expense')}
                                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white dark:border-gray-600 shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex-shrink-0"
                                      style={{ backgroundColor: customExpense }}
                                      aria-label="Cambiar color gastos"
                                    />
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Gastos</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate w-full text-center">{customExpense}</span>
                                  </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    Vista previa: menú y botones usarán el color general; ingresos y gastos se verán en listas y gráficos.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </motion.div>
      </div>

      <ColorPickerModal
        isOpen={editingColorKey !== null}
        onClose={() => setEditingColorKey(null)}
        value={editingColorValue}
        onChange={(hex) => editingColorKey && handleCustomColor(editingColorKey, hex)}
        title={editingColorLabel}
      />
    </div>
  );
};

export default UserSettings;
