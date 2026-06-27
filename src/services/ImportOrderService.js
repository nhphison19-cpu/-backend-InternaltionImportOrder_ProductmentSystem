const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')
const InventoryService = require('./InventoryService')

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
        return await prisma.importOrder.update({
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
    }
    static async updateStatus(id , newStatus , employeeId) {
        if(newStatus === 'DELIVERED') {
            return await InventoryService.receiveOrder(id)
        }

        return await prisma.$transaction( async(tx) => {
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

        return await prisma.importOrder.update({
            where: { id: orderId },
            data: { subTotal, totalAmount }
        });
    }
    static async getAll({page = 1 , limit = 10 , search = '' , status , supplierId}) {
        const p = parseInt(page)
        const l = parseInt(limit)
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
    }
    static async getById(id) {
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
    }
}

module.exports = ImportOrderService
