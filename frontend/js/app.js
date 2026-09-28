// ============= APP CONTROLLER =============
const App = {
    currentPage: 'home',
    user: null,

    init() {
        this.user = API.getUser();
        this.renderNavActions();
        this.bindEvents();
        this.routeFromHash();
        this.connectRealtime();
        window.addEventListener('hashchange', () => this.routeFromHash());
    },

    connectRealtime() {
        if (!API.isLoggedIn()) return;
        try {
            const ws = API.connectRealtime();
            if (!ws) return;

            this.ws = ws;

            ws.onopen = () => {
                console.log('🟢 Real-time connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'notification') {
                        showToast(data.message, 'info');
                        // Refresh notifications nếu panel mở
                        if (typeof loadNotifications === 'function') loadNotifications();
                    }
                } catch (e) {}
            };

            ws.onerror = () => {};
            ws.onclose = () => {
                // Reconnect sau 5s
                setTimeout(() => this.connectRealtime(), 5000);
            };
        } catch (e) {
            console.log('WebSocket not available');
        }
    },

    bindEvents() {
        document.querySelectorAll('[data-page]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(el.dataset.page);
            });
        });

        document.getElementById('navToggle')?.addEventListener('click', () => {
            document.getElementById('navMenu')?.classList.toggle('open');
        });

        // Nav More dropdown
        document.getElementById('navMoreBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('navMoreMenu')?.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-more-dropdown')) {
                document.getElementById('navMoreMenu')?.classList.remove('active');
            }
        });

        // AI Modal
        document.getElementById('aiFab')?.addEventListener('click', () => this.toggleAIModal(true));
        document.getElementById('aiClose')?.addEventListener('click', () => this.toggleAIModal(false));

        // AI suggestions
        document.querySelectorAll('.ai-sug-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('aiInput').value = btn.dataset.q;
                document.getElementById('aiForm').dispatchEvent(new Event('submit'));
            });
        });

        // Command Palette (Cmd/Ctrl + K)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleCommandPalette(true);
            }
            if (e.key === 'Escape') {
                this.toggleCommandPalette(false);
            }
        });

        document.getElementById('navSearch')?.addEventListener('click', () => {
            this.toggleCommandPalette(true);
        });

        document.querySelector('.command-overlay')?.addEventListener('click', () => {
            this.toggleCommandPalette(false);
        });

        // Dark mode
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            const icon = document.querySelector('#themeToggle i');
            if (icon) icon.className = next === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        });

        // Notifications
        document.getElementById('notifBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const panel = document.getElementById('notificationPanel');
            panel.hidden = !panel.hidden;
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-panel') && !e.target.closest('#notifBtn')) {
                document.getElementById('notificationPanel').hidden = true;
            }
        });
    },

    toggleCommandPalette(show) {
        const palette = document.getElementById('commandPalette');
        if (show) {
            palette.hidden = false;
            setTimeout(() => document.getElementById('commandInput')?.focus(), 50);
        } else {
            palette.hidden = true;
        }
    },

    routeFromHash() {
        const hash = location.hash.replace('#', '') || 'home';
        // navigate() tự đặt hash -> hashchange bắn lại navigate() không có
        // params (mất id). Giữ guard cho tới khi hash thực sự khác để an toàn
        // cả khi trình duyệt bắn nhiều sự kiện hashchange liên tiếp.
        if (this._hashGuard === hash) return;
        this._hashGuard = null;
        this.navigate(hash);
    },

    async navigate(page, params = {}) {
        this.currentPage = page;
        this._hashGuard = page;
        location.hash = page;
        document.body.classList.toggle('is-home', page === 'home');
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.dataset.page === page);
        });
        document.getElementById('navMenu')?.classList.remove('open');

        const main = document.getElementById('mainContent');
        // Modern skeleton loading
        main.innerHTML = `
            <div class="loading stagger page-skeleton">
                <div class="skeleton skeleton-card" style="width:100%;max-width:1200px;margin:0 auto"></div>
                <div class="skeleton skeleton-text" style="width:100%;max-width:1200px;margin:20px auto"></div>
                <div class="skeleton skeleton-text" style="width:60% ;max-width:1200px;margin:0 auto"></div>
            </div>`;

        const skeleton = main.firstElementChild;

        // Render vào cây DOM thật ngay từ đầu: các handler gắn bằng
        // document.getElementById/querySelector trong Pages.* chỉ hoạt động
        // khi phần tử đã nằm trong document (node rời sẽ không tìm thấy).
        const contentContainer = document.createElement('div');
        contentContainer.className = 'animate-slide-up';
        const tempDiv = document.createElement('div');
        contentContainer.appendChild(tempDiv);
        main.appendChild(contentContainer);

        try {
            switch (page) {
                case 'home': await Pages.renderHome(tempDiv); break;
                case 'clubs': await Pages.renderClubs(tempDiv, params); break;
                case 'club-detail': await Pages.renderClubDetail(tempDiv, params.id); break;
                case 'events': await Pages.renderEvents(tempDiv, params); break;
                case 'event-detail': await Pages.renderEventDetail(tempDiv, params.id); break;
                case 'posts': await Pages.renderPosts(tempDiv, params); break;
                case 'members': await Pages.renderMembers(tempDiv, params); break;
                case 'ai-assistant': await AIPages.renderAIAssistant(tempDiv); break;
                case 'ai-insights': await AIPages.renderAIInsights(tempDiv); break;
                case 'ai-studio': await AIPages.renderAIStudio(tempDiv); break;
                case 'leaderboard': await AIPages.renderLeaderboard(tempDiv); break;
                case 'admin': await Pages.renderAdmin(tempDiv); break;
                case 'about': await Pages.renderAbout(tempDiv); break;
                case 'profile': await Pages.renderProfile(tempDiv); break;
                case 'member-profile': await Pages.renderMemberProfile(tempDiv, params.id); break;
                case 'post-detail': await Pages.renderPostDetail(tempDiv, params.id); break;
                case 'calendar': await Pages.renderCalendar(tempDiv, params); break;
                case 'timeline': await Pages.renderTimeline(tempDiv); break;
                case 'polls': await Pages.renderPolls(tempDiv, params); break;
                case 'messages': await Pages.renderMessages(tempDiv, params); break;
                case 'club-manage': await Pages.renderClubManage(tempDiv, params.id); break;
                case 'settings': await Pages.renderSettings(tempDiv); break;
                case 'admin-users': await Pages.renderAdminUsers(tempDiv); break;
                case 'certificates': await Pages.renderCertificates(tempDiv); break;
                case 'qr-scanner': await Pages.renderQRScanner(tempDiv); break;
                case 'reports': await Pages.renderReports(tempDiv); break;
                case 'dashboard': await Pages.renderDashboard(tempDiv); break;
                case 'login': await Pages.renderLogin(tempDiv); break;
                case 'register': await Pages.renderRegister(tempDiv); break;
                case 'create-club': await Pages.renderCreateClub(tempDiv); break;
                case 'create-event': await Pages.renderCreateEvent(tempDiv); break;
                case 'create-post': await Pages.renderCreatePost(tempDiv); break;
                default: await Pages.renderHome(tempDiv);
            }

            skeleton?.remove();
        } catch (err) {
            console.error(err);
            skeleton?.remove();
            main.innerHTML = `<div class="empty"><i class="fa-solid fa-triangle-exclamation"></i><h3>Lỗi</h3><p>${err.message}</p></div>`;
        }
        window.scrollTo(0, 0);
    },

    renderNavActions() {
        const el = document.getElementById('navActions');
        if (!el) return;

        if (this.user) {
            const initials = (this.user.full_name || this.user.username).split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
            el.innerHTML = `
                <button class="theme-toggle" id="themeToggle" data-tooltip="Đổi theme">
                    <i class="fa-solid fa-moon"></i>
                </button>
                <button class="nav-link" id="notifBtn" data-tooltip="Thông báo" style="position:relative">
                    <i class="fa-solid fa-bell"></i>
                    <span style="position:absolute;top:6px;right:6px;width:8px;height:8px;background:var(--danger);border-radius:50%;box-shadow:0 0 0 2px var(--surface)"></span>
                </button>
                <a class="nav-link" data-page="ai-assistant" data-tooltip="AI Assistant">
                    <i class="fa-solid fa-robot"></i>
                </a>
                <div class="user-menu" style="position:relative">
                    <button class="user-avatar btn-primary" id="userMenuBtn" style="width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;border:none;cursor:pointer">
                        ${initials}
                    </button>
                    <div class="user-dropdown glass" id="userDropdown" hidden style="position:absolute;top:50px;right:0;border-radius:var(--radius);box-shadow:var(--shadow-lg);border:1px solid var(--border);min-width:220px;padding:8px;z-index:200">
                        <div style="padding:12px;border-bottom:1px solid var(--border-soft);margin-bottom:8px">
                            <div style="font-weight:700">${this.user.full_name}</div>
                            <div style="font-size:12px;color:var(--text-mute)">@${this.user.username}</div>
                            <div style="margin-top:8px">
                                <span class="badge ${this.user.role === 'admin' ? 'badge-danger' : this.user.role === 'leader' ? 'badge-warning' : 'badge-primary'}">${this.user.role === 'admin' ? '👑 Admin' : this.user.role === 'leader' ? '⭐ Chủ nhiệm' : 'Sinh viên'}</span>
                            </div>
                        </div>
                        <a class="dropdown-item" data-page="profile" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;font-size:14px;color:var(--text);text-decoration:none;cursor:pointer">
                            <i class="fa-solid fa-user"></i> Hồ sơ cá nhân
                        </a>
                        <a class="dropdown-item" data-page="dashboard" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;font-size:14px;color:var(--text);text-decoration:none;cursor:pointer">
                            <i class="fa-solid fa-gauge-high"></i> Dashboard
                        </a>
                        ${API.isAdmin() ? `
                        <a class="dropdown-item" data-page="admin" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;font-size:14px;color:var(--text);text-decoration:none;cursor:pointer">
                            <i class="fa-solid fa-shield"></i> Quản trị
                        </a>
                        <a class="dropdown-item" data-page="create-club" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;font-size:14px;color:var(--text);text-decoration:none;cursor:pointer">
                            <i class="fa-solid fa-plus"></i> Tạo CLB
                        </a>` : ''}
                        <button id="logoutBtn" style="width:100%;display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;font-size:14px;color:var(--danger);text-align:left;margin-top:4px;border:none;background:none;cursor:pointer">
                            <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('userMenuBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                const dd = document.getElementById('userDropdown');
                dd.hidden = !dd.hidden;
            });
            document.getElementById('logoutBtn').addEventListener('click', () => {
                if (confirm('Đăng xuất khỏi hệ thống?')) API.logout();
            });
            document.querySelectorAll('.dropdown-item').forEach(d => {
                d.addEventListener('click', () => {
                    document.getElementById('userDropdown').hidden = true;
                    this.navigate(d.dataset.page);
                });
            });
            document.addEventListener('click', () => {
                const dd = document.getElementById('userDropdown');
                if (dd) dd.hidden = true;
            });
        } else {
            el.innerHTML = `
                <button class="theme-toggle" id="themeToggle" data-tooltip="Đổi theme">
                    <i class="fa-solid fa-moon"></i>
                </button>
                <a class="btn btn-ghost" data-page="login">Đăng nhập</a>
                <a class="btn btn-primary" data-page="register">
                    <i class="fa-solid fa-rocket"></i> Đăng ký
                </a>
            `;
            el.querySelectorAll('[data-page]').forEach(l => {
                l.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigate(l.dataset.page);
                });
            });
        }
    },

    toggleAIModal(show) {
        const modal = document.getElementById('aiModal');
        if (show) {
            modal.hidden = false;
            setTimeout(() => document.getElementById('aiInput')?.focus(), 100);
        } else {
            modal.hidden = true;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
