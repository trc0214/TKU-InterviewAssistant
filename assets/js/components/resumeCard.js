// ResumeCard component helper
// Exposes `createResumeCard(data)` on window which returns a DOM node for the provided data.
(function () {
    if (window.createResumeCard) {
        console.log('resumeCard component already loaded');
        return;
    }

    let registeredTemplate = null; // will hold an HTMLTemplateElement or null

    function safeText(node, text) {
        if (!node) return;
        node.textContent = text == null ? '' : String(text);
    }

    // Allow runtime registration of a template element (from a fetched fragment)
    function setResumeCardTemplate(tpl) {
        if (!tpl) return;
        if (tpl instanceof HTMLTemplateElement) {
            registeredTemplate = tpl;
        } else if (typeof tpl === 'string') {
            const container = document.createElement('div');
            container.innerHTML = tpl;
            const found = container.querySelector('template');
            if (found) registeredTemplate = found;
        }
    }

    function createResumeCard(data = {}) {
        const tpl = registeredTemplate || document.getElementById('resume-card-template');
        if (!tpl) {
            // Return a minimal fallback node instead of throwing — loader will still append this
            const fallback = document.createElement('div');
            fallback.className = 'resume-card-fallback p-4 bg-white rounded shadow';
            fallback.textContent = data.name ? `${data.name} (no template)` : 'Resume card (no template)';
            fallback.__data = data;
            return fallback;
        }

        const clone = tpl.content.firstElementChild.cloneNode(true);

        // map fields
        const img = clone.querySelector('[data-field="img"]');
        if (img && data.image) img.src = data.image;
        if (img && data.imageAlt) img.alt = data.imageAlt;

        const score = clone.querySelector('[data-field="score"]');
        if (score) safeText(score, data.score != null ? `Score: ${data.score}%` : 'Score: N/A');

        // Apply only color styling to the score badge according to settings
        function applyBadgeColor(node, dataObj) {
            try {
                const el = node.querySelector('[data-field="score"]');
                if (!el) return;

                // remove any prior color/border/text/bg classes (but keep `bg-white`)
                try {
                    const toRemove = Array.from(el.classList).filter(c => (/^(bg-|text-|border-)/).test(c) && c !== 'bg-white');
                    if (toRemove.length) el.classList.remove(...toRemove);
                } catch (e) { /* ignore */ }

                // Determine numeric score: prefer dataObj.score, fallback to parsing badge text
                let scoreValue = null;
                const scoreRaw = dataObj && dataObj.score;
                if (scoreRaw != null) {
                    const parsed = (typeof scoreRaw === 'number') ? scoreRaw : parseFloat(String(scoreRaw).replace('%', '').trim());
                    if (!isNaN(parsed)) scoreValue = Math.max(0, Math.min(100, Math.round(parsed)));
                }
                if (scoreValue == null) {
                    // try to extract a number from the badge text (e.g., "Score: 92%")
                    const text = (el.textContent || '').match(/(\d{1,3})(?:\s*%|$)/);
                    if (text && text[1]) {
                        const parsed2 = parseInt(text[1], 10);
                        if (!isNaN(parsed2)) scoreValue = Math.max(0, Math.min(100, parsed2));
                    }
                }

                if (typeof window.getScoreStyle === 'function') {
                    const style = window.getScoreStyle(scoreValue == null ? 0 : scoreValue) || {};
                    // Always keep white background; allow getScoreStyle to supply text and border classes only
                    el.classList.add('bg-white');
                    if (style.text) el.classList.add(style.text);

                    // Prefer explicit border if provided. Otherwise derive a sensible border class from style.text
                    let borderClass = style.border;
                    if (!borderClass && style.text) {
                        const m = String(style.text).match(/^text-([a-z]+)(?:-(\d+))?$/);
                        if (m) {
                            const color = m[1];
                            const shade = m[2] ? parseInt(m[2], 10) : null;
                            let newShade = 400;
                            if (shade) {
                                if (shade >= 800) newShade = Math.max(200, shade - 400);
                                else if (shade >= 700) newShade = Math.max(200, shade - 300);
                                else if (shade >= 600) newShade = Math.max(200, shade - 200);
                                else newShade = 400;
                            }
                            borderClass = `border-${color}-${newShade}`;
                        }
                    }
                    if (!borderClass) borderClass = 'border-gray-300';
                    el.classList.add(borderClass, 'border-2');
                } else {
                    // fallback thresholds
                    const thresholds = (window.appSettings && window.appSettings.scoreThresholds) || { excellent: 85, good: 70 };
                    const excellent = thresholds.excellent;
                    const good = thresholds.good;
                    // keep badge background white; only adjust text and border colors
                    if (scoreValue == null) {
                        el.classList.add('bg-white','text-gray-700','border-gray-300');
                    } else if (scoreValue >= excellent) {
                        el.classList.add('bg-white','text-green-700','border-green-400');
                    } else if (scoreValue >= good) {
                        el.classList.add('bg-white','text-yellow-700','border-yellow-400');
                    } else {
                        el.classList.add('bg-white','text-red-700','border-red-400');
                    }
                }
            } catch (e) {
                console.warn('applyBadgeColor failed', e);
            }
        }

        // apply to this new clone
        applyBadgeColor(clone, data);

        // ensure we reapply when settings change (bind once)
        if (!window.__resumeCardBadgeBound) {
            window.__resumeCardBadgeBound = true;
            window.addEventListener('settings-updated', () => {
                document.querySelectorAll && document.querySelectorAll('.resume-card').forEach(node => {
                    try {
                        applyBadgeColor(node, node.__data || {});
                    } catch (e) { /* ignore per-node errors */ }
                });
            });
        }

        const name = clone.querySelector('[data-field="name"]');
        if (name) safeText(name, data.name || 'Unnamed');

        const id = clone.querySelector('[data-field="id"]');
        if (id) safeText(id, data.id ? `ID: ${data.id}` : '');

        const overview = clone.querySelector('[data-field="overview"]');
        if (overview) safeText(overview, data.overview || '');

        const categories = clone.querySelector('[data-field="categories"]');
        if (categories) {
            if (Array.isArray(data.categories)) {
                categories.textContent = data.categories.join(' / ');
            } else {
                categories.textContent = data.categories || '';
            }
        }

        // Attach optional data object for later reference
        clone.__data = data;

        return clone;
    }

    // Export functions
    window.createResumeCard = createResumeCard;
    window.setResumeCardTemplate = setResumeCardTemplate;
})();
