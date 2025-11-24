// Main app initializer (moved from previous common.js)
// Responsible for loading includes, components, and populating initial data.

// Simple include loader: fetch an HTML fragment and insert into target element.
// Behavior:
// - If the fetched fragment has exactly one top-level element, replace the target node with it.
// - Otherwise set the target's innerHTML to the fragment HTML.
async function loadInclude(url, targetSelector) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
        const text = await res.text();
        const container = document.createElement('div');
        container.innerHTML = text;
        const target = document.querySelector(targetSelector);
        if (!target) return;

        // If there's exactly one root element in the fragment, use it to replace the placeholder.
        if (container.children.length === 1) {
            const replacement = container.firstElementChild;
            // If the replacement has any IDs that would conflict with duplicates (when used multiple times), keep as-is for single replace.
            target.replaceWith(replacement);
        } else {
            // Multiple top-level nodes: inject HTML into the target container
            target.innerHTML = text;
        }
    } catch (err) {
        console.error('loadInclude error:', err);
    }
}

// Load resume card template and append copies into a container.
// `dataOrCount` can be a number (count) or an array of data objects to bind into templates.
async function loadResumeCards(templateUrl, containerSelector, dataOrCount = 3) {
    try {
        const res = await fetch(templateUrl);
        if (!res.ok) throw new Error(`Failed to fetch ${templateUrl}: ${res.status}`);
        const text = await res.text();
        const fragment = document.createElement('div');
        fragment.innerHTML = text;

        // Prefer a <template> inside the fragment, otherwise take the whole fragment as wrapper
        const tpl = fragment.querySelector('template') || fragment.querySelector('#resumeCard-wrapper') || fragment.querySelector('#resumeCard') || fragment;
        const container = document.querySelector(containerSelector);
        if (!container) return;

        // If the component provides a setter, register the template (detached template is fine)
        if (window.setResumeCardTemplate && tpl instanceof HTMLTemplateElement) {
            try {
                window.setResumeCardTemplate(tpl);
            } catch (e) {
                // ignore registration errors
            }
        }

        // Helper to remove ids inside a node
        const stripIds = (node) => node.querySelectorAll && node.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

        if (Array.isArray(dataOrCount)) {
            // Create cards from data array
            for (const data of dataOrCount) {
                let cardNode = null;
                if (window.createResumeCard) {
                    cardNode = window.createResumeCard(data);
                } else if (tpl instanceof HTMLTemplateElement) {
                    cardNode = tpl.content.firstElementChild.cloneNode(true);
                    // Bind fields with data-field attributes as fallback
                    try {
                        const set = (sel, value) => { const n = cardNode.querySelector(sel); if (n) n.textContent = value; };
                        if (data.image) { const im = cardNode.querySelector('[data-field="img"]'); if (im) im.src = data.image; }
                        if (data.score != null) set('[data-field="score"]', `Score: ${data.score}%`);
                        if (data.name) set('[data-field="name"]', data.name);
                        if (data.id) set('[data-field="id"]', `ID: ${data.id}`);
                        if (data.overview) set('[data-field="overview"]', data.overview);
                        if (data.categories) {
                            const cats = cardNode.querySelector('[data-field="categories"]');
                            if (cats) cats.textContent = Array.isArray(data.categories) ? data.categories.join(' / ') : data.categories;
                        }
                    } catch (e) { /* ignore binding errors */ }
                } else {
                    // Generic clone
                    cardNode = tpl.cloneNode(true);
                }

                if (cardNode) {
                    stripIds(cardNode);
                    container.appendChild(cardNode);
                }
            }
        } else {
            // numeric count fallback
            const count = Number(dataOrCount) || 0;
            for (let i = 0; i < count; i++) {
                let clone;
                if (tpl instanceof HTMLTemplateElement) clone = tpl.content.firstElementChild.cloneNode(true);
                else clone = tpl.cloneNode(true);
                stripIds(clone);
                container.appendChild(clone);
            }
        }
    } catch (err) {
        console.error('loadResumeCards error:', err);
    }
}

// Load JavaScript file dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// Append resume cards using existing registered template/component without refetching.
// Accepts an array of data objects or a single object.
window.appendResumeCards = function (data) {
    try {
        const container = document.querySelector('#resume-container');
        if (!container) return;

        const items = Array.isArray(data) ? data : [data];

        for (const d of items) {
            let node = null;
            if (window.createResumeCard) {
                node = window.createResumeCard(d);
            } else {
                // try to find an in-DOM template
                const tpl = document.getElementById('resume-card-template');
                if (tpl instanceof HTMLTemplateElement) {
                    node = tpl.content.firstElementChild.cloneNode(true);
                    try {
                        const set = (sel, value) => { const n = node.querySelector(sel); if (n) n.textContent = value; };
                        if (d.image) { const im = node.querySelector('[data-field="img"]'); if (im) im.src = d.image; }
                        if (d.score != null) set('[data-field="score"]', `Score: ${d.score}%`);
                        if (d.name) set('[data-field="name"]', d.name);
                        if (d.id) set('[data-field="id"]', `ID: ${d.id}`);
                        if (d.overview) set('[data-field="overview"]', d.overview);
                        if (d.categories) {
                            const cats = node.querySelector('[data-field="categories"]');
                            if (cats) cats.textContent = Array.isArray(d.categories) ? d.categories.join(' / ') : d.categories;
                        }
                    } catch (e) { /* ignore */ }
                } else {
                    node = document.createElement('div');
                    node.textContent = d.name || 'Resume';
                }
            }

            // remove duplicate ids inside the node
            node.querySelectorAll && node.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
            container.appendChild(node);
        }
    } catch (err) {
        console.error('appendResumeCards error:', err);
    }
};

// Provide a convenience method used by header.js to append a small batch of sample data.
window.appendSampleData = function () {
    const sampleBatch = [
        { id: 'S' + Date.now().toString().slice(-4), name: 'Sample User ' + Math.floor(Math.random() * 100), score: Math.floor(Math.random() * 40) + 60, overview: 'Auto-added sample resume', categories: ['Sample'], image: 'https://placehold.co/400x250/E5E7EB/4B5563?text=Sample' }
    ];
    window.appendResumeCards(sampleBatch);
};

// Auto-run when this file is loaded by the page
document.addEventListener('DOMContentLoaded', async () => {
    // Inject header
    await loadInclude('includes/header.html', '#header-placeholder');

    // Inject settings template
    await loadInclude('includes/settings.html', '#settings-placeholder');

    // Inject filter bar
    await loadInclude('includes/filterBar.html', '#filterbar-placeholder');

    // Load header.js and resumeCard component after all HTML is loaded
    await loadScript('assets/js/components/header.js');
    await loadScript('assets/js/components/resumeCard.js');

    // Populate some sample resume cards into the display area
    // If you pass an array of objects, each object will be used to fill the template fields.
    const sample = [
        { id: 'A001', name: 'Alice Chen', score: 92, overview: 'Experienced frontend engineer...', categories: ['Frontend', 'React'], image: 'https://placehold.co/400x250/E5E7EB/4B5563?text=Alice' },
        { id: 'B002', name: 'Bob Lin', score: 78, overview: 'Data-focused analyst...', categories: ['Data', 'Python'], image: 'https://placehold.co/400x250/E5E7EB/4B5563?text=Bob' },
        { id: 'C003', name: 'Carol Wu', score: 85, overview: 'Full-stack developer...', categories: ['Fullstack', 'Node'], image: 'https://placehold.co/400x250/E5E7EB/4B5563?text=Carol' },
        { id: 'D004', name: 'David Ho', score: 67, overview: 'Junior QA engineer...', categories: ['QA'], image: 'https://placehold.co/400x250/E5E7EB/4B5563?text=David' }
    ];

    // Use data-driven creation when possible
    loadResumeCards('includes/templates/resume-card.html', '#resume-container', sample);
});
