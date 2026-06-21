# Instalar NutriFlow en la PC del consultorio

## Primera vez (con internet)

1. Instalar **Node.js 22 LTS** desde https://nodejs.org (NO la versión más nueva, la **LTS**).
2. Instalar **pnpm**: abrir una terminal y ejecutar `npm install -g pnpm`.
3. Copiar la carpeta del proyecto a la PC (ej: `C:\NutriFlow`).
   **Sin** las carpetas `node_modules` ni `.next` (se generan solas).
4. Doble clic en **`NutriFlow.bat`** y esperar. La primera vez instala todo y arma el
   build (puede tardar varios minutos). Al final abre solo en el navegador.
5. Crear el PIN y entrar una vez para confirmar que anda.

## Uso diario (sin internet)

- Doble clic en **`NutriFlow.bat`**. Abre en segundos.
- No cerrar la ventana negra mientras se usa la app.

## Reglas para que siga andando

- **No borrar** las carpetas `.next` ni `node_modules`.
- Si se actualiza el código: borrar la carpeta `.next` y volver a abrir el `.bat` (con internet esa vez).

## Backups

- Se guardan solos en `data\backups\` (últimos 7 días).
- Una vez por semana, copiar la carpeta `data\` a un pendrive.
- Para restaurar: cerrar NutriFlow y reemplazar `data\tomi_nutri.sqlite` por el backup.
