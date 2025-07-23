@echo off
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%osarebito-frontend"
npm install
npm run dev
