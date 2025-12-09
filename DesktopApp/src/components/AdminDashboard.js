import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, itemsAPI, claimsAPI, merchantsAPI, getErrorMessage } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState([]);
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

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'items') {
        const data = await itemsAPI.getAll();
        setItems(data);
      } else if (activeTab === 'users') {
        const data = await usersAPI.getAll();
        setUsers(data);
      } else if (activeTab === 'claims') {
        // Load all data needed for claims tab
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
        // Load all data needed for statistics
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

  const handleAddItem = () => {
    setCurrentItem(null);
    setModalType('item');
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    setCurrentItem(item);
    setModalType('item');
    setShowModal(true);
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsAPI.delete(id);
        loadData();
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to delete item'));
      }
    }
  };

  const handleSaveItem = async (itemData) => {
    try {
      if (currentItem) {
        await itemsAPI.update(currentItem._id, itemData);
      } else {
        await itemsAPI.create(itemData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save item'));
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
          <p className="dashboard-subtitle">Manage items, users, and view statistics</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        )}

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Items
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
            {activeTab === 'items' && (
              <ItemsTab
                items={items}
                onAdd={handleAddItem}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
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

      {showModal && modalType === 'item' && (
        <ItemModal
          item={currentItem}
          items={items}
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
          items={items}
          users={users}
          merchants={merchants}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

const ItemsTab = ({ items, onAdd, onEdit, onDelete }) => {
  const [filters, setFilters] = useState({
    search: '',
    itemType: '',
    supplier: '',
    minWattage: '',
    maxWattage: ''
  });

  // Get unique values for filter dropdowns
  const uniqueItemTypes = [...new Set(items.map(item => item.item_type).filter(Boolean))].sort();
  const uniqueSuppliers = [...new Set(items.map(item => item.supplier).filter(Boolean))].sort();

  // Filter items based on current filters
  const filteredItems = items.filter(item => {
    const matchesSearch = !filters.search || 
      item.model_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.batch?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesItemType = !filters.itemType || item.item_type === filters.itemType;
    const matchesSupplier = !filters.supplier || item.supplier === filters.supplier;
    
    const matchesMinWattage = !filters.minWattage || item.wattage >= parseInt(filters.minWattage);
    const matchesMaxWattage = !filters.maxWattage || item.wattage <= parseInt(filters.maxWattage);

    return matchesSearch && matchesItemType && matchesSupplier && matchesMinWattage && matchesMaxWattage;
  });

  const clearFilters = () => {
    setFilters({
      search: '',
      itemType: '',
      supplier: '',
      minWattage: '',
      maxWattage: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="card">
      <div className="action-bar">
        <h2>Items Management</h2>
        <button className="btn btn-primary" onClick={onAdd}>
          + Add Item
        </button>
      </div>

      {/* Filters Section */}
      <div style={{ padding: '20px', backgroundColor: '#f8f9fa', margin: '20px', borderRadius: '4px' }}>
        <h4 style={{ marginBottom: '15px', color: '#333' }}>Filters</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search model, batch, supplier..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Item Type</label>
            <select
              className="form-control"
              value={filters.itemType}
              onChange={(e) => setFilters({ ...filters, itemType: e.target.value })}
            >
              <option value="">All Types</option>
              {uniqueItemTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Supplier</label>
            <select
              className="form-control"
              value={filters.supplier}
              onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
            >
              <option value="">All Suppliers</option>
              {uniqueSuppliers.map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Min Wattage</label>
            <input
              type="number"
              className="form-control"
              placeholder="Min W"
              value={filters.minWattage}
              onChange={(e) => setFilters({ ...filters, minWattage: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Max Wattage</label>
            <input
              type="number"
              className="form-control"
              placeholder="Max W"
              value={filters.maxWattage}
              onChange={(e) => setFilters({ ...filters, maxWattage: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>
            Showing {filteredItems.length} of {items.length} items
          </span>
          {hasActiveFilters && (
            <button 
              className="btn btn-secondary" 
              onClick={clearFilters}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-text">
            {hasActiveFilters ? 'No items match the current filters' : 'No items found'}
          </div>
          {!hasActiveFilters ? (
            <button className="btn btn-primary" onClick={onAdd}>Add Your First Item</button>
          ) : (
            <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button>
          )}
        </div>
      ) : (
          <table className="table">
          <thead>
            <tr>
              <th>Model Name</th>
              <th>Item Type</th>
              <th>Batch</th>
              <th>Wattage</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item._id}>
                <td>{item.model_name}</td>
                <td>{item.item_type}</td>
                <td>{item.batch}</td>
                <td>{item.wattage}W</td>
                <td>{item.supplier}</td>
                <td>
                  <button className="btn btn-secondary" style={{ marginRight: '8px' }} onClick={() => onEdit(item)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => onDelete(item._id)}>
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

const UsersTab = ({ users, onAdd, onEdit, onDelete }) => {
  return (
    <div className="card">
      <div className="action-bar">
        <h2>Users Management</h2>
        <button className="btn btn-primary" onClick={onAdd}>
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
                <td style={{ display: 'flex', gap: '6px' }}>
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
                    <span className={`badge ${claim.verified ? 'badge-success' : 'badge-warning'}`}>
                      {claim.verified ? 'Verified' : 'Pending'}
                    </span>
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

const ItemModal = ({ item, items, onSave, onClose }) => {
  const [isCustomModelName, setIsCustomModelName] = useState(false);
  const [formData, setFormData] = useState({
    model_name: item?.model_name || '',
    item_type: item?.item_type || 'LED Bulb',
    batch: item?.batch || '',
    production_date: item?.production_date ? item.production_date.split('T')[0] : '',
    wattage: item?.wattage || '',
    supplier: item?.supplier || '',
    contractor: item?.contractor || '',
    notes: item?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare data for submission
    const dataToSend = {
      model_name: formData.model_name,
      item_type: formData.item_type,
      batch: formData.batch,
      wattage: parseInt(formData.wattage),
      supplier: formData.supplier,
      notes: formData.notes || '',
    };
    
    // Add production_date if provided (convert to ISO datetime)
    if (formData.production_date) {
      dataToSend.production_date = new Date(formData.production_date).toISOString();
    }
    
    // Add contractor only if provided (must be at least 1 character)
    if (formData.contractor && formData.contractor.trim().length > 0) {
      dataToSend.contractor = formData.contractor;
    }
    
    onSave(dataToSend);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{item ? 'Edit Item' : 'Add Item'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Model Name *</label>
            {!isCustomModelName ? (
              <div>
                <select
                  className="form-control"
                  value={formData.model_name}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setIsCustomModelName(true);
                      setFormData({ ...formData, model_name: '' });
                    } else {
                      setFormData({ ...formData, model_name: e.target.value });
                    }
                  }}
                  required
                >
                  <option value="">Select existing or create new</option>
                  {[...new Set(items.map(i => i.model_name).filter(Boolean))]
                    .sort()
                    .map(modelName => (
                      <option key={modelName} value={modelName}>{modelName}</option>
                    ))
                  }
                  <option value="__CREATE_NEW__">+ Create New Model Name</option>
                </select>
                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Choose from existing model names or create a new one
                </small>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  className="form-control"
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  required
                  placeholder="Enter new model name (e.g., LED-100W-2024)"
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsCustomModelName(false);
                    setFormData({ ...formData, model_name: '' });
                  }}
                  style={{ marginTop: '8px', fontSize: '12px', padding: '4px 8px' }}
                >
                  ← Back to Selection
                </button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Item Type *</label>
            <select
              className="form-control"
              value={formData.item_type}
              onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
              required
            >
              <option value="LED Bulb">LED Bulb</option>
              <option value="CFL Bulb">CFL Bulb</option>
              <option value="Incandescent Bulb">Incandescent Bulb</option>
              <option value="Halogen Bulb">Halogen Bulb</option>
              <option value="Tube Light">Tube Light</option>
              <option value="Panel Light">Panel Light</option>
              <option value="Street Light">Street Light</option>
              <option value="Flood Light">Flood Light</option>
              <option value="Emergency Light">Emergency Light</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Batch *</label>
            <input
              type="text"
              className="form-control"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Production Date</label>
            <input
              type="date"
              className="form-control"
              value={formData.production_date}
              onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Wattage *</label>
            <input
              type="number"
              className="form-control"
              value={formData.wattage}
              onChange={(e) => setFormData({ ...formData, wattage: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Supplier *</label>
            <input
              type="text"
              className="form-control"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contractor</label>
            <input
              type="text"
              className="form-control"
              value={formData.contractor}
              onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-control"
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
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
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
        <h2>Claims Management</h2>
        <p>View all verified and pending claims</p>
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

const ClaimModal = ({ claim, items, users, merchants, onClose }) => {
  if (!claim) return null;

  const getItemName = (itemId) => {
    const item = items.find(i => i._id === itemId || i.id === itemId);
    return item ? `${item.model_name} (${item.item_type})` : `Item ${itemId?.slice(-6) || 'Unknown'}`;
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
                <div>
                  <span className={`badge ${claim.verified ? 'badge-success' : 'badge-warning'}`}>
                    {claim.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Details */}
          {claim.verified && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Verification Details</h3>
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
                      <td>{getItemName(item.item_id)}</td>
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

        <div style={{ padding: '20px', borderTop: '1px solid #dee2e6', textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
