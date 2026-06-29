FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

EXPOSE 5000

# Lệnh khởi chạy ứng dụng
CMD ["node", "server.js"]