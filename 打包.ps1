# 打包.ps1 — 用 PowerShell 打包（中文路径/文件完全安全，无 GBK 乱码问题）
$ErrorActionPreference = 'Stop'
$SRC = (Split-Path -Parent $MyInvocation.MyCommand.Path)
$NODE = 'D:\software\node\node.exe'
$OUT = Join-Path $SRC 'dist'
$ROOT = Join-Path $OUT 'root'

Write-Host '=== 打包 tcm-ask 便携版 ===' -ForegroundColor Green

if (Test-Path $OUT) { Remove-Item $OUT -Recurse -Force }

# 目录
$dirs = @('root\web','root\core','root\engine','root\llm','root\data')
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path (Join-Path $OUT $d) | Out-Null }

# 拷贝核心文件
$relFiles = @(
  'server.js','loadEnv.js','run-mvp.js',
  'core\loader.js','core\session.js',
  'engine\engine.js','engine\asker.js',
  'llm\llmClient.js','llm\wrap.js','llm\structured.js',
  'web\index.html','env.example'
)
foreach ($rel in $relFiles) {
  $f = Join-Path $SRC $rel
  if (Test-Path $f) {
    $dest = Join-Path $OUT ('root\'+$rel)
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
    Copy-Item $f $dest -Force
    Write-Host ('  拷贝 ' + $rel)
  } else {
    Write-Warning ('  缺失: ' + $f)
  }
}

# 拷贝 plugins / data 整目录
# 注意：目录已存在时必须用 'data\*' 拷贝内容，否则会套成 data\data\（历史 bug）
Copy-Item (Join-Path $SRC 'plugins') (Join-Path $OUT 'root\plugins') -Recurse -Force
Copy-Item (Join-Path $SRC 'data\*')  (Join-Path $OUT 'root\data')    -Recurse -Force
Write-Host '  拷贝 plugins/ data/'

# 清理不该进入用户包的东西：开发端布局文件、备份、以及任何误入的 dev 目录
$junk = @(
  (Join-Path $ROOT 'plugins\.layout.json'),
  (Join-Path $ROOT 'plugins\.backup'),
  (Join-Path $ROOT 'dev'),
  (Join-Path $ROOT 'plugins\dev')
)
foreach ($j in $junk) {
  if (Test-Path $j) { Remove-Item $j -Recurse -Force; Write-Host ('  已排除 ' + (Split-Path $j -Leaf)) }
}

# 拷贝便携 node.exe
if (Test-Path $NODE) {
  Copy-Item $NODE (Join-Path $ROOT 'node.exe') -Force
  Write-Host ('  拷贝 node.exe (便携 Node)')
} else {
  Write-Warning '  未找到 node.exe，请在 dist\root\ 手动放置'
}

# 生成 .env —— 优先用源码/上级的 key（保证打包版也能用 AI 解释）
$envPath = Join-Path $ROOT '.env'
$tcmKey = $null
$srcEnv = Join-Path $SRC '.env'
if (Test-Path $srcEnv) {
  $line = (Get-Content $srcEnv | Where-Object { $_ -match '^LLM_KEY=.+' } | Select-Object -First 1)
  if ($line) { $tcmKey = $line.Substring($line.IndexOf('=')+1).Trim() }
}
if (-not $tcmKey) {
  $anEnv = Join-Path $SRC '..\anoroid-app\.env'
  if (Test-Path $anEnv) {
    $line = (Get-Content $anEnv | Where-Object { $_ -match '^LLM_KEY=.+' } | Select-Object -First 1)
    if ($line) { $tcmKey = $line.Substring($line.IndexOf('=')+1).Trim() }
  }
}
@(
'# 中医辨证助手 .env',
('#' + $(if($tcmKey){'已配置 DeepSeek key，可启用 AI 解释'}else{'LLM_KEY 留空则仅规则辨证'})),
('LLM_KEY=' + $tcmKey),
'LLM_BASE_URL=https://api.deepseek.com',
'LLM_MODEL=deepseek-chat'
) | Set-Content -Path $envPath -Encoding UTF8
Write-Host ('  生成 .env (LLM_KEY ' + $(if($tcmKey){'已填入'}else{'为空·仅规则'}) + ')')

# 生成一键启动脚本（用 GBK 避免乱码；实际是 ASCII 命令 + 中文注释）
$launcher = Join-Path $OUT ( '启动中医辨证.bat')
$bt = @'
@echo off
chcp 65001 >nul
title 中医辨证助手
cd /d "%~dp0root"
if exist "%~dp0root\node.exe" (
  start "中医辨证助手" "%~dp0root\node.exe" server.js
) else (
  start "中医辨证助手" node server.js
)
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:3088
echo 服务已在后台运行。关闭本窗口即可停止。
pause
'@
$btLines = $bt -split "`n"
# Windows cmd 按系统 OEM 代码页(中文=GBK/936)解析 .bat，必须用 GBK 编码写，否则中文乱码导致执行失败
$gbk = [System.Text.Encoding]::GetEncoding(936)
[System.IO.File]::WriteAllLines($launcher, $btLines, $gbk)

# 生成使用说明（UTF-8，记事本能看）
$readme = Join-Path $OUT '使用说明.txt'
@'
中医辨证助手 —— 免安装绿色版
================================

【怎么用】
  1. 双击 "启动中医辨证.bat"
  2. 会自动启动本地服务并打开浏览器
  3. 在网页里描述病人症状，开始辨证

【AI 解释功能】
  - 默认"规则辨证"模式（不连大模型，完全可用）
  - 想启用 AI 完整病情解释：
    用记事本打开 root/.env，把 LLM_KEY= 后面填上 DeepSeek 的 key，保存后重开程序
    （key 获取: https://platform.deepseek.com）

【关闭】
  - 直接关掉黑色命令行窗口即可

【说明】
  - 纯本地运行，无需联网（AI 解释功能除外）
  - 已内置 node.exe，无需安装 Node
  - 浏览器地址固定为 http://127.0.0.1:3088
'@ | Set-Content -Path $readme -Encoding UTF8

Write-Host ''
Write-Host ('打包完成！输出目录：' + $OUT) -ForegroundColor Green
Write-Host ('主要文件: ' + (Join-Path $OUT '启动中医辨证.bat')) -ForegroundColor Cyan
