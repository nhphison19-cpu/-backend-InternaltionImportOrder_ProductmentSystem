-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('ADMIN', 'APPROVER', 'STAFF');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CONFIRMED', 'IN_TRANSIT', 'CUSTOMS_CLEARANCE', 'DELIVERED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('LC', 'TT', 'DP', 'DA', 'CAD', 'OA');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ShipmentMode" AS ENUM ('SEA', 'AIR', 'RAIL', 'ROAD', 'MULTIMODAL');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'BOOKED', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'DELAYED');

-- CreateEnum
CREATE TYPE "Incoterm" AS ENUM ('EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('COMMERCIAL_INVOICE', 'PACKING_LIST', 'BILL_OF_LADING', 'AIRWAY_BILL', 'CERTIFICATE_OF_ORIGIN', 'CUSTOMS_DECLARATION', 'INSURANCE_CERTIFICATE', 'INSPECTION_CERTIFICATE', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomsStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'CLEARED', 'HOLD', 'REJECTED');

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "address" TEXT,
    "taxId" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "swiftCode" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hsCode" TEXT,
    "unit" TEXT NOT NULL,
    "originCountry" TEXT,
    "weightKg" DOUBLE PRECISION,
    "volumeM3" DOUBLE PRECISION,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT,
    "role" "EmployeeRole" NOT NULL DEFAULT 'STAFF',

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "incoterm" "Incoterm" NOT NULL,
    "currency" TEXT NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "originPort" TEXT,
    "destinationPort" TEXT,
    "shipmentMode" "ShipmentMode",
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insuranceCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod",
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lineTotal" DOUBLE PRECISION NOT NULL,
    "receivedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "mode" "ShipmentMode" NOT NULL,
    "containerNumber" TEXT,
    "vesselOrFlight" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "departureDate" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customs_declarations" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "declarationNo" TEXT NOT NULL,
    "declaredValue" DOUBLE PRECISION NOT NULL,
    "dutyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "CustomsStatus" NOT NULL DEFAULT 'PENDING',
    "clearanceDate" TIMESTAMP(3),
    "customsOfficer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customs_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "referenceNo" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_documents" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "issuedDate" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "import_orders_orderNumber_key" ON "import_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "import_orders_supplierId_idx" ON "import_orders"("supplierId");

-- CreateIndex
CREATE INDEX "import_orders_status_idx" ON "import_orders"("status");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "shipments_orderId_idx" ON "shipments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "customs_declarations_declarationNo_key" ON "customs_declarations"("declarationNo");

-- CreateIndex
CREATE INDEX "customs_declarations_orderId_idx" ON "customs_declarations"("orderId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "import_documents_orderId_idx" ON "import_documents"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_employeeId_idx" ON "refresh_tokens"("employeeId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "import_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "import_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customs_declarations" ADD CONSTRAINT "customs_declarations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "import_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "import_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_documents" ADD CONSTRAINT "import_documents_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "import_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
