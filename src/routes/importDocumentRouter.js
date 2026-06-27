const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, validateQuery, validateParams } = require('../middlewares/validate');
const {
  uploadDocumentSchema,
  paramsSchema,
  orderParamsSchema,
  querySchema,
} = require('../middlewares/validation/importDocumentSchemas');
const ImportDocumentController = require('../controllers/ImportDocumentController');

router.use(authenticate);

router.get('/getall', validateQuery(querySchema), ImportDocumentController.getAll);

router.get('/getdetail/:id', validateParams(paramsSchema), ImportDocumentController.getDetail);

router.get('/order/:orderId', validateParams(orderParamsSchema), ImportDocumentController.getByOrder);

router.post('/order/:orderId', authorize('STAFF', 'ADMIN'), validateParams(orderParamsSchema), validate(uploadDocumentSchema), ImportDocumentController.uploadDocument);

router.delete('/delete/:id', authorize('ADMIN'), validateParams(paramsSchema), ImportDocumentController.deleteDocument);

module.exports = router;
