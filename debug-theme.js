// Script de prueba para verificar la configuración del tema
console.log('🔍 Verificando configuración del tema...');

// Verificar localStorage
const savedTheme = localStorage.getItem('darkMode');
console.log('💾 Tema guardado en localStorage:', savedTheme);

// Verificar preferencia del sistema
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
console.log('🖥️ Sistema prefiere modo oscuro:', systemPrefersDark);

// Verificar clases del documento
const hasDarkClass = document.documentElement.classList.contains('dark');
console.log('🎨 Documento tiene clase dark:', hasDarkClass);

// Verificar el estado actual
console.log('📊 Estado actual del tema:', {
  localStorage: savedTheme,
  systemPreference: systemPrefersDark,
  documentClass: hasDarkClass,
  bodyClass: document.body.classList.contains('dark')
});

// Función para limpiar localStorage y resetear tema
function resetTheme() {
  localStorage.removeItem('darkMode');
  document.documentElement.classList.remove('dark');
  document.body.classList.remove('dark');
  console.log('🔄 Tema reseteado a modo claro');
}

// Función para forzar modo claro
function forceLightMode() {
  localStorage.setItem('darkMode', 'false');
  document.documentElement.classList.remove('dark');
  document.body.classList.remove('dark');
  console.log('☀️ Modo claro forzado');
}

// Función para forzar modo oscuro
function forceDarkMode() {
  localStorage.setItem('darkMode', 'true');
  document.documentElement.classList.add('dark');
  document.body.classList.add('dark');
  console.log('🌙 Modo oscuro forzado');
}

console.log('🛠️ Funciones disponibles:');
console.log('- resetTheme(): Limpia localStorage y resetea a modo claro');
console.log('- forceLightMode(): Fuerza modo claro');
console.log('- forceDarkMode(): Fuerza modo oscuro');
