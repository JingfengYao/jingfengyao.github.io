/**
 * Fetch GitHub star counts.
 * Priority: localStorage (instant) -> server API -> static JSON fallback.
 */
async function fetchGitHubStats() {
    const cachedData = localStorage.getItem("githubStarsCache");
    const cachedDate = localStorage.getItem("githubStarsCacheDate");

    if (cachedData) {
        try {
            const stars = JSON.parse(cachedData);
            updateGitHubLinksWithStars(stars);
            updateTotalStars(Object.values(stars).reduce((sum, value) => sum + value, 0), cachedDate);
        } catch (error) {
            console.warn("Could not read the local GitHub stars cache.", error);
        }
    }

    const repos = new Set();
    document.querySelectorAll('a[href*="github.com"]').forEach((link) => {
        const match = link.href.match(/github\.com\/([^/]+\/[^/?#]+)/);
        if (match) repos.add(match[1]);
    });

    if (repos.size === 0) return;

    let data = null;
    try {
        const response = await fetch(`/api/github-stars?repos=${encodeURIComponent(Array.from(repos).join(","))}`);
        if (response.ok) data = await response.json();
    } catch (error) {
        console.warn("GitHub stars API unavailable; using the static cache.", error);
    }

    if (!data?.stars) {
        try {
            const response = await fetch("/data/github-stars-cache.json");
            if (response.ok) data = await response.json();
        } catch (error) {
            console.warn("Static GitHub stars cache unavailable.", error);
        }
    }

    if (data?.stars) {
        updateGitHubLinksWithStars(data.stars);
        updateTotalStars(data.totalStars, data.date);
        localStorage.setItem("githubStarsCache", JSON.stringify(data.stars));
        if (data.date) localStorage.setItem("githubStarsCacheDate", data.date);
    }
}

function updateTotalStars(totalStars, date) {
    const total = document.getElementById("github-stars");
    if (total && totalStars > 0) total.textContent = totalStars.toLocaleString();

    const dateLabel = document.getElementById("stars-date");
    if (dateLabel && date) {
        dateLabel.textContent = `Updated ${date}`;
        dateLabel.title = `GitHub stars updated ${date}`;
    }
}

function updateGitHubLinksWithStars(repoStars) {
    document.querySelectorAll('a[href*="github.com"]').forEach((link) => {
        const match = link.href.match(/github\.com\/([^/]+\/[^/?#]+)/);
        if (!match) return;

        const stars = repoStars[match[1]];
        const existingBadge = link.querySelector(".github-stars");

        if (stars > 0) {
            const badge = existingBadge || document.createElement("span");
            badge.className = "github-stars";
            badge.textContent = `${stars.toLocaleString()} stars`;
            if (!existingBadge) link.appendChild(badge);
        } else if (existingBadge) {
            existingBadge.remove();
        }
    });
}

function setupActiveNavigation() {
    const links = Array.from(document.querySelectorAll(".site-nav a"));
    const targets = links
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((link) => {
                link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
            });
        });
    }, { rootMargin: "-20% 0px -70%", threshold: 0 });

    targets.forEach((target) => observer.observe(target));
}

document.addEventListener("DOMContentLoaded", () => {
    setupActiveNavigation();
    fetchGitHubStats();
    window.setInterval(fetchGitHubStats, 60 * 60 * 1000);
});
