@echo off
title AI-Powered Journaling Platform - Client Launch Script
echo ========================================================
echo   AI-POWERED JOURNALING PLATFORM - SAAS CLIENT RELEASE
echo ========================================================
echo.
echo Starting application containers via Docker Compose...
echo.

docker-compose up --build -d

echo.
echo ========================================================
echo Application is running!
echo Access the SaaS App in your browser: http://localhost:3000
echo ========================================================
echo.
pause
