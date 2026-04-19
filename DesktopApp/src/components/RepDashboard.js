import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { merchantsAPI, claimsAPI, batchesAPI, productModelsAPI, productTypesAPI, locationsAPI, getErrorMessage } from '../services/api';

const RepDashboard = () => {
  const [activeTab, setActiveTab] = useState('merchants');
  const [merchants, setMerchants] = useState([]);
  const [claims, setClaims] = useState([]);
  const [batches, setBatches] = useState([]);
  const [productModels, setProductModels] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
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
        const [claimsData, batchesData, modelsData, typesData, merchantsData] = await Promise.all([
          claimsAPI.getAll(),
          batchesAPI.getAll(),
          productModelsAPI.getAll(),
          productTypesAPI.getAll(),
          merchantsAPI.getAll()
        ]);
        // Filter claims to show only ones created by current user
        const userClaims = claimsData.filter(claim => 
          claim.rep_id === user?.id || claim.rep_id === user?._id
        );
        setClaims(userClaims);
        setBatches(batchesData);
        setProductModels(modelsData);
        setProductTypes(typesData);
        setMerchants(merchantsData);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

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

  const handleAddClaim = () => {
    setModalType('claim');
    setShowModal(true);
  };

  const handleSaveClaim = async (claimData) => {
    try {
      await claimsAPI.create(claimData);
      setShowModal(false);
      loadData();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.error === 'items_require_confirmation') {
        throw err; // Let ClaimModal handle warranty warnings
      }
      setError(getErrorMessage(err, 'Failed to save claim'));
    }
  };

  const handleViewClaim = (claim) => {
    setCurrentClaim(claim);
    setModalType('viewClaim');
    setShowModal(true);
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
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'merchants' && (
              <MerchantsTab
                merchants={merchants}
              />
            )}
            {activeTab === 'claims' && (
              <ClaimsTab
                claims={claims}
                merchants={merchants}
                onAdd={handleAddClaim}
                onView={handleViewClaim}
                formatDate={formatDate}
              />
            )}
          </>
        )}
      </div>

      {showModal && modalType === 'claim' && (
        <ClaimModal
          merchants={merchants}
          batches={batches}
          productModels={productModels}
          productTypes={productTypes}
          userId={user?.id}
          onSave={handleSaveClaim}
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
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); loadData(); }}
        />
      )}
    </div>
  );
};

const MerchantsTab = ({ merchants }) => {
  return (
    <div className="card">
      <div className="action-bar">
        <h2>Merchants</h2>
      </div>
      {merchants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏪</div>
          <div className="empty-state-text">No merchants found</div>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Contact</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((merchant) => (
              <tr key={merchant._id}>
                <td>{merchant.name}</td>
                <td>{merchant.address}</td>
                <td>{merchant.contact}</td>
                <td>{merchant.email || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const ClaimsTab = ({ claims, merchants, onAdd, onView, formatDate }) => {
  const getMerchantName = (merchantId) => {
    if (!merchantId) return 'Unknown';
    const merchant = merchants.find(m => m._id === merchantId || m.id === merchantId);
    return merchant ? (merchant.name || merchant.address) : `Merchant ${String(merchantId).slice(-6)}`;
  };

  return (
    <div className="card">
      <div className="action-bar">
        <h2>My Claims</h2>
        <button className="btn btn-primary action-bar-btn" onClick={onAdd}>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim._id}>
                <td>{formatDate(claim.date)}</td>
                <td>{getMerchantName(claim.merchant_id)}</td>
                <td>{claim.items?.length || 0}</td>
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

const ClaimModal = ({ merchants, batches, productModels, productTypes, userId, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    merchant_id: '',
    items: [],
    notes: '',
  });

  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [locations, setLocations] = useState([]);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [showNewCityInput, setShowNewCityInput] = useState(false);
  const [warrantyWarnings, setWarrantyWarnings] = useState(null);
  const [forceAddReasons, setForceAddReasons] = useState({});
  const [showForceAddDialog, setShowForceAddDialog] = useState(false);
  const [pendingClaimData, setPendingClaimData] = useState(null);

  // Load locations on mount
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
    (!filterProvince || l.province === filterProvince) &&
    (!citySearch || l.name.toLowerCase().includes(citySearch.toLowerCase()))
  );
  const filteredMerchants = merchants.filter(m => {
    if (filterProvince && m.province !== filterProvince) return false;
    if (filterCity && m.city !== filterCity) return false;
    return true;
  });

  const getBatchLabel = (batch) => {
    const model = productModels.find(m => m._id === batch.model_id);
    const typeName = model ? (productTypes.find(t => t._id === model.product_type_id)?.name || '') : '';
    const modelName = model ? model.name : '';
    const wattage = model ? model.wattage : '';
    return `${batch.batch_code} - ${modelName} ${wattage}W${typeName ? ` (${typeName})` : ''}`;
  };

  const handleBatchScan = async (e) => {
    if (e.key === 'Enter' && batchCode.trim() && !isScanning) {
      e.preventDefault();
      setScanError('');
      setIsScanning(true);
      try {
        const batch = await batchesAPI.getByBarcode(batchCode.trim());
        if (batch) {
          const model = productModels.find(m => m._id === batch.model_id);
          // Check if batch already exists in the list
          const existingIndex = formData.items.findIndex(i => i.batch_id === batch._id);
          
          if (existingIndex >= 0) {
            // Batch exists, increment quantity
            const updatedItems = [...formData.items];
            updatedItems[existingIndex].quantity += parseInt(quantity);
            setFormData({
              ...formData,
              items: updatedItems
            });
          } else {
            // New batch, add to list
            setFormData({
              ...formData,
              items: [...formData.items, {
                batch_id: batch._id,
                batch_code: batch.batch_code,
                model_name: model ? model.name : 'Unknown',
                wattage: model ? model.wattage : '',
                quantity: parseInt(quantity),
                notes: itemNotes
              }]
            });
          }
          setBatchCode('');
          setQuantity(1);
          setItemNotes('');
        }
      } catch (err) {
        setScanError(getErrorMessage(err, 'Batch not found. Please check the batch code.'));
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleAddItem = () => {
    if (selectedBatch && quantity > 0) {
      const batch = batches.find(b => b._id === selectedBatch);
      if (batch) {
        const model = productModels.find(m => m._id === batch.model_id);
        // Check if batch already exists in the list
        const existingIndex = formData.items.findIndex(i => i.batch_id === batch._id);
        
        if (existingIndex >= 0) {
          // Batch exists, increment quantity
          const updatedItems = [...formData.items];
          updatedItems[existingIndex].quantity += parseInt(quantity);
          setFormData({
            ...formData,
            items: updatedItems
          });
        } else {
          // New batch, add to list
          setFormData({
            ...formData,
            items: [...formData.items, { 
              batch_id: batch._id, 
              batch_code: batch.batch_code,
              model_name: model ? model.name : 'Unknown',
              wattage: model ? model.wattage : '',
              quantity: parseInt(quantity),
              notes: itemNotes
            }]
          });
        }
        setSelectedBatch('');
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
    const claimData = {
      rep_id: userId,
      merchant_id: formData.merchant_id,
      items: formData.items.map(item => ({
        batch_id: item.batch_id,
        quantity: item.quantity,
        notes: item.notes || '',
        force_add: item.force_add || false,
        force_add_reason: item.force_add_reason || ''
      })),
      notes: formData.notes || ''
    };
    submitClaim(claimData);
  };

  const submitClaim = async (claimData) => {
    try {
      await onSave(claimData);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.error === 'items_require_confirmation') {
        setWarrantyWarnings(detail.warnings);
        setPendingClaimData(claimData);
        // Initialize reasons for each warning
        const reasons = {};
        detail.warnings.forEach(w => { reasons[w.item_index] = ''; });
        setForceAddReasons(reasons);
        setShowForceAddDialog(true);
      } else {
        throw err;
      }
    }
  };

  const handleForceAddConfirm = () => {
    // Validate all reasons are filled
    for (const w of warrantyWarnings) {
      if (!forceAddReasons[w.item_index]?.trim()) {
        alert(`Please provide a reason for batch "${w.batch_code}"`);
        return;
      }
    }
    // Update items with force_add and reason
    const updatedItems = pendingClaimData.items.map((item, idx) => {
      const warning = warrantyWarnings.find(w => w.item_index === idx);
      if (warning) {
        return { ...item, force_add: true, force_add_reason: forceAddReasons[idx] };
      }
      return item;
    });
    const updatedData = { ...pendingClaimData, items: updatedItems };
    setShowForceAddDialog(false);
    onSave(updatedData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Create Claim</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '0' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Province</label>
              <select
                className="form-control"
                value={filterProvince}
                onChange={(e) => {
                  setFilterProvince(e.target.value);
                  setFilterCity('');
                  setCitySearch('');
                  setFormData({ ...formData, merchant_id: '' });
                }}
              >
                <option value="">All Provinces</option>
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, position: 'relative' }}>
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-control"
                value={filterCity || citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setFilterCity('');
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                placeholder="Type to search cities..."
                disabled={!filterProvince}
              />
              {showCityDropdown && citySearch && filteredCities.length > 0 && (
                <div style={{ position: 'absolute', zIndex: 100, background: '#fff', border: '1px solid #ddd', maxHeight: '200px', overflowY: 'auto', width: '100%', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  {filteredCities.map((loc) => (
                    <div key={loc._id || loc.name} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      onClick={() => {
                        setFilterCity(loc.name);
                        setCitySearch('');
                        setShowCityDropdown(false);
                        setFormData({ ...formData, merchant_id: '' });
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
              {showCityDropdown && citySearch && filteredCities.length === 0 && (
                <div style={{ position: 'absolute', zIndex: 100, background: '#fff', border: '1px solid #ddd', width: '100%', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div style={{ padding: '8px 12px', color: '#999' }}>No cities found</div>
                  <div style={{ padding: '8px 12px', cursor: 'pointer', color: '#0066cc', fontWeight: 'bold', borderTop: '1px solid #eee' }}
                    onClick={() => { setShowNewCityInput(true); setShowCityDropdown(false); setNewCityName(citySearch); }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    + Add New City: "{citySearch}"
                  </div>
                </div>
              )}
              {filterCity && (
                <button type="button" style={{ position: 'absolute', right: '8px', top: '32px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: '#999' }}
                  onClick={() => { setFilterCity(''); setCitySearch(''); setFormData({ ...formData, merchant_id: '' }); }}>×</button>
              )}
            </div>
          </div>
          {showNewCityInput && filterProvince && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '10px', background: '#f0f8ff', borderRadius: '4px' }}>
              <input type="text" className="form-control" value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)} placeholder="New city name" style={{ flex: 1 }} />
              <button type="button" className="btn btn-primary" onClick={async () => {
                if (!newCityName.trim()) return;
                try {
                  await locationsAPI.create({ name: newCityName.trim(), province: filterProvince });
                  const data = await locationsAPI.getAll();
                  setLocations(data);
                  setFilterCity(newCityName.trim());
                  setShowNewCityInput(false);
                  setNewCityName('');
                  setCitySearch('');
                } catch (err) { alert(getErrorMessage(err, 'Failed to create city')); }
              }}>Add</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowNewCityInput(false); setNewCityName(''); }}>Cancel</button>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Merchant *</label>
            <select
              className="form-control"
              value={formData.merchant_id}
              onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
              required
            >
              <option value="">Select Merchant{filterProvince ? ` (${filteredMerchants.length} found)` : ''}</option>
              {filteredMerchants.map((merchant) => (
                <option key={merchant._id} value={merchant._id}>
                  {merchant.name}{merchant.city ? ` — ${merchant.city}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Add Items</label>
            
            {/* Barcode Scanner Input */}
            <div style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
              <label className="form-label" style={{ fontSize: '14px', marginBottom: '5px', display: 'block' }}>Scan Barcode (Batch Code)</label>
              <input
                type="text"
                className="form-control"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                onKeyPress={handleBatchScan}
                placeholder="Scan barcode or enter batch code, then press Enter"
                style={{ marginBottom: '5px' }}
              />
              {scanError && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>{scanError}</div>}
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>Tip: Scan the item barcode and it will be added automatically</div>
            </div>

            {/* Manual Selection */}
            <div style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontSize: '14px' }}>Or Select Manually</label>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <select
                className="form-control"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                style={{ flex: 2 }}
              >
                <option value="">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {getBatchLabel(batch)}
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
                    <th>Model</th>
                    <th>Wattage</th>
                    <th>Batch Code</th>
                    <th>Quantity</th>
                    <th>Notes</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.model_name}</td>
                      <td>{item.wattage}W</td>
                      <td>{item.batch_code}</td>
                      <td>{item.quantity}</td>
                      <td>{item.notes || '-'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveItem(index)}
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

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Claim
            </button>
          </div>
        </form>
      </div>
      {showForceAddDialog && warrantyWarnings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowForceAddDialog(false)}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#dc3545' }}>⚠️ Warranty Expired</h3>
            <p>The following batches have expired warranties. Please provide a reason for each to proceed:</p>
            {warrantyWarnings.map((w) => (
              <div key={w.item_index} style={{ marginBottom: '15px', padding: '10px', background: '#fff3cd', borderRadius: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Batch: {w.batch_code}</div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>{w.message}</div>
                <textarea
                  className="form-control"
                  placeholder="Reason for adding expired batch (required)"
                  value={forceAddReasons[w.item_index] || ''}
                  onChange={(e) => setForceAddReasons({ ...forceAddReasons, [w.item_index]: e.target.value })}
                  rows={2}
                  required
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForceAddDialog(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleForceAddConfirm}>Confirm & Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ViewClaimModal = ({ claim, batches, productModels, productTypes, merchants, onClose, onSuccess }) => {
  const [biltyNumber, setBiltyNumber] = useState(claim?.bilty_number || '');
  const [isUpdatingBilty, setIsUpdatingBilty] = useState(false);
  const [biltyError, setBiltyError] = useState('');

  if (!claim) return null;

  const getBatchName = (batchId) => {
    const batch = batches.find(b => b._id === batchId || b.id === batchId);
    if (!batch) return `Batch ${batchId ? String(batchId).slice(-6) : 'Unknown'}`;
    const model = productModels.find(m => m._id === batch.model_id);
    const typeName = model ? (productTypes.find(t => t._id === model.product_type_id)?.name || '') : '';
    return `${batch.batch_code} - ${model ? model.name : 'Unknown'}${typeName ? ` (${typeName})` : ''}`;
  };

  const getMerchantName = (merchantId) => {
    if (!merchantId) return 'Unknown';
    const merchant = merchants.find(m => m._id === merchantId || m.id === merchantId);
    return merchant ? (merchant.name || merchant.address) : `Merchant ${String(merchantId).slice(-6)}`;
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

  const handleUpdateBilty = async () => {
    if (!biltyNumber.trim()) {
      setBiltyError('Bilty number is required');
      return;
    }

    setIsUpdatingBilty(true);
    setBiltyError('');

    try {
      await claimsAPI.updateBilty(claim._id || claim.id, biltyNumber);
      alert('Bilty number updated successfully! Status changed to Approval Pending.');
      if (onSuccess) onSuccess(); else onClose();
    } catch (err) {
      setBiltyError(getErrorMessage(err, 'Failed to update bilty number'));
    } finally {
      setIsUpdatingBilty(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">My Claim Details</h2>
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
                <strong>Claim Date:</strong>
                <div>{formatDate(claim.date)}</div>
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

          {/* Bilty Number Section */}
          {claim.status === 'Bilty Pending' && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Add Bilty Number</h3>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: '4px'
              }}>
                <p style={{ marginBottom: '10px', color: '#856404' }}>
                  Please enter the bilty number to proceed with approval process.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Bilty Number"
                      value={biltyNumber}
                      onChange={(e) => setBiltyNumber(e.target.value)}
                      disabled={isUpdatingBilty}
                    />
                    {biltyError && (
                      <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '5px' }}>
                        {biltyError}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleUpdateBilty}
                    disabled={isUpdatingBilty || !biltyNumber.trim()}
                  >
                    {isUpdatingBilty ? 'Updating...' : 'Update Bilty'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Show Bilty Number if already set */}
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
                <div style={{ marginBottom: '8px' }}>
                  <strong>✓ This claim has been verified and approved</strong>
                </div>
                <div>Verification Date: {formatDate(claim.verification_date)}</div>
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

          {/* Claim Notes */}
          {claim.notes && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Claim Notes</h3>
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

          {/* Status Information */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>Status Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong>Submitted:</strong>
                <div>{formatDate(claim.created_at)}</div>
              </div>
              <div>
                <strong>Last Updated:</strong>
                <div>{formatDate(claim.updated_at)}</div>
              </div>
            </div>
            {!claim.verified && (
              <div style={{ 
                marginTop: '15px',
                padding: '15px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: '4px',
                color: '#856404'
              }}>
                <strong>⏳ Pending Verification</strong>
                <div>Your claim is awaiting review and verification by an administrator.</div>
              </div>
            )}
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

export default RepDashboard;
