# FactorClaim - Quick Start Guide

## Overview

FactorClaim is now built with **Electron + React** for a modern, cross-platform desktop experience.

## 🚀 Quick Start

### 1. Setup Backend

```bash
cd Backend
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r requirements.txt
python main.py
```

The backend will run on `http://localhost:8000`

### 2. Setup Desktop App

**Option A: Using Setup Script (Recommended)**
```bash
# From project root
setup_desktop.bat        # Windows
# or
./setup_desktop.sh       # Linux/Mac
```

**Option B: Manual Setup**
```bash
cd DesktopApp
npm install
copy .env.example .env
npm run electron-dev
```

## 📦 What Changed?

### Before (PyQt)
- Python-based desktop app
- PyQt6 for UI
- Complex threading for async operations
- Platform-specific styling issues

### After (Electron + React)
- Modern JavaScript stack
- React for UI components
- Native async/await support
- Consistent cross-platform appearance
- Hot-reload in development
- Easy to customize and extend

## 🎯 Key Features

### For Admins
- Manage items (create, edit, delete)
- Manage users (representatives, factory users)
- View comprehensive statistics
- Monitor verification rates

### For Representatives
- Add and manage merchants
- Create claim orders
- Track claim status
- View claim history

### For Factory Users
- View pending claims
- Verify received orders
- Track verification progress
- View verified claims

## 🛠 Development

### Running in Development
```bash
cd DesktopApp
npm run electron-dev
```

This starts both React dev server and Electron with hot-reload.

### Building for Production
```bash
cd DesktopApp

# Windows
npm run electron-build-win

# macOS
npm run electron-build-mac

# Linux
npm run electron-build-linux
```

## 📁 Project Structure

```
FactorClaim/
├── Backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── models/         # Database models
│   │   └── utils/          # Utilities
│   └── main.py
│
└── DesktopApp/             # Electron + React Frontend
    ├── public/
    │   ├── electron.js     # Main process
    │   └── preload.js      # IPC bridge
    ├── src/
    │   ├── components/     # React components
    │   ├── context/        # React context
    │   ├── services/       # API services
    │   └── App.js
    └── package.json
```

## 🔧 Configuration

### Backend (.env)
```env
MONGODB_URL=mongodb://localhost:27017/factorclaim
SECRET_KEY=your-secret-key-here
```

### Frontend (.env)
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000
```

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Ensure backend is running on port 8000
- Check `REACT_APP_API_BASE_URL` in DesktopApp/.env
- Verify CORS settings in backend

### "npm install fails"
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "Electron won't start"
```bash
# Install electron-is-dev
npm install electron-is-dev

# Or run separately
npm start                # Terminal 1
npm run electron         # Terminal 2
```

## 📚 Documentation

- [Desktop App README](DesktopApp/README.md) - Detailed frontend docs
- [Backend README](Backend/README.md) - Backend API docs
- [SETUP.md](SETUP.md) - Complete setup instructions

## 🎨 Customization

### Changing Theme Colors
Edit `DesktopApp/src/index.css` and `DesktopApp/src/App.css`

### Adding New Features
1. Create component in `src/components/`
2. Add API call in `src/services/api.js`
3. Update routes in `src/App.js`

### Modifying Electron Window
Edit `DesktopApp/public/electron.js`

## 🚢 Deployment

### Desktop App Distribution
```bash
cd DesktopApp
npm run electron-build
```

Executables will be in `DesktopApp/dist/`

### Backend Deployment
Deploy to any server supporting Python/FastAPI:
- AWS EC2
- Heroku
- DigitalOcean
- Azure App Service

## 📝 Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Run backend server
4. ✅ Run desktop app
5. 🎉 Start using FactorClaim!

## 💡 Tips

- Use `Ctrl+Shift+I` in the app to open DevTools
- Backend API docs: `http://localhost:8000/docs`
- Keep backend running while using the app
- Regular `git pull` to get updates

## 📞 Support

For issues or questions:
- Check the README files
- Review the troubleshooting section
- Open an issue on GitHub

---

**Version:** 2.0.0 (Electron + React)  
**Last Updated:** October 2025
