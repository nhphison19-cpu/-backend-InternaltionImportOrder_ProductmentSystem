const { z } = require('zod');

// Schema cho từng sản phẩm trong đơn hàng
const orderItemSchema = z.object({
  productId: z.string().cuid("Product ID không hợp lệ"),
  quantity: z.number().positive("Số lượng phải lớn hơn 0"),
  unitPrice: z.number().nonnegative("Đơn giá không được âm"),
  taxRate: z.number().nonnegative().default(0),
});

// Schema cho tạo mới đơn hàng (POST)
const createOrderSchema = z.object({
  orderNumber: z.string().min(5, "Số đơn hàng quá ngắn"),
  supplierId: z.string().cuid("Supplier ID không hợp lệ"),
  warehouseId: z.string().cuid("Warehouse ID không hợp lệ"),
  incoterm: z.enum(['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']),
  currency: z.string().length(3, "Mã tiền tệ phải có 3 ký tự (VD: USD)"),
  exchangeRate: z.number().positive().default(1),
  shipmentMode: z.enum(['SEA', 'AIR', 'RAIL', 'ROAD', 'MULTIMODAL']).optional(),
  shippingCost: z.number().nonnegative().default(0),
  insuranceCost: z.number().nonnegative().default(0),
  paymentMethod: z.enum(['LC', 'TT', 'DP', 'DA', 'CAD', 'OA']).optional(),
  notes: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1, "Đơn hàng phải có ít nhất 1 sản phẩm")
});

// Schema cho cập nhật (PUT) - Tương tự như tạo nhưng các field là optional, không cho sửa items ở đây
const updateOrderSchema = createOrderSchema.omit({ orderNumber: true, items: true }).partial();

// Schema cho đổi trạng thái (PATCH)
const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CONFIRMED', 'IN_TRANSIT', 'CUSTOMS_CLEARANCE', 'DELIVERED', 'CANCELLED', 'REJECTED'])
});

// Schema cho params (Route :id)
const paramsSchema = z.object({
  id: z.string().cuid("Order ID không hợp lệ"),
});

// Schema cho query (Danh sách đơn hàng)
const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional().default(''),
  status: z.string().optional(),
  supplierId: z.string().cuid().optional(),
});

module.exports = {
  createOrderSchema,
  updateOrderSchema,
  updateStatusSchema,
  paramsSchema,
  querySchema
};
