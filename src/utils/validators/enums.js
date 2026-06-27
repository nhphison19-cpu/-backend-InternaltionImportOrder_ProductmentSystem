// Các giá trị enum này PHẢI khớp 1-1 với enum khai báo trong schema.prisma.
// Đặt tập trung ở đây để không phải gõ lại chuỗi enum rải rác trong từng validator.

const ORDER_STATUS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'CONFIRMED',
  'IN_TRANSIT',
  'CUSTOMS_CLEARANCE',
  'DELIVERED',
  'CANCELLED',
  'REJECTED',
];

const PAYMENT_METHOD = ['LC', 'TT', 'DP', 'DA', 'CAD', 'OA'];

const PAYMENT_STATUS = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'];

const SHIPMENT_MODE = ['SEA', 'AIR', 'RAIL', 'ROAD', 'MULTIMODAL'];

const SHIPMENT_STATUS = [
  'PENDING',
  'BOOKED',
  'DEPARTED',
  'IN_TRANSIT',
  'ARRIVED',
  'DELIVERED',
  'DELAYED',
];

const INCOTERM = [
  'EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP',
];

const DOCUMENT_TYPE = [
  'COMMERCIAL_INVOICE',
  'PACKING_LIST',
  'BILL_OF_LADING',
  'AIRWAY_BILL',
  'CERTIFICATE_OF_ORIGIN',
  'CUSTOMS_DECLARATION',
  'INSURANCE_CERTIFICATE',
  'INSPECTION_CERTIFICATE',
  'CONTRACT',
  'OTHER',
];

const CUSTOMS_STATUS = ['PENDING', 'UNDER_REVIEW', 'CLEARED', 'HOLD', 'REJECTED'];

module.exports = {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  SHIPMENT_MODE,
  SHIPMENT_STATUS,
  INCOTERM,
  DOCUMENT_TYPE,
  CUSTOMS_STATUS,
};
