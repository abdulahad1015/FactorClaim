@echo off
echo ======================================
echo Checking MongoDB Status
echo ======================================
echo.

sc query MongoDB | findstr "RUNNING"
if %errorlevel% equ 0 (
    echo MongoDB is RUNNING
) else (
    echo MongoDB is NOT RUNNING
    echo Starting MongoDB...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Could not start MongoDB!
        echo Please install MongoDB from: https://www.mongodb.com/try/download/community
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ======================================
echo Starting Backend Server
echo ======================================
echo.

cd Backend
python main.py

pause
