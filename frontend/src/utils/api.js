import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Attach JWT token to every request ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh token on 401 ───────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
          localStorage.setItem("access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post("/auth/register/", data),
  login:    (data)  => api.post("/auth/login/", data),
  refresh:  (token) => api.post("/auth/refresh/", { refresh: token }),
  me:       ()      => api.get("/me/"),
  updateMe: (data)  => api.patch("/me/", data),
};

// ─── Videos ──────────────────────────────────────────────────────────────────
export const videoAPI = {
  list: (params) => api.get("/videos/", { params }),

  get:  (id) => api.get(`/videos/${id}/`),

  upload: (formData) =>
    api.post("/videos/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id, formData) =>
    api.patch(`/videos/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  delete: (id) => api.delete(`/videos/${id}/`),

  react:  (id, reaction_type) => api.post(`/videos/${id}/react/`, { reaction_type }),

  trending:  ()       => api.get("/trending/"),
  feed:      ()       => api.get("/feed/"),
  search:    (query)  => api.get("/videos/", { params: { search: query } }),
};

// ─── Comments ─────────────────────────────────────────────────────────────────
export const commentAPI = {
  list:   (videoId)       => api.get(`/videos/${videoId}/comments/`),
  create: (videoId, data) => api.post(`/videos/${videoId}/comments/`, data),
  update: (id, data)      => api.patch(`/comments/${id}/`, data),
  delete: (id)            => api.delete(`/comments/${id}/`),
};

// ─── Channels ─────────────────────────────────────────────────────────────────
export const channelAPI = {
  get:       (id)  => api.get(`/channels/${id}/`),
  videos:    (id)  => api.get(`/channels/${id}/videos/`),
  subscribe: (id)  => api.post(`/channels/${id}/subscribe/`),
};

// ─── Playlists ────────────────────────────────────────────────────────────────
export const playlistAPI = {
  list:        ()                     => api.get("/playlists/"),
  create:      (data)                 => api.post("/playlists/", data),
  addVideo:    (playlistId, videoId)  => api.post(`/playlists/${playlistId}/videos/${videoId}/`),
  removeVideo: (playlistId, videoId)  => api.delete(`/playlists/${playlistId}/videos/${videoId}/`),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoryAPI = {
  list: () => api.get("/categories/"),
};

// ─── Watch History ────────────────────────────────────────────────────────────
export const historyAPI = {
  list: () => api.get("/me/history/"),
};

export default api;