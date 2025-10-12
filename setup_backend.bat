@echo off
echo Setting up FactorClaim Backend...
echo.

cd Backend

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo Copying environment configuration...
if not exist .env (
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit Backend\.env file with your MongoDB connection string and secret key!
    echo.
)

echo.
echo Backend setup complete!
echo To start the server: cd Backend && venv\Scripts\activate && python main.py
echo.
pause