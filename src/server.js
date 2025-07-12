const express = require('express');
const cors = require('cors');
const itemRoutes = require('./routes/items');
const scanRoutes = require('./routes/scans');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  const corsOptions = {
    origin: process.env.ORIGIN_URL,
    optionsSuccessStatus: 200
  };
  app.use(cors(corsOptions));
}

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