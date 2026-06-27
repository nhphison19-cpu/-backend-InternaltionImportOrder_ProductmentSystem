const { z } = require('zod');

const productSchema = z.object({
  sku: z.string().min(3, "SKU phải có ít nhất 3 ký tự").max(20),
  name: z.string().min(2, "Tên sản phẩm phải có ít nhất 2 ký tự"),
  description: z.string().optional().nullable(),
  hsCode: z.string().optional().nullable(),
  unit: z.string().min(1, "Đơn vị tính là bắt buộc"),
  originCountry: z.string().length(2, "Mã quốc gia phải có 2 ký tự").optional().nullable(),
  weightKg: z.number().positive("Trọng lượng phải lớn hơn 0").optional().nullable(),
  volumeM3: z.number().positive("Thể tích phải lớn hơn 0").optional().nullable(),
  supplierId: z.string().cuid("Supplier ID không hợp lệ"),
  isActive: z.boolean().optional().default(true),
});

// Update Schema: Cho phép update từng phần
const updateProductSchema = productSchema.partial();

// ID Schema: Kiểm tra CUID cho params
const paramsSchema = z.object({
  id: z.string().cuid("ID sản phẩm không hợp lệ")
});

// Query Schema: Tìm kiếm và lọc
const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1').optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10').optional(),
  search: z.string().optional(),
  supplierId: z.string().cuid().optional(),
  isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true')
});

module.exports = { 
 productSchema, 
  updateProductSchema, 
  paramsSchema, 
  querySchema  
};