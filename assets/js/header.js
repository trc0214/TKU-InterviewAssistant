// Prevent double loading
if (typeof window.appSettings !== 'undefined') {
    console.log('header.js already loaded');
} else {

    // Settings configuration
    window.appSettings = {
        itemsPerPage: 12,
        defaultSort: 'score-desc',
        scoreThresholds: {
            excellent: 85,
            good: 70
        }
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
                console.log('Load sample data clicked');
                // Your sample data loading logic
            });
        }

        const uploadPdfsBtn = document.getElementById('upload-pdfs-btn');
        const uploadPdfsInput = document.getElementById('upload-pdfs');
        if (uploadPdfsBtn && uploadPdfsInput) {
            uploadPdfsBtn.addEventListener('click', () => uploadPdfsInput.click());
            uploadPdfsInput.addEventListener('change', (e) => {
                console.log('PDFs selected:', e.target.files);
                // Your PDF upload logic
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeHeader);
    } else {
        initializeHeader();
    }

} // End of double-load prevention