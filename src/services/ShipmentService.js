const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')
const { getOrSetCache, deleteCache, deleteCacheByPattern } = require('../utils/helpers/cacheHelper')

const TTL = 300
const detailKey = (id) => `shipment:${id}`
const byOrderKey = (orderId) => `shipment:order:${orderId}`

class ShipmentService {
    static async createShipment(orderId , data) {
        const order = await prisma.importOrder.findUnique({ where : { id : orderId } })
        if(!order) {
            throw new AppError('Import order is not found' , 404)
        }
        const created = await prisma.shipment.create({
            data : {
                orderId ,
                trackingNumber : data.trackingNumber ,
                carrier : data.carrier ,
                mode : data.mode ,
                containerNumber : data.containerNumber ,
                vesselOrFlight : data.vesselOrFlight ,
                departureDate : data.departureDate ,
                arrivalDate : data.arrivalDate ,
            }
        })
        await deleteCache(byOrderKey(orderId))
        await deleteCacheByPattern('shipment:list:*')
        return created
    }
    static async updateShipment(id , data) {
        const shipment = await prisma.shipment.findUnique({ where : { id } })
        if(!shipment) {
            throw new AppError('Shipment is not found' , 404)
        }
        const updated = await prisma.shipment.update({
            where : { id } ,
            data : {
                trackingNumber : data.trackingNumber ,
                carrier : data.carrier ,
                mode : data.mode ,
                containerNumber : data.containerNumber ,
                vesselOrFlight : data.vesselOrFlight ,
                status : data.status ,
                departureDate : data.departureDate ,
                arrivalDate : data.arrivalDate ,
            }
        })
        await deleteCache(detailKey(id))
        await deleteCache(byOrderKey(shipment.orderId))
        await deleteCacheByPattern('shipment:list:*')
        return updated
    }
    static async getDetail(id) {
        return getOrSetCache(detailKey(id), async () => {
            const shipment = await prisma.shipment.findUnique({
                where : { id } ,
                include : { order : true }
            })
            if(!shipment) {
                throw new AppError('Shipment is not found' , 404)
            }
            return shipment
        }, TTL)
    }
    static async getByOrder(orderId) {
        return getOrSetCache(byOrderKey(orderId), async () => {
            return await prisma.shipment.findMany({
                where : { orderId } ,
                orderBy : { createdAt : 'desc' }
            })
        }, TTL)
    }
    static async getAll({page = 1 , limit = 10 , status}) {
        const p = parseInt(page)
        const l = parseInt(limit)
        return getOrSetCache(`shipment:list:${p}:${l}:${status || ''}`, async () => {
            const skip = (p-1)*l
            const where = { ...(status ? { status } : {}) }
            const [data , total] = await Promise.all([
                prisma.shipment.findMany({
                    where ,
                    skip ,
                    take : l ,
                    orderBy : { createdAt : 'desc' } ,
                    include : { order : true }
                }) ,
                prisma.shipment.count({ where })
            ])
            return { data , total , page : p , limit : l }
        }, TTL)
    }
    static async deleteShipment(id) {
        const shipment = await prisma.shipment.findUnique({ where : { id } })
        if(!shipment) {
            throw new AppError('Shipment is not found' , 404)
        }
        const deleted = await prisma.shipment.delete({ where : { id } })
        await deleteCache(detailKey(id))
        await deleteCache(byOrderKey(shipment.orderId))
        await deleteCacheByPattern('shipment:list:*')
        return deleted
    }
}

module.exports = ShipmentService
