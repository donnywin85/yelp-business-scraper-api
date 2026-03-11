const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Main scraping endpoint
app.get('/api/scrape', async (req, res) => {
  try {
    const { query, location = 'San Francisco, CA', limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'Query parameter is required'
      });
    }

    const maxLimit = Math.min(parseInt(limit) || 10, 50);
    const searchUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(location)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const businesses = [];

    // Extract business data from search results
    $('[data-testid="serp-ia-card"]').each((index, element) => {
      if (index >= maxLimit) return false;

      const $el = $(element);
      const name = $el.find('h3 a').text().trim() || $el.find('[name]').attr('name');
      const rating = $el.find('[aria-label*="star rating"]').attr('aria-label');
      const reviewCount = $el.find('[aria-label*="star rating"]').parent().text().match(/\d+/);
      const category = $el.find('[data-testid="serp-ia-card-categories"]').text().trim();
      const priceRange = $el.find('[aria-label*="price range"]').text().trim();
      const location = $el.find('[data-testid="serp-ia-card-address"]').text().trim();
      const phone = $el.find('[data-testid="serp-ia-card-phone"]').text().trim();
      const url = $el.find('h3 a').attr('href');

      if (name) {
        businesses.push({
          name,
          rating: rating ? parseFloat(rating.match(/[\d.]+/)?.[0]) : null,
          reviewCount: reviewCount ? parseInt(reviewCount[0]) : 0,
          category: category || 'N/A',
          priceRange: priceRange || 'N/A',
          address: location || 'N/A',
          phone: phone || 'N/A',
          url: url ? `https://www.yelp.com${url}` : null
        });
      }
    });

    if (businesses.length === 0) {
      return res.status(404).json({
        error: 'No results found',
        message: 'No businesses found for the given query and location',
        query,
        location
      });
    }

    res.status(200).json({
      success: true,
      query,
      location,
      count: businesses.length,
      businesses
    });

  } catch (error) {
    console.error('Scraping error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Request timeout',
        message: 'The request took too long to complete'
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Scraping failed',
      message: error.message || 'An error occurred while scraping Yelp'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: 'Endpoint does not exist' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Yelp Business Scraper API running on port ${PORT}`);
});