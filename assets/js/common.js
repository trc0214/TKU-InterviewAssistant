// Simple include loader: fetch an HTML fragment and insert into target element.
async function loadInclude(url, targetSelector) {
	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
		const text = await res.text();
		const container = document.createElement('div');
		container.innerHTML = text;
		const target = document.querySelector(targetSelector);
		if (!target) return;
		// If the fragment contains a wrapper with an id matching target (common pattern), prefer that
		// Otherwise inject the full fragment.
		// Look for elements inside the fragment that would be useful to insert.
		const preferred = container.querySelector('#' + (target.id || ''));
		if (preferred) {
			target.replaceWith(preferred);
		} else {
			target.innerHTML = text;
		}
	} catch (err) {
		console.error('loadInclude error:', err);
	}
}

// Load resume card template and append N copies into a container
async function loadResumeCards(templateUrl, containerSelector, count = 3) {
	try {
		const res = await fetch(templateUrl);
		if (!res.ok) throw new Error(`Failed to fetch ${templateUrl}: ${res.status}`);
		const text = await res.text();
		const fragment = document.createElement('div');
		fragment.innerHTML = text;
		// Try to find the wrapper inside the fragment
		const cardWrapper = fragment.querySelector('#resumeCard-wrapper') || fragment.querySelector('#resumeCard') || fragment;
		const container = document.querySelector(containerSelector);
		if (!container) return;
		for (let i = 0; i < count; i++) {
			const clone = cardWrapper.cloneNode(true);
			container.appendChild(clone);
		}
	} catch (err) {
		console.error('loadResumeCards error:', err);
	}
}

// Auto-run when this file is loaded by the page
document.addEventListener('DOMContentLoaded', () => {
	// Inject header and filter bar
	loadInclude('includes/header.html', '#header-placeholder');
	loadInclude('includes/filterBar.html', '#filterbar-placeholder');

	// Populate some sample resume cards into the display area
	loadResumeCards('includes/reusumeCard.html', '#resume-container', 4);
});
