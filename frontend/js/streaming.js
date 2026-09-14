// ============= STREAMING HANDLER =============
const StreamingHandler = {
    /**
     * Handle SSE streaming response
     * @param {Response} response - Fetch response with streaming body
     * @param {Object} handlers - Event handlers { onThought, onContent, onComplete, onError }
     */
    async handleStream(response, handlers = {}) {
        const {
            onThought = () => {},
            onContent = () => {},
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
                                // Thought step from reasoning
                                onThought(data.content, data.step);
                            } else if (data.type === 'content') {
                                // Complete content chunk
                                fullContent += data.content || '';
                                onContent(fullContent);
                            } else if (data.type === 'complete' || data.type === 'done') {
                                // Stream finished
                                onComplete(data);
                            } else if (data.type === 'observation') {
                                // Tool observation
                                onThought(data.content, 'observation');
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
