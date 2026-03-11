const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/business/:id', (req, res) => {
  res.json({ status: 'ok', message: 'Yelp Business Scraper API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));