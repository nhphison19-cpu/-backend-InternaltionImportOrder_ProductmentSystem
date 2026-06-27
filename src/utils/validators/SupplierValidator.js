const { body } = require('express-validator');
const { handleValidationErrors } = require('./common.validator');

const createSupplierValidator = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('code là bắt buộc')
    .isLength({ min: 2, max: 20 })
    .withMessage('code phải từ 2-20 ký tự'),

  body('name').trim().notEmpty().withMessage('name là bắt buộc'),

  body('country')
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('country phải là mã ISO 2 ký tự, ví dụ: CN, JP, KR'),

  body('address').optional().isString(),
  body('taxId').optional().isString(),
  body('contactName').optional().isString(),

  body('contactEmail')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('contactEmail không hợp lệ'),

  body('contactPhone')
    .optional({ checkFalsy: true })
    .matches(/^\+?[0-9\s-]{6,20}$/)
    .withMessage('contactPhone không hợp lệ'),

  body('bankAccount').optional().isString(),
  body('bankName').optional().isString(),

  body('swiftCode')
    .optional({ checkFalsy: true })
    .matches(/^[A-Z0-9]{8}([A-Z0-9]{3})?$/)
    .withMessage('swiftCode không đúng định dạng SWIFT/BIC'),

  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('isActive').optional().isBoolean(),

  handleValidationErrors,
];

// Update: cho phép gửi từng phần (PATCH), field nào có mặt vẫn áp rule như create
const updateSupplierValidator = [
  body('code').optional().trim().isLength({ min: 2, max: 20 }),
  body('name').optional().trim().notEmpty(),
  body('country').optional().trim().isLength({ min: 2, max: 2 }),
  body('address').optional().isString(),
  body('taxId').optional().isString(),
  body('contactName').optional().isString(),
  body('contactEmail').optional({ checkFalsy: true }).isEmail(),
  body('contactPhone')
    .optional({ checkFalsy: true })
    .matches(/^\+?[0-9\s-]{6,20}$/),
  body('bankAccount').optional().isString(),
  body('bankName').optional().isString(),
  body('swiftCode')
    .optional({ checkFalsy: true })
    .matches(/^[A-Z0-9]{8}([A-Z0-9]{3})?$/),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('isActive').optional().isBoolean(),

  handleValidationErrors,
];

module.exports = { createSupplierValidator, updateSupplierValidator };
