@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo   SQL Middle Academy - публичный запуск
echo ============================================================
echo.
echo 1) Запускаю локальный сервер (порт 4000)...
start "SQL Academy: server" cmd /k "node server/index.js"
timeout /t 2 >nul

echo 2) Запускаю SSH-туннель localhost.run...
echo.
echo    В окне "SQL Academy: tunnel" появится строка вида:
echo      https://xxxxxxxx.lhr.life tunneled with tls termination
echo    Это и есть публичный адрес — откройте его на телефоне.
echo.
start "SQL Academy: tunnel" cmd /k "ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=%~dp0.known_hosts -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -R 80:localhost:4000 nokey@localhost.run"

echo.
echo Готово. Не закрывайте оба окна, пока пользуетесь сайтом.
pause
