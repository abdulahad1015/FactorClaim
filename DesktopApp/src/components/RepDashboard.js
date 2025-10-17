import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { merchantsAPI, claimsAPI, itemsAPI, getErrorMessage } from '../services/api';

const RepDashboard = () => {
  const [activeTab, setActiveTab] = useState('merchants');
  const [merchants, setMerchants] = useState([]);
  const [claims, setClaims] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
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
        const data = await claimsAPI.getAll();
        setClaims(data);
        const itemsData = await itemsAPI.getAll();
        setItems(itemsData);
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

  const handleAddClaim = () => {
    setCurrentItem(null);
    setModalType('claim');
    setShowModal(true);
  };

  const handleSaveClaim = async (claimData) => {
    try {
      await claimsAPI.create(claimData);
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save claim'));
    }
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand">FactorClaim - Representative</div>
        <div className="navbar-user">
          <span className="navbar-username">{user?.name}</span>
          <button onClick={handleLogout} className="navbar-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Representative Dashboard</h1>
          <p className="dashboard-subtitle">Manage merchants and create claims</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
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
                onAdd={handleAddClaim}
                formatDate={formatDate}
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
      {showModal && modalType === 'claim' && (
        <ClaimModal
          merchants={merchants}
          items={items}
          userId={user?.id}
          onSave={handleSaveClaim}
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

const ClaimsTab = ({ claims, onAdd, formatDate }) => {
  return (
    <div className="card">
      <div className="action-bar">
        <h2>Claims Management</h2>
        <button className="btn btn-primary" onClick={onAdd}>
          + Create Claim
        </button>
      </div>
      {claims.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No claims found</div>
          <button className="btn btn-primary" onClick={onAdd}>Create Your First Claim</button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchant</th>
              <th>Items Count</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim._id}>
                <td>{formatDate(claim.date)}</td>
                <td>{claim.merchant_id}</td>
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
  );
};

const MerchantModal = ({ merchant, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: merchant?.name || '',
    address: merchant?.address || '',
    contact: merchant?.contact || '',
    email: merchant?.email || '',
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
              minLength={1}
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
              minLength={1}
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
              minLength={10}
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

const ClaimModal = ({ merchants, items, userId, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    merchant_id: '',
    items: [],
    notes: '',
  });

  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  const handleAddItem = () => {
    if (selectedItem && quantity > 0) {
      const item = items.find(i => i._id === selectedItem);
      if (item) {
        setFormData({
          ...formData,
          items: [...formData.items, { 
            item_id: item._id, 
            item_name: item.name, // For display only
            quantity: parseInt(quantity),
            notes: itemNotes
          }]
        });
        setSelectedItem('');
        setQuantity(1);
        setItemNotes('');
      }
    }
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    // Send only the data that matches backend ClaimCreate model
    onSave({
      rep_id: userId,
      merchant_id: formData.merchant_id,
      items: formData.items.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        notes: item.notes || ''
      })),
      notes: formData.notes || ''
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Create Claim</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Merchant *</label>
            <select
              className="form-control"
              value={formData.merchant_id}
              onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
              required
            >
              <option value="">Select Merchant</option>
              {merchants.map((merchant) => (
                <option key={merchant._id} value={merchant._id}>
                  {merchant.name || merchant.address}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Add Items</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <select
                className="form-control"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                style={{ flex: 2 }}
              >
                <option value="">Select Item</option>
                {items.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} - {item.model}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                style={{ flex: 1 }}
                placeholder="Qty"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-control"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Item notes (optional, max 200 chars)"
                maxLength={200}
                style={{ flex: 3 }}
              />
              <button type="button" className="btn btn-secondary" onClick={handleAddItem} style={{ flex: 1 }}>
                Add Item
              </button>
            </div>
          </div>

          {formData.items.length > 0 && (
            <div className="form-group">
              <label className="form-label">Selected Items</label>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Notes</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.item_name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.notes || '-'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleRemoveItem(index)}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Claim Notes</label>
            <textarea
              className="form-control"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about this claim (max 500 chars)"
              maxLength={500}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepDashboard;
