const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet')
const morgan = require('morgan');
require('dotenv').config();
const routes = require('./src/routes/index');
const { errorHandler, notFoundHandler } = require('./src/middlewares/errorHandler');

const { swaggerUi, swaggerDocs } = require('./src/config/swaggerConfig'); 

const app = express();

app.use(helmet())
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api', routes);

app.get('/', (req, res) => res.send('System is running!'));

app.use(notFoundHandler);
app.use(errorHandler);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});