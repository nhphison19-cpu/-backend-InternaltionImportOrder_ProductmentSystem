const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const employeeRoutes = require('./EmployeeRouter');
const suppliersRoutes = require('./supplierRouter');
const warehouseRoutes = require('./warehouseRouter');
const productRoutes = require('./productRouter');
const importOrderRoutes = require('./importOrderRouter');
const orderItemRoutes = require('./orderItemRouter');
const shipmentRoutes = require('./shipmentRouter');
const paymentRoutes = require('./paymentRouter');
const customsDeclarationRoutes = require('./customsDeclarationRouter');
const importDocumentRoutes = require('./importDocumentRouter');
const inventoryRoutes = require('./inventoryRouter');

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/warehouse', warehouseRoutes);
router.use('/products', productRoutes);
router.use('/import-orders', importOrderRoutes);
router.use('/order-items', orderItemRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/customs-declarations', customsDeclarationRoutes);
router.use('/import-documents', importDocumentRoutes);
router.use('/inventory', inventoryRoutes);

module.exports = router;
