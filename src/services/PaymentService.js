const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')
const NotifcationService = require('./NotifcationService')
const { getOrSetCache, deleteCache, deleteCacheByPattern } = require('../utils/helpers/cacheHelper')

const notifySafely = async (payload) => {
    try {
        await NotifcationService.createNotification(payload)
    } catch (err) {
        console.error('[PaymentService] notify failed:', err.message)
    }
}

const TTL = 300
const detailKey = (id) => `payment:${id}`
const byOrderKey = (orderId) => `payment:order:${orderId}`

class PaymentService {
    static async createPayment(orderId , data) {
        return await prisma.$transaction(async (tx) => {
            const order = await tx.importOrder.findUnique({ where : { id : orderId } })
            if(!order) {
                throw new AppError('Import order is not found' , 404)
            }
            const payment = await tx.payment.create({
                data : {
                    orderId ,
                    amount : data.amount ,
                    currency : data.currency ,
                    method : data.method ,
                    referenceNo : data.referenceNo ,
                }
            })
            await syncOrderPaymentStatus(tx , orderId)
            return payment
        }).then(async (payment) => {
            await deleteCache(byOrderKey(orderId))
            await deleteCacheByPattern('payment:list:*')
            return payment
        })
    }
    static async markPaid(id , paidAt) {
        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({ where : { id } })
            if(!payment) {
                throw new AppError('Payment is not found' , 404)
            }
            const updated = await tx.payment.update({
                where : { id } ,
                data : { status : 'PAID' , paidAt : paidAt || new Date() }
            })
            await syncOrderPaymentStatus(tx , payment.orderId)
            const order = await tx.importOrder.findUnique({ where : { id : payment.orderId } })
            return { updated, order }
        })
        await deleteCache(detailKey(id))
        await deleteCache(byOrderKey(result.updated.orderId))
        await deleteCacheByPattern('payment:list:*')

        if(result.order) {
            await notifySafely({
                employeeId: result.order.createdById,
                title: 'Đã nhận thanh toán',
                message: `Đơn hàng ${result.order.orderNumber} đã nhận thanh toán ${result.updated.amount} ${result.updated.currency}`,
                type: 'PAYMENT_RECEIVED',
                priority: 'MEDIUM',
                referenceId: result.updated.orderId,
                referenceType: 'IMPORT_ORDER',
                url: `/orders/${result.updated.orderId}`,
            })
        }
        return result.updated
    }
    static async updatePayment(id , data) {
        const payment = await prisma.payment.findUnique({ where : { id } })
        if(!payment) {
            throw new AppError('Payment is not found' , 404)
        }
        const updated = await prisma.$transaction(async (tx) => {
            const updated = await tx.payment.update({
                where : { id } ,
                data : {
                    amount : data.amount ,
                    currency : data.currency ,
                    method : data.method ,
                    referenceNo : data.referenceNo ,
                }
            })
            await syncOrderPaymentStatus(tx , payment.orderId)
            return updated
        })
        await deleteCache(detailKey(id))
        await deleteCache(byOrderKey(payment.orderId))
        await deleteCacheByPattern('payment:list:*')
        return updated
    }
    static async getDetail(id) {
        return getOrSetCache(detailKey(id), async () => {
            const payment = await prisma.payment.findUnique({
                where : { id } ,
                include : { order : true }
            })
            if(!payment) {
                throw new AppError('Payment is not found' , 404)
            }
            return payment
        }, TTL)
    }
    static async getByOrder(orderId) {
        return getOrSetCache(byOrderKey(orderId), async () => {
            return await prisma.payment.findMany({
                where : { orderId } ,
                orderBy : { createdAt : 'desc' }
            })
        }, TTL)
    }
    static async getAll({page = 1 , limit = 10 , status}) {
        const p = parseInt(page)
        const l = parseInt(limit)
        return getOrSetCache(`payment:list:${p}:${l}:${status || ''}`, async () => {
            const skip = (p-1)*l
            const where = { ...(status ? { status } : {}) }
            const [data , total] = await Promise.all([
                prisma.payment.findMany({
                    where ,
                    skip ,
                    take : l ,
                    orderBy : { createdAt : 'desc' } ,
                    include : { order : true }
                }) ,
                prisma.payment.count({ where })
            ])
            return { data , total , page : p , limit : l }
        }, TTL)
    }
}

async function syncOrderPaymentStatus(tx , orderId) {
    const order = await tx.importOrder.findUnique({ where : { id : orderId } })
    const payments = await tx.payment.findMany({ where : { orderId } })
    const paid = payments.filter(p => p.status === 'PAID').reduce((acc , p) => acc + p.amount , 0)

    let paymentStatus = 'UNPAID'
    if(paid >= order.totalAmount && order.totalAmount > 0) {
        paymentStatus = 'PAID'
    } else if(paid > 0) {
        paymentStatus = 'PARTIALLY_PAID'
    }

    return await tx.importOrder.update({
        where : { id : orderId } ,
        data : { paymentStatus }
    })
}

module.exports = PaymentService
