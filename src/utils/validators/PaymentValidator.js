const { body } = require('express-validator');
const { handleValidationErrors } = require('./common.validator');
const { PAYMENT_METHOD, PAYMENT_STATUS } = require('./enums');

const createPaymentValidator = [
  body('importOrderId').notEmpty().withMessage('importOrderId là bắt buộc'),

  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('amount phải lớn hơn 0'),

  body('currency')
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('currency phải theo chuẩn ISO 4217'),

  body('method')
    .isIn(PAYMENT_METHOD)
    .withMessage(`method phải là một trong: ${PAYMENT_METHOD.join(', ')}`),

  body('referenceNo').optional().isString(),

  handleValidationErrors,
];

const updatePaymentValidator = [
  body('amount').optional().isFloat({ gt: 0 }),
  body('currency').optional().trim().isLength({ min: 3, max: 3 }),
  body('method').optional().isIn(PAYMENT_METHOD),
  body('referenceNo').optional().isString(),
  body('paidAt').optional({ checkFalsy: true }).isISO8601(),

  body('status')
    .optional()
    .isIn(PAYMENT_STATUS)
    .withMessage(`status phải là một trong: ${PAYMENT_STATUS.join(', ')}`),

  handleValidationErrors,
];

module.exports = { createPaymentValidator, updatePaymentValidator };
