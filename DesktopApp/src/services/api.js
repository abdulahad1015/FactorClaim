import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility function to extract error messages
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  const errorDetail = error.response?.data?.detail;
  
  // Handle FastAPI validation errors (array of error objects)
  if (Array.isArray(errorDetail)) {
    return errorDetail.map(e => {
      const field = e.loc?.slice(1).join('.') || 'field';
      return `${field}: ${e.msg}`;
    }).join(', ');
  }
  
  // Handle string error messages
  if (typeof errorDetail === 'string') {
    return errorDetail;
  }
  
  // Fallback to error message or default
  return error.message || defaultMessage;
};

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', {
      email,
      password
    });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/api/users/');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },
  
  create: async (userData) => {
    const response = await api.post('/api/users/', userData);
    return response.data;
  },
  
  update: async (id, userData) => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },
};

// Product Types API
export const productTypesAPI = {
  getAll: async () => {
    const response = await api.get('/api/product-types/');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/api/product-types/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/api/product-types/', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/product-types/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/product-types/${id}`);
    return response.data;
  },
};

// Product Models API
export const productModelsAPI = {
  getAll: async (productTypeId = null) => {
    const params = productTypeId ? `?product_type_id=${productTypeId}` : '';
    const response = await api.get(`/api/models/${params}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/api/models/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/api/models/', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/models/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/models/${id}`);
    return response.data;
  },
};

// Batches API
export const batchesAPI = {
  getAll: async (modelId = null) => {
    const params = modelId ? `?model_id=${modelId}` : '';
    const response = await api.get(`/api/batches/${params}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/api/batches/${id}`);
    return response.data;
  },
  
  getByBarcode: async (batchCode) => {
    const response = await api.get(`/api/batches/barcode/${batchCode}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/api/batches/', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/batches/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/batches/${id}`);
    return response.data;
  },
};

// Merchants API
export const merchantsAPI = {
  getAll: async () => {
    const response = await api.get('/api/merchants/');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/api/merchants/${id}`);
    return response.data;
  },
  
  create: async (merchantData) => {
    const response = await api.post('/api/merchants/', merchantData);
    return response.data;
  },
  
  update: async (id, merchantData) => {
    const response = await api.put(`/api/merchants/${id}`, merchantData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/merchants/${id}`);
    return response.data;
  },
};

// Claims API
export const claimsAPI = {
  getAll: async () => {
    const response = await api.get('/api/claims/');
    return response.data;
  },
  
  getUnverified: async () => {
    const response = await api.get('/api/claims/unverified');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/api/claims/${id}`);
    return response.data;
  },
  
  create: async (claimData) => {
    const response = await api.post('/api/claims/', claimData);
    return response.data;
  },
  
  update: async (id, claimData) => {
    const response = await api.put(`/api/claims/${id}`, claimData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/claims/${id}`);
    return response.data;
  },
  
  verify: async (id, verifyData) => {
    const response = await api.put(`/api/claims/${id}/verify`, verifyData);
    return response.data;
  },
  
  updateBilty: async (id, biltyNumber) => {
    const response = await api.put(`/api/claims/${id}/bilty`, { bilty_number: biltyNumber });
    return response.data;
  },
  
  approve: async (id, approveData) => {
    const response = await api.put(`/api/claims/${id}/approve`, approveData);
    return response.data;
  },
};

export default api;
