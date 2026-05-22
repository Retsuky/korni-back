/**
 * @module server
 */

const dotenv = require('dotenv');

dotenv.config();

const createApp = require('./createApp');

const app = createApp();
const PORT = 3020;

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
