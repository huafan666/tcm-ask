@echo off
chcp 65001 >nul
title TCM-ask DEV canvas (127.0.0.1:3090)
cd /d "%~dp0.."

rem Prefer node from PATH; fall back to the bundled portable node in dist\root
set "NODE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE=%~dp0..\dist\root\node.exe"
if /i not "%NODE%"=="node" if not exist "%NODE%" goto nonode

echo.
echo   [DEV] TCM-ask developer canvas
echo   [DEV] URL  : http://127.0.0.1:3090
echo   [DEV] Node : %NODE%
echo   [DEV] Keep this window open. Close it to stop the dev server.
echo   [DEV] The Chinese lines below are printed by node itself.
echo.

start "" http://127.0.0.1:3090
"%NODE%" dev\server.js
set RC=%errorlevel%
echo.
echo   [DEV] dev server exited, code %RC%
pause
exit /b %RC%

:nonode
echo.
echo   ERROR: node not found (not in PATH, and dist\root\node.exe is missing).
echo   Install Node.js, or run:  dist\root\node.exe dev\server.js
echo.
pause
exit /b 1
