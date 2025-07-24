import axios from "axios";
import errorHandler from "@/helpers/errorHandler";
const API_URL = import.meta.env.VITE_APP_ROOT_API;

// auth api
export const register = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/auth/register`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    return error;
  }
};

export const login = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    return error;
  }
};

export const getProfile = async () => {
  try {
    const res = await axios.get(`${API_URL}/profile`);
    return res.data;
  } catch (error) {
    errorHandler(error);
    return error;
  }
};

export const updateProfile = async (payload) => {
  try {
    const res = await axios.put(`${API_URL}/auth/profile`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    return error;
  }
};
