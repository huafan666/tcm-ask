@echo off
title 中医辨证助手
cd /d "%~dp0"

REM 优先用捆绑的便携 node（打包版自带 dist\root\node.exe），否则退到系统 node
set "NODE=%~dp0node\win-x64\node.exe"
if not exist "%NODE%" set "NODE=%~dp0dist\root\node.exe"
if not exist "%NODE%" set "NODE=node.exe"

echo.
echo   正在启动中医辨证助手（主服务）...
echo   地址：http://127.0.0.1:3088
echo   Node：%NODE%
echo   关闭本窗口即停止主服务。
echo.

chcp 65001 >nul
"%NODE%" server.js
set RC=%errorlevel%
chcp 936 >nul
if not "%RC%"=="0" goto failed
echo.
echo   主服务已退出。
pause
exit /b 0

:failed
echo.
echo   启动失败（退出码 %RC%）。
echo   可改用打包版自带的 node：dist\root\node.exe server.js
pause
exit /b %RC%
