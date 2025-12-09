import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { claimsAPI, usersAPI, merchantsAPI, itemsAPI, getErrorMessage } from '../services/api';

const FactoryDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Factory users should primarily use the unverified endpoint
      // but also try to get all claims for verification status tracking
      let claimsData;
      try {
        // Try to get all claims first (works for admin/rep)
        claimsData = await claimsAPI.getAll();
      } catch (err) {
        // If permission denied, fall back to unverified only (factory users)
        console.log('Using unverified claims endpoint for factory user');
        claimsData = await claimsAPI.getUnverified();
      }
      
      // Load supporting data with proper error handling for permissions
      let usersData = [];
      let merchantsData = [];
      let itemsData = [];
      
      // Try to load users (only Admin has access)
      try {
        usersData = await usersAPI.getAll();
      } catch (err) {
        console.log('Factory user does not have permission to view users list');
      }
      
      // Try to load merchants and items (all authenticated users should have access)
      try {
        const results = await Promise.all([
          merchantsAPI.getAll(),
          itemsAPI.getAll()
        ]);
        merchantsData = results[0];
        itemsData = results[1];
      } catch (err) {
        console.error('Error loading merchants/items:', err);
        setError(getErrorMessage(err, 'Failed to load some data'));
      }
      
      setClaims(claimsData);
      setUsers(usersData);
      setMerchants(merchantsData);
      setItems(itemsData);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewClaim = (claim) => {
    setSelectedClaim(claim);
  };

  const handleVerifyClaim = async (claimId, notes = '') => {
    if (window.confirm('Are you sure you want to verify this claim?')) {
      try {
        await claimsAPI.verify(claimId, {
          verified_by: user?.id,
          notes: notes
        });
        setSelectedClaim(null);
        loadData();
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to verify claim'));
      }
    }
  };

  // Helper functions to get names by ID
  const getUserName = (userId) => {
    if (!userId) return 'Unknown';
    const foundUser = users.find(u => u.id === userId || u._id === userId);
    if (foundUser) return foundUser.name;
    // If users array is empty (no permission), show a friendly fallback
    return users.length === 0 ? 'Rep' : `Rep (${userId.slice(-6)})`;
  };

  const getMerchantName = (merchantId) => {
    if (!merchantId) return 'Unknown';
    const foundMerchant = merchants.find(m => m._id === merchantId || m.id === merchantId);
    return foundMerchant ? foundMerchant.name || foundMerchant.address : `Merchant ${merchantId.slice(-6)}`;
  };

  const getItemName = (itemId) => {
    if (!itemId) return 'Unknown';
    const foundItem = items.find(i => i._id === itemId || i.id === itemId);
    return foundItem ? `${foundItem.model_name} - ${foundItem.item_type}` : `Item ${itemId.slice(-6)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const pendingClaims = claims.filter(c => !c.verified);
  const verifiedClaims = claims.filter(c => c.verified);

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand">FactorClaim - Factory</div>
        <div className="navbar-user">
          <span className="navbar-username">{user?.name}</span>
          <button onClick={handleLogout} className="navbar-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Factory Dashboard</h1>
          <p className="dashboard-subtitle">Process and verify incoming claims</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        )}

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-label">Total Claims</div>
            <div className="stat-value">{claims.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Claims</div>
            <div className="stat-value" style={{ color: '#ffc107' }}>{pendingClaims.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Verified Claims</div>
            <div className="stat-value" style={{ color: '#28a745' }}>{verifiedClaims.length}</div>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card">
              <h2>Pending Claims</h2>
              {pendingClaims.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <div className="empty-state-text">No pending claims</div>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingClaims.map((claim) => (
                      <tr key={claim._id}>
                        <td>{formatDate(claim.date)}</td>
                        <td>{claim.items?.length || 0}</td>
                        <td>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleViewClaim(claim)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <h2>Verified Claims</h2>
              {verifiedClaims.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <div className="empty-state-text">No verified claims yet</div>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifiedClaims.map((claim) => (
                      <tr key={claim._id}>
                        <td>{formatDate(claim.date)}</td>
                        <td>{claim.items?.length || 0}</td>
                        <td>
                          <span className="badge badge-success">Verified</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          onVerify={handleVerifyClaim}
          onClose={() => setSelectedClaim(null)}
          getUserName={getUserName}
          getMerchantName={getMerchantName}
          getItemName={getItemName}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

const ClaimDetailModal = ({ claim, onVerify, onClose, getUserName, getMerchantName, getItemName, formatDate }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Claim Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="form-group">
          <label className="form-label">Date</label>
          <p>{formatDate(claim.date)}</p>
        </div>

        <div className="form-group">
          <label className="form-label">Representative</label>
          <p>{getUserName(claim.rep_id)}</p>
        </div>

        <div className="form-group">
          <label className="form-label">Merchant</label>
          <p>{getMerchantName(claim.merchant_id)}</p>
        </div>

        <div className="form-group">
          <label className="form-label">Items</label>
          <table className="table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {claim.items?.map((item, index) => (
                <tr key={index}>
                  <td>{getItemName(item.item_id)}</td>
                  <td>{item.quantity}</td>
                  <td>{item.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {claim.notes && (
          <div className="form-group">
            <label className="form-label">Claim Notes</label>
            <p>{claim.notes}</p>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Status</label>
          <p>
            <span className={`badge ${claim.verified ? 'badge-success' : 'badge-warning'}`}>
              {claim.verified ? 'Verified' : 'Pending'}
            </span>
          </p>
        </div>

        {claim.verified && claim.verified_by && (
          <div className="form-group">
            <label className="form-label">Verified By</label>
            <p>{getUserName(claim.verified_by)}</p>
          </div>
        )}

        {claim.verified && claim.verified_at && (
          <div className="form-group">
            <label className="form-label">Verified At</label>
            <p>{formatDate(claim.verified_at)}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {!claim.verified && (
            <button
              type="button"
              className="btn btn-success"
              onClick={() => onVerify(claim._id)}
            >
              Verify Claim
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactoryDashboard;
