const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')

class OrderItemService {
    static async addItem(orderId , data) {
        return await prisma.$transaction(async (tx) => {
            const order = await tx.importOrder.findUnique({ where : { id : orderId } })
            if(!order) {
                throw new AppError('Import order is not found' , 404)
            }
            if(order.status !== 'DRAFT') {
                throw new AppError('Chỉ có thể thêm sản phẩm khi đơn hàng ở trạng thái DRAFT' , 400)
            }

            const lineTotal = data.quantity * data.unitPrice
            const item = await tx.orderItem.create({
                data : {
                    orderId ,
                    productId : data.productId ,
                    quantity : data.quantity ,
                    unitPrice : data.unitPrice ,
                    discount : data.discount || 0 ,
                    taxRate : data.taxRate || 0 ,
                    lineTotal
                }
            })

            await recalc(tx , orderId)
            return item
        })
    }
    static async updateItem(id , data) {
        return await prisma.$transaction(async (tx) => {
            const item = await tx.orderItem.findUnique({ where : { id } , include : { order : true } })
            if(!item) {
                throw new AppError('Order item is not found' , 404)
            }
            if(item.order.status !== 'DRAFT') {
                throw new AppError('Chỉ có thể sửa sản phẩm khi đơn hàng ở trạng thái DRAFT' , 400)
            }

            const quantity = data.quantity ?? item.quantity
            const unitPrice = data.unitPrice ?? item.unitPrice

            const updated = await tx.orderItem.update({
                where : { id } ,
                data : {
                    productId : data.productId ,
                    quantity ,
                    unitPrice ,
                    discount : data.discount ,
                    taxRate : data.taxRate ,
                    lineTotal : quantity * unitPrice
                }
            })

            await recalc(tx , item.orderId)
            return updated
        })
    }
    static async removeItem(id) {
        return await prisma.$transaction(async (tx) => {
            const item = await tx.orderItem.findUnique({ where : { id } , include : { order : true } })
            if(!item) {
                throw new AppError('Order item is not found' , 404)
            }
            if(item.order.status !== 'DRAFT') {
                throw new AppError('Chỉ có thể xoá sản phẩm khi đơn hàng ở trạng thái DRAFT' , 400)
            }

            await tx.orderItem.delete({ where : { id } })
            await recalc(tx , item.orderId)
            return { id }
        })
    }
    static async getByOrder(orderId) {
        return await prisma.orderItem.findMany({
            where : { orderId } ,
            include : { product : true } ,
            orderBy : { id : 'asc' }
        })
    }
    static async receiveQty(id , receivedQty) {
        const item = await prisma.orderItem.findUnique({ where : { id } })
        if(!item) {
            throw new AppError('Order item is not found' , 404)
        }
        if(receivedQty > item.quantity) {
            throw new AppError('Số lượng nhận thực tế không được vượt số lượng đặt' , 400)
        }
        return await prisma.orderItem.update({
            where : { id } ,
            data : { receivedQty }
        })
    }
}

async function recalc(tx , orderId) {
    const items = await tx.orderItem.findMany({ where : { orderId } })
    const order = await tx.importOrder.findUnique({ where : { id : orderId } })
    const subTotal = items.reduce((acc , i) => acc + i.lineTotal , 0)
    const totalAmount = subTotal + (order.taxAmount || 0) + (order.shippingCost || 0) + (order.insuranceCost || 0)
    return await tx.importOrder.update({
        where : { id : orderId } ,
        data : { subTotal , totalAmount }
    })
}

module.exports = OrderItemService
