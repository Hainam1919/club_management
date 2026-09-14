// ============= AI PAGES =============
const AIPages = {

    // ============= AI ASSISTANT (Streaming Chat + Thought Visualizer) =============
    async renderAIAssistant(main) {
        main.innerHTML = `
            <section class="detail-header" style="background:var(--gradient-ai)">
                <div class="container">
                    <div class="detail-header-content">
                        <h1><i class="fa-solid fa-robot"></i> AI Assistant</h1>
                        <p>Chat với AI về CLB, sự kiện, chiến lược và cải thiện cộng đồng</p>
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    <div style="display:grid; grid-template-columns:1fr 320px; gap:24px; max-width:1200px;">
                        <!-- Chat Area -->
                        <div class="card">
                            <div id="aiChatMessages" style="height:600px; overflow-y:auto; display:flex; flex-direction:column; gap:16px; padding:20px; margin:-24px -24px 0 -24px; padding:20px; background:var(--bg-soft);">
                                <div class="ai-message bot">
                                    <div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>
                                    <div class="ai-msg-bubble">
                                        Xin chào! 👋 Tôi là AI Assistant của CLB Hub. Tôi có thể giúp bạn:
                                        <ul style="margin:8px 0 0 0; padding-left:20px;">
                                            <li>Tư vấn CLB phù hợp với sở thích</li>
                                            <li>Phân tích dữ liệu sự kiện</li>
                                            <li>Đưa ra chiến lược phát triển CLB</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <form id="aiChatForm" style="display:flex; gap:8px; padding:20px; background:var(--surface); border-top:1px solid var(--border);">
                                <input type="text" id="aiChatInput" placeholder="Nhập câu hỏi..."
                                    style="flex:1; padding:12px 16px; border:1px solid var(--border); border-radius:var(--radius-full); background:var(--bg-soft);">
                                <button type="submit" id="aiChatSubmit" class="btn btn-primary btn-icon" style="width:44px; height:44px;">
                                    <i class="fa-solid fa-paper-plane"></i>
                                </button>
                            </form>
                        </div>

                        <!-- Thought Process Panel -->
                        <div class="card" style="height:fit-content;">
                            <h3 style="font-size:16px; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-lightbulb"></i> Tư duy AI
                            </h3>
                            <div id="aiThoughts" style="max-height:500px; overflow-y:auto;">
                                <div style="color:var(--text-mute); font-size:13px; text-align:center; padding:20px;">
                                    Tư duy sẽ hiện khi có câu trả lời...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Chat event handlers
        const form = main.querySelector('#aiChatForm');
        const input = main.querySelector('#aiChatInput');
        const messagesDiv = main.querySelector('#aiChatMessages');
        const thoughtsDiv = main.querySelector('#aiThoughts');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = input.value.trim();
            if (!message) return;

            input.value = '';

            // Add user message
            const userMsgDiv = document.createElement('div');
            userMsgDiv.className = 'ai-message user';
            userMsgDiv.innerHTML = `
                <div class="ai-msg-avatar"><i class="fa-solid fa-user"></i></div>
                <div class="ai-msg-bubble">${escapeHtml(message)}</div>
            `;
            messagesDiv.appendChild(userMsgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            // Show loading
            thoughtsDiv.innerHTML = '<div style="text-align:center; padding:12px;"><div class="spinner" style="margin:0 auto;"></div></div>';

            try {
                const response = await API.aiChatStream(message, null, 'general');

                await StreamingHandler.handleStream(response, {
                    onThought: (content, step) => {
                        renderThoughts(Array.from(thoughtsDiv.querySelectorAll('.ai-thought')).map(el => el.textContent).concat([content]), thoughtsDiv);
                    },
                    onContent: (content) => {
                        StreamingHandler.updateStreamingMessage(messagesDiv, content);
                    },
                    onError: (err) => {
                        thoughtsDiv.innerHTML = `<div style="color:var(--danger); font-size:13px; padding:12px;">⚠️ ${err}</div>`;
                    }
                });
            } catch (err) {
                thoughtsDiv.innerHTML = `<div style="color:var(--danger); font-size:13px; padding:12px;">⚠️ ${err.message}</div>`;
            }

            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
    },

    // ============= AI STUDIO (4 Tabs: Mentor, Strategy, Event, Media) =============
    async renderAIStudio(main) {
        const user = API.getUser();
        const clubs = user ? await API.getClubs().catch(() => []) : [];

        main.innerHTML = `
            <section class="detail-header" style="background:var(--gradient-ai)">
                <div class="container">
                    <div class="detail-header-content">
                        <h1><i class="fa-solid fa-wand-magic-sparkles"></i> AI Studio</h1>
                        <p>Tạo nội dung, lên chiến lược và quản lý sự kiện với AI</p>
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    <div class="tabs" id="studioTabs">
                        <div class="tab active" data-tab="mentor"><i class="fa-solid fa-person-chalkboard"></i> Mentor</div>
                        <div class="tab" data-tab="strategy"><i class="fa-solid fa-chess"></i> Chiến lược</div>
                        <div class="tab" data-tab="event"><i class="fa-solid fa-calendar-check"></i> Sự kiện</div>
                        <div class="tab" data-tab="media"><i class="fa-solid fa-image"></i> Nội dung</div>
                    </div>

                    <!-- TAB 1: MENTOR -->
                    <div class="tab-content active" data-tab="mentor">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                            <div class="card">
                                <h3>Tư vấn Mentor</h3>
                                <form id="mentorForm" style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">
                                    <div>
                                        <label class="form-label">Chọn CLB</label>
                                        <select id="mentorClubId" class="form-select" required>
                                            <option value="">-- Chọn CLB --</option>
                                            ${clubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">Chủ đề tư vấn</label>
                                        <textarea id="mentorTopic" class="form-textarea" placeholder="VD: Làm sao phát triển thành viên mới?" required></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-primary"><i class="fa-solid fa-wand-magic-sparkles"></i> Nhận tư vấn</button>
                                </form>
                            </div>
                            <div id="mentorResult" class="card" style="background:var(--bg-soft); display:none;">
                                <h3>Lời tư vấn</h3>
                                <div id="mentorContent" style="margin-top:16px; color:var(--text-soft); line-height:1.8;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: STRATEGY -->
                    <div class="tab-content" data-tab="strategy" style="display:none;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                            <div class="card">
                                <h3>Phát triển Chiến lược</h3>
                                <form id="strategyForm" style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">
                                    <div>
                                        <label class="form-label">CLB của bạn</label>
                                        <select id="strategyClubId" class="form-select" required>
                                            <option value="">-- Chọn CLB --</option>
                                            ${clubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">Mục tiêu (3-6 tháng)</label>
                                        <textarea id="strategyGoal" class="form-textarea" placeholder="VD: Tăng thành viên từ 20 lên 50, tổ chức 4 sự kiện..." required></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-primary"><i class="fa-solid fa-chess"></i> Tạo chiến lược</button>
                                </form>
                            </div>
                            <div id="strategyResult" class="card" style="background:var(--bg-soft); display:none;">
                                <h3>Chiến lược AI</h3>
                                <div id="strategyContent" style="margin-top:16px; color:var(--text-soft); line-height:1.8;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 3: EVENT -->
                    <div class="tab-content" data-tab="event" style="display:none;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                            <div class="card">
                                <h3>Lên kế hoạch Sự kiện</h3>
                                <form id="eventForm" style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">
                                    <div>
                                        <label class="form-label">CLB</label>
                                        <select id="eventClubId" class="form-select" required>
                                            <option value="">-- Chọn CLB --</option>
                                            ${clubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">Loại sự kiện</label>
                                        <select id="eventType" class="form-select" required>
                                            <option value="">-- Chọn loại --</option>
                                            <option value="workshop">Workshop</option>
                                            <option value="seminar">Seminar</option>
                                            <option value="social">Social</option>
                                            <option value="competition">Cuộc thi</option>
                                            <option value="training">Đào tạo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">Mô tả sự kiện</label>
                                        <textarea id="eventDesc" class="form-textarea" placeholder="Mô tả chi tiết sự kiện bạn muốn tổ chức..." required></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-primary"><i class="fa-solid fa-calendar-check"></i> Lên kế hoạch</button>
                                </form>
                            </div>
                            <div id="eventResult" class="card" style="background:var(--bg-soft); display:none;">
                                <h3>Kế hoạch sự kiện</h3>
                                <div id="eventContent" style="margin-top:16px; color:var(--text-soft); line-height:1.8;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 4: MEDIA -->
                    <div class="tab-content" data-tab="media" style="display:none;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                            <div class="card">
                                <h3>Tạo Nội dung Truyền thông</h3>
                                <form id="mediaForm" style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">
                                    <div>
                                        <label class="form-label">CLB</label>
                                        <select id="mediaClubId" class="form-select" required>
                                            <option value="">-- Chọn CLB --</option>
                                            ${clubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">Loại nội dung</label>
                                        <select id="mediaType" class="form-select" required>
                                            <option value="">-- Chọn loại --</option>
                                            <option value="post">Post mạng xã hội</option>
                                            <option value="story">Story</option>
                                            <option value="newsletter">Newsletter</option>
                                            <option value="announcement">Thông báo</option>
                                            <option value="guide">Hướng dẫn</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">Chủ đề nội dung</label>
                                        <textarea id="mediaTopics" class="form-textarea" placeholder="VD: Tuyên bố tuyển thành viên mới..." required></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-primary"><i class="fa-solid fa-wand-magic-sparkles"></i> Tạo nội dung</button>
                                </form>
                            </div>
                            <div id="mediaResult" class="card" style="background:var(--bg-soft); display:none;">
                                <h3>Nội dung AI</h3>
                                <div id="mediaContent" style="margin-top:16px; color:var(--text-soft); line-height:1.8;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Tab switching
        main.querySelectorAll('#studioTabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                main.querySelectorAll('#studioTabs .tab').forEach(t => t.classList.remove('active'));
                main.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                tab.classList.add('active');
                main.querySelector(`.tab-content[data-tab="${tab.dataset.tab}"]`).style.display = 'block';
            });
        });

        // Mentor form
        main.querySelector('#mentorForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const clubId = main.querySelector('#mentorClubId').value;
            const topic = main.querySelector('#mentorTopic').value;
            const resultDiv = main.querySelector('#mentorResult');
            const contentDiv = main.querySelector('#mentorContent');

            if (!clubId) {
                contentDiv.innerHTML = `<p style="color:var(--danger);">Vui lòng chọn CLB</p>`;
                resultDiv.style.display = 'block';
                return;
            }

            try {
                contentDiv.innerHTML = '<div class="spinner" style="margin:20px auto;"></div>';
                resultDiv.style.display = 'block';

                const data = await API.aiMentorChat(topic, clubId);
                const response = data.response || data.content || data.message || '';
                contentDiv.innerHTML = `<p>${response.replace(/\n/g, '<br>')}</p>`;
            } catch (err) {
                contentDiv.innerHTML = `<p style="color:var(--danger);">❌ ${err.message}</p>`;
            }
        });

        // Strategy form
        main.querySelector('#strategyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const clubId = main.querySelector('#strategyClubId').value;
            const goal = main.querySelector('#strategyGoal').value;
            const resultDiv = main.querySelector('#strategyResult');
            const contentDiv = main.querySelector('#strategyContent');

            if (!clubId) {
                contentDiv.innerHTML = `<p style="color:var(--danger);">Vui lòng chọn CLB</p>`;
                resultDiv.style.display = 'block';
                return;
            }

            try {
                contentDiv.innerHTML = '<div class="spinner" style="margin:20px auto;"></div>';
                resultDiv.style.display = 'block';

                const data = await API.aiStrategyAdvice({ club_id: clubId, goals: goal });
                const strategy = data.strategy || data.content || data.message || '';
                contentDiv.innerHTML = `<p>${strategy.replace(/\n/g, '<br>')}</p>`;
            } catch (err) {
                contentDiv.innerHTML = `<p style="color:var(--danger);">❌ ${err.message}</p>`;
            }
        });

        // Event form
        main.querySelector('#eventForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const clubId = main.querySelector('#eventClubId').value;
            const eventType = main.querySelector('#eventType').value;
            const eventDesc = main.querySelector('#eventDesc').value;
            const resultDiv = main.querySelector('#eventResult');
            const contentDiv = main.querySelector('#eventContent');

            if (!clubId) {
                contentDiv.innerHTML = `<p style="color:var(--danger);">Vui lòng chọn CLB</p>`;
                resultDiv.style.display = 'block';
                return;
            }

            try {
                contentDiv.innerHTML = '<div class="spinner" style="margin:20px auto;"></div>';
                resultDiv.style.display = 'block';

                const data = await API.aiEventPlanning(clubId, { type: eventType, description: eventDesc });
                const plan = data.plan || data.content || data.message || '';
                contentDiv.innerHTML = `<p>${plan.replace(/\n/g, '<br>')}</p>`;
            } catch (err) {
                contentDiv.innerHTML = `<p style="color:var(--danger);">❌ ${err.message}</p>`;
            }
        });

        // Media form
        main.querySelector('#mediaForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const clubId = main.querySelector('#mediaClubId').value;
            const mediaType = main.querySelector('#mediaType').value;
            const topics = main.querySelector('#mediaTopics').value;
            const resultDiv = main.querySelector('#mediaResult');
            const contentDiv = main.querySelector('#mediaContent');

            if (!clubId) {
                contentDiv.innerHTML = `<p style="color:var(--danger);">Vui lòng chọn CLB</p>`;
                resultDiv.style.display = 'block';
                return;
            }

            try {
                contentDiv.innerHTML = '<div class="spinner" style="margin:20px auto;"></div>';
                resultDiv.style.display = 'block';

                const data = await API.aiMediaContent(clubId, mediaType);
                const content = data.content || data.message || '';
                contentDiv.innerHTML = `<p>${content.replace(/\n/g, '<br>')}</p>`;
            } catch (err) {
                contentDiv.innerHTML = `<p style="color:var(--danger);">❌ ${err.message}</p>`;
            }
        });
    },

    // ============= AI INSIGHTS (Analytics & Predictions) =============
    async renderAIInsights(main) {
        try {
            const [predictions, analytics, trends, recommendations] = await Promise.all([
                API.aiGetPredictions().catch(() => null),
                API.aiGetAnalytics().catch(() => null),
                API.aiGetTrends().catch(() => null),
                API.aiGetRecommendations().catch(() => null)
            ]);

            main.innerHTML = `
                <section class="detail-header" style="background:var(--gradient-ai)">
                    <div class="container">
                        <div class="detail-header-content">
                            <h1><i class="fa-solid fa-chart-line"></i> AI Insights</h1>
                            <p>Phân tích, dự báo và khuyến nghị từ AI</p>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <div class="container">
                        <!-- Predictions -->
                        <div class="card" style="margin-bottom:24px;">
                            <h3 style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
                                <i class="fa-solid fa-crystal-ball"></i> Dự báo
                            </h3>
                            ${predictions ? `
                                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:16px;">
                                    ${predictions.map(p => `
                                        <div style="padding:16px; background:var(--bg-soft); border-radius:var(--radius); border-left:3px solid var(--primary);">
                                            <h4 style="font-size:14px; font-weight:600; margin-bottom:8px;">${p.title}</h4>
                                            <p style="font-size:13px; color:var(--text-soft);">${p.prediction}</p>
                                            <div style="display:flex; gap:8px; margin-top:12px;">
                                                <span class="badge badge-info">${p.confidence}% chắc chắn</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p style="color:var(--text-mute);">Chưa có dữ liệu dự báo</p>'}
                        </div>

                        <!-- Analytics -->
                        <div class="card" style="margin-bottom:24px;">
                            <h3 style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
                                <i class="fa-solid fa-chart-bar"></i> Phân tích
                            </h3>
                            ${analytics ? `
                                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:16px;">
                                    ${analytics.map(a => `
                                        <div style="padding:16px; background:var(--bg-soft); border-radius:var(--radius);">
                                            <div style="font-size:24px; font-weight:800; color:var(--primary); margin-bottom:4px;">${a.value}</div>
                                            <div style="font-size:13px; color:var(--text-soft);">${a.label}</div>
                                            <div style="font-size:11px; color:var(--text-mute); margin-top:8px;">${a.change}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p style="color:var(--text-mute);">Chưa có dữ liệu phân tích</p>'}
                        </div>

                        <!-- Trends -->
                        <div class="card">
                            <h3 style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
                                <i class="fa-solid fa-arrow-trend-up"></i> Xu hướng
                            </h3>
                            ${trends ? `
                                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:16px;">
                                    ${trends.map(t => `
                                        <div style="padding:16px; background:var(--bg-soft); border-radius:var(--radius);">
                                            <h4 style="font-size:14px; font-weight:600; margin-bottom:8px;">${t.name}</h4>
                                            <p style="font-size:13px; color:var(--text-soft);">${t.description}</p>
                                            <div style="margin-top:12px; height:60px; background:white; border-radius:4px;"></div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p style="color:var(--text-mute);">Chưa có dữ liệu xu hướng</p>'}
                        </div>
                    </div>
                </section>
            `;
        } catch (err) {
            main.innerHTML = `
                <section class="section">
                    <div class="container">
                        <div class="card" style="text-align:center; padding:60px 20px;">
                            <i class="fa-solid fa-exclamation-circle" style="font-size:48px; color:var(--danger); margin-bottom:16px;"></i>
                            <h3>Lỗi tải dữ liệu</h3>
                            <p style="color:var(--text-mute);">${err.message}</p>
                        </div>
                    </div>
                </section>
            `;
        }
    },

    // ============= LEADERBOARD =============
    async renderLeaderboard(main) {
        try {
            const [leaderboard, myRank] = await Promise.all([
                API.getLeaderboard('month'),
                API.isLoggedIn() ? API.getMyRank().catch(() => null) : null
            ]);

            main.innerHTML = `
                <section class="detail-header" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <div class="container">
                        <div class="detail-header-content">
                            <h1><i class="fa-solid fa-trophy"></i> Xếp hạng Sinh viên</h1>
                            <p>Top những sinh viên nổi bật trong cộng đồng CLB</p>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <div class="container">
                        ${myRank ? `
                            <div class="card" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color:white; margin-bottom:24px; display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:16px; text-align:center;">
                                <div>
                                    <div style="font-size:32px; font-weight:800;">#${myRank.rank}</div>
                                    <div style="font-size:13px; opacity:0.9;">Xếp hạng của bạn</div>
                                </div>
                                <div>
                                    <div style="font-size:32px; font-weight:800;">${myRank.points}</div>
                                    <div style="font-size:13px; opacity:0.9;">Điểm</div>
                                </div>
                                <div>
                                    <div style="font-size:32px; font-weight:800;">${myRank.clubs}</div>
                                    <div style="font-size:13px; opacity:0.9;">CLB tham gia</div>
                                </div>
                                <div>
                                    <div style="font-size:32px; font-weight:800;">${myRank.events}</div>
                                    <div style="font-size:13px; opacity:0.9;">Sự kiện</div>
                                </div>
                            </div>
                        ` : ''}

                        <div class="card">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:2px solid var(--border);">
                                        <th style="padding:16px; text-align:left; font-weight:600; color:var(--text-mute);">Xếp hạng</th>
                                        <th style="padding:16px; text-align:left; font-weight:600; color:var(--text-mute);">Sinh viên</th>
                                        <th style="padding:16px; text-align:center; font-weight:600; color:var(--text-mute);">Điểm</th>
                                        <th style="padding:16px; text-align:center; font-weight:600; color:var(--text-mute);">CLB</th>
                                        <th style="padding:16px; text-align:center; font-weight:600; color:var(--text-mute);">Sự kiện</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${leaderboard.map((user, idx) => `
                                        <tr style="border-bottom:1px solid var(--border); transition:background 0.2s;">
                                            <td style="padding:16px; font-weight:700; font-size:18px;">
                                                ${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                            </td>
                                            <td style="padding:16px;">
                                                <div style="display:flex; align-items:center; gap:12px;">
                                                    <div style="width:40px; height:40px; border-radius:50%; background:var(--gradient-ai); color:white; display:grid; place-items:center; font-weight:700;">
                                                        ${user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style="font-weight:600;">${user.name}</div>
                                                        <div style="font-size:12px; color:var(--text-mute);">${user.major || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style="padding:16px; text-align:center; font-weight:700; color:var(--primary);">${user.points}</td>
                                            <td style="padding:16px; text-align:center;">${user.clubs_count}</td>
                                            <td style="padding:16px; text-align:center;">${user.events_count}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            `;
        } catch (err) {
            main.innerHTML = `
                <section class="section">
                    <div class="container">
                        <div class="card" style="text-align:center; padding:60px 20px;">
                            <i class="fa-solid fa-exclamation-circle" style="font-size:48px; color:var(--danger); margin-bottom:16px;"></i>
                            <h3>Lỗi tải xếp hạng</h3>
                            <p style="color:var(--text-mute);">${err.message}</p>
                        </div>
                    </div>
                </section>
            `;
        }
    }
};

// ============= HELPERS =============
function renderThoughts(thoughts, container) {
    let html = '';
    thoughts.forEach((thought, idx) => {
        const cleanThought = typeof thought === 'string' ? thought : (thought.textContent || '');
        if (cleanThought.trim()) {
            html += `
                <div class="ai-thought" style="margin-bottom:12px; animation:slideUpFade 0.3s ease-out;">
                    <div class="ai-thought-header" style="display:flex; align-items:center; gap:8px; font-weight:600; color:var(--text); margin-bottom:8px;">
                        <i class="fa-solid fa-lightbulb"></i> Bước ${idx + 1}
                    </div>
                    <div class="ai-thought-content" style="padding:8px 12px; background:var(--bg-soft); border-radius:6px; font-size:13px; line-height:1.5; color:var(--text-soft);">${escapeHtml(cleanThought)}</div>
                </div>
            `;
        }
    });
    if (html) {
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div style="color:var(--text-mute); font-size:13px; text-align:center; padding:20px;">Đang tư duy...</div>';
    }
}

function updateAIMessage(container, content) {
    let lastMsg = container.querySelector('.ai-message.bot:last-of-type');
    if (!lastMsg) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'ai-message bot';
        msgDiv.innerHTML = `
            <div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="ai-msg-bubble"></div>
        `;
        container.appendChild(msgDiv);
        lastMsg = msgDiv;
    }
    const bubble = lastMsg.querySelector('.ai-msg-bubble');
    bubble.innerHTML = content.replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
