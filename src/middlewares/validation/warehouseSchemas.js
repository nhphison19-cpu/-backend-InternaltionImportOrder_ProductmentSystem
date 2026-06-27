const { z } = require('zod');

// Schema chính cho body (Create/Update)
const warehouseSchema = z.object({
  code: z.string().min(3, "Mã kho phải có ít nhất 3 ký tự").max(10),
  name: z.string().min(3, "Tên kho phải có ít nhất 3 ký tự"),
  address: z.string().min(5, "Địa chỉ phải có ít nhất 5 ký tự"),
  country: z.string().min(2, "Quốc gia không hợp lệ"),
  isActive: z.boolean().optional().default(true),
});

const updateWarehouseSchema = warehouseSchema.partial();

const paramsSchema = z.object({
  id: z.string().cuid("ID không hợp lệ")
});

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1').optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10').optional(),
  search: z.string().optional().default(''),
  isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true')
});

module.exports = { 
  warehouseSchema, 
  updateWarehouseSchema, 
  paramsSchema, 
  querySchema 
};