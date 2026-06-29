const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Import Order Management API',
            version: '1.0.0',
        },
    },
    // Đảm bảo đường dẫn này trỏ đúng tới file YAML bạn vừa tạo
    apis: ['./src/docs/api.yaml'], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
module.exports = { swaggerUi: require('swagger-ui-express'), swaggerDocs };