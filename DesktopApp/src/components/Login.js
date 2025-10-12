import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('Admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim()) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }

    const result = await login(name, userType);
    
    if (result.success) {
      // Redirect based on user type
      switch (userType) {
        case 'Admin':
          navigate('/admin');
          break;
        case 'Rep':
          navigate('/rep');
          break;
        case 'Factory':
          navigate('/factory');
          break;
        default:
          navigate('/');
      }
    } else {
      // Handle error properly - extract message from error object
      const errorMessage = typeof result.error === 'string' 
        ? result.error 
        : result.error?.detail || result.error?.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>FactorClaim</h1>
          <p>Claim Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              id="name"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="userType" className="form-label">User Type</label>
            <select
              id="userType"
              className="form-control"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              disabled={loading}
            >
              <option value="Admin">Admin</option>
              <option value="Rep">Representative</option>
              <option value="Factory">Factory User</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
