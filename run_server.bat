@echo off
title Student Expense Tracker Local Server
echo ======================================================
echo  Student Expense Tracker - Local Server (Port 8000)
echo ======================================================
echo.
echo Starting local web server at http://localhost:8000 ...
start "" "http://localhost:8000"
python -m http.server 8000 --bind 127.0.0.1
pause
