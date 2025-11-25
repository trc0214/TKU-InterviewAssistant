// Lightweight API client for the resumes backend
// Adds a global `window.resumeApi` object with a configurable base URL.
(function () {
    if (window.resumeApi) return;

    let baseUrl = (window.appSettings && window.appSettings.apiBaseUrl) || '';

    function setBaseUrl(url) {
        baseUrl = String(url || '').trim().replace(/\/$/, '');
    }

    function getBaseUrl() { return baseUrl; }

    // Helper to build URLs relative to base
    function url(path) {
        if (!path) return baseUrl || '';
        if (/^https?:\/\//i.test(path)) return path; // absolute
        const p = String(path).replace(/^\//, '');
        return (baseUrl ? baseUrl + '/' : '') + p;
    }

    async function jsonFetch(path, opts = {}) {
        const full = url(path);
        const headers = Object.assign({}, opts.headers || {});
        // attach token from appSettings if present
        const token = (window.appSettings && window.appSettings.apiToken) || null;
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['Accept'] = 'application/json';
        if (opts.body && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';

        const res = await fetch(full, Object.assign({}, opts, { headers }));
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            const err = new Error(`Request failed ${res.status}: ${text || res.statusText}`);
            err.status = res.status;
            err.body = text;
            throw err;
        }
        if (res.status === 204) return null;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.indexOf('application/json') !== -1) return res.json();
        return res.text();
    }

    // Public API
    const api = {
        // configuration helpers
        setBaseUrl,
        getBaseUrl,
        setBaseUrlFromAppSettings() {
            if (window.appSettings && window.appSettings.apiBaseUrl) setBaseUrl(window.appSettings.apiBaseUrl);
        },

        // CRUD operations
        listResumes(params = {}) {
            const p = new URLSearchParams();
            if (params.search) p.set('search', params.search);
            if (params.position) p.set('position', params.position);
            if (params.sort) p.set('sort', params.sort);
            if (params.page) p.set('page', params.page);
            if (params.perPage) p.set('perPage', params.perPage);
            const q = p.toString();
            return jsonFetch(`/api/resumes${q ? ('?' + q) : ''}`);
        },

        getResume(id) { return jsonFetch(`/api/resumes/${encodeURIComponent(id)}`); },

        createResume(metadata) { return jsonFetch('/api/resumes', { method: 'POST', body: JSON.stringify(metadata) }); },

        deleteResume(id) { return jsonFetch(`/api/resumes/${encodeURIComponent(id)}`, { method: 'DELETE' }); },

        // presign upload flow: backend returns uploadUrl, fileKey, publicUrl
        presignUpload(filename, contentType) {
            return jsonFetch('/api/uploads/presign', { method: 'POST', body: JSON.stringify({ filename, contentType }) });
        },

        // fallback upload: post FormData to /api/uploads
        uploadPdf(formData) {
            const full = url('/api/uploads');
            const token = (window.appSettings && window.appSettings.apiToken) || null;
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            return fetch(full, { method: 'POST', body: formData, headers }).then(async res => {
                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    throw new Error(`Upload failed ${res.status}: ${text}`);
                }
                return res.json();
            });
        }
    };

    // initialize baseUrl from appSettings
    api.setBaseUrlFromAppSettings();

    window.resumeApi = api;

})();
