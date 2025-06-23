import axios from "axios"

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000", // or your Django backend URL
  withCredentials: true // if you're using cookies/session auth
})

export default axiosInstance
