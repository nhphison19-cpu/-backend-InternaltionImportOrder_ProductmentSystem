const { z } = require('zod');

const createDeclarationSchema = z.object({
  declarationNo: z.string().min(3, "Declaration No quá ngắn"),
  declaredValue: z.number().nonnegative("Declared value không được âm"),
  dutyAmount: z.number().nonnegative().default(0),
  vatAmount: z.number().nonnegative().default(0),
  customsOfficer: z.string().optional().nullable(),
});

const updateDeclarationSchema = z.object({
  declaredValue: z.number().nonnegative().optional(),
  dutyAmount: z.number().nonnegative().optional(),
  vatAmount: z.number().nonnegative().optional(),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'CLEARED', 'HOLD', 'REJECTED']).optional(),
  clearanceDate: z.coerce.date().optional().nullable(),
  customsOfficer: z.string().optional().nullable(),
});

const paramsSchema = z.object({
  id: z.string().cuid("Declaration ID không hợp lệ"),
});

const orderParamsSchema = z.object({
  orderId: z.string().cuid("Order ID không hợp lệ"),
});

const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional().default(''),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'CLEARED', 'HOLD', 'REJECTED']).optional(),
});

module.exports = {
  createDeclarationSchema,
  updateDeclarationSchema,
  paramsSchema,
  orderParamsSchema,
  querySchema,
};
