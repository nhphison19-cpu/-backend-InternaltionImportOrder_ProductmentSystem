const { body } = require('express-validator');
const { handleValidationErrors } = require('./common.validator');

// Lưu ý: KHÔNG nhận lineTotal từ client. Số tiền của từng dòng phải được
// tính lại ở service (quantity * unitPrice * (1 - discount%) * (1 + taxRate%))
// để tránh client gửi sai/giả mạo số tiền.
const createOrderItemValidator = [
  body('importOrderId').notEmpty().withMessage('importOrderId là bắt buộc'),
  body('productId').notEmpty().withMessage('productId là bắt buộc'),

  body('quantity')
    .isFloat({ gt: 0 })
    .withMessage('quantity phải lớn hơn 0'),

  body('unitPrice').isFloat({ min: 0 }).withMessage('unitPrice phải >= 0'),

  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('discount phải trong khoảng 0-100'),

  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('taxRate phải trong khoảng 0-100'),

  handleValidationErrors,
];

const updateOrderItemValidator = [
  body('productId').optional().notEmpty(),
  body('quantity').optional().isFloat({ gt: 0 }),
  body('unitPrice').optional().isFloat({ min: 0 }),
  body('discount').optional().isFloat({ min: 0, max: 100 }),
  body('taxRate').optional().isFloat({ min: 0, max: 100 }),
  body('receivedQty')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('receivedQty phải >= 0'),

  handleValidationErrors,
];

module.exports = { createOrderItemValidator, updateOrderItemValidator };
