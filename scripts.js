async function fetchGitHubStats() {
    const repos = [
        'hustvl/ViTMatte',
        'hustvl/Matte-Anything',
        'hustvl/LightningDiT',
        'hustvl/EVA-X',
        'hustvl/LKCell'
    ];
    
    let totalStars = 0;
    
    try {
        for (const repo of repos) {
            const response = await fetch(`https://api.github.com/repos/${repo}`);
            const data = await response.json();
            totalStars += data.stargazers_count;
        }
        
        document.getElementById('github-stars').textContent = totalStars;
    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
    }
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