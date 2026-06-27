// server.js
const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const routes = require('./src/routes/index');
const { errorHandler, notFoundHandler } = require('./src/middlewares/errorHandler');
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/api', routes);

// Test route
app.get('/', (req, res) => res.send('System is running!'));

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
