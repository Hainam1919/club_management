// ============= PAGES =============
const Pages = {

    // ============= HOME =============
    async renderHome(main) {
        const [overview, featured, upcoming, latestPosts, popularClubs, activity, recommendations] = await Promise.all([
            API.getOverview(),
            API.getFeaturedClubs(),
            API.getUpcomingEvents(),
            API.getLatestPosts(),
            API.getPopularClubs(),
            API.getActivity(),
            API.isLoggedIn() ? API.getRecommendations().catch(() => []) : Promise.resolve([])
        ]);

        main.innerHTML = `
            <!-- HERO -->
            <section class="hero">
                <div class="hero-particles">
                    <div class="hero-particle"></div><div class="hero-particle"></div>
                    <div class="hero-particle"></div><div class="hero-particle"></div>
                    <div class="hero-particle"></div><div class="hero-particle"></div>
                    <div class="hero-particle"></div><div class="hero-particle"></div>
                    <div class="hero-particle"></div><div class="hero-particle"></div>
                    <div class="hero-particle"></div><div class="hero-particle"></div>
                    <div class="hero-particle"></div><div class="hero-particle"></div>
                </div>
                <div class="container">
                    <div class="hero-grid">
                        <!-- Left: Content -->
                        <div class="hero-content">
                            <div class="hero-badge">
                                <span class="pulse"></span>
                                <i class="fa-solid fa-sparkles" style="font-size:12px"></i>
                                Tích hợp AI · Công nghệ mới nhất 2026
                            </div>
                            <h1>Quản lý Câu lạc bộ <br><span class="gradient-text">Sinh viên thông minh</span></h1>
                            <p>Nền tảng kết nối sinh viên ICTU với các CLB, sự kiện, mentor và cơ hội phát triển bản thân. Tất cả trong một hệ thống thống nhất.</p>

                            <!-- Search Box nổi bật -->
                            <div class="hero-search">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="text" id="heroSearchInput" placeholder="Tìm CLB, sự kiện, thành viên...">
                                <kbd class="hero-search-kbd">⌘ K</kbd>
                                <button id="heroSearchBtn">Tìm</button>
                            </div>
                            <div class="hero-search-results" id="heroSearchResults"></div>

                            <div class="hero-actions">
                                <a class="btn btn-primary btn-lg" data-page="clubs">
                                    <i class="fa-solid fa-compass"></i> Khám phá CLB
                                    <i class="fa-solid fa-arrow-right" style="font-size:0.85em;opacity:0.85;margin-left:4px"></i>
                                </a>
                                <a class="btn btn-secondary btn-lg" data-page="ai-assistant">
                                    <i class="fa-solid fa-robot"></i> Hỏi AI
                                </a>
                            </div>

                            <div class="hero-trust">
                                <div class="hero-trust-item">
                                    <i class="fa-solid fa-check-circle" style="color:#10b981"></i>
                                    <span>Miễn phí</span>
                                </div>
                                <div class="hero-trust-item">
                                    <i class="fa-solid fa-check-circle" style="color:#10b981"></i>
                                    <span>Không quảng cáo</span>
                                </div>
                                <div class="hero-trust-item">
                                    <i class="fa-solid fa-check-circle" style="color:#10b981"></i>
                                    <span>AI tích hợp</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Visual mockup -->
                        <div class="hero-visual">
                            <!-- Floating card 1: Stats -->
                            <div class="float-card float-card-1">
                                <div class="float-card-icon" style="background:linear-gradient(135deg,#667eea,#764ba2)">
                                    <i class="fa-solid fa-people-group"></i>
                                </div>
                                <div>
                                    <div style="font-size:24px;font-weight:800">${overview.total_clubs}+</div>
                                    <div style="font-size:12px;opacity:0.7">Câu lạc bộ</div>
                                </div>
                            </div>
                            <!-- Floating card 2: AI -->
                            <div class="float-card float-card-2">
                                <div class="float-card-icon" style="background:linear-gradient(135deg,#ec4899,#f43f5e)">
                                    <i class="fa-solid fa-sparkles"></i>
                                </div>
                                <div>
                                    <div style="font-size:14px;font-weight:600">AI đang phân tích...</div>
                                    <div style="font-size:12px;opacity:0.7">Gợi ý CLB cho bạn</div>
                                </div>
                            </div>
                            <!-- Main mockup card: Chat -->
                            <div class="hero-mockup">
                                <div class="mockup-header">
                                    <div class="mockup-dots">
                                        <span style="background:#ef4444"></span>
                                        <span style="background:#f59e0b"></span>
                                        <span style="background:#10b981"></span>
                                    </div>
                                    <div style="font-size:12px;opacity:0.7">AI Assistant</div>
                                </div>
                                <div class="mockup-body">
                                    <div class="mockup-msg mockup-user">
                                        <i class="fa-solid fa-user-graduate"></i>
                                        <div>Tôi nên tham gia CLB nào?</div>
                                    </div>
                                    <div class="mockup-msg mockup-ai">
                                        <i class="fa-solid fa-robot"></i>
                                        <div>Dựa trên sở thích của bạn, mình gợi ý <strong>CLB Lập trình</strong> và <strong>CLB Tiếng Anh</strong> nhé! 🚀</div>
                                    </div>
                                    <div class="mockup-typing">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                            <!-- Floating card 3: Event -->
                            <div class="float-card float-card-3">
                                <div class="float-card-icon" style="background:linear-gradient(135deg,#43e97b,#38f9d7)">
                                    <i class="fa-solid fa-calendar-check"></i>
                                </div>
                                <div>
                                    <div style="font-size:14px;font-weight:600">${overview.upcoming_events} sự kiện sắp tới</div>
                                    <div style="font-size:12px;opacity:0.7">Đăng ký ngay</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stats row -->
                    <div class="hero-stats">
                        <div class="hero-stat">
                            <div class="hero-stat-icon"><i class="fa-solid fa-people-group"></i></div>
                            <div>
                                <div class="hero-stat-num">${overview.total_clubs}+</div>
                                <div class="hero-stat-label">Câu lạc bộ</div>
                            </div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-icon"><i class="fa-solid fa-user-graduate"></i></div>
                            <div>
                                <div class="hero-stat-num">${overview.total_users}+</div>
                                <div class="hero-stat-label">Sinh viên</div>
                            </div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-icon"><i class="fa-solid fa-calendar-check"></i></div>
                            <div>
                                <div class="hero-stat-num">${overview.total_events}+</div>
                                <div class="hero-stat-label">Sự kiện</div>
                            </div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-icon"><i class="fa-solid fa-bolt"></i></div>
                            <div>
                                <div class="hero-stat-num">${overview.total_memberships}+</div>
                                <div class="hero-stat-label">Lượt tham gia</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- QUICK STATS -->
            <section class="section" style="padding:60px 0">
                <div class="container">
                    <div class="grid grid-4">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fa-solid fa-people-group"></i></div>
                            <div class="stat-info">
                                <h3>${overview.total_clubs}</h3>
                                <p>Câu lạc bộ</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon green"><i class="fa-solid fa-user-graduate"></i></div>
                            <div class="stat-info">
                                <h3>${overview.total_users}</h3>
                                <p>Sinh viên</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon pink"><i class="fa-solid fa-calendar-check"></i></div>
                            <div class="stat-info">
                                <h3>${overview.total_events}</h3>
                                <p>Sự kiện đã tổ chức</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon blue"><i class="fa-solid fa-rocket"></i></div>
                            <div class="stat-info">
                                <h3>${overview.upcoming_events}</h3>
                                <p>Sự kiện sắp tới</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            ${API.isLoggedIn() && recommendations.length ? `
            <!-- AI RECOMMENDATIONS -->
            <section class="section" style="background:var(--bg-soft);padding:40px 0">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow" style="background:linear-gradient(135deg, #a855f7, #ec4899);color:white">✨ AI Gợi ý</span>
                        <h2 class="section-title">Dành riêng cho bạn</h2>
                        <p class="section-subtitle">AI phân tích sở thích & hoạt động để gợi ý CLB phù hợp</p>
                    </div>
                    <div class="grid grid-3">
                        ${recommendations.slice(0, 6).map(c => `
                        <div class="card" style="cursor:pointer" data-page="club-detail" data-id="${c.id}">
                            <div style="width:100%;height:140px;background:var(--gradient-1);border-radius:12px;display:grid;place-items:center;font-size:56px;margin-bottom:12px;position:relative">
                                ${getAIIcon ? getAIIcon(c.category, 80) : '🎯'}
                                <div style="position:absolute;top:8px;right:8px;background:linear-gradient(135deg, #a855f7, #ec4899);color:white;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700">
                                    <i class="fa-solid fa-sparkles"></i> ${Math.round(c.score || c.match_score || 0)}%
                                </div>
                            </div>
                            <h3 style="margin-bottom:6px">${this._escapeHtml(c.name || c.club_name || '')}</h3>
                            <p style="color:var(--text-mute);font-size:13px;margin-bottom:8px">${this._escapeHtml(c.reason || c.description || '').slice(0, 80)}</p>
                            <div style="font-size:12px;color:var(--text-mute)">
                                <i class="fa-solid fa-users"></i> ${c.member_count || 0} thành viên
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </section>` : ''}
            </section>

            <!-- FEATURES -->
            <section class="section" style="background:var(--bg-soft)">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow">Tính năng nổi bật</span>
                        <h2 class="section-title">Mạnh mẽ · Thông minh · Toàn diện</h2>
                        <p class="section-subtitle">Hệ thống tích hợp công nghệ AI tiên tiến, mang đến trải nghiệm quản lý CLB hiện đại</p>
                    </div>
                    <div class="grid grid-3 stagger">
                        <div class="card">
                            <div class="stat-icon"><i class="fa-solid fa-robot"></i></div>
                            <h3 style="margin-top:16px">Trợ lý AI 24/7</h3>
                            <p style="color:var(--text-mute);font-size:14px;margin-top:8px">Trò chuyện với AI để được tư vấn CLB, sự kiện phù hợp sở thích cá nhân.</p>
                        </div>
                        <div class="card">
                            <div class="stat-icon pink"><i class="fa-solid fa-chart-line"></i></div>
                            <h3 style="margin-top:16px">Phân tích & Dự đoán</h3>
                            <p style="color:var(--text-mute);font-size:14px;margin-top:8px">AI dự đoán xu hướng CLB, phân tích cảm xúc, đánh giá tự động.</p>
                        </div>
                        <div class="card">
                            <div class="stat-icon blue"><i class="fa-solid fa-people-arrows"></i></div>
                            <h3 style="margin-top:16px">Matching thông minh</h3>
                            <p style="color:var(--text-mute);font-size:14px;margin-top:8px">Kết nối sinh viên cùng sở thích, mentor-mentee phù hợp.</p>
                        </div>
                        <div class="card">
                            <div class="stat-icon green"><i class="fa-solid fa-file-lines"></i></div>
                            <h3 style="margin-top:16px">Báo cáo tự động</h3>
                            <p style="color:var(--text-mute);font-size:14px;margin-top:8px">AI sinh báo cáo tổng kết CLB chuyên nghiệp trong vài giây.</p>
                        </div>
                        <div class="card">
                            <div class="stat-icon"><i class="fa-solid fa-shield-halved"></i></div>
                            <h3 style="margin-top:16px">Bảo mật cao</h3>
                            <p style="color:var(--text-mute);font-size:14px;margin-top:8px">JWT + Bcrypt, phân quyền admin/leader/member chi tiết.</p>
                        </div>
                        <div class="card">
                            <div class="stat-icon pink"><i class="fa-solid fa-chart-pie"></i></div>
                            <h3 style="margin-top:16px">Admin Dashboard</h3>
                            <p style="color:var(--text-mute);font-size:14px;margin-top:8px">Biểu đồ trực quan, thống kê real-time, quản lý toàn trường.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- CATEGORIES -->
            <section class="section">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow">Danh mục</span>
                        <h2 class="section-title">Khám phá theo lĩnh vực</h2>
                    </div>
                    <div class="grid grid-3">
                        <div class="card" onclick="App.navigate('clubs',{category:'Học thuật'})" style="cursor:pointer;text-align:center">
                            <div style="font-size:64px;margin-bottom:12px">📚</div>
                            <h3>Học thuật</h3>
                            <p style="color:var(--text-mute);font-size:13px;margin-top:8px">Lập trình, Robotics, Nghiên cứu</p>
                        </div>
                        <div class="card" onclick="App.navigate('clubs',{category:'Thể thao'})" style="cursor:pointer;text-align:center">
                            <div style="font-size:64px;margin-bottom:12px">⚽</div>
                            <h3>Thể thao</h3>
                            <p style="color:var(--text-mute);font-size:13px;margin-top:8px">Bóng đá, Bóng rổ, Yoga</p>
                        </div>
                        <div class="card" onclick="App.navigate('clubs',{category:'Văn nghệ'})" style="cursor:pointer;text-align:center">
                            <div style="font-size:64px;margin-bottom:12px">🎭</div>
                            <h3>Văn nghệ</h3>
                            <p style="color:var(--text-mute);font-size:13px;margin-top:8px">Ca hát, Nhảy, Nhiếp ảnh</p>
                        </div>
                        <div class="card" onclick="App.navigate('clubs',{category:'Tình nguyện'})" style="cursor:pointer;text-align:center">
                            <div style="font-size:64px;margin-bottom:12px">❤️</div>
                            <h3>Tình nguyện</h3>
                            <p style="color:var(--text-mute);font-size:13px;margin-top:8px">Hiến máu, Môi trường, Xã hội</p>
                        </div>
                        <div class="card" onclick="App.navigate('clubs',{category:'Kỹ năng'})" style="cursor:pointer;text-align:center">
                            <div style="font-size:64px;margin-bottom:12px">🎯</div>
                            <h3>Kỹ năng</h3>
                            <p style="color:var(--text-mute);font-size:13px;margin-top:8px">Marketing, Startup, Kỹ năng mềm</p>
                        </div>
                        <div class="card" onclick="App.navigate('clubs',{category:'Truyền thông'})" style="cursor:pointer;text-align:center">
                            <div style="font-size:64px;margin-bottom:12px">📢</div>
                            <h3>Truyền thông</h3>
                            <p style="color:var(--text-mute);font-size:13px;margin-top:8px">MC, Báo chí, Media</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- FEATURED CLUBS -->
            <section class="section" style="background:#fff">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow">Câu lạc bộ nổi bật</span>
                        <h2 class="section-title">Top CLB được yêu thích nhất</h2>
                    </div>
                    <div class="grid grid-3 stagger">
                        ${featured.slice(0, 6).map(c => this.clubCard(c)).join('')}
                    </div>
                    <div style="text-align:center;margin-top:32px">
                        <a class="btn btn-secondary btn-lg" data-page="clubs">
                            Xem tất cả <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </section>

            <!-- UPCOMING EVENTS -->
            <section class="section">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow">Sắp diễn ra</span>
                        <h2 class="section-title">Sự kiện nổi bật sắp tới</h2>
                    </div>
                    <div class="grid grid-3">
                        ${upcoming.slice(0, 6).map(e => this.eventCard(e)).join('') || '<p class="empty" style="grid-column:1/-1">Chưa có sự kiện nào</p>'}
                    </div>
                    <div style="text-align:center;margin-top:32px">
                        <a class="btn btn-secondary btn-lg" data-page="events">
                            Xem tất cả sự kiện <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </section>

            <!-- LATEST POSTS -->
            <section class="section" style="background:var(--bg-soft)">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow">Tin mới nhất</span>
                        <h2 class="section-title">Bảng tin Câu lạc bộ</h2>
                    </div>
                    <div style="max-width:800px;margin:0 auto">
                        ${latestPosts.slice(0, 5).map(p => this.postCard(p)).join('')}
                    </div>
                    <div style="text-align:center;margin-top:32px">
                        <a class="btn btn-secondary btn-lg" data-page="posts">
                            Xem tất cả tin tức <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </section>

            <!-- AI CTA -->
            <section class="section" style="background:var(--gradient-hero);color:white">
                <div class="container" style="text-align:center">
                    <span class="hero-badge"><span class="pulse"></span> AI đang chờ bạn</span>
                    <h2 class="section-title" style="color:white;margin-top:16px">Trợ lý AI thông minh<br>Luôn sẵn sàng hỗ trợ</h2>
                    <p class="section-subtitle" style="color:rgba(255,255,255,0.8);margin-bottom:32px">Hỏi bất cứ điều gì về CLB, sự kiện, hoạt động sinh viên. AI sẽ tư vấn cho bạn 24/7.</p>
                    <a class="btn btn-primary btn-lg" data-page="ai-assistant" style="background:white;color:var(--primary)">
                        <i class="fa-solid fa-comments"></i> Trò chuyện với AI
                    </a>
                </div>
            </section>
        `;
        this.bindDataPageLinks(main);
        this.bindHeroSearch(main);
    },

    bindHeroSearch(main) {
        const input = main.querySelector('#heroSearchInput');
        const btn = main.querySelector('#heroSearchBtn');
        const results = main.querySelector('#heroSearchResults');
        if (!input) return;

        const performSearch = async (q) => {
            q = q.trim();
            if (!q) { results.classList.remove('active'); results.innerHTML = ''; return; }

            results.innerHTML = '<div style="padding:20px;text-align:center"><div class="spinner" style="display:inline-block"></div></div>';
            results.classList.add('active');

            try {
                const data = await API.globalSearch(q);
                let html = '';
                const iconMap = {
                    'clubs': 'fa-people-group',
                    'events': 'fa-calendar-star',
                    'members': 'fa-user',
                    'posts': 'fa-newspaper'
                };
                const colorMap = {
                    'clubs': 'var(--primary)',
                    'events': 'var(--secondary)',
                    'members': 'var(--accent)',
                    'posts': 'var(--warning)'
                };

                if (data.total === 0) {
                    html = `<div style="padding:32px;text-align:center;color:var(--text-mute)">
                        <i class="fa-solid fa-search" style="font-size:32px;opacity:0.3"></i>
                        <p style="margin-top:12px">Không tìm thấy kết quả cho "<strong>${q}</strong>"</p>
                    </div>`;
                } else {
                    const sections = [
                        { key: 'clubs', label: 'Câu lạc bộ', page: 'club-detail' },
                        { key: 'events', label: 'Sự kiện', page: 'event-detail' },
                        { key: 'members', label: 'Sinh viên', page: 'member-profile' },
                        { key: 'posts', label: 'Bài viết', page: 'post-detail' }
                    ];
                    sections.forEach(s => {
                        if (data[s.key].length > 0) {
                            html += `<div style="padding:8px 16px;font-size:11px;text-transform:uppercase;color:var(--text-mute);font-weight:700;background:var(--bg-soft)">${s.label} (${data[s.key].length})</div>`;
                            data[s.key].slice(0, 4).forEach(item => {
                                const icon = iconMap[s.key];
                                const color = colorMap[s.key];
                                const title = item.name || item.title || item.full_name;
                                const sub = item.category || item.location || item.faculty || item.student_id || '';
                                html += `<div class="hero-search-result" onclick="App.navigate('${s.page}',{id:${item.id}});document.getElementById('heroSearchInput').value='';document.getElementById('heroSearchResults').classList.remove('active')">
                                    <div class="hero-search-result-icon" style="background:${color}"><i class="fa-solid ${icon}"></i></div>
                                    <div class="hero-search-result-info">
                                        <div class="hero-search-result-title">${title}</div>
                                        <div class="hero-search-result-sub">${sub}</div>
                                    </div>
                                    <i class="fa-solid fa-arrow-right" style="color:var(--text-mute)"></i>
                                </div>`;
                            });
                        }
                    });
                }

                results.innerHTML = html;
            } catch (e) {
                results.innerHTML = `<div style="padding:16px;color:var(--danger)">Lỗi: ${e.message}</div>`;
            }
        };

        // Debounce input
        let timer;
        input.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => performSearch(input.value), 300);
        });

        // Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch(input.value);
        });

        // Button click
        btn.addEventListener('click', () => performSearch(input.value));

        // Close on outside click (chỉ gắn 1 lần toàn cục để không chồng listener)
        if (!window.__heroSearchDocBound) {
            window.__heroSearchDocBound = true;
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.hero-search') && !e.target.closest('.hero-search-results')) {
                    document.querySelectorAll('.hero-search-results.active').forEach(r => r.classList.remove('active'));
                }
            });
        }
    },

    // ============= CLUBS LIST =============
    async renderClubs(main, params = {}) {
        const [rawClubs, categories] = await Promise.all([
            API.getClubs(params),
            API.getCategories()
        ]);
        // Client-side sort
        const sort = params.sort || 'members';
        const clubs = [...rawClubs].sort((a, b) => {
            if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
            if (sort === 'newest') return new Date(b.founded_date || 0) - new Date(a.founded_date || 0);
            return (b.member_count || 0) - (a.member_count || 0);
        });
        // Client-side search
        const searchQ = (params.q || '').toLowerCase().trim();
        const filtered = searchQ
            ? clubs.filter(c => (c.name || '').toLowerCase().includes(searchQ) || (c.description || '').toLowerCase().includes(searchQ))
            : clubs;

        main.innerHTML = `
            <section class="section">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow">Khám phá</span>
                        <h2 class="section-title">Tất cả câu lạc bộ</h2>
                        <p class="section-subtitle">${searchQ ? `Tìm thấy ${filtered.length}` : `Có ${filtered.length}`} câu lạc bộ${searchQ ? ` cho "${this._escapeHtml(searchQ)}"` : ' đang hoạt động'}</p>
                    </div>

                    <div style="display:flex;gap:8px;max-width:600px;margin:0 auto 16px">
                        <input type="text" class="form-input" id="clubSearchInput" placeholder="🔍 Tìm CLB theo tên..." value="${this._escapeHtml(params.q || '')}" style="flex:1">
                        <select id="clubSortSelect" class="form-input" style="max-width:180px">
                            <option value="name" ${params.sort === 'name' ? 'selected' : ''}>Tên A-Z</option>
                            <option value="members" ${params.sort === 'members' || !params.sort ? 'selected' : ''}>Nhiều thành viên</option>
                            <option value="newest" ${params.sort === 'newest' ? 'selected' : ''}>Mới nhất</option>
                        </select>
                    </div>

                    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:32px">
                        <button class="filter-pill ${!params.category ? 'active' : ''}" data-filter="">
                            Tất cả
                        </button>
                        ${categories.map(c => `
                            <button class="filter-pill ${params.category === c.name ? 'active' : ''}" data-filter="${c.name}">
                                ${getCategoryEmoji(c.name)} ${c.name} (${c.count})
                            </button>
                        `).join('')}
                    </div>

                    <div class="grid grid-3" id="clubsGrid">
                        ${filtered.length ? filtered.map(c => this.clubCard(c)).join('') : '<p class="empty" style="grid-column:1/-1">' + (searchQ ? `Không tìm thấy CLB nào cho "${this._escapeHtml(searchQ)}"` : 'Chưa có CLB nào') + '</p>'}
                    </div>
                </div>
            </section>
        `;

        document.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.dataset.filter;
                App.navigate('clubs', cat ? { category: cat } : {});
            });
        });

        // Search & sort
        let searchTimer;
        document.getElementById('clubSearchInput')?.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            const q = e.target.value;
            searchTimer = setTimeout(() => {
                const newParams = { ...params, q };
                delete newParams.q;
                if (q) newParams.q = q;
                App.navigate('clubs', newParams);
            }, 400);
        });
        document.getElementById('clubSortSelect')?.addEventListener('change', (e) => {
            App.navigate('clubs', { ...params, sort: e.target.value });
        });
    },

    // ============= POSTS (TIN TỨC) =============
    async renderPosts(main, params = {}) {
        const [posts, clubs] = await Promise.all([
            API.getPosts(params),
            API.getClubs()
        ]);

        main.innerHTML = `
            <section class="section">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow">Tin tức & Thông báo</span>
                        <h2 class="section-title">Bảng tin Câu lạc bộ</h2>
                        <p class="section-subtitle">Cập nhật thông tin mới nhất từ các CLB</p>
                    </div>

                    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:32px">
                        <button class="filter-pill ${!params.post_type ? 'active' : ''}" data-type="">
                            📰 Tất cả
                        </button>
                        <button class="filter-pill ${params.post_type === 'news' ? 'active' : ''}" data-type="news">
                            📰 Tin tức
                        </button>
                        <button class="filter-pill ${params.post_type === 'announcement' ? 'active' : ''}" data-type="announcement">
                            📢 Thông báo
                        </button>
                        <button class="filter-pill ${params.post_type === 'recruitment' ? 'active' : ''}" data-type="recruitment">
                            🎯 Tuyển thành viên
                        </button>
                    </div>

                    <div style="max-width:800px;margin:0 auto">
                        ${posts.length ? posts.map(p => this.postCard(p, clubs)).join('') : '<p class="empty">Chưa có bài viết nào</p>'}
                    </div>
                </div>
            </section>
        `;

        document.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                App.navigate('posts', type ? { post_type: type } : {});
            });
        });
    },

    postCard(p, clubs = []) {
        const club = clubs.find(c => c.id === p.club_id) || { name: 'CLB', category: 'Khác' };
        const typeLabels = { news: 'Tin tức', announcement: 'Thông báo', recruitment: 'Tuyển thành viên' };
        return `
            <div class="post-card ${p.is_pinned ? 'pinned' : ''}">
                ${p.is_pinned ? '<div style="color:var(--warning);font-size:12px;font-weight:600;margin-bottom:8px"><i class="fa-solid fa-thumbtack"></i> Ghim</div>' : ''}
                <div class="post-meta">
                    <span class="club-category" style="margin:0;padding:2px 8px">${getCategoryEmoji(club.category)} ${club.name}</span>
                    <span class="post-meta-item"><i class="fa-solid fa-tag"></i> ${typeLabels[p.post_type] || p.post_type}</span>
                    <span class="post-meta-item"><i class="fa-solid fa-clock"></i> ${formatRelativeTime(p.created_at)}</span>
                </div>
                <h3 class="post-title">${p.title}</h3>
                <p class="post-excerpt">${(p.content || '').replace(/\n/g, ' ').slice(0, 200)}...</p>
                <div class="post-actions">
                    <span class="post-action"><i class="fa-solid fa-eye"></i> ${p.views}</span>
                    <span class="post-action"><i class="fa-solid fa-heart"></i> ${p.likes}</span>
                    ${p.ai_keyword ? `<span class="post-action" style="color:var(--primary)"><i class="fa-solid fa-robot"></i> AI: ${(p.ai_keyword || '').split(',').slice(0, 2).join(', ')}</span>` : ''}
                </div>
            </div>
        `;
    },

    // ============= MEMBERS (SINH VIÊN) =============
    async renderMembers(main, params = {}) {
        const allMembers = await API.listMembers(params);

        main.innerHTML = `
            <section class="section">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow">Cộng đồng</span>
                        <h2 class="section-title">Sinh viên & Thành viên</h2>
                        <p class="section-subtitle">Gặp gỡ các thành viên trong hệ thống CLB - ${allMembers.length} thành viên công khai</p>
                    </div>

                    <div style="max-width:600px;margin:0 auto 32px">
                        <form id="memberSearchForm" style="display:flex;gap:8px">
                            <input type="text" class="form-input" id="memberSearch" placeholder="Tìm theo tên, MSSV, kỹ năng..." value="${params.q || ''}">
                            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-magnifying-glass"></i> Tìm</button>
                        </form>
                    </div>

                    <div class="grid grid-4 stagger">
                        ${allMembers.slice(0, 24).map(m => this.memberCard(m)).join('')}
                    </div>

                    ${allMembers.length === 0 ? '<p class="empty">Không tìm thấy thành viên nào</p>' : ''}
                </div>
            </section>
        `;

        document.getElementById('memberSearchForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const q = document.getElementById('memberSearch').value.trim();
            App.navigate('members', q ? { q } : {});
        });
    },

    memberCard(m) {
        const initials = (m.full_name || m.username).split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
        const roleBadge = m.role === 'admin'
            ? '<span class="member-role-badge admin">👑 Admin</span>'
            : m.role === 'leader'
            ? '<span class="member-role-badge leader">⭐ Chủ nhiệm</span>'
            : '<span class="member-role-badge member">Sinh viên</span>';

        return `
            <div class="member-card" onclick="App.navigate('member-profile',{id:${m.id}})">
                <div class="member-avatar">${initials}</div>
                <h4 class="member-name">${m.full_name}</h4>
                <p class="member-meta">@${m.username}</p>
                <p class="member-meta"><i class="fa-solid fa-id-card"></i> ${m.student_id || 'Chưa có'}</p>
                <p class="member-meta"><i class="fa-solid fa-users-rectangle"></i> ${m.class_name || 'Chưa cập nhật'}</p>
                <div style="margin-top:12px">${roleBadge}</div>
            </div>
        `;
    },

    // ============= CLUB DETAIL (NÂNG CẤP - HIỂN THỊ MISSION/VISION) =============
    async renderClubDetail(main, id) {
        const [club, members, followStatus] = await Promise.all([
            API.getClub(id),
            API.getClubMembers(id),
            API.isLoggedIn() ? API.getFollowStatus('club', id).catch(() => ({ is_following: false, followers_count: 0 })) : Promise.resolve({ is_following: false, followers_count: 0 })
        ]);

        const isMember = API.isLoggedIn() && members.some(m => m.user_id === API.getUser().id);

        main.innerHTML = `
            <div class="detail-header" style="background:linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)">
                <div class="detail-header-content">
                    <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;flex-wrap:wrap">
                        <div style="width:80px;height:80px;border-radius:16px;background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);display:grid;place-items:center;border:2px solid rgba(255,255,255,0.2);flex-shrink:0">
                            ${getAIIcon(club.category, 64)}
                        </div>
                        <div style="flex:1;min-width:0">
                            <h1>${this._escapeHtml(club.name)}</h1>
                            <div class="detail-header-meta">
                                <div class="detail-header-meta-item"><i class="fa-solid fa-users"></i> ${club.member_count} thành viên</div>
                                <div class="detail-header-meta-item"><i class="fa-solid fa-calendar"></i> Thành lập ${formatDate(club.founded_date)}</div>
                                ${club.meeting_room ? `<div class="detail-header-meta-item"><i class="fa-solid fa-location-dot"></i> ${this._escapeHtml(club.meeting_room)}</div>` : ''}
                            </div>
                        </div>
                        ${API.isLoggedIn() ? `
                        <button class="btn ${followStatus.is_following ? 'btn-secondary' : 'btn-primary'}" id="followClubBtn" data-club-id="${id}" style="flex-shrink:0">
                            <i class="fa-solid ${followStatus.is_following ? 'fa-check' : 'fa-plus'}"></i>
                            ${followStatus.is_following ? 'Đang theo dõi' : 'Theo dõi'}
                        </button>` : ''}
                    </div>
                </div>
            </div>

            <div class="detail-body">
                <div>
                    <!-- Tabs -->
                    <div class="tabs" style="margin-bottom:24px">
                        <div class="tab active" data-clubtab="about">📋 Giới thiệu</div>
                        <div class="tab" data-clubtab="members">👥 Thành viên (${members.length})</div>
                        <div class="tab" data-clubtab="documents">📁 Tài liệu</div>
                        ${club.mission || club.vision ? '<div class="tab" data-clubtab="vision">🎯 Sứ mệnh & Tầm nhìn</div>' : ''}
                    </div>

                    <div id="clubtab-about">
                        <div class="detail-section">
                            <h2><i class="fa-solid fa-circle-info" style="color:var(--primary)"></i> Giới thiệu CLB</h2>
                            <p>${club.description || 'Chưa có mô tả'}</p>
                        </div>

                        ${club.ai_summary ? `
                        <div class="detail-section" style="background:var(--gradient-ai);color:white;border:none">
                            <h2 style="color:white"><i class="fa-solid fa-robot"></i> AI tóm tắt</h2>
                            <p style="color:rgba(255,255,255,0.95);line-height:1.8">${club.ai_summary}</p>
                        </div>` : ''}

                        ${club.achievements ? `
                        <div class="detail-section">
                            <h2><i class="fa-solid fa-trophy" style="color:var(--warning)"></i> Thành tích nổi bật</h2>
                            <p style="white-space:pre-line;line-height:1.8;color:var(--text-soft)">${club.achievements}</p>
                        </div>` : ''}
                    </div>

                    <div id="clubtab-vision" hidden>
                        ${club.mission ? `
                        <div class="detail-section" style="border-left:4px solid var(--primary)">
                            <h2><i class="fa-solid fa-bullseye" style="color:var(--primary)"></i> Sứ mệnh</h2>
                            <p style="line-height:1.8">${club.mission}</p>
                        </div>` : ''}
                        ${club.vision ? `
                        <div class="detail-section" style="border-left:4px solid var(--secondary)">
                            <h2><i class="fa-solid fa-eye" style="color:var(--secondary)"></i> Tầm nhìn</h2>
                            <p style="line-height:1.8">${club.vision}</p>
                        </div>` : ''}
                    </div>

                    <div id="clubtab-members" hidden>
                        <div class="detail-section">
                            <h2><i class="fa-solid fa-people-group"></i> Thành viên (${members.length})</h2>
                            <p style="color:var(--text-mute);margin-bottom:16px">Click vào thành viên để xem profile chi tiết</p>
                            <div class="grid grid-2" style="gap:12px">
                                ${members.map(m => `
                                    <div onclick="App.navigate('member-profile',{id:${m.user_id}})" style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-soft);border-radius:var(--radius);cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='var(--bg-soft)'">
                                        <div style="width:48px;height:48px;border-radius:50%;background:var(--gradient-ai);color:white;display:grid;place-items:center;font-weight:700">
                                            ${(m.full_name || m.username).split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}
                                        </div>
                                        <div style="flex:1">
                                            <div style="font-weight:600">${m.full_name}</div>
                                            <div style="font-size:12px;color:var(--text-mute)">
                                                ${m.role === 'president' ? '👑 Chủ nhiệm' : m.role === 'vice_president' ? '⭐ Phó chủ nhiệm' : 'Thành viên'}
                                            </div>
                                        </div>
                                        <i class="fa-solid fa-chevron-right" style="color:var(--text-mute)"></i>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div id="clubtab-documents" hidden>
                        <div class="detail-section">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                                <h2 style="margin:0"><i class="fa-solid fa-folder-open"></i> Tài liệu CLB</h2>
                                ${API.isLoggedIn() ? `<button class="btn btn-primary" id="addDocBtn"><i class="fa-solid fa-plus"></i> Thêm</button>` : ''}
                            </div>
                            <div id="documentsList">
                                <p style="text-align:center;color:var(--text-mute);padding:20px"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <aside class="detail-aside">
                    <div>
                        ${API.isLoggedIn() ? `
                            <button class="btn btn-primary" id="joinBtn" style="width:100%">
                                <i class="fa-solid fa-${isMember ? 'check' : 'plus'}"></i>
                                ${isMember ? 'Đã tham gia' : 'Tham gia CLB'}
                            </button>
                            ${isMember ? `<button class="btn btn-secondary" id="leaveBtn" style="width:100%;margin-top:8px">Rời CLB</button>` : ''}
                            ${(API.getUser()?.id === club.president_id || API.isAdmin()) ? `
                                <a class="btn btn-secondary" data-page="club-manage" data-id="${id}" style="width:100%;margin-top:8px;background:linear-gradient(135deg, #f59e0b, #d97706);color:white">
                                    <i class="fa-solid fa-gear"></i> Quản lý CLB
                                </a>
                            ` : ''}
                        ` : `<a class="btn btn-primary" data-page="login" style="width:100%">Đăng nhập để tham gia</a>`}
                    </div>
                    ${club.ai_tags ? `
                    <div>
                        <h3 style="font-size:14px;margin-bottom:12px"><i class="fa-solid fa-tags"></i> Tags</h3>
                        ${club.ai_tags.split(',').map(t => `<span class="tag-pill">${t.trim()}</span>`).join('')}
                    </div>` : ''}
                    <div>
                        <h3 style="font-size:14px;margin-bottom:12px"><i class="fa-solid fa-circle-info"></i> Liên hệ</h3>
                        <p style="font-size:13px;color:var(--text-soft)"><i class="fa-solid fa-envelope"></i> ${club.email || 'Chưa cập nhật'}</p>
                        ${club.meeting_room ? `<p style="font-size:13px;color:var(--text-soft);margin-top:8px"><i class="fa-solid fa-location-dot"></i> ${club.meeting_room}</p>` : ''}
                        ${club.facebook ? `<p style="font-size:13px;color:var(--text-soft);margin-top:8px"><i class="fa-brands fa-facebook"></i> <a href="${club.facebook}" target="_blank">Fanpage</a></p>` : ''}
                    </div>
                </aside>
            </div>
        `;

        // Club tabs handler
        document.querySelectorAll('[data-clubtab]').forEach(t => {
            t.addEventListener('click', () => {
                document.querySelectorAll('[data-clubtab]').forEach(x => x.classList.remove('active'));
                document.querySelectorAll('[id^="clubtab-"]').forEach(x => x.hidden = true);
                t.classList.add('active');
                document.getElementById('clubtab-' + t.dataset.clubtab).hidden = false;
            });
        });

        if (isMember) {
            document.getElementById('joinBtn')?.addEventListener('click', () => {
                showToast('Bạn đã là thành viên CLB này', 'info');
            });
            document.getElementById('leaveBtn')?.addEventListener('click', async () => {
                if (confirm('Bạn có chắc muốn rời CLB?')) {
                    try {
                        await API.leaveClub(id);
                        showToast('Đã rời CLB', 'success');
                        App.navigate('club-detail', { id });
                    } catch (e) { showToast(e.message, 'error'); }
                }
            });
        } else if (API.isLoggedIn()) {
            document.getElementById('joinBtn')?.addEventListener('click', async () => {
                try {
                    const r = await API.joinClub(id);
                    showToast(r.message, 'success');
                    if (r.achievements_unlocked?.length) this._showAchievementUnlock(r.achievements_unlocked);
                    App.navigate('club-detail', { id });
                } catch (e) { showToast(e.message, 'error'); }
            });
        }

        // Follow club
        document.getElementById('followClubBtn')?.addEventListener('click', async () => {
            try {
                const r = await API.follow('club', id);
                showToast(r.message, 'success');
                App.navigate('club-detail', { id });
            } catch (e) { showToast(e.message, 'error'); }
        });

        // Load documents when tab is shown
        const docsTab = document.querySelector('[data-clubtab="documents"]');
        if (docsTab) {
            docsTab.addEventListener('click', () => this._loadClubDocuments(id));
        }
        document.getElementById('addDocBtn')?.addEventListener('click', () => this._showAddDocumentModal(id));

        this.bindDataPageLinks(main);
    },

    // ============= EVENTS =============
    async renderEvents(main, params = {}) {
        const events = await API.getEvents(params);

        main.innerHTML = `
            <section class="section">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow">Lịch trình</span>
                        <h2 class="section-title">Sự kiện & Hoạt động</h2>
                        <p class="section-subtitle">${events.length} sự kiện được tìm thấy</p>
                    </div>
                    <div class="grid grid-3">
                        ${events.length ? events.map(e => this.eventCard(e)).join('') : '<p class="empty" style="grid-column:1/-1">Chưa có sự kiện nào</p>'}
                    </div>
                </div>
            </section>
        `;
    },

    async renderEventDetail(main, id) {
        const event = await API.getEvent(id);
        const comments = await API.getComments('event', id);
        const reactions = await API.getReactions('event', id);
        const ratings = await API.getEventRatings(id);
        const gallery = await API.getEventGallery(id).catch(() => []);
        const me = API.getUser();
        const reactionEmojis = { like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😠' };
        const isFull = event.max_participants && event.current_participants >= event.max_participants;
        const eventDate = new Date(event.start_time);
        const isPast = eventDate < new Date();
        const isRegistered = me && event.is_registered;

        main.innerHTML = `
            <div class="detail-header">
                <div class="detail-header-content">
                    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
                        <span class="club-category" style="background:rgba(255,255,255,0.2);color:white">${event.status || 'Sắp diễn ra'}</span>
                        ${event.club ? `<span class="club-category" style="background:rgba(255,255,255,0.2);color:white"><i class="fa-solid fa-people-group"></i> ${event.club.name}</span>` : ''}
                        ${event.event_type ? `<span class="club-category" style="background:rgba(255,255,255,0.2);color:white">${event.event_type}</span>` : ''}
                    </div>
                    <h1>${this._escapeHtml(event.title)}</h1>
                    <div class="detail-header-meta">
                        <div class="detail-header-meta-item"><i class="fa-solid fa-calendar"></i> ${formatDateTime(event.start_time)}</div>
                        <div class="detail-header-meta-item"><i class="fa-solid fa-location-dot"></i> ${this._escapeHtml(event.location || '—')}</div>
                        <div class="detail-header-meta-item"><i class="fa-solid fa-users"></i> ${event.current_participants || 0}${event.max_participants ? `/${event.max_participants}` : ''} người</div>
                    </div>
                </div>
            </div>

            <div class="detail-body">
                <div>
                    <div class="detail-section">
                        <h2><i class="fa-solid fa-align-left"></i> Mô tả</h2>
                        <p style="white-space:pre-wrap">${this._escapeHtml(event.description || 'Chưa có mô tả')}</p>
                    </div>

                    ${event.ai_success_score ? `
                    <div class="detail-section" style="background:linear-gradient(135deg, #43e97b, #38f9d7);color:white;border:none">
                        <h2 style="color:white"><i class="fa-solid fa-chart-line"></i> AI dự đoán thành công</h2>
                        <div style="font-size:48px;font-weight:800;margin:8px 0">${Math.round(event.ai_success_score)}%</div>
                        <p style="color:rgba(255,255,255,0.95)">Dựa trên phân tích thông tin sự kiện</p>
                    </div>` : ''}

                    <!-- Ratings -->
                    <div class="detail-section">
                        <h2><i class="fa-solid fa-star"></i> Đánh giá (${ratings.total_ratings || 0})</h2>
                        ${ratings.total_ratings > 0 ? `
                        <div style="display:flex;align-items:center;gap:16px;margin:12px 0;padding:16px;background:var(--bg-soft);border-radius:12px">
                            <div style="text-align:center">
                                <div style="font-size:36px;font-weight:800;color:#f59e0b">${ratings.average_rating.toFixed(1)}</div>
                                <div style="color:#f59e0b;font-size:18px">${'★'.repeat(Math.round(ratings.average_rating))}${'☆'.repeat(5 - Math.round(ratings.average_rating))}</div>
                            </div>
                            <div style="flex:1;font-size:14px">
                                <div>${ratings.total_ratings} lượt đánh giá</div>
                                <div style="color:var(--text-mute)">${ratings.recommend_percent || 0}% sẽ giới thiệu</div>
                            </div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:12px">
                            ${ratings.ratings.slice(0, 5).map(r => `
                                <div style="padding:12px;background:var(--bg-soft);border-radius:8px">
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                                        <strong style="font-size:14px">${r.user_name}</strong>
                                        <span style="color:#f59e0b">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                                    </div>
                                    ${r.review ? `<p style="font-size:14px;color:var(--text-soft);margin:0">${this._escapeHtml(r.review)}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        ` : '<p style="color:var(--text-mute);margin-top:12px">Chưa có đánh giá nào</p>'}

                        ${me && isPast ? `
                        <button class="btn btn-primary" id="rateEventBtn" style="margin-top:16px">
                            <i class="fa-solid fa-star"></i> Đánh giá sự kiện
                        </button>
                        ` : ''}
                    </div>

                    <!-- Reactions bar -->
                    <div class="detail-section">
                        <h2><i class="fa-solid fa-heart"></i> Phản ứng (${reactions.total})</h2>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">
                            ${Object.entries(reactionEmojis).map(([type, emoji]) => {
                                const active = reactions.my_reaction === type;
                                const count = reactions.summary?.[type]?.count || 0;
                                return `<button class="reaction-btn" data-type="${type}" style="padding:8px 14px;border-radius:var(--radius-full);background:${active ? 'rgba(99,102,241,0.15)' : 'var(--bg-soft)'};border:1px solid ${active ? 'var(--primary)' : 'var(--border)'};cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;font-size:14px" title="${type}">
                                    <span style="font-size:18px">${emoji}</span>
                                    ${count > 0 ? `<strong style="font-size:13px">${count}</strong>` : ''}
                                </button>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Gallery -->
                    <div class="detail-section">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                            <h2 style="margin:0"><i class="fa-solid fa-images"></i> Album ảnh (${gallery.length})</h2>
                            ${me ? `<button class="btn btn-primary btn-sm" id="addPhotoBtn"><i class="fa-solid fa-camera"></i> Thêm ảnh</button>` : ''}
                        </div>
                        ${gallery.length ? `
                        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:8px">
                            ${gallery.map(p => `
                            <div style="position:relative;border-radius:10px;overflow:hidden;aspect-ratio:1;background:var(--bg-soft);cursor:pointer" onclick="window.open('${p.image_url}', '_blank')">
                                <img src="${p.image_url}" style="width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.style.display='none'">
                                <div style="position:absolute;bottom:0;left:0;right:0;padding:8px;background:linear-gradient(transparent, rgba(0,0,0,0.7));color:white;font-size:12px">
                                    <i class="fa-solid fa-heart"></i> ${p.likes || 0} · ${p.uploader_name || ''}
                                </div>
                            </div>`).join('')}
                        </div>
                        ` : '<p class="empty" style="padding:20px;text-align:center"><i class="fa-regular fa-images" style="font-size:48px;opacity:0.2"></i><br>Chưa có ảnh nào</p>'}
                    </div>

                    <!-- Comments -->
                    <div class="detail-section">
                        <h2><i class="fa-solid fa-comments"></i> Bình luận (${comments.length})</h2>
                        ${me ? `
                        <form id="commentForm" style="margin:16px 0;display:flex;gap:12px">
                            <div style="width:40px;height:40px;border-radius:50%;background:var(--gradient-1);color:white;display:grid;place-items:center;font-weight:700;flex-shrink:0">
                                ${(me.full_name || me.username || '?')[0]}
                            </div>
                            <div style="flex:1">
                                <textarea class="form-textarea" name="content" placeholder="Bình luận về sự kiện..." required maxlength="2000" style="min-height:70px"></textarea>
                                <button type="submit" class="btn btn-primary" style="margin-top:8px"><i class="fa-solid fa-paper-plane"></i> Gửi</button>
                            </div>
                        </form>
                        ` : '<p style="color:var(--text-mute);margin:12px 0"><a data-page="login" style="cursor:pointer;color:var(--primary);font-weight:600">Đăng nhập</a> để bình luận</p>'}
                        <div style="margin-top:16px">
                            ${comments.length ? comments.map(c => this._renderComment(c, me)).join('') : '<p class="empty" style="padding:20px;text-align:center;color:var(--text-mute)">Chưa có bình luận nào</p>'}
                        </div>
                    </div>
                </div>

                <aside class="detail-aside">
                    ${API.isLoggedIn() ? `
                        ${isPast ? `
                            <div class="card" style="background:var(--bg-soft);text-align:center">
                                <i class="fa-solid fa-clock-rotate-left" style="font-size:32px;color:var(--text-mute)"></i>
                                <p style="margin-top:8px;color:var(--text-mute)">Sự kiện đã diễn ra</p>
                            </div>
                        ` : isRegistered ? `
                            <div class="card" style="background:linear-gradient(135deg, rgba(16,185,129,0.1), rgba(52,211,153,0.1));border:1px solid rgba(16,185,129,0.3)">
                                <div style="text-align:center;color:#059669">
                                    <i class="fa-solid fa-circle-check" style="font-size:32px"></i>
                                    <p style="font-weight:600;margin-top:8px">Bạn đã đăng ký</p>
                                </div>
                                <button class="btn btn-secondary" id="unregBtn" style="width:100%;margin-top:12px">
                                    <i class="fa-solid fa-xmark"></i> Hủy đăng ký
                                </button>
                            </div>
                        ` : isFull ? `
                            <div class="card" style="text-align:center">
                                <i class="fa-solid fa-user-slash" style="font-size:32px;color:var(--warning)"></i>
                                <p style="margin-top:8px;font-weight:600">Đã đầy</p>
                                <p style="font-size:13px;color:var(--text-mute)">Sự kiện đã đạt giới hạn đăng ký</p>
                            </div>
                        ` : `
                            <button class="btn btn-primary" id="regBtn" style="width:100%">
                                <i class="fa-solid fa-check"></i> Đăng ký tham gia
                            </button>
                        `}
                        <p style="text-align:center;font-size:13px;color:var(--text-mute);margin-top:12px">
                            <i class="fa-solid fa-users"></i> ${event.current_participants || 0}${event.max_participants ? `/${event.max_participants}` : ''} người đã đăng ký
                        </p>
                    ` : `<a class="btn btn-primary" data-page="login" style="width:100%">Đăng nhập để đăng ký</a>`}

                    <div class="card" style="margin-top:12px">
                        <h4 style="margin-bottom:12px"><i class="fa-solid fa-circle-info"></i> Thông tin</h4>
                        <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border-soft)">
                            <span style="color:var(--text-mute)">Bắt đầu</span>
                            <strong>${formatDateTime(event.start_time)}</strong>
                        </div>
                        ${event.end_time ? `<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border-soft)">
                            <span style="color:var(--text-mute)">Kết thúc</span>
                            <strong>${formatDateTime(event.end_time)}</strong>
                        </div>` : ''}
                        <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0">
                            <span style="color:var(--text-mute)">Địa điểm</span>
                            <strong>${this._escapeHtml(event.location || '—')}</strong>
                        </div>
                    </div>
                </aside>
            </div>
        `;

        // Register / unregister
        document.getElementById('regBtn')?.addEventListener('click', async () => {
            try {
                const r = await API.registerEvent(id);
                showToast(r.message || 'Đăng ký thành công!', 'success');
                if (r.achievements_unlocked?.length) this._showAchievementUnlock(r.achievements_unlocked);
                App.navigate('event-detail', { id });
            } catch (e) { showToast(e.message, 'error'); }
        });
        document.getElementById('unregBtn')?.addEventListener('click', async () => {
            if (!confirm('Hủy đăng ký sự kiện này?')) return;
            try {
                await API.unregisterEvent(id);
                showToast('Đã hủy đăng ký', 'success');
                App.navigate('event-detail', { id });
            } catch (e) { showToast(e.message, 'error'); }
        });

        // Reactions
        document.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!API.isLoggedIn()) { showToast('Vui lòng đăng nhập', 'warning'); return; }
                try {
                    await API.reactTo('event', id, btn.dataset.type);
                    App.navigate('event-detail', { id });
                } catch (e) { showToast(e.message, 'error'); }
            });
        });

        // Comments
        const form = document.getElementById('commentForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const content = form.content.value.trim();
                if (!content) return;
                try {
                    await API.createComment({ target_type: 'event', target_id: id, content });
                    showToast('Đã gửi bình luận!', 'success');
                    App.navigate('event-detail', { id });
                } catch (err) { showToast(err.message, 'error'); }
            });
        }
        document.querySelectorAll('.comment-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Xóa bình luận này?')) return;
                try {
                    await API.deleteComment(btn.dataset.id);
                    App.navigate('event-detail', { id });
                } catch (e) { showToast(e.message, 'error'); }
            });
        });
        document.querySelectorAll('.comment-like').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!API.isLoggedIn()) { showToast('Vui lòng đăng nhập', 'warning'); return; }
                try {
                    const r = await API.likeComment(btn.dataset.id);
                    const span = btn.querySelector('.like-count');
                    if (span) span.textContent = r.likes;
                } catch (e) { showToast(e.message, 'error'); }
            });
        });

        // Rating button
        document.getElementById('rateEventBtn')?.addEventListener('click', () => this._showRatingModal(id));

        // Add photo
        document.getElementById('addPhotoBtn')?.addEventListener('click', () => this._showAddPhotoModal(id));

        this.bindDataPageLinks(main);
    },

    _showRatingModal(eventId) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';
        overlay.innerHTML = `
            <div style="background:var(--surface);border-radius:16px;padding:24px;max-width:480px;width:100%">
                <h3 style="margin-bottom:20px"><i class="fa-solid fa-star" style="color:#f59e0b"></i> Đánh giá sự kiện</h3>
                <form id="ratingForm">
                    <div style="text-align:center;margin-bottom:20px">
                        <div style="font-size:14px;color:var(--text-mute);margin-bottom:8px">Bạn đánh giá sự kiện này thế nào?</div>
                        <div id="starPicker" style="font-size:36px;cursor:pointer;color:#ddd">
                            ${[1,2,3,4,5].map(i => `<span data-star="${i}" style="padding:0 4px;transition:color 0.15s">★</span>`).join('')}
                        </div>
                        <input type="hidden" name="rating" id="ratingValue" value="0" required>
                    </div>
                    <div style="margin-bottom:12px">
                        <label style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Nhận xét của bạn</label>
                        <textarea name="review" class="form-textarea" rows="3" maxlength="1000" placeholder="Chia sẻ cảm nhận của bạn..."></textarea>
                    </div>
                    <label style="display:flex;align-items:center;gap:6px;margin-bottom:16px;cursor:pointer;font-size:14px">
                        <input type="checkbox" name="would_recommend" checked> Tôi sẽ giới thiệu sự kiện này cho bạn bè
                    </label>
                    <div style="display:flex;gap:8px;justify-content:flex-end">
                        <button type="button" id="cancelRating" class="btn btn-secondary">Hủy</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Gửi đánh giá</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        let currentRating = 0;
        const stars = overlay.querySelectorAll('#starPicker span');
        const highlight = (n) => {
            stars.forEach((s, i) => s.style.color = i < n ? '#f59e0b' : '#ddd');
        };
        stars.forEach(s => {
            s.addEventListener('mouseenter', () => highlight(parseInt(s.dataset.star)));
            s.addEventListener('click', () => {
                currentRating = parseInt(s.dataset.star);
                document.getElementById('ratingValue').value = currentRating;
                highlight(currentRating);
            });
        });
        overlay.querySelector('#starPicker').addEventListener('mouseleave', () => highlight(currentRating));

        const close = () => overlay.remove();
        document.getElementById('cancelRating').onclick = close;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        document.getElementById('ratingForm').onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const rating = parseInt(fd.get('rating'));
            if (rating < 1 || rating > 5) { showToast('Vui lòng chọn số sao', 'warning'); return; }
            try {
                await API.rateEvent(eventId, {
                    rating,
                    review: fd.get('review') || null,
                    would_recommend: !!fd.get('would_recommend'),
                });
                showToast('Cảm ơn bạn đã đánh giá!', 'success');
                close();
                App.navigate('event-detail', { id: eventId });
            } catch (err) { showToast(err.message, 'error'); }
        };
    },

    _showAddPhotoModal(eventId) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';
        overlay.innerHTML = `
            <div style="background:var(--surface);border-radius:16px;padding:24px;max-width:480px;width:100%">
                <h3 style="margin-bottom:20px"><i class="fa-solid fa-camera" style="color:var(--primary)"></i> Thêm ảnh sự kiện</h3>
                <form id="addPhotoForm">
                    <div style="margin-bottom:12px">
                        <label style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Chọn ảnh *</label>
                        <input type="file" name="file" accept="image/*" required id="photoFile">
                        <div id="photoPreview" style="margin-top:8px;display:none">
                            <img id="photoPreviewImg" style="max-width:100%;max-height:200px;border-radius:8px">
                        </div>
                    </div>
                    <div style="margin-bottom:16px">
                        <label style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Mô tả (tùy chọn)</label>
                        <input type="text" name="caption" class="form-input" maxlength="200" placeholder="VD: Khoảnh khắc trao giải">
                    </div>
                    <div style="display:flex;gap:8px;justify-content:flex-end">
                        <button type="button" id="cancelAddPhoto" class="btn btn-secondary">Hủy</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Đăng</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
        const close = () => overlay.remove();
        document.getElementById('cancelAddPhoto').onclick = close;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        // Preview
        document.getElementById('photoFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = document.getElementById('photoPreview');
                const img = document.getElementById('photoPreviewImg');
                img.src = ev.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });

        document.getElementById('addPhotoForm').onsubmit = async (e) => {
            e.preventDefault();
            const file = e.target.file.files[0];
            if (!file) { showToast('Vui lòng chọn ảnh', 'warning'); return; }
            const submitBtn = e.target.querySelector('button[type=submit]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang upload...';
            try {
                const r = await API.uploadImage(file, 'event_cover', eventId);
                await API.uploadEventPhoto(eventId, { image_url: r.url, caption: e.target.caption.value || null });
                showToast('Đã thêm ảnh vào album!', 'success');
                close();
                App.navigate('event-detail', { id: eventId });
            } catch (err) {
                showToast(err.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đăng';
            }
        };
    },

    _emptyState(icon, title, desc, actionLabel = null, actionPage = null) {
        return `
            <div style="text-align:center;padding:60px 20px;color:var(--text-mute)">
                <div style="font-size:64px;opacity:0.25;margin-bottom:16px">${icon}</div>
                <h3 style="color:var(--text-soft);margin-bottom:8px">${title}</h3>
                <p style="font-size:14px;max-width:400px;margin:0 auto 16px">${desc}</p>
                ${actionLabel && actionPage ? `<button class="btn btn-primary" data-page="${actionPage}">${actionLabel}</button>` : ''}
            </div>`;
    },

    _loadingState(msg = 'Đang tải...') {
        return `<div style="text-align:center;padding:60px 20px;color:var(--text-mute)">
            <div class="spinner" style="display:inline-block;width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:12px"></div>
            <p>${msg}</p>
        </div>`;
    },

    _showAchievementUnlock(names) {
        if (!names?.length) return;
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:80px;right:20px;z-index:2000;background:linear-gradient(135deg, #f59e0b, #ea580c);color:white;padding:16px 20px;border-radius:12px;box-shadow:0 10px 40px rgba(245,158,11,0.4);max-width:360px;animation:slideIn 0.4s ease';
        toast.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px">
                <div style="font-size:36px;animation:bounce 1s ease">🏆</div>
                <div>
                    <div style="font-weight:700;font-size:15px;margin-bottom:4px">Mở khóa thành tích!</div>
                    <div style="font-size:13px;opacity:0.95">${names.map(n => `🎯 ${this._escapeHtml(n)}`).join('<br>')}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:white;font-size:18px;cursor:pointer;margin-left:auto">×</button>
            </div>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 6000);
    },

    async _loadNotifPrefs() {
        const container = document.getElementById('notifPrefContent');
        if (!container) return;
        try {
            const p = await API.getNotificationPreferences();
            const field = (key, label, icon, desc) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border-soft)">
                    <div>
                        <div style="font-weight:600;font-size:14px"><i class="fa-solid ${icon}" style="color:var(--primary);width:20px"></i> ${label}</div>
                        <div style="font-size:12px;color:var(--text-mute);margin-top:2px">${desc}</div>
                    </div>
                    <label style="position:relative;display:inline-block;width:48px;height:26px;cursor:pointer">
                        <input type="checkbox" data-notif="${key}" ${p[key] ? 'checked' : ''} style="opacity:0;width:0;height:0">
                        <span style="position:absolute;inset:0;background:${p[key] ? 'var(--primary)' : '#ccc'};border-radius:26px;transition:0.3s" class="notif-toggle"></span>
                        <span style="position:absolute;top:3px;left:${p[key] ? '25px' : '3px'};width:20px;height:20px;background:white;border-radius:50%;transition:0.3s"></span>
                    </label>
                </div>`;
            container.innerHTML = `
                <h5 style="margin:0 0 8px;font-size:13px;color:var(--text-mute);text-transform:uppercase;letter-spacing:1px">📬 Kênh nhận</h5>
                ${field('in_app', 'Thông báo trong app', 'fa-mobile-screen', 'Hiển thị trong panel thông báo')}
                ${field('email', 'Email', 'fa-envelope', 'Gửi thông báo qua email (sắp ra mắt)')}
                <h5 style="margin:24px 0 8px;font-size:13px;color:var(--text-mute);text-transform:uppercase;letter-spacing:1px">📋 Loại thông báo</h5>
                ${field('notif_event', 'Sự kiện', 'fa-calendar-star', 'CLB tạo sự kiện mới, nhắc sự kiện sắp tới')}
                ${field('notif_club', 'Câu lạc bộ', 'fa-people-group', 'Có người tham gia CLB bạn quản lý')}
                ${field('notif_comment', 'Bình luận & Reactions', 'fa-comment', 'Có người bình luận/reaction bài viết của bạn')}
                ${field('notif_achievement', 'Thành tích', 'fa-trophy', 'Mở khóa thành tích mới')}
                ${field('notif_follow', 'Theo dõi', 'fa-user-plus', 'Có người follow bạn')}
                <div style="margin-top:24px;display:flex;justify-content:flex-end">
                    <button class="btn btn-primary" id="saveNotifPrefs"><i class="fa-solid fa-check"></i> Lưu cài đặt</button>
                </div>
            `;
            // Toggle visual
            container.querySelectorAll('input[data-notif]').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const label = e.target.closest('label');
                    const bg = label.querySelector('.notif-toggle');
                    const knob = label.querySelectorAll('span')[1];
                    if (e.target.checked) {
                        bg.style.background = 'var(--primary)';
                        knob.style.left = '25px';
                    } else {
                        bg.style.background = '#ccc';
                        knob.style.left = '3px';
                    }
                });
            });
            document.getElementById('saveNotifPrefs').addEventListener('click', async () => {
                const payload = {};
                container.querySelectorAll('input[data-notif]').forEach(cb => {
                    payload[cb.dataset.notif] = cb.checked;
                });
                try {
                    await API.updateNotificationPreferences(payload);
                    showToast('Đã lưu cài đặt!', 'success');
                } catch (e) { showToast(e.message, 'error'); }
            });
        } catch (e) {
            container.innerHTML = `<p style="color:var(--danger)">Lỗi: ${e.message}</p>`;
        }
    },

    // ============= AI ASSISTANT PAGE =============
    async renderAIAssistant(main) {
        let status = { available: false };
        try { status = await API.getAiStatus(); } catch (e) {}

        main.innerHTML = `
            <section class="section" style="background:var(--gradient-hero);color:white;padding:60px 0">
                <div class="container" style="text-align:center">
                    <div style="width:80px;height:80px;background:var(--gradient-ai);border-radius:50%;display:grid;place-items:center;margin:0 auto 20px;font-size:40px;box-shadow:var(--shadow-glow)">
                        <i class="fa-solid fa-robot"></i>
                    </div>
                    <h1 style="color:white;font-size:42px">Trợ lý AI Thông minh</h1>
                    <p style="color:rgba(255,255,255,0.8);max-width:600px;margin:12px auto">
                        Trò chuyện với AI để được tư vấn về CLB, sự kiện, hoạt động sinh viên
                    </p>
                    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.1);padding:8px 16px;border-radius:var(--radius-full);margin-top:16px">
                        <span style="width:8px;height:8px;background:${status.available ? '#10b981' : '#f59e0b'};border-radius:50%;box-shadow:0 0 6px ${status.available ? '#10b981' : '#f59e0b'}"></span>
                        <span style="font-size:13px">${status.available ? 'Đang hoạt động (Ollama)' : 'Hoạt động (chế độ thông minh)'}</span>
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    <div style="max-width:800px;margin:0 auto">
                        <div id="aiPageMessages" class="card" style="min-height:400px;display:flex;flex-direction:column">
                            <div class="ai-message bot" style="margin-bottom:16px">
                                <div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>
                                <div class="ai-msg-bubble">
                                    👋 Xin chào! Tôi là trợ lý AI của CLB Hub. Tôi có thể giúp bạn tìm CLB, sự kiện, tư vấn hoạt động ngoại khóa phù hợp. Bạn muốn hỏi gì?
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-2" style="margin-top:24px">
                            <button class="ai-page-sug card" data-q="Có những CLB nào nổi bật?">
                                <i class="fa-solid fa-star" style="color:var(--primary)"></i>
                                <strong>CLB nổi bật</strong>
                                <p style="font-size:13px;color:var(--text-mute);margin-top:4px">Xem các CLB được yêu thích nhất</p>
                            </button>
                            <button class="ai-page-sug card" data-q="Sự kiện sắp tới">
                                <i class="fa-solid fa-calendar" style="color:var(--secondary)"></i>
                                <strong>Sự kiện sắp tới</strong>
                                <p style="font-size:13px;color:var(--text-mute);margin-top:4px">Khám phá các sự kiện hấp dẫn</p>
                            </button>
                            <button class="ai-page-sug card" data-q="Tư vấn CLB phù hợp với tôi">
                                <i class="fa-solid fa-lightbulb" style="color:var(--warning)"></i>
                                <strong>Tư vấn cá nhân</strong>
                                <p style="font-size:13px;color:var(--text-mute);margin-top:4px">AI sẽ gợi ý CLB phù hợp với bạn</p>
                            </button>
                            <button class="ai-page-sug card" data-q="Làm sao để đăng ký tham gia CLB?">
                                <i class="fa-solid fa-circle-info" style="color:var(--accent)"></i>
                                <strong>Hướng dẫn tham gia</strong>
                                <p style="font-size:13px;color:var(--text-mute);margin-top:4px">Các bước đăng ký tham gia CLB</p>
                            </button>
                        </div>

                        <form id="aiPageForm" style="display:flex;gap:12px;margin-top:24px">
                            <input type="text" id="aiPageInput" class="form-input" placeholder="Nhập câu hỏi cho AI..." style="flex:1">
                            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i> Gửi</button>
                        </form>
                    </div>
                </div>
            </section>
        `;

        const handleAsk = async (message) => {
            const messagesEl = document.getElementById('aiPageMessages');

            // Append user message
            messagesEl.insertAdjacentHTML('beforeend', `
                <div class="ai-message user" style="margin-bottom:16px;align-self:flex-end;display:flex;flex-direction:row-reverse;gap:8px;max-width:80%">
                    <div class="ai-msg-avatar"><i class="fa-solid fa-user"></i></div>
                    <div class="ai-msg-bubble" style="background:var(--gradient-ai);color:white">${message}</div>
                </div>
            `);

            // Loading
            const loadingEl = document.createElement('div');
            loadingEl.className = 'ai-message bot';
            loadingEl.style.marginBottom = '16px';
            loadingEl.innerHTML = `
                <div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="ai-msg-bubble"><i class="fa-solid fa-ellipsis fa-bounce"></i> Đang suy nghĩ...</div>
            `;
            messagesEl.appendChild(loadingEl);
            messagesEl.scrollTop = messagesEl.scrollHeight;

            try {
                const r = await API.chatWithAi(message);
                loadingEl.remove();
                messagesEl.insertAdjacentHTML('beforeend', `
                    <div class="ai-message bot" style="margin-bottom:16px">
                        <div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>
                        <div class="ai-msg-bubble">${r.reply.replace(/\n/g, '<br>')}</div>
                    </div>
                `);
            } catch (e) {
                loadingEl.remove();
                showToast(e.message, 'error');
            }
            messagesEl.scrollTop = messagesEl.scrollHeight;
        };

        main.querySelectorAll('.ai-page-sug').forEach(b => {
            b.addEventListener('click', () => handleAsk(b.dataset.q));
        });
        main.querySelector('#aiPageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('aiPageInput');
            const msg = input.value.trim();
            if (!msg) return;
            input.value = '';
            handleAsk(msg);
        });
    },

    // ============= ADMIN DASHBOARD (QUẢN TRỊ) =============
    async renderAdmin(main) {
        if (!API.isLoggedIn() || !API.isAdmin()) {
            showToast('Cần quyền Admin', 'error');
            App.navigate('home');
            return;
        }

        const overview = await API.getOverview();
        const popularClubs = await API.getPopularClubs();

        main.innerHTML = `
            <section class="section" style="background:var(--gradient-hero);color:white;padding:48px 0">
                <div class="container">
                    <div style="display:flex;align-items:center;gap:16px">
                        <div style="width:64px;height:64px;background:var(--gradient-ai);border-radius:16px;display:grid;place-items:center;font-size:32px;box-shadow:var(--shadow-glow)">
                            <i class="fa-solid fa-shield-halved"></i>
                        </div>
                        <div>
                            <h1 style="color:white;margin:0;font-size:32px">Admin Dashboard</h1>
                            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0">Quản trị hệ thống toàn trường</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    <!-- Quick Stats -->
                    <div class="grid grid-4 stagger" style="margin-bottom:32px">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fa-solid fa-people-group"></i></div>
                            <div class="stat-info"><h3>${overview.total_clubs}</h3><p>Câu lạc bộ</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon green"><i class="fa-solid fa-user-graduate"></i></div>
                            <div class="stat-info"><h3>${overview.total_users}</h3><p>Sinh viên</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon pink"><i class="fa-solid fa-calendar"></i></div>
                            <div class="stat-info"><h3>${overview.total_events}</h3><p>Sự kiện</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon blue"><i class="fa-solid fa-newspaper"></i></div>
                            <div class="stat-info"><h3>${overview.total_posts}</h3><p>Bài viết</p></div>
                        </div>
                    </div>

                    <!-- Charts -->
                    <div class="grid grid-2" style="margin-bottom:32px">
                        <div class="card">
                            <h3 style="margin-bottom:20px"><i class="fa-solid fa-chart-bar" style="color:var(--primary)"></i> Phân bố CLB theo danh mục</h3>
                            <div class="chart-container" style="height:280px">
                                <canvas id="categoryChart"></canvas>
                            </div>
                        </div>
                        <div class="card">
                            <h3 style="margin-bottom:20px"><i class="fa-solid fa-chart-line" style="color:var(--secondary)"></i> Hoạt động 6 tháng qua</h3>
                            <div class="chart-container" style="height:280px">
                                <canvas id="activityChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <div class="card" style="margin-bottom:32px">
                        <h3 style="margin-bottom:16px"><i class="fa-solid fa-file-export" style="color:var(--primary)"></i> Xuất dữ liệu CSV</h3>
                        <p style="color:var(--text-mute);margin-bottom:16px">Tải về dữ liệu để phân tích hoặc báo cáo (file Excel mở được)</p>
                        <div style="display:flex;flex-wrap:wrap;gap:8px">
                            <a href="/api/admin/export/users" class="btn btn-secondary" download><i class="fa-solid fa-users"></i> Users (${overview.total_users})</a>
                            <a href="/api/admin/export/clubs" class="btn btn-secondary" download><i class="fa-solid fa-people-group"></i> CLB (${overview.total_clubs})</a>
                            <a href="/api/admin/export/events" class="btn btn-secondary" download><i class="fa-solid fa-calendar"></i> Events (${overview.total_events})</a>
                            <a href="/api/admin/export/posts" class="btn btn-secondary" download><i class="fa-solid fa-newspaper"></i> Posts (${latestPosts.length})</a>
                            <a href="/api/admin/export/ratings" class="btn btn-secondary" download><i class="fa-solid fa-star"></i> Ratings</a>
                        </div>
                    </div>

                    <!-- Top CLB & Quick Actions -->
                    <div class="grid grid-2" style="margin-bottom:32px">
                        <div class="card">
                            <h3 style="margin-bottom:20px"><i class="fa-solid fa-trophy" style="color:var(--warning)"></i> Top 5 CLB phổ biến</h3>
                            ${popularClubs.map((c, i) => `
                                <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-soft);border-radius:var(--radius);margin-bottom:8px;cursor:pointer" onclick="App.navigate('club-detail',{id:${c.id}})">
                                    <div style="width:32px;height:32px;border-radius:50%;background:${['#f59e0b','#94a3b8','#fb923c','#cbd5e1','#a3a3a3'][i]};color:white;display:grid;place-items:center;font-weight:800">
                                        ${i+1}
                                    </div>
                                    <div style="flex:1">
                                        <div style="font-weight:600">${c.name}</div>
                                        <div style="font-size:12px;color:var(--text-mute)">${c.category}</div>
                                    </div>
                                    <div style="text-align:right">
                                        <div style="font-weight:700;color:var(--primary)">${c.member_count}</div>
                                        <div style="font-size:11px;color:var(--text-mute)">thành viên</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="card">
                            <h3 style="margin-bottom:20px"><i class="fa-solid fa-bolt" style="color:var(--accent)"></i> Thao tác nhanh</h3>
                            <div class="grid grid-2" style="gap:12px">
                                <button class="btn btn-primary" data-page="create-club" style="padding:16px">
                                    <i class="fa-solid fa-plus"></i> Tạo CLB
                                </button>
                                <button class="btn btn-secondary" data-page="create-event" style="padding:16px">
                                    <i class="fa-solid fa-calendar-plus"></i> Tạo sự kiện
                                </button>
                                <button class="btn btn-secondary" data-page="ai-insights" style="padding:16px">
                                    <i class="fa-solid fa-brain"></i> AI Insights
                                </button>
                                <button class="btn btn-secondary" data-page="create-post" style="padding:16px">
                                    <i class="fa-solid fa-newspaper"></i> Đăng bài
                                </button>
                            </div>
                            <div style="margin-top:20px;padding:16px;background:linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.1));border-radius:var(--radius)">
                                <div style="display:flex;align-items:center;gap:8px;font-weight:600;margin-bottom:8px">
                                    <i class="fa-solid fa-robot" style="color:var(--primary)"></i>
                                    AI gợi ý hôm nay
                                </div>
                                <p style="font-size:13px;color:var(--text-soft);margin:0">Hệ thống đang hoạt động tốt. Bạn có thể xem chi tiết phân tích tại <strong>AI Insights</strong>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Render charts
        this.renderAdminCharts();
        this.bindDataPageLinks(main);
    },

    renderAdminCharts() {
        // Category Chart
        const catCanvas = document.getElementById('categoryChart');
        if (catCanvas) {
            API.getCategories().then(cats => {
                const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981'];
                new Chart(catCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: cats.map(c => c.name),
                        datasets: [{
                            data: cats.map(c => c.count),
                            backgroundColor: colors,
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'right' }
                        }
                    }
                });
            });
        }

        // Activity Chart
        const actCanvas = document.getElementById('activityChart');
        if (actCanvas) {
            const months = ['T4', 'T5', 'T6', 'T7', 'T8', 'T9'];
            new Chart(actCanvas, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Sự kiện',
                        data: [3, 5, 8, 6, 10, 12],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Bài viết',
                        data: [2, 4, 6, 8, 12, 15],
                        borderColor: '#ec4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
    },

    // ============= LEADERBOARD =============
    async renderLeaderboard(main) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }
        const data = await API.getMyPoints();
        const myId = API.getUser().id;

        main.innerHTML = `
            <section class="section" style="background:linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);color:white;padding:60px 0">
                <div class="container" style="text-align:center">
                    <div style="width:80px;height:80px;background:linear-gradient(135deg,#f59e0b,#fbbf24);border-radius:50%;display:grid;place-items:center;margin:0 auto 20px;font-size:40px;box-shadow:0 0 30px rgba(245,158,11,0.5)">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <h1 style="color:white;font-size:42px">Bảng Xếp Hạng</h1>
                    <p style="color:rgba(255,255,255,0.8);max-width:600px;margin:12px auto">
                        Thi đua cùng cộng đồng sinh viên ICTU. Tích lũy điểm, leo rank, nhận thành tích!
                    </p>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    <!-- User Progress Card -->
                    <div class="card animate-slide-up" style="background:var(--gradient-ai);color:white;border:none;margin-bottom:32px">
                        <div style="display:grid;grid-template-columns:auto 1fr auto;gap:24px;align-items:center">
                            <div style="width:80px;height:80px;background:rgba(255,255,255,0.2);border-radius:50%;display:grid;place-items:center;font-size:32px">
                                ${this.getRankBadge(data.level)}
                            </div>
                            <div>
                                <h3 style="color:white;margin:0 0 4px">Bạn đang ở Level ${data.level} - ${data.rank}</h3>
                                <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
                                    <div style="flex:1;height:8px;background:rgba(255,255,255,0.2);border-radius:4px;overflow:hidden">
                                        <div style="height:100%;width:${data.progress}%;background:white;border-radius:4px;transition:width 1s"></div>
                                    </div>
                                    <span style="font-size:13px;white-space:nowrap">${data.total_points} / ${data.next_level_points} điểm</span>
                                </div>
                            </div>
                            <div style="text-align:center">
                                <div style="font-size:36px;font-weight:800">${data.total_points}</div>
                                <div style="font-size:12px;opacity:0.9">TỔNG ĐIỂM</div>
                            </div>
                        </div>
                    </div>

                    <!-- Achievements -->
                    <div class="card" style="margin-bottom:32px">
                        <h3 style="margin-bottom:20px"><i class="fa-solid fa-medal" style="color:var(--warning)"></i> Thành tích của bạn (${data.achievements.length})</h3>
                        ${data.achievements.length ? `
                        <div class="grid grid-4 stagger">
                            ${data.achievements.map(a => `
                                <div class="card" style="text-align:center;background:${this.getRarityColor(a.rarity)};color:white;border:none">
                                    <div style="font-size:48px;margin-bottom:8px">${a.icon}</div>
                                    <h4 style="color:white;font-size:14px;margin:0 0 4px">${a.name}</h4>
                                    <div style="font-size:11px;opacity:0.9;margin-bottom:4px">${a.description}</div>
                                    <div style="display:inline-block;background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">+${a.points} điểm</div>
                                </div>
                            `).join('')}
                        </div>
                        ` : '<p class="empty">Chưa có thành tích nào. Hãy tham gia hoạt động để nhận!</p>'}
                    </div>

                    <!-- Top Leaderboard -->
                    <div class="card">
                        <h3 style="margin-bottom:20px"><i class="fa-solid fa-crown" style="color:var(--warning)"></i> Top 10 Sinh viên xuất sắc</h3>
                        <div class="grid grid-2 stagger">
                            ${data.leaderboard.map((u, i) => {
                                const isMe = u.user_id === myId;
                                const medalColor = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#fb923c' : 'var(--bg-soft)';
                                return `
                                <div class="card" style="display:flex;align-items:center;gap:16px;background:${isMe ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.1))' : 'var(--bg-soft)'};border:${isMe ? '2px solid var(--primary)' : '1px solid var(--border-soft)'};cursor:pointer" onclick="App.user={id:${u.user_id}};if(!API.token)App.navigate('login')">
                                    <div style="width:48px;height:48px;border-radius:50%;background:${medalColor};color:${i < 3 ? 'white' : 'var(--text)'};display:grid;place-items:center;font-weight:800;font-size:18px">
                                        ${i < 3 ? ['🥇','🥈','🥉'][i] : '#' + (i+1)}
                                    </div>
                                    <div style="width:48px;height:48px;border-radius:50%;background:var(--gradient-ai);color:white;display:grid;place-items:center;font-weight:700;flex-shrink:0">
                                        ${u.avatar}
                                    </div>
                                    <div style="flex:1">
                                        <div style="font-weight:700">${u.full_name} ${isMe ? '<span class="badge badge-primary" style="font-size:10px">Bạn</span>' : ''}</div>
                                        <div style="font-size:12px;color:var(--text-mute)">Level ${u.level} · ${u.rank_name}</div>
                                    </div>
                                    <div style="text-align:right">
                                        <div style="font-weight:800;color:var(--primary);font-size:18px">${u.points}</div>
                                        <div style="font-size:11px;color:var(--text-mute)">điểm</div>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    getRankBadge(level) {
        const badges = ['🌱', '🥉', '🥈', '🥇', '💎', '💠', '👑'];
        return badges[Math.min(level - 1, badges.length - 1)] || '⭐';
    },

    getRarityColor(rarity) {
        const colors = {
            common: 'linear-gradient(135deg, #94a3b8, #64748b)',
            rare: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            epic: 'linear-gradient(135deg, #a855f7, #7e22ce)',
            legendary: 'linear-gradient(135deg, #f59e0b, #ea580c)'
        };
        return colors[rarity] || colors.common;
    },

    // ============= MEMBER PROFILE (PUBLIC) =============
    async renderMemberProfile(main, userId) {
        const member = await API.getMemberProfile(userId);

        main.innerHTML = `
            <div class="profile-header" style="background:var(--gradient-1)">
                <div class="container">
                    <div class="profile-content">
                        <div class="profile-avatar" style="width:120px;height:120px;font-size:48px">
                            ${(member.full_name || member.username).split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div class="profile-info">
                            <h1>${this._escapeHtml(member.full_name)}</h1>
                            <p><i class="fa-solid fa-id-card"></i> ${member.student_id || 'Chưa cập nhật'} · ${member.class_name || 'Chưa cập nhật lớp'}</p>
                            <p><i class="fa-solid fa-graduation-cap"></i> ${member.faculty || 'Chưa cập nhật'}</p>
                            <span class="profile-badge">${member.role === 'admin' ? '👑 Admin' : member.role === 'leader' ? '⭐ Chủ nhiệm CLB' : '🎓 Sinh viên'}</span>
                            ${API.isLoggedIn() && API.getUser().id !== member.id ? `
                            <div style="margin-top:12px;display:flex;gap:8px">
                                <button class="btn btn-primary" id="msgMemberBtn" data-user-id="${member.id}">
                                    <i class="fa-solid fa-comment"></i> Nhắn tin
                                </button>
                                <button class="btn btn-secondary" id="followMemberBtn" data-user-id="${member.id}">
                                    <i class="fa-solid fa-user-plus"></i> Follow
                                </button>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <section class="section">
                <div class="container">
                    <div class="grid grid-2" style="gap:24px">
                        <div>
                            <!-- Giới thiệu -->
                            <div class="card" style="margin-bottom:24px">
                                <h3 style="margin-bottom:16px"><i class="fa-solid fa-quote-left" style="color:var(--primary)"></i> Giới thiệu</h3>
                                <p style="color:var(--text-soft);line-height:1.8;font-size:15px">${member.bio || '<em style="color:var(--text-mute)">Chưa có giới thiệu</em>'}</p>
                            </div>

                            <!-- Kỹ năng -->
                            ${member.skills ? `
                            <div class="card" style="margin-bottom:24px">
                                <h3 style="margin-bottom:16px"><i class="fa-solid fa-code" style="color:var(--secondary)"></i> Kỹ năng</h3>
                                <div style="display:flex;flex-wrap:wrap;gap:8px">
                                    ${member.skills.split(',').map(s => `<span class="badge badge-primary" style="padding:6px 14px;font-size:13px">${s.trim()}</span>`).join('')}
                                </div>
                            </div>` : ''}

                            <!-- Sở thích -->
                            ${member.interests ? `
                            <div class="card" style="margin-bottom:24px">
                                <h3 style="margin-bottom:16px"><i class="fa-solid fa-heart" style="color:var(--danger)"></i> Sở thích</h3>
                                <p style="color:var(--text-soft);line-height:1.8">${member.interests}</p>
                            </div>` : ''}

                            <!-- Social -->
                            ${member.social_facebook || member.social_instagram || member.social_github ? `
                            <div class="card">
                                <h3 style="margin-bottom:16px"><i class="fa-solid fa-share-nodes" style="color:var(--info)"></i> Liên hệ</h3>
                                <div style="display:flex;gap:12px;flex-wrap:wrap">
                                    ${member.social_facebook ? `<a href="${member.social_facebook}" target="_blank" class="btn btn-secondary"><i class="fa-brands fa-facebook"></i> Facebook</a>` : ''}
                                    ${member.social_instagram ? `<a href="${member.social_instagram}" target="_blank" class="btn btn-secondary"><i class="fa-brands fa-instagram"></i> Instagram</a>` : ''}
                                    ${member.social_github ? `<a href="${member.social_github}" target="_blank" class="btn btn-secondary"><i class="fa-brands fa-github"></i> GitHub</a>` : ''}
                                </div>
                            </div>` : ''}
                        </div>

                        <div>
                            <!-- Stats -->
                            <div class="card" style="margin-bottom:24px">
                                <h3 style="margin-bottom:16px"><i class="fa-solid fa-chart-simple" style="color:var(--success)"></i> Thống kê</h3>
                                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
                                    <div>
                                        <div style="font-size:32px;font-weight:800;color:var(--primary)">${member.stats.clubs_joined}</div>
                                        <div style="font-size:12px;color:var(--text-mute)">CLB</div>
                                    </div>
                                    <div>
                                        <div style="font-size:32px;font-weight:800;color:var(--secondary)">${member.stats.events_attended}</div>
                                        <div style="font-size:12px;color:var(--text-mute)">Sự kiện</div>
                                    </div>
                                    <div>
                                        <div style="font-size:32px;font-weight:800;color:var(--accent)">${member.stats.posts_created}</div>
                                        <div style="font-size:12px;color:var(--text-mute)">Bài viết</div>
                                    </div>
                                </div>
                            </div>

                            <!-- CLB đang tham gia -->
                            <div class="card">
                                <h3 style="margin-bottom:16px"><i class="fa-solid fa-people-group" style="color:var(--warning)"></i> Câu lạc bộ (${member.clubs.length})</h3>
                                ${member.clubs.length ? `
                                <div style="display:flex;flex-direction:column;gap:12px">
                                    ${member.clubs.map(c => `
                                        <div onclick="App.navigate('club-detail',{id:${c.id}})" style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-soft);border-radius:var(--radius);cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='var(--bg-soft)'">
                                            <div style="width:48px;height:48px;border-radius:var(--radius);background:var(--gradient-1);color:white;display:grid;place-items:center;font-weight:700">
                                                ${getAIIcon(c.category, 32)}
                                            </div>
                                            <div style="flex:1">
                                                <div style="font-weight:600">${c.name}</div>
                                                <div style="font-size:12px;color:var(--text-mute)">${c.category} · ${c.role === 'president' ? '👑 Chủ nhiệm' : c.role === 'vice_president' ? '⭐ Phó CN' : 'Thành viên'}</div>
                                            </div>
                                            <i class="fa-solid fa-chevron-right" style="color:var(--text-mute)"></i>
                                        </div>
                                    `).join('')}
                                </div>
                                ` : '<p class="empty">Chưa tham gia CLB nào</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Bind message + follow buttons
        document.getElementById('msgMemberBtn')?.addEventListener('click', () => {
            App.navigate('messages', { user_id: userId });
        });
        document.getElementById('followMemberBtn')?.addEventListener('click', async (e) => {
            try {
                const r = await API.follow('user', userId);
                showToast(r.message, 'success');
                e.target.innerHTML = r.following
                    ? '<i class="fa-solid fa-check"></i> Đang follow'
                    : '<i class="fa-solid fa-user-plus"></i> Follow';
            } catch (err) { showToast(err.message, 'error'); }
        });
    },

    // ============= POST DETAIL (CÓ REACTIONS) =============
    async renderPostDetail(main, postId) {
        const post = await API.getPostFull(postId);
        const comments = await API.getComments('post', postId);
        const reactions = await API.getReactions('post', postId);
        const me = API.getUser();

        const reactionEmojis = { like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😠' };

        main.innerHTML = `
            <section class="section">
                <div class="container" style="max-width:900px">
                    <a onclick="App.navigate('posts')" style="cursor:pointer;color:var(--text-mute);font-size:14px">
                        <i class="fa-solid fa-arrow-left"></i> Quay lại
                    </a>
                    <article class="card" style="margin-top:16px">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                            <div style="width:48px;height:48px;border-radius:50%;background:var(--gradient-ai);color:white;display:grid;place-items:center;font-weight:700">
                                ${(post.author?.full_name || '?')[0]}
                            </div>
                            <div>
                                <div style="font-weight:600">${post.author?.full_name || 'Unknown'}</div>
                                <div style="font-size:12px;color:var(--text-mute)">${formatRelativeTime(post.created_at)}</div>
                            </div>
                        </div>
                        <h1 style="font-size:32px;margin-bottom:8px">${post.title}</h1>
                        <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">
                            <span class="badge badge-primary">${post.post_type}</span>
                            ${post.club ? `<span class="badge">${post.club.name}</span>` : ''}
                            <span class="badge"><i class="fa-solid fa-eye"></i> ${post.views}</span>
                            ${post.ai_keyword ? `<span class="badge badge-info"><i class="fa-solid fa-robot"></i> ${post.ai_keyword.split(',').slice(0, 2).join(', ')}</span>` : ''}
                        </div>
                        <div style="line-height:1.8;font-size:16px;color:var(--text-soft);white-space:pre-wrap">${post.content}</div>

                        <!-- Reactions bar -->
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:24px;padding-top:24px;border-top:1px solid var(--border)">
                            <div style="display:flex;gap:4px;flex-wrap:wrap">
                                ${Object.entries(reactionEmojis).map(([type, emoji]) => {
                                    const active = reactions.my_reaction === type;
                                    return `<button class="reaction-btn ${active ? 'active' : ''}" data-type="${type}" style="padding:8px 12px;border-radius:var(--radius);background:${active ? 'rgba(99,102,241,0.1)' : 'transparent'};border:1px solid ${active ? 'var(--primary)' : 'var(--border)'};font-size:18px;cursor:pointer;transition:all 0.2s" title="${type}">${emoji}</button>`;
                                }).join('')}
                            </div>
                            <div style="font-size:13px;color:var(--text-mute)">
                                <span id="reactionsTotal">${reactions.total}</span> reactions
                            </div>
                        </div>

                        ${reactions.total > 0 ? `
                        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                            ${Object.entries(reactions.summary).map(([type, data]) => `
                                <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--bg-soft);border-radius:var(--radius-full);font-size:12px">
                                    <span style="font-size:14px">${reactionEmojis[type]}</span>
                                    <strong>${data.count}</strong>
                                </span>
                            `).join('')}
                        </div>` : ''}
                    </article>

                    <!-- Comments -->
                    <div class="card" style="margin-top:16px">
                        <h3 style="margin-bottom:16px"><i class="fa-solid fa-comments"></i> Bình luận (${comments.length})</h3>
                        ${me ? `
                        <form id="commentForm" style="margin-bottom:24px;display:flex;gap:12px">
                            <div style="width:40px;height:40px;border-radius:50%;background:var(--gradient-1);color:white;display:grid;place-items:center;font-weight:700;flex-shrink:0">
                                ${(me.full_name || me.username || '?')[0]}
                            </div>
                            <div style="flex:1">
                                <textarea class="form-textarea" name="content" placeholder="Viết bình luận của bạn..." required maxlength="2000" style="min-height:80px"></textarea>
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
                                    <span style="font-size:12px;color:var(--text-mute)">Tối đa 2000 ký tự</span>
                                    <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i> Gửi</button>
                                </div>
                            </div>
                        </form>
                        ` : '<p style="color:var(--text-mute);margin-bottom:16px"><a data-page="login" style="cursor:pointer;color:var(--primary);font-weight:600">Đăng nhập</a> để bình luận</p>'}
                        <div id="commentsList">
                            ${comments.length ? comments.map(c => this._renderComment(c, me)).join('') : '<p class="empty"><i class="fa-regular fa-comment-dots"></i> Chưa có bình luận nào. Hãy là người đầu tiên!</p>'}
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Reaction handlers
        document.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!API.isLoggedIn()) { showToast('Vui lòng đăng nhập', 'warning'); return; }
                try {
                    await API.reactTo('post', postId, btn.dataset.type);
                    showToast('Đã ghi nhận reaction!', 'success');
                    App.navigate('post-detail', { id: postId });
                } catch (e) { showToast(e.message, 'error'); }
            });
        });

        const form = document.getElementById('commentForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const content = form.content.value.trim();
                if (!content) return;
                try {
                    await API.createComment({ target_type: 'post', target_id: postId, content });
                    showToast('Đã gửi bình luận!', 'success');
                    App.navigate('post-detail', { id: postId });
                } catch (err) { showToast(err.message, 'error'); }
            });
        }

        // Delete + like comment handlers
        document.querySelectorAll('.comment-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Xóa bình luận này?')) return;
                try {
                    await API.deleteComment(btn.dataset.id);
                    showToast('Đã xóa bình luận', 'success');
                    App.navigate('post-detail', { id: postId });
                } catch (e) { showToast(e.message, 'error'); }
            });
        });
        document.querySelectorAll('.comment-like').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!API.isLoggedIn()) { showToast('Vui lòng đăng nhập', 'warning'); return; }
                try {
                    const r = await API.likeComment(btn.dataset.id);
                    const span = btn.querySelector('.like-count');
                    if (span) span.textContent = r.likes;
                } catch (e) { showToast(e.message, 'error'); }
            });
        });
    },

    _renderComment(c, me) {
        const canDelete = me && (me.id === c.user_id || me.role === 'admin');
        const avatar = c.user_avatar
            ? `<img src="${c.user_avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0">`
            : `<div style="width:40px;height:40px;border-radius:50%;background:var(--gradient-1);color:white;display:grid;place-items:center;font-weight:700;flex-shrink:0">${(c.user_name || '?')[0]}</div>`;
        const roleBadge = c.user_role === 'admin' ? '<span class="badge badge-primary" style="font-size:10px;margin-left:4px">Admin</span>' : '';
        return `
            <div class="comment-item" style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-soft)">
                ${avatar}
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
                        <strong style="font-size:14px">${c.user_name || 'Unknown'}</strong>${roleBadge}
                        <span style="color:var(--text-mute);font-size:12px;margin-left:8px">${formatRelativeTime(c.created_at)}</span>
                    </div>
                    <p style="margin-top:4px;color:var(--text-soft);white-space:pre-wrap;word-wrap:break-word">${this._escapeHtml(c.content)}</p>
                    <div style="display:flex;gap:12px;margin-top:6px;align-items:center">
                        <button class="comment-like" data-id="${c.id}" style="background:none;border:none;color:var(--text-mute);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;padding:2px 6px;border-radius:6px;transition:all 0.2s" onmouseover="this.style.background='var(--bg-soft)'" onmouseout="this.style.background='none'">
                            <i class="fa-regular fa-heart"></i> <span class="like-count">${c.likes || 0}</span>
                        </button>
                        ${canDelete ? `<button class="comment-delete" data-id="${c.id}" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;padding:2px 6px;border-radius:6px;transition:all 0.2s" onmouseover="this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.background='none'">
                            <i class="fa-solid fa-trash"></i> Xóa
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    _escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    },

    // ============= CALENDAR =============
    async renderCalendar(main, params = {}) {
        const month = params.month || new Date().getMonth() + 1;
        const year = params.year || new Date().getFullYear();
        const data = await API.getEventsCalendar(month, year);

        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthName = `Tháng ${month}/${year}`;

        // Build calendar grid
        let calendar = '';
        for (let i = 0; i < firstDay; i++) calendar += '<div class="cal-day empty"></div>';
        for (let d = 1; d <= daysInMonth; d++) {
            const events = data.events_by_day[d] || [];
            const today = d === new Date().getDate() && month === new Date().getMonth() + 1 && year === new Date().getFullYear();
            calendar += `
                <div class="cal-day ${today ? 'today' : ''}">
                    <div class="cal-day-num">${d}</div>
                    ${events.slice(0, 3).map(e => `
                        <div class="cal-event" onclick="App.navigate('event-detail',{id:${e.id}})">
                            ${e.time} ${e.title}
                        </div>
                    `).join('')}
                    ${events.length > 3 ? `<div class="cal-more">+${events.length - 3} sự kiện</div>` : ''}
                </div>
            `;
        }

        main.innerHTML = `
            <section class="section">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow">Lịch sự kiện</span>
                        <h2 class="section-title">${monthName}</h2>
                        <p class="section-subtitle">${data.total_events} sự kiện trong tháng</p>
                    </div>

                    <div class="calendar-nav" style="display:flex;gap:12px;justify-content:center;margin-bottom:24px">
                        <button class="btn btn-secondary" id="prevMonth">
                            <i class="fa-solid fa-chevron-left"></i> Tháng trước
                        </button>
                        <button class="btn btn-secondary" id="todayBtn">Hôm nay</button>
                        <button class="btn btn-secondary" id="nextMonth">
                            Tháng sau <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>

                    <div class="calendar-grid">
                        <div class="cal-header">CN</div>
                        <div class="cal-header">T2</div>
                        <div class="cal-header">T3</div>
                        <div class="cal-header">T4</div>
                        <div class="cal-header">T5</div>
                        <div class="cal-header">T6</div>
                        <div class="cal-header">T7</div>
                        ${calendar}
                    </div>
                </div>
            </section>
        `;

        main.querySelector('#prevMonth').addEventListener('click', () => {
            let m = month - 1, y = year;
            if (m < 1) { m = 12; y--; }
            App.navigate('calendar', { month: m, year: y });
        });
        main.querySelector('#nextMonth').addEventListener('click', () => {
            let m = month + 1, y = year;
            if (m > 12) { m = 1; y++; }
            App.navigate('calendar', { month: m, year: y });
        });
        main.querySelector('#todayBtn').addEventListener('click', () => {
            const now = new Date();
            App.navigate('calendar', { month: now.getMonth() + 1, year: now.getFullYear() });
        });
    },

    // ============= TIMELINE =============
    async renderTimeline(main) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }
        const data = await API.myTimeline(90);

        main.innerHTML = `
            <section class="section">
                <div class="container" style="max-width:800px">
                    <div class="section-header">
                        <span class="section-eyebrow">Hoạt động của tôi</span>
                        <h2 class="section-title">Dòng thời gian</h2>
                        <p class="section-subtitle">${data.stats.clubs_joined} CLB · ${data.stats.events_registered} sự kiện · ${data.stats.posts_created} bài viết trong 90 ngày</p>
                    </div>

                    <div class="timeline">
                        ${data.items.length ? data.items.map(item => `
                            <div class="timeline-item">
                                <div class="timeline-dot"><i class="fa-solid ${item.icon}" style="color:white;font-size:10px;margin-left:3px"></i></div>
                                <div class="timeline-content">
                                    <div class="timeline-date">${formatRelativeTime(item.time)}</div>
                                    <div class="timeline-title">${item.title}</div>
                                    <div class="timeline-desc">${item.description || ''}</div>
                                </div>
                            </div>
                        `).join('') : '<p class="empty">Chưa có hoạt động nào. Hãy tham gia CLB!</p>'}
                    </div>
                </div>
            </section>
        `;
    },

    // ============= POLLS =============
    async renderPolls(main, params = {}) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }
        const clubs = await API.getClubs();
        const clubId = params.club_id || clubs[0]?.id;

        if (!clubId) {
            main.innerHTML = '<p class="empty">Chưa có CLB nào</p>';
            return;
        }

        const polls = await API.listPolls(clubId);
        const club = clubs.find(c => c.id === clubId);

        main.innerHTML = `
            <section class="section">
                <div class="container">
                    <div class="section-header">
                        <span class="section-eyebrow">Bình chọn</span>
                        <h2 class="section-title">Polls & Khảo sát</h2>
                        <p class="section-subtitle">Đóng góp ý kiến cho câu lạc bộ</p>
                    </div>

                    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:32px">
                        ${clubs.map(c => `
                            <button class="filter-pill ${c.id === clubId ? 'active' : ''}" data-club="${c.id}">
                                ${c.name}
                            </button>
                        `).join('')}
                    </div>

                    <div style="max-width:800px;margin:0 auto">
                        <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
                            <button class="btn btn-primary" id="createPollBtn">
                                <i class="fa-solid fa-plus"></i> Tạo poll mới
                            </button>
                        </div>
                        ${polls.length ? polls.map(p => `
                            <div class="card" style="margin-bottom:16px">
                                <h3 style="margin-bottom:8px"><i class="fa-solid fa-square-poll-vertical" style="color:var(--primary)"></i> ${this._escapeHtml(p.question)}</h3>
                                ${p.description ? `<p style="color:var(--text-mute);font-size:14px;margin-bottom:12px">${this._escapeHtml(p.description)}</p>` : ''}
                                <div style="font-size:12px;color:var(--text-mute)">
                                    <i class="fa-solid fa-users"></i> ${p.total_votes || 0} lượt vote · ${p.is_multiple ? 'Chọn nhiều' : 'Chọn một'} · ${p.is_anonymous ? 'Ẩn danh' : 'Công khai'}
                                </div>
                                <button class="btn btn-primary" data-pollid="${p.id}" style="margin-top:12px">Xem & Vote</button>
                            </div>
                        `).join('') : '<p class="empty">Chưa có poll nào trong CLB này</p>'}
                    </div>
                </div>
            </section>
        `;

        document.querySelectorAll('.filter-pill').forEach(b => {
            b.addEventListener('click', () => App.navigate('polls', { club_id: parseInt(b.dataset.club) }));
        });

        document.querySelectorAll('[data-pollid]').forEach(b => {
            b.addEventListener('click', () => showPollDetail(parseInt(b.dataset.pollid), main));
        });

        document.getElementById('createPollBtn')?.addEventListener('click', () => this._showCreatePollModal(clubId));
    },

    _showCreatePollModal(clubId) {
        const overlay = document.createElement('div');
        overlay.id = 'createPollOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';
        overlay.innerHTML = `
            <div style="background:var(--surface);border-radius:16px;padding:24px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3 style="margin:0"><i class="fa-solid fa-square-poll-vertical" style="color:var(--primary)"></i> Tạo poll mới</h3>
                    <button id="closeCreatePoll" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text)"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form id="createPollForm">
                    <div style="margin-bottom:12px">
                        <label style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Câu hỏi *</label>
                        <input type="text" name="question" class="form-input" required maxlength="500" placeholder="VD: Bạn thích hoạt động nào?">
                    </div>
                    <div style="margin-bottom:12px">
                        <label style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Mô tả</label>
                        <textarea name="description" class="form-textarea" maxlength="1000" rows="2" placeholder="Mô tả thêm (tùy chọn)"></textarea>
                    </div>
                    <div style="margin-bottom:12px">
                        <label style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Các lựa chọn *</label>
                        <div id="pollOptions">
                            <input type="text" class="form-input poll-opt-input" required maxlength="200" placeholder="Lựa chọn 1" style="margin-bottom:6px">
                            <input type="text" class="form-input poll-opt-input" required maxlength="200" placeholder="Lựa chọn 2" style="margin-bottom:6px">
                        </div>
                        <button type="button" id="addOptBtn" style="background:none;border:1px dashed var(--border);padding:6px 12px;border-radius:8px;cursor:pointer;color:var(--text-mute);font-size:13px;width:100%">
                            <i class="fa-solid fa-plus"></i> Thêm lựa chọn
                        </button>
                    </div>
                    <div style="display:flex;gap:16px;margin-bottom:16px;font-size:14px">
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
                            <input type="checkbox" name="is_multiple"> Chọn nhiều đáp án
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
                            <input type="checkbox" name="is_anonymous"> Ẩn danh
                        </label>
                    </div>
                    <div style="display:flex;gap:8px;justify-content:flex-end">
                        <button type="button" id="cancelCreatePoll" class="btn btn-secondary">Hủy</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Tạo poll</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        document.getElementById('closeCreatePoll').onclick = close;
        document.getElementById('cancelCreatePoll').onclick = close;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        let optCount = 2;
        document.getElementById('addOptBtn').onclick = () => {
            if (optCount >= 10) { showToast('Tối đa 10 lựa chọn', 'warning'); return; }
            optCount++;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-input poll-opt-input';
            input.required = true;
            input.maxLength = 200;
            input.placeholder = `Lựa chọn ${optCount}`;
            input.style.cssText = 'margin-bottom:6px';
            document.getElementById('pollOptions').appendChild(input);
        };

        document.getElementById('createPollForm').onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const options = Array.from(document.querySelectorAll('.poll-opt-input'))
                .map(i => i.value.trim()).filter(Boolean);
            if (options.length < 2) { showToast('Cần ít nhất 2 lựa chọn', 'warning'); return; }
            try {
                await API.createPoll({
                    club_id: clubId,
                    question: fd.get('question'),
                    description: fd.get('description') || null,
                    options,
                    is_multiple: !!fd.get('is_multiple'),
                    is_anonymous: !!fd.get('is_anonymous'),
                });
                showToast('Tạo poll thành công!', 'success');
                close();
                App.navigate('polls', { club_id: clubId });
            } catch (err) { showToast(err.message, 'error'); }
        };
    },

    async _loadClubDocuments(clubId) {
        const listEl = document.getElementById('documentsList');
        if (!listEl) return;
        try {
            const docs = await API.listDocuments(clubId);
            if (!docs.length) {
                listEl.innerHTML = `<p class="empty" style="padding:30px;text-align:center"><i class="fa-regular fa-folder-open" style="font-size:48px;color:var(--text-mute);opacity:0.3"></i><br>Chưa có tài liệu nào</p>`;
                return;
            }
            listEl.innerHTML = docs.map(d => {
                const icon = this._docIcon(d.file_type || d.file_name);
                const size = d.file_size ? ` · ${(d.file_size / 1024).toFixed(1)} KB` : '';
                return `
                <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-soft);border-radius:10px;margin-bottom:8px">
                    <div style="width:44px;height:44px;background:white;border-radius:8px;display:grid;place-items:center;font-size:24px;color:var(--primary)">${icon}</div>
                    <div style="flex:1;min-width:0">
                        <div style="font-weight:600;font-size:14px">${this._escapeHtml(d.title)}</div>
                        <div style="font-size:12px;color:var(--text-mute)">
                            ${d.uploader_name || ''} · ${formatRelativeTime(d.created_at)}${size}
                            ${d.category ? ` · <span class="badge">${this._escapeHtml(d.category)}</span>` : ''}
                        </div>
                        ${d.description ? `<div style="font-size:13px;color:var(--text-soft);margin-top:4px">${this._escapeHtml(d.description)}</div>` : ''}
                    </div>
                    ${d.file_url ? `<a href="${d.file_url}" target="_blank" class="btn btn-sm btn-secondary" title="Tải về"><i class="fa-solid fa-download"></i></a>` : ''}
                </div>`;
            }).join('');
        } catch (e) {
            listEl.innerHTML = `<p class="empty">Lỗi: ${e.message}</p>`;
        }
    },

    _docIcon(name) {
        if (!name) return '📄';
        const ext = (name.split('.').pop() || '').toLowerCase();
        if (['pdf'].includes(ext)) return '📕';
        if (['doc', 'docx'].includes(ext)) return '📘';
        if (['xls', 'xlsx'].includes(ext)) return '📗';
        if (['ppt', 'pptx'].includes(ext)) return '📙';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
        if (['mp4', 'mov', 'avi'].includes(ext)) return '🎬';
        if (['zip', 'rar', '7z'].includes(ext)) return '📦';
        return '📄';
    },

    _showAddDocumentModal(clubId) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';
        overlay.innerHTML = `
            <div style="background:var(--surface);border-radius:16px;padding:24px;max-width:500px;width:100%">
                <h3 style="margin-bottom:20px"><i class="fa-solid fa-folder-plus" style="color:var(--primary)"></i> Thêm tài liệu</h3>
                <form id="addDocForm">
                    <div style="margin-bottom:12px">
                        <label style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Tiêu đề *</label>
                        <input type="text" name="title" class="form-input" required maxlength="200" placeholder="VD: Điều lệ CLB 2026">
                    </div>
                    <div style="margin-bottom:12px">
                        <label style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Mô tả</label>
                        <textarea name="description" class="form-textarea" rows="2" maxlength="500" placeholder="Mô tả ngắn (tùy chọn)"></textarea>
                    </div>
                    <div style="margin-bottom:12px">
                        <label style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Danh mục</label>
                        <select name="category" class="form-input">
                            <option value="">-- Chọn --</option>
                            <option value="Quy chế">Quy chế</option>
                            <option value="Biểu mẫu">Biểu mẫu</option>
                            <option value="Tài liệu học tập">Tài liệu học tập</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    <div style="margin-bottom:12px">
                        <label style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Link file (URL)</label>
                        <input type="url" name="file_url" class="form-input" placeholder="https://drive.google.com/...">
                        <p style="font-size:12px;color:var(--text-mute);margin-top:4px">Upload lên Google Drive/Dropbox rồi paste link vào đây</p>
                    </div>
                    <div style="display:flex;gap:8px;justify-content:flex-end">
                        <button type="button" id="cancelAddDoc" class="btn btn-secondary">Hủy</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Thêm</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
        const close = () => overlay.remove();
        document.getElementById('cancelAddDoc').onclick = close;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.getElementById('addDocForm').onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
                await API.addDocument(clubId, {
                    title: fd.get('title'),
                    description: fd.get('description') || null,
                    category: fd.get('category') || null,
                    file_url: fd.get('file_url') || null,
                });
                showToast('Đã thêm tài liệu!', 'success');
                close();
                this._loadClubDocuments(clubId);
            } catch (err) { showToast(err.message, 'error'); }
        };
    },

    // ============= CLUB MANAGE (CHO CHỦ NHIỆM) =============
    async renderClubManage(main, clubId) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }
        const data = await API.getClubManageData(clubId);
        const tasks = await API.listTasks(clubId);

        main.innerHTML = `
            <section class="section" style="background:linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);color:white;padding:48px 0">
                <div class="container">
                    <div style="display:flex;align-items:center;gap:16px">
                        <div style="width:64px;height:64px;background:rgba(255,255,255,0.1);border-radius:16px;display:grid;place-items:center;font-size:32px">
                            <i class="fa-solid fa-gear"></i>
                        </div>
                        <div>
                            <h1 style="color:white;margin:0;font-size:32px">Quản lý: ${data.club.name}</h1>
                            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0">Trang quản trị dành cho chủ nhiệm CLB</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    <!-- Stats -->
                    <div class="grid grid-4 stagger" style="margin-bottom:24px">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
                            <div class="stat-info"><h3>${data.members.length}</h3><p>Thành viên</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon green"><i class="fa-solid fa-calendar"></i></div>
                            <div class="stat-info"><h3>${data.stats.upcoming_events}</h3><p>Sự kiện sắp tới</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon pink"><i class="fa-solid fa-newspaper"></i></div>
                            <div class="stat-info"><h3>${data.stats.total_posts}</h3><p>Bài viết</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon blue"><i class="fa-solid fa-list-check"></i></div>
                            <div class="stat-info"><h3>${data.stats.completed_tasks}/${data.stats.total_tasks}</h3><p>Task hoàn thành</p></div>
                        </div>
                    </div>

                    <!-- Tabs -->
                    <div class="card">
                        <div class="tabs">
                            <div class="tab active" data-mtab="members">👥 Thành viên (${data.members.length})</div>
                            <div class="tab" data-mtab="tasks">📋 Nhiệm vụ (${tasks.length})</div>
                            <div class="tab" data-mtab="settings">⚙️ Cài đặt CLB</div>
                        </div>

                        <!-- Tab Members -->
                        <div id="mtab-members" class="tab-content">
                            <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
                                <input class="form-input" id="memberSearch" placeholder="Tìm thành viên..." style="max-width:300px">
                                <button class="btn btn-primary" style="margin-left:auto" data-page="create-event" data-id="${clubId}">
                                    <i class="fa-solid fa-plus"></i> Tạo sự kiện
                                </button>
                            </div>
                            <div id="membersList">
                                ${this.renderManageMembers(data.members)}
                            </div>
                        </div>

                        <!-- Tab Tasks -->
                        <div id="mtab-tasks" class="tab-content" hidden>
                            <div style="display:flex;gap:8px;margin-bottom:16px">
                                <select class="form-select" id="filterStatus" style="max-width:200px">
                                    <option value="all">Tất cả</option>
                                    <option value="todo">📝 Cần làm</option>
                                    <option value="in_progress">⚡ Đang làm</option>
                                    <option value="done">✅ Hoàn thành</option>
                                </select>
                                <button class="btn btn-primary" style="margin-left:auto" id="addTaskBtn">
                                    <i class="fa-solid fa-plus"></i> Tạo task
                                </button>
                            </div>
                            <div id="tasksList">
                                ${this.renderManageTasks(tasks, data.members)}
                            </div>
                        </div>

                        <!-- Tab Settings -->
                        <div id="mtab-settings" class="tab-content" hidden>
                            <p style="color:var(--text-mute)">Cài đặt CLB đang phát triển...</p>
                            <p>Các tùy chọn: chỉnh sửa thông tin CLB, phân quyền, xuất dữ liệu...</p>
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Tabs handler
        document.querySelectorAll('[data-mtab]').forEach(t => {
            t.addEventListener('click', () => {
                document.querySelectorAll('[data-mtab]').forEach(x => x.classList.remove('active'));
                document.querySelectorAll('[id^="mtab-"]').forEach(x => x.hidden = true);
                t.classList.add('active');
                document.getElementById('mtab-' + t.dataset.mtab).hidden = false;
            });
        });

        // Search members
        document.getElementById('memberSearch')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = data.members.filter(m =>
                m.full_name.toLowerCase().includes(q) ||
                (m.student_id && m.student_id.toLowerCase().includes(q))
            );
            document.getElementById('membersList').innerHTML = this.renderManageMembers(filtered);
        });

        // Add task
        document.getElementById('addTaskBtn')?.addEventListener('click', () => this.showTaskForm(clubId, data.members));

        // Task checkboxes
        document.querySelectorAll('.task-check').forEach((cb) => {
            cb.addEventListener('change', async () => {
                const taskEl = cb.closest('.task-item');
                const taskId = taskEl.dataset.id;
                const newStatus = cb.checked ? 'done' : 'todo';
                try {
                    await API.updateTask(parseInt(taskId), { status: newStatus });
                    showToast(newStatus === 'done' ? '🎉 Hoàn thành!' : 'Đã cập nhật', 'success');
                    setTimeout(() => App.navigate('club-manage', { id: clubId }), 500);
                } catch (e) { showToast(e.message, 'error'); }
            });
        });

        // Task delete
        document.querySelectorAll('.task-del').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Xóa task này?')) return;
                try {
                    await API.deleteTask(parseInt(btn.dataset.id));
                    showToast('Đã xóa task', 'success');
                    App.navigate('club-manage', { id: clubId });
                } catch (e) { showToast(e.message, 'error'); }
            });
        });
    },

    renderManageMembers(members) {
        return members.map(m => `
            <div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--border-soft)">
                <div style="width:48px;height:48px;border-radius:50%;background:var(--gradient-1);color:white;display:grid;place-items:center;font-weight:700">
                    ${(m.full_name || '?').split(' ').slice(-1)[0][0]}
                </div>
                <div style="flex:1">
                    <div style="font-weight:600">${m.full_name}</div>
                    <div style="font-size:12px;color:var(--text-mute)">${m.student_id || ''} · ${m.class_name || ''}</div>
                </div>
                <span class="badge ${m.role === 'president' ? 'badge-danger' : m.role === 'vice_president' ? 'badge-warning' : 'badge-primary'}">
                    ${m.role === 'president' ? '👑 Chủ nhiệm' : m.role === 'vice_president' ? '⭐ Phó CN' : 'Thành viên'}
                </span>
                <button class="btn btn-secondary btn-sm" onclick="App.navigate('member-profile',{id:${m.user_id}})">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </div>
        `).join('');
    },

    renderManageTasks(tasks, members) {
        if (tasks.length === 0) return '<p class="empty">Chưa có task nào. Tạo task đầu tiên!</p>';
        return tasks.map(t => {
            const statusBadge = t.status === 'done' ? 'badge-success' : t.status === 'in_progress' ? 'badge-warning' : 'badge-info';
            const statusText = t.status === 'done' ? '✅ Hoàn thành' : t.status === 'in_progress' ? '⚡ Đang làm' : '📝 Cần làm';
            const priorityColor = t.priority === 'high' ? 'var(--danger)' : t.priority === 'low' ? 'var(--text-mute)' : 'var(--warning)';
            return `
                <div class="task-item" data-status="${t.status}" data-id="${t.id}" data-club="${t.club_id || members[0]?.user_id || 1}" style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--bg-soft);border-radius:var(--radius);margin-bottom:8px;border-left:4px solid ${priorityColor}">
                    <input type="checkbox" class="task-check" ${t.status === 'done' ? 'checked' : ''} style="width:20px;height:20px;cursor:pointer">
                    <div style="flex:1">
                        <div style="font-weight:600;${t.status === 'done' ? 'text-decoration:line-through;opacity:0.6' : ''}">${t.title}</div>
                        ${t.description ? `<div style="font-size:12px;color:var(--text-mute);margin-top:4px">${t.description}</div>` : ''}
                        <div style="display:flex;gap:12px;margin-top:6px;font-size:11px">
                            ${t.assignee_name ? `<span><i class="fa-solid fa-user"></i> ${t.assignee_name}</span>` : ''}
                            ${t.due_date ? `<span><i class="fa-solid fa-clock"></i> ${formatDate(t.due_date)}</span>` : ''}
                            <span class="badge ${statusBadge}" style="font-size:10px">${statusText}</span>
                        </div>
                    </div>
                    <button class="btn btn-secondary btn-sm task-del" data-id="${t.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
    },

    showTaskForm(clubId, members) {
        // Tạo modal đơn giản
        const html = `
            <div class="modal-overlay" id="taskModal" onclick="if(event.target===this) document.getElementById('taskModal').remove()">
                <div class="modal" style="max-width:500px">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-list-check"></i> Tạo task mới</h3>
                        <button onclick="document.getElementById('taskModal').remove()" class="btn-icon"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="taskForm">
                            <div class="form-group">
                                <label class="form-label">Tiêu đề *</label>
                                <input class="form-input" name="title" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Mô tả</label>
                                <textarea class="form-textarea" name="description" rows="3"></textarea>
                            </div>
                            <div class="grid grid-2" style="gap:12px">
                                <div class="form-group">
                                    <label class="form-label">Người thực hiện</label>
                                    <select class="form-select" name="assignee_id">
                                        <option value="">-- Chọn --</option>
                                        ${members.map(m => `<option value="${m.user_id}">${m.full_name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Độ ưu tiên</label>
                                    <select class="form-select" name="priority">
                                        <option value="low">🟢 Thấp</option>
                                        <option value="medium" selected>🟡 Trung bình</option>
                                        <option value="high">🔴 Cao</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Deadline</label>
                                <input class="form-input" name="due_date" type="date">
                            </div>
                            <button type="submit" class="btn btn-primary" style="width:100%">Tạo task</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('taskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = Object.fromEntries(fd);
            if (payload.assignee_id) payload.assignee_id = parseInt(payload.assignee_id);
            try {
                await API.createTask(clubId, payload);
                showToast('Tạo task thành công!', 'success');
                document.getElementById('taskModal').remove();
                App.navigate('club-manage', { id: clubId });
            } catch (err) { showToast(err.message, 'error'); }
        });
    },

    // ============= SETTINGS (CÀI ĐẶT) =============
    async renderSettings(main) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }
        const u = API.getUser();
        const isAdmin = API.isAdmin();

        main.innerHTML = `
            <section class="section" style="background:linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);color:white;padding:48px 0">
                <div class="container">
                    <div style="display:flex;align-items:center;gap:16px">
                        <div style="width:64px;height:64px;background:rgba(255,255,255,0.1);border-radius:16px;display:grid;place-items:center;font-size:32px">
                            <i class="fa-solid fa-gear"></i>
                        </div>
                        <div>
                            <h1 style="color:white;margin:0;font-size:32px">Cài đặt</h1>
                            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0">Quản lý tài khoản và tùy chọn hệ thống</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="container" style="max-width:900px">
                    <div class="card">
                        <div class="tabs">
                            <div class="tab active" data-stab="account">👤 Tài khoản</div>
                            <div class="tab" data-stab="security">🔒 Bảo mật</div>
                            <div class="tab" data-stab="notifications">🔔 Thông báo</div>
                            <div class="tab" data-stab="admin">⚙️ Quản trị ${isAdmin ? '' : '(chỉ Admin)'}</div>
                            <div class="tab" data-stab="session">🚪 Phiên đăng nhập</div>
                        </div>

                        <!-- Tab Tài khoản -->
                        <div id="stab-account" class="tab-content">
                            <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--border)">
                                <div id="userAvatar" style="width:80px;height:80px;border-radius:50%;background:var(--gradient-ai);color:white;display:grid;place-items:center;font-size:32px;font-weight:800;overflow:hidden;flex-shrink:0;cursor:pointer;position:relative" title="Click để đổi avatar">
                                    ${u.avatar
                                        ? `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover">`
                                        : (u.full_name || u.username).split(' ').slice(-1)[0][0]}
                                    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;color:white;font-size:12px" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                                        <i class="fa-solid fa-camera"></i>
                                    </div>
                                </div>
                                <input type="file" id="avatarInput" accept="image/*" hidden>
                                <div style="flex:1">
                                    <h3>${u.full_name}</h3>
                                    <p style="color:var(--text-mute);margin:4px 0">@${u.username} · ${u.email}</p>
                                    <span class="badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'leader' ? 'badge-warning' : 'badge-primary'}">
                                        ${u.role === 'admin' ? '👑 Admin' : u.role === 'leader' ? '⭐ Chủ nhiệm' : '🎓 Sinh viên'}
                                    </span>
                                </div>
                                <a class="btn btn-secondary" data-page="profile">
                                    <i class="fa-solid fa-user-edit"></i> Sửa profile
                                </a>
                            </div>

                            <h4 style="margin-bottom:16px"><i class="fa-solid fa-info-circle"></i> Thông tin tài khoản</h4>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                                <div style="padding:12px;background:var(--bg-soft);border-radius:var(--radius)">
                                    <div style="font-size:12px;color:var(--text-mute)">Mã sinh viên</div>
                                    <div style="font-weight:600">${u.student_id || 'Chưa cập nhật'}</div>
                                </div>
                                <div style="padding:12px;background:var(--bg-soft);border-radius:var(--radius)">
                                    <div style="font-size:12px;color:var(--text-mute)">Lớp</div>
                                    <div style="font-weight:600">${u.class_name || 'Chưa cập nhật'}</div>
                                </div>
                                <div style="padding:12px;background:var(--bg-soft);border-radius:var(--radius)">
                                    <div style="font-size:12px;color:var(--text-mute)">Khoa</div>
                                    <div style="font-weight:600">${u.faculty || 'Chưa cập nhật'}</div>
                                </div>
                                <div style="padding:12px;background:var(--bg-soft);border-radius:var(--radius)">
                                    <div style="font-size:12px;color:var(--text-mute)">Số điện thoại</div>
                                    <div style="font-weight:600">${u.phone || 'Chưa cập nhật'}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Tab Thông báo -->
                        <div id="stab-notifications" class="tab-content" hidden>
                            <h4 style="margin-bottom:16px"><i class="fa-solid fa-bell"></i> Cài đặt thông báo</h4>
                            <p style="color:var(--text-mute);margin-bottom:16px">Chọn cách bạn muốn nhận thông báo</p>

                            <div id="notifPrefContent">
                                <p style="text-align:center;color:var(--text-mute);padding:20px"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</p>
                            </div>
                        </div>

                        <!-- Tab Bảo mật -->
                        <div id="stab-security" class="tab-content" hidden>
                            <h4 style="margin-bottom:16px"><i class="fa-solid fa-key"></i> Đổi mật khẩu</h4>
                            <form id="passwordForm" style="max-width:500px">
                                <div class="form-group">
                                    <label class="form-label">Mật khẩu hiện tại</label>
                                    <input class="form-input" name="old_password" type="password" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                                    <input class="form-input" name="new_password" type="password" required minlength="6">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Xác nhận mật khẩu mới</label>
                                    <input class="form-input" name="confirm_password" type="password" required minlength="6">
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fa-solid fa-key"></i> Đổi mật khẩu
                                </button>
                            </form>
                        </div>

                        <!-- Tab Quản trị (chỉ admin) -->
                        <div id="stab-admin" class="tab-content" hidden>
                            ${isAdmin ? `
                            <h4 style="margin-bottom:16px"><i class="fa-solid fa-shield-halved"></i> Công cụ quản trị</h4>
                            <div class="grid grid-2 stagger">
                                <a class="card" data-page="admin" style="text-decoration:none;color:inherit;cursor:pointer">
                                    <div style="display:flex;align-items:center;gap:12px">
                                        <div class="stat-icon"><i class="fa-solid fa-gauge-high"></i></div>
                                        <div>
                                            <h4>Admin Dashboard</h4>
                                            <p style="font-size:13px;color:var(--text-mute)">Thống kê & quản lý hệ thống</p>
                                        </div>
                                    </div>
                                </a>
                                <a class="card" data-page="create-club" style="text-decoration:none;color:inherit;cursor:pointer">
                                    <div style="display:flex;align-items:center;gap:12px">
                                        <div class="stat-icon green"><i class="fa-solid fa-plus"></i></div>
                                        <div>
                                            <h4>Tạo CLB mới</h4>
                                            <p style="font-size:13px;color:var(--text-mute)">Thêm CLB cho hệ thống</p>
                                        </div>
                                    </div>
                                </a>
                                <a class="card" data-page="create-event" style="text-decoration:none;color:inherit;cursor:pointer">
                                    <div style="display:flex;align-items:center;gap:12px">
                                        <div class="stat-icon pink"><i class="fa-solid fa-calendar-plus"></i></div>
                                        <div>
                                            <h4>Tạo sự kiện</h4>
                                            <p style="font-size:13px;color:var(--text-mute)">Tạo sự kiện toàn trường</p>
                                        </div>
                                    </div>
                                </a>
                                <a class="card" data-page="ai-insights" style="text-decoration:none;color:inherit;cursor:pointer">
                                    <div style="display:flex;align-items:center;gap:12px">
                                        <div class="stat-icon blue"><i class="fa-solid fa-brain"></i></div>
                                        <div>
                                            <h4>AI Insights</h4>
                                            <p style="font-size:13px;color:var(--text-mute)">Phân tích AI nâng cao</p>
                                        </div>
                                    </div>
                                </a>
                            </div>

                            <h4 style="margin:24px 0 16px"><i class="fa-solid fa-server"></i> Thông tin hệ thống</h4>
                            <div style="background:var(--bg-soft);border-radius:var(--radius);padding:16px">
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
                                    <div><strong>Phiên bản:</strong> 1.0.0</div>
                                    <div><strong>AI Engine:</strong> Ollama llama3.2</div>
                                    <div><strong>Database:</strong> SQLite + SQLAlchemy</div>
                                    <div><strong>Backend:</strong> FastAPI</div>
                                    <div><strong>Frontend:</strong> Vanilla JS</div>
                                    <div><strong>Ngày tạo:</strong> 2026</div>
                                </div>
                            </div>
                            ` : `
                            <div style="text-align:center;padding:40px 20px;color:var(--text-mute)">
                                <i class="fa-solid fa-lock" style="font-size:48px;opacity:0.3;margin-bottom:16px"></i>
                                <h4>Bạn không có quyền truy cập</h4>
                                <p>Chỉ Admin mới có thể truy cập mục này</p>
                            </div>
                            `}
                            ${isAdmin ? `
                            <div style="margin-top:16px">
                                <a class="btn btn-primary" data-page="admin-users" style="width:100%">
                                    <i class="fa-solid fa-users-gear"></i> Quản lý Users (Nâng cao)
                                </a>
                            </div>` : ''}
                        </div>

                        <!-- Tab Phiên đăng nhập -->
                        <div id="stab-session" class="tab-content" hidden>
                            <h4 style="margin-bottom:16px"><i class="fa-solid fa-user-check"></i> Phiên đăng nhập hiện tại</h4>
                            <div style="background:var(--bg-soft);border-radius:var(--radius);padding:20px;margin-bottom:24px">
                                <div style="display:flex;align-items:center;gap:16px">
                                    <div style="width:56px;height:56px;border-radius:50%;background:var(--gradient-ai);color:white;display:grid;place-items:center;font-weight:700;font-size:20px">
                                        ${(u.full_name || u.username).split(' ').slice(-1)[0][0]}
                                    </div>
                                    <div style="flex:1">
                                        <div style="font-weight:600;font-size:16px">${u.full_name}</div>
                                        <div style="font-size:13px;color:var(--text-mute)">@${u.username} · ${u.email}</div>
                                        <div style="font-size:12px;color:var(--text-mute);margin-top:4px">
                                            <i class="fa-solid fa-circle" style="color:#10b981;font-size:8px"></i> Đang đăng nhập
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h4 style="margin-bottom:16px"><i class="fa-solid fa-right-from-bracket"></i> Hành động</h4>
                            <div style="display:flex;flex-direction:column;gap:12px">
                                <button class="btn btn-secondary" data-page="login" style="justify-content:flex-start">
                                    <i class="fa-solid fa-right-to-bracket"></i> Đăng nhập tài khoản khác
                                </button>
                                <button class="btn btn-secondary" data-page="register" style="justify-content:flex-start">
                                    <i class="fa-solid fa-user-plus"></i> Đăng ký tài khoản mới
                                </button>
                                <button class="btn btn-danger" id="logoutBtn" style="justify-content:flex-start;background:linear-gradient(135deg, #ef4444, #dc2626);color:white">
                                    <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất khỏi hệ thống
                                </button>
                            </div>

                            <div style="margin-top:24px;padding:16px;background:rgba(239, 68, 68, 0.05);border:1px solid rgba(239, 68, 68, 0.2);border-radius:var(--radius)">
                                <h4 style="color:var(--danger);margin-bottom:8px"><i class="fa-solid fa-triangle-exclamation"></i> Vùng nguy hiểm</h4>
                                <p style="font-size:13px;color:var(--text-mute);margin-bottom:12px">Các hành động không thể hoàn tác</p>
                                <button class="btn btn-secondary" disabled style="opacity:0.5">
                                    <i class="fa-solid fa-trash"></i> Xóa tài khoản (chưa hỗ trợ)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Tabs handler
        main.querySelectorAll('[data-stab]').forEach(t => {
            t.addEventListener('click', () => {
                main.querySelectorAll('[data-stab]').forEach(x => x.classList.remove('active'));
                main.querySelectorAll('[id^="stab-"]').forEach(x => x.hidden = true);
                t.classList.add('active');
                main.querySelector('#stab-' + t.dataset.stab).hidden = false;
                if (t.dataset.stab === 'notifications') this._loadNotifPrefs();
            });
        });

        // Auto-load if active
        if (main.querySelector('.tab.active[data-stab="notifications"]')) this._loadNotifPrefs();

        // Bind data-page links
        main.querySelectorAll('[data-page]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                if (el.dataset.id) App.navigate(el.dataset.page, { id: parseInt(el.dataset.id) });
                else App.navigate(el.dataset.page);
            });
        });

        // Password form
        main.querySelector('#passwordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd);

            if (data.new_password !== data.confirm_password) {
                showToast('Mật khẩu xác nhận không khớp', 'error');
                return;
            }

            try {
                await API.post('/auth/change-password', { old_password: data.old_password, new_password: data.new_password });
                showToast('Đổi mật khẩu thành công!', 'success');
                e.target.reset();
            } catch (err) { showToast(err.message, 'error'); }
        });

        // Logout
        main.querySelector('#logoutBtn').addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                API.logout();
            }
        });

        // Avatar upload
        const avatarEl = main.querySelector('#userAvatar');
        const avatarInput = main.querySelector('#avatarInput');
        if (avatarEl && avatarInput) {
            avatarEl.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    showToast('Vui lòng chọn file ảnh', 'warning');
                    return;
                }
                if (file.size > 8 * 1024 * 1024) {
                    showToast('Ảnh quá lớn (tối đa 8MB)', 'warning');
                    return;
                }
                try {
                    const r = await API.uploadImage(file, 'avatar');
                    showToast('Đã cập nhật avatar!', 'success');
                    // Cập nhật localStorage + reload page
                    const user = API.getUser();
                    user.avatar = r.url;
                    localStorage.setItem('user', JSON.stringify(user));
                    App.navigate('settings');
                } catch (err) { showToast(err.message, 'error'); }
            });
        }
    },

    // ============= ADMIN USERS MANAGEMENT =============
    async renderAdminUsers(main) {
        if (!API.isLoggedIn() || !API.isAdmin()) {
            showToast('Cần quyền Admin', 'error');
            App.navigate('home');
            return;
        }
        const data = await API.adminListUsers();
        const stats = await API.adminAdvancedStats();

        main.innerHTML = `
            <section class="section" style="background:linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);color:white;padding:48px 0">
                <div class="container">
                    <div style="display:flex;align-items:center;gap:16px">
                        <div style="width:64px;height:64px;background:rgba(255,255,255,0.1);border-radius:16px;display:grid;place-items:center;font-size:32px">
                            <i class="fa-solid fa-users-gear"></i>
                        </div>
                        <div>
                            <h1 style="color:white;margin:0;font-size:32px">Quản lý Users</h1>
                            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0">Quản lý tài khoản, phân quyền, khóa/mở khóa</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    <!-- Advanced Stats -->
                    <div class="grid grid-4 stagger" style="margin-bottom:24px">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
                            <div class="stat-info"><h3>${stats.users.total}</h3><p>Tổng users</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon green"><i class="fa-solid fa-user-plus"></i></div>
                            <div class="stat-info"><h3>${stats.users.new_7d}</h3><p>Mới 7 ngày</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon pink"><i class="fa-solid fa-shield"></i></div>
                            <div class="stat-info"><h3>${stats.users.by_role.admin}</h3><p>Admin</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon blue"><i class="fa-solid fa-user-check"></i></div>
                            <div class="stat-info"><h3>${stats.users.active}</h3><p>Đang hoạt động</p></div>
                        </div>
                    </div>

                    <div class="card">
                        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
                            <input class="form-input" id="userSearch" placeholder="Tìm theo tên, email, MSSV..." style="max-width:400px">
                            <select class="form-select" id="filterRole" style="max-width:180px">
                                <option value="">Tất cả role</option>
                                <option value="admin">👑 Admin</option>
                                <option value="leader">⭐ Leader</option>
                                <option value="member">Member</option>
                            </select>
                            <select class="form-select" id="filterActive" style="max-width:180px">
                                <option value="">Tất cả trạng thái</option>
                                <option value="true">✓ Đang hoạt động</option>
                                <option value="false">✗ Bị khóa</option>
                            </select>
                            <button class="btn btn-primary" id="sendBulkEmailBtn" style="margin-left:auto">
                                <i class="fa-solid fa-envelope"></i> Gửi email hàng loạt
                            </button>
                        </div>

                        <div style="overflow-x:auto">
                            <table style="width:100%;border-collapse:collapse">
                                <thead>
                                    <tr style="background:var(--bg-soft);border-bottom:2px solid var(--border)">
                                        <th style="padding:12px;text-align:left">User</th>
                                        <th style="padding:12px;text-align:left">Email/MSSV</th>
                                        <th style="padding:12px;text-align:left">Role</th>
                                        <th style="padding:12px;text-align:left">Khoa/Lớp</th>
                                        <th style="padding:12px;text-align:left">Trạng thái</th>
                                        <th style="padding:12px;text-align:right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody id="usersTable">
                                    ${this.renderUserRows(data.users)}
                                </tbody>
                            </table>
                        </div>

                        <div style="text-align:center;margin-top:16px;color:var(--text-mute);font-size:13px">
                            Hiển thị ${data.users.length}/${data.total} users
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Search & filter
        const refreshUsers = async () => {
            const params = {};
            const q = document.getElementById('userSearch').value;
            const role = document.getElementById('filterRole').value;
            const active = document.getElementById('filterActive').value;
            if (q) params.q = q;
            if (role) params.role = role;
            if (active) params.is_active = active;
            const newData = await API.adminListUsers(params);
            document.getElementById('usersTable').innerHTML = this.renderUserRows(newData.users);
        };

        main.querySelector('#userSearch').addEventListener('input', debounce(refreshUsers, 400));
        main.querySelector('#filterRole').addEventListener('change', refreshUsers);
        main.querySelector('#filterActive').addEventListener('change', refreshUsers);

        // Bulk email
        main.querySelector('#sendBulkEmailBtn').addEventListener('click', () => {
            const subject = prompt('Tiêu đề email:');
            if (!subject) return;
            const body = prompt('Nội dung email:');
            if (!body) return;
            const role = document.getElementById('filterRole').value || 'member';
            API.sendBulkEmail({ target: 'role', role, subject, body }).then(r => {
                showToast(r.message, 'success');
            }).catch(e => showToast(e.message, 'error'));
        });

        // Bind action buttons
        this.bindUserActions();
    },

    renderUserRows(users) {
        return users.map(u => `
            <tr style="border-bottom:1px solid var(--border-soft)">
                <td style="padding:12px">
                    <div style="display:flex;align-items:center;gap:12px">
                        <div style="width:40px;height:40px;border-radius:50%;background:var(--gradient-1);color:white;display:grid;place-items:center;font-weight:700">
                            ${(u.full_name || u.username).split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                            <div style="font-weight:600">${u.full_name}</div>
                            <div style="font-size:12px;color:var(--text-mute)">@${u.username}</div>
                        </div>
                    </div>
                </td>
                <td style="padding:12px;font-size:13px">
                    <div>${u.email}</div>
                    <div style="color:var(--text-mute);font-size:12px">${u.student_id || 'N/A'}</div>
                </td>
                <td style="padding:12px">
                    <span class="badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'leader' ? 'badge-warning' : 'badge-primary'}">
                        ${u.role === 'admin' ? '👑 Admin' : u.role === 'leader' ? '⭐ Leader' : 'Member'}
                    </span>
                </td>
                <td style="padding:12px;font-size:13px">
                    <div>${u.faculty || 'N/A'}</div>
                    <div style="color:var(--text-mute);font-size:12px">${u.class_name || 'N/A'}</div>
                </td>
                <td style="padding:12px">
                    ${u.is_active ? '<span class="badge badge-success">Hoạt động</span>' : '<span class="badge badge-danger">Bị khóa</span>'}
                </td>
                <td style="padding:12px;text-align:right">
                    <div style="display:flex;gap:4px;justify-content:flex-end">
                        <button class="btn btn-secondary btn-sm toggle-active" data-id="${u.id}" title="Khóa/Mở" ${u.role === 'admin' ? 'disabled' : ''}>
                            <i class="fa-solid fa-${u.is_active ? 'lock' : 'lock-open'}"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm change-role" data-id="${u.id}" data-role="${u.role}" title="Đổi role">
                            <i class="fa-solid fa-shield"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm reset-pwd" data-id="${u.id}" title="Reset mật khẩu">
                            <i class="fa-solid fa-key"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    bindUserActions() {
        document.querySelectorAll('.toggle-active').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Khóa/Mở tài khoản này?')) return;
                try {
                    const r = await API.adminToggleUserActive(parseInt(btn.dataset.id));
                    showToast(r.message, 'success');
                    App.navigate('admin-users');
                } catch (e) { showToast(e.message, 'error'); }
            });
        });

        document.querySelectorAll('.change-role').forEach(btn => {
            btn.addEventListener('click', async () => {
                const newRole = prompt('Role mới (admin/leader/member):', btn.dataset.role);
                if (!newRole || !['admin', 'leader', 'member'].includes(newRole)) {
                    showToast('Role không hợp lệ', 'error');
                    return;
                }
                try {
                    const r = await API.adminChangeRole(parseInt(btn.dataset.id), newRole);
                    showToast(r.message, 'success');
                    App.navigate('admin-users');
                } catch (e) { showToast(e.message, 'error'); }
            });
        });

        document.querySelectorAll('.reset-pwd').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Reset mật khẩu về "123456"?')) return;
                try {
                    const r = await API.adminResetPassword(parseInt(btn.dataset.id), '123456');
                    showToast('Đã reset! MK mới: 123456', 'success');
                } catch (e) { showToast(e.message, 'error'); }
            });
        });
    },

    // ============= CERTIFICATES (CHỨNG NHẬN) =============
    async renderCertificates(main) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }
        const certs = await API.getMyCertificates();

        main.innerHTML = `
            <section class="section" style="background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);color:white;padding:60px 0">
                <div class="container" style="text-align:center">
                    <div style="width:80px;height:80px;background:rgba(255,255,255,0.2);border-radius:50%;display:grid;place-items:center;margin:0 auto 20px;font-size:40px;backdrop-filter:blur(10px)">
                        <i class="fa-solid fa-certificate"></i>
                    </div>
                    <h1 style="color:white;font-size:42px">Chứng nhận của tôi</h1>
                    <p style="color:rgba(255,255,255,0.9);max-width:600px;margin:12px auto">
                        Những thành tích và chứng nhận bạn đã đạt được từ các CLB
                    </p>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    ${certs.length ? `
                    <div class="grid grid-2 stagger">
                        ${certs.map(c => `
                            <div class="card" style="border:2px solid var(--warning);background:linear-gradient(135deg, rgba(251,191,36,0.05), rgba(245,158,11,0.05))">
                                <div style="display:flex;align-items:start;gap:16px">
                                    <div style="width:60px;height:60px;background:linear-gradient(135deg,#fbbf24,#d97706);border-radius:14px;display:grid;place-items:center;color:white;font-size:28px;flex-shrink:0">
                                        <i class="fa-solid fa-award"></i>
                                    </div>
                                    <div style="flex:1">
                                        <h3>${c.title}</h3>
                                        <p style="color:var(--text-mute);font-size:14px;margin:8px 0">${c.description || ''}</p>
                                        <div style="display:flex;gap:8px;margin-top:12px">
                                            <span class="badge badge-warning">${c.certificate_type}</span>
                                            <span class="badge">${c.club_name}</span>
                                        </div>
                                        <div style="margin-top:12px;font-size:12px;color:var(--text-mute)">
                                            <i class="fa-solid fa-calendar"></i> ${formatDate(c.issued_date)}
                                        </div>
                                        <div style="margin-top:8px;font-size:11px;background:var(--bg-soft);padding:6px 10px;border-radius:6px;display:inline-block">
                                            <strong>Mã verify:</strong> <code>${c.verify_code}</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ` : `
                    <div class="empty" style="background:var(--surface);border-radius:var(--radius-lg);padding:60px">
                        <i class="fa-solid fa-certificate" style="font-size:64px;opacity:0.3"></i>
                        <h3>Chưa có chứng nhận nào</h3>
                        <p>Hãy tích cực tham gia hoạt động CLB để nhận chứng nhận!</p>
                    </div>
                    `}
                </div>
            </section>
        `;
    },

    // ============= QR SCANNER =============
    async renderQRScanner(main) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }

        main.innerHTML = `
            <section class="section" style="background:linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);color:white;padding:48px 0">
                <div class="container" style="text-align:center">
                    <div style="width:80px;height:80px;background:rgba(255,255,255,0.1);border-radius:50%;display:grid;place-items:center;margin:0 auto 20px;font-size:40px">
                        <i class="fa-solid fa-qrcode"></i>
                    </div>
                    <h1 style="color:white;font-size:36px">QR Scanner</h1>
                    <p style="color:rgba(255,255,255,0.8)">Quét QR để check-in sự kiện hoặc verify chứng nhận</p>
                </div>
            </section>

            <section class="section">
                <div class="container" style="max-width:600px">
                    <div class="card">
                        <h3 style="margin-bottom:16px"><i class="fa-solid fa-camera"></i> Nhập/Scan QR Code</h3>

                        <div id="qrReader" style="background:var(--bg-soft);border:2px dashed var(--border);border-radius:var(--radius);min-height:250px;display:grid;place-items:center;margin-bottom:16px;position:relative;overflow:hidden">
                            <div style="text-align:center;color:var(--text-mute)">
                                <i class="fa-solid fa-qrcode" style="font-size:80px;opacity:0.3"></i>
                                <p style="margin-top:12px">Đặt QR code vào khung hình</p>
                                <p style="font-size:12px">Hoặc nhập mã bên dưới</p>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Hoặc nhập mã QR thủ công</label>
                            <input class="form-input" id="qrInput" placeholder="CLUB_HUB_EVENT:1:Su_kien...">
                        </div>
                        <button class="btn btn-primary" id="scanBtn" style="width:100%">
                            <i class="fa-solid fa-bolt"></i> Quét ngay
                        </button>

                        <div id="scanResult" style="margin-top:20px"></div>
                    </div>

                    <div class="card" style="margin-top:16px">
                        <h3 style="margin-bottom:12px"><i class="fa-solid fa-circle-info"></i> Hướng dẫn</h3>
                        <ol style="padding-left:20px;line-height:1.8;color:var(--text-soft)">
                            <li>Mở ứng dụng camera điện thoại</li>
                            <li>Quét QR code của sự kiện (chủ nhiệm cung cấp)</li>
                            <li>Hoặc nhập mã QR thủ công vào ô trên</li>
                            <li>Nhấn "Quét ngay" để check-in</li>
                        </ol>
                    </div>
                </div>
            </section>
        `;

        main.querySelector('#scanBtn').addEventListener('click', async () => {
            const qrData = document.getElementById('qrInput').value.trim();
            if (!qrData) {
                showToast('Vui lòng nhập mã QR', 'warning');
                return;
            }

            const result = document.getElementById('scanResult');
            result.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

            try {
                const validation = await API.validateQR(qrData);

                if (!validation.valid) {
                    result.innerHTML = `
                        <div class="card" style="background:rgba(239,68,68,0.1);border-color:var(--danger)">
                            <h4 style="color:var(--danger)"><i class="fa-solid fa-xmark-circle"></i> Mã QR không hợp lệ</h4>
                            <p>${validation.message}</p>
                        </div>
                    `;
                    return;
                }

                if (validation.type === 'event') {
                    // Try checkin
                    const checkin = await API.checkinViaQR(qrData);
                    result.innerHTML = `
                        <div class="card" style="background:rgba(16,185,129,0.1);border-color:var(--success)">
                            <h4 style="color:var(--success)"><i class="fa-solid fa-check-circle"></i> Check-in thành công!</h4>
                            <p>${checkin.message}</p>
                            <p style="font-size:14px;color:var(--text-mute)">Bạn đã nhận <strong>15 điểm</strong> thưởng</p>
                        </div>
                    `;
                    showToast('🎉 Check-in thành công! +15 điểm', 'success');
                } else if (validation.type === 'certificate') {
                    result.innerHTML = `
                        <div class="card" style="background:rgba(251,191,36,0.1);border-color:var(--warning)">
                            <h4 style="color:var(--warning)"><i class="fa-solid fa-certificate"></i> Chứng nhận hợp lệ</h4>
                            <p>${validation.message}</p>
                        </div>
                    `;
                }
            } catch (e) {
                result.innerHTML = `<div class="card" style="background:rgba(239,68,68,0.1)"><p style="color:var(--danger)">Lỗi: ${e.message}</p></div>`;
            }
        });
    },

    // ============= REPORTS (BÁO CÁO NHÀ TRƯỜNG) =============
    async renderReports(main) {
        const data = await API.getSchoolReport('all');

        main.innerHTML = `
            <section class="section" style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);color:white;padding:48px 0">
                <div class="container" style="text-align:center">
                    <div style="width:80px;height:80px;background:rgba(255,255,255,0.1);border-radius:50%;display:grid;place-items:center;margin:0 auto 20px;font-size:40px">
                        <i class="fa-solid fa-chart-column"></i>
                    </div>
                    <h1 style="color:white;font-size:36px">Báo cáo Nhà trường</h1>
                    <p style="color:rgba(255,255,255,0.8)">Thống kê tổng hợp hoạt động CLB toàn trường</p>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    <!-- Tổng quan -->
                    <div class="grid grid-4 stagger" style="margin-bottom:32px">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fa-solid fa-user-graduate"></i></div>
                            <div class="stat-info"><h3>${data.summary.total_students}</h3><p>Sinh viên</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon green"><i class="fa-solid fa-people-group"></i></div>
                            <div class="stat-info"><h3>${data.summary.total_clubs}</h3><p>Câu lạc bộ</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon pink"><i class="fa-solid fa-calendar"></i></div>
                            <div class="stat-info"><h3>${data.summary.total_events}</h3><p>Sự kiện</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon blue"><i class="fa-solid fa-chart-pie"></i></div>
                            <div class="stat-info"><h3>${data.summary.participation_rate}%</h3><p>Tỷ lệ tham gia</p></div>
                        </div>
                    </div>

                    <div class="grid grid-2" style="gap:24px">
                        <!-- Theo khoa -->
                        <div class="card">
                            <h3 style="margin-bottom:16px"><i class="fa-solid fa-school"></i> Phân bố theo khoa</h3>
                            <div id="facultyChart" style="height:300px;position:relative">
                                <canvas id="facultyCanvas"></canvas>
                            </div>
                        </div>

                        <!-- Theo category -->
                        <div class="card">
                            <h3 style="margin-bottom:16px"><i class="fa-solid fa-tags"></i> Phân bố theo lĩnh vực</h3>
                            <div id="categoryChart" style="height:300px;position:relative">
                                <canvas id="categoryCanvas"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Top CLB -->
                    <div class="card" style="margin-top:24px">
                        <h3 style="margin-bottom:16px"><i class="fa-solid fa-trophy" style="color:var(--warning)"></i> Top 10 CLB phổ biến nhất</h3>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                            ${data.top_clubs.map((c, i) => `
                                <div onclick="App.navigate('club-detail',{id:${c.id}})" style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-soft);border-radius:var(--radius);cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='var(--bg-soft)'">
                                    <div style="width:32px;height:32px;border-radius:50%;background:${i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#fb923c' : 'var(--bg-soft)'};color:${i < 3 ? 'white' : 'var(--text)'};display:grid;place-items:center;font-weight:800">${i+1}</div>
                                    <div style="flex:1">
                                        <div style="font-weight:600">${c.name}</div>
                                        <div style="font-size:12px;color:var(--text-mute)">${c.category}</div>
                                    </div>
                                    <div style="font-weight:800;color:var(--primary)">${c.member_count}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div style="text-align:center;margin-top:24px">
                        <button class="btn btn-primary" onclick="window.print()">
                            <i class="fa-solid fa-print"></i> In báo cáo
                        </button>
                    </div>
                </div>
            </section>
        `;

        // Render charts
        if (typeof Chart !== 'undefined') {
            const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ef4444'];

            new Chart(document.getElementById('facultyCanvas'), {
                type: 'bar',
                data: {
                    labels: data.by_faculty.map(f => f.faculty.substring(0, 15)),
                    datasets: [{
                        label: 'Số sinh viên',
                        data: data.by_faculty.map(f => f.count),
                        backgroundColor: colors,
                        borderRadius: 8
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });

            new Chart(document.getElementById('categoryCanvas'), {
                type: 'doughnut',
                data: {
                    labels: data.by_category.map(c => c.category),
                    datasets: [{
                        data: data.by_category.map(c => c.count),
                        backgroundColor: colors,
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
            });
        }
    },

    // ============= ABOUT PAGE =============
    async renderAbout(main) {
        main.innerHTML = `
            <section class="section" style="background:var(--gradient-hero);color:white;padding:80px 0">
                <div class="container" style="text-align:center">
                    <h1 style="color:white;font-size:48px;margin-bottom:16px">Về CLB Student Hub</h1>
                    <p style="color:rgba(255,255,255,0.8);font-size:18px;max-width:600px;margin:0 auto">
                        Nền tảng quản lý câu lạc bộ sinh viên tích hợp AI hàng đầu Việt Nam
                    </p>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    <div class="grid grid-2" style="gap:48px;align-items:center">
                        <div>
                            <span class="section-eyebrow">Sứ mệnh</span>
                            <h2 class="section-title" style="text-align:left;margin:12px 0">Kết nối đam mê, phát triển tương lai</h2>
                            <p style="color:var(--text-soft);line-height:1.8;margin-bottom:16px">
                                CLB Student Hub ra đời với sứ mệnh giúp sinh viên dễ dàng tìm kiếm, tham gia và quản lý các hoạt động ngoại khóa một cách hiệu quả nhất.
                            </p>
                            <p style="color:var(--text-soft);line-height:1.8">
                                Tích hợp công nghệ AI tiên tiến, chúng tôi mang đến trải nghiệm cá nhân hóa cho từng sinh viên, giúp họ phát huy tối đa tiềm năng bản thân.
                            </p>
                        </div>
                        <div class="card" style="background:var(--gradient-1);color:white;border:none">
                            <h3 style="color:white;margin-bottom:16px">📊 Thông số ấn tượng</h3>
                            <div class="grid grid-2" style="gap:16px">
                                <div style="text-align:center;padding:16px;background:rgba(255,255,255,0.1);border-radius:var(--radius)">
                                    <div style="font-size:32px;font-weight:800">20+</div>
                                    <div style="font-size:12px;opacity:0.9">Câu lạc bộ</div>
                                </div>
                                <div style="text-align:center;padding:16px;background:rgba(255,255,255,0.1);border-radius:var(--radius)">
                                    <div style="font-size:32px;font-weight:800">52+</div>
                                    <div style="font-size:12px;opacity:0.9">Sinh viên</div>
                                </div>
                                <div style="text-align:center;padding:16px;background:rgba(255,255,255,0.1);border-radius:var(--radius)">
                                    <div style="font-size:32px;font-weight:800">30+</div>
                                    <div style="font-size:12px;opacity:0.9">Sự kiện/năm</div>
                                </div>
                                <div style="text-align:center;padding:16px;background:rgba(255,255,255,0.1);border-radius:var(--radius)">
                                    <div style="font-size:32px;font-weight:800">6</div>
                                    <div style="font-size:12px;opacity:0.9">Lĩnh vực</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section-header" style="margin-top:80px">
                        <span class="section-eyebrow">Công nghệ</span>
                        <h2 class="section-title">Stack công nghệ hiện đại</h2>
                    </div>
                    <div class="grid grid-4 stagger">
                        <div class="card" style="text-align:center">
                            <div style="font-size:48px;margin-bottom:12px">🐍</div>
                            <h4>Python + FastAPI</h4>
                            <p style="color:var(--text-mute);font-size:13px;margin-top:8px">Backend hiệu năng cao, async</p>
                        </div>
                        <div class="card" style="text-align:center">
                            <div style="font-size:48px;margin-bottom:12px">🤖</div>
                            <h4>Ollama AI</h4>
                            <p style="color:var(--text-mute);font-size:13px;margin-top:8px">LLM local, privacy-first</p>
                        </div>
                        <div class="card" style="text-align:center">
                            <div style="font-size:48px;margin-bottom:12px">🗄️</div>
                            <h4>SQLite + SQLAlchemy</h4>
                            <p style="color:var(--text-mute);font-size:13px;margin-top:8px">ORM mạnh mẽ, dễ scale</p>
                        </div>
                        <div class="card" style="text-align:center">
                            <div style="font-size:48px;margin-bottom:12px">🎨</div>
                            <h4>Vanilla JS</h4>
                            <p style="color:var(--text-mute);font-size:13px;margin-top:8px">SPA thuần, zero dependency</p>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    // ============= DASHBOARD =============
    async renderDashboard(main) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }
        const [overview, dashboard] = await Promise.all([
            API.getOverview(),
            API.getDashboard()
        ]);

        main.innerHTML = `
            <section class="section">
                <div class="container">
                    <div class="section-header" style="text-align:left">
                        <h2 class="section-title">👋 Xin chào, ${dashboard.user.full_name}</h2>
                        <p class="section-subtitle" style="margin:0">Chào mừng bạn quay lại!</p>
                    </div>

                    <div class="grid grid-4" style="margin-bottom:40px">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fa-solid fa-people-group"></i></div>
                            <div class="stat-info">
                                <h3>${dashboard.my_clubs_count}</h3>
                                <p>CLB của tôi</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon green"><i class="fa-solid fa-calendar-check"></i></div>
                            <div class="stat-info">
                                <h3>${dashboard.upcoming_events_count}</h3>
                                <p>Sự kiện sắp tới</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon pink"><i class="fa-solid fa-newspaper"></i></div>
                            <div class="stat-info">
                                <h3>${dashboard.my_posts_count}</h3>
                                <p>Bài viết của tôi</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon blue"><i class="fa-solid fa-star"></i></div>
                            <div class="stat-info">
                                <h3>${overview.total_clubs}</h3>
                                <p>Tổng CLB hệ thống</p>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-2">
                        <div class="card">
                            <h3 style="margin-bottom:16px"><i class="fa-solid fa-people-group" style="color:var(--primary)"></i> CLB của tôi</h3>
                            ${dashboard.my_clubs.length ? dashboard.my_clubs.map(c => `
                                <div onclick="App.navigate('club-detail',{id:${c.id}})" style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:var(--radius);cursor:pointer;margin-bottom:8px;background:var(--bg-soft)">
                                    <div style="width:40px;height:40px;border-radius:var(--radius);background:var(--gradient-1);color:white;display:grid;place-items:center">
                                        ${getCategoryEmoji(c.category)}
                                    </div>
                                    <div style="flex:1">
                                        <div style="font-weight:600">${c.name}</div>
                                        <div style="font-size:12px;color:var(--text-mute)">${c.role === 'president' ? '👑 Chủ nhiệm' : c.role === 'vice_president' ? '⭐ Phó CN' : 'Thành viên'}</div>
                                    </div>
                                    <i class="fa-solid fa-chevron-right" style="color:var(--text-mute)"></i>
                                </div>
                            `).join('') : '<p class="empty">Bạn chưa tham gia CLB nào</p>'}
                        </div>

                        <div class="card">
                            <h3 style="margin-bottom:16px"><i class="fa-solid fa-calendar" style="color:var(--secondary)"></i> Sự kiện sắp tới</h3>
                            ${dashboard.upcoming_events.length ? dashboard.upcoming_events.map(e => `
                                <div onclick="App.navigate('event-detail',{id:${e.id}})" style="padding:12px;border-radius:var(--radius);cursor:pointer;margin-bottom:8px;background:var(--bg-soft)">
                                    <div style="font-weight:600">${e.title}</div>
                                    <div style="font-size:12px;color:var(--text-mute);margin-top:4px"><i class="fa-solid fa-clock"></i> ${formatDateTime(e.start_time)}</div>
                                    <div style="font-size:12px;color:var(--text-mute)"><i class="fa-solid fa-location-dot"></i> ${e.location}</div>
                                </div>
                            `).join('') : '<p class="empty">Chưa có sự kiện nào</p>'}
                        </div>
                    </div>

                    <div style="text-align:center;margin-top:40px">
                        <a class="btn btn-primary btn-lg" data-page="ai-assistant">
                            <i class="fa-solid fa-robot"></i> Nhờ AI tư vấn
                        </a>
                    </div>
                </div>
            </section>
        `;
    },

    // ============= PROFILE (CÁ NHÂN - NÂNG CẤP) =============
    async renderProfile(main) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }
        const u = API.getUser();
        const fullProfile = await API.getMemberProfile(u.id);

        main.innerHTML = `
            <div class="profile-header">
                <div class="container">
                    <div class="profile-content">
                        <div class="profile-avatar">${(u.full_name || u.username).split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}</div>
                        <div class="profile-info">
                            <h1>${u.full_name}</h1>
                            <p>@${u.username} · ${u.email}</p>
                            <p>${fullProfile.student_id || 'Chưa có MSSV'} ${fullProfile.class_name ? '· ' + fullProfile.class_name : ''}</p>
                            <span class="profile-badge">${u.role === 'admin' ? '👑 Admin' : u.role === 'leader' ? '⭐ Chủ nhiệm' : 'Sinh viên'}</span>
                        </div>
                        <div style="margin-left:auto">
                            <button class="btn btn-secondary" data-page="member-profile" data-id="${u.id}">
                                <i class="fa-solid fa-eye"></i> Xem trang công khai
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <section class="section">
                <div class="container" style="max-width:900px">
                    <div class="card">
                        <div class="tabs">
                            <div class="tab active" data-tab="info">📋 Thông tin cá nhân</div>
                            <div class="tab" data-tab="about">💬 Giới thiệu & Kỹ năng</div>
                            <div class="tab" data-tab="social">🌐 Mạng xã hội</div>
                            <div class="tab" data-tab="security">🔒 Bảo mật</div>
                        </div>

                        <div id="tab-info" class="tab-content">
                            <form id="profileForm">
                                <div class="grid grid-2" style="gap:16px">
                                    <div class="form-group">
                                        <label class="form-label">Họ và tên *</label>
                                        <input class="form-input" name="full_name" value="${u.full_name || ''}" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Email</label>
                                        <input class="form-input" value="${u.email || ''}" disabled>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Mã sinh viên (MSSV)</label>
                                        <input class="form-input" name="student_id" value="${fullProfile.student_id || ''}" placeholder="DTCxxxxxxxxx">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Lớp</label>
                                        <input class="form-input" name="class_name" value="${fullProfile.class_name || ''}" placeholder="VD: DHTI15A1">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Khoa</label>
                                        <input class="form-input" name="faculty" value="${fullProfile.faculty || ''}" placeholder="VD: Công nghệ Thông tin">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Số điện thoại</label>
                                        <input class="form-input" name="phone" value="${fullProfile.phone || ''}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:12px;background:var(--bg-soft);border-radius:var(--radius)">
                                        <input type="checkbox" name="is_public" ${fullProfile.is_public ? 'checked' : ''}>
                                        <span><strong>Hiển thị công khai</strong> - Cho phép mọi người xem profile và tìm kiếm tôi trong hệ thống</span>
                                    </label>
                                </div>
                                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Lưu thay đổi</button>
                            </form>
                        </div>

                        <div id="tab-about" class="tab-content" hidden>
                            <form id="aboutForm">
                                <div class="form-group">
                                    <label class="form-label">Giới thiệu bản thân</label>
                                    <textarea class="form-textarea" name="bio" rows="5" placeholder="Chia sẻ về bản thân, sở thích, mục tiêu nghề nghiệp...">${fullProfile.bio || ''}</textarea>
                                    <p class="form-help">Hiển thị công khai trên trang profile của bạn</p>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Kỹ năng (phân cách bằng dấu phẩy)</label>
                                    <input class="form-input" name="skills" value="${fullProfile.skills || ''}" placeholder="VD: Python, JavaScript, Photoshop, Public Speaking">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Sở thích</label>
                                    <input class="form-input" name="interests" value="${fullProfile.interests || ''}" placeholder="VD: Lập trình, Âm nhạc, Thể thao, Du lịch">
                                </div>
                                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Lưu</button>
                            </form>
                        </div>

                        <div id="tab-social" class="tab-content" hidden>
                            <form id="socialForm">
                                <div class="form-group">
                                    <label class="form-label"><i class="fa-brands fa-facebook" style="color:#1877f2"></i> Facebook</label>
                                    <input class="form-input" name="social_facebook" value="${fullProfile.social_facebook || ''}" placeholder="https://facebook.com/username">
                                </div>
                                <div class="form-group">
                                    <label class="form-label"><i class="fa-brands fa-instagram" style="color:#e4405f"></i> Instagram</label>
                                    <input class="form-input" name="social_instagram" value="${fullProfile.social_instagram || ''}" placeholder="https://instagram.com/username">
                                </div>
                                <div class="form-group">
                                    <label class="form-label"><i class="fa-brands fa-github"></i> GitHub</label>
                                    <input class="form-input" name="social_github" value="${fullProfile.social_github || ''}" placeholder="https://github.com/username">
                                </div>
                                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Lưu</button>
                            </form>
                        </div>

                        <div id="tab-security" class="tab-content" hidden>
                            <form id="passwordForm" style="max-width:500px">
                                <div class="form-group">
                                    <label class="form-label">Mật khẩu hiện tại</label>
                                    <input class="form-input" name="old_password" type="password" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                                    <input class="form-input" name="new_password" type="password" required minlength="6">
                                </div>
                                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-key"></i> Đổi mật khẩu</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Tabs handler
        document.querySelectorAll('.tab').forEach(t => {
            t.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(x => x.hidden = true);
                t.classList.add('active');
                document.getElementById('tab-' + t.dataset.tab).hidden = false;
            });
        });

        // Bind data-page links
        document.querySelectorAll('[data-page]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                if (el.dataset.id) App.navigate(el.dataset.page, { id: parseInt(el.dataset.id) });
                else App.navigate(el.dataset.page);
            });
        });

        // Form 1: Thông tin cá nhân
        main.querySelector('#profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = Object.fromEntries(fd);
            payload.is_public = fd.has('is_public');
            try {
                await API.updateMyMemberProfile(payload);
                showToast('Cập nhật thông tin thành công!', 'success');
            } catch (err) { showToast(err.message, 'error'); }
        });

        // Form 2: Giới thiệu
        main.querySelector('#aboutForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = Object.fromEntries(fd);
            try {
                await API.updateMyMemberProfile(payload);
                showToast('Cập nhật giới thiệu thành công!', 'success');
            } catch (err) { showToast(err.message, 'error'); }
        });

        // Form 3: Mạng xã hội
        main.querySelector('#socialForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = Object.fromEntries(fd);
            try {
                await API.updateMyMemberProfile(payload);
                showToast('Cập nhật mạng xã hội thành công!', 'success');
            } catch (err) { showToast(err.message, 'error'); }
        });

        // Form 4: Đổi mật khẩu
        main.querySelector('#passwordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
                await API.post('/auth/change-password', Object.fromEntries(fd));
                showToast('Đổi mật khẩu thành công!', 'success');
                e.target.reset();
            } catch (err) { showToast(err.message, 'error'); }
        });
    },

    // ============= LOGIN =============
    async renderLogin(main) {
        main.innerHTML = `
            <div class="auth-page">
                <div class="auth-card">
                    <div class="auth-logo"><i class="fa-solid fa-graduation-cap"></i></div>
                    <h2>Chào mừng trở lại</h2>
                    <p class="auth-subtitle">Đăng nhập để tiếp tục</p>
                    <form id="loginForm">
                        <div class="form-group">
                            <label class="form-label">Tên đăng nhập</label>
                            <input class="form-input" name="username" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mật khẩu</label>
                            <input class="form-input" name="password" type="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">
                            <i class="fa-solid fa-right-to-bracket"></i> Đăng nhập
                        </button>
                    </form>
                    <p class="auth-footer">Chưa có tài khoản? <a data-page="register">Đăng ký ngay</a></p>
                    <div class="demo-credentials">
                        <strong>🎓 Tài khoản demo:</strong><br>
                        Admin: <code>admin</code> / <code>admin123</code><br>
                        User: <code>demo</code> / <code>demo123</code>
                    </div>
                </div>
            </div>
        `;

        main.querySelector('#loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
                const r = await API.login(fd.get('username'), fd.get('password'));
                showToast('Đăng nhập thành công!', 'success');
                App.user = r.user;
                App.renderNavActions();
                App.navigate('dashboard');
            } catch (err) { showToast(err.message, 'error'); }
        });
        this.bindDataPageLinks(main);
    },

    async renderRegister(main) {
        main.innerHTML = `
            <div class="auth-page">
                <div class="auth-card">
                    <div class="auth-logo"><i class="fa-solid fa-rocket"></i></div>
                    <h2>Tạo tài khoản</h2>
                    <p class="auth-subtitle">Tham gia CLB Hub ngay hôm nay</p>
                    <form id="registerForm">
                        <div class="form-group">
                            <label class="form-label">Họ và tên</label>
                            <input class="form-input" name="full_name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tên đăng nhập</label>
                            <input class="form-input" name="username" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input class="form-input" name="email" type="email" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">MSSV</label>
                            <input class="form-input" name="student_id">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Khoa</label>
                            <input class="form-input" name="faculty">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mật khẩu</label>
                            <input class="form-input" name="password" type="password" required minlength="6">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">
                            <i class="fa-solid fa-rocket"></i> Đăng ký
                        </button>
                    </form>
                    <p class="auth-footer">Đã có tài khoản? <a data-page="login">Đăng nhập</a></p>
                </div>
            </div>
        `;

        main.querySelector('#registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = Object.fromEntries(fd);
            try {
                const r = await API.register(payload);
                showToast('Đăng ký thành công!', 'success');
                App.user = r.user;
                App.renderNavActions();
                App.navigate('dashboard');
            } catch (err) { showToast(err.message, 'error'); }
        });
        this.bindDataPageLinks(main);
    },

    // ============= MESSAGES =============
    async renderMessages(main, params = {}) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }
        const conversations = await API.getConversations().catch(() => []);
        const otherId = params.user_id ? parseInt(params.user_id) : null;
        const other = otherId ? conversations.find(c => c.other_id === otherId) : null;

        main.innerHTML = `
            <section class="section">
                <div class="container" style="max-width:1100px">
                    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
                        <div style="width:56px;height:56px;background:var(--gradient-ai);border-radius:14px;display:grid;place-items:center;color:white;font-size:24px">
                            <i class="fa-solid fa-comments"></i>
                        </div>
                        <div>
                            <h1 style="margin:0;font-size:28px">Tin nhắn</h1>
                            <p style="margin:4px 0 0;color:var(--text-mute)">Trò chuyện với các thành viên</p>
                        </div>
                    </div>

                    <div style="display:grid;grid-template-columns:300px 1fr;gap:16px;min-height:500px">
                        <!-- Sidebar: danh sách hội thoại -->
                        <div class="card" style="padding:0;overflow:hidden;display:flex;flex-direction:column">
                            <div style="padding:12px;border-bottom:1px solid var(--border-soft)">
                                <input type="text" class="form-input" id="msgSearchInput" placeholder="🔍 Tìm kiếm..." style="font-size:14px">
                            </div>
                            <div id="convList" style="flex:1;overflow-y:auto;max-height:500px">
                                ${this._renderConversationList(conversations, otherId)}
                            </div>
                        </div>

                        <!-- Khung chat -->
                        <div class="card" style="padding:0;display:flex;flex-direction:column;overflow:hidden">
                            ${otherId && other ? this._renderChatBox(other) : `
                            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-mute);padding:40px;text-align:center">
                                <i class="fa-solid fa-comments" style="font-size:64px;opacity:0.2;margin-bottom:16px"></i>
                                <h3>Chọn một cuộc hội thoại</h3>
                                <p>Hoặc vào trang cá nhân của một thành viên để bắt đầu nhắn tin</p>
                            </div>`}
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Search filter
        document.getElementById('msgSearchInput')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.conv-item');
            items.forEach(it => {
                it.style.display = it.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });

        // Load thread nếu có user_id
        if (otherId) {
            this._loadChatThread(otherId, other);
        }

        // Bind chat form
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const input = document.getElementById('chatInput');
                const content = input.value.trim();
                if (!content) return;
                try {
                    await API.sendMessage({ receiver_id: otherId, content });
                    input.value = '';
                    this._loadChatThread(otherId, other);
                } catch (err) { showToast(err.message, 'error'); }
            });
        }

        this.bindDataPageLinks(main);
    },

    async _loadChatThread(otherId, other) {
        const me = API.getUser();
        const msgs = await API.getThread(otherId).catch(() => []);
        const chatEl = document.getElementById('chatMessages');
        if (!chatEl) return;
        if (!msgs.length) {
            chatEl.innerHTML = `<div style="text-align:center;color:var(--text-mute);padding:40px">
                <i class="fa-regular fa-paper-plane" style="font-size:32px;opacity:0.3"></i>
                <p style="margin-top:8px">Chưa có tin nhắn nào. Hãy gửi lời chào!</p>
            </div>`;
        } else {
            chatEl.innerHTML = msgs.map(m => this._renderMessage(m, me.id)).join('');
            chatEl.scrollTop = chatEl.scrollHeight;
        }
    },

    _renderConversationList(conversations, activeId) {
        if (!conversations.length) {
            return `<div style="padding:24px;text-align:center;color:var(--text-mute)">
                <i class="fa-regular fa-comments" style="font-size:32px;opacity:0.3"></i>
                <p style="margin-top:8px;font-size:13px">Chưa có cuộc hội thoại</p>
            </div>`;
        }
        return conversations.map(c => {
            const active = c.other_id === activeId;
            const initial = (c.other_name || '?')[0];
            const avatar = c.other_avatar
                ? `<img src="${c.other_avatar}" style="width:100%;height:100%;object-fit:cover">`
                : initial;
            return `
            <a class="conv-item" data-page="messages" data-user-id="${c.other_id}"
               style="display:flex;gap:12px;padding:12px;cursor:pointer;border-bottom:1px solid var(--border-soft);text-decoration:none;color:inherit;background:${active ? 'var(--bg-soft)' : 'transparent'};transition:background 0.15s"
               onmouseover="this.style.background='var(--bg-soft)'" onmouseout="this.style.background='${active ? 'var(--bg-soft)' : 'transparent'}'">
                <div style="width:44px;height:44px;border-radius:50%;background:var(--gradient-1);color:white;display:grid;place-items:center;font-weight:700;flex-shrink:0;overflow:hidden">${avatar}</div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <strong style="font-size:14px">${this._escapeHtml(c.other_name)}</strong>
                        ${c.unread_count > 0 ? `<span style="background:var(--primary);color:white;font-size:10px;padding:2px 6px;border-radius:10px;font-weight:700">${c.unread_count}</span>` : ''}
                    </div>
                    <p style="font-size:12px;color:var(--text-mute);margin:2px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escapeHtml(c.last_message || '')}</p>
                </div>
            </a>`;
        }).join('');
    },

    _renderChatBox(other) {
        const initial = (other.other_name || '?')[0];
        const avatar = other.other_avatar
            ? `<img src="${other.other_avatar}" style="width:100%;height:100%;object-fit:cover">`
            : initial;
        return `
        <div style="padding:14px 16px;border-bottom:1px solid var(--border-soft);display:flex;align-items:center;gap:12px;background:var(--bg-soft)">
            <div style="width:40px;height:40px;border-radius:50%;background:var(--gradient-1);color:white;display:grid;place-items:center;font-weight:700;flex-shrink:0;overflow:hidden">${avatar}</div>
            <div>
                <strong style="font-size:15px">${this._escapeHtml(other.other_name)}</strong>
            </div>
        </div>
        <div id="chatMessages" style="flex:1;overflow-y:auto;padding:16px;min-height:350px;max-height:500px;background:var(--bg)">
            <div style="text-align:center;color:var(--text-mute);padding:40px"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</div>
        </div>
        <form id="chatForm" style="padding:12px;border-top:1px solid var(--border-soft);display:flex;gap:8px">
            <input type="text" class="form-input" id="chatInput" placeholder="Nhập tin nhắn..." maxlength="2000" required style="flex:1">
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i></button>
        </form>`;
    },

    _renderMessage(msg, myId) {
        const mine = msg.sender_id === myId;
        return `
        <div style="display:flex;justify-content:${mine ? 'flex-end' : 'flex-start'};margin-bottom:8px">
            <div style="max-width:70%;padding:8px 14px;border-radius:16px;${mine ? 'background:var(--gradient-ai);color:white' : 'background:var(--bg-soft)'};font-size:14px;word-wrap:break-word">
                ${this._escapeHtml(msg.content)}
                <div style="font-size:10px;opacity:0.7;margin-top:4px;text-align:${mine ? 'right' : 'left'}">${formatRelativeTime(msg.created_at)}</div>
            </div>
        </div>`;
    },

    // ============= CREATE CLUB =============
    async renderCreateClub(main) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }

        main.innerHTML = `
            <section class="section">
                <div class="container" style="max-width:720px">
                    <div class="card">
                        <h2 style="margin-bottom:20px"><i class="fa-solid fa-people-group" style="color:var(--primary)"></i> Tạo câu lạc bộ mới</h2>
                        <p style="color:var(--text-mute);margin-bottom:24px">AI sẽ tự động phân tích và gợi ý tags, danh mục cho CLB của bạn.</p>
                        <form id="createClubForm">
                            <div class="form-group">
                                <label class="form-label">Tên CLB *</label>
                                <input class="form-input" name="name" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Mô tả chi tiết *</label>
                                <textarea class="form-textarea" name="description" required minlength="20" placeholder="Mô tả về mục tiêu, hoạt động, đối tượng tham gia..."></textarea>
                                <p class="form-help">Mô tả càng chi tiết, AI phân tích càng chính xác</p>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Danh mục</label>
                                <select class="form-select" name="category">
                                    <option>Học thuật</option>
                                    <option>Thể thao</option>
                                    <option>Văn nghệ</option>
                                    <option>Tình nguyện</option>
                                    <option>Kỹ năng</option>
                                    <option>Truyền thông</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email liên hệ</label>
                                <input class="form-input" name="email" type="email">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Phòng sinh hoạt</label>
                                <input class="form-input" name="meeting_room">
                            </div>
                            <button type="button" class="btn btn-secondary" id="aiPreviewBtn">
                                <i class="fa-solid fa-robot"></i> AI Phân tích trước
                            </button>
                            <div id="aiPreview" style="display:none;margin-top:16px"></div>
                            <button type="submit" class="btn btn-primary" style="margin-top:16px">
                                <i class="fa-solid fa-check"></i> Tạo CLB
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        `;

        main.querySelector('#aiPreviewBtn').addEventListener('click', async () => {
            const fd = new FormData(document.getElementById('createClubForm'));
            if (!fd.get('name') || !fd.get('description')) {
                showToast('Vui lòng nhập tên và mô tả', 'warning');
                return;
            }
            const preview = document.getElementById('aiPreview');
            preview.style.display = 'block';
            preview.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
            try {
                const r = await API.analyzeClub({ name: fd.get('name'), description: fd.get('description') });
                preview.innerHTML = `
                    <div class="card" style="background:var(--gradient-ai);color:white">
                        <h4 style="color:white"><i class="fa-solid fa-robot"></i> AI Phân tích</h4>
                        <p style="color:white;margin-top:8px">${r.summary}</p>
                        <div style="margin-top:12px">
                            <strong style="color:white">Danh mục gợi ý:</strong>
                            <span class="tag-pill" style="background:rgba(255,255,255,0.2);color:white;margin-left:8px">${r.category_suggestion}</span>
                        </div>
                        <div style="margin-top:12px">
                            <strong style="color:white">Tags:</strong>
                            ${r.tags.map(t => `<span class="tag-pill" style="background:rgba(255,255,255,0.2);color:white">${t}</span>`).join('')}
                        </div>
                    </div>
                `;
            } catch (err) { showToast(err.message, 'error'); }
        });

        main.querySelector('#createClubForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = Object.fromEntries(fd);
            try {
                const c = await API.createClub(payload);
                showToast('Tạo CLB thành công!', 'success');
                App.navigate('club-detail', { id: c.id });
            } catch (err) { showToast(err.message, 'error'); }
        });
    },

    async renderCreateEvent(main) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }
        const clubs = await API.getClubs();

        main.innerHTML = `
            <section class="section">
                <div class="container" style="max-width:720px">
                    <div class="card">
                        <h2 style="margin-bottom:20px"><i class="fa-solid fa-calendar-plus" style="color:var(--primary)"></i> Tạo sự kiện mới</h2>
                        <form id="createEventForm">
                            <div class="form-group">
                                <label class="form-label">Câu lạc bộ *</label>
                                <select class="form-select" name="club_id" required>
                                    ${clubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Tiêu đề sự kiện *</label>
                                <input class="form-input" name="title" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Mô tả *</label>
                                <textarea class="form-textarea" name="description" required></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Địa điểm *</label>
                                <input class="form-input" name="location" required>
                            </div>
                            <div class="grid grid-2" style="gap:16px">
                                <div class="form-group">
                                    <label class="form-label">Thời gian bắt đầu *</label>
                                    <input class="form-input" name="start_time" type="datetime-local" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Thời gian kết thúc</label>
                                    <input class="form-input" name="end_time" type="datetime-local">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Sức chứa tối đa (0 = không giới hạn)</label>
                                <input class="form-input" name="max_participants" type="number" value="0" min="0">
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fa-solid fa-check"></i> Tạo sự kiện
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        `;

        main.querySelector('#createEventForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = Object.fromEntries(fd);
            payload.club_id = parseInt(payload.club_id);
            payload.max_participants = parseInt(payload.max_participants) || 0;
            if (payload.start_time) payload.start_time = new Date(payload.start_time).toISOString();
            if (payload.end_time) payload.end_time = new Date(payload.end_time).toISOString();
            try {
                const ev = await API.createEvent(payload);
                showToast('Tạo sự kiện thành công!', 'success');
                App.navigate('event-detail', { id: ev.id });
            } catch (err) { showToast(err.message, 'error'); }
        });
    },

    async renderCreatePost(main) {
        if (!API.isLoggedIn()) { App.navigate('login'); return; }
        const clubs = await API.getClubs();

        main.innerHTML = `
            <section class="section">
                <div class="container" style="max-width:720px">
                    <div class="card">
                        <h2 style="margin-bottom:20px"><i class="fa-solid fa-pen-to-square" style="color:var(--primary)"></i> Tạo bài viết mới</h2>
                        <form id="createPostForm">
                            <div class="form-group">
                                <label class="form-label">Câu lạc bộ *</label>
                                <select class="form-select" name="club_id" required>
                                    ${clubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Tiêu đề *</label>
                                <input class="form-input" name="title" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Nội dung *</label>
                                <textarea class="form-textarea" name="content" required rows="8"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Loại bài viết</label>
                                <select class="form-select" name="post_type">
                                    <option value="news">📰 Tin tức</option>
                                    <option value="announcement">📢 Thông báo</option>
                                    <option value="recruitment">🎯 Tuyển thành viên</option>
                                </select>
                            </div>
                            <button type="button" class="btn btn-secondary" id="aiGenBtn">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> AI hỗ trợ viết
                            </button>
                            <button type="submit" class="btn btn-primary" style="margin-top:16px">
                                <i class="fa-solid fa-check"></i> Đăng bài
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        `;

        main.querySelector('#aiGenBtn').addEventListener('click', async () => {
            const fd = new FormData(document.getElementById('createPostForm'));
            if (!fd.get('title')) { showToast('Nhập tiêu đề trước', 'warning'); return; }
            try {
                const r = await API.aiGeneratePost({ title: fd.get('title'), keywords: fd.get('content').slice(0, 100) });
                document.querySelector('[name=content]').value = r.content;
                showToast('AI đã sinh nội dung!', 'success');
            } catch (err) { showToast(err.message, 'error'); }
        });

        main.querySelector('#createPostForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = Object.fromEntries(fd);
            payload.club_id = parseInt(payload.club_id);
            try {
                await API.createPost(payload);
                showToast('Đăng bài thành công!', 'success');
                App.navigate('home');
            } catch (err) { showToast(err.message, 'error'); }
        });
    },

    // ============= HELPERS =============
    clubCard(c) {
        return `
            <div class="club-card" onclick="App.navigate('club-detail',{id:${c.id}})">
                <div class="club-banner ${getCategoryClass(c.category)}">
                    <span style="font-size:64px">${getCategoryEmoji(c.category)}</span>
                </div>
                <div class="club-card-body">
                    <span class="club-category">${getCategoryEmoji(c.category)} ${c.category}</span>
                    <h3 class="club-name">${c.name}</h3>
                    <p class="club-desc">${c.description || 'Chưa có mô tả'}</p>
                    <div class="club-meta">
                        <span class="club-members"><i class="fa-solid fa-users"></i> ${c.member_count} thành viên</span>
                        ${c.ai_tags ? '<span class="club-ai-tag"><i class="fa-solid fa-robot"></i> AI</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    },

    eventCard(e) {
        const date = new Date(e.start_time);
        return `
            <div class="event-card" onclick="App.navigate('event-detail',{id:${e.id}})">
                <div class="event-banner">
                    <div class="event-date-badge">
                        <div class="event-date-day">${date.getDate()}</div>
                        <div class="event-date-month">T${date.getMonth() + 1}</div>
                    </div>
                </div>
                <div class="event-body">
                    <span class="club-category">${e.status}</span>
                    <h3 class="event-title" style="margin-top:8px">${e.title}</h3>
                    <div class="event-meta">
                        <div class="event-meta-item"><i class="fa-solid fa-clock"></i> ${formatDateTime(e.start_time)}</div>
                        <div class="event-meta-item"><i class="fa-solid fa-location-dot"></i> ${e.location}</div>
                    </div>
                    <div class="event-footer">
                        <span style="font-size:12px;color:var(--text-mute)">${e.current_participants} người tham gia</span>
                        ${e.ai_success_score ? `<span class="event-ai-score"><i class="fa-solid fa-chart-line"></i> AI: ${Math.round(e.ai_success_score)}%</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    bindDataPageLinks(main) {
        main.querySelectorAll('[data-page]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                App.navigate(el.dataset.page);
            });
        });
    }
};

// Global helper cho Poll detail
async function showPollDetail(pollId, main) {
    const poll = await API.getPoll(pollId);
    main.innerHTML = `
        <section class="section">
            <div class="container" style="max-width:700px">
                <a onclick="App.navigate('polls')" style="cursor:pointer;color:var(--text-mute)">
                    <i class="fa-solid fa-arrow-left"></i> Quay lại
                </a>
                <div class="card" style="margin-top:16px">
                    <h2><i class="fa-solid fa-square-poll-vertical" style="color:var(--primary)"></i> ${poll.question}</h2>
                    ${poll.description ? `<p style="color:var(--text-mute)">${poll.description}</p>` : ''}
                    <div style="margin-top:24px">
                        ${poll.options.map(opt => `
                            <div class="poll-option" data-optid="${opt.id}">
                                <div class="poll-option-text">${opt.text}</div>
                                <div class="poll-option-bar" style="width:${opt.percent}%"></div>
                                <div class="poll-option-stats">
                                    <span>${opt.percent}%</span>
                                    <span>(${opt.vote_count} votes)</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top:24px;text-align:center">
                        <button class="btn btn-primary" id="voteBtn"><i class="fa-solid fa-check"></i> Vote</button>
                    </div>
                </div>
            </div>
        </section>
    `;

    let selectedIds = [];
    main.querySelectorAll('.poll-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const id = parseInt(opt.dataset.optid);
            if (poll.is_multiple) {
                if (selectedIds.includes(id)) {
                    selectedIds = selectedIds.filter(x => x !== id);
                    opt.classList.remove('selected');
                } else {
                    selectedIds.push(id);
                    opt.classList.add('selected');
                }
            } else {
                selectedIds = [id];
                document.querySelectorAll('.poll-option').forEach(x => x.classList.remove('selected'));
                opt.classList.add('selected');
            }
        });
    });

    main.querySelector('#voteBtn').addEventListener('click', async () => {
        if (selectedIds.length === 0) {
            showToast('Vui lòng chọn ít nhất 1 đáp án', 'warning');
            return;
        }
        try {
            await API.votePoll(pollId, selectedIds);
            showToast('Vote thành công!', 'success');
            showPollDetail(pollId, main);
        } catch (e) { showToast(e.message, 'error'); }
    });
}
