// ============= API CLIENT =============
const API = {
    base: '/api',
    token: localStorage.getItem('token'),

    // Simple in-memory GET cache (30s TTL) to make navigation feel instant
    _cache: {},
    _cacheTTL: 30000,

    clearCache() {
        this._cache = {};
    },

    async request(path, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const method = (options.method || 'GET').toUpperCase();
        const cacheKey = `${method}|${path}`;

        if (method === 'GET' && options.cache !== false) {
            const hit = this._cache[cacheKey];
            if (hit && (Date.now() - hit.ts) < this._cacheTTL) {
                return hit.data;
            }
        }

        try {
            const res = await fetch(`${this.base}${path}`, {
                ...options,
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            if (res.status === 401) {
                this.clearCache();
                this.logout();
                throw new Error('Phiên đăng nhập hết hạn');
            }

            const contentType = res.headers.get('content-type') || '';
            const data = contentType.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok) {
                throw new Error(data.detail || data.message || 'Có lỗi xảy ra');
            }

            if (method === 'GET' && options.cache !== false) {
                this._cache[cacheKey] = { ts: Date.now(), data };
            } else if (method !== 'GET') {
                // A mutation invalidates cached views
                this.clearCache();
            }
            return data;
        } catch (err) {
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                throw new Error('Không thể kết nối đến server');
            }
            throw err;
        }
    },

    get(path) { return this.request(path); },
    post(path, body) { return this.request(path, { method: 'POST', body }); },
    put(path, body) { return this.request(path, { method: 'PUT', body }); },
    patch(path, body) { return this.request(path, { method: 'PATCH', body }); },
    del(path) { return this.request(path, { method: 'DELETE' }); },
    delete(path) { return this.request(path, { method: 'DELETE' }); },

    // ===== AUTH =====
    async login(username, password) {
        const data = await this.post('/auth/login-json', { username, password });
        this.token = data.access_token;
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    async register(payload) {
        const data = await this.post('/auth/register', payload);
        this.token = data.access_token;
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    async getMe() {
        return this.get('/auth/me');
    },

    async updateMe(payload) {
        const user = await this.put('/auth/me', payload);
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    },

    logout() {
        this.token = null;
        this.clearCache();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    },

    getUser() {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    },

    isLoggedIn() { return !!this.token; },

    isAdmin() {
        const u = this.getUser();
        return u && u.role === 'admin';
    },

    // ===== CLUBS =====
    getClubs(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/clubs${q ? '?' + q : ''}`);
    },
    getClub(id) { return this.get(`/clubs/${id}`); },
    getClubBySlug(slug) { return this.get(`/clubs/slug/${slug}`); },
    getFeaturedClubs() { return this.get('/clubs/featured'); },
    getCategories() { return this.get('/clubs/categories'); },
    createClub(payload) { return this.post('/clubs', payload); },
    updateClub(id, payload) { return this.put(`/clubs/${id}`, payload); },
    deleteClub(id) { return this.delete(`/clubs/${id}`); },
    joinClub(id) { return this.post(`/clubs/${id}/join`); },
    leaveClub(id) { return this.post(`/clubs/${id}/leave`); },
    getClubMembers(id) { return this.get(`/clubs/${id}/members`); },

    // ===== EVENTS =====
    getEvents(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/events${q ? '?' + q : ''}`);
    },
    getUpcomingEvents() { return this.get('/events/upcoming'); },
    getEvent(id) { return this.get(`/events/${id}`); },
    createEvent(payload) { return this.post('/events', payload); },
    updateEvent(id, payload) { return this.put(`/events/${id}`, payload); },
    deleteEvent(id) { return this.delete(`/events/${id}`); },
    registerEvent(id) { return this.post(`/events/${id}/register`); },
    unregisterEvent(id) { return this.post(`/events/${id}/cancel-registration`); },
    cancelRegistration(id) { return this.post(`/events/${id}/cancel-registration`); },
    submitFeedback(id, payload) { return this.post(`/events/${id}/feedback`, payload); },
    getEventRegistrations(id) { return this.get(`/events/${id}/registrations`); },
    getEventParticipants(id) { return this.get(`/events/${id}/participants`); },

    // ===== POSTS =====
    getPosts(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/posts${q ? '?' + q : ''}`);
    },
    getLatestPosts() { return this.get('/posts/latest'); },
    getPost(id) { return this.get(`/posts/${id}`); },
    createPost(payload) { return this.post('/posts', payload); },
    updatePost(id, payload) { return this.put(`/posts/${id}`, payload); },
    deletePost(id) { return this.delete(`/posts/${id}`); },
    likePost(id) { return this.post(`/posts/${id}/like`); },
    aiGeneratePost(payload) { return this.post('/posts/ai-generate', payload); },

    // ===== AI =====
    getAiStatus() { return this.get('/ai/status'); },
    getRecommendations() { return this.get('/ai/recommendations'); },
    chatWithAi(message, sessionId = null, context = 'general') {
        return this.post('/ai/chat', { message, session_id: sessionId, context });
    },
    chatWithAiStream(message, sessionId = null, context = 'general') {
        return this.aiChatStream(message, sessionId, context);
    },
    analyzeClub(payload) { return this.post('/ai/analyze-club', payload); },
    analyzeSentiment(text) { return this.post('/ai/sentiment', { text }); },
    getRecommendations() { return this.get('/ai/recommendations'); },
    extractKeywords(text) { return this.post('/ai/extract-keywords', { text }); },

    // ===== STATS =====
    getOverview() { return this.get('/stats/overview'); },
    getDashboard() { return this.get('/stats/dashboard'); },
    getPopularClubs() { return this.get('/stats/popular-clubs'); },
    getActivity() { return this.get('/stats/activity'); },
    getSystemStats() { return this.get('/system-stats'); },

    // ===== MEMBERS =====
    getMemberProfile(id) { return this.get(`/members/${id}`); },
    listMembers(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/members${q ? '?' + q : ''}`);
    },
    updateMyMemberProfile(payload) { return this.put('/members/me', payload); },

    // ===== POLLS =====
    listPolls(clubId) { return this.get(`/clubs/${clubId}/polls`); },
    getPoll(id) { return this.get(`/polls/${id}`); },
    createPoll(payload) { return this.post('/polls', payload); },
    votePoll(id, optionIds) { return this.post(`/polls/${id}/vote`, { option_ids: optionIds }); },

    // ===== EVENTS NÂNG CẤP =====
    getEventRegistrations(id) { return this.get(`/events/${id}/registrations`); },
    getEventCheckinStats(id) { return this.get(`/events/${id}/checkin-stats`); },
    generateCheckinQR(id) { return this.post(`/events/${id}/generate-qr`, {}); },
    rateEvent(id, payload) { return this.post(`/events/${id}/rate`, payload); },
    getEventRatings(id) { return this.get(`/events/${id}/ratings`); },

    // ===== QR =====
    getEventQRImage(id) { return this.get(`/qr/event/${id}`); },
    getMyCheckinQR(id) { return this.get(`/qr/checkin/${id}`); },
    checkinViaQR(qrCode) { return this.post('/qr/checkin-event', { qr_code: qrCode }); },

    // ===== POSTS NÂNG CẤP =====
    getPostFull(id) { return this.get(`/posts/${id}/full`); },

    // ===== CALENDAR =====
    getEventsCalendar(month, year, clubId = null) {
        const params = { month, year };
        if (clubId) params.club_id = clubId;
        return this.get('/calendar/events?' + new URLSearchParams(params).toString());
    },

    // ===== GLOBAL SEARCH =====
    globalSearch(q) { return this.get('/search?q=' + encodeURIComponent(q)); },

    // ===== TIMELINE =====
    myTimeline(days = 30) { return this.get('/my-timeline?days=' + days); },

    // ===== EXPORT =====
    exportClubData(id) { return this.get(`/clubs/${id}/export`); },

    // ===== MESSAGES =====
    getMessages() { return this.get('/messages'); },
    sendMessage(payload) { return this.post('/messages', payload); },
    getConversations() { return this.get('/messages/conversations'); },
    getThread(userId) { return this.get(`/messages/with/${userId}`); },

    // ===== MENTORS =====
    listMentors(clubId) { return this.get('/mentors' + (clubId ? '?club_id=' + clubId : '')); },
    requestMentor(mentorId, clubId) { return this.post('/mentors/request', { mentor_id: mentorId, club_id: clubId }); },

    // ===== DOCUMENTS =====
    listDocuments(clubId) { return this.get(`/clubs/${clubId}/documents`); },
    addDocument(clubId, payload) { return this.post(`/clubs/${clubId}/documents`, payload); },

    // ===== REACTIONS =====
    reactTo(targetType, targetId, reactionType) { return this.post('/react', { target_type: targetType, target_id: targetId, reaction_type: reactionType }); },
    removeReaction(targetType, targetId) { return this.delete(`/react/${targetType}/${targetId}`); },
    getReactions(targetType, targetId) { return this.get(`/reactions/${targetType}/${targetId}`); },

    // ===== FOLLOW =====
    follow(targetType, targetId) { return this.post('/follow', { target_type: targetType, target_id: targetId }); },
    unfollow(targetType, targetId) { return this.del(`/follow/${targetType}/${targetId}`); },
    getFollowing() { return this.get('/following'); },
    getFollowStatus(targetType, targetId) { return this.get(`/follow/status?target_type=${targetType}&target_id=${targetId}`); },

    // ===== TASKS =====
    listTasks(clubId) { return this.get(`/clubs/${clubId}/tasks`); },
    createTask(clubId, payload) { return this.post(`/clubs/${clubId}/tasks`, payload); },
    updateTask(taskId, payload) { return this.put(`/tasks/${taskId}`, payload); },
    deleteTask(taskId) { return this.delete(`/tasks/${taskId}`); },

    // ===== CLUB MANAGE =====
    getClubManageData(clubId) { return this.get(`/clubs/${clubId}/manage`); },

    // ===== EVENT COMMENTS =====
    getEventComments(eventId) { return this.get(`/events/${eventId}/comments`); },
    addEventComment(eventId, content) { return this.post(`/events/${eventId}/comments`, { content }); },

    // ===== ADMIN =====
    adminListUsers(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/admin/users${q ? '?' + q : ''}`);
    },
    adminToggleUserActive(id) { return this.put(`/admin/users/${id}/toggle-active`, {}); },
    adminChangeRole(id, role) { return this.put(`/admin/users/${id}/role`, { role }); },
    adminResetPassword(id, newPassword) { return this.post(`/admin/users/${id}/reset-password`, { new_password: newPassword }); },
    adminAdvancedStats() { return this.get('/admin/stats/advanced'); },

    // ===== UPLOAD =====
    uploadFile(file, targetType, targetId) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('target_type', targetType);
        if (targetId) fd.append('target_id', targetId);
        return fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.token}` },
            body: fd
        }).then(r => r.json());
    },

    // ===== EMAILS =====
    sendEmail(payload) { return this.post('/admin/emails/send', payload); },
    sendBulkEmail(payload) { return this.post('/admin/emails/send-bulk', payload); },
    getEmailLogs() { return this.get('/admin/emails/logs'); },

    // ===== REALTIME =====
    connectRealtime() {
        if (!this.token) return null;
        const userId = this.getUser()?.id;
        if (!userId) return null;
        const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${wsProto}://${window.location.host}/ws/${userId}`);
        return ws;
    },

    // ===== AI ADVANCED =====
    aiGenerateImage(prompt, imageType, style, clubId) { return this.post('/ai-pro/generate-image', { prompt, image_type: imageType, style, club_id: clubId }); },
    listAIImages() { return this.get('/ai-pro/images'); },
    aiAnalyzeProfile(userId) { return this.post('/ai-pro/analyze-profile', { user_id: userId }); },
    aiSmartChat(message, sessionId, contextType, contextId) { return this.post('/ai-pro/smart-chat', { message, session_id: sessionId, context_type: contextType, context_id: contextId }); },
    aiPredictiveInsights() { return this.get('/ai-pro/predictive-insights'); },

    // ===== AI STREAMING =====
    async aiChatStream(message, sessionId = null, context = 'general') {
        const response = await fetch(`${this.base}/ai/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            body: JSON.stringify({ message, session_id: sessionId, context })
        });
        if (!response.ok) throw new Error('Chat stream failed');
        return response;
    },

    // ===== AI MODELS & AGENT STREAMING (AI Studio Pro) =====
    aiGetModelInfo() { return this.get('/ai/model-info'); },

    async aiAgentStream(agent, payload = {}) {
        const map = {
            mentor: 'mentor-plan/stream',
            strategy: 'club-strategy/stream',
            event: 'event-blueprint/stream',
            media: 'media-kit/stream'
        };
        const endpoint = map[agent];
        if (!endpoint) throw new Error('Unknown agent: ' + agent);
        const response = await fetch(`${this.base}/ai-pro/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Agent stream failed');
        return response;
    },

    // ===== AI ADVANCED FUNCTIONS =====
    async streamChat(message, sessionId = null, context = 'general') {
        return this.aiChatStream(message, sessionId, context);
    },

    async getMentorPlan(clubId, topic) {
        return this.aiMentorChat(topic, clubId);
    },

    async getClubStrategy(clubId, goals) {
        return this.aiStrategyAdvice({ club_id: clubId, goals }, null);
    },

    async getEventBlueprint(clubId, eventData) {
        return this.aiEventPlanning(clubId, eventData);
    },

    async getMediaKit(clubId, contentType) {
        return this.aiMediaContent(clubId, contentType);
    },

    async getInsights() {
        return Promise.all([
            this.aiGetPredictions().catch(() => []),
            this.aiGetAnalytics().catch(() => []),
            this.aiGetTrends().catch(() => []),
            this.aiGetRecommendations().catch(() => [])
        ]).then(([predictions, analytics, trends, recommendations]) => ({
            predictions,
            analytics,
            trends,
            recommendations
        }));
    },

    async getLeaderboardData(period = 'month') {
        return this.getLeaderboard(period);
    },

    // ===== AI STUDIO =====
    aiMentorChat(message, clubId = null, sessionId = null) { return this.post('/ai/mentor-chat', { message, club_id: clubId, session_id: sessionId }); },
    aiStrategyAdvice(clubData, sessionId = null) { return this.post('/ai/strategy-advice', { club_data: clubData, session_id: sessionId }); },
    aiEventPlanning(clubId, eventData, sessionId = null) { return this.post('/ai/event-planning', { club_id: clubId, event_data: eventData, session_id: sessionId }); },
    aiMediaContent(clubId, contentType = 'general', sessionId = null) { return this.post('/ai/media-content', { club_id: clubId, content_type: contentType, session_id: sessionId }); },

    // ===== AI INSIGHTS =====
    aiGetPredictions() { return this.get('/ai/predictions'); },
    aiGetAnalytics() { return this.get('/ai/analytics'); },
    aiGetTrends() { return this.get('/ai/trends'); },
    aiGetRecommendations() { return this.get('/ai/recommendations'); },

    // ===== LEADERBOARD =====
    getLeaderboard(period = 'month') { return this.get(`/stats/leaderboard?period=${period}`); },
    getMyRank() { return this.get('/stats/leaderboard/my-rank'); },

    // ===== ANALYTICS =====
    getStatsTrends(days = 30) { return this.get(`/stats/trends?days=${days}`); },
    getStatsCategories() { return this.get('/stats/categories'); },
    getStatsEngagement(days = 30) { return this.get(`/stats/engagement?days=${days}`); },

    // ===== CERTIFICATES =====
    getMyCertificates() { return this.get('/certificates'); },
    issueCertificate(payload) { return this.post('/certificates/issue', payload); },
    verifyCertificate(code) { return this.get(`/certificates/verify/${code}`); },
    getCertificateQR(id) { return this.get(`/certificates/qr/${id}`); },

    // ===== QR SCANNER =====
    validateQR(qrData) { return this.post('/qr/validate', { qr_data: qrData }); },
    checkinViaQR(qrData) { return this.post('/qr/checkin-event', { qr_data: qrData }); },

    // ===== REPORTS =====
    getSchoolReport(period = 'all') { return this.get(`/reports/school?period=${period}`); },
    getClubReport(clubId) { return this.get(`/reports/club/${clubId}`); },

    // ===== EVENT GALLERY =====
    getEventGallery(eventId) { return this.get(`/events/${eventId}/gallery`); },
    uploadEventPhoto(eventId, payload) { return this.post(`/events/${eventId}/gallery`, payload); },
    likeEventPhoto(eventId, photoId) { return this.post(`/events/${eventId}/gallery/${photoId}/like`, {}); },

    // ===== NOTIFICATIONS =====
    getNotifications(unreadOnly = false) { return this.get(`/notifications?unread_only=${unreadOnly}`); },
    markNotificationRead(id) { return this.patch(`/notifications/${id}/read`); },
    markAllNotificationsRead() { return this.patch('/notifications/read-all'); },
    deleteNotification(id) { return this.del(`/notifications/${id}`); },
    getNotificationPreferences() { return this.get('/notification-preferences'); },
    updateNotificationPreferences(payload) { return this.put('/notification-preferences', payload); },

    // ===== COMMENTS =====
    getComments(targetType, targetId) { return this.get(`/comments?target_type=${targetType}&target_id=${targetId}`); },
    createComment(payload) { return this.post('/comments', payload); },
    deleteComment(commentId) { return this.del(`/comments/${commentId}`); },
    likeComment(commentId) { return this.post(`/comments/${commentId}/like`, {}); },

    // ===== UPLOAD =====
    async uploadImage(file, targetType = 'avatar', targetId = null) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('target_type', targetType);
        if (targetId) fd.append('target_id', targetId);
        const headers = { ...(this.token && { Authorization: `Bearer ${this.token}` }) };
        const res = await fetch('/api/upload/image', { method: 'POST', body: fd, headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Upload thất bại');
        return data;
    },
    getMyUploads() { return this.get('/upload/my-uploads'); },

    // ===== GAMIFICATION =====
    getMyPoints() { return this.get('/my-points'); },
    getAchievements() { return this.get('/achievements'); },
    getActivityLog() { return this.get('/activity-log'); }
};

// ============= TOAST =============
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ============= FORMATTERS =============
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    return formatDate(dateStr);
}

function getCategoryEmoji(category, size = 48) {
    // Return AI-generated SVG icon (badge shape với hình thù đặc trưng)
    if (typeof AIIcons !== 'undefined') {
        const icon = AIIcons[category] || AIIcons['default'];
        if (icon) {
            return icon.replace('<svg', `<svg width="${size}" height="${size}" style="display:inline-block;vertical-align:middle;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.1));"`);
        }
    }
    return '';
}

function getCategoryClass(category) {
    const map = {
        'Học thuật': 'cat-1',
        'Thể thao': 'cat-2',
        'Văn nghệ': 'cat-3',
        'Tình nguyện': 'cat-4',
        'Kỹ năng': 'cat-1',
        'Truyền thông': 'cat-3'
    };
    return map[category] || 'cat-1';
}

function getCategoryIcon(category) {
    const map = {
        'Học thuật': 'fa-graduation-cap',
        'Thể thao': 'fa-futbol',
        'Văn nghệ': 'fa-palette',
        'Tình nguyện': 'fa-hand-holding-heart',
        'Kỹ năng': 'fa-lightbulb',
        'Truyền thông': 'fa-bullhorn'
    };
    return map[category] || 'fa-users';
}

// Helper: debounce
function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
