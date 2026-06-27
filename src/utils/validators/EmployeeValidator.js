const { body } = require('express-validator');
const { handleValidationErrors } = require('./common.validator');

const createEmployeeValidator = [
  body('name').trim().notEmpty().withMessage('name là bắt buộc'),
  body('email').isEmail().withMessage('email không hợp lệ'),
  body('department').optional().isString(),
  body('role').optional().isString(),

  handleValidationErrors,
];

const updateEmployeeValidator = [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('department').optional().isString(),
  body('role').optional().isString(),

  handleValidationErrors,
];

module.exports = { createEmployeeValidator, updateEmployeeValidator };
