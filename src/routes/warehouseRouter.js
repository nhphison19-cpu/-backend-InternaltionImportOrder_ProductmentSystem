const express = require('express');
const router = express.Router();
const WarehouseController = require('../controllers/WarehouseController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, validateParams, validateQuery } = require('../middlewares/validate');
const { warehouseSchema, querySchema, paramsSchema } = require('../middlewares/validation/warehouseSchemas');

router.use(authenticate);

router.get('/getall', validateQuery(querySchema), WarehouseController.getAll);

router.get('/getdetail/:id', validateParams(paramsSchema), WarehouseController.getDetails);

router.post('/create', 
    authorize('ADMIN'), 
    validate(warehouseSchema), 
    WarehouseController.createWarehouse
);

router.put('/update/:id', 
    authorize('ADMIN'), 
    validateParams(paramsSchema), 
    validate(warehouseSchema), 
    WarehouseController.updateWarehouse
);

router.delete('/deleteSort/:id/', 
    authorize('ADMIN'), 
    validateParams(paramsSchema), 
    WarehouseController.softDelete
);

router.patch('/restore/:id', 
    authorize('ADMIN'), 
    validateParams(paramsSchema), 
    WarehouseController.restore
);

router.delete('/delete/:id', 
    authorize('ADMIN'), 
    validateParams(paramsSchema), 
    WarehouseController.deleteWare
);

module.exports = router;