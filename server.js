const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/business/:id', (req, res) => {
  // Yelp business scraping logic here
  res.json({ error: 'Implementation required' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));