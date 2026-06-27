const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, validateQuery, validateParams } = require('../middlewares/validate');
const {
  createDeclarationSchema,
  updateDeclarationSchema,
  paramsSchema,
  orderParamsSchema,
  querySchema,
} = require('../middlewares/validation/customsDeclarationSchemas');
const CustomsDeclarationController = require('../controllers/CustomsDeclarationController');

router.use(authenticate);

router.get('/getall', validateQuery(querySchema), CustomsDeclarationController.getAll);

router.get('/getdetail/:id', validateParams(paramsSchema), CustomsDeclarationController.getDetail);

router.get('/order/:orderId', validateParams(orderParamsSchema), CustomsDeclarationController.getByOrder);

router.post('/order/:orderId', authorize('STAFF', 'ADMIN'), validateParams(orderParamsSchema), validate(createDeclarationSchema), CustomsDeclarationController.createDeclaration);

router.put('/update/:id', authorize('STAFF', 'ADMIN'), validateParams(paramsSchema), validate(updateDeclarationSchema), CustomsDeclarationController.updateDeclaration);

module.exports = router;
