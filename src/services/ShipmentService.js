const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')

class ShipmentService {
    static async createShipment(orderId , data) {
        const order = await prisma.importOrder.findUnique({ where : { id : orderId } })
        if(!order) {
            throw new AppError('Import order is not found' , 404)
        }
        return await prisma.shipment.create({
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
    }
    static async updateShipment(id , data) {
        const shipment = await prisma.shipment.findUnique({ where : { id } })
        if(!shipment) {
            throw new AppError('Shipment is not found' , 404)
        }
        return await prisma.shipment.update({
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
    }
    static async getDetail(id) {
        const shipment = await prisma.shipment.findUnique({
            where : { id } ,
            include : { order : true }
        })
        if(!shipment) {
            throw new AppError('Shipment is not found' , 404)
        }
        return shipment
    }
    static async getByOrder(orderId) {
        return await prisma.shipment.findMany({
            where : { orderId } ,
            orderBy : { createdAt : 'desc' }
        })
    }
    static async getAll({page = 1 , limit = 10 , status}) {
        const p = parseInt(page)
        const l = parseInt(limit)
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
    }
    static async deleteShipment(id) {
        const shipment = await prisma.shipment.findUnique({ where : { id } })
        if(!shipment) {
            throw new AppError('Shipment is not found' , 404)
        }
        return await prisma.shipment.delete({ where : { id } })
    }
}

module.exports = ShipmentService
