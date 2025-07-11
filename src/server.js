const express = require('express');
const itemRoutes = require('./routes/items');
const scanRoutes = require('./routes/scans');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.use('/items', itemRoutes);
app.use('/scans', scanRoutes);

app.get('/', (req, res) => {
  res.send('Epoch Gold Auction House API');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app };