// ============= STREAMING HANDLER =============
const StreamingHandler = {
    /**
     * Handle SSE streaming response
     * @param {Response} response - Fetch response with streaming body
     * @param {Object} handlers - Event handlers { onThought, onContent, onResult, onStatus, onComplete, onError }
     */
    async handleStream(response, handlers = {}) {
        const {
            onThought = () => {},
            onContent = () => {},
            onResult = () => {},
            onStatus = () => {},
            onComplete = () => {},
            onError = () => {}
        } = handlers;

        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Stream error' }));
            onError(err.message || 'Stream failed');
            return;
        }

        try {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'token') {
                                // Token streaming - accumulate content
                                fullContent += data.content || '';
                                onContent(fullContent);
                            } else if (data.type === 'thought' || data.type === 'thought_step') {
                                // Thought step from reasoning (title/status/step_name metadata)
                                onThought(
                                    data.content || data.title || '',
                                    data,
                                    data.title || `Bước ${data.step || ''}`
                                );
                            } else if (data.type === 'result') {
                                // Final structured payload from AI Pro agents
                                onResult(data.content, data);
                            } else if (data.type === 'status') {
                                onStatus(data);
                            } else if (data.type === 'content') {
                                // Complete content chunk
                                fullContent += data.content || '';
                                onContent(fullContent);
                            } else if (data.type === 'complete' || data.type === 'done') {
                                // Stream finished
                                onComplete(data);
                            } else if (data.type === 'observation') {
                                // Tool observation
                                onThought(data.content, { type: 'observation', status: 'completed' }, '🛠️ Công cụ');
                            }
                        } catch (e) {
                            console.error('Parse error:', e, 'line:', line);
                        }
                    }
                }
            }

            onComplete({ type: 'complete' });
        } catch (err) {
            onError(err.message);
        }
    },

    /**
     * Display thoughts in accordion format
     * @param {Array<string>} thoughts - Array of thought steps
     * @param {HTMLElement} container - Target container
     */
    displayThoughts(thoughts, container) {
        let html = '';
        thoughts.forEach((thought, idx) => {
            html += `
                <div class="ai-thought" style="margin-bottom:12px;">
                    <div class="ai-thought-header">
                        <i class="fa-solid fa-lightbulb"></i> Bước ${idx + 1}
                    </div>
                    <div class="ai-thought-content">${escapeHtml(thought)}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    /**
     * Update streaming message in real-time
     * @param {HTMLElement} container - Chat container
     * @param {string} content - Current content
     */
    updateStreamingMessage(container, content) {
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
        bubble.textContent = '';
        bubble.innerHTML = content.replace(/\n/g, '<br>');
        container.scrollTop = container.scrollHeight;
    },

    /**
     * Show loading indicator
     * @param {HTMLElement} container - Target container
     */
    showLoading(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="spinner" style="margin: 0 auto;"></div>
                <p style="margin-top: 12px; color: var(--text-mute); font-size: 13px;">Đang xử lý...</p>
            </div>
        `;
    },

    /**
     * Show error state
     * @param {HTMLElement} container - Target container
     * @param {string} message - Error message
     */
    showError(container, message) {
        container.innerHTML = `
            <div style="padding: 20px; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius); border-left: 3px solid var(--danger);">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <i class="fa-solid fa-circle-exclamation" style="color: var(--danger); margin-top: 2px;"></i>
                    <div>
                        <h4 style="color: var(--danger); margin-bottom: 4px;">Lỗi</h4>
                        <p style="font-size: 13px; color: var(--text-soft);">${message}</p>
                    </div>
                </div>
            </div>
        `;
    }
};

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Live Thought Visualizer Panel
 * Quản lý danh sách các bước suy luận realtime: running -> completed.
 */
function createThoughtPanel(container, opts = {}) {
    const steps = [];
    const maxSteps = opts.maxSteps || 24;

    function render() {
        container.innerHTML = steps.map(s => {
            const dotColor = s.status === 'running' ? 'var(--warning)' : s.status === 'completed' ? '#10b981' : s.status === 'error' ? 'var(--danger)' : 'var(--text-mute)';
            return `
            <div class="ai-thought ${s.status ? 'is-' + s.status : ''}" data-name="${escapeHtml(s.name || '')}">
                <div class="ai-thought-header">
                    <span class="ai-thought-status" style="width:10px;height:10px;border-radius:50%;background:${dotColor};${s.status === 'running' ? 'animation:thoughtPulse 1.1s ease-in-out infinite;' : ''}"></span>
                    <span class="ai-thought-title">${s.title ? escapeHtml(s.title) : ''}</span>
                </div>
                ${s.content ? `<div class="ai-thought-content">${escapeHtml(String(s.content))}</div>` : ''}
            </div>`;
        }).join('');
        container.scrollTop = container.scrollHeight;
    }

    return {
        add(thought = {}) {
            const name = thought.stepName || thought.name || thought.title || ('s' + (steps.length + 1));
            const idx = steps.findIndex(s => s.name === name || s.title === name);
            if (idx >= 0) {
                steps[idx] = { ...steps[idx], ...thought, name };
            } else {
                steps.push({ ...thought, name });
            }
            if (steps.length > maxSteps) steps.splice(0, steps.length - maxSteps);
            render();
        },
        setSteps(arr = []) {
            steps.length = 0;
            arr.forEach(t => steps.push({ ...t }));
            render();
        },
        clear() {
            steps.length = 0;
            container.innerHTML = '';
        },
        loading(on) {
            let ph = container.querySelector('.ai-think-pulse');
            if (on && !ph) {
                const d = document.createElement('div');
                d.className = 'ai-think-pulse';
                d.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;font-size:13px;color:var(--text-mute);';
                d.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;"></span> Đang tư duy...';
                container.appendChild(d);
            } else if (!on && ph) {
                ph.remove();
            }
        }
    };
}

/**
 * Render kết quả AI Pro (JSON) thành các thẻ trình bày đẹp.
 * Hỗ trợ string (auto-parse), array, object linh động.
 */
function renderAgentResult(container, result) {
    if (!result) { container.innerHTML = '<p class="empty">Không có kết quả.</p>'; return; }

    if (typeof result === 'string') {
        try { result = JSON.parse(result); }
        catch (e) { container.innerHTML = `<pre style="white-space:pre-wrap;font-size:13px;">${escapeHtml(result)}</pre>`; return; }
    }

    if (Array.isArray(result)) {
        result = { items: result };
    }

    const html = Object.entries(result).map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const clip = typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value);
        if (Array.isArray(value)) {
            const items = value.map(v => {
                if (typeof v === 'string') return `<li>${escapeHtml(v)}</li>`;
                if (typeof v === 'object' && v !== null) return `<li>${renderInlineObject(v)}</li>`;
                return `<li>${escapeHtml(String(v))}</li>`;
            }).join('');
            return `<div class="ai-result-block" data-key="${escapeHtml(key)}" data-clip="${escapeHtml(clip)}"><h4>${escapeHtml(label)}</h4><ul>${items}</ul></div>`;
        }
        if (typeof value === 'object' && value !== null) {
            return `<div class="ai-result-block" data-key="${escapeHtml(key)}" data-clip="${escapeHtml(clip)}"><h4>${escapeHtml(label)}</h4>${renderInlineObject(value, true)}</div>`;
        }
        return `<div class="ai-result-field" data-key="${escapeHtml(key)}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
    }).join('');

    container.innerHTML = `<div class="ai-result-grid">${html}</div>`;

    function renderInlineObject(obj, block = false) {
        if (!block) {
            const attrs = Object.entries(obj).map(([k, v]) =>
                `<span class="ai-tag">${escapeHtml(k)}: ${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : String(v))}</span>`
            ).join(' ');
            return attrs || '—';
        }
        return Object.entries(obj).map(([k, v]) => {
            const val = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
            return `<div class="ai-result-field"><span>${escapeHtml(k.replace(/_/g, ' '))}</span><strong>${escapeHtml(val)}</strong></div>`;
        }).join('');
    }
}
