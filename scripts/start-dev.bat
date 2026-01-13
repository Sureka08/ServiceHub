@echo off
echo Starting ServiceHub Development Environment...
echo.

echo Installing dependencies...
call npm run install-all

echo.
echo Starting server and client...
call npm run dev

pause








