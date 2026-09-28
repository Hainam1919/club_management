// ============= AI PAGES =============
const AIPages = {

    // ============= AI ASSISTANT (Streaming Chat + Thought Visualizer Realtime) =============
    async renderAIAssistant(main) {
        main.innerHTML = `
            <section class="detail-header" style="background:var(--gradient-ai)">
                <div class="container">
                    <div class="detail-header-content">
                        <h1><i class="fa-solid fa-robot"></i> AI Assistant</h1>
                        <p>Chat với AI về CLB, sự kiện, chiến lược và cải thiện cộng đồng</p>
                        <div>
                            <span class="badge badge-primary" id="aiModelChip"><i class="fa-solid fa-microchip"></i> Đang khởi động...</span>
                        </div>
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="container">
                    <div style="display:grid; grid-template-columns:1fr 340px; gap:24px; max-width:1200px;">
                        <!-- Chat Area -->
                        <div class="card">
                            <div id="aiChatMessages" style="height:580px; overflow-y:auto; display:flex; flex-direction:column; gap:16px; padding:20px; background:var(--bg-soft);">
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

                            <form id="aiChatForm" style="display:flex; gap:8px; padding:16px; background:var(--surface); border-top:1px solid var(--border);">
                                <input type="text" id="aiChatInput" placeholder="Nhập câu hỏi..."
                                    style="flex:1; padding:12px 16px; border:1px solid var(--border); border-radius:var(--radius-full); background:var(--bg-soft);">
                                <button type="submit" id="aiChatSubmit" class="btn btn-primary btn-icon" style="width:44px; height:44px;">
                                    <i class="fa-solid fa-paper-plane"></i>
                                </button>
                            </form>
                        </div>

                        <!-- Thought Process Panel -->
                        <div class="card" style="position:sticky; top:24px; height:fit-content;">
                            <h3 style="font-size:16px; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-brain"></i> Bộ não AI
                            </h3>
                            <p style="font-size:12px; color:var(--text-mute); margin-bottom:12px;">Quan sát quá trình suy luận theo thời gian thực</p>
                            <div id="aiThoughts" style="max-height:480px; overflow-y:auto;"></div>
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Model info chip
        API.aiGetModelInfo().then(info => {
            const chip = main.querySelector('#aiModelChip');
            if (!chip) return;
            if (info.available) {
                const model = info.default_model || 'llama';
                chip.innerHTML = `<i class="fa-solid fa-microchip"></i> Ollama · ${escapeHtml(model)} <span style="opacity:.7">(${info.loaded_models.length} model sẵn sàng)</span>`;
                chip.className = 'badge badge-success';
            } else {
                chip.innerHTML = `<i class="fa-solid fa-lightbulb"></i> Chế độ chuyên gia (offline)` ;
                chip.className = 'badge badge-warning';
            }
        }).catch(() => {
            const chip = main.querySelector('#aiModelChip');
            if (chip) chip.remove();
        });

        // Chat event handlers
        const form = main.querySelector('#aiChatForm');
        const input = main.querySelector('#aiChatInput');
        const messagesDiv = main.querySelector('#aiChatMessages');
        const panel = createThoughtPanel(main.querySelector('#aiThoughts'));

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = input.value.trim();
            if (!message) return;

            input.value = '';
            messagesDiv.querySelector('.ai-msg-bubble')?.parentElement?.scrollIntoView({ block: 'end' });

            const userMsgDiv = document.createElement('div');
            userMsgDiv.className = 'ai-message user';
            userMsgDiv.innerHTML = `
                <div class="ai-msg-avatar"><i class="fa-solid fa-user"></i></div>
                <div class="ai-msg-bubble">${escapeHtml(message)}</div>
            `;
            messagesDiv.appendChild(userMsgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            panel.clear();
            panel.loading(true);

            try {
                const response = await API.aiChatStream(message, null, 'general');

                await StreamingHandler.handleStream(response, {
                    onThought: (content, data, title) => {
                        panel.loading(false);
                        panel.add({
                            stepName: data.step_name || data.type,
                            title: title,
                            content: content,
                            status: data.status || 'completed'
                        });
                    },
                    onContent: (content) => {
                        StreamingHandler.updateStreamingMessage(messagesDiv, content);
                    },
                    onError: (err) => {
                        panel.loading(false);
                        panel.add({ title: '⚠️ Lỗi', content: err, status: 'error' });
                    },
                    onComplete: () => panel.loading(false)
                });
            } catch (err) {
                panel.loading(false);
                panel.add({ title: '⚠️ Lỗi', content: err.message, status: 'error' });
            }

            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
    },

    // ============= AI STUDIO PRO (4 Agents + Realtime Thought Visualizer) =============
    async renderAIStudio(main) {
        const user = API.getUser();
        const clubs = user ? await API.getClubs().catch(() => []) : [];

        main.innerHTML = `
            <section class="detail-header" style="background:var(--gradient-ai)">
                <div class="container">
                    <div class="detail-header-content">
                        <h1><i class="fa-solid fa-wand-magic-sparkles"></i> AI Studio Pro</h1>
                        <p>Giao diện 4 chuyên gia AI · xem bộ não AI suy luận từng bước theo thời gian thực</p>
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

                    <div style="display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; margin-top:24px;">
                        <div>
                            <!-- TAB 1: MENTOR -->
                            <div class="tab-content active" data-tab="mentor">
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                                    <div class="card">
                                        <h3><i class="fa-solid fa-person-chalkboard" style="color:var(--primary)"></i> Tư vấn Mentor</h3>
                                        <form id="mentorForm" style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">
                                            <div>
                                                <label class="form-label">Vai trò mục tiêu</label>
                                                <input type="text" id="mentorRole" class="form-input" value="Phát triển toàn diện" placeholder="VD: AI Engineer, Tech Lead...">
                                            </div>
                                            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-wand-magic-sparkles"></i> Tạo lộ trình</button>
                                        </form>
                                    </div>
                                    <div id="mentorResult" class="card" style="background:var(--bg-soft); display:none;">
                                        <h3>📋 Lộ trình & Khuyến nghị</h3>
                                        <div id="mentorContent" style="margin-top:16px; color:var(--text-soft); line-height:1.8;"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- TAB 2: STRATEGY -->
                            <div class="tab-content" data-tab="strategy" style="display:none;">
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                                    <div class="card">
                                        <h3><i class="fa-solid fa-chess" style="color:var(--secondary)"></i> Phát triển Chiến lược</h3>
                                        <form id="strategyForm" style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">
                                            <div>
                                                <label class="form-label">Chọn CLB cần chẩn đoán</label>
                                                <select id="strategyClubId" class="form-select" required>
                                                    <option value="">-- Chọn CLB --</option>
                                                    ${clubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                                </select>
                                            </div>
                                            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-chess"></i> Chẩn đoán & chiến lược</button>
                                        </form>
                                    </div>
                                    <div id="strategyResult" class="card" style="background:var(--bg-soft); display:none;">
                                        <h3>📊 Chiến lược AI</h3>
                                        <div id="strategyContent" style="margin-top:16px; color:var(--text-soft); line-height:1.8;"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- TAB 3: EVENT -->
                            <div class="tab-content" data-tab="event" style="display:none;">
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                                    <div class="card">
                                        <h3><i class="fa-solid fa-calendar-check" style="color:var(--warning)"></i> Lên kế hoạch Sự kiện</h3>
                                        <form id="eventForm" style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">
                                            <div>
                                                <label class="form-label">Tên sự kiện</label>
                                                <input type="text" id="eventTitle" class="form-input" placeholder="VD: AI Hackathon 2026" required>
                                            </div>
                                            <div>
                                                <label class="form-label">Ý tưởng / Concept</label>
                                                <textarea id="eventConcept" class="form-textarea" placeholder="Mô tả ý tưởng sự kiện..." required></textarea>
                                            </div>
                                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                                                <div>
                                                    <label class="form-label">Số người dự kiến</label>
                                                    <input type="number" id="eventAttendees" class="form-input" value="100" min="1">
                                                </div>
                                                <div>
                                                    <label class="form-label">Ngân sách (VNĐ)</label>
                                                    <input type="number" id="eventBudget" class="form-input" value="5000000" min="0">
                                                </div>
                                            </div>
                                            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-calendar-check"></i> Thiết kế kịch bản</button>
                                        </form>
                                    </div>
                                    <div id="eventResult" class="card" style="background:var(--bg-soft); display:none;">
                                        <h3>🎬 Kế hoạch & Timeline</h3>
                                        <div id="eventContent" style="margin-top:16px; color:var(--text-soft); line-height:1.8;"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- TAB 4: MEDIA -->
                            <div class="tab-content" data-tab="media" style="display:none;">
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                                    <div class="card">
                                        <h3><i class="fa-solid fa-image" style="color:var(--accent)"></i> Tạo Nội dung Truyền thông</h3>
                                        <form id="mediaForm" style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">
                                            <div>
                                                <label class="form-label">Tiêu đề nội dung</label>
                                                <input type="text" id="mediaTitle" class="form-input" placeholder="VD: Tuyển quân CLB Lập trình 2026" required>
                                            </div>
                                            <div>
                                                <label class="form-label">Chi tiết / Chủ đề</label>
                                                <textarea id="mediaTopics" class="form-textarea" placeholder="VD: Chào đón sinh viên đam mê code, tham gia hackathon..." required></textarea>
                                            </div>
                                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                                                <div>
                                                    <label class="form-label">Đối tượng</label>
                                                    <select id="mediaAudience" class="form-select">
                                                        <option value="Sinh viên toàn trường">Sinh viên toàn trường</option>
                                                        <option value="Tân sinh viên">Tân sinh viên</option>
                                                        <option value="Thành viên CLB">Thành viên CLB</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label class="form-label">Giọng văn</label>
                                                    <select id="mediaTone" class="form-select">
                                                        <option value="genz_energetic">GenZ năng động</option>
                                                        <option value="formal_academic">Trang trọng / học thuật</option>
                                                        <option value="inspiring">Truyền cảm hứng</option>
                                                        <option value="exciting">Hào hứng (FOMO)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-wand-magic-sparkles"></i> Tạo Media Kit</button>
                                        </form>
                                    </div>
                                    <div id="mediaResult" class="card" style="background:var(--bg-soft); display:none;">
                                        <h3>📣 Media Kit</h3>
                                        <div id="mediaContent" style="margin-top:16px; color:var(--text-soft); line-height:1.8;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Shared Realtime Thought Visualizer -->
                        <div class="card" style="position:sticky; top:24px; height:fit-content;">
                            <h3 style="font-size:16px; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-brain"></i> Bộ não AI
                            </h3>
                            <p style="font-size:12px; color:var(--text-mute); margin-bottom:12px;">Chuyên gia đang suy luận theo thời gian thực</p>
                            <div id="studioThoughts" style="max-height:520px; overflow-y:auto;"></div>
                        </div>
                    </div>
                </div>
            </section>
        `;

        const panel = createThoughtPanel(main.querySelector('#studioThoughts'));

        // Tab switching
        main.querySelectorAll('#studioTabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                main.querySelectorAll('#studioTabs .tab').forEach(t => t.classList.remove('active'));
                main.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                tab.classList.add('active');
                main.querySelector(`.tab-content[data-tab="${tab.dataset.tab}"]`).style.display = 'block';
            });
        });

        // Shared handler skeleton
        const runAgent = async (agent, payload, resultDiv, contentDiv) => {
            resultDiv.style.display = 'block';
            contentDiv.innerHTML = '<div class="spinner" style="margin:20px auto;"></div>';
            panel.clear();
            panel.loading(true);

            try {
                const stream = await API.aiAgentStream(agent, payload);
                await StreamingHandler.handleStream(stream, {
                    onThought: (content, data, title) => {
                        panel.loading(false);
                        panel.add({
                            stepName: data.step_name || data.type || ('s' + Math.floor(Math.random() * 1000)),
                            title: title,
                            content: content || '',
                            status: data.status || 'completed'
                        });
                    },
                    onResult: (result) => {
                        panel.loading(false);
                        renderAgentResult(contentDiv, result);
                        if (agent === 'media') AIPages._postMediaRender(contentDiv);
                    },
                    onError: (err) => {
                        panel.loading(false);
                        contentDiv.innerHTML = `<p style="color:var(--danger);">❌ ${escapeHtml(err)}</p>`;
                        panel.add({ title: '⚠️ Lỗi', content: err, status: 'error' });
                    },
                    onComplete: () => panel.loading(false)
                });
            } catch (err) {
                panel.loading(false);
                contentDiv.innerHTML = `<p style="color:var(--danger);">❌ ${escapeHtml(err.message)}</p>`;
            }
        };

        // Mentor
        main.querySelector('#mentorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const role = main.querySelector('#mentorRole').value.trim() || 'Phát triển toàn diện';
            runAgent('mentor', { target_role: role }, main.querySelector('#mentorResult'), main.querySelector('#mentorContent'));
        });

        // Strategy
        main.querySelector('#strategyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const clubId = main.querySelector('#strategyClubId').value;
            if (!clubId) {
                showToast('Vui lòng chọn CLB', 'error');
                return;
            }
            runAgent('strategy', { club_id: parseInt(clubId) }, main.querySelector('#strategyResult'), main.querySelector('#strategyContent'));
        });

        // Event
        main.querySelector('#eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = main.querySelector('#eventTitle').value.trim();
            const concept = main.querySelector('#eventConcept').value.trim();
            if (!title || !concept) {
                showToast('Vui lòng nhập tên và ý tưởng sự kiện', 'error');
                return;
            }
            runAgent('event', {
                title,
                concept,
                expected_attendees: parseInt(main.querySelector('#eventAttendees').value) || 100,
                estimated_budget_vnd: parseInt(main.querySelector('#eventBudget').value) || 5000000
            }, main.querySelector('#eventResult'), main.querySelector('#eventContent'));
        });

        // Media
        main.querySelector('#mediaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = main.querySelector('#mediaTitle').value.trim();
            const topics = main.querySelector('#mediaTopics').value.trim();
            if (!title) {
                showToast('Vui lòng nhập tiêu đề nội dung', 'error');
                return;
            }
            runAgent('media', {
                title,
                topic_details: topics,
                target_audience: main.querySelector('#mediaAudience').value,
                tone: main.querySelector('#mediaTone').value
            }, main.querySelector('#mediaResult'), main.querySelector('#mediaContent'));
        });
    },

    // ============= MEDIA RESULT POST-RENDER (Copy Buttons) =============
    _postMediaRender(container) {
        ['facebook_post', 'formal_email', 'mc_opening_script', 'slogans', 'visual_concept_brief'].forEach(key => {
            const block = container.querySelector(`[data-key="${key}"]`);
            if (!block) return;
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary btn-sm';
            btn.style.cssText = 'margin-top:8px;font-size:12px;padding:4px 10px;';
            btn.innerHTML = '<i class="fa-solid fa-copy"></i> Sao chép';
            btn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(block.dataset.clip || block.innerText);
                    showToast('Đã sao chép!', 'success');
                } catch (err) { showToast('Không thể sao chép', 'error'); }
            });
            block.appendChild(btn);
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
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p style="color:var(--text-mute);">Chưa có dữ liệu xu hướng</p>'}
                        </div>

                        <!-- Recommendations -->
                        <div class="card" style="margin-top:24px;">
                            <h3 style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
                                <i class="fa-solid fa-lightbulb"></i> Gợi ý cho bạn
                            </h3>
                            ${recommendations && recommendations.clubs?.length ? `
                                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:16px;">
                                    ${recommendations.clubs.map(r => `
                                        <div style="padding:16px; background:var(--bg-soft); border-radius:var(--radius);">
                                            <h4 style="font-size:14px; font-weight:600; margin-bottom:8px;">${r.club?.name || 'CLB'}</h4>
                                            <p style="font-size:13px; color:var(--text-soft);">${r.reason || ''}</p>
                                            <span class="badge badge-success" style="margin-top:8px;">Match ${Math.round((r.score || 0) * 100)}%</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p style="color:var(--text-mute);">Chưa có gợi ý</p>'}
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
                            <p style="color:var(--text-mute);">${escapeHtml(err.message)}</p>
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
                            <p style="color:var(--text-mute);">${escapeHtml(err.message)}</p>
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
    div.textContent = text ?? '';
    return div.innerHTML;
}