// Filter bar logic: wire UI controls to resumeStore
(function () {
    if (window.filterBarInitialized) return;
    window.filterBarInitialized = true;

    function populateCategories() {
        // Populate the `#category` select with positions (jobs) if available.
        const sel = document.getElementById('category');
        if (!sel || !window.resumeStore) return;
        const current = sel.value;

        const positions = window.resumeStore.getPositions();
        sel.innerHTML = '<option value="">All Positions</option>';
        if (positions.length > 0) {
            // add positions (do NOT auto-select the first position)
            // preserve any existing selection in the category select
            positions.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                sel.appendChild(opt);
            });
            if (current) sel.value = current;
            // if there's no current selection, keep the default empty value (All Positions)
        } else {
            // fallback to categories when positions not present
            const cats = window.resumeStore.getCategories();
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                sel.appendChild(opt);
            });
            if (current) sel.value = current;
        }
    }

    function readAndApplyFilters() {
        const search = (document.getElementById('search') || {}).value || '';
        const category = (document.getElementById('category') || {}).value || '';
        const sort = (document.getElementById('sort') || {}).value || '';
        window.resumeStore && window.resumeStore.renderCurrent({ search, category, sort });
    }

    function initialize() {
        const search = document.getElementById('search');
        const category = document.getElementById('category');
        const sort = document.getElementById('sort');

        if (search) search.addEventListener('input', () => { readAndApplyFilters(); });
        if (category) category.addEventListener('change', () => { readAndApplyFilters(); });
        if (sort) sort.addEventListener('change', () => { readAndApplyFilters(); });

        // When resumes update, refresh categories and reapply filters
        window.addEventListener('resumes-updated', () => {
            populateCategories();
            readAndApplyFilters();
        });

        // When settings change, update UI controls (sort) and reapply filters.
        window.addEventListener('settings-updated', () => {
            try {
                // If settings include a defaultSort like 'date-desc', map to an option value 'date DESC'
                if (window.appSettings && window.appSettings.defaultSort && sort) {
                    const def = String(window.appSettings.defaultSort);
                    const parts = def.split('-');
                    if (parts.length === 2) {
                        const key = parts[0];
                        const dir = parts[1].toUpperCase();
                        const desired = `${key} ${dir}`.toLowerCase();
                        const opt = Array.from(sort.options).find(o => o.value.toLowerCase() === desired);
                        if (opt) sort.value = opt.value;
                    }
                }

                // Re-populate categories (in case position keys changed) and reapply filters
                populateCategories();
                readAndApplyFilters();
            } catch (e) { console.warn('filterBar: settings-updated handler failed', e); }
        });

        // initial populate
        setTimeout(() => { populateCategories(); readAndApplyFilters(); }, 0);
    }

    // If DOM not ready, wait; otherwise init now
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
