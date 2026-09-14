import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for Auth Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for handling errors and token expiration.
// Note: this unwraps response.data, so every apiClient call resolves to the payload directly.
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.detail || error.response?.data?.message || 'Có lỗi xảy ra';
    return Promise.reject(new Error(message));
  }
);

type AnyData = any;

export const api = {
  // ===== AUTH =====
  login: (payload: any) => apiClient.post<never, AnyData>('/auth/login-json', payload).then(data => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }),
  register: (payload: any) => apiClient.post<never, AnyData>('/auth/register', payload).then(data => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }),
  getMe: () => apiClient.get<never, AnyData>('/auth/me'),
  updateMe: (payload: any) => apiClient.put<never, AnyData>('/auth/me', payload).then(data => {
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined') window.location.href = '/login';
  },
  getUser: () => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  // ===== CLUBS =====
  getClubs: (params: any = {}) => apiClient.get<never, AnyData>('/clubs', { params }),
  getClub: (id: string | number) => apiClient.get<never, AnyData>(`/clubs/${id}`),
  getClubBySlug: (slug: string) => apiClient.get<never, AnyData>(`/clubs/slug/${slug}`),
  getFeaturedClubs: () => apiClient.get<never, AnyData>('/clubs/featured'),
  getCategories: () => apiClient.get<never, AnyData>('/clubs/categories'),
  createClub: (payload: any) => apiClient.post<never, AnyData>('/clubs', payload),
  updateClub: (id: string | number, payload: any) => apiClient.put<never, AnyData>(`/clubs/${id}`, payload),
  deleteClub: (id: string | number) => apiClient.delete<never, AnyData>(`/clubs/${id}`),
  joinClub: (id: string | number) => apiClient.post<never, AnyData>(`/clubs/${id}/join`),
  leaveClub: (id: string | number) => apiClient.post<never, AnyData>(`/clubs/${id}/leave`),
  getClubMembers: (id: string | number) => apiClient.get<never, AnyData>(`/clubs/${id}/members`),

  // ===== EVENTS =====
  getEvents: (params: any = {}) => apiClient.get<never, AnyData>('/events', { params }),
  getUpcomingEvents: () => apiClient.get<never, AnyData>('/events/upcoming'),
  getEvent: (id: string | number) => apiClient.get<never, AnyData>(`/events/${id}`),
  createEvent: (payload: any) => apiClient.post<never, AnyData>('/events', payload),
  updateEvent: (id: string | number, payload: any) => apiClient.put<never, AnyData>(`/events/${id}`, payload),
  deleteEvent: (id: string | number) => apiClient.delete<never, AnyData>(`/events/${id}`),
  registerEvent: (id: string | number) => apiClient.post<never, AnyData>(`/events/${id}/register`),
  unregisterEvent: (id: string | number) => apiClient.post<never, AnyData>(`/events/${id}/cancel-registration`),
  submitFeedback: (id: string | number, payload: any) => apiClient.post<never, AnyData>(`/events/${id}/feedback`, payload),

  // ===== POSTS =====
  getPosts: (params: any = {}) => apiClient.get<never, AnyData>('/posts', { params }),
  getLatestPosts: () => apiClient.get<never, AnyData>('/posts/latest'),
  getPost: (id: string | number) => apiClient.get<never, AnyData>(`/posts/${id}`),
  createPost: (payload: any) => apiClient.post<never, AnyData>('/posts', payload),
  updatePost: (id: string | number, payload: any) => apiClient.put<never, AnyData>(`/posts/${id}`, payload),
  deletePost: (id: string | number) => apiClient.delete<never, AnyData>(`/posts/${id}`),
  likePost: (id: string | number) => apiClient.post<never, AnyData>(`/posts/${id}/like`),
  aiGeneratePost: (payload: any) => apiClient.post<never, AnyData>('/posts/ai-generate', payload),

  // ===== AI =====
  getAiStatus: () => apiClient.get<never, AnyData>('/ai/status'),
  getRecommendations: () => apiClient.get<never, AnyData>('/ai/recommendations'),
  chatWithAi: (payload: any) => apiClient.post<never, AnyData>('/ai/chat', payload),
  analyzeClub: (payload: any) => apiClient.post<never, AnyData>('/ai/analyze-club', payload),
  analyzeSentiment: (payload: any) => apiClient.post<never, AnyData>('/ai/sentiment', payload),
  extractKeywords: (payload: any) => apiClient.post<never, AnyData>('/ai/extract-keywords', payload),

  // ===== STATS =====
  getOverview: () => apiClient.get<never, AnyData>('/stats/overview'),
  getDashboard: () => apiClient.get<never, AnyData>('/stats/dashboard'),
  getPopularClubs: () => apiClient.get<never, AnyData>('/stats/popular-clubs'),
  getActivity: () => apiClient.get<never, AnyData>('/stats/activity'),

  // ===== MEMBERS =====
  getMemberProfile: (id: string | number) => apiClient.get<never, AnyData>(`/members/${id}`),
  listMembers: (params: any = {}) => apiClient.get<never, AnyData>('/members', { params }),
  updateMyMemberProfile: (payload: any) => apiClient.put<never, AnyData>('/members/me', payload),

  // ===== POLLS =====
  listPolls: (clubId: string | number) => apiClient.get<never, AnyData>(`/clubs/${clubId}/polls`),
  getPoll: (id: string | number) => apiClient.get<never, AnyData>(`/polls/${id}`),
  createPoll: (payload: any) => apiClient.post<never, AnyData>('/polls', payload),
  votePoll: (id: string | number, optionIds: number[]) => apiClient.post<never, AnyData>(`/polls/${id}/vote`, { option_ids: optionIds }),

  // ===== QR =====
  generateCheckinQR: (id: string | number) => apiClient.post<never, AnyData>(`/events/${id}/generate-qr`, {}),
  checkinViaQR: (qrCode: string) => apiClient.post<never, AnyData>('/qr/checkin-event', { qr_code: qrCode }),

  // ===== NOTIFICATIONS =====
  getNotifications: (unreadOnly = false) => apiClient.get<never, AnyData>('/notifications', { params: { unread_only: unreadOnly } }),
  markNotificationRead: (id: string | number) => apiClient.patch<never, AnyData>(`/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.patch<never, AnyData>('/notifications/read-all'),

  // ===== REALTIME =====
  connectRealtime: (userId: string) => {
    return new WebSocket(`ws://localhost:9000/ws/${userId}`);
  },
};