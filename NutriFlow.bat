@echo off
title Sistema NutriFlow - MODO LOCAL
echo [1/3] Verificando entorno...

:: Comprobar si existe node_modules, si no, intentar instalar
if not exist "node_modules" (
    echo [ALERTA] No se encontro node_modules. Instalando dependencias...
    call pnpm install
)

echo [2/3] Iniciando el servidor en segundo plano...
:: Abrir el navegador despues de 5 segundos para dar tiempo al build
start /b "" cmd /c "timeout /t 5 >nul && start http://localhost:3000"

echo [3/3] Ejecutando NutriFlow...
echo ========================================
echo NO CIERRES ESTA VENTANA MIENTRAS USES LA APP
echo ========================================
call pnpm dev
pause