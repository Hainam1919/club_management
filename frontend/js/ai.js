// ============= AI CHAT MODULE =============
const AIChat = {
    sessionId: null,

    init() {
        document.getElementById('aiForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('aiInput');
            const message = input.value.trim();
            if (!message) return;

            input.value = '';
            this.appendMessage('user', message);

            // Tạo bubble cho bot (trống ban đầu)
            const botMsgDiv = this.createMessageBubble('bot');
            const msgBubble = botMsgDiv.querySelector('.ai-msg-bubble');
            const loadingIcon = document.createElement('i');
            loadingIcon.className = 'fa-solid fa-ellipsis fa-bounce';
            msgBubble.appendChild(loadingIcon);

            try {
                const response = await API.chatWithAiStream(message, this.sessionId);

                // Xử lý stream dữ liệu
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullReply = '';

                // Xóa icon loading khi token đầu tiên đến
                let firstToken = true;

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));

                                if (data.type === 'token') {
                                    if (firstToken) {
                                        msgBubble.innerHTML = '';
                                        firstToken = false;
                                    }
                                    fullReply += data.content;
                                    msgBubble.innerHTML = fullReply.replace(/\n/g, '<br>');
                                } else if (data.type === 'thought') {
                                    this.appendThought(data.content);
                                } else if (data.type === 'observation') {
                                    this.appendObservation(data.content);
                                } else if (data.type === 'error') {
                                    showToast(data.content, 'error');
                                } else if (data.type === 'done') {
                                    this.sessionId = data.session_id;
                                    this.renderSuggestions(data.suggestions);
                                }
                            } catch (e) {
                                console.error('Error parsing AI stream chunk:', e);
                            }
                        }
                    }
                }
            } catch (err) {
                msgBubble.innerHTML = '❌ Có lỗi xảy ra khi kết nối với AI.';
                showToast(err.message, 'error');
            }
        });
    },

    createMessageBubble(role) {
        const messages = document.getElementById('aiMessages');
        const div = document.createElement('div');
        div.className = `ai-message ${role}`;
        div.innerHTML = `
            <div class="ai-msg-avatar"><i class="fa-solid fa-${role === 'user' ? 'user' : 'robot'}"></i></div>
            <div class="ai-msg-bubble"></div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        return div;
    },

    appendMessage(role, message) {
        const messages = document.getElementById('aiMessages');
        if (!messages) return;
        const div = this.createMessageBubble(role);
        div.querySelector('.ai-msg-bubble').innerHTML = message.replace(/\n/g, '<br>');
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    },

    appendThought(text) {
        const messages = document.getElementById('aiMessages');
        const div = document.createElement('div');
        div.className = 'ai-thought';
        div.innerHTML = `
            <div class="ai-thought-header"><i class="fa-solid fa-brain"></i> AI đang suy nghĩ...</div>
            <div class="ai-thought-content">${text}</div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    },

    appendObservation(text) {
        const messages = document.getElementById('aiMessages');
        const div = document.createElement('div');
        div.className = 'ai-observation';
        div.innerHTML = `
            <div class="ai-obs-header"><i class="fa-solid fa-magnifying-glass"></i> Tra cứu hệ thống</div>
            <div class="ai-obs-content">${text}</div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    },

    renderSuggestions(suggestions) {
        const container = document.getElementById('aiSuggestions');
        if (!container || !suggestions) return;
        container.innerHTML = suggestions.map(s =>
            `<button class="ai-sug-btn" data-q="${s}">${s}</button>`
        ).join('');
        container.querySelectorAll('.ai-sug-btn').forEach(b => {
            b.addEventListener('click', () => {
                document.getElementById('aiInput').value = b.dataset.q;
                document.getElementById('aiForm').dispatchEvent(new Event('submit'));
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => AIChat.init());

// ============= COMMAND PALETTE SEARCH =============
document.addEventListener('DOMContentLoaded', () => {
    const commandInput = document.getElementById('commandInput');
    const results = document.getElementById('commandResults');

    if (commandInput) {
        let allClubs = [];
        let allEvents = [];
        API.getClubs().then(c => allClubs = c).catch(() => {});
        API.getEvents().then(e => allEvents = e).catch(() => {});

        commandInput.addEventListener('input', async (e) => {
            const q = e.target.value.toLowerCase().trim();
            if (!q) {
                results.innerHTML = `
                    <div class="command-section">
                        <div class="command-section-title">💡 Gợi ý nhanh</div>
                        <div class="command-item" data-page="home"><i class="fa-solid fa-house"></i> Trang chủ</div>
                        <div class="command-item" data-page="clubs"><i class="fa-solid fa-people-group"></i> Tất cả câu lạc bộ</div>
                        <div class="command-item" data-page="events"><i class="fa-solid fa-calendar-star"></i> Sự kiện sắp tới</div>
                        <div class="command-item" data-page="ai-assistant"><i class="fa-solid fa-robot"></i> Hỏi AI Assistant</div>
                        <div class="command-item" data-page="calendar"><i class="fa-solid fa-calendar-days"></i> Lịch sự kiện</div>
                        <div class="command-item" data-page="leaderboard"><i class="fa-solid fa-trophy"></i> Bảng xếp hạng</div>
                    </div>
                `;
                bindCommandItems();
                return;
            }

            const matchedClubs = allClubs.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3);
            const matchedEvents = allEvents.filter(e => e.title.toLowerCase().includes(q)).slice(0, 3);

            results.innerHTML = `
                ${matchedClubs.length ? `
                <div class="command-section">
                    <div class="command-section-title">👥 Câu lạc bộ (${matchedClubs.length})</div>
                    ${matchedClubs.map(c => `
                        <div class="command-item" data-page="club-detail" data-id="${c.id}">
                            <i class="fa-solid fa-people-group"></i>
                            <span>${c.name}</span>
                            <span style="margin-left:auto;font-size:11px;color:var(--text-mute)">${c.member_count} thành viên</span>
                        </div>
                    `).join('')}
                </div>` : ''}
                ${matchedEvents.length ? `
                <div class="command-section">
                    <div class="command-section-title">📅 Sự kiện (${matchedEvents.length})</div>
                    ${matchedEvents.map(e => `
                        <div class="command-item" data-page="event-detail" data-id="${e.id}">
                            <i class="fa-solid fa-calendar-star"></i>
                            <span>${e.title}</span>
                        </div>
                    `).join('')}
                </div>` : ''}
                <div class="command-section" id="globalSearchResults">
                    <div class="command-section-title">🔍 Đang tìm toàn cục...</div>
                </div>
            `;
            bindCommandItems();

            try {
                const result = await API.globalSearch(q);
                const searchDiv = document.getElementById('globalSearchResults');
                if (result.total > 0) {
                    searchDiv.innerHTML = `
                        <div class="command-section-title">🌐 Kết quả toàn cục (${result.total})</div>
                        ${result.members.slice(0, 3).map(m => `
                            <div class="command-item" data-page="member-profile" data-id="${m.id}">
                                <i class="fa-solid fa-user"></i>
                                <span>${m.full_name}</span>
                                <span style="margin-left:auto;font-size:11px;color:var(--text-mute)">${m.student_id || ''}</span>
                            </div>
                        `).join('')}
                        ${result.posts.slice(0, 2).map(p => `
                            <div class="command-item" data-page="post-detail" data-id="${p.id}">
                                <i class="fa-solid fa-newspaper"></i>
                                <span>${p.title}</span>
                            </div>
                        `).join('')}
                    `;
                    bindCommandItems();
                } else {
                    searchDiv.innerHTML = `<div class="command-section-title">🌐 Không có kết quả toàn cục</div>`;
                }
            } catch (e) {}
        });

        function bindCommandItems() {
            results.querySelectorAll('.command-item').forEach(item => {
                item.addEventListener('click', () => {
                    const page = item.dataset.page;
                    const id = item.dataset.id;
                    document.getElementById('commandPalette').hidden = true;
                    document.getElementById('commandInput').value = '';
                    if (id) App.navigate(page, { id: parseInt(id) });
                    else App.navigate(page);
                });
            });
        }
    }
});

// ============= NOTIFICATIONS =============
async function loadNotifications() {
    if (!API.isLoggedIn()) return;
    try {
        const data = await API.getNotifications();
        const notifList = document.getElementById('notificationList');
        if (!notifList) return;

        const notifs = Array.isArray(data) ? data : (data && data.notifications) || [];
        if (notifs.length === 0) {
            notifList.innerHTML = '<div class="notification-empty">Không có thông báo mới</div>';
        } else {
            notifList.innerHTML = notifs.map(n => {
                const time = formatRelativeTime(n.created_at);
                return `
                <div class="notification-item" data-link="${n.link || ''}" data-id="${n.id}">
                    <div class="notification-icon"><i class="fa-solid ${n.icon || 'fa-bell'}"></i></div>
                    <div class="notification-content">
                        <div class="notification-title">${n.title}</div>
                        <div class="notification-time">${n.message || ''} · ${time}</div>
                    </div>
                    ${!n.is_read ? '<div class="notification-unread"></div>' : ''}
                </div>
                `;
            }).join('');

            notifList.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const id = item.dataset.id;
                    const link = item.dataset.link;
                    try { await API.markNotificationRead(id); } catch (e) {}
                    if (link) location.hash = link.replace('/', '');
                    document.getElementById('notificationPanel').hidden = true;
                    loadNotifications();
                });
            });
        }
    } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', () => {
    loadNotifications();
    setInterval(loadNotifications, 30000);

    document.getElementById('markAllRead')?.addEventListener('click', async () => {
        try {
            await API.markAllNotificationsRead();
            showToast('Đã đánh dấu tất cả là đã đọc', 'success');
            loadNotifications();
        } catch (e) { showToast(e.message, 'error'); }
    });
});
