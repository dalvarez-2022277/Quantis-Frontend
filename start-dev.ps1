Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Iniciando Quantis - Modo Desarrollo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Iniciando Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Write-Host "[2/3] Esperando 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "[3/3] Iniciando Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Aplicacion iniciada correctamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Blue
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
