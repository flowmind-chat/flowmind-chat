@echo off
title 🚀 FlowMind Chat - Full Stack Starter
color 0B

echo ======================================
echo        FLOWMIND CHAT STARTER
echo ======================================
echo.
echo Initializing environment...

:: ======= Start Backend =======
echo Starting backend server on port 7000...
start cmd /k "cd /d C:\Users\RF\Desktop\flowmind-chat && node server.js"

timeout /t 3 >nul

:: ======= Start Frontend =======
echo Starting frontend dashboard on port 3000...
start cmd /k "cd /d C:\Users\RF\Desktop\flowmind-chat\frontend\flowmind-dashboard-new && npm start"

timeout /t 3 >nul

:: ======= Start ngrok for WhatsApp Webhook =======
echo Starting ngrok tunnel (exposing port 7000)...
start cmd /k "cd /d C:\Users\RF\AppData\Roaming\npm && ngrok http 7000"

echo.
echo ======================================
echo 💡 FlowMind system is now launching!
echo - Backend  → http://localhost:7000
echo - Frontend → http://localhost:3000
echo - ngrok URL will appear in ngrok window
echo ======================================
echo.
pause
