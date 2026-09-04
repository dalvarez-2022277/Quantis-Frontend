#!/bin/bash

echo "🚀 Iniciando build para Render..."

# Limpiar dist anterior
echo "🧹 Limpiando dist anterior..."
rm -rf dist

# Ejecutar build
echo "📦 Ejecutando build..."
npm run build

# Verificar que los archivos de configuración estén en dist
echo "🔍 Verificando archivos de configuración..."
if [ -f "dist/_redirects" ]; then
    echo "✅ _redirects encontrado en dist/"
else
    echo "❌ _redirects NO encontrado en dist/"
fi

if [ -f "dist/render-redirects" ]; then
    echo "✅ render-redirects encontrado en dist/"
else
    echo "❌ render-redirects NO encontrado en dist/"
fi

if [ -f "dist/render.json" ]; then
    echo "✅ render.json encontrado en dist/"
else
    echo "❌ render.json NO encontrado en dist/"
fi

if [ -f "dist/.htaccess" ]; then
    echo "✅ .htaccess encontrado en dist/"
else
    echo "❌ .htaccess NO encontrado en dist/"
fi

echo "✨ Build completado. Listo para deploy a Render!"
