const { body } = require('express-validator');
const { handleValidationErrors } = require('./common.validator');
const { DOCUMENT_TYPE } = require('./enums');

const createImportDocumentValidator = [
  body('importOrderId').notEmpty().withMessage('importOrderId là bắt buộc'),

  body('type')
    .isIn(DOCUMENT_TYPE)
    .withMessage(`type phải là một trong: ${DOCUMENT_TYPE.join(', ')}`),

  body('fileUrl').isURL().withMessage('fileUrl phải là URL hợp lệ'),

  body('issuedDate').optional({ checkFalsy: true }).isISO8601(),

  handleValidationErrors,
];

const updateImportDocumentValidator = [
  body('type').optional().isIn(DOCUMENT_TYPE),
  body('fileUrl').optional().isURL(),
  body('issuedDate').optional({ checkFalsy: true }).isISO8601(),

  handleValidationErrors,
];

module.exports = { createImportDocumentValidator, updateImportDocumentValidator };
