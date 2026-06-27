const { body } = require('express-validator');
const { handleValidationErrors, isAfterField } = require('./common.validator');
const { SHIPMENT_MODE, SHIPMENT_STATUS } = require('./enums');

const createShipmentValidator = [
  body('importOrderId').notEmpty().withMessage('importOrderId là bắt buộc'),
  body('trackingNumber').optional().isString(),
  body('carrier').optional().isString(),

  body('mode')
    .isIn(SHIPMENT_MODE)
    .withMessage(`mode phải là một trong: ${SHIPMENT_MODE.join(', ')}`),

  body('containerNumber').optional().isString(),
  body('vesselOrFlight').optional().isString(),

  body('departureDate').optional({ checkFalsy: true }).isISO8601(),

  body('arrivalDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .custom(isAfterField('arrivalDate', 'departureDate'))
    .withMessage('arrivalDate phải sau departureDate'),

  handleValidationErrors,
];

const updateShipmentValidator = [
  body('trackingNumber').optional().isString(),
  body('carrier').optional().isString(),
  body('mode').optional().isIn(SHIPMENT_MODE),
  body('containerNumber').optional().isString(),
  body('vesselOrFlight').optional().isString(),
  body('departureDate').optional({ checkFalsy: true }).isISO8601(),

  body('arrivalDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .custom(isAfterField('arrivalDate', 'departureDate')),

  body('status')
    .optional()
    .isIn(SHIPMENT_STATUS)
    .withMessage(`status phải là một trong: ${SHIPMENT_STATUS.join(', ')}`),

  handleValidationErrors,
];

module.exports = { createShipmentValidator, updateShipmentValidator };
