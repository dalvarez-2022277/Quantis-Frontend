// Utilidades para manejo de localStorage

// Función para limpiar datos del usuario antes de guardar en localStorage
export const cleanUserForStorage = (user) => {
  if (!user) return null;
  
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency,
    profileImage: user.profileImage,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
    // Excluimos: profileImageData, password, resetPasswordToken, etc.
  };
};

// Función para limpiar localStorage y liberar espacio
export const clearStorageQuota = () => {
  try {
    // Limpiar datos innecesarios
    const keysToRemove = [
      'userSettings',
      'theme',
      'persistence',
      'notifications'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Limpiar datos de usuario si existen y son muy grandes
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Si el usuario tiene datos binarios de imagen, limpiarlos
        if (user.profileImageData) {
          const cleanedUser = cleanUserForStorage(user);
          localStorage.setItem('user', JSON.stringify(cleanedUser));
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Función para verificar el tamaño del localStorage
export const getStorageSize = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
};

// Función para verificar si el localStorage está cerca del límite
export const isStorageNearLimit = () => {
  const size = getStorageSize();
  const limit = 5 * 1024 * 1024; // 5MB aproximado
  return size > limit * 0.8; // 80% del límite
};
