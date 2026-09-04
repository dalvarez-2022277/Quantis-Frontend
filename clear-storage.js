// Script para limpiar localStorage y solucionar el error de quota
// Ejecutar en la consola del navegador para limpiar inmediatamente

console.log('🧹 Limpiando localStorage para solucionar error de quota...');

// Función para limpiar datos del usuario
const cleanUserData = () => {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      // Crear usuario limpio sin datos binarios
      const cleanUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      localStorage.setItem('user', JSON.stringify(cleanUser));
      console.log('✅ Usuario limpiado exitosamente');
    } catch (error) {
      console.error('❌ Error limpiando usuario:', error);
      localStorage.removeItem('user');
    }
  }
};

// Limpiar datos innecesarios
const keysToRemove = [
  'userSettings',
  'theme',
  'persistence',
  'notifications'
];

keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`🗑️ Eliminado: ${key}`);
  }
});

// Limpiar datos del usuario
cleanUserData();

// Mostrar tamaño actual
let total = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    total += localStorage[key].length + key.length;
  }
}

console.log(`📊 Tamaño actual del localStorage: ${(total / 1024).toFixed(2)} KB`);
console.log('✅ Limpieza completada. Intenta hacer login nuevamente.');
