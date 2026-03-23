import React, { useState, useEffect, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
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

  const handleVerifyClaim = async (claimId, notes = '', itemResults = null) => {
    try {
      const verifyData = {
        verified_by: user?.id,
        notes: notes
      };
      if (itemResults) {
        verifyData.item_results = itemResults;
      }
      await claimsAPI.verify(claimId, verifyData);
      setSelectedClaim(null);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to verify claim'));
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
    return foundItem ? `${foundItem.model_name}-${foundItem.wattage}W-${foundItem.batch}` : `Item ${itemId.slice(-6)}`;
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

  const getStatusBadge = (claim) => {
    if (claim.verified) {
      return <span className="badge badge-success">Verified</span>;
    }
    const statusColors = {
      'Bilty Pending': 'badge-warning',
      'Approval Pending': 'badge-info',
      'Approved': 'badge-success',
      'Rejected': 'badge-danger'
    };
    const status = claim.status;
    return (
      <span className={`badge ${statusColors[status] || 'badge-secondary'}`}>
        {status || 'Pending'}
      </span>
    );
  };

  const pendingClaims = claims.filter(c => !c.verified && c.status !== 'Bilty Pending');
  const verifiedClaims = claims.filter(c => c.verified);

  const filterClaims = (claimsList) => {
    let filtered = claimsList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        (c.claim_id || '').toLowerCase().includes(q) ||
        getMerchantName(c.merchant_id).toLowerCase().includes(q) ||
        getUserName(c.rep_id).toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(c => {
        const d = new Date(c.date);
        if (isNaN(d.getTime())) return false;
        const diffDays = (now - d) / (1000 * 60 * 60 * 24);
        if (dateFilter === '7') return diffDays <= 7;
        if (dateFilter === '30') return diffDays <= 30;
        if (dateFilter === '90') return diffDays <= 90;
        return true;
      });
    }

    return filtered;
  };

  const displayedClaims = filterClaims(activeTab === 'pending' ? pendingClaims : verifiedClaims);

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
            <button onClick={() => setError('')} className="alert-dismiss">×</button>
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

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pending'); setSearchQuery(''); setStatusFilter('all'); setDateFilter('all'); }}
          >
            Pending ({pendingClaims.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'verified' ? 'active' : ''}`}
            onClick={() => { setActiveTab('verified'); setSearchQuery(''); setStatusFilter('all'); setDateFilter('all'); }}
          >
            Verified ({verifiedClaims.length})
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'fixed', gap: '10px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Claim ID, merchant, or rep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: '1', minWidth: '20px' }}
            />

            <select
              className="form-control"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '140px' }}
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : displayedClaims.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">{activeTab === 'pending' ? '✅' : '📦'}</div>
              <div className="empty-state-text">
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'No claims match your filters'
                  : activeTab === 'pending' ? 'No pending claims' : 'No verified claims yet'}
              </div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedClaims.map((claim) => (
                  <tr key={claim._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.9em', color: '#0066cc' }}>{claim.claim_id || 'N/A'}</td>
                    <td>{formatDate(claim.date)}</td>
                    <td>{getMerchantName(claim.merchant_id)}</td>
                    <td>{claim.items?.length || 0}</td>
                    <td>{getStatusBadge(claim)}</td>
                    <td>
                      <button
                        className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => handleViewClaim(claim)}
                      >
                        {activeTab === 'pending' ? 'Verify' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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

  // Scanning verification state - start directly in scan mode for pending claims
  const isPending = !claim.verified && claim.status !== 'Approved';
  const [scanMode, setScanMode] = useState(isPending);
  const [batchCode, setBatchCode] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const [scannedCounts, setScannedCounts] = useState({});
  // scannedCounts = { item_id: scannedQuantity }

  const getStatusBadgeLocal = (claimObj) => {
    if (claimObj.verified) {
      return <span className="badge badge-success">Verified</span>;
    }
    const statusColors = {
      'Bilty Pending': 'badge-warning',
      'Approval Pending': 'badge-info',
      'Approved': 'badge-success',
      'Rejected': 'badge-danger'
    };
    const status = claimObj.status;
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
      window.location.reload();
    } catch (err) {
      setApprovalError(getErrorMessage(err, 'Failed to approve claim'));
    } finally {
      setIsApproving(false);
    }
  };

  // Calculate total required and total scanned
  const totalRequired = (claim.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalScanned = Object.values(scannedCounts).reduce((sum, count) => sum + count, 0);
  const allItemsScanned = claim.items && claim.items.length > 0 && claim.items.every(
    item => (scannedCounts[item.item_id] || 0) >= (item.quantity || 0)
  );

  const verifyButtonRef = useRef(null);

  useEffect(() => {
    if (allItemsScanned && verifyButtonRef.current) {
      verifyButtonRef.current.focus();
    }
  }, [allItemsScanned]);

  const handleScan = async (e) => {
    if (e.key === 'Enter' && batchCode.trim()) {
      e.preventDefault();
      setScanError('');
      setScanSuccess('');
      try {
        const item = await itemsAPI.getByBatch(batchCode.trim());
        if (item) {
          // Check if this item is part of the claim
          const claimItem = (claim.items || []).find(ci => ci.item_id === item._id);
          if (!claimItem) {
            setScanError(`Item "${item.model_name} (${item.batch})" is not part of this claim.`);
            setBatchCode('');
            return;
          }

          const currentScanned = scannedCounts[item._id] || 0;
          const requiredQty = claimItem.quantity || 0;

          if (currentScanned >= requiredQty) {
            setScanError(`"${item.model_name}" already fully scanned (${requiredQty}/${requiredQty}).`);
            setBatchCode('');
            return;
          }

          // Increment scanned count
          const newCount = currentScanned + 1;
          setScannedCounts(prev => ({
            ...prev,
            [item._id]: newCount
          }));

          const remaining = requiredQty - newCount;
          if (remaining > 0) {
            setScanSuccess(`✓ Scanned "${item.model_name}" (${newCount}/${requiredQty}) — ${remaining} remaining`);
          } else {
            setScanSuccess(`✓ "${item.model_name}" fully scanned! (${newCount}/${requiredQty})`);
          }
          setBatchCode('');
        }
      } catch (err) {
        setScanError(getErrorMessage(err, 'Item not found. Please check the batch code.'));
        setBatchCode('');
      }
    }
  };

  const handleVerifyAfterScan = () => {
    const itemResults = (claim.items || []).map(item => ({
      item_id: item.item_id,
      status: (scannedCounts[item.item_id] || 0) > 0 ? 'approved' : 'rejected',
      scanned_quantity: scannedCounts[item.item_id] || 0,
      required_quantity: item.quantity || 0
    }));
    onVerify(claim._id || claim.id, '', itemResults);
  };

  const handleResetScans = () => {
    setScannedCounts({});
    setScanError('');
    setScanSuccess('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', overflow: 'auto' }}>
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
                <div>{getStatusBadgeLocal(claim)}</div>
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
          {/* {claim.status === 'Approval Pending' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#cce5ff', 
                border: '1px solid #b8daff', 
                borderRadius: '4px'
              }}>
                <p style={{ marginBottom: '10px', color: '#004085' }}>
                  <strong>⚠️ This claim is pending your verification</strong>
                </p>
                <p style={{ marginBottom: '0', fontSize: '0.9em', color: '#004085' }}>
                  The bilty number has been added by the representative. Please scan items below and verify.
                </p>
              </div>
            </div>
          )} */}

          {/* Verification Status (for approved claims)
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
          )} */}

          {/* Scanning Verification Section - starts directly for pending claims */}
          {isPending && scanMode && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>🔍 Scan Items to Verify</h3>
              
              {/* Overall progress bar */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>Overall Progress</span>
                  <span style={{ fontWeight: '600', fontSize: '14px', color: allItemsScanned ? '#28a745' : '#856404' }}>
                    {totalScanned} / {totalRequired} items scanned
                  </span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '12px', 
                  backgroundColor: '#e9ecef', 
                  borderRadius: '6px', 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    width: totalRequired > 0 ? `${(totalScanned / totalRequired) * 100}%` : '0%',
                    height: '100%', 
                    backgroundColor: allItemsScanned ? '#28a745' : '#007bff',
                    borderRadius: '6px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Scanner input */}
              <div style={{ marginBottom: '15px', padding: '12px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                <label className="form-label" style={{ fontSize: '14px', marginBottom: '5px', display: 'block' }}>
                  Scan Barcode (Batch Code)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  onKeyPress={handleScan}
                  placeholder="Scan barcode or enter batch code, then press Enter"
                  autoFocus
                  style={{ marginBottom: '5px' }}
                />
                {scanError && (
                  <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '8px', padding: '8px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
                    ✗ {scanError}
                  </div>
                )}
                {scanSuccess && (
                  <div style={{ color: '#155724', fontSize: '12px', marginTop: '8px', padding: '8px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                    {scanSuccess}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
                  Tip: Scan each item barcode one by one. The count updates automatically.
                </div>
              </div>

              {/* Per-item scan progress table */}
              <table className="table" style={{ marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Required</th>
                    <th>Scanned</th>
                    <th>Remaining</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(claim.items || []).map((item, index) => {
                    const scanned = scannedCounts[item.item_id] || 0;
                    const required = item.quantity || 0;
                    const remaining = Math.max(0, required - scanned);
                    const isComplete = scanned >= required;
                    return (
                      <tr key={index} style={{ backgroundColor: isComplete ? '#d4edda' : 'transparent' }}>
                        <td>{getItemName(item.item_id)}</td>
                        <td style={{ fontWeight: '600' }}>{required}</td>
                        <td style={{ fontWeight: '600', color: isComplete ? '#28a745' : '#0066cc' }}>{scanned}</td>
                        <td style={{ fontWeight: '600', color: remaining > 0 ? '#dc3545' : '#28a745' }}>{remaining}</td>
                        <td>
                          {isComplete ? (
                            <span className="badge badge-success">✓ Complete</span>
                          ) : (
                            <span className="badge badge-warning">Pending ({remaining} left)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>


              {/* Verify button - always available */}
              <div style={{ marginTop: '15px' }}>
                {allItemsScanned ? (
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#d4edda', 
                    border: '1px solid #c3e6cb', 
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <p style={{ marginBottom: '0', color: '#155724', fontWeight: '600' }}>
                      ✓ All items have been scanned!
                    </p>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#fff3cd', 
                    border: '1px solid #ffc107', 
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <p style={{ marginBottom: '5px', color: '#856404', fontWeight: '600' }}>
                      {totalScanned} of {totalRequired} items scanned
                    </p>
                    <p style={{ marginBottom: '0', color: '#856404', fontSize: '0.85em' }}>
                      Scanned items will be approved, unscanned items will be rejected.
                    </p>
                  </div>
                )}
                <button
                  ref={verifyButtonRef}
                  className="btn btn-success"
                  onClick={handleVerifyAfterScan}
                  style={{ width: '100%', padding: '10px', fontSize: '16px', marginTop: '10px' }}
                >
                  ✓ Verified
                </button>
              </div>
            </div>
          )}

          {/* Items Details (always shown as reference) */}
          {!scanMode && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Claimed Items ({claim.items?.length || 0})</h3>
              {claim.items && claim.items.length > 0 ? (
                <table className="table" style={{ marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Claimed</th>
                      <th>Approved</th>
                      <th>Rejected</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claim.items?.map((item, index) => {
                      const claimed = item.quantity || 0;
                      const verified = item.scanned_quantity != null ? item.scanned_quantity : (item.verification_status === 'approved' ? claimed : 0);
                      const notVerified = Math.max(0, claimed - verified);
                      const status = item.verification_status;
                      return (
                        <tr key={index}>
                          <td>{getItemName(item.item_id)}</td>
                          <td style={{ fontWeight: '600' }}>{claimed}</td>
                          <td style={{ fontWeight: '600', color: '#28a745' }}>{verified}</td>
                          <td style={{ fontWeight: '600', color: notVerified > 0 ? '#dc3545' : '#28a745' }}>{notVerified}</td>
                          <td>
                            {status === 'approved' ? (
                              <span className="badge badge-success">Approved</span>
                            ) : status === 'rejected' ? (
                              <span className="badge badge-danger">Rejected</span>
                            ) : (
                              <span className="badge badge-secondary">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No items in this claim
                </div>
              )}
            </div>
          )}

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
          <div className="modal-footer-bordered">
            {scanMode && (
              <button type="button" className="btn btn-secondary" onClick={() => { setScanMode(false); handleResetScans(); }}>
                Cancel Scanning
              </button>
            )}
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
