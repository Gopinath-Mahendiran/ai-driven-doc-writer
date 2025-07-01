import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";

// Subscribers to auth state
const authListeners = [];

export const subscribeAuth = (listener) => {
  authListeners.push(listener);
  return () => {
    const index = authListeners.indexOf(listener);
    if (index !== -1) authListeners.splice(index, 1);
  };
};

export const notifyAuthChange = () => {
  const state = isAuthenticated();
  authListeners.forEach((listener) => listener(state));
};

const isAuthenticated = () => {
  const token = localStorage.getItem(ACCESS_TOKEN) ;
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    return decoded.exp > Date.now() / 1000;
  } catch (error) {
    console.error("Token decoding failed:", error);
    return false;
  }
};

export default isAuthenticated;