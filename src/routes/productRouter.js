const express = require('express');
const router = express.Router();

const ProductController = require('../controllers/ProductController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const {
  validate,
  validateQuery,
  validateParams,
} = require('../middlewares/validate');

const {
  productSchema,
  updateProductSchema,
  paramsSchema,
  querySchema,
} = require('../middlewares/validation/productSchemas');

router.use(authenticate);

router.get(
  '/getall',
  validateQuery(querySchema),
  ProductController.getall
);

router.get(
  '/getdetail/:id',
  validateParams(paramsSchema),
  ProductController.getdetail
);

router.post(
  '/create',
  authorize('ADMIN'),
  validate(productSchema),
  ProductController.createProduct
);

router.put(
  '/update/:id',
  authorize('ADMIN'),
  validateParams(paramsSchema),
  validate(updateProductSchema),
  ProductController.updateProduct
);

router.patch(
  '/trash/:id/',
  authorize('ADMIN'),
  validateParams(paramsSchema),
  ProductController.deleteSort
);

router.patch(  '/restore/:id/',  authorize('ADMIN'),  validateParams(paramsSchema),  ProductController.restore);

router.delete(  '/delete/:id',  authorize('ADMIN'),  validateParams(paramsSchema), ProductController.deleteProduct);

module.exports = router;