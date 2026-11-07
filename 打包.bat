@echo off
chcp 65001 >nul
title 打包中医辨证助手
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0打包.ps1"
pause
