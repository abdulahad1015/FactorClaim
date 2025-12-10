import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { merchantsAPI, claimsAPI, usersAPI, itemsAPI, getErrorMessage } from '../services/api';

const WarehouseDashboard = () => {
  const [activeTab, setActiveTab] = useState('merchants');
  const [merchants, setMerchants] = useState([]);
  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [currentClaim, setCurrentClaim] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'merchants') {
        const data = await merchantsAPI.getAll();
        setMerchants(data);
      } else if (activeTab === 'claims') {
        const [claimsData, usersData, merchantsData, itemsData] = await Promise.all([
          claimsAPI.getAll(),
          usersAPI.getAll(),
          merchantsAPI.getAll(),
          itemsAPI.getAll()
        ]);
        setClaims(claimsData);
        setUsers(usersData);
        setMerchants(merchantsData);
        setItems(itemsData);
      } else if (activeTab === 'statistics') {
        const [claimsData, usersData, merchantsData] = await Promise.all([
          claimsAPI.getAll(),
          usersAPI.getAll(),
          merchantsAPI.getAll()
        ]);
        setClaims(claimsData);
        setUsers(usersData);
        setMerchants(merchantsData);
      }
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

  const getUserName = (userId) => {
    if (!userId) return 'Unknown';
    const foundUser = users.find(u => u.id === userId || u._id === userId);
    return foundUser ? foundUser.name : `User ${userId.slice(-6)}`;
  };

  const getMerchantName = (merchantId) => {
    if (!merchantId) return 'Unknown';
    const merchant = merchants.find(m => m._id === merchantId || m.id === merchantId);
    return merchant ? (merchant.name || merchant.address) : `Merchant ${merchantId.slice(-6)}`;
  };

  // Merchant handlers
  const handleAddMerchant = () => {
    setCurrentItem(null);
    setModalType('merchant');
    setShowModal(true);
  };

  const handleEditMerchant = (merchant) => {
    setCurrentItem(merchant);
    setModalType('merchant');
    setShowModal(true);
  };

  const handleDeleteMerchant = async (id) => {
    if (window.confirm('Are you sure you want to delete this merchant?')) {
      try {
        await merchantsAPI.delete(id);
        loadData();
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to delete merchant'));
      }
    }
  };

  const handleSaveMerchant = async (merchantData) => {
    try {
      if (currentItem) {
        await merchantsAPI.update(currentItem._id, merchantData);
      } else {
        await merchantsAPI.create(merchantData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save merchant'));
    }
  };

  // Claim handlers
  const handleViewClaim = (claim) => {
    setCurrentClaim(claim);
    setModalType('viewClaim');
    setShowModal(true);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Warehouse Manager Dashboard</h1>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <nav className="dashboard-nav">
          <button
            className={`nav-button ${activeTab === 'merchants' ? 'active' : ''}`}
            onClick={() => setActiveTab('merchants')}
          >
            🏪 Merchants
          </button>
          <button
            className={`nav-button ${activeTab === 'claims' ? 'active' : ''}`}
            onClick={() => setActiveTab('claims')}
          >
            📋 Claims
          </button>
          <button
            className={`nav-button ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            📊 Statistics
          </button>
        </nav>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="alert-close">×</button>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="tab-content">
            {activeTab === 'merchants' && (
              <MerchantsTab
                merchants={merchants}
                onAdd={handleAddMerchant}
                onEdit={handleEditMerchant}
                onDelete={handleDeleteMerchant}
              />
            )}
            {activeTab === 'claims' && (
              <ClaimsTab
                claims={claims}
                users={users}
                merchants={merchants}
                onView={handleViewClaim}
                formatDate={formatDate}
                getUserName={getUserName}
                getMerchantName={getMerchantName}
              />
            )}
            {activeTab === 'statistics' && (
              <StatisticsTab
                claims={claims}
                users={users}
                merchants={merchants}
                getUserName={getUserName}
                getMerchantName={getMerchantName}
              />
            )}
          </div>
        )}
      </div>

      {showModal && modalType === 'merchant' && (
        <MerchantModal
          merchant={currentItem}
          onSave={handleSaveMerchant}
          onClose={() => setShowModal(false)}
        />
      )}
      {showModal && modalType === 'viewClaim' && (
        <ViewClaimModal
          claim={currentClaim}
          items={items}
          merchants={merchants}
          users={users}
          getUserName={getUserName}
          getMerchantName={getMerchantName}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

const MerchantsTab = ({ merchants, onAdd, onEdit, onDelete }) => {
  return (
    <div className="card">
      <div className="action-bar">
        <h2>Merchants Management</h2>
        <button className="btn btn-primary" onClick={onAdd}>
          + Add Merchant
        </button>
      </div>
      {merchants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏪</div>
          <div className="empty-state-text">No merchants found</div>
          <button className="btn btn-primary" onClick={onAdd}>Add Your First Merchant</button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((merchant) => (
              <tr key={merchant._id}>
                <td>{merchant.name}</td>
                <td>{merchant.address}</td>
                <td>{merchant.contact}</td>
                <td>{merchant.email || '-'}</td>
                <td>
                  <span className={`status-badge ${merchant.is_active ? 'status-active' : 'status-inactive'}`}>
                    {merchant.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary" style={{ marginRight: '8px' }} onClick={() => onEdit(merchant)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => onDelete(merchant._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const ClaimsTab = ({ claims, users, merchants, onView, formatDate, getUserName, getMerchantName }) => {
  return (
    <div className="card">
      <div className="action-bar">
        <h2>All Claims</h2>
      </div>
      {claims.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No claims found</div>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Representative</th>
              <th>Merchant</th>
              <th>Items</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim._id}>
                <td>{formatDate(claim.date)}</td>
                <td>{getUserName(claim.rep_id)}</td>
                <td>{getMerchantName(claim.merchant_id)}</td>
                <td>{claim.items?.length || 0} items</td>
                <td>
                  <span className={`status-badge ${claim.verified ? 'status-verified' : 'status-pending'}`}>
                    {claim.verified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary" onClick={() => onView(claim)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const StatisticsTab = ({ claims, users, merchants, getUserName, getMerchantName }) => {
  const totalClaims = claims.length;
  const verifiedClaims = claims.filter(c => c.verified).length;
  const pendingClaims = totalClaims - verifiedClaims;
  const totalMerchants = merchants.length;
  const activeMerchants = merchants.filter(m => m.is_active).length;

  // Claims by representative
  const claimsByRep = {};
  claims.forEach(claim => {
    const repName = getUserName(claim.rep_id);
    claimsByRep[repName] = (claimsByRep[repName] || 0) + 1;
  });

  // Claims by merchant
  const claimsByMerchant = {};
  claims.forEach(claim => {
    const merchantName = getMerchantName(claim.merchant_id);
    claimsByMerchant[merchantName] = (claimsByMerchant[merchantName] || 0) + 1;
  });

  return (
    <div className="statistics-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-label">Total Claims</div>
            <div className="stat-value">{totalClaims}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Verified Claims</div>
            <div className="stat-value">{verifiedClaims}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Pending Claims</div>
            <div className="stat-value">{pendingClaims}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏪</div>
          <div className="stat-content">
            <div className="stat-label">Total Merchants</div>
            <div className="stat-value">{totalMerchants}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-content">
            <div className="stat-label">Active Merchants</div>
            <div className="stat-value">{activeMerchants}</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h3>Claims by Representative</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Representative</th>
                <th>Claims Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(claimsByRep).map(([rep, count]) => (
                <tr key={rep}>
                  <td>{rep}</td>
                  <td>{count}</td>
                </tr>
              ))}
              {Object.keys(claimsByRep).length === 0 && (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center' }}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Claims by Merchant</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Merchant</th>
                <th>Claims Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(claimsByMerchant).map(([merchant, count]) => (
                <tr key={merchant}>
                  <td>{merchant}</td>
                  <td>{count}</td>
                </tr>
              ))}
              {Object.keys(claimsByMerchant).length === 0 && (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center' }}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MerchantModal = ({ merchant, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: merchant?.name || '',
    address: merchant?.address || '',
    contact: merchant?.contact || '',
    email: merchant?.email || '',
    is_active: merchant?.is_active !== undefined ? merchant.is_active : true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{merchant ? 'Edit Merchant' : 'Add Merchant'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address *</label>
            <input
              type="text"
              className="form-control"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              maxLength={200}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact *</label>
            <input
              type="text"
              className="form-control"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              required
              maxLength={15}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              Active
            </label>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewClaimModal = ({ claim, items, merchants, users, getUserName, getMerchantName, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i._id === itemId || i.id === itemId);
    return item ? `${item.model_name} (${item.wattage}W - ${item.batch})` : 'Unknown Item';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Claim Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="claim-details">
          <div className="detail-section">
            <h3>General Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{formatDate(claim.date)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Representative:</span>
                <span className="detail-value">{getUserName(claim.rep_id)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Merchant:</span>
                <span className="detail-value">{getMerchantName(claim.merchant_id)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${claim.verified ? 'status-verified' : 'status-pending'}`}>
                  {claim.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              {claim.verified && claim.verified_by && (
                <div className="detail-item">
                  <span className="detail-label">Verified By:</span>
                  <span className="detail-value">{getUserName(claim.verified_by)}</span>
                </div>
              )}
              {claim.verified && claim.verified_at && (
                <div className="detail-item">
                  <span className="detail-label">Verified At:</span>
                  <span className="detail-value">{formatDate(claim.verified_at)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>Items</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
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
            <div className="detail-section">
              <h3>Notes</h3>
              <p>{claim.notes}</p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDashboard;
