async function fetchGitHubStats() {
    // 存储所有仓库的stars数据
    const repoStars = {};

    try {
        // 获取所有GitHub链接
        const githubLinks = document.querySelectorAll('a[href*="github.com"]');

        // 提取仓库信息
        const repos = new Set();
        githubLinks.forEach(link => {
            const url = link.href;
            const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
            if (match) {
                repos.add(match[1]);
            }
        });

        // 检查本地存储中是否有缓存数据
        const cachedData = localStorage.getItem('githubStarsCache');
        const cacheTime = localStorage.getItem('githubStarsCacheTime');
        const now = Date.now();
        const oneHour = 60 * 60 * 1000; // 1小时

        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < oneHour) {
            // 使用缓存数据
            const cachedRepoStars = JSON.parse(cachedData);
            updateGitHubLinksWithStars(cachedRepoStars);
            return;
        }

        // 为每个仓库获取stars数量
        for (const repo of repos) {
            try {
                const response = await fetch(`https://api.github.com/repos/${repo}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                repoStars[repo] = data.stargazers_count;

                // 添加延迟以避免触发GitHub API限制
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Error fetching stars for ${repo}:`, error);
                repoStars[repo] = 0;
            }
        }

        // 更新页面中的GitHub链接
        updateGitHubLinksWithStars(repoStars);

        // 缓存数据到本地存储
        localStorage.setItem('githubStarsCache', JSON.stringify(repoStars));
        localStorage.setItem('githubStarsCacheTime', now.toString());

    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
    }
}

function updateGitHubLinksWithStars(repoStars) {
    const githubLinks = document.querySelectorAll('a[href*="github.com"]');

    githubLinks.forEach(link => {
        const url = link.href;
        const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
        if (match) {
            const repo = match[1];
            const stars = repoStars[repo];

            if (stars !== undefined && stars > 0) {
                // 检查是否已经添加了stars显示
                if (!link.querySelector('.github-stars')) {
                    const starsSpan = document.createElement('span');
                    starsSpan.className = 'github-stars';
                    starsSpan.style.marginLeft = '5px';
                    starsSpan.style.color = '#666';
                    starsSpan.style.fontSize = '0.9em';
                    starsSpan.innerHTML = `<i class="fas fa-star" style="color: #ffd700;"></i> ${stars}`;
                    link.appendChild(starsSpan);
                }
            }
        }
    });
}

async function fetchScholarCitations() {
    try {
        const response = await fetch('https://your-vercel-app.vercel.app/api/scholar');
        const data = await response.json();
        if (data.citations > 0) {  // 只在成功获取数据时更新
            document.getElementById('scholar-citations').textContent = data.citations;
        }
    } catch (error) {
        console.error('Error fetching citations:', error);
    }
}

// 在页面加载时获取数据
window.onload = function() {
    fetchGitHubStats();
    fetchScholarCitations();
} 