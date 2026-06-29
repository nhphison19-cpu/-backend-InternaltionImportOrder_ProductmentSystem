<div align="center">

# 🌍 International Import Order & Procurement System

### Backend API for International Import Order & Procurement Management

<img src="https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge"/>
<img src="https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge"/>
<img src="https://img.shields.io/badge/License-MIT-red?style=for-the-badge"/>

</div>

---

# 📖 Overview

The **International Import Order & Procurement System** is a backend RESTful API designed to support businesses in managing international purchasing, import orders, suppliers, warehouses, products, and inventory.

The system follows a layered architecture to ensure scalability, maintainability, and clean code practices.

---

# ✨ Features

## Authentication

- Register
- Login
- JWT Authentication
- Role Authorization
- Refresh Token

---

## User Management

- User CRUD
- Role Management
- Profile Management

---

## Supplier Management

- Create Supplier
- Update Supplier
- Delete Supplier
- Supplier Information

---

## Product Management

- Product CRUD
- Product Categories
- Product Images
- Product Status

---

## Procurement

- Purchase Orders
- Procurement Requests
- Order Tracking
- Approval Workflow

---

## Import Orders

- Create Import Order
- Update Import Status
- Manage Shipment
- Import History

---

## Warehouse

- Warehouse CRUD
- Inventory Management
- Stock Movement
- Stock History

---

## Dashboard

- Revenue Statistics
- Inventory Statistics
- Purchase Statistics
- Import Reports

---

# 🏗 System Architecture

```
Client
   │
   ▼
Express API
   │
Controller Layer
   │
Service Layer
   │
Repository / Prisma ORM
   │
PostgreSQL Database
```

---

# 🛠 Tech Stack

| Technology | Description |
|------------|-------------|
| Node.js | Runtime |
| Express.js | REST API Framework |
| PostgreSQL | Database |
| Prisma ORM | Database ORM |
| JWT | Authentication |
| Bcrypt | Password Hashing |
| Multer | File Upload |
| Cloudinary | Image Storage |
| Nodemailer | Email Service |
| Swagger | API Documentation |

---

# 📂 Project Structure

```
src
│
├── config
├── controllers
├── middlewares
├── prisma
├── routes
├── services
├── utils
├── validations
├── constants
└── server.js
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/nhphison19-cpu/-backend-InternaltionImportOrder_ProductmentSystem.git
```

Move to project

```bash
cd -backend-InternaltionImportOrder_ProductmentSystem
```

Install packages

```bash
npm install
```

Create environment file

```env
PORT=5000

DATABASE_URL=

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

EMAIL_USER=

EMAIL_PASS=
```

Generate Prisma

```bash
npx prisma generate
```

Run Migration

```bash
npx prisma migrate dev
```

Run project

```bash
npm run dev
```

---

# 🔑 Environment Variables

| Variable | Description |
|-----------|-------------|
| PORT | Server Port |
| DATABASE_URL | PostgreSQL Connection |
| JWT_ACCESS_SECRET | JWT Secret |
| JWT_REFRESH_SECRET | Refresh Secret |
| CLOUDINARY_* | Cloudinary Config |
| EMAIL_USER | SMTP Email |
| EMAIL_PASS | SMTP Password |

---

# 📚 API Modules

```
Auth
├── Login
├── Register
└── Refresh Token

Users
├── CRUD
└── Profile

Products
├── CRUD
├── Upload Image
└── Category

Suppliers
├── CRUD
└── Search

Orders
├── Procurement
├── Import Orders
└── Tracking

Warehouse
├── Inventory
├── Stock
└── History
```

---

# 🔐 Security

- JWT Authentication
- Password Hashing (bcrypt)
- Protected Routes
- Role-based Authorization
- Input Validation
- Error Handling

---

# 🚀 Future Improvements

- Docker Deployment
- Redis Cache
- RabbitMQ
- Notification Service
- Microservices
- Unit Testing
- CI/CD
- Audit Log
- Multi-language
- File Management

---

# 📷 API Documentation

Swagger

```
http://localhost:5000/api-docs
```

---

# 📈 Database

Example entities

```
User
Role
Supplier
Product
Category
Warehouse
Inventory
PurchaseOrder
ImportOrder
Shipment
Address
Notification
```

---

# 👨‍💻 Author

**Phi Son**

GitHub

https://github.com/nhphison19-cpu

---

# ⭐ Support

If you like this project, please consider giving it a ⭐ on GitHub.

---

# 📄 License

MIT License

```
Copyright (c) 2026

Permission is hereby granted...
```
