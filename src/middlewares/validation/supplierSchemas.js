const { z } = require('zod');

 const supplierSchema = z.object({
  code: z.string().min(3, "Code quá ngắn").max(10, "Code tối đa 10 ký tự"),
  name: z.string().min(3, "Tên nhà cung cấp quá ngắn"),
  country: z.string().length(2, "Mã quốc gia phải có 2 ký tự"),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email("Email không hợp lệ").optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  swiftCode: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).default(0).optional(),
  isActive: z.boolean().default(true).optional(),
});

const updateSupplierSchema = supplierSchema.partial();

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
  supplierSchema, 
  updateSupplierSchema, 
  paramsSchema, 
  querySchema 
};