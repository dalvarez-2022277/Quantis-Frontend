@echo off
echo ========================================
echo    Iniciando Quantis - Modo Desarrollo
echo ========================================
echo.

echo [1/3] Iniciando Backend...
start "Backend - Quantis" cmd /k "cd backend && npm run dev"

echo [2/3] Esperando 3 segundos...
timeout /t 3 /nobreak > nul

echo [3/3] Iniciando Frontend...
start "Frontend - Quantis" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo    Aplicacion iniciada correctamente!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
