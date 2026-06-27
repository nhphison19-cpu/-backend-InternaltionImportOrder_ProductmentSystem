const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')

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
        })
    }
    static async markPaid(id , paidAt) {
        return await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({ where : { id } })
            if(!payment) {
                throw new AppError('Payment is not found' , 404)
            }
            const updated = await tx.payment.update({
                where : { id } ,
                data : { status : 'PAID' , paidAt : paidAt || new Date() }
            })
            await syncOrderPaymentStatus(tx , payment.orderId)
            return updated
        })
    }
    static async updatePayment(id , data) {
        const payment = await prisma.payment.findUnique({ where : { id } })
        if(!payment) {
            throw new AppError('Payment is not found' , 404)
        }
        return await prisma.$transaction(async (tx) => {
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
    }
    static async getDetail(id) {
        const payment = await prisma.payment.findUnique({
            where : { id } ,
            include : { order : true }
        })
        if(!payment) {
            throw new AppError('Payment is not found' , 404)
        }
        return payment
    }
    static async getByOrder(orderId) {
        return await prisma.payment.findMany({
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
