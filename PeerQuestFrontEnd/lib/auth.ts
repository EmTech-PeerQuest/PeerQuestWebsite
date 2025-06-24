import axios from "axios";

export const login = async (credentials: { email: string; password: string }) => {
  return axios.post("/auth/login/", credentials, { withCredentials: true });
};

export const register = async (userData: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}) => {
  return axios.post("/auth/register/", userData, { withCredentials: true });
};

export const logout = async () => {
  return axios.post("/auth/logout/", {}, { withCredentials: true });
};

export const fetchUser = async () => {
  return axios.get("/auth/user/", { withCredentials: true });
};