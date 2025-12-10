import React, { useState, useEffect } from 'react';
import './UpdateNotification.css';

const UpdateNotification = () => {
  const [updateState, setUpdateState] = useState('idle'); // idle, checking, available, downloading, downloaded, error
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Only run if electron API is available (not in browser mode)
    if (!window.electron) return;

    // Set up event listeners
    const unsubscribeChecking = window.electron.onUpdateChecking(() => {
      setUpdateState('checking');
      setShowNotification(true);
    });

    const unsubscribeAvailable = window.electron.onUpdateAvailable((info) => {
      setUpdateState('available');
      setUpdateInfo(info);
      setShowNotification(true);
    });

    const unsubscribeNotAvailable = window.electron.onUpdateNotAvailable(() => {
      setUpdateState('not-available');
      setTimeout(() => setShowNotification(false), 3000);
    });

    const unsubscribeError = window.electron.onUpdateError((error) => {
      setUpdateState('error');
      setErrorMessage(error);
      setShowNotification(true);
    });

    const unsubscribeProgress = window.electron.onUpdateDownloadProgress((progress) => {
      setUpdateState('downloading');
      setDownloadProgress(Math.round(progress.percent));
      setShowNotification(true);
    });

    const unsubscribeDownloaded = window.electron.onUpdateDownloaded((info) => {
      setUpdateState('downloaded');
      setUpdateInfo(info);
      setShowNotification(true);
    });

    // Clean up listeners on unmount
    return () => {
      unsubscribeChecking && unsubscribeChecking();
      unsubscribeAvailable && unsubscribeAvailable();
      unsubscribeNotAvailable && unsubscribeNotAvailable();
      unsubscribeError && unsubscribeError();
      unsubscribeProgress && unsubscribeProgress();
      unsubscribeDownloaded && unsubscribeDownloaded();
    };
  }, []);

  const handleDownload = () => {
    if (window.electron) {
      window.electron.downloadUpdate();
    }
  };

  const handleInstall = () => {
    if (window.electron) {
      window.electron.installUpdate();
    }
  };

  const handleCheckForUpdates = () => {
    if (window.electron) {
      window.electron.checkForUpdates();
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification) {
    return (
      <button className="check-updates-btn" onClick={handleCheckForUpdates}>
        Check for Updates
      </button>
    );
  }

  return (
    <div className="update-notification">
      {updateState === 'checking' && (
        <div className="update-card update-checking">
          <div className="update-spinner"></div>
          <p>Checking for updates...</p>
        </div>
      )}

      {updateState === 'not-available' && (
        <div className="update-card update-not-available">
          <span className="update-icon">✓</span>
          <p>You're up to date!</p>
        </div>
      )}

      {updateState === 'available' && (
        <div className="update-card update-available">
          <span className="update-icon">🔔</span>
          <div className="update-content">
            <h3>Update Available</h3>
            <p>Version {updateInfo?.version} is available</p>
            <div className="update-actions">
              <button className="btn-primary" onClick={handleDownload}>
                Download Update
              </button>
              <button className="btn-secondary" onClick={handleDismiss}>
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {updateState === 'downloading' && (
        <div className="update-card update-downloading">
          <div className="update-content">
            <h3>Downloading Update...</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <p>{downloadProgress}% complete</p>
          </div>
        </div>
      )}

      {updateState === 'downloaded' && (
        <div className="update-card update-downloaded">
          <span className="update-icon">✓</span>
          <div className="update-content">
            <h3>Update Downloaded</h3>
            <p>Restart to install version {updateInfo?.version}</p>
            <div className="update-actions">
              <button className="btn-primary" onClick={handleInstall}>
                Restart Now
              </button>
              <button className="btn-secondary" onClick={handleDismiss}>
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {updateState === 'error' && (
        <div className="update-card update-error">
          <span className="update-icon">⚠️</span>
          <div className="update-content">
            <h3>Update Error</h3>
            <p>{errorMessage}</p>
            <button className="btn-secondary" onClick={handleDismiss}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateNotification;
