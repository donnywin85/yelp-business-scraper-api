const express = require('express');
const app = express();
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ status: 'Yelp Business Scraper API is running' });
});
app.get('/api/business/:id', (req, res) => {
  res.json({ message: 'Business endpoint', id: req.params.id });
});
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));