@echo off
set SCRIPT_DIR=%~dp0

REM Default PGDATA directory
if "%PGDATA%"=="" set PGDATA=%SCRIPT_DIR%postgres_data
if "%POSTGRES_PORT%"=="" set POSTGRES_PORT=5432

if not exist "%PGDATA%" (
  echo Initializing database at %PGDATA%...
  initdb -D "%PGDATA%" || exit /b 1
)

pg_ctl -D "%PGDATA%" -l "%SCRIPT_DIR%postgres.log" -o "-p %POSTGRES_PORT%" start

