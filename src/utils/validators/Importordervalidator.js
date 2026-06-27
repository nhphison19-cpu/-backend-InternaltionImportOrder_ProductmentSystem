const { body } = require('express-validator');
const { handleValidationErrors, isAfterField } = require('./common.validator');
const { INCOTERM, SHIPMENT_MODE, ORDER_STATUS } = require('./enums');

const createImportOrderValidator = [
  body('orderNumber').trim().notEmpty().withMessage('orderNumber là bắt buộc'),
  body('supplierId').notEmpty().withMessage('supplierId là bắt buộc'),
  body('warehouseId').notEmpty().withMessage('warehouseId là bắt buộc'),

  body('incoterm')
    .isIn(INCOTERM)
    .withMessage(`incoterm phải là một trong: ${INCOTERM.join(', ')}`),

  body('currency')
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('currency phải theo chuẩn ISO 4217, ví dụ: USD, EUR, JPY'),

  body('exchangeRate').optional().isFloat({ min: 0 }),
  body('originPort').optional().isString(),
  body('destinationPort').optional().isString(),

  body('shipmentMode')
    .optional()
    .isIn(SHIPMENT_MODE)
    .withMessage(`shipmentMode phải là một trong: ${SHIPMENT_MODE.join(', ')}`),

  body('orderDate').isISO8601().withMessage('orderDate phải là ngày hợp lệ'),

  body('expectedDelivery')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('expectedDelivery phải là ngày hợp lệ')
    .custom(isAfterField('expectedDelivery', 'orderDate')),

  body('createdById').notEmpty().withMessage('createdById là bắt buộc'),
  body('notes').optional().isString(),

  handleValidationErrors,
];

const updateImportOrderValidator = [
  body('orderNumber').optional().trim().notEmpty(),
  body('supplierId').optional().notEmpty(),
  body('warehouseId').optional().notEmpty(),
  body('incoterm').optional().isIn(INCOTERM),
  body('currency').optional().trim().isLength({ min: 3, max: 3 }),
  body('exchangeRate').optional().isFloat({ min: 0 }),
  body('originPort').optional().isString(),
  body('destinationPort').optional().isString(),
  body('shipmentMode').optional().isIn(SHIPMENT_MODE),
  body('orderDate').optional().isISO8601(),

  body('expectedDelivery')
    .optional({ checkFalsy: true })
    .isISO8601()
    .custom(isAfterField('expectedDelivery', 'orderDate')),

  body('notes').optional().isString(),

  body('status')
    .optional()
    .isIn(ORDER_STATUS)
    .withMessage(`status phải là một trong: ${ORDER_STATUS.join(', ')}`),

  // approvedById chỉ bắt buộc khi client đang set status = APPROVED trong
  // chính request này. Không validate dựa trên dữ liệu cũ trong DB ở đây —
  // việc đó nên xử lý thêm ở service/controller nếu cần.
  body('approvedById')
    .if(body('status').equals('APPROVED'))
    .notEmpty()
    .withMessage('approvedById là bắt buộc khi phê duyệt đơn hàng'),

  handleValidationErrors,
];

module.exports = { createImportOrderValidator, updateImportOrderValidator };