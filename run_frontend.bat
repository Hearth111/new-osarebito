@echo off
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%osarebito-frontend"
if not exist node_modules (
  echo Installing dependencies...
  npm install || exit /b 1
)
npm run dev
