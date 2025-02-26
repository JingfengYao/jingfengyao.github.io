const scholarly = require('scholarly');

let cache = {
  citations: 0,
  lastUpdate: 0
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 每6小时更新一次
  if (Date.now() - cache.lastUpdate > 6 * 60 * 60 * 1000) {
    try {
      const author = await scholarly.search_author_id('4qc1qJ0AAAAJ');
      const authorData = await scholarly.fill(author);
      cache.citations = authorData.citedby;
      cache.lastUpdate = Date.now();
    } catch (error) {
      console.error('Error fetching citations:', error);
      // 如果出错，继续使用缓存的数据
    }
  }
  
  res.json({ citations: cache.citations });
}; 