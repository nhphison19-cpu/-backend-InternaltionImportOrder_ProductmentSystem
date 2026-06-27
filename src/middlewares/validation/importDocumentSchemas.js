const { z } = require('zod');

const uploadDocumentSchema = z.object({
  type: z.enum([
    'COMMERCIAL_INVOICE', 'PACKING_LIST', 'BILL_OF_LADING', 'AIRWAY_BILL',
    'CERTIFICATE_OF_ORIGIN', 'CUSTOMS_DECLARATION', 'INSURANCE_CERTIFICATE',
    'INSPECTION_CERTIFICATE', 'CONTRACT', 'OTHER'
  ]),
  fileUrl: z.string().url("fileUrl không hợp lệ"),
  issuedDate: z.coerce.date().optional().nullable(),
});

const paramsSchema = z.object({
  id: z.string().cuid("Document ID không hợp lệ"),
});

const orderParamsSchema = z.object({
  orderId: z.string().cuid("Order ID không hợp lệ"),
});

const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  type: z.enum([
    'COMMERCIAL_INVOICE', 'PACKING_LIST', 'BILL_OF_LADING', 'AIRWAY_BILL',
    'CERTIFICATE_OF_ORIGIN', 'CUSTOMS_DECLARATION', 'INSURANCE_CERTIFICATE',
    'INSPECTION_CERTIFICATE', 'CONTRACT', 'OTHER'
  ]).optional(),
});

module.exports = {
  uploadDocumentSchema,
  paramsSchema,
  orderParamsSchema,
  querySchema,
};
