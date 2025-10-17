@echo off
echo Running claims date migration...
cd Backend
python migrate_claims_dates.py
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Migration completed successfully!
    echo You can now restart the backend server.
) else (
    echo.
    echo Migration failed. Please check the error messages above.
)
pause
