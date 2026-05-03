import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = __DEV__
  ? "http://192.168.31.111:5001/api" // local development
  : "https://packsmart-backend.onrender.com/api"; // production deploy

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default client;