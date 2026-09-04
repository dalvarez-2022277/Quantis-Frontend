import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserIcon, CameraIcon, CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuthContext } from '../contexts/AuthContext';
import { getAvatarUrl } from '../api/api';
import { compressForAvatar, validateImage, getImageInfo } from '../utils/imageCompression';

const Profile = React.memo(() => {
  const navigate = useNavigate();
  const { user, updateProfile, uploadAvatar, deleteAvatar, error, clearError, showSuccess, showError, imageTimestamp } = useAuthContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currency: 'GTQ'
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef(null);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currency: user.currency || 'GTQ'
      });
      setPreviewImage(user.profileImage || null);
    }
  }, [user]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error al cambiar campos
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const handleImageChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showError('Archivo inválido', 'Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño inicial
      const validation = validateImage(file);
      
      if (validation.isTooLarge) {
        showError('Archivo muy grande', 'La imagen es demasiado grande. Por favor selecciona una imagen menor a 4MB');
        return;
      }

      setIsLoading(true);
      
      try {
        // SIEMPRE comprimir todas las imágenes (silenciosamente)
        const fileToUpload = await compressForAvatar(file);
        // Usar el método del contexto para subir la imagen
        const response = await uploadAvatar(fileToUpload);
        
        if (response.success) {
          setPreviewImage(response.data.user.profileImage);
          setProfileImage(null);
          showSuccess('Imagen actualizada', 'Tu foto de perfil se ha actualizado correctamente');
        } else {
          showError('Error al subir imagen', response.message || 'No se pudo subir la imagen');
        }
      } catch (error) {
        console.error('Error subiendo imagen:', error);
        showError('Error de conexión', 'No se pudo conectar con el servidor');
      } finally {
        setIsLoading(false);
      }
    }
  }, [uploadAvatar, showSuccess, showError]);

  const removeImage = useCallback(async () => {
    if (!user?.profileImage) return;
    
    setIsLoading(true);
    
    try {
      // Usar el método del contexto para eliminar la imagen
      const response = await deleteAvatar();
      
      if (response.success) {
        // Actualizar el estado local
        setProfileImage(null);
        setPreviewImage(null);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        showSuccess('Imagen eliminada', 'La foto de perfil se ha eliminado correctamente');
      } else {
        showError('Error al eliminar imagen', response.message || 'No se pudo eliminar la imagen');
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      showError('Error al eliminar', 'No se pudo eliminar la imagen');
    } finally {
      setIsLoading(false);
    }
  }, [user?.profileImage, deleteAvatar, showSuccess, showError]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSaved(false);

    try {
      await updateProfile({
        name: formData.name,
        currency: formData.currency
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      showError('Error al guardar', 'No se pudo actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  }, [formData.name, formData.currency, updateProfile, showError]);

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
                <UserIcon className="h-6 w-6 sm:h-7 sm:w-7 text-q-primary" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-q-primary mb-1">
                  Cuenta
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                  Perfil
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-300 leading-snug max-w-md">
                  Tu nombre, foto y moneda por defecto en un solo lugar.
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Foto de perfil */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Foto de Perfil</h3>
                
                <div className="flex flex-col items-center">
                  {/* Imagen de perfil */}
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        {previewImage ? (
          <img
            key={`${previewImage}-${imageTimestamp}`}
            src={getAvatarUrl(previewImage, imageTimestamp)}
            alt="Foto de perfil"
            className="h-full w-full object-cover"
          />
        ) : (
          <UserIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
        )}
                    </div>
                    
                    {/* Botón de cámara */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 h-8 w-8 bg-q-primary text-white rounded-full flex items-center justify-center hover:bg-q-primary transition-colors duration-200"
                    >
                      <CameraIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Input de archivo oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  {/* Botones de acción */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-sm font-medium text-q-primary bg-q-primary-muted rounded-lg hover:bg-q-primary-muted transition-colors duration-200"
                    >
                      Cambiar Foto
                    </button>
                    {previewImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-4 py-2 text-sm font-medium text-q-expense bg-q-expense-muted rounded-lg hover:bg-q-expense-muted transition-colors duration-200"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    JPG, PNG o GIF. Máximo 4MB. Se comprimirá automáticamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Información personal */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información Personal</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Actualiza tu información personal</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-q-expense-muted border border-q-expense-muted text-q-expense px-4 py-3 rounded-md text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {isSaved && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-q-income-muted border border-q-income-muted text-q-income px-4 py-3 rounded-md text-sm flex items-center"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Perfil actualizado exitosamente
                    </motion.div>
                  )}

                  {/* Nombre */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-q-primary focus:border-q-primary transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>

                  {/* Email (solo lectura) */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">El correo electrónico no se puede cambiar</p>
                  </div>

                  {/* Moneda */}
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Moneda principal
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-q-primary focus:border-q-primary transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="GTQ">Quetzales (GTQ)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Esta será la moneda por defecto para tus transacciones</p>
                  </div>

                  {/* Botón de guardar */}
                  <div className="flex justify-end pt-4">
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-q-primary text-white px-6 py-2 rounded-md font-medium hover:bg-q-primary focus:outline-none focus:ring-2 focus:ring-q-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

Profile.displayName = 'Profile';

export default Profile;
