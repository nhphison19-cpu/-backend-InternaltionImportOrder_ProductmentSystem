const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, validateParams } = require('../middlewares/validate');
const {
  addItemSchema,
  updateItemSchema,
  receiveQtySchema,
  paramsSchema,
  orderParamsSchema,
} = require('../middlewares/validation/orderItemSchemas');
const OrderItemController = require('../controllers/OrderItemController');

router.use(authenticate);

router.get('/order/:orderId', validateParams(orderParamsSchema), OrderItemController.getByOrder);

router.post('/order/:orderId', authorize('STAFF', 'ADMIN'), validateParams(orderParamsSchema), validate(addItemSchema), OrderItemController.addItem);

router.put('/:id', authorize('STAFF', 'ADMIN'), validateParams(paramsSchema), validate(updateItemSchema), OrderItemController.updateItem);

router.patch('/:id/receive', authorize('STAFF', 'ADMIN'), validateParams(paramsSchema), validate(receiveQtySchema), OrderItemController.receiveQty);

router.delete('/:id', authorize('STAFF', 'ADMIN'), validateParams(paramsSchema), OrderItemController.removeItem);

module.exports = router;
