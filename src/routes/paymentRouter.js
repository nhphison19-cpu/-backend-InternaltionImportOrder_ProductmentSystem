const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, validateQuery, validateParams } = require('../middlewares/validate');
const {
  createPaymentSchema,
  updatePaymentSchema,
  markPaidSchema,
  paramsSchema,
  orderParamsSchema,
  querySchema,
} = require('../middlewares/validation/paymentSchemas');
const PaymentController = require('../controllers/PaymentController');

router.use(authenticate);

router.get('/getall', validateQuery(querySchema), PaymentController.getAll);

router.get('/getdetail/:id', validateParams(paramsSchema), PaymentController.getDetail);

router.get('/order/:orderId', validateParams(orderParamsSchema), PaymentController.getByOrder);

router.post('/order/:orderId', authorize('STAFF', 'ADMIN'), validateParams(orderParamsSchema), validate(createPaymentSchema), PaymentController.createPayment);

router.put('/update/:id', authorize('STAFF', 'ADMIN'), validateParams(paramsSchema), validate(updatePaymentSchema), PaymentController.updatePayment);

router.patch('/markpaid/:id', authorize('APPROVER', 'ADMIN'), validateParams(paramsSchema), validate(markPaidSchema), PaymentController.markPaid);

module.exports = router;
