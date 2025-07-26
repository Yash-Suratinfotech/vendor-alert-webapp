// src/api/auth.js
import axios from "axios";
import errorHandler from "@/helpers/errorHandler";
const API_URL = import.meta.env.VITE_APP_ROOT_API;

// Register
export const register = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/auth/register`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/auth/verify-otp`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
};

// Resend OTP
export const resendOTP = async (email) => {
  try {
    const res = await axios.post(`${API_URL}/auth/resend-otp`, { email });
    return res.data;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
};

// Login
export const login = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
};

// Forgot Password
export const forgotPassword = async (email) => {
  try {
    const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return res.data;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
};

// Reset Password
export const resetPassword = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/auth/reset-password`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
};

// Change Password
export const changePassword = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/auth/change-password`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
};

// Get Profile
export const getProfile = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
};

// Update Profile
export const updateProfile = async (payload) => {
  try {
    const res = await axios.put(`${API_URL}/profile`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
};

// Get Verify User
export const getVerifyUser = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/auth/verify-user`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    throw error;
  }
};
