// services/bidService.js
import axios from 'axios';

const API_URL = 'http://your-kong-api-url';
const TOKEN_KEY = 'auth_token';

export const placeBid = async (listingId, amount) => {
  const token = localStorage.getItem(TOKEN_KEY);
  return axios.post(`${API_URL}/place_bid/${listingId}`, { amount }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getBidHistory = async (listingId) => {
  return axios.get(`${API_URL}/bidding/get_history/${listingId}`);
};

export const getUserBids = async (userId) => {
  const token = localStorage.getItem(TOKEN_KEY);
  return axios.get(`${API_URL}/bidding/${userId}/bids`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};