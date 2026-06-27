const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, validateQuery, validateParams } = require('../middlewares/validate');
const {
  createOrderSchema,
  updateOrderSchema,
  updateStatusSchema,
  paramsSchema,
  querySchema
} = require('../middlewares/validation/importOrderSchemas');
const importOrderController = require('../controllers/ImportOrderController');

router.use(authenticate);

router.get('/getall', validateQuery(querySchema), importOrderController.getAll);

router.get('/getbyid/:id', validateParams(paramsSchema), importOrderController.getById);

router.post('/create', authorize('STAFF', 'ADMIN'), validate(createOrderSchema), importOrderController.createIO);

router.put('/update/:id', authorize('STAFF', 'ADMIN'), validateParams(paramsSchema), validate(updateOrderSchema), importOrderController.updateIO);

router.patch('/status/:id', authorize('APPROVER', 'ADMIN'), validateParams(paramsSchema), validate(updateStatusSchema), importOrderController.updateStatus);

router.post('/recalculate/:id', authorize('STAFF', 'ADMIN'), validateParams(paramsSchema), importOrderController.recalculateTotals);

module.exports = router;
