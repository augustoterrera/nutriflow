@echo off
setlocal enableextensions
title Sistema NutriFlow - MODO PRODUCCION

REM Next deja de intentar enviar telemetria (util para uso 100%% offline).
set NEXT_TELEMETRY_DISABLED=1

echo [1/5] Verificando Node.js y pnpm...

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] No se encontro Node.js en esta PC.
    echo   Instala Node.js 22 LTS desde https://nodejs.org y volve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] No se encontro pnpm.
    echo   Instalalo abriendo una terminal y ejecutando:  npm install -g pnpm
    echo.
    pause
    exit /b 1
)

REM Verificar la version mayor de Node (recomendado 20 o 22 LTS para que sqlite3
REM instale con binario precompilado, sin necesidad de un compilador C++).
for /f "tokens=1 delims=." %%v in ('node -v') do set "NODE_MAJOR=%%v"
set "NODE_MAJOR=%NODE_MAJOR:v=%"
if not "%NODE_MAJOR%"=="20" if not "%NODE_MAJOR%"=="22" (
    echo.
    echo [ALERTA] Estas usando Node %NODE_MAJOR%. Se recomienda Node 20 o 22 LTS.
    echo   Con otras versiones, la base de datos ^(sqlite3^) puede no instalarse
    echo   sin un compilador C++ instalado. Si la app ya funciona, ignora este aviso.
    echo.
    choice /c SN /m "Continuar de todos modos"
    if errorlevel 2 (
        echo Cancelado por el usuario.
        exit /b 1
    )
)

echo [2/5] Verificando dependencias...
if not exist "node_modules" (
    echo [ALERTA] No se encontro node_modules. Instalando dependencias con pnpm...
    echo         ^(Este paso necesita internet la primera vez.^)
    call pnpm install
    if errorlevel 1 (
        echo [ERROR] Fallo la instalacion de dependencias.
        pause
        exit /b 1
    )
)

echo [3/5] Preparando base de datos local...
call node scripts/init-db.js
if errorlevel 1 (
    echo [ERROR] No se pudo preparar la base de datos.
    pause
    exit /b 1
)

echo [4/5] Verificando build de produccion...
if not exist ".next\BUILD_ID" (
    echo No hay build generado. Ejecutando pnpm build...
    echo ^(Este paso es el mas pesado y puede tardar varios minutos en equipos lentos.^)
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

echo [5/5] Abriendo NutriFlow...
start /b "" cmd /c "timeout /t 5 >nul && start http://localhost:3000"

echo ========================================
echo NO CIERRES ESTA VENTANA MIENTRAS USES LA APP
echo ========================================
call pnpm start
pause
