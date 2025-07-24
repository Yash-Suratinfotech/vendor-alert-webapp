import axios from "axios";
import errorHandler from "@/helpers/errorHandler";
const API_URL = import.meta.env.VITE_APP_ROOT_API;

// Get conversation list for current user
export const getConversations = async (filter = "") => {
  try {
    const res = await axios.get(`${API_URL}/conversations${filter}`);
    return res.data;
  } catch (error) {
    errorHandler(error);
    return error;
  }
};

// Get messages between two users
export const getMessages = async (filter = "") => {
  try {
    const res = await axios.get(`${API_URL}/messages${filter}`);
    return res.data;
  } catch (error) {
    errorHandler(error);
    return error;
  }
};

// Send a message
export const sendMessage = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/messages`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    return error;
  }
};

//  Mark message as read
export const readMessage = async (id) => {
  try {
    const res = await axios.put(`${API_URL}/messages/${id}/read`);
    return res.data;
  } catch (error) {
    errorHandler(error);
    return error;
  }
};

//  Handle vendor response to order (accept/decline)
export const vendorResponse = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/vendor-response`, payload);
    return res.data;
  } catch (error) {
    errorHandler(error);
    return error;
  }
};

// Delete messages
export const deleteChat = async (payload) => {
  try {
    const res = await axios.delete(`${API_URL}/messages`, { data: payload });
    return res.data;
  } catch (error) {
    errorHandler(error);
    return error;
  }
};
