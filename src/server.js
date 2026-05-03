const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cors({
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));

app.get('/test', async (req, res) => {
  res.status(200).json(200);
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const routes = require('./routes');
app.use('/api/v1', routes);

const PORT = 3020;

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
