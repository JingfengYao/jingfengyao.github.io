/**
 * Fetch GitHub star counts.
 * Priority: localStorage (instant) → API (server-side daily cache) → static JSON fallback → localStorage
 */
async function fetchGitHubStats() {
    // 1. Show cached data IMMEDIATELY from localStorage (synchronous, instant display)
    const cachedData = localStorage.getItem('githubStarsCache');
    const cachedDate = localStorage.getItem('githubStarsCacheDate');
    if (cachedData) {
        try {
            const stars = JSON.parse(cachedData);
            updateGitHubLinksWithStars(stars);
            const total = Object.values(stars).reduce((a, b) => a + b, 0);
            updateTotalStars(total, cachedDate);
        } catch (e) { /* ignore parse errors */ }
    }

    // 2. Extract all unique repos from GitHub links on the page
    const githubLinks = document.querySelectorAll('a[href*="github.com"]');
    const repos = new Set();
    githubLinks.forEach(link => {
        const url = link.href;
        const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
        if (match) {
            repos.add(match[1]);
        }
    });

    if (repos.size === 0) return;

    const reposList = Array.from(repos).join(',');

    // 3. Try server-side API first (Vercel function with daily cache)
    let data = null;
    try {
        const response = await fetch(`/api/github-stars?repos=${encodeURIComponent(reposList)}`);
        if (response.ok) {
            data = await response.json();
        }
    } catch (e) {
        console.warn('GitHub stars API unavailable, trying fallbacks:', e.message);
    }

    // 4. Fallback to static JSON file (shipped with the repo)
    if (!data || !data.stars) {
        try {
            const resp = await fetch('/data/github-stars-cache.json');
            if (resp.ok) {
                data = await resp.json();
            }
        } catch (e) {
            console.warn('Static cache unavailable:', e.message);
        }
    }

    // 5. Update the page with fresh data (if we got any)
    if (data && data.stars) {
        updateGitHubLinksWithStars(data.stars);
        updateTotalStars(data.totalStars, data.date);

        // Sync to localStorage for next time
        localStorage.setItem('githubStarsCache', JSON.stringify(data.stars));
        if (data.date) {
            localStorage.setItem('githubStarsCacheDate', data.date);
        }
    }
}

/**
 * Update the total stars counter with date
 */
function updateTotalStars(totalStars, date) {
    const totalStarsElement = document.getElementById('github-stars');
    if (totalStarsElement && totalStars > 0) {
        totalStarsElement.textContent = totalStars.toLocaleString();
    }

    const dateSpan = document.getElementById('stars-date');
    if (dateSpan && date) {
        dateSpan.textContent = ` (${date})`;
        dateSpan.style.fontSize = '0.85em';
        dateSpan.style.color = '#999';
    } else if (dateSpan) {
        dateSpan.textContent = '';
    }
}

/**
 * Add/update star badges on individual GitHub links
 */
function updateGitHubLinksWithStars(repoStars) {
    const githubLinks = document.querySelectorAll('a[href*="github.com"]');

    githubLinks.forEach(link => {
        const url = link.href;
        const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
        if (!match) return;

        const repo = match[1];
        const stars = repoStars[repo];

        if (stars !== undefined && stars > 0) {
            const existingStarsSpan = link.querySelector('.github-stars');
            const html = `<i class="fas fa-star" style="color: #ffd700;"></i> ${stars.toLocaleString()}`;

            if (existingStarsSpan) {
                existingStarsSpan.innerHTML = html;
            } else {
                const starsSpan = document.createElement('span');
                starsSpan.className = 'github-stars';
                starsSpan.style.marginLeft = '5px';
                starsSpan.style.color = '#666';
                starsSpan.style.fontSize = '0.9em';
                starsSpan.innerHTML = html;
                link.appendChild(starsSpan);
            }
        } else if (stars === 0) {
            // Remove badge if stars is explicitly 0 (likely an error)
            const existingStarsSpan = link.querySelector('.github-stars');
            if (existingStarsSpan) {
                existingStarsSpan.remove();
            }
        }
        // If stars is undefined (repo not in cache), leave existing display untouched
    });
}

/**
 * Fetch Google Scholar citations
 */
async function fetchScholarCitations() {
    try {
        const response = await fetch('/api/scholar');
        if (!response.ok) return;
        const data = await response.json();
        if (data.citations > 0) {
            const el = document.getElementById('scholar-citations');
            if (el) el.textContent = data.citations;
        }
    } catch (error) {
        console.error('Error fetching citations:', error);
    }
}

// ── Page load ──────────────────────────────────────────────
window.onload = function () {
    fetchGitHubStats();
    fetchScholarCitations();

    // Refresh from API once per hour (API has daily cache, so this is cheap)
    setInterval(fetchGitHubStats, 60 * 60 * 1000);
};