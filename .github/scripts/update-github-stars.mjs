import { readFile, writeFile } from "node:fs/promises";

const cachePath = new URL("../../data/github-stars-cache.json", import.meta.url);
const currentCache = JSON.parse(await readFile(cachePath, "utf8"));
const repos = Object.keys(currentCache.stars || {});

function getShanghaiDate() {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

if (repos.length === 0) {
    throw new Error("No repositories are configured in the GitHub stars cache.");
}

const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "jingfengyao.github.io-stars-updater",
    "X-GitHub-Api-Version": "2022-11-28",
};

if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

const entries = await Promise.all(repos.map(async (repo) => {
    const response = await fetch(`https://api.github.com/repos/${repo}`, { headers });

    if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status} for ${repo}.`);
    }

    const data = await response.json();
    if (!Number.isInteger(data.stargazers_count)) {
        throw new Error(`GitHub API returned an invalid star count for ${repo}.`);
    }

    return [repo, data.stargazers_count];
}));

const stars = Object.fromEntries(entries);
const updatedCache = {
    stars,
    totalStars: Object.values(stars).reduce((sum, count) => sum + count, 0),
    date: getShanghaiDate(),
};

await writeFile(cachePath, `${JSON.stringify(updatedCache, null, 2)}\n`);
console.log(`Updated ${repos.length} repositories (${updatedCache.totalStars} total stars).`);
