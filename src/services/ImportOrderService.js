const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')
const InventoryService = require('./InventoryService')
const NotifcationService = require('./NotifcationService')
const { getOrSetCache, deleteCache, deleteCacheByPattern } = require('../utils/helpers/cacheHelper')

// Gửi notification không được phép làm fail nghiệp vụ chính (tạo/duyệt đơn...)
const notifySafely = async (payload) => {
    try {
        await NotifcationService.createNotification(payload)
    } catch (err) {
        console.error('[ImportOrderService] notify failed:', err.message)
    }
}

const TTL = 120
const orderKey = (id) => `importOrder:${id}`

const invalidateOrderCache = async (id) => {
    await deleteCache(orderKey(id))
    await deleteCacheByPattern('importOrder:list:*')
}

class ImportOrderService {
    static async createIO(data , employeeId) {
        return prisma.$transaction(async (tx) =>{
            const subTotal = data.items.reduce((sum , item) => sum + (item.quantity * item.unitPrice) , 0)
            const totalAmount = subTotal + (data.shippingCost || 0) + (data.insuranceCost || 0)

            const newOrder = await tx.importOrder.create({
                data: {
                    orderNumber: data.orderNumber,
                    supplierId: data.supplierId,
                    warehouseId: data.warehouseId,
                    incoterm: data.incoterm,
                    currency: data.currency,
                    exchangeRate: data.exchangeRate,
                    shipmentMode: data.shipmentMode,
                    shippingCost: data.shippingCost || 0,
                    insuranceCost: data.insuranceCost || 0,
                    paymentMethod: data.paymentMethod,
                    notes: data.notes,
                    subTotal: subTotal,
                    totalAmount: totalAmount,
                    createdById: employeeId,
                    items: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            taxRate: item.taxRate || 0,
                            lineTotal: item.quantity * item.unitPrice
                        }))
                    }
                },
                include: { items: true }
            });
            return newOrder
        }).then(async (newOrder) => {
            await deleteCacheByPattern('importOrder:list:*')
            await notifySafely({
                employeeId: employeeId,
                title: 'Đơn nhập hàng mới đã được tạo',
                message: `Đơn hàng ${newOrder.orderNumber} đã được tạo và đang chờ duyệt`,
                type: 'ORDER_CREATED',
                referenceId: newOrder.id,
                referenceType: 'IMPORT_ORDER',
                url: `/orders/${newOrder.id}`,
            })
            return newOrder
        })
    }
    static async updateIO(id , data) {
        const order = await prisma.importOrder.findUnique({ where : { id } })
        if(!order) {
            throw new AppError('Import order is not found' , 404)
        }
        if(order.status !== 'DRAFT') {
            throw new AppError('Chỉ có thể sửa đơn hàng ở trạng thái DRAFT' , 400)
        }
        const updated = await prisma.importOrder.update({
            where : { id } ,
            data : {
                supplierId: data.supplierId,
                warehouseId: data.warehouseId,
                incoterm: data.incoterm,
                currency: data.currency,
                exchangeRate: data.exchangeRate,
                shipmentMode: data.shipmentMode,
                shippingCost: data.shippingCost,
                insuranceCost: data.insuranceCost,
                paymentMethod: data.paymentMethod,
                notes: data.notes,
            }
        })
        await invalidateOrderCache(id)
        return updated
    }
    static async updateStatus(id , newStatus , employeeId) {
        if(newStatus === 'DELIVERED') {
            const result = await InventoryService.receiveOrder(id)
            await invalidateOrderCache(id)
            return result
        }

        const updated = await prisma.$transaction( async(tx) => {
            const order  = await tx.importOrder.findUnique({
                where :{ id : id }
            })
            if(!order) {
                throw new AppError('Import order is not found' , 404)
            }

            const data = { status : newStatus }
            if(newStatus === 'APPROVED') {
                data.approvedById = employeeId
            }

            return await tx.importOrder.update({
                where : { id : id } ,
                data
            })
        })
        await invalidateOrderCache(id)

        if(newStatus === 'APPROVED' || newStatus === 'REJECTED') {
            await notifySafely({
                employeeId: updated.createdById,
                title: newStatus === 'APPROVED' ? 'Đơn hàng đã được duyệt' : 'Đơn hàng đã bị từ chối',
                message: `Đơn hàng ${updated.orderNumber} đã ${newStatus === 'APPROVED' ? 'được duyệt' : 'bị từ chối'}`,
                type: newStatus === 'APPROVED' ? 'ORDER_APPROVED' : 'ORDER_REJECTED',
                priority: 'HIGH',
                referenceId: updated.id,
                referenceType: 'IMPORT_ORDER',
                url: `/orders/${updated.id}`,
            })
        }

        return updated
    }
    static async recalculateTotals(orderId) {
        const order = await prisma.importOrder.findUnique({
            where: { id: orderId },
            include: { items: true }
        });
        if(!order) {
            throw new AppError('Import order is not found' , 404)
        }

        const subTotal = order.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
        const totalAmount = subTotal + (order.taxAmount || 0) + (order.shippingCost || 0) + (order.insuranceCost || 0);

        const updated = await prisma.importOrder.update({
            where: { id: orderId },
            data: { subTotal, totalAmount }
        });
        await invalidateOrderCache(orderId)
        return updated;
    }
    static async getAll({page = 1 , limit = 10 , search = '' , status , supplierId}) {
        const p = parseInt(page)
        const l = parseInt(limit)
        return getOrSetCache(`importOrder:list:${p}:${l}:${search}:${status || ''}:${supplierId || ''}`, async () => {
            const skip = (p-1)*l
            const where = {
                ...(status ? { status } : {}) ,
                ...(supplierId ? { supplierId } : {}) ,
                ...(search ? {
                    OR: [
                        { orderNumber: { contains: search, mode: 'insensitive' } },
                        { supplier: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                }: {})
            }
            const [data  , total] = await Promise.all([
                prisma.importOrder.findMany({
                    where ,
                    skip ,
                    take : l ,
                    orderBy : { createdAt : 'desc'} ,
                    include : { supplier : true , warehouse : true , items : true }
                }) ,
                prisma.importOrder.count({where})
            ])
            return {data , total , page : p , limit : l}
        }, TTL)
    }
    static async getById(id) {
        return getOrSetCache(orderKey(id), async () => {
            const order = await prisma.importOrder.findUnique({
                where : {id  : id} ,
                include  : {
                    supplier : true ,
                    warehouse : true ,
                    items : { include : { product : true } } ,
                    createdBy : true ,
                    approvedBy : true ,
                    shipments : true ,
                    payments : true ,
                    documents : true ,
                    customsDeclarations : true
                }
            })
            if(!order) {
                throw new AppError('Import order is not found' , 404)
            }
            return order
        }, TTL)
    }
}

module.exports = ImportOrderService


module.exports.invalidateOrderCache = invalidateOrderCache
