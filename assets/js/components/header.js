// Prevent double loading
if (typeof window.appSettings !== 'undefined') {
    console.log('header.js already loaded');
} else {

    // Settings configuration
    window.appSettings = {
        itemsPerPage: 12,
        // default sort: date-desc (newest uploaded first)
        defaultSort: 'date-desc',
        scoreThresholds: {
            excellent: 85,
            good: 70
        }
        ,
        // demoUpload: enable a local demo-only upload flow that simulates processing
        demoUpload: true
    };

    window.loadSettings = function () {
        const saved = localStorage.getItem('resumeAppSettings');
        if (saved) {
            try {
                window.appSettings = { ...window.appSettings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
        return window.appSettings;
    }

    window.saveSettings = function () {
        localStorage.setItem('resumeAppSettings', JSON.stringify(window.appSettings));
    }

    window.getScoreStyle = function (score) {
        const { excellent, good } = window.appSettings.scoreThresholds;
        if (score >= excellent) return { bg: 'bg-green-500', text: 'text-green-600', label: 'Excellent' };
        if (score >= good) return { bg: 'bg-orange-500', text: 'text-orange-600', label: 'Good' };
        return { bg: 'bg-red-500', text: 'text-red-600', label: 'Fair' };
    }

    function showSettingsModal() {
        const template = document.getElementById('settings-modal-template');
        if (!template) {
            console.error('Settings template not found');
            return;
        }

        const modalContent = template.content.cloneNode(true);
        const modal = modalContent.querySelector('#settings-modal-overlay');

        modal.querySelector('#settings-items-per-page').value = window.appSettings.itemsPerPage;
        modal.querySelector('#settings-default-sort').value = window.appSettings.defaultSort;
        modal.querySelector('#settings-excellent-threshold').value = window.appSettings.scoreThresholds.excellent;
        modal.querySelector('#settings-good-threshold').value = window.appSettings.scoreThresholds.good;
        modal.querySelector('#settings-fair-threshold').value = window.appSettings.scoreThresholds.good;

        modal.querySelector('#settings-good-threshold').addEventListener('input', (e) => {
            modal.querySelector('#settings-fair-threshold').value = e.target.value;
        });

        modal.querySelector('.save-settings').addEventListener('click', () => {
            const excellent = parseInt(modal.querySelector('#settings-excellent-threshold').value);
            const good = parseInt(modal.querySelector('#settings-good-threshold').value);

            if (excellent <= good) {
                alert('⚠️ Excellent threshold must be higher than Good threshold');
                return;
            }

            window.appSettings.itemsPerPage = parseInt(modal.querySelector('#settings-items-per-page').value);
            window.appSettings.defaultSort = modal.querySelector('#settings-default-sort').value;
            window.appSettings.scoreThresholds.excellent = excellent;
            window.appSettings.scoreThresholds.good = good;

            window.saveSettings();
            window.dispatchEvent(new CustomEvent('settings-updated', { detail: window.appSettings }));
            alert('✓ Settings saved!');
            modal.remove();
        });

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.cancel-settings').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        document.body.appendChild(modal);
    }

    function initializeHeader() {
        window.loadSettings();

        const settingsBtn = document.getElementById('settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', showSettingsModal);
        }

        const loadSampleBtn = document.getElementById('load-sample');
        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', () => {
                // Append sample data (do not replace existing cards)
                if (window.appendSampleData) {
                    window.appendSampleData();
                } else {
                    console.log('Load sample data clicked (append function not available)');
                }
            });
        }

        const uploadPdfsBtn = document.getElementById('upload-pdfs-btn');
        const uploadPdfsInput = document.getElementById('upload-pdfs');
        if (uploadPdfsBtn && uploadPdfsInput) {
            uploadPdfsBtn.addEventListener('click', () => uploadPdfsInput.click());
            uploadPdfsInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;

                // Simple demo behavior: when demoUpload is enabled, simulate processing
                // locally and show generated resumes with random tags. Position will
                // be taken from the `#category` select if available so the UI stays
                // under control.
                const useDemo = !!(window.appSettings && window.appSettings.demoUpload);

                function makePlaceholder(file) {
                    return {
                        id: 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                        name: file.name.replace(/\.pdf$/i, ''),
                        score: null,
                        date: new Date().toISOString(),
                        position: '',
                        overview: 'Uploading...',
                        categories: ['Uploaded'],
                        image: 'https://placehold.co/400x250/E5E7EB/4B5563?text=Uploading',
                        status: 'uploading'
                    };
                }

                function randomTags(n) {
                    const pool = ['JavaScript','React','Node','Python','Data','SQL','CSS','HTML','AWS','Docker','Testing','CI','UX','ML','NLP'];
                    const out = [];
                    while (out.length < n) {
                        const pick = pool[Math.floor(Math.random() * pool.length)];
                        if (!out.includes(pick)) out.push(pick);
                    }
                    return out;
                }

                for (const file of files) {
                    const placeholder = makePlaceholder(file);
                    if (window.resumeStore && typeof window.resumeStore.addItem === 'function') {
                        window.resumeStore.addItem(placeholder);
                    }

                    if (useDemo) {
                        // helper: lazy-load PDF.js from CDN and render first page to data URL
                        async function loadPdfJs() {
                            if (window.pdfjsLib) return window.pdfjsLib;
                            return new Promise((resolve, reject) => {
                                const s = document.createElement('script');
                                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.min.js';
                                s.onload = () => {
                                    // set worker src
                                    try {
                                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js';
                                    } catch (e) { /* ignore */ }
                                    resolve(window.pdfjsLib);
                                };
                                s.onerror = (e) => reject(e);
                                document.head.appendChild(s);
                            });
                        }

                        async function renderFirstPageToDataUrl(file, scale = 1.2) {
                            try {
                                const pdfjs = await loadPdfJs();
                                const arrayBuf = await file.arrayBuffer();
                                const loadingTask = pdfjs.getDocument({ data: arrayBuf });
                                const pdf = await loadingTask.promise;
                                const page = await pdf.getPage(1);
                                const viewport = page.getViewport({ scale });
                                const canvas = document.createElement('canvas');
                                canvas.width = Math.floor(viewport.width);
                                canvas.height = Math.floor(viewport.height);
                                const ctx = canvas.getContext('2d');
                                const renderContext = { canvasContext: ctx, viewport };
                                await page.render(renderContext).promise;
                                const dataUrl = canvas.toDataURL('image/png');
                                // cleanup pdf loading resources
                                try { pdf.destroy(); } catch (e) { /* ignore */ }
                                return dataUrl;
                            } catch (err) {
                                console.warn('PDF render failed, falling back to placeholder', err);
                                return 'https://placehold.co/400x250/E5E7EB/4B5563?text=' + encodeURIComponent(file.name.replace(/\.pdf$/i, ''));
                            }
                        }

                        // simulate processing delay
                        const delay = 800 + Math.floor(Math.random() * 2600);
                        await new Promise(r => setTimeout(r, delay));

                        // keep position under control by reading current filter category
                        let position = 'General';
                        try {
                            const sel = document.getElementById('category');
                            if (sel && sel.value) position = sel.value;
                        } catch (e) { /* ignore */ }

                        // render first-page preview when possible
                        let previewImage = 'https://placehold.co/400x250/E5E7EB/4B5563?text=' + encodeURIComponent(file.name.replace(/\.pdf$/i, ''));
                        if (file.type === 'application/pdf') {
                            try {
                                previewImage = await renderFirstPageToDataUrl(file, 1.0);
                            } catch (e) {
                                console.warn('Could not render PDF preview:', e);
                            }
                        }

                        const created = {
                            id: 'demo-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                            name: file.name.replace(/\.pdf$/i, ''),
                            score: 55 + Math.floor(Math.random() * 45),
                            date: new Date().toISOString(),
                            position: position,
                            overview: 'Demo parsed resume — auto-generated tags and score.',
                            categories: randomTags(2 + Math.floor(Math.random() * 3)),
                            image: previewImage,
                            status: 'ready'
                        };

                        // replace placeholder in store
                        if (window.resumeStore && typeof window.resumeStore.getItems === 'function') {
                            const list = window.resumeStore.getItems().map(it => it.id === placeholder.id ? created : it);
                            if (!list.some(it => it.id === created.id)) list.push(created);
                            window.resumeStore.setItems(list);
                        }
                    } else {
                        // If not demo, but you want to keep file input harmless, just log
                        console.log('Selected (no-demo):', file.name);
                    }
                }

                // clear input so same file can be re-selected
                uploadPdfsInput.value = '';
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeHeader);
    } else {
        initializeHeader();
    }

} // End of double-load prevention
