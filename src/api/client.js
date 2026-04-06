import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const client = axios.create({
  baseURL: "https://packsmart-backend.onrender.com/api",
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