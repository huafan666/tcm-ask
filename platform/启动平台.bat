@echo off
chcp 65001 >nul
title 中医辨证助手 · 云平台（本地多用户 demo）
cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo 没找到 node，请先安装 Node.js 18+（本项目用 Node 24 内置的 node:sqlite）
  echo.
  pause
  exit /b 1
)

if not exist "platform\data\platform.db" (
  echo 首次运行，正在初始化演示数据...
  node platform\seed.js
  echo.
)

node platform\server.js
pause
