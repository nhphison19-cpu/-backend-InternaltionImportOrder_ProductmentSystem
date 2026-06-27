const { body } = require('express-validator');
const { handleValidationErrors } = require('./common.validator');

const createWarehouseValidator = [
  body('code').trim().notEmpty().withMessage('code là bắt buộc'),
  body('name').trim().notEmpty().withMessage('name là bắt buộc'),
  body('address').trim().notEmpty().withMessage('address là bắt buộc'),
  body('country').trim().notEmpty().withMessage('country là bắt buộc'),
  body('isActive').optional().isBoolean(),

  handleValidationErrors,
];

const updateWarehouseValidator = [
  body('code').optional().trim().notEmpty(),
  body('name').optional().trim().notEmpty(),
  body('address').optional().trim().notEmpty(),
  body('country').optional().trim().notEmpty(),
  body('isActive').optional().isBoolean(),

  handleValidationErrors,
];

module.exports = { createWarehouseValidator, updateWarehouseValidator };
