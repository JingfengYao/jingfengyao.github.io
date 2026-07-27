const DEFAULT_REPOS = [
  'hustvl/LightningDiT',
  'hustvl/ViTMatte',
  'MiniMax-AI/VTP',
  'hustvl/DiffusionVL',
  'ZrH42/UniX',
  'hustvl/Turbo-VAED',
  'hustvl/EVA-X',
  'hustvl/Matte-Anything',
  'hustvl/LKCell',
];

let cache = {
  stars: null,
  totalStars: null,
  date: null,
};

function getToday() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const today = getToday();

  // Parse repos from query if provided (allows frontend to pass custom list)
  let repos = DEFAULT_REPOS;
  if (req.query && req.query.repos) {
    repos = req.query.repos.split(',').map(r => r.trim()).filter(Boolean);
  }

  // Only fetch from GitHub API if cache is stale (new day)
  if (cache.date !== today || !cache.stars) {
    const repoStars = {};

    for (const repo of repos) {
      try {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (process.env.GITHUB_TOKEN) {
          headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
        }

        const resp = await fetch(`https://api.github.com/repos/${repo}`, { headers });
        if (resp.ok) {
          const data = await resp.json();
          repoStars[repo] = data.stargazers_count;
        } else {
          console.warn(`GitHub API error for ${repo}: ${resp.status}`);
          // Keep old cached value if available
          repoStars[repo] = (cache.stars && cache.stars[repo]) || 0;
        }
      } catch (e) {
        console.error(`Error fetching ${repo}:`, e.message);
        repoStars[repo] = (cache.stars && cache.stars[repo]) || 0;
      }

      // Respect GitHub API rate limit (~10 req/s for unauthenticated)
      await new Promise(r => setTimeout(r, 100));
    }

    cache.stars = repoStars;
    cache.totalStars = Object.values(repoStars).reduce((a, b) => a + b, 0);
    cache.date = today;
  }

  res.json({
    stars: cache.stars,
    totalStars: cache.totalStars,
    date: cache.date,
  });
};
