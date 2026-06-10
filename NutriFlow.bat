@echo off
title Sistema NutriFlow - MODO PRODUCCION
echo [1/4] Verificando entorno...

if not exist "node_modules" (
    echo [ALERTA] No se encontro node_modules. Instalando dependencias con pnpm...
    call pnpm install
)

echo [2/4] Preparando base de datos local...
call node scripts/init-db.js
if errorlevel 1 (
    echo [ERROR] No se pudo preparar la base de datos.
    pause
    exit /b 1
)

echo [3/4] Verificando build de produccion...
if not exist ".next\BUILD_ID" (
    echo No hay build generado. Ejecutando pnpm build...
    call pnpm build
    if errorlevel 1 (
        echo [ERROR] Fallo el build.
        pause
        exit /b 1
    )
) else (
    echo Build existente detectado.
    echo Para forzar rebuild despues de actualizar codigo, borra la carpeta .next y ejecuta este archivo otra vez.
)

echo [4/4] Abriendo NutriFlow...
start /b "" cmd /c "timeout /t 5 >nul && start http://localhost:3000"

echo ========================================
echo NO CIERRES ESTA VENTANA MIENTRAS USES LA APP
echo ========================================
call pnpm start
pause
