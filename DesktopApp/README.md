# FactorClaim Desktop Application

Modern Electron + React desktop application for the FactorClaim claim management system.

## Technology Stack

- **Framework**: Electron
- **UI**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS (custom)

## Project Structure

```
DesktopApp/
├── public/
│   ├── electron.js         # Main Electron process
│   ├── preload.js          # Preload script for IPC
│   └── index.html          # HTML template
├── src/
│   ├── components/         # React components
│   │   ├── Login.js        # Login component
│   │   ├── AdminDashboard.js      # Admin interface
│   │   ├── RepDashboard.js        # Representative interface
│   │   ├── FactoryDashboard.js    # Factory interface
│   │   └── ProtectedRoute.js      # Route protection
│   ├── context/
│   │   └── AuthContext.js  # Authentication context
│   ├── services/
│   │   └── api.js          # API service layer
│   ├── App.js              # Main App component
│   ├── App.css             # App styles
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables
└── README.md               # This file
```

## Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Backend API running (see Backend/README.md)

## Installation

### 1. Install Dependencies

```bash
cd DesktopApp
npm install
```

If you encounter disk space issues, install minimal dependencies:
```bash
npm install --legacy-peer-deps
```

### 2. Configuration

The application uses environment variables for configuration. Copy the example file:

```bash
copy .env.example .env
```

Edit `.env` to configure:

```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000
```

## Running the Application

### Development Mode

Start both the React dev server and Electron:

```bash
npm run electron-dev
```

This will:
1. Start the React development server on port 3000
2. Wait for the dev server to be ready
3. Launch Electron with hot-reload

### Production Mode

Build and run the production version:

```bash
# Build the React app
npm run build

# Run Electron
npm run electron
```

## Building Executables

### Windows

```bash
npm run electron-build-win
```

Output: `dist/FactorClaim Setup.exe`

### macOS

```bash
npm run electron-build-mac
```

Output: `dist/FactorClaim.dmg`

### Linux

```bash
npm run electron-build-linux
```

Output: `dist/FactorClaim.AppImage`

### All Platforms

```bash
npm run electron-build
```

## Features

### Login Interface
- Simple authentication with name and user type
- Role-based redirection
- JWT token management
- Automatic session persistence

### Admin Dashboard
- **Items Management**: Create, read, update, and delete items
- **User Management**: Add representatives and factory users
- **Statistics**: View claim statistics and verification rates
- Real-time data updates
- Search and filter functionality

### Representative Dashboard
- **Merchants Management**: Add and manage merchants
- **Claims Creation**: Create new claims with multiple items
- View claim status (pending/verified)
- Track personal claim history

### Factory Dashboard
- **Claims Processing**: View pending claims
- **Verification**: Verify claims after inspection
- Split view of pending and verified claims
- Detailed claim information display

## API Integration

The application connects to the FastAPI backend through the API service layer (`src/services/api.js`).

### Available APIs

- **Authentication**: `/api/auth/login`, `/api/auth/me`
- **Users**: `/api/users/` (CRUD operations)
- **Items**: `/api/items/` (CRUD operations)
- **Merchants**: `/api/merchants/` (CRUD operations)
- **Claims**: `/api/claims/` (CRUD operations + verify)

### Authentication

JWT tokens are automatically:
- Stored in localStorage upon login
- Attached to all API requests via Axios interceptors
- Removed on logout or 401 responses

## Troubleshooting

### Backend Connection Issues

If you see connection errors:
1. Ensure the backend is running (`cd Backend && python main.py`)
2. Check the API URL in `.env`
3. Verify CORS settings in the backend

### Build Issues

If the build fails:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Electron Not Starting

If Electron doesn't launch:
```bash
# Install electron-is-dev dependency
npm install electron-is-dev

# Try running separately
npm start  # In one terminal
npm run electron  # In another terminal
```

## Development Tips

### Hot Reload

In development mode, React changes hot-reload automatically. For Electron main process changes:
1. Stop the app (Ctrl+C)
2. Restart with `npm run electron-dev`

### Debugging

- **React DevTools**: Available in development mode
- **Electron DevTools**: Press `Ctrl+Shift+I` or `F12`
- **Console Logs**: Check both browser and terminal logs

### Code Structure

- Keep components small and focused
- Use context for global state (auth, theme, etc.)
- Put API calls in service layers
- Use CSS modules or styled-components for better scoping

## Security Considerations

- Tokens are stored in localStorage (consider using more secure storage)
- Context isolation is enabled in Electron
- Node integration is disabled for security
- All API calls go through the service layer with error handling

## Performance Optimization

- React.memo for expensive components
- Lazy loading for routes
- Debounce search inputs
- Pagination for large data sets

## Future Enhancements

- [ ] Offline support with local database
- [ ] Real-time updates with WebSockets
- [ ] Advanced reporting and analytics
- [ ] Export data to PDF/Excel
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Desktop notifications

## Contributing

When contributing:
1. Follow the existing code style
2. Write meaningful commit messages
3. Test all user flows
4. Update documentation as needed

## License

Copyright © 2025 FactorClaim Systems
