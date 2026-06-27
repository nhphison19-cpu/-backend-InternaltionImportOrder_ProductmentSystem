const { z } = require('zod');

const warehouseParamsSchema = z.object({
  warehouseId: z.string().cuid("Warehouse ID không hợp lệ"),
});

const productParamsSchema = z.object({
  productId: z.string().cuid("Product ID không hợp lệ"),
});

const oneParamsSchema = z.object({
  warehouseId: z.string().cuid("Warehouse ID không hợp lệ"),
  productId: z.string().cuid("Product ID không hợp lệ"),
});

const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  warehouseId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
});

module.exports = {
  warehouseParamsSchema,
  productParamsSchema,
  oneParamsSchema,
  querySchema,
};
