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
			    // Remove any id attributes inside the cloned card to avoid duplicate IDs in the DOM
			    clone.querySelectorAll && clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
			    container.appendChild(clone);
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

// Auto-run when this file is loaded by the page
document.addEventListener('DOMContentLoaded', async () => {
	// Inject header
	await loadInclude('includes/header.html', '#header-placeholder');

	// Inject settings template
	await loadInclude('includes/settings.html', '#settings-placeholder');

	// Inject filter bar
	await loadInclude('includes/filterBar.html', '#filterbar-placeholder');

	// Load header.js after all HTML is loaded
	await loadScript('assets/js/header.js');

	// Populate some sample resume cards into the display area
	loadResumeCards('includes/reusumeCard.html', '#resume-container', 4);
});