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
