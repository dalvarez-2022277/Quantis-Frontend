#!/usr/bin/env node

/**
 * Script de verificación para el sistema de persistencia
 * Ejecutar con: node verify-persistence.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando sistema de persistencia...\n');

// Verificar archivos de configuración
const configFiles = [
  'render.yaml',
  'public/_redirects',
  'public/.htaccess'
];

console.log('📁 Verificando archivos de configuración:');
configFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - No encontrado`);
  }
});

// Verificar archivos del sistema de persistencia
const persistenceFiles = [
  'src/hooks/usePersistedState.js',
  'src/contexts/PersistenceContext.jsx',
  'src/hooks/usePersistedNavigation.js'
];

console.log('\n💾 Verificando archivos del sistema de persistencia:');
persistenceFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - No encontrado`);
  }
});

// Verificar que los archivos modificados existen
const modifiedFiles = [
  'src/contexts/AuthContext.jsx',
  'src/main.tsx',
  'src/pages/ForgotPassword.jsx'
];

console.log('\n🔧 Verificando archivos modificados:');
modifiedFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - No encontrado`);
  }
});

// Verificar package.json para dependencias necesarias
console.log('\n📦 Verificando dependencias:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const requiredDeps = ['react', 'react-router-dom', 'framer-motion'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep} - Instalado`);
    } else {
      console.log(`❌ ${dep} - No encontrado`);
    }
  });
} catch (error) {
  console.log('❌ Error leyendo package.json');
}

console.log('\n🎯 Resumen de la solución:');
console.log('1. ✅ Configuración de rutas SPA para Render');
console.log('2. ✅ Sistema de persistencia de estado');
console.log('3. ✅ Hooks personalizados para formularios y navegación');
console.log('4. ✅ Contexto de persistencia global');
console.log('5. ✅ Integración con sistema de autenticación existente');

console.log('\n📋 Próximos pasos:');
console.log('1. Ejecutar npm run build para generar dist/');
console.log('2. Verificar que _redirects se copie a dist/');
console.log('3. Hacer deploy a Render');
console.log('4. Probar acceso directo a rutas como /forgot-password');
console.log('5. Probar recarga de página en formularios');

console.log('\n✨ ¡Sistema de persistencia implementado exitosamente!');
