import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authAPI = {
  signup: async (data) => {
    const response = await axios.post(`${API}/auth/signup`, data);
    return response.data;
  },
  login: async (data) => {
    const response = await axios.post(`${API}/auth/login`, data);
    return response.data;
  },
  verifyPin: async (pin) => {
    const response = await axios.post(
      `${API}/kiosk/verify-pin`,
      { pin },
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};

export const inventoryAPI = {
  getAll: async (kiosk = false) => {
    const response = await axios.get(`${API}/inventory?kiosk=${kiosk}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  create: async (data) => {
    const response = await axios.post(`${API}/inventory`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  update: async (id, data) => {
    const response = await axios.put(`${API}/inventory/${id}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await axios.delete(`${API}/inventory/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export const leadsAPI = {
  create: async (data) => {
    const response = await axios.post(`${API}/leads`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  getAll: async () => {
    const response = await axios.get(`${API}/leads`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export const visualizationAPI = {
  create: async (data) => {
    const response = await axios.post(`${API}/visualize`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export const analyticsAPI = {
  get: async () => {
    const response = await axios.get(`${API}/analytics`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export const tenantsAPI = {
  getAll: async () => {
    const response = await axios.get(`${API}/tenants`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};