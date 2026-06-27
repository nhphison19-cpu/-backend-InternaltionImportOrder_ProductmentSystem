const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { validateQuery, validateParams } = require('../middlewares/validate');
const {
  warehouseParamsSchema,
  productParamsSchema,
  oneParamsSchema,
  querySchema,
} = require('../middlewares/validation/inventorySchemas');
const InventoryController = require('../controllers/InventoryController');

router.use(authenticate);

router.get('/getall', validateQuery(querySchema), InventoryController.getAll);

router.get('/warehouse/:warehouseId', validateParams(warehouseParamsSchema), InventoryController.getByWarehouse);

router.get('/product/:productId', validateParams(productParamsSchema), InventoryController.getByProduct);

router.get('/warehouse/:warehouseId/product/:productId', validateParams(oneParamsSchema), InventoryController.getOne);

module.exports = router;
