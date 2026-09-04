# Script de build para Render - Windows PowerShell
Write-Host "🚀 Iniciando build para Render..." -ForegroundColor Green

# Limpiar dist anterior
Write-Host "🧹 Limpiando dist anterior..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Ejecutar build
Write-Host "📦 Ejecutando build..." -ForegroundColor Blue
npm run build

# Verificar que los archivos de configuración estén en dist
Write-Host "🔍 Verificando archivos de configuración..." -ForegroundColor Cyan

$files = @("_redirects", "render-redirects", "render.json", ".htaccess")

foreach ($file in $files) {
    if (Test-Path "dist/$file") {
        Write-Host "✅ $file encontrado en dist/" -ForegroundColor Green
    } else {
        Write-Host "❌ $file NO encontrado en dist/" -ForegroundColor Red
    }
}

Write-Host "✨ Build completado. Listo para deploy a Render!" -ForegroundColor Green
