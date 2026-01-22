async function fetchGitHubStats() {
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

        // 总是先显示缓存数据（如果有）
        if (cachedData) {
            const cachedRepoStars = JSON.parse(cachedData);
            updateGitHubLinksWithStars(cachedRepoStars);
        }

        // 检查缓存是否过期
        const cacheExpired = !cacheTime || (now - parseInt(cacheTime)) >= oneHour;

        // 如果缓存过期或不存在，在后台更新数据
        if (cacheExpired || !cachedData) {
            // 使用setTimeout让更新在后台进行，不阻塞页面渲染
            setTimeout(async () => {
                await updateGitHubStarsInBackground(repos);
            }, 1000); // 延迟1秒开始后台更新
        }

    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
    }
}

async function updateGitHubStarsInBackground(repos) {
    const repoStars = {};
    const now = Date.now();

    try {
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

        // 更新页面中的GitHub链接（使用新数据）
        updateGitHubLinksWithStars(repoStars);

        // 缓存数据到本地存储
        localStorage.setItem('githubStarsCache', JSON.stringify(repoStars));
        localStorage.setItem('githubStarsCacheTime', now.toString());

        console.log('GitHub stars updated in background');

    } catch (error) {
        console.error('Error updating GitHub stars in background:', error);
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
                const existingStarsSpan = link.querySelector('.github-stars');

                if (existingStarsSpan) {
                    // 更新现有的stars显示
                    existingStarsSpan.innerHTML = `<i class="fas fa-star" style="color: #ffd700;"></i> ${stars}`;
                } else {
                    // 创建新的stars显示
                    const starsSpan = document.createElement('span');
                    starsSpan.className = 'github-stars';
                    starsSpan.style.marginLeft = '5px';
                    starsSpan.style.color = '#666';
                    starsSpan.style.fontSize = '0.9em';
                    starsSpan.innerHTML = `<i class="fas fa-star" style="color: #ffd700;"></i> ${stars}`;
                    link.appendChild(starsSpan);
                }
            } else if (stars === 0) {
                // 如果stars为0，移除显示
                const existingStarsSpan = link.querySelector('.github-stars');
                if (existingStarsSpan) {
                    existingStarsSpan.remove();
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

    // 设置定时器，每小时检查并更新一次GitHub stars
    setInterval(() => {
        const githubLinks = document.querySelectorAll('a[href*="github.com"]');
        const repos = new Set();
        githubLinks.forEach(link => {
            const url = link.href;
            const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
            if (match) {
                repos.add(match[1]);
            }
        });

        if (repos.size > 0) {
            updateGitHubStarsInBackground(repos);
        }
    }, 60 * 60 * 1000); // 每小时检查一次
} 