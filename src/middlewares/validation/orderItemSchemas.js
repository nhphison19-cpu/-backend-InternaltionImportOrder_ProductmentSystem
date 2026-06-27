const { z } = require('zod');

const addItemSchema = z.object({
  productId: z.string().cuid("Product ID không hợp lệ"),
  quantity: z.number().positive("Số lượng phải lớn hơn 0"),
  unitPrice: z.number().nonnegative("Đơn giá không được âm"),
  discount: z.number().nonnegative().default(0),
  taxRate: z.number().nonnegative().default(0),
});

const updateItemSchema = addItemSchema.partial();

const receiveQtySchema = z.object({
  receivedQty: z.number().nonnegative("Số lượng nhận không được âm"),
});

const paramsSchema = z.object({
  id: z.string().cuid("Order item ID không hợp lệ"),
});

const orderParamsSchema = z.object({
  orderId: z.string().cuid("Order ID không hợp lệ"),
});

module.exports = {
  addItemSchema,
  updateItemSchema,
  receiveQtySchema,
  paramsSchema,
  orderParamsSchema,
};
