// Simple in-memory store and renderer for resume items
(function () {
    if (window.resumeStore) return;

    const store = {
        items: [],
        // Set full items list and render
        setItems(items) {
            this.items = Array.isArray(items) ? items.slice() : [];
            this.renderCurrent();
            // notify listeners (e.g., filter bar) that items changed
            window.dispatchEvent(new CustomEvent('resumes-updated', { detail: { count: this.items.length } }));
        },
        addItem(item) {
            this.items.push(item);
            this.renderCurrent();
            window.dispatchEvent(new CustomEvent('resumes-updated', { detail: { count: this.items.length } }));
        },
        getItems() { return this.items.slice(); },
        // Render using optional filter object: { search, category, sort }
        renderCurrent(filter = {}) {
            const container = document.querySelector('#resume-container');
            if (!container) return;

            // derive filtered list
            let list = this.items.slice();

            if (filter.search) {
                const q = String(filter.search).toLowerCase();
                list = list.filter(it => {
                    const name = (it.name || '').toLowerCase();
                    const overview = (it.overview || '').toLowerCase();
                    const cats = (Array.isArray(it.categories) ? it.categories.join(' ') : (it.categories || '')).toLowerCase();
                    return name.includes(q) || overview.includes(q) || cats.includes(q);
                });
            }

            // Support filtering by category (legacy) or by position (job role)
            if (filter.category) {
                const cat = String(filter.category).toLowerCase();
                // treat `category` value as a desired position when items have `position` field
                // prefer matching position first
                const hasPositionMatch = this.items.some(it => it.position && String(it.position).toLowerCase() === cat);
                if (hasPositionMatch) {
                    list = list.filter(it => it.position && String(it.position).toLowerCase() === cat);
                } else {
                    list = list.filter(it => {
                        if (!it.categories) return false;
                        return (Array.isArray(it.categories) ? it.categories : [it.categories]).some(c => String(c).toLowerCase() === cat);
                    });
                }
            }

            // Sorting: accept 'score DESC' or 'score ASC' or 'name ASC' etc.
            if (filter.sort) {
                const parts = String(filter.sort).split(/\s+/);
                const key = parts[0];
                const dir = (parts[1] || 'ASC').toUpperCase();
                list.sort((a, b) => {
                    let va = a[key];
                    let vb = b[key];
                    if (typeof va === 'string') va = va.toLowerCase();
                    if (typeof vb === 'string') vb = vb.toLowerCase();
                    if (va == null) return 1;
                    if (vb == null) return -1;
                    if (va === vb) return 0;
                    return (va > vb ? 1 : -1) * (dir === 'DESC' ? -1 : 1);
                });
            }

            // Clear container and append nodes
            container.innerHTML = '';
            for (const item of list) {
                let node = null;
                if (window.createResumeCard) node = window.createResumeCard(item);
                else {
                    node = document.createElement('div');
                    node.textContent = item.name || 'Resume';
                }
                // remove duplicated ids inside node
                node.querySelectorAll && node.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
                container.appendChild(node);
            }
        },
        // Utility: get all unique categories
        getCategories() {
            const set = new Set();
            for (const it of this.items) {
                if (!it.categories) continue;
                const cats = Array.isArray(it.categories) ? it.categories : [it.categories];
                for (const c of cats) set.add(String(c));
            }
            return Array.from(set);
        },

        // Utility: get all unique positions (the jobs being hired for)
        getPositions() {
            const set = new Set();
            for (const it of this.items) {
                if (!it.position) continue;
                set.add(String(it.position));
            }
            return Array.from(set);
        }
    };

    window.resumeStore = store;
    // When settings change, re-render current view using values from the filter UI.
    // This keeps the display in sync if sorting, itemsPerPage, or other settings change.
    function _readFiltersFromDOM() {
        const search = (document.getElementById('search') || {}).value || '';
        const category = (document.getElementById('category') || {}).value || '';
        const sort = (document.getElementById('sort') || {}).value || '';
        return { search, category, sort };
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('settings-updated', () => {
            try {
                const f = _readFiltersFromDOM();
                store.renderCurrent(f);
            } catch (e) {
                console.warn('resumeStore: failed to re-render after settings update', e);
            }
        });
    }
})();
