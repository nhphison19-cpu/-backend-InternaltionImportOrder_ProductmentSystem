
const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')

class InventoryService {
    static async adjustStock(tx , { warehouseId , productId , quantityDelta }) {
        const existing = await tx.inventory.findUnique({
            where : { warehouseId_productId : { warehouseId , productId } }
        })

        if(!existing) {
            if(quantityDelta < 0) {
                throw new AppError('Không đủ tồn kho để trừ' , 400)
            }
            return await tx.inventory.create({
                data : { warehouseId , productId , quantity : quantityDelta }
            })
        }

        const newQuantity = existing.quantity + quantityDelta
        if(newQuantity < 0) {
            throw new AppError('Không đủ tồn kho để trừ' , 400)
        }

        return await tx.inventory.update({
            where : { warehouseId_productId : { warehouseId , productId } } ,
            data : { quantity : newQuantity }
        })
    }
    static async receiveOrder(orderId) {
        return await prisma.$transaction(async (tx) => {
            const order = await tx.importOrder.findUnique({
                where : { id : orderId } ,
                include : { items : true }
            })
            if(!order) {
                throw new AppError('Import order is not found' , 404)
            }

            for(const item of order.items) {
                await InventoryService.adjustStock(tx , {
                    warehouseId : order.warehouseId ,
                    productId : item.productId ,
                    quantityDelta : item.quantity
                })
                await tx.orderItem.update({
                    where : { id : item.id } ,
                    data : { receivedQty : item.quantity }
                })
            }

            return await tx.importOrder.update({
                where : { id : orderId } ,
                data : { status : 'DELIVERED' , actualDelivery : new Date() }
            })
        })
    }
    static async getByWarehouse(warehouseId) {
        return await prisma.inventory.findMany({
            where : { warehouseId } ,
            include : { product : true } ,
            orderBy : { updatedAt : 'desc' }
        })
    }
    static async getByProduct(productId) {
        return await prisma.inventory.findMany({
            where : { productId } ,
            include : { warehouse : true } ,
            orderBy : { updatedAt : 'desc' }
        })
    }
    static async getOne(warehouseId , productId) {
        const inventory = await prisma.inventory.findUnique({
            where : { warehouseId_productId : { warehouseId , productId } } ,
            include : { warehouse : true , product : true }
        })
        if(!inventory) {
            throw new AppError('Inventory record is not found' , 404)
        }
        return inventory
    }
    static async getAll({page = 1 , limit = 10 , warehouseId , productId}) {
        const p = parseInt(page)
        const l = parseInt(limit)
        const skip = (p-1)*l
        const where = {
            ...(warehouseId ? { warehouseId } : {}) ,
            ...(productId ? { productId } : {})
        }
        const [data , total] = await Promise.all([
            prisma.inventory.findMany({
                where ,
                skip ,
                take : l ,
                orderBy : { updatedAt : 'desc' } ,
                include : { warehouse : true , product : true }
            }) ,
            prisma.inventory.count({ where })
        ])
        return { data , total , page : p , limit : l }
    }
}

module.exports = InventoryService
