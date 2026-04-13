import axios from "axios";

function resolveApiUrl() {
	const raw = import.meta.env.VITE_API_URL?.trim();
	if (!raw) {
		return "http://127.0.0.1:8000";
	}
	// Accept values like //api.example.com and force https in production.
	if (raw.startsWith("//")) {
		return `https:${raw}`;
	}
	return raw;
}

const api = axios.create({
	baseURL: resolveApiUrl(),
});

api.interceptors.request.use((config) => {
const token = localStorage.getItem("token");
if (token) {
config.headers.Authorization = `Bearer ${token}`;
}
return config;
});

api.interceptors.response.use(
(response) => response,
(error) => {
if (error.response?.status === 401) {
localStorage.removeItem("token");
localStorage.removeItem("nombre");
localStorage.removeItem("rol");
window.location.href = "/login";
}
return Promise.reject(error);
}
);

export default api;