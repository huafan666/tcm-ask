@echo off
title 中医辨证助手 · 云平台
cd /d "%~dp0.."

REM 平台用到 Node 24 内置的 node:sqlite，需要系统 node
where node >nul 2>nul
if errorlevel 1 goto nonode

set "PORT=3095"
if defined PLATFORM_PORT set "PORT=%PLATFORM_PORT%"

REM 端口已经在监听 → 平台八成已经开着了，别硬起第二个（会 EADDRINUSE 直接退出）
netstat -ano | findstr /R /C:"[.:]%PORT% " | findstr LISTENING >nul
if not errorlevel 1 goto running

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
echo   地址：http://127.0.0.1:%PORT%
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

:running
echo.
echo   平台已经在运行了（端口 %PORT% 正在监听），不用再启动一次。
echo   这就帮你打开：http://127.0.0.1:%PORT%
echo   要重启就先关掉原来那个黑窗口，或改用别的端口：set PLATFORM_PORT=3096
echo.
start "" "http://127.0.0.1:%PORT%"
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
echo   多半是端口 %PORT% 被别的程序占着：netstat -ano ^| findstr :%PORT%
echo   或换个端口：set PLATFORM_PORT=3096
echo.
pause
exit /b %RC%
