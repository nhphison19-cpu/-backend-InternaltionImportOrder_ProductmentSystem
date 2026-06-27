const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, validateQuery, validateParams } = require('../middlewares/validate');
const { supplierSchema, querySchema, paramsSchema } = require('../middlewares/validation/supplierSchemas');
const SupplierController = require('../controllers/SupplierController');

router.use(authenticate);

router.get('/getall', validateQuery(querySchema), SupplierController.getAll);

router.get('/getdetail/:id', validateParams(paramsSchema), SupplierController.getDetail);

router.post('/create', authorize('ADMIN'), validate(supplierSchema), SupplierController.createSupplier);

router.put('/update/:id', authorize('ADMIN'), validateParams(paramsSchema), validate(supplierSchema), SupplierController.updateSupplier);

router.delete('/delete/:id', authorize('ADMIN'), validateParams(paramsSchema), SupplierController.deleteSupplier);

router.patch('/trash/:id', authorize('ADMIN'), validateParams(paramsSchema), SupplierController.deleteSort);

router.patch('/restore/:id', authorize('ADMIN'), validateParams(paramsSchema), SupplierController.restore);

module.exports = router;