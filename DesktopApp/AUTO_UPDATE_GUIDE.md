# Auto-Update Setup Guide

This guide explains how to use the auto-update feature for the FactorClaim Electron desktop application using GitHub Releases.

## Overview

The application now includes automatic update functionality using `electron-updater`. Updates are distributed via GitHub Releases, and the app automatically checks for new versions and notifies users.

## Features

- **Automatic update checks** on app startup and every 4 hours
- **User-friendly notifications** with progress indicators
- **Manual update checking** via "Check for Updates" button
- **Download progress tracking** with percentage display
- **One-click installation** after download completes
- **Safe updates** - downloads in background, installs on restart

## Prerequisites

Before you can publish updates, you need:

1. **GitHub Personal Access Token** with `repo` scope
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token (classic)
   - Select `repo` scope
   - Save the token securely

2. **Install the GitHub publisher plugin**:
   ```bash
   npm install --save-dev @electron-forge/publisher-github
   ```

## Configuration

### 1. Environment Variables

Set your GitHub token as an environment variable:

**Windows (Command Prompt):**
```cmd
set GITHUB_TOKEN=your_github_token_here
```

**Windows (PowerShell):**
```powershell
$env:GITHUB_TOKEN="your_github_token_here"
```

**Mac/Linux:**
```bash
export GITHUB_TOKEN=your_github_token_here
```

For permanent configuration, add to your system environment variables.

### 2. Version Bumping

Before releasing a new version, update the version in `package.json`:

```json
{
  "version": "1.0.1"
}
```

Use semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Building and Publishing

### Step 1: Build the Application

First, build your React app and package the Electron app:

```bash
cd DesktopApp
npm run build
npm run make
```

This creates distributable files in the `out/make` directory.

### Step 2: Publish to GitHub Releases

Publish the built application to GitHub Releases:

```bash
npm run publish
```

**Note:** Add this script to your `package.json` if not present:
```json
{
  "scripts": {
    "publish": "electron-forge publish"
  }
}
```

This will:
1. Create a new GitHub release as a **draft**
2. Upload the installation files (e.g., `.exe`, `.zip`, `RELEASES`)
3. Tag the release with your version number

### Step 3: Finalize the Release

1. Go to your GitHub repository's Releases page
2. Edit the draft release
3. Add release notes describing changes
4. **Publish the release** (remove draft status)

Once published, users will be notified of the update within 5 seconds to 4 hours (depending on when they last checked).

## Update Workflow

### For Users

1. **Automatic Check**: App checks for updates on startup and every 4 hours
2. **Notification**: If update available, notification appears in top-right corner
3. **Download**: User clicks "Download Update" button
4. **Progress**: Download progress shown with percentage
5. **Install**: After download, user clicks "Restart Now" to install
6. **Complete**: App restarts with the new version

### Manual Check

Users can manually check for updates:
- Click the "Check for Updates" button (bottom-right corner)
- Or add a menu item in your app that calls `window.electron.checkForUpdates()`

## Release Checklist

Before each release, ensure:

- [ ] Version number updated in `package.json`
- [ ] All changes committed and pushed to repository
- [ ] Application tested locally
- [ ] Build completes without errors: `npm run build && npm run make`
- [ ] GITHUB_TOKEN environment variable is set
- [ ] Publish command succeeds: `npm run publish`
- [ ] Draft release created on GitHub
- [ ] Release notes added
- [ ] Release published (not draft)

## Testing Updates

### Test in Production Mode

Auto-updates only work in production builds, not development mode.

1. **Build and install** the current version:
   ```bash
   npm run build
   npm run make
   ```
   Install the app from `out/make/squirrel.windows/x64/FactorClaimSetup.exe`

2. **Bump version** in `package.json` (e.g., 1.0.0 → 1.0.1)

3. **Build and publish** the new version:
   ```bash
   npm run build
   npm run make
   npm run publish
   ```

4. **Publish the release** on GitHub

5. **Open the installed app** and wait for update notification

6. **Download and install** the update

## Troubleshooting

### Updates Not Working

1. **Check you're in production mode**:
   - Auto-updates disabled in development (`npm start`)
   - Only works with installed/packaged app

2. **Verify GitHub Release**:
   - Release must be **published** (not draft)
   - Release must contain installation files
   - Check release assets include `RELEASES` file (Windows)

3. **Check network connectivity**:
   - App needs internet to check for updates
   - Check firewall/antivirus settings

4. **Console logs**:
   - Open DevTools in production: Add `mainWindow.webContents.openDevTools()` temporarily
   - Check console for update-related messages

### Common Issues

**"Update not available" when update exists:**
- Ensure version in release > installed version
- Check release is published (not draft)
- Verify repository owner/name in config

**Download fails:**
- Check internet connection
- Verify release assets are uploaded correctly
- Check file permissions

**Install fails:**
- Close any running instances of the app
- Run as administrator (Windows)
- Check antivirus isn't blocking installation

## CI/CD Integration

For automated releases, consider using GitHub Actions:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./DesktopApp
        run: npm ci
      
      - name: Build and publish
        working-directory: ./DesktopApp
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          npm run build
          npm run make
          npm run publish
```

## Security Considerations

1. **Code signing**: Consider code signing your app for Windows/Mac
2. **HTTPS**: Updates are downloaded over HTTPS automatically
3. **Token security**: Never commit your GITHUB_TOKEN
4. **Permissions**: Limit token scope to `repo` only

## Support

For issues or questions:
- Check the [electron-updater documentation](https://www.electron.build/auto-update)
- Open an issue on the repository
- Review the console logs for error messages

---

## Quick Reference

### Commands
```bash
# Install dependencies
npm install

# Development
npm start

# Build
npm run build

# Make distributable
npm run make

# Publish to GitHub
npm run publish
```

### File Structure
```
DesktopApp/
  ├── public/
  │   ├── electron.js          # Main process (auto-updater logic)
  │   └── preload.js           # IPC bridge
  ├── src/
  │   ├── components/
  │   │   └── UpdateNotification.js  # Update UI
  │   └── App.js               # Includes UpdateNotification
  ├── forge.config.js          # Electron Forge config
  └── package.json             # Version and repository info
```

### Key Configuration Files

**package.json:**
- `version`: Current app version
- `repository`: GitHub repo for releases
- `build.publish`: GitHub release settings

**forge.config.js:**
- `publishers`: GitHub publisher configuration

**electron.js:**
- Auto-updater initialization and event handlers
- Update check intervals

## Version History

- **1.0.0** - Initial release with auto-update support
