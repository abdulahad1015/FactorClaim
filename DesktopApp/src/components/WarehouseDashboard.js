import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { merchantsAPI, claimsAPI, usersAPI, batchesAPI, productModelsAPI, productTypesAPI, locationsAPI, suppliersAPI, getErrorMessage } from '../services/api';

const WarehouseDashboard = () => {
  const [activeTab, setActiveTab] = useState('merchants');
  const [merchants, setMerchants] = useState([]);
  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [productModels, setProductModels] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [currentClaim, setCurrentClaim] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'merchants') {
        const data = await merchantsAPI.getAll();
        setMerchants(data);
      } else if (activeTab === 'claims') {
        const [claimsData, usersData, merchantsData, batchesData, modelsData, typesData, suppliersData] = await Promise.all([
          claimsAPI.getAll(),
          usersAPI.getAll(),
          merchantsAPI.getAll(),
          batchesAPI.getAll(),
          productModelsAPI.getAll(),
          productTypesAPI.getAll(),
          suppliersAPI.getAll()
        ]);
        setClaims(claimsData);
        setUsers(usersData);
        setMerchants(merchantsData);
        setBatches(batchesData);
        setProductModels(modelsData);
        setProductTypes(typesData);
        setSuppliers(suppliersData);
      } else if (activeTab === 'statistics') {
        const [claimsData, usersData, merchantsData, batchesData, modelsData, typesData, suppliersData] = await Promise.all([
          claimsAPI.getAll(),
          usersAPI.getAll(),
          merchantsAPI.getAll(),
          batchesAPI.getAll(),
          productModelsAPI.getAll(),
          productTypesAPI.getAll(),
          suppliersAPI.getAll()
        ]);
        setClaims(claimsData);
        setUsers(usersData);
        setMerchants(merchantsData);
        setBatches(batchesData);
        setProductModels(modelsData);
        setProductTypes(typesData);
        setSuppliers(suppliersData);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    return foundUser ? foundUser.name : `User ${String(userId).slice(-6)}`;
  };

  const getMerchantName = (merchantId) => {
    if (!merchantId) return 'Unknown';
    const merchant = merchants.find(m => m._id === merchantId || m.id === merchantId);
    return merchant ? (merchant.name || merchant.address) : `Merchant ${String(merchantId).slice(-6)}`;
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
    <div>
      <nav className="navbar">
        <div className="navbar-brand">FactorClaim - Sales Manager</div>
        <div className="navbar-user">
          <span className="navbar-username">{user?.name}</span>
          <button onClick={handleLogout} className="navbar-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Sales Manager Dashboard</h1>
          <p className="dashboard-subtitle">Manage merchants, view claims, and track statistics</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="alert-dismiss">×</button>
          </div>
        )}

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'merchants' ? 'active' : ''}`}
            onClick={() => setActiveTab('merchants')}
          >
            Merchants
          </button>
          <button
            className={`tab-button ${activeTab === 'claims' ? 'active' : ''}`}
            onClick={() => setActiveTab('claims')}
          >
            Claims
          </button>
          <button
            className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            Statistics
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
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
                batches={batches}
                productModels={productModels}
                productTypes={productTypes}
                suppliers={suppliers}
                getUserName={getUserName}
                getMerchantName={getMerchantName}
              />
            )}
          </>
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
          batches={batches}
          productModels={productModels}
          productTypes={productTypes}
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
        <button className="btn btn-primary action-bar-btn" onClick={onAdd}>
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
                <td className="table-actions">
                  <button className="btn btn-secondary" onClick={() => onEdit(merchant)}>
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
                  {(() => {
                    const s = claim.status || (claim.verified ? 'Approved' : 'Bilty Pending');
                    const c = { 'Bilty Pending': 'badge-warning', 'Approval Pending': 'badge-info', 'Approved': 'badge-success', 'Rejected': 'badge-danger' };
                    return <span className={`badge ${c[s] || 'badge-secondary'}`}>{s}</span>;
                  })()}
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

const StatisticsTab = ({ claims, users, merchants, batches, productModels, productTypes, suppliers, getUserName, getMerchantName }) => {
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

  // Claims by Model (group by model name + wattage)
  const getModelName = (modelId) => {
    const model = (productModels || []).find(m => m._id === modelId || m.id === modelId);
    return model ? `${model.name} ${model.wattage}W` : 'Unknown';
  };

  const claimsByModel = {};
  claims.forEach(claim => {
    (claim.items || []).forEach(item => {
      const batch = (batches || []).find(b => b._id === String(item.batch_id) || b._id === item.batch_id);
      if (batch) {
        const modelName = getModelName(batch.model_id);
        if (!claimsByModel[modelName]) claimsByModel[modelName] = { claims: 0, qty: 0 };
        claimsByModel[modelName].claims += 1;
        claimsByModel[modelName].qty += (item.scanned_quantity || item.quantity || 0);
      }
    });
  });

  // Failure Rate % (verified qty / total batch qty × 100)
  const failureByModel = {};
  (batches || []).forEach(batch => {
    const modelName = getModelName(batch.model_id);
    if (!failureByModel[modelName]) failureByModel[modelName] = { totalQty: 0, returnedQty: 0 };
    failureByModel[modelName].totalQty += (batch.quantity || 0);
  });
  claims.filter(c => c.verified).forEach(claim => {
    (claim.items || []).forEach(item => {
      const batch = (batches || []).find(b => b._id === String(item.batch_id) || b._id === item.batch_id);
      if (batch) {
        const modelName = getModelName(batch.model_id);
        if (failureByModel[modelName]) {
          failureByModel[modelName].returnedQty += (item.scanned_quantity || item.quantity || 0);
        }
      }
    });
  });

  // Supervisor Audit (returns by supervisor)
  const supervisorAudit = {};
  claims.filter(c => c.verified).forEach(claim => {
    (claim.items || []).forEach(item => {
      const batch = (batches || []).find(b => b._id === String(item.batch_id) || b._id === item.batch_id);
      if (batch && batch.supervisor_id) {
        const supName = getUserName(batch.supervisor_id);
        if (!supervisorAudit[supName]) supervisorAudit[supName] = { returns: 0, qty: 0 };
        supervisorAudit[supName].returns += 1;
        supervisorAudit[supName].qty += (item.scanned_quantity || item.quantity || 0);
      }
    });
  });

  // Supplier Audit (failures by supplier)
  const supplierAudit = {};
  claims.filter(c => c.verified).forEach(claim => {
    (claim.items || []).forEach(item => {
      const batch = (batches || []).find(b => b._id === String(item.batch_id) || b._id === item.batch_id);
      if (batch && batch.supplier_id) {
        const supplierObj = (suppliers || []).find(s => s._id === batch.supplier_id || s.id === batch.supplier_id);
        const supplierName = supplierObj ? supplierObj.name : 'Unknown';
        if (!supplierAudit[supplierName]) supplierAudit[supplierName] = { returns: 0, qty: 0 };
        supplierAudit[supplierName].returns += 1;
        supplierAudit[supplierName].qty += (item.scanned_quantity || item.quantity || 0);
      }
    });
  });

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Claims</div>
          <div className="stat-value">{totalClaims}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verified Claims</div>
          <div className="stat-value" style={{ color: '#28a745' }}>{verifiedClaims}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Claims</div>
          <div className="stat-value" style={{ color: '#ffc107' }}>{pendingClaims}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Merchants</div>
          <div className="stat-value">{totalMerchants}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Merchants</div>
          <div className="stat-value" style={{ color: '#28a745' }}>{activeMerchants}</div>
        </div>
      </div>

      <div className="two-column-grid" style={{ marginTop: '2rem' }}>
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

      <div className="two-column-grid" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3>Claims by Model</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Claims</th>
                <th>Total Qty</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(claimsByModel).sort((a, b) => b[1].qty - a[1].qty).map(([model, data]) => (
                <tr key={model}>
                  <td>{model}</td>
                  <td>{data.claims}</td>
                  <td>{data.qty}</td>
                </tr>
              ))}
              {Object.keys(claimsByModel).length === 0 && (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Failure Rate %</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Produced</th>
                <th>Returned</th>
                <th>Rate %</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(failureByModel).filter(([, d]) => d.returnedQty > 0).sort((a, b) => (b[1].returnedQty / b[1].totalQty) - (a[1].returnedQty / a[1].totalQty)).map(([model, data]) => (
                <tr key={model}>
                  <td>{model}</td>
                  <td>{data.totalQty}</td>
                  <td>{data.returnedQty}</td>
                  <td style={{ color: (data.returnedQty / data.totalQty * 100) > 5 ? '#dc3545' : '#28a745' }}>
                    {(data.returnedQty / data.totalQty * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
              {Object.values(failureByModel).every(d => d.returnedQty === 0) && (
                <tr><td colSpan="4" style={{ textAlign: 'center' }}>No failures recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="two-column-grid" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3>Supervisor Audit</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Supervisor</th>
                <th>Returns</th>
                <th>Qty Returned</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(supervisorAudit).sort((a, b) => b[1].qty - a[1].qty).map(([sup, data]) => (
                <tr key={sup}>
                  <td>{sup}</td>
                  <td>{data.returns}</td>
                  <td>{data.qty}</td>
                </tr>
              ))}
              {Object.keys(supervisorAudit).length === 0 && (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>No supervisor data available</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Supplier Audit</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Returns</th>
                <th>Qty Returned</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(supplierAudit).sort((a, b) => b[1].qty - a[1].qty).map(([sup, data]) => (
                <tr key={sup}>
                  <td>{sup}</td>
                  <td>{data.returns}</td>
                  <td>{data.qty}</td>
                </tr>
              ))}
              {Object.keys(supplierAudit).length === 0 && (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>No supplier data available</td></tr>
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
    province: merchant?.province || '',
    city: merchant?.city || '',
    contact: merchant?.contact || '',
    email: merchant?.email || '',
    is_active: merchant?.is_active !== undefined ? merchant.is_active : true,
  });

  const [locations, setLocations] = useState([]);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showNewCityInput, setShowNewCityInput] = useState(false);
  const [newCityName, setNewCityName] = useState('');

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await locationsAPI.getAll();
        setLocations(data);
      } catch (err) {
        console.error('Failed to load locations:', err);
      }
    };
    loadLocations();
  }, []);

  const provinces = [...new Set(locations.map(l => l.province))].sort();
  const filteredCities = locations.filter(l =>
    l.province === formData.province &&
    (!citySearch || l.name.toLowerCase().includes(citySearch.toLowerCase()))
  );

  const handleProvinceChange = (province) => {
    setFormData({ ...formData, province, city: '' });
    setCitySearch('');
  };

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
            <label className="form-label">Province *</label>
            <select
              className="form-control"
              value={formData.province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              required
            >
              <option value="">Select Province</option>
              {provinces.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">City *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                value={formData.city || citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setFormData({ ...formData, city: '' });
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                placeholder="Type to search cities..."
                required
                disabled={!formData.province}
              />
              {showCityDropdown && citySearch && (
                <div style={{ position: 'absolute', zIndex: 100, background: '#fff', border: '1px solid #ddd', maxHeight: '200px', overflowY: 'auto', width: '100%', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  {filteredCities.map((loc) => (
                    <div key={loc._id || loc.name} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      onClick={() => {
                        setFormData({ ...formData, city: loc.name });
                        setCitySearch('');
                        setShowCityDropdown(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {loc.name}
                    </div>
                  ))}
                  <div style={{ padding: '8px 12px', cursor: 'pointer', color: '#0066cc', fontWeight: 'bold', borderTop: '2px solid #ddd' }}
                    onClick={() => { setShowNewCityInput(true); setShowCityDropdown(false); setNewCityName(citySearch); }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    + Add New City: "{citySearch}"
                  </div>
                </div>
              )}
              {formData.city && (
                <button type="button" style={{ position: 'absolute', right: '8px', top: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: '#999' }}
                  onClick={() => { setFormData({ ...formData, city: '' }); setCitySearch(''); }}>×</button>
              )}
            </div>
            {showNewCityInput && formData.province && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', padding: '10px', background: '#f0f8ff', borderRadius: '4px' }}>
                <input type="text" className="form-control" value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)} placeholder="New city name" style={{ flex: 1 }} />
                <button type="button" className="btn btn-primary" onClick={async () => {
                  if (!newCityName.trim()) return;
                  try {
                    await locationsAPI.create({ name: newCityName.trim(), province: formData.province });
                    const data = await locationsAPI.getAll();
                    setLocations(data);
                    setFormData({ ...formData, city: newCityName.trim() });
                    setShowNewCityInput(false);
                    setNewCityName('');
                    setCitySearch('');
                  } catch (err) { alert(getErrorMessage(err, 'Failed to create city')); }
                }}>Add</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowNewCityInput(false); setNewCityName(''); }}>Cancel</button>
              </div>
            )}
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
          <div className="modal-footer">
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

const ViewClaimModal = ({ claim, batches, productModels, productTypes, merchants, users, getUserName, getMerchantName, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  const getBatchName = (batchId) => {
    const batch = batches.find(b => b._id === batchId || b.id === batchId);
    if (!batch) return 'Unknown Batch';
    const model = productModels.find(m => m._id === batch.model_id);
    const typeName = model ? (productTypes.find(t => t._id === model.product_type_id)?.name || '') : '';
    return `${batch.batch_code} - ${model ? model.name : 'Unknown'} (${model ? model.wattage : '?'}W${typeName ? ` - ${typeName}` : ''})`;
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Claim Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div style={{ padding: '20px' }}>
          {/* Basic Information */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>General Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
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

          {/* Verification Details */}
          {claim.verified && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Verification Details</h3>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#d4edda', 
                border: '1px solid #c3e6cb', 
                borderRadius: '4px',
                color: '#155724'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  {claim.verified_by && (
                    <div>
                      <strong>Verified By:</strong>
                      <div>{getUserName(claim.verified_by)}</div>
                    </div>
                  )}
                  {claim.verified_at && (
                    <div>
                      <strong>Verified At:</strong>
                      <div>{formatDate(claim.verified_at)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Items Details */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>Items ({claim.items?.length || 0})</h3>
            {claim.items && claim.items.length > 0 ? (
              <table className="table" style={{ marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {claim.items.map((item, index) => (
                    <tr key={index}>
                      <td>{getBatchName(item.batch_id)}</td>
                      <td>{item.quantity}</td>
                      <td>{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-text">No items found</div>
              </div>
            )}
          </div>

          {/* Notes */}
          {claim.notes && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Notes</h3>
              <p style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>{claim.notes}</p>
            </div>
          )}
        </div>

        <div className="modal-footer-bordered">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDashboard;
