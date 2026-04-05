import axios from "axios";

const TEMP_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJnc2FrcmFuMTRAZ21haWwuY29tIiwiaWF0IjoxNzc0ODA5NTA0LCJleHAiOjE3NzU0MTQzMDR9.wYjvqBTs9qQAMvrHDpcrhd7sIGbLC1cw__Pd8KpbdyU";

const client = axios.create({
  baseURL: "https://packsmart-backend.onrender.com/api",
  timeout: 30000,
});

client.interceptors.request.use(
  async (config) => {
    if (TEMP_TOKEN) {
      config.headers.Authorization = `Bearer ${TEMP_TOKEN}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client;