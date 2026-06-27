const { body } = require('express-validator');
const { handleValidationErrors } = require('./common.validator');
const { CUSTOMS_STATUS } = require('./enums');

const createCustomsDeclarationValidator = [
  body('importOrderId').notEmpty().withMessage('importOrderId là bắt buộc'),
  body('declarationNo').trim().notEmpty().withMessage('declarationNo là bắt buộc'),
  body('declaredValue').isFloat({ min: 0 }).withMessage('declaredValue phải >= 0'),
  body('dutyAmount').optional().isFloat({ min: 0 }),
  body('vatAmount').optional().isFloat({ min: 0 }),
  body('customsOfficer').optional().isString(),

  handleValidationErrors,
];

const updateCustomsDeclarationValidator = [
  body('declarationNo').optional().trim().notEmpty(),
  body('declaredValue').optional().isFloat({ min: 0 }),
  body('dutyAmount').optional().isFloat({ min: 0 }),
  body('vatAmount').optional().isFloat({ min: 0 }),
  body('customsOfficer').optional().isString(),

  body('status')
    .optional()
    .isIn(CUSTOMS_STATUS)
    .withMessage(`status phải là một trong: ${CUSTOMS_STATUS.join(', ')}`),

  handleValidationErrors,
];

module.exports = {
  createCustomsDeclarationValidator,
  updateCustomsDeclarationValidator,
};
