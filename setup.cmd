@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (echo Install Node.js 24 LTS first. & pause & exit /b 1)
node scripts/setup.mjs
if errorlevel 1 (pause & exit /b 1)
call npm ci --ignore-scripts
if errorlevel 1 (pause & exit /b 1)
echo Invite the bot using the URL above, then press a key.
pause
call npm run register
if errorlevel 1 (pause & exit /b 1)
echo Ready. Run start.cmd to keep the bot online.
pause
