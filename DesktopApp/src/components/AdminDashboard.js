import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, productTypesAPI, productModelsAPI, batchesAPI, claimsAPI, merchantsAPI, getErrorMessage } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('productTypes');
  const [productTypes, setProductTypes] = useState([]);
  const [productModels, setProductModels] = useState([]);
  const [batches, setBatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [claims, setClaims] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentClaim, setCurrentClaim] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Helper functions to get names by ID
  const getUserName = (userId) => {
    if (!userId) return 'Unknown';
    const foundUser = users.find(u => u.id === userId || u._id === userId);
    return foundUser ? foundUser.name : `User ${userId.slice(-6)}`;
  };

  const getMerchantName = (merchantId) => {
    if (!merchantId) return 'Unknown';
    const foundMerchant = merchants.find(m => m._id === merchantId || m.id === merchantId);
    return foundMerchant ? foundMerchant.name || foundMerchant.address : `Merchant ${merchantId.slice(-6)}`;
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'productTypes') {
        const data = await productTypesAPI.getAll();
        setProductTypes(data);
      } else if (activeTab === 'models') {
        const [modelsData, ptData] = await Promise.all([
          productModelsAPI.getAll(),
          productTypesAPI.getAll()
        ]);
        setProductModels(modelsData);
        setProductTypes(ptData);
      } else if (activeTab === 'batches') {
        const [batchesData, modelsData, ptData] = await Promise.all([
          batchesAPI.getAll(),
          productModelsAPI.getAll(),
          productTypesAPI.getAll()
        ]);
        setBatches(batchesData);
        setProductModels(modelsData);
        setProductTypes(ptData);
      } else if (activeTab === 'users') {
        const data = await usersAPI.getAll();
        setUsers(data);
      } else if (activeTab === 'claims') {
        const [claimsData, usersData, merchantsData, batchesData, modelsData, ptData] = await Promise.all([
          claimsAPI.getAll(),
          usersAPI.getAll(),
          merchantsAPI.getAll(),
          batchesAPI.getAll(),
          productModelsAPI.getAll(),
          productTypesAPI.getAll()
        ]);
        setClaims(claimsData);
        setUsers(usersData);
        setMerchants(merchantsData);
        setBatches(batchesData);
        setProductModels(modelsData);
        setProductTypes(ptData);
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
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddItem = () => {
    setCurrentItem(null);
    setModalType(activeTab === 'productTypes' ? 'productType' : activeTab === 'models' ? 'model' : 'batch');
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    setCurrentItem(item);
    setModalType(activeTab === 'productTypes' ? 'productType' : activeTab === 'models' ? 'model' : 'batch');
    setShowModal(true);
  };

  const handleDeleteItem = async (id) => {
    const label = activeTab === 'productTypes' ? 'product type' : activeTab === 'models' ? 'model' : 'batch';
    if (window.confirm(`Are you sure you want to delete this ${label}?`)) {
      try {
        if (activeTab === 'productTypes') await productTypesAPI.delete(id);
        else if (activeTab === 'models') await productModelsAPI.delete(id);
        else await batchesAPI.delete(id);
        loadData();
      } catch (err) {
        setError(getErrorMessage(err, `Failed to delete ${label}`));
      }
    }
  };

  const handleSaveItem = async (data) => {
    try {
      if (activeTab === 'productTypes') {
        if (currentItem) await productTypesAPI.update(currentItem._id, data);
        else await productTypesAPI.create(data);
      } else if (activeTab === 'models') {
        if (currentItem) await productModelsAPI.update(currentItem._id, data);
        else await productModelsAPI.create(data);
      } else {
        if (currentItem) await batchesAPI.update(currentItem._id, data);
        else await batchesAPI.create(data);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save'));
    }
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setModalType('user');
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setModalType('user');
    setShowModal(true);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.delete(id);
        loadData();
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to delete user'));
      }
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      if (currentUser) {
        // Remove empty password so we don't send blank updates
        const dataToSend = { ...userData };
        if (!dataToSend.password) {
          delete dataToSend.password;
        }
        await usersAPI.update(currentUser._id || currentUser.id, dataToSend);
      } else {
        await usersAPI.create(userData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save user'));
    }
  };

  const handleViewClaim = (claim) => {
    setCurrentClaim(claim);
    setModalType('claim');
    setShowModal(true);
  };

  const getStatistics = () => {
    const total = claims.length;
    const verified = claims.filter(c => c.verified).length;
    const pending = total - verified;
    const verificationRate = total > 0 ? ((verified / total) * 100).toFixed(1) : 0;

    return { total, verified, pending, verificationRate };
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand">FactorClaim - Admin</div>
        <div className="navbar-user">
          <span className="navbar-username">{user?.name}</span>
          <button onClick={handleLogout} className="navbar-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">Manage product types, models, batches, users, and view statistics</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="alert-dismiss">×</button>
          </div>
        )}

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'productTypes' ? 'active' : ''}`}
            onClick={() => setActiveTab('productTypes')}
          >
            Product Types
          </button>
          <button
            className={`tab-button ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
          >
            Models
          </button>
          <button
            className={`tab-button ${activeTab === 'batches' ? 'active' : ''}`}
            onClick={() => setActiveTab('batches')}
          >
            Batches
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
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
            {activeTab === 'productTypes' && (
              <ProductTypesTab
                productTypes={productTypes}
                onAdd={handleAddItem}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            )}
            {activeTab === 'models' && (
              <ModelsTab
                models={productModels}
                productTypes={productTypes}
                onAdd={handleAddItem}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            )}
            {activeTab === 'batches' && (
              <BatchesTab
                batches={batches}
                models={productModels}
                productTypes={productTypes}
                onAdd={handleAddItem}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                formatDate={formatDate}
              />
            )}
            {activeTab === 'users' && (
              <UsersTab
                users={users}
                onAdd={handleAddUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
              />
            )}
            {activeTab === 'claims' && (
              <ClaimsTab
                claims={claims}
                onView={handleViewClaim}
                formatDate={formatDate}
                getUserName={getUserName}
                getMerchantName={getMerchantName}
              />
            )}
            {activeTab === 'statistics' && (
              <StatisticsTab 
                statistics={getStatistics()} 
                claims={claims}
                formatDate={formatDate}
                getUserName={getUserName}
              />
            )}
          </>
        )}
      </div>

      {showModal && modalType === 'productType' && (
        <ProductTypeModal
          item={currentItem}
          onSave={handleSaveItem}
          onClose={() => setShowModal(false)}
        />
      )}
      {showModal && modalType === 'model' && (
        <ModelModal
          item={currentItem}
          productTypes={productTypes}
          onSave={handleSaveItem}
          onClose={() => setShowModal(false)}
        />
      )}
      {showModal && modalType === 'batch' && (
        <BatchModal
          item={currentItem}
          models={productModels}
          productTypes={productTypes}
          onSave={handleSaveItem}
          onClose={() => setShowModal(false)}
        />
      )}
      {showModal && modalType === 'user' && (
        <UserModal
          user={currentUser}
          onSave={handleSaveUser}
          onClose={() => setShowModal(false)}
        />
      )}
      {showModal && modalType === 'claim' && (
        <ClaimModal
          claim={currentClaim}
          batches={batches}
          models={productModels}
          productTypes={productTypes}
          users={users}
          merchants={merchants}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

const ProductTypesTab = ({ productTypes, onAdd, onEdit, onDelete }) => {
  return (
    <div className="card">
      <div className="action-bar">
        <h2>Product Types</h2>
        <button className="btn btn-primary action-bar-btn" onClick={onAdd}>
          + Add Product Type
        </button>
      </div>
      {productTypes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-text">No product types found</div>
          <button className="btn btn-primary" onClick={onAdd}>Add Your First Product Type</button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productTypes.map((pt) => (
              <tr key={pt._id}>
                <td>{pt.name}</td>
                <td>
                  <span className={`badge ${pt.is_active !== false ? 'badge-success' : 'badge-warning'}`}>
                    {pt.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="table-actions">
                  <button className="btn btn-secondary" onClick={() => onEdit(pt)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => onDelete(pt._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const ModelsTab = ({ models, productTypes, onAdd, onEdit, onDelete }) => {
  const getProductTypeName = (ptId) => {
    const pt = productTypes.find(p => p._id === ptId || p.id === ptId);
    return pt ? pt.name : 'Unknown';
  };

  return (
    <div className="card">
      <div className="action-bar">
        <h2>Models</h2>
        <button className="btn btn-primary action-bar-btn" onClick={onAdd}>
          + Add Model
        </button>
      </div>
      {models.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-text">No models found</div>
          <button className="btn btn-primary" onClick={onAdd}>Add Your First Model</button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Product Type</th>
              <th>Wattage</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model._id}>
                <td>{model.name}</td>
                <td>{getProductTypeName(model.product_type_id)}</td>
                <td>{model.wattage}W</td>
                <td>{model.supplier}</td>
                <td className="table-actions">
                  <button className="btn btn-secondary" onClick={() => onEdit(model)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => onDelete(model._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const BatchesTab = ({ batches, models, productTypes, onAdd, onEdit, onDelete, formatDate }) => {
  const [filters, setFilters] = useState({ search: '', modelId: '' });

  const getModelName = (modelId) => {
    const model = models.find(m => m._id === modelId || m.id === modelId);
    if (!model) return 'Unknown';
    const pt = productTypes.find(p => p._id === model.product_type_id || p.id === model.product_type_id);
    return `${model.name} (${pt ? pt.name : ''} - ${model.wattage}W)`;
  };

  const filteredBatches = batches.filter(b => {
    const matchesSearch = !filters.search ||
      b.batch_code?.toLowerCase().includes(filters.search.toLowerCase()) ||
      b.colour?.toLowerCase().includes(filters.search.toLowerCase()) ||
      b.supplier?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesModel = !filters.modelId || b.model_id === filters.modelId;
    return matchesSearch && matchesModel;
  });

  return (
    <div className="card">
      <div className="action-bar">
        <h2>Batches</h2>
        <button className="btn btn-primary action-bar-btn" onClick={onAdd}>
          + Add Batch
        </button>
      </div>
      <div className="filter-section">
        <div className="filter-grid">
          <div>
            <label className="form-label">Search</label>
            <input type="text" className="form-control" placeholder="Search batch code, colour, supplier..."
              value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Model</label>
            <select className="form-control" value={filters.modelId} onChange={(e) => setFilters({ ...filters, modelId: e.target.value })}>
              <option value="">All Models</option>
              {models.map(m => <option key={m._id} value={m._id}>{m.name} - {m.wattage}W</option>)}
            </select>
          </div>
        </div>
        <div className="filter-bar">
          <span>Showing {filteredBatches.length} of {batches.length} batches</span>
        </div>
      </div>
      {filteredBatches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-text">No batches found</div>
          <button className="btn btn-primary" onClick={onAdd}>Add Your First Batch</button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Batch Code</th>
              <th>Model</th>
              <th>Colour</th>
              <th>Quantity</th>
              <th>Production Date</th>
              <th>Warranty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.map((batch) => (
              <tr key={batch._id}>
                <td style={{ fontFamily: 'monospace' }}>{batch.batch_code}</td>
                <td>{getModelName(batch.model_id)}</td>
                <td>{batch.colour || '-'}</td>
                <td>{batch.quantity}</td>
                <td>{formatDate(batch.production_date)}</td>
                <td>{batch.warranty_period} months</td>
                <td className="table-actions">
                  <button className="btn btn-secondary" onClick={() => onEdit(batch)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => onDelete(batch._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const UsersTab = ({ users, onAdd, onEdit, onDelete }) => {
  return (
    <div className="card">
      <div className="action-bar">
        <h2>Users Management</h2>
        <button className="btn btn-primary action-bar-btn" onClick={onAdd}>
          + Add User
        </button>
      </div>
      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-text">No users found</div>
          <button className="btn btn-primary" onClick={onAdd}>Add Your First User</button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td><span className="badge">{user.type}</span></td>
                <td>{user.contact_no}</td>
                <td className="table-actions">
                  <button className="btn btn-secondary" onClick={() => onEdit(user)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => onDelete(user._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const StatisticsTab = ({ statistics, claims, formatDate, getUserName }) => {
  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Claims</div>
          <div className="stat-value">{statistics.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verified Claims</div>
          <div className="stat-value" style={{ color: '#28a745' }}>{statistics.verified}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Claims</div>
          <div className="stat-value" style={{ color: '#ffc107' }}>{statistics.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verification Rate</div>
          <div className="stat-value">{statistics.verificationRate}%</div>
        </div>
      </div>

      <div className="card">
        <h2>Recent Claims</h2>
        {claims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">No claims found</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Representative</th>
                <th>Items Count</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.slice(0, 10).map((claim) => (
                <tr key={claim._id}>
                  <td>{formatDate(claim.date)}</td>
                  <td>{getUserName(claim.rep_id)}</td>
                  <td>{claim.items?.length || 0}</td>
                  <td>
                    {(() => {
                      const s = claim.status || (claim.verified ? 'Approved' : 'Bilty Pending');
                      const c = { 'Bilty Pending': 'badge-warning', 'Approval Pending': 'badge-info', 'Approved': 'badge-success', 'Rejected': 'badge-danger' };
                      return <span className={`badge ${c[s] || 'badge-secondary'}`}>{s}</span>;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const ProductTypeModal = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name: formData.name });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{item ? 'Edit Product Type' : 'Add Product Type'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input type="text" className="form-control" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
              placeholder="e.g., LED Bulb, Floodlight, Panel Light" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ModelModal = ({ item, productTypes, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    wattage: item?.wattage || '',
    product_type_id: item?.product_type_id || '',
    notes: item?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      wattage: parseFloat(formData.wattage),
      product_type_id: formData.product_type_id,
      notes: formData.notes || '',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{item ? 'Edit Model' : 'Add Model'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Type *</label>
            <select className="form-control" value={formData.product_type_id}
              onChange={(e) => setFormData({ ...formData, product_type_id: e.target.value })} required>
              <option value="">Select Product Type</option>
              {productTypes.filter(pt => pt.is_active !== false).map(pt => (
                <option key={pt._id} value={pt._id}>{pt.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Model Name *</label>
            <input type="text" className="form-control" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
              placeholder="e.g., LED-100W-2024" />
          </div>
          <div className="form-group">
            <label className="form-label">Wattage *</label>
            <input type="number" className="form-control" value={formData.wattage}
              onChange={(e) => setFormData({ ...formData, wattage: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows="3" value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BatchModal = ({ item, models, productTypes, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    batch_code: item?.batch_code || '',
    model_id: item?.model_id || '',
    colour: item?.colour || '',
    quantity: item?.quantity || '',
    production_date: item?.production_date ? item.production_date.split('T')[0] : '',
    warranty_period: item?.warranty_period || 12,
    supplier: item?.supplier || '',
    contractor: item?.contractor || '',
    notes: item?.notes || '',
  });

  const getModelLabel = (model) => {
    const pt = productTypes.find(p => p._id === model.product_type_id || p.id === model.product_type_id);
    return `${model.name} - ${model.wattage}W (${pt ? pt.name : 'Unknown'})`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = {
      batch_code: formData.batch_code,
      model_id: formData.model_id,
      colour: formData.colour || '',
      quantity: parseInt(formData.quantity),
      warranty_period: parseInt(formData.warranty_period),
      notes: formData.notes || '',
    };
    if (formData.production_date) {
      dataToSend.production_date = new Date(formData.production_date).toISOString();
    }
    if (formData.supplier && formData.supplier.trim().length > 0) {
      dataToSend.supplier = formData.supplier;
    }
    if (formData.contractor && formData.contractor.trim().length > 0) {
      dataToSend.contractor = formData.contractor;
    }
    onSave(dataToSend);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{item ? 'Edit Batch' : 'Add Batch'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Model *</label>
            <select className="form-control" value={formData.model_id}
              onChange={(e) => setFormData({ ...formData, model_id: e.target.value })} required>
              <option value="">Select Model</option>
              {models.filter(m => m.is_active !== false).map(m => (
                <option key={m._id} value={m._id}>{getModelLabel(m)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Batch Code *</label>
            <input type="text" className="form-control" value={formData.batch_code}
              onChange={(e) => setFormData({ ...formData, batch_code: e.target.value })} required
              placeholder="e.g., B2024001" />
          </div>
          <div className="form-group">
            <label className="form-label">Colour</label>
            <select className="form-control" value={formData.colour}
              onChange={(e) => setFormData({ ...formData, colour: e.target.value })}>
              <option value="">Select Colour</option>
              <option value="3000k">3000k</option>
              <option value="4000k">4000k</option>
              <option value="6500k">6500k</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input type="number" className="form-control" value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required min="1" />
          </div>
          <div className="form-group">
            <label className="form-label">Production Date *</label>
            <input type="date" className="form-control" value={formData.production_date}
              onChange={(e) => setFormData({ ...formData, production_date: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Warranty Period (months) *</label>
            <input type="number" className="form-control" value={formData.warranty_period}
              onChange={(e) => setFormData({ ...formData, warranty_period: e.target.value })} required min="1" />
          </div>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <input type="text" className="form-control" value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Contractor</label>
            <input type="text" className="form-control" value={formData.contractor}
              onChange={(e) => setFormData({ ...formData, contractor: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows="3" value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserModal = ({ user, onSave, onClose }) => {
  const isEdit = Boolean(user);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    type: user?.type || 'Rep',
    contact_no: user?.contact_no || '',
    email: user?.email || '',
    password: '',
    is_active: user?.is_active ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit User' : 'Add User'}</h2>
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
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type *</label>
            <select
              className="form-control"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="Rep">Representative</option>
              <option value="Factory">Factory User</option>
              <option value="Sales Manager">Sales Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Contact Number *</label>
            <input
              type="text"
              className="form-control"
              value={formData.contact_no}
              onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
            />
          </div>
          {(!isEdit || showPassword) && (
            <div className="form-group">
              <label className="form-label">{isEdit ? 'New Password' : 'Password *'}</label>
              <input
                type="password"
                className="form-control"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Minimum 6 characters'}
                {...(isEdit ? {} : { required: true, minLength: 6 })}
              />
            </div>
          )}
          {isEdit && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="changePasswordToggle"
                type="checkbox"
                checked={showPassword}
                onChange={(e) => {
                  setShowPassword(e.target.checked);
                  if (!e.target.checked) {
                    setFormData({ ...formData, password: '' });
                  }
                }}
              />
              <label htmlFor="changePasswordToggle" className="form-label" style={{ margin: 0 }}>Change Password</label>
            </div>
          )}
          {isEdit && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="activeToggle"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <label htmlFor="activeToggle" className="form-label" style={{ margin: 0 }}>Active</label>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ClaimsTab = ({ claims, onView, formatDate, getUserName, getMerchantName }) => {
  return (
    <div className="card">
      <div className="action-bar">
        <div className="action-bar-group">
          <h2>Claims Management</h2>
          <p>View all verified and pending claims</p>
        </div>
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
              <th>Items Count</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim._id}>
                <td>{formatDate(claim.date)}</td>
                <td>{getUserName(claim.rep_id)}</td>
                <td>{claim.items?.length || 0}</td>
                <td>
                  <span className={`badge ${claim.verified ? 'badge-success' : 'badge-warning'}`}>
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

const ClaimModal = ({ claim, batches, models, productTypes, users, merchants, onClose }) => {
  if (!claim) return null;

  const getBatchName = (batchId) => {
    const batch = batches.find(b => b._id === batchId || b.id === batchId);
    if (!batch) return `Batch ${batchId?.slice(-6) || 'Unknown'}`;
    const model = models.find(m => m._id === batch.model_id || m.id === batch.model_id);
    const pt = model ? productTypes.find(p => p._id === model.product_type_id || p.id === model.product_type_id) : null;
    return `${pt ? pt.name + ' > ' : ''}${model ? model.name : 'Unknown'} - ${batch.batch_code}`;
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unknown';
    const user = users.find(u => u._id === userId || u.id === userId);
    return user ? user.name : `User ${userId.slice(-6)}`;
  };

  const getMerchantName = (merchantId) => {
    if (!merchantId) return 'Unknown';
    const merchant = merchants.find(m => m._id === merchantId || m.id === merchantId);
    return merchant ? (merchant.name || merchant.address) : `Merchant ${merchantId.slice(-6)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
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
            <h3 style={{ marginBottom: '10px', color: '#333' }}>Basic Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <strong>Claim ID:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '1.1em', color: '#0066cc' }}>
                  {claim.claim_id || 'N/A'}
                </div>
              </div>
              <div>
                <strong>Claim Date:</strong>
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
                  <div>
                    <strong>Verified By:</strong>
                    <div>{getUserName(claim.verified_by)}</div>
                  </div>
                  <div>
                    <strong>Verification Date:</strong>
                    <div>{formatDate(claim.verification_date)}</div>
                  </div>
                </div>
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
                      <td>{item.notes || 'No notes'}</td>
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

          {/* Additional Notes */}
          {claim.notes && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Notes</h3>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '4px',
                whiteSpace: 'pre-wrap'
              }}>
                {claim.notes}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>Timestamps</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <strong>Created:</strong>
                <div>{formatDate(claim.created_at)}</div>
              </div>
              <div>
                <strong>Last Updated:</strong>
                <div>{formatDate(claim.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer-bordered">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
