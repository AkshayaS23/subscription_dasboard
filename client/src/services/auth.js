// client/src/services/auth.js
import { authAPI } from './api'; // this uses your axios instance with baseURL

export const loginMock = async ({ email, password }) => {
  try {
    const response = await authAPI.login({ email, password });
    return response.data.data; // assuming backend responds with { data: { user, tokens } }
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const registerMock = async ({ name, email, password }) => {
  try {
    const response = await authAPI.register({ name, email, password });
    return response.data.data; // user data from backend
  } catch (error) {
    console.error('Register error:', error.response?.data || error.message);
    throw error;
  }
};
