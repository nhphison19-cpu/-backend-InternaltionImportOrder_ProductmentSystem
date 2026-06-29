
const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')
const NotifcationService = require('./NotifcationService')
const { getOrSetCache, deleteCacheByPattern } = require('../utils/helpers/cacheHelper')

const LOW_STOCK_THRESHOLD = 10

const notifyLowStockSafely = async (tx, { warehouseId, productId, quantity }) => {
    try {
        if (quantity > LOW_STOCK_THRESHOLD) return
        const [product, admins] = await Promise.all([
            tx.product.findUnique({ where: { id: productId } }),
            tx.employee.findMany({ where: { role: { in: ['ADMIN', 'MANAGER'] } }, select: { id: true } }),
        ])
        if (!admins.length) return
        await NotifcationService.createNotificationForMany(
            admins.map((a) => a.id),
            {
                title: 'Cảnh báo tồn kho thấp',
                message: `Sản phẩm ${product?.name || productId} chỉ còn ${quantity} ${product?.unit || ''} trong kho`,
                type: 'INVENTORY_LOW',
                priority: 'HIGH',
                referenceId: productId,
                referenceType: 'PRODUCT',
                url: `/inventory/${warehouseId}/${productId}`,
            }
        )
    } catch (err) {
        console.error('[InventoryService] low-stock notify failed:', err.message)
    }
}

const TTL = 120
const byWarehouseKey = (warehouseId) => `inventory:warehouse:${warehouseId}`
const byProductKey = (productId) => `inventory:product:${productId}`
const oneKey = (warehouseId, productId) => `inventory:${warehouseId}:${productId}`

const invalidateInventoryCache = async (warehouseId, productId) => {
    await deleteCacheByPattern(`inventory:warehouse:${warehouseId}`)
    await deleteCacheByPattern(`inventory:product:${productId}`)
    await deleteCacheByPattern(`inventory:${warehouseId}:${productId}`)
    await deleteCacheByPattern('inventory:list:*')
}

class InventoryService {
    static async adjustStock(tx , { warehouseId , productId , quantityDelta }) {
        const existing = await tx.inventory.findUnique({
            where : { warehouseId_productId : { warehouseId , productId } }
        })

        if(!existing) {
            if(quantityDelta < 0) {
                throw new AppError('Không đủ tồn kho để trừ' , 400)
            }
            const created = await tx.inventory.create({
                data : { warehouseId , productId , quantity : quantityDelta }
            })
            await invalidateInventoryCache(warehouseId, productId)
            return created
        }

        const newQuantity = existing.quantity + quantityDelta
        if(newQuantity < 0) {
            throw new AppError('Không đủ tồn kho để trừ' , 400)
        }

        const updated = await tx.inventory.update({
            where : { warehouseId_productId : { warehouseId , productId } } ,
            data : { quantity : newQuantity }
        })
        await invalidateInventoryCache(warehouseId, productId)
        await notifyLowStockSafely(tx, { warehouseId, productId, quantity: newQuantity })
        return updated
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
        return getOrSetCache(byWarehouseKey(warehouseId), async () => {
            return await prisma.inventory.findMany({
                where : { warehouseId } ,
                include : { product : true } ,
                orderBy : { updatedAt : 'desc' }
            })
        }, TTL)
    }
    static async getByProduct(productId) {
        return getOrSetCache(byProductKey(productId), async () => {
            return await prisma.inventory.findMany({
                where : { productId } ,
                include : { warehouse : true } ,
                orderBy : { updatedAt : 'desc' }
            })
        }, TTL)
    }
    static async getOne(warehouseId , productId) {
        return getOrSetCache(oneKey(warehouseId, productId), async () => {
            const inventory = await prisma.inventory.findUnique({
                where : { warehouseId_productId : { warehouseId , productId } } ,
                include : { warehouse : true , product : true }
            })
            if(!inventory) {
                throw new AppError('Inventory record is not found' , 404)
            }
            return inventory
        }, TTL)
    }
    static async getAll({page = 1 , limit = 10 , warehouseId , productId}) {
        const p = parseInt(page)
        const l = parseInt(limit)
        return getOrSetCache(`inventory:list:${p}:${l}:${warehouseId || ''}:${productId || ''}`, async () => {
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
        }, TTL)
    }
}

module.exports = InventoryService
