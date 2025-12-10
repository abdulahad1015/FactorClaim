import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import RepDashboard from './components/RepDashboard';
import FactoryDashboard from './components/FactoryDashboard';
import WarehouseDashboard from './components/WarehouseDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import UpdateNotification from './components/UpdateNotification';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <UpdateNotification />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rep/*"
              element={
                <ProtectedRoute allowedRoles={['Rep']}>
                  <RepDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/factory/*"
              element={
                <ProtectedRoute allowedRoles={['Factory']}>
                  <FactoryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/warehouse/*"
              element={
                <ProtectedRoute allowedRoles={['Warehouse Manager']}>
                  <WarehouseDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
