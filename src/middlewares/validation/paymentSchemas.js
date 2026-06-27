const { z } = require('zod');

const createPaymentSchema = z.object({
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  currency: z.string().length(3, "Mã tiền tệ phải có 3 ký tự (VD: USD)"),
  method: z.enum(['LC', 'TT', 'DP', 'DA', 'CAD', 'OA']),
  referenceNo: z.string().optional().nullable(),
});

const updatePaymentSchema = createPaymentSchema.partial();

const markPaidSchema = z.object({
  paidAt: z.coerce.date().optional(),
});

const paramsSchema = z.object({
  id: z.string().cuid("Payment ID không hợp lệ"),
});

const orderParamsSchema = z.object({
  orderId: z.string().cuid("Order ID không hợp lệ"),
});

const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  status: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE']).optional(),
});

module.exports = {
  createPaymentSchema,
  updatePaymentSchema,
  markPaidSchema,
  paramsSchema,
  orderParamsSchema,
  querySchema,
};
