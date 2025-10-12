# CORS and Backend Error Fix

## Issues
1. CORS error blocking requests from localhost:3000
2. 500 Internal Server Error on login

## Fixes Applied

### 1. Enhanced simple-login endpoint
- Added try-catch error handling
- Better error messages
- Fixed imports

### 2. Updated CORS configuration
- Added more allowed origins
- Already configured in `config.py`

## Steps to Fix

### 1. Check if MongoDB is Running

**Windows:**
```cmd
# Check if MongoDB service is running
sc query MongoDB

# If not running, start it:
net start MongoDB
```

**Alternative: Check if mongod process is running:**
```cmd
tasklist | findstr mongod
```

### 2. Restart Backend Server

**In your Backend terminal:**
```cmd
# Stop the current server (Ctrl+C)
# Then restart:
cd Backend
python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. Test the Endpoint

Open a new terminal and test:
```cmd
curl -X POST "http://localhost:8000/api/auth/simple-login?name=abdul&type=Admin"
```

Should return JSON with user and token.

### 4. Restart Frontend

**In your DesktopApp terminal:**
```cmd
# Stop (Ctrl+C) if running, then:
npm run electron-dev
```

## Troubleshooting

### If MongoDB is not installed:

1. **Download MongoDB Community Server:**
   https://www.mongodb.com/try/download/community

2. **Install and start service:**
   - During installation, choose "Install MongoDB as a Service"
   - Or manually start: `net start MongoDB`

### If still getting CORS errors:

The CORS configuration is already set in `Backend/app/core/config.py`:
```python
cors_origins: List[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]
```

Make sure to **restart the backend** after any changes!

### If getting connection errors:

Check MongoDB connection string in `Backend/.env`:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=factorclaim
```

## Quick Test Checklist

- [ ] MongoDB service is running
- [ ] Backend starts without errors
- [ ] Can access http://localhost:8000/docs
- [ ] Frontend starts without errors
- [ ] Can login with any name/type
- [ ] No CORS errors in browser console
