@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-windows.ps1"
if errorlevel 1 (
    echo.
    echo   Something went wrong. Press any key to close...
    pause > nul
)
