@echo off
title 中医辨证助手 · 云平台
cd /d "%~dp0.."

REM 平台用到 Node 24 内置的 node:sqlite，需要系统 node
where node >nul 2>nul
if errorlevel 1 goto nonode

if exist "platform\data\platform.db" goto seeded
echo.
echo   首次运行，正在初始化演示数据...
chcp 65001 >nul
node platform\seed.js
chcp 936 >nul
echo.
:seeded

echo.
echo   正在启动云平台...
echo   地址：http://127.0.0.1:3095
echo   演示账号：admin/admin123  doctor/doctor123  patient/patient123
echo   关闭本窗口即停止服务。
echo.

chcp 65001 >nul
node platform\server.js
set RC=%errorlevel%
chcp 936 >nul
if not "%RC%"=="0" goto failed
echo.
echo   平台已退出。
pause
exit /b 0

:nonode
echo.
echo   没找到 node，请先安装 Node.js 24（本项目用 Node 内置的 node:sqlite）。
echo   下载：https://nodejs.org/
pause
exit /b 1

:failed
echo.
echo   启动失败（退出码 %RC%）。
echo   可手动运行：node platform\server.js
pause
exit /b %RC%
