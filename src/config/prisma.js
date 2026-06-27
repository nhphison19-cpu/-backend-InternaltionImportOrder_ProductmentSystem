const { PrismaClient } = require('@prisma/client');

// Khởi tạo PrismaClient với một cấu hình tối thiểu để tránh lỗi validation
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Giúp debug dễ hơn
});

module.exports = prisma;