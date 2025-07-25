@echo off
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%osarebito-backend"
if not exist venv\Scripts\activate.bat (
  echo Creating virtual environment...
  python -m venv venv || exit /b 1
  venv\Scripts\python.exe -m pip install --upgrade pip
  if exist requirements.txt (
    venv\Scripts\python.exe -m pip install -r requirements.txt
  )
)
cmd /k venv\Scripts\activate.bat
