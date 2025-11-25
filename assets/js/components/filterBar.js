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
            // add positions and default to first position when nothing selected
            positions.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                sel.appendChild(opt);
            });
            if (!current) sel.value = positions[0];
            else sel.value = current;
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
