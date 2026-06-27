const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, validateQuery, validateParams } = require('../middlewares/validate');
const {
  createShipmentSchema,
  updateShipmentSchema,
  paramsSchema,
  orderParamsSchema,
  querySchema,
} = require('../middlewares/validation/shipmentSchemas');
const ShipmentController = require('../controllers/ShipmentController');

router.use(authenticate);

router.get('/getall', validateQuery(querySchema), ShipmentController.getAll);

router.get('/getdetail/:id', validateParams(paramsSchema), ShipmentController.getDetail);

router.get('/order/:orderId', validateParams(orderParamsSchema), ShipmentController.getByOrder);

router.post('/order/:orderId', authorize('STAFF', 'ADMIN'), validateParams(orderParamsSchema), validate(createShipmentSchema), ShipmentController.createShipment);

router.put('/update/:id', authorize('STAFF', 'ADMIN'), validateParams(paramsSchema), validate(updateShipmentSchema), ShipmentController.updateShipment);

router.delete('/delete/:id', authorize('ADMIN'), validateParams(paramsSchema), ShipmentController.deleteShipment);

module.exports = router;
