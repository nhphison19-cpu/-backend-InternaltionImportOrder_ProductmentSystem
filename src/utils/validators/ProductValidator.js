const { body } = require('express-validator');
const { handleValidationErrors } = require('./common.validator');

const createProductValidator = [
  body('sku').trim().notEmpty().withMessage('sku là bắt buộc'),
  body('name').trim().notEmpty().withMessage('name là bắt buộc'),
  body('description').optional().isString(),

  body('hsCode')
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{6,10}$/)
    .withMessage('hsCode phải gồm 6-10 chữ số'),

  body('unit').trim().notEmpty().withMessage('unit là bắt buộc'),

  body('originCountry')
    .optional({ checkFalsy: true })
    .matches(/^[A-Z]{2}$/)
    .withMessage('originCountry phải là mã ISO 2 ký tự'),

  body('weightKg').optional().isFloat({ min: 0 }),
  body('volumeM3').optional().isFloat({ min: 0 }),

  body('supplierId').notEmpty().withMessage('supplierId là bắt buộc'),

  handleValidationErrors,
];

const updateProductValidator = [
  body('sku').optional().trim().notEmpty(),
  body('name').optional().trim().notEmpty(),
  body('description').optional().isString(),
  body('hsCode').optional({ checkFalsy: true }).matches(/^[0-9]{6,10}$/),
  body('unit').optional().trim().notEmpty(),
  body('originCountry').optional({ checkFalsy: true }).matches(/^[A-Z]{2}$/),
  body('weightKg').optional().isFloat({ min: 0 }),
  body('volumeM3').optional().isFloat({ min: 0 }),
  body('supplierId').optional().notEmpty(),

  handleValidationErrors,
];

module.exports = { createProductValidator, updateProductValidator };
