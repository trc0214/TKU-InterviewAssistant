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

                // remove common color classes we may have applied previously (but keep bg-white removal out so background stays white)
                const remove = ['bg-green-100','bg-green-200','bg-green-500','bg-yellow-100','bg-orange-500','bg-red-100','bg-red-500','text-green-700','text-yellow-700','text-red-700','text-gray-700','border-green-400','border-yellow-400','border-red-400','border-gray-300'];
                el.classList.remove(...remove);

                const scoreRaw = dataObj && dataObj.score;
                const parsed = scoreRaw == null ? null : (typeof scoreRaw === 'number' ? scoreRaw : parseFloat(String(scoreRaw).replace('%', '').trim()));
                const scoreValue = (parsed == null || isNaN(parsed)) ? null : Math.max(0, Math.min(100, Math.round(parsed)));

                if (typeof window.getScoreStyle === 'function') {
                    const style = window.getScoreStyle(scoreValue == null ? 0 : scoreValue) || {};
                    // Always keep white background; allow getScoreStyle to supply text and border classes only
                    el.classList.add('bg-white');
                    if (style.text) el.classList.add(style.text);

                    // Prefer explicit border if provided. Otherwise derive a sensible border class
                    let borderClass = style.border;
                    if (!borderClass && style.text) {
                        // derive from text color (e.g. text-green-700 -> border-green-400)
                        const m = String(style.text).match(/^text-([a-z]+)(-(\d+))?$/);
                        if (m) {
                            const color = m[1];
                            const shade = m[3] ? parseInt(m[3], 10) : null;
                            let newShade = 400;
                            if (shade) {
                                if (shade >= 800) newShade = shade - 400;
                                else if (shade >= 700) newShade = shade - 300;
                                else if (shade >= 600) newShade = shade - 200;
                                else newShade = 400;
                            }
                            borderClass = `border-${color}-${newShade}`;
                        }
                    }
                    if (!borderClass) borderClass = 'border-gray-300';
                    el.classList.add(borderClass);
                    el.classList.add('border-2');
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
