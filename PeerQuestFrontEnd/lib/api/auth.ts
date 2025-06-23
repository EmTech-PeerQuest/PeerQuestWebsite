import axios from 'axios';

const axiosAuth = axios.create({
  baseURL: 'http://localhost:8000', // Backend URL
  withCredentials: true,            // Enables cookie-based auth
});

export default axiosAuth;
