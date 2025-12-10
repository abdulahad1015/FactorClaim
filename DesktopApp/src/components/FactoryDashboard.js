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

  const getStatusBadge = (status) => {
    const statusColors = {
      'Bilty Pending': 'badge-warning',
      'Approval Pending': 'badge-info',
      'Approved': 'badge-success',
      'Rejected': 'badge-danger'
    };
    return (
      <span className={`badge ${statusColors[status] || 'badge-secondary'}`}>
        {status || 'Pending'}
      </span>
    );
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
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingClaims.map((claim) => (
                      <tr key={claim._id}>
                        <td>{formatDate(claim.date)}</td>
                        <td>{claim.items?.length || 0}</td>
                        <td>{getStatusBadge(claim.status)}</td>
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
                      <tr key={claim._id} onClick={() => handleViewClaim(claim)} style={{ cursor: 'pointer' }}>
                        <td>{formatDate(claim.date)}</td>
                        <td>{claim.items?.length || 0}</td>
                        <td>{getStatusBadge(claim.status)}</td>
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
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState('');

  const getStatusBadge = (status) => {
    const statusColors = {
      'Bilty Pending': 'badge-warning',
      'Approval Pending': 'badge-info',
      'Approved': 'badge-success',
      'Rejected': 'badge-danger'
    };
    return (
      <span className={`badge ${statusColors[status] || 'badge-secondary'}`}>
        {status || 'Pending'}
      </span>
    );
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this claim?')) {
      return;
    }

    setIsApproving(true);
    setApprovalError('');

    try {
      await claimsAPI.approve(claim._id || claim.id);
      alert('Claim approved successfully!');
      onClose();
      window.location.reload(); // Refresh to show updated data
    } catch (err) {
      setApprovalError(getErrorMessage(err, 'Failed to approve claim'));
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h2 className="modal-title">Claim Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div style={{ padding: '20px' }}>
          {/* Basic Information */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>Claim Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong>Claim ID:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '1.1em', color: '#0066cc' }}>
                  {claim.claim_id || 'N/A'}
                </div>
              </div>
              <div>
                <strong>Date:</strong>
                <div>{formatDate(claim.date)}</div>
              </div>
              <div>
                <strong>Representative:</strong>
                <div>{getUserName(claim.rep_id)}</div>
              </div>
              <div>
                <strong>Merchant:</strong>
                <div>{getMerchantName(claim.merchant_id)}</div>
              </div>
              <div>
                <strong>Status:</strong>
                <div>{getStatusBadge(claim.status)}</div>
              </div>
            </div>
          </div>

          {/* Bilty Number */}
          {claim.bilty_number && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Bilty Information</h3>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#d4edda', 
                border: '1px solid #c3e6cb', 
                borderRadius: '4px'
              }}>
                <strong>Bilty Number:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '1.1em', marginTop: '5px' }}>
                  {claim.bilty_number}
                </div>
              </div>
            </div>
          )}

          {/* Approval Section */}
          {claim.status === 'Approval Pending' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#cce5ff', 
                border: '1px solid #b8daff', 
                borderRadius: '4px'
              }}>
                <p style={{ marginBottom: '10px', color: '#004085' }}>
                  <strong>⚠️ This claim is pending your approval</strong>
                </p>
                <p style={{ marginBottom: '15px', fontSize: '0.9em', color: '#004085' }}>
                  The bilty number has been added by the representative. Please review and approve.
                </p>
                {approvalError && (
                  <div style={{ color: '#dc3545', fontSize: '0.875em', marginBottom: '10px', padding: '8px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
                    {approvalError}
                  </div>
                )}
                <button
                  className="btn btn-success"
                  onClick={handleApprove}
                  disabled={isApproving}
                  style={{ width: '100%' }}
                >
                  {isApproving ? 'Approving...' : '✓ Approve Claim'}
                </button>
              </div>
            </div>
          )}

          {/* Verification Status (for approved claims) */}
          {claim.status === 'Approved' && claim.verified && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Approval Details</h3>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#d4edda', 
                border: '1px solid #c3e6cb', 
                borderRadius: '4px',
                color: '#155724'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>✓ This claim has been approved</strong>
                </div>
                {claim.verified_by && (
                  <div>Approved By: {getUserName(claim.verified_by)}</div>
                )}
                {claim.verified_at && (
                  <div>Approval Date: {formatDate(claim.verified_at)}</div>
                )}
              </div>
            </div>
          )}

          {/* Items Details */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>Claimed Items ({claim.items?.length || 0})</h3>
            {claim.items && claim.items.length > 0 ? (
              <table className="table" style={{ marginTop: '10px' }}>
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
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No items in this claim
              </div>
            )}
          </div>

          {/* Claim Notes */}
          {claim.notes && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Claim Notes</h3>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '4px'
              }}>
                {claim.notes}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '15px', borderTop: '1px solid #dee2e6' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactoryDashboard;
