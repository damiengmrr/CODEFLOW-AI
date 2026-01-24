import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: false,
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[CODEFLOW-AI] Erreur API:", error);
    throw error;
  }
);
export default api;
