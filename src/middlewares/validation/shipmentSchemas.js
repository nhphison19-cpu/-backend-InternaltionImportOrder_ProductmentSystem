const { z } = require('zod');

const createShipmentSchema = z.object({
  trackingNumber: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  mode: z.enum(['SEA', 'AIR', 'RAIL', 'ROAD', 'MULTIMODAL']),
  containerNumber: z.string().optional().nullable(),
  vesselOrFlight: z.string().optional().nullable(),
  departureDate: z.coerce.date().optional().nullable(),
  arrivalDate: z.coerce.date().optional().nullable(),
}).refine(
  (data) => !data.departureDate || !data.arrivalDate || data.arrivalDate >= data.departureDate,
  { message: 'arrivalDate phải sau departureDate', path: ['arrivalDate'] }
);

const updateShipmentSchema = z.object({
  trackingNumber: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  mode: z.enum(['SEA', 'AIR', 'RAIL', 'ROAD', 'MULTIMODAL']).optional(),
  containerNumber: z.string().optional().nullable(),
  vesselOrFlight: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'BOOKED', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'DELAYED']).optional(),
  departureDate: z.coerce.date().optional().nullable(),
  arrivalDate: z.coerce.date().optional().nullable(),
});

const paramsSchema = z.object({
  id: z.string().cuid("Shipment ID không hợp lệ"),
});

const orderParamsSchema = z.object({
  orderId: z.string().cuid("Order ID không hợp lệ"),
});

const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  status: z.enum(['PENDING', 'BOOKED', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'DELAYED']).optional(),
});

module.exports = {
  createShipmentSchema,
  updateShipmentSchema,
  paramsSchema,
  orderParamsSchema,
  querySchema,
};
