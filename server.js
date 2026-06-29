const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
const routes = require('./src/routes/index');
const { errorHandler, notFoundHandler } = require('./src/middlewares/errorHandler');

// Thêm các thư viện Swagger
const { swaggerUi, swaggerDocs } = require('./src/config/swaggerConfig'); 

const app = express();

// CORS — cho phép frontend gọi tới backend
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true, // cho phép gửi cookie (refreshToken)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

// Tích hợp Swagger route (thường là /api-docs)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api', routes);

app.get('/', (req, res) => res.send('System is running!'));

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});